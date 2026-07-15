import { NextResponse } from "next/server";
import { Readable } from "stream";
import { google } from "googleapis";

export async function GET() {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    if (!clientId || !clientSecret || !refreshToken) {
      return NextResponse.json({ active: false });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const tokenResponse = await oauth2Client.getAccessToken();
    return NextResponse.json({
      active: true,
      accessToken: tokenResponse.token
    });
  } catch (err: any) {
    console.error("Token exchange failed:", err.message);
    return NextResponse.json({ active: false, error: err.message });
  }
}

export async function POST(request: Request) {
  try {
    const { fileName, fileData, mimeType } = await request.json();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

    // Graceful fallback if credentials are not configured
    if (!clientId || !clientSecret || !refreshToken) {
      console.warn("Google Drive credentials not configured. Falling back to Supabase base64 storage.");
      return NextResponse.json({ fallback: true });
    }

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "https://developers.google.com/oauthplayground"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    const drive = google.drive({ version: "v3", auth: oauth2Client });

    // Extract base64 payload
    const commaIndex = fileData.indexOf(",");
    if (commaIndex === -1) {
      return NextResponse.json({ error: "Invalid base64 payload" }, { status: 400 });
    }
    const base64Data = fileData.substring(commaIndex + 1);
    const buffer = Buffer.from(base64Data, "base64");

    // Convert to readable stream
    const bufferStream = new Readable();
    bufferStream.push(buffer);
    bufferStream.push(null);

    // Upload to Google Drive
    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName,
        mimeType: mimeType || "application/octet-stream",
      },
      media: {
        mimeType: mimeType || "application/octet-stream",
        body: bufferStream,
      },
      fields: "id, webViewLink",
    });

    const fileId = driveResponse.data.id;
    if (!fileId) {
      return NextResponse.json({ error: "Failed to upload to Google Drive" }, { status: 500 });
    }

    // Set permission to public read-only
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Fetch the updated webViewLink
    const fileInfo = await drive.files.get({
      fileId: fileId,
      fields: "webViewLink",
    });

    return NextResponse.json({
      fallback: false,
      webViewLink: fileInfo.data.webViewLink,
      fileId: fileId,
    });
  } catch (err: any) {
    console.error("Google Drive Upload Error:", err.message);
    // Return fallback: true if it is an auth error, so the app doesn't break
    return NextResponse.json({ fallback: true, error: err.message });
  }
}
