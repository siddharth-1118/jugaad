import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const file = searchParams.get("file");

    if (!file) {
      return NextResponse.json({ error: "File parameter is required" }, { status: 400 });
    }

    // Sanitize file path to prevent directory traversal
    const safeFile = path.basename(file);
    const filePath = path.join(process.cwd(), "syllabus", safeFile);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Syllabus file not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${safeFile}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
