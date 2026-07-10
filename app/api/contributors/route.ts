import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "data", "contributors.json");

// Helper to read contributors from JSON file
function readContributors() {
  try {
    if (!fs.existsSync(filePath)) {
      // Create with default contributors
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
  const contributors = readContributors();
  return NextResponse.json({ contributors });
}

export async function POST(req: NextRequest) {
  try {
    const { email, name, addedBy } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const contributors = readContributors();

    // Check if already exists
    if (contributors.some((c: any) => c.email.toLowerCase() === email.toLowerCase())) {
      return NextResponse.json({ error: "Contributor email already registered." }, { status: 400 });
    }

    const newContributor = {
      id: `c-${Date.now()}`,
      email: email.toLowerCase(),
      name: name || email.split("@")[0],
      addedBy: addedBy || "Admin",
      addedAt: new Date().toISOString()
    };

    contributors.push(newContributor);
    writeContributors(contributors);

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

    let contributors = readContributors();
    contributors = contributors.filter((c: any) => c.id !== id);
    writeContributors(contributors);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
