import { NextRequest, NextResponse } from "next/server";
import axios from "axios";
import * as cheerio from "cheerio";
import { CookieJar } from "tough-cookie";
import { wrapper } from "axios-cookiejar-support";
import fs from "fs";
import path from "path";
import { supabase } from "../../../../lib/supabase";

const SRM_DOMAIN = "https://academia.srmist.edu.in";
const LOGIN_URL = "https://academia.srmist.edu.in/accounts/signin.ac";

const TIMETABLE_PAGES = [
  "My_Time_Table_2026_27",
  "My_Time_Table_2025_26",
  "My_Time_Table_2024_25",
  "My_Time_Table_2023_24",
];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const DEFAULT_HEADERS = {
  "User-Agent": USER_AGENT,
  Origin: SRM_DOMAIN,
  Referer: `${SRM_DOMAIN}/`,
};

// Helper to determine the user role from contributors list
function checkRole(email: string): "Student" | "Contributor" | "Admin" {
  if (email.toLowerCase() === "sv3824@srmist.edu.in") {
    return "Admin";
  }
  try {
    const filePath = path.join(process.cwd(), "data", "contributors.json");
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf-8");
      const contributors = JSON.parse(data);
      const isContributor = contributors.some(
        (c: any) => c.email.toLowerCase() === email.toLowerCase()
      );
      if (isContributor) {
        return "Contributor";
      }
    }
  } catch (error) {
    console.error("Error reading contributors list in login API:", error);
  }
  return "Student";
}

// Extracts student profile from Zoho Creator Timetable HTML exactly like Classivo (profile_service.py)
function extractProfileFromHtml(html: string): Record<string, string> {
  const studentDetails: Record<string, string> = {
    name: "",
    regNo: "Unknown",
    batch: "N/A",
    semester: "N/A",
    department: "N/A",
    section: "N/A",
    mobile: "N/A",
    program: "N/A",
    facultyAdvisor: "N/A",
    academicAdvisor: "N/A"
  };
  
  if (!html) return studentDetails;
  
  const $ = cheerio.load(html);

  const cleanText = (text: string): string => {
    if (!text) return "";
    return text.replace(/\s+/g, " ").trim();
  };

  const getElementByLabel = (labelText: string) => {
    let resultNode: cheerio.Cheerio<any> | null = null;
    $("td").each((_i, elTd) => {
      const td = $(elTd);
      const text = td.text();
      if (text && text.toLowerCase().includes(labelText.toLowerCase())) {
        const nextTd = td.next("td");
        if (nextTd.length > 0) {
          const strong = nextTd.find("strong");
          resultNode = strong.length > 0 ? strong : nextTd;
          return false; // break
        }
      }
    });
    return resultNode;
  };

  // 1. Faculty Advisor
  let el: any = getElementByLabel("Faculty Advisor") || getElementByLabel("Faculty Advisor Name");
  if (!el) {
    $("td").each((_i, elTd) => {
      const td = $(elTd);
      if (td.text().toLowerCase().includes("faculty advisor")) {
        const nextTd = td.next("td");
        if (nextTd.length > 0) {
          const strong = nextTd.find("strong");
          el = strong.length > 0 ? strong : nextTd;
          return false;
        }
      }
    });
  }
  if (el) studentDetails["facultyAdvisor"] = cleanText($(el).text());

  // 2. Academic Advisor
  el = getElementByLabel("Academic Advisor") || getElementByLabel("Academic Advisor Name");
  if (!el) {
    $("td").each((_i, elTd) => {
      const td = $(elTd);
      if (td.text().toLowerCase().includes("academic advisor")) {
        const nextTd = td.next("td");
        if (nextTd.length > 0) {
          const strong = nextTd.find("strong");
          el = strong.length > 0 ? strong : nextTd;
          return false;
        }
      }
    });
  }
  if (el) studentDetails["academicAdvisor"] = cleanText($(el).text());

  // 3. Reg No
  el = getElementByLabel("Registration Number") || getElementByLabel("Reg. No.");
  if (el) studentDetails["regNo"] = cleanText($(el).text());

  // 4. Name
  el = getElementByLabel("Name") || getElementByLabel("Student Name");
  if (el) studentDetails["name"] = cleanText($(el).text());

  // 5. Mobile
  el = getElementByLabel("Mobile");
  if (el) studentDetails["mobile"] = cleanText($(el).text());

  // 6. Program
  el = getElementByLabel("Program");
  if (el) studentDetails["program"] = cleanText($(el).text());

  // 7. Semester
  el = getElementByLabel("Semester");
  if (el) studentDetails["semester"] = cleanText($(el).text());

  // 8. Batch
  el = getElementByLabel("Batch");
  if (el) {
    const rawBatch = cleanText($(el).text());
    studentDetails["batch"] = rawBatch.includes("/") ? rawBatch.split("/").pop()!.trim() : rawBatch;
  }

  // 9. Department and Section
  el = getElementByLabel("Department");
  if (el) {
    const full = cleanText($(el).text());
    studentDetails["department"] = full;
    const font = $(el).find("font");
    if (font.length > 0) {
      const sectionText = cleanText(font.text());
      studentDetails["section"] = sectionText;
      studentDetails["department"] = cleanText(full.replace(sectionText, "").replace(/-+$/, ""));
    }
  }

  // Fallback selector method from SRM-VERSE (timetable page table structure)
  if (!studentDetails["name"] || studentDetails["regNo"] === "Unknown") {
    const infoTable = $('div[style*="line-height:150%"] > table[border="0"][align="left"]');
    if (infoTable.length > 0) {
      infoTable.find("tr").each((_i: number, row: any) => {
        const cells = $(row).find("td");
        if (cells.length === 4) {
          const key1 = $(cells[0]).text().replace(":", "").trim();
          const val1 = $(cells[1]).text().trim();
          const key2 = $(cells[2]).text().replace(":", "").trim();
          const val2 = $(cells[3]).text().trim();
          if (key1 && !studentDetails[key1]) studentDetails[key1] = val1;
          if (key2 && !studentDetails[key2]) studentDetails[key2] = val2;
        } else if (cells.length === 2) {
          const key1 = $(cells[0]).text().replace(":", "").trim();
          const val1 = $(cells[1]).text().trim();
          if (key1 && !studentDetails[key1]) studentDetails[key1] = val1;
        }
      });
      // map legacy to our standard keys
      if (studentDetails["Name"] && !studentDetails["name"]) studentDetails["name"] = studentDetails["Name"];
      if (studentDetails["Student Name"] && !studentDetails["name"]) studentDetails["name"] = studentDetails["Student Name"];
      if (studentDetails["Registration Number"] && studentDetails["regNo"] === "Unknown") studentDetails["regNo"] = studentDetails["Registration Number"];
      if (studentDetails["Reg. No."] && studentDetails["regNo"] === "Unknown") studentDetails["regNo"] = studentDetails["Reg. No."];
    }
  }

  return studentDetails;
}

// Decodes escaped characters exactly like HTMLDecoder (decoder.py)
function smartExtract(rawHtml: string): string | null {
  if (!rawHtml) return null;

  if (rawHtml.toLowerCase().includes("concurrent") && rawHtml.toLowerCase().includes("terminate")) {
    return "CONCURRENT_ERROR";
  }

  const match = rawHtml.match(/pageSanitizer\.sanitize\('([\s\S]*?)'\)/);
  if (match && match[1]) {
    try {
      let extracted = match[1];
      extracted = extracted.replace(/\\x([0-9A-Fa-f]{2})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
      extracted = extracted.replace(/\\u([0-9A-Fa-f]{4})/g, (_, hex) =>
        String.fromCharCode(parseInt(hex, 16))
      );
      extracted = extracted
        .replace(/\\n/g, "\n")
        .replace(/\\'/g, "'")
        .replace(/\\"/g, '"')
        .replace(/\\&/g, "&")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\b/g, "\b")
        .replace(/\\f/g, "\f")
        .replace(/\\\//g, "/")
        .replace(/\\-/g, "-");
      return extracted;
    } catch (e) {
      console.error("[SRM Scraper] smartExtract match decode error:", e);
    }
  }

  const $ = cheerio.load(rawHtml);
  const hidden = $(".zc-pb-embed-placeholder-content");
  if (hidden.length > 0 && hidden.attr("zmlvalue")) {
    let unescaped = hidden.attr("zmlvalue") || "";
    unescaped = unescaped.replace(/\\-/g, "-").replace(/\\\//g, "/");
    return unescaped;
  }

  return null;
}

// Creates an axios client with real tough-cookie jar (mirrors Classivo's session.py / srmApi.js)
function createApiClient() {
  const cookieJar = new CookieJar();
  return wrapper(
    axios.create({
      jar: cookieJar,
      timeout: 30000,
      headers: DEFAULT_HEADERS,
    } as any)
  ) as any;
}

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    const userRole = checkRole(email);

    const apiClient = createApiClient();
    let userName: string | null = null;
    let registrationNumber: string | null = null;
    let department: string | null = null;
    let program: string | null = null;
    let semester: string | null = null;
    let batch: string | null = null;
    let section: string | null = null;
    let mobile: string | null = null;
    let facultyAdvisor: string | null = null;
    let academicAdvisor: string | null = null;

    try {
      // ========================================
      // Classivo-style login (session.py signin.ac)
      // ========================================
      console.log(`[SRM Scraper] Attempting signin.ac login for: ${email}`);

      const loginPayload = new URLSearchParams({
        username: email,
        password: password,
        client_portal: "true",
        portal: "10002227248",
        servicename: "ZohoCreator",
        serviceurl: "https://academia.srmist.edu.in/",
        is_ajax: "true",
        grant_type: "password",
        service_language: "en",
      });

      const loginRes = await apiClient.post(LOGIN_URL, loginPayload.toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": USER_AGENT,
          Origin: SRM_DOMAIN,
          Referer: `${SRM_DOMAIN}/`,
        },
      });

      const loginData = loginRes.data;

      // Check for concurrent sessions
      if (
        typeof loginData === "string" &&
        loginData.toLowerCase().includes("concurrent")
      ) {
        console.warn("[SRM Scraper] Concurrent session limit hit.");
        throw new Error(
          "Concurrent session limit reached. Please close other tabs and try again."
        );
      }

      // Parse JSON response
      let parsedLogin: any;
      if (typeof loginData === "string") {
        try {
          parsedLogin = JSON.parse(loginData);
        } catch {
          throw new Error("Unexpected login response format.");
        }
      } else {
        parsedLogin = loginData;
      }

      // Check for failure / invalid credentials
      if (parsedLogin?.status === "fail") {
        const code = parsedLogin.code;
        if (code === "HIP_REQUIRED" || code === "HIP_FAILED") {
          return NextResponse.json(
            {
              error: "CAPTCHA required. Please try again from the SRM portal.",
              captchaRequired: true,
            },
            { status: 401 }
          );
        }
        const errMsg =
          parsedLogin.error?.msg ||
          parsedLogin.message ||
          "Invalid credentials.";
        return NextResponse.json({ error: errMsg }, { status: 401 });
      }

      // Extract access_token and oauthorize_uri (Classivo's flow)
      if (parsedLogin?.data?.access_token && parsedLogin?.data?.oauthorize_uri) {
        const accessToken = parsedLogin.data.access_token;
        const oauthUri = parsedLogin.data.oauthorize_uri;
        const finalAuthUrl = `${oauthUri}&access_token=${accessToken}`;

        console.log(
          "[SRM Scraper] Access token received. Exchanging for JSESSIONID..."
        );

        // Follow the OAuth redirect to establish JSESSIONID
        await apiClient.get(finalAuthUrl, {
          headers: { "User-Agent": USER_AGENT },
        });

        // Verify JSESSIONID was set
        const allCookies = await apiClient.defaults.jar.getCookies(SRM_DOMAIN);
        const hasSession = allCookies.some(
          (c: any) => c.key === "JSESSIONID"
        );

        if (!hasSession) {
          console.warn(
            "[SRM Scraper] WARNING: JSESSIONID not found after token exchange."
          );
        } else {
          console.log("[SRM Scraper] SUCCESS: Session cookies established.");
        }
      } else {
        // No access_token means invalid credentials
        throw new Error("Invalid credentials — no access token received.");
      }

      // ========================================
      // Fetch timetable/profile page (try multiple years)
      // ========================================
      try {
        let timetableHtml: string | null = null;

        for (const page of TIMETABLE_PAGES) {
          const url = `${SRM_DOMAIN}/srm_university/academia-academic-services/page/${page}`;
          try {
            const response = await apiClient.get(url, {
              headers: {
                Accept: "*/*",
                Referer: `${SRM_DOMAIN}/`,
                "X-Requested-With": "XMLHttpRequest",
                "User-Agent": USER_AGENT,
              },
              maxRedirects: 0,
              validateStatus: (s: number) => s >= 200 && s < 400,
            });

            // If redirect to signin → session dead
            const location = response.headers?.location || "";
            if (
              response.status >= 300 ||
              location.includes("signin") ||
              location.includes("login")
            ) {
              continue;
            }

            const data =
              typeof response.data === "string" ? response.data : "";
            if (
              data.includes("pageSanitizer") &&
              !data.includes("Page inaccessible")
            ) {
              timetableHtml = data;
              console.log(
                `[SRM Scraper] Found valid timetable page: ${page}`
              );
              break;
            }
          } catch {
            // Try next URL
          }
        }

        if (timetableHtml) {
          const extractedHtml = smartExtract(timetableHtml);

          if (extractedHtml) {
            const studentDetails = extractProfileFromHtml(extractedHtml);

            console.log(
              "[SRM Scraper] Extracted student details:",
              JSON.stringify(studentDetails)
            );

            userName = studentDetails["name"] || null;
            registrationNumber = studentDetails["regNo"] !== "Unknown" ? studentDetails["regNo"] : null;
            department = studentDetails["department"] !== "N/A" ? studentDetails["department"] : null;
            program = studentDetails["program"] !== "N/A" ? studentDetails["program"] : null;
            semester = studentDetails["semester"] !== "N/A" ? studentDetails["semester"] : null;
            batch = studentDetails["batch"] !== "N/A" ? studentDetails["batch"] : null;
            section = studentDetails["section"] !== "N/A" ? studentDetails["section"] : null;
            mobile = studentDetails["mobile"] !== "N/A" ? studentDetails["mobile"] : null;
            facultyAdvisor = studentDetails["facultyAdvisor"] !== "N/A" ? studentDetails["facultyAdvisor"] : null;
            academicAdvisor = studentDetails["academicAdvisor"] !== "N/A" ? studentDetails["academicAdvisor"] : null;
          }
        } else {
          console.warn(
            "[SRM Scraper] Could not find any valid timetable page."
          );
        }
      } catch (detailsError: any) {
        console.warn(
          "[SRM Scraper] Profile extraction error:",
          detailsError.message
        );
      }
    } catch (scrapErr: any) {
      const errMsg = scrapErr.message || String(scrapErr);
      console.error("[SRM Scraper] Login error:", errMsg);

      // If it's a known auth failure, return 401
      if (
        errMsg.includes("Invalid credentials") ||
        errMsg.includes("invalid") ||
        errMsg.includes("CAPTCHA")
      ) {
        return NextResponse.json({ error: errMsg }, { status: 401 });
      }

      // Network/other errors — still allow fallback
      const emailPrefix = email.split("@")[0];
      const formattedName = emailPrefix
        .split(/[._-]/)
        .map((s: string) => s.charAt(0).toUpperCase() + s.slice(1))
        .join(" ");

      userName = formattedName || "Student";
      registrationNumber =
        "RA" + Math.floor(100000000000 + Math.random() * 900000000000);
    }

    // Try to get existing user details from Supabase if we don't have scraped info
    if (!userName || userName === "Student" || registrationNumber === "Unknown") {
      try {
        const { data: dbUser } = await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .single();
        
        if (dbUser) {
          console.log("[SRM Scraper] Fallback found in Supabase users:", dbUser.name);
          userName = dbUser.name;
          department = dbUser.department;
          program = dbUser.campus; // campus maps to program/degree
          semester = dbUser.year; // year maps to semester/year
          mobile = dbUser.phone_number;
        }
      } catch (e: any) {
        console.error("[SRM Scraper] Error looking up user in Supabase:", e.message);
      }
    }

    // Upsert user into Supabase users table to prevent FK constraint failure
    try {
      const { error: upsertError } = await supabase
        .from("users")
        .upsert({
          email: email,
          name: userName || "SRM Student",
          department: department || "N/A",
          year: semester || "1",
          campus: program || "N/A",
          phone_number: mobile || "0000000000",
          trust_score: 50,
          attendance_cache: [],
          marks_cache: [],
          timetable_cache: [],
          courses_cache: [],
          last_sync: new Date().toISOString()
        }, { onConflict: "email" });

      if (upsertError) {
        console.error("[SRM Scraper] Error upserting user to Supabase:", upsertError.message);
      } else {
        console.log("[SRM Scraper] Successfully upserted user to Supabase.");
      }
    } catch (e: any) {
      console.error("[SRM Scraper] Failed to upsert user:", e.message);
    }

    return NextResponse.json({
      success: true,
      message: "Login successful",
      user: {
        name: userName || "SRM Student",
        email: email,
        registrationNumber: registrationNumber || "Unknown",
        role: userRole,
        department: department || "N/A",
        program: program || "N/A",
        semester: semester || "N/A",
        batch: batch || "N/A",
        section: section || "N/A",
        mobile: mobile || "N/A",
        facultyAdvisor: facultyAdvisor || "N/A",
        academicAdvisor: academicAdvisor || "N/A",
        avatar: userRole === "Admin" ? "🛡️" : userRole === "Contributor" ? "👨‍🏫" : "🎒",
        uploadsCount: 0,
        downloadsCount: 0,
        badges: userRole === "Admin" ? ["Founding Administrator"] : userRole === "Contributor" ? ["Syllabus Contributor"] : ["Quick Learner"],
        joinedDate: new Date().toISOString().split("T")[0],
      },
    });
  } catch (err: any) {
    console.error("[SRM Scraper] Fatal error:", err.message);
    return NextResponse.json(
      { error: "An internal server error occurred.", details: err.message },
      { status: 500 }
    );
  }
}
