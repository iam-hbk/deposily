import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { userId } = await request.json();
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("user_id", userId);

  return NextResponse.json({ success: true });
} 