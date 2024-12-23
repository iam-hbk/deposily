import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { ids } = await request.json();
  const supabase = createClient();

  await supabase
    .from("notifications")
    .update({ read: true })
    .in("id", ids);

  return NextResponse.json({ success: true });
} 