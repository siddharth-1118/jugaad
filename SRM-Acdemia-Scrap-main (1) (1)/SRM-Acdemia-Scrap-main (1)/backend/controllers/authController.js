const { createSrmApiClient, SRM_DOMAIN } = require("../utils/srmApi");
const logger = require("../utils/logger");
const User = require("../models/user");
const cheerio = require("cheerio");
const { unescapeHtmlString } = require("../utils/htmlUtils");

async function handleSrmLogin(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: "Email and password are required." });
    }

    const apiClient = await createSrmApiClient();
    const srmLoginPageUrl = `${SRM_DOMAIN}/accounts/p/10002227248/signin?hide_fp=true&orgtype=40&service_language=en&css_url=/49910842/academia-academic-services/downloadPortalCustomCss/login&dcc=true&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`;

    try {
        await apiClient.get(srmLoginPageUrl, {
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
                Accept:
                    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            },
        });

        const cookies = await apiClient.defaults.jar.getCookies(srmLoginPageUrl);
        const srmCsrfCookie =
            cookies.find((cookie) => cookie.key === "iamcsr") ||
            cookies.find((cookie) => cookie.key === "CT_CSRF_TOKEN");

        if (!srmCsrfCookie) {
            logger.error('Failed to find "iamcsr" or "CT_CSRF_TOKEN" cookie from login page.');
            return res.status(500).json({
                error:
                    "Failed to retrieve CSRF token. The login page structure may have changed.",
            });
        }

        const srmCsrfToken = srmCsrfCookie.value;
        const srmTokenHeader = `iamcsrcoo=${srmCsrfToken}`;

        const emailLookupUrl = `https://academia.srmist.edu.in/accounts/p/40-10002227248/signin/v2/lookup/${email}`;
        const emailLookupPayload =
            "mode=primary&cli_time=" +
            Date.now() +
            "&orgtype=40&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin";

        const emailLookupResponse = await apiClient.post(
            emailLookupUrl,
            emailLookupPayload,
            {
                headers: {
                    Accept: "*/*",
                    "Accept-Language": "en-GB,en;q=0.7",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    Origin: "https://academia.srmist.edu.in",
                    Referer: srmLoginPageUrl,
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
                    "X-ZCSRF-TOKEN": srmTokenHeader,
                },
            }
        );

        const emailLookupResult = emailLookupResponse.data;
        if (!emailLookupResult.lookup || !emailLookupResult.lookup.digest) {
            logger.error(
                "Lookup failed: " + (emailLookupResult.message || "No digest found in response.")
            );
            return res.status(401).json({
                error: "Email lookup failed. Check email or account status.",
                details: emailLookupResult.message,
            });
        }

        const { identifier, digest } = emailLookupResult.lookup;

        const passwordAuthUrl = `https://academia.srmist.edu.in/accounts/p/40-10002227248/signin/v2/primary/${identifier}/password?digest=${digest}&cli_time=${Date.now()}&orgtype=40&service_language=en&serviceurl=https%3A%2F%2Facademia.srmist.edu.in%2Fportal%2Facademia-academic-services%2FredirectFromLogin`;
        const passwordAuthPayload = JSON.stringify({
            passwordauth: { password: password },
        });

        const passwordAuthResponse = await apiClient.post(
            passwordAuthUrl,
            passwordAuthPayload,
            {
                headers: {
                    Accept: "*/*",
                    "Accept-Language": "en-GB,en;q=0.7",
                    "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
                    Origin: "https://academia.srmist.edu.in",
                    Referer: srmLoginPageUrl,
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
                    "X-ZCSRF-TOKEN": srmTokenHeader,
                },
            }
        );

        if (
            passwordAuthResponse.status !== 200 &&
            passwordAuthResponse.status !== 302
        ) {
            logger.error(
                "Password step failed with status: " + passwordAuthResponse.status
            );
            return res.status(401).json({
                error: "Password authentication failed.",
                details: passwordAuthResponse.data,
            });
        }

        if (
            passwordAuthResponse.data &&
            passwordAuthResponse.data.message &&
            passwordAuthResponse.data.message.toLowerCase().includes("invalid")
        ) {
            logger.error("Invalid password.");
            return res.status(401).json({ error: "Invalid password." });
        }

        const sessionCookieString = await apiClient.defaults.jar.getCookieString(
            SRM_DOMAIN
        );

        const allCookies = await apiClient.defaults.jar.getCookies(SRM_DOMAIN);
        logger.info(`Total cookies in jar after login: ${allCookies.length}`);
        logger.info(`Session cookies obtained: ${sessionCookieString.substring(0, 100)}...`);

        // Fetch user details from SRM to get name and other info
        let userName = null;
        let registrationNumber = null;
        try {
            const srmTimetableUrl =
                `${SRM_DOMAIN}/srm_university/academia-academic-services/page/My_Time_Table_2023_24`;
            const srmTimetableResponse = await apiClient.get(srmTimetableUrl, {
                headers: {
                    Accept: "*/*",
                    "Accept-Language": "en-GB,en;q=0.7",
                    Referer: `${SRM_DOMAIN}/`,
                    "Sec-Fetch-Dest": "empty",
                    "Sec-Fetch-Mode": "cors",
                    "Sec-Fetch-Site": "same-origin",
                    "User-Agent":
                        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36",
                    "X-Requested-With": "XMLHttpRequest",
                },
            });

            const fullPageHtml = srmTimetableResponse.data;
            const match = fullPageHtml.match(/pageSanitizer\.sanitize\('([\s\S]*)'\);/);

            if (match && match[1]) {
                const unescapedHtml = unescapeHtmlString(match[1]);
                const $ = cheerio.load(unescapedHtml);

                const studentDetails = {};
                const infoTable = $(
                    'div[style*="line-height:150%"] > table[border="0"][align="left"]'
                );
                infoTable.find("tr").each((i, row) => {
                    const cells = $(row).find("td");
                    if (cells.length === 4) {
                        let key1 = $(cells[0]).text().replace(":", "").trim();
                        let val1 = $(cells[1]).text().trim();
                        let key2 = $(cells[2]).text().replace(":", "").trim();
                        let val2 = $(cells[3]).text().trim();
                        if (key1) studentDetails[key1] = val1;
                        if (key2) studentDetails[key2] = val2;
                    } else if (cells.length === 2) {
                        let key1 = $(cells[0]).text().replace(":", "").trim();
                        let val1 = $(cells[1]).text().trim();
                        if (key1) studentDetails[key1] = val1;
                    }
                });

                userName = studentDetails["Name"] || studentDetails["Student Name"];
                registrationNumber = studentDetails["Registration Number"] || studentDetails["Reg. No."];
            }
        } catch (detailsError) {
            logger.error("Failed to fetch user details: " + detailsError.message);
            // Continue even if details fetch fails
        }

        // Save or update user in MongoDB
        try {
            const updateData = {
                email: email,
                lastLogin: new Date(),
                sessionToken: sessionCookieString
            };

            // Add name and registration number if available
            if (userName) updateData.name = userName;
            if (registrationNumber) updateData.registrationNumber = registrationNumber;

            const updatedUser = await User.findOneAndUpdate(
                { email: email },
                { $set: updateData },
                {
                    upsert: true,
                    new: true
                }
            );
            logger.info(`User ${email} logged in and saved to database. SessionToken updated.`);
        } catch (dbError) {
            logger.error("Failed to save user to database: " + dbError.message);
            // Continue even if DB save fails
        }

        res.cookie('sessionToken', sessionCookieString, {
            httpOnly: true,
            sameSite: 'lax',
            path: '/',
        });
        res.status(200).json({
            message: "Login successful",
            sessionToken: sessionCookieString
        });
    } catch (error) {
        logger.error("An error occurred during the login process: " + error.message);
        if (error.response) {
            logger.error("Error data: " + JSON.stringify(error.response.data));
            logger.error("Error status: " + error.response.status);
        }
        res.status(500).json({
            error: "An internal server error occurred.",
            details: error.message,
        });
    }
}

async function handleLogout(req, res) {
    try {
        res.clearCookie('sessionToken');
        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        logger.error("Logout error: " + error.message);
        res.status(500).json({ error: "Logout failed" });
    }
}

module.exports = { handleSrmLogin, handleLogout };
