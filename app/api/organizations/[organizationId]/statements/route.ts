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
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
  const supabase = createClient();
  let uploadedFilePath: string | undefined;

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

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start transaction
    await supabase.rpc("begin_transaction");

    try {
      // Upload file to storage
      const fileBuffer = await file.arrayBuffer();
      const fileExt = `.${file.name.split(".").pop()}`;
      const filePath =
        `${orgCreatedBy}/${params.organizationId}-${orgName}/${fileName}${fileExt}`
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

      uploadedFilePath = uploadData.path;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage
        .from("organization-files")
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error("Error getting public URL");
      }

      // Create bank statement record within transaction
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
        const result = await parseFile(file);

        //Write the result to a file
        console.log(
          "\n\n----------------\n\n Results",
          result,
          "\n\n------------\n\n"
        );

        if ("code" in result) {
          throw new Error(result.message);
        }

        const { error: paymentsError } = await supabase.from("payments").insert(
          result.transactions.map((transaction) => ({
            amount: transaction.amount,
            date: transaction.date,
            transaction_reference: transaction.transaction_reference,
            bank_statement_id: statementData.file_id,
            organization_id: parseInt(params.organizationId),
            created_at: new Date().toISOString(),
          }))
        );

        if (paymentsError) {
          throw paymentsError;
        }

        // Update bank statement as processed
        const { error: updateError } = await supabase
          .from("bank-statements")
          .update({ processed: true })
          .eq("file_id", statementData.file_id);

        if (updateError) {
          throw updateError;
        }
      }

      // Commit transaction
      await supabase.rpc("commit_transaction");

      return NextResponse.json({ data: statementData });
    } catch (error) {
      // Rollback transaction on any error
      await supabase.rpc("rollback_transaction");

      // If we uploaded a file, try to delete it
      if (uploadedFilePath) {
        await supabase.storage
          .from("organization-files")
          .remove([uploadedFilePath])
          .catch((error) =>
            console.error("Error cleaning up uploaded file:", error)
          );
      }

      throw error; // Re-throw to be caught by outer catch block
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
