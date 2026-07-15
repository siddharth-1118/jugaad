import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { supabase } from "../../../lib/supabase";

const filePath = path.join(process.cwd(), "data", "contributors.json");

// Helper to read contributors from JSON file
function readContributors() {
  try {
    if (!fs.existsSync(filePath)) {
      const defaultContributors: any[] = [];
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultContributors, null, 2));
      return defaultContributors;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading contributors:", error);
    return [];
  }
}

// Helper to write contributors to JSON file
function writeContributors(contributors: any[]) {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(contributors, null, 2));
  } catch (error) {
    console.error("Error writing contributors:", error);
  }
}

export async function GET() {
  try {
    const { data: dbItems, error } = await supabase
      .from("items")
      .select("*")
      .eq("type", "FOUND")
      .eq("location", "contributor");

    if (error) throw error;

    const contributors = (dbItems || []).map((item: any) => {
      let meta: any = {};
      try {
        meta = JSON.parse(item.photo_url || "{}");
      } catch (e) {}

      return {
        id: meta.id || `c-${item.id}`,
        email: meta.email || "",
        name: item.title || "",
        addedBy: meta.addedBy || "Admin",
        addedAt: item.created_at || meta.addedAt
      };
    });

    return NextResponse.json({ contributors });
  } catch (error: any) {
    console.error("GET contributors error:", error);
    const contributors = readContributors();
    return NextResponse.json({ contributors });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, addedBy } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const lowerEmail = email.toLowerCase();

    // Check if already exists in Supabase
    let exists = false;
    try {
      const { data: dbItems, error: fetchError } = await supabase
        .from("items")
        .select("photo_url")
        .eq("type", "FOUND")
        .eq("location", "contributor");

      if (!fetchError && dbItems) {
        exists = dbItems.some((item: any) => {
          try {
            const meta = JSON.parse(item.photo_url || "{}");
            return meta.email && meta.email.toLowerCase() === lowerEmail;
          } catch {
            return false;
          }
        });
      }
    } catch (e) {}

    if (exists) {
      return NextResponse.json({ error: "Contributor email already registered." }, { status: 400 });
    }

    const contributorId = `c-${Date.now()}`;
    const newContributor = {
      id: contributorId,
      email: lowerEmail,
      name: name || email.split("@")[0],
      addedBy: addedBy || "Admin",
      addedAt: new Date().toISOString()
    };

    const { error: insertError } = await supabase
      .from("items")
      .insert([
        {
          type: "FOUND",
          location: "contributor",
          category: "contributor",
          title: newContributor.name,
          user_email: null,
          description: "Course Library Academic Contributor",
          photo_url: JSON.stringify({
            email: newContributor.email,
            addedBy: newContributor.addedBy,
            id: newContributor.id,
            addedAt: newContributor.addedAt
          }),
          status: "Active"
        }
      ]);

    if (insertError) throw insertError;

    // Sync to local JSON file for dev fallback
    try {
      const contributors = readContributors();
      if (!contributors.some((c: any) => c.email.toLowerCase() === lowerEmail)) {
        contributors.push(newContributor);
        writeContributors(contributors);
      }
    } catch (e) {}

    return NextResponse.json({ success: true, contributor: newContributor });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Contributor ID is required" }, { status: 400 });
    }

    // Find in Supabase and delete
    try {
      const { data: dbItems, error: fetchError } = await supabase
        .from("items")
        .select("id, photo_url")
        .eq("type", "FOUND")
        .eq("location", "contributor");

      if (!fetchError && dbItems) {
        const targetItem = dbItems.find((item: any) => {
          try {
            const meta = JSON.parse(item.photo_url || "{}");
            return meta.id === id;
          } catch {
            return false;
          }
        });
        if (targetItem) {
          await supabase.from("items").delete().eq("id", targetItem.id);
        }
      }
    } catch (e) {}

    // Fallback/sync to local JSON file
    try {
      let contributors = readContributors();
      contributors = contributors.filter((c: any) => c.id !== id);
      writeContributors(contributors);
    } catch (e) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

