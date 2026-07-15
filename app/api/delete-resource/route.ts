import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const { courseId, resourceId } = await request.json();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || "";

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: "Missing Supabase configuration keys" }, { status: 500 });
    }

    // Initialize server-side anonymous client (bypasses browser JWT RLS mismatch)
    const supabase = createClient(supabaseUrl, supabaseKey);

    let { data: matchedItems } = await supabase
      .from("items")
      .select("id")
      .like("photo_url", `%"id":"${resourceId}"%`)
      .like("photo_url", `%"courseId":"${courseId}"%`);

    if (!matchedItems || matchedItems.length === 0) {
      const { data: fallbackItems } = await supabase
        .from("items")
        .select("id")
        .like("photo_url", `%"id":"${resourceId}"%`);
      matchedItems = fallbackItems;
    }

    if (matchedItems && matchedItems.length > 0) {
      for (const item of matchedItems) {
        const { error } = await supabase
          .from("items")
          .delete()
          .eq("id", item.id);
        
        if (error) {
          console.error(`DB delete error for ID ${item.id}:`, error.message);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete resource API route exception:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
