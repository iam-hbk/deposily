import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { id } = await request.json();
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read: true })
    .eq("id", id);

  return NextResponse.json({ success: true });
} 