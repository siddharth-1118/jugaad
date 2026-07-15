import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { courseId, resourceId, updatedFields } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase configuration keys" }, { status: 500 });
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find the item matching the resourceId and courseId
    let { data: matchedItems } = await supabase
      .from("items")
      .select("id, photo_url")
      .like("photo_url", `%"id":"${resourceId}"%`)
      .like("photo_url", `%"courseId":"${courseId}"%`);

    if (!matchedItems || matchedItems.length === 0) {
      const { data: fallbackItems } = await supabase
        .from("items")
        .select("id, photo_url")
        .like("photo_url", `%"id":"${resourceId}"%`);
      matchedItems = fallbackItems;
    }

    if (matchedItems && matchedItems.length > 0) {
      for (const item of matchedItems) {
        let meta = {};
        try {
          meta = JSON.parse(item.photo_url);
        } catch (e) {}

        const updatedMeta = {
          ...meta,
          ...updatedFields
        };

        const payload: any = {
          photo_url: JSON.stringify(updatedMeta)
        };

        if (updatedFields.title) {
          payload.title = updatedFields.title;
        }
        if (updatedFields.type) {
          payload.category = updatedFields.type;
        }
        if (updatedFields.url) {
          payload.description = updatedFields.url;
        }

        const { error } = await supabase
          .from("items")
          .update(payload)
          .eq("id", item.id);

        if (error) {
          console.error("DB update error:", error.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Update resource API error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
