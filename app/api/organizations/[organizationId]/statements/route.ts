import { createClient } from "@/lib/supabase/server";
import { parseFile } from "@/lib/parsers/ai-parser";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const supabase = createClient();
    
    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Fetch bank statements for the organization
    const { data: statements, error } = await supabase
      .from("bank-statements")
      .select("*")
      .eq("organization_id", params.organizationId)
      .order("uploaded_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(statements);
  } catch (error) {
    console.error("Error fetching statements:", error);
    return NextResponse.json(
      { error: "Failed to fetch statements" },
      { status: 500 }
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const processFile = formData.get("processFile") === "true";
    const orgCreatedBy = formData.get("orgCreatedBy") as string;
    const orgName = formData.get("orgName") as string;

    if (!file || !fileName || !orgCreatedBy || !orgName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Upload file to storage
    const fileBuffer = await file.arrayBuffer();
    const fileExt = `.${file.name.split(".").pop()}`;
    const filePath = `${orgCreatedBy}/${params.organizationId}-${orgName}/${fileName}${fileExt}`
      .trimStart()
      .replace(/[^a-z0-9_.-\/]/gi, "-");

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("organization-files")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          organization_id: params.organizationId,
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          original_name: file.name,
          process_immediately: processFile.toString(),
        },
      });

    if (uploadError) {
      if (uploadError.message === "The resource already exists") {
        return NextResponse.json(
          { error: "File already exists" },
          { status: 400 }
        );
      }
      throw uploadError;
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("organization-files")
      .getPublicUrl(uploadData.path);

    if (!publicUrl) {
      throw new Error("Error getting public URL");
    }

    // Create bank statement record
    const { data: statementData, error: insertError } = await supabase
      .from("bank-statements")
      .insert({
        file_path: publicUrl,
        file_type: file.type,
        organization_id: parseInt(params.organizationId),
        processed: processFile,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Process transactions if needed
    if (processFile) {
      const transactions = await parseFile(file);
      await supabase.from("payments").insert(
        transactions.transactions.map((transaction) => ({
          amount: transaction.amount,
          date: transaction.date,
          transaction_reference: transaction.reference,
          bank_statement_id: statementData.file_id,
          organization_id: parseInt(params.organizationId),
          created_at: new Date().toISOString(),
          created_by: user.id,
        }))
      );
    }

    return NextResponse.json({ data: statementData });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 