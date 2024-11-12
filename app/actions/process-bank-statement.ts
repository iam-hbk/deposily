"use server";

import { parseFile } from "@/lib/parsers/ai-parser";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function processBankStatement(formData: FormData) {
  try {
    const file = formData.get("file") as File;
    const fileName = formData.get("fileName") as string;
    const organizationId = parseInt(formData.get("organizationId") as string);
    const processFile = formData.get("processFile") === "true";
    const orgCreatedBy = formData.get("orgCreatedBy") as string;
    const orgName = formData.get("orgName") as string;

    if (!file || !fileName || !organizationId || !orgCreatedBy || !orgName) {
      throw new Error("Missing required fields");
    }

    // Initialize Supabase client
    const supabase = createClient();

    // Convert File to ArrayBuffer
    const fileBuffer = await file.arrayBuffer();

    // Get user info
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User is not logged in");
    }

    // Build file path
    const fileExt = `.${file.name.split(".").pop()}`;
    const filePath =
      `${orgCreatedBy}/${organizationId}-${orgName}/${fileName}${fileExt}`
        .trimStart()
        .replace(/[^a-z0-9_.-\/]/gi, "-");

    // Upload file
    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("organization-files")
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        metadata: {
          organization_id: organizationId.toString(),
          uploaded_by: user.id,
          uploaded_at: new Date().toISOString(),
          original_name: file.name,
          process_immediately: processFile.toString(),
        },
      });

    if (uploadError) {
      if (uploadError.message === "The resource already exists") {
        throw new Error("File already exists");
      }
      throw new Error(`Error uploading file: ${uploadError.message}`);
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from("organization-files")
      .getPublicUrl(uploadData.path);

    if (!publicUrl) {
      throw new Error("Error getting public URL");
    }

    // Create record in bank-statements table
    const { data: statementData, error: insertError } = await supabase
      .from("bank-statements")
      .insert({
        file_path: publicUrl,
        file_type: file.type,
        organization_id: organizationId,
        processed: processFile,
        uploaded_at: new Date().toISOString(),
        uploaded_by: user.id,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Error inserting record: ${insertError.message}`);
    }

    // If processFile is true, start processing
    if (processFile) {
      const transactions = await parseFile(file);

      // Insert payments into database
      // Get the current user ID once before mapping
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error: paymentsError } = await supabase.from("payments").insert(
        transactions.transactions.map((transaction) => ({
          amount: transaction.amount,
          date: transaction.date,
          transaction_reference: transaction.reference,
          bank_statement_id: statementData.file_id,
          organization_id: organizationId,
          created_at: new Date().toISOString(),
          created_by: user?.id,
        }))
      );

      if (paymentsError) {
        throw new Error(`Error inserting payments: ${paymentsError.message}`);
      }
    }

    // Revalidate the page to show updated data
    revalidatePath(`/dashboard/organizations/${organizationId}/statements`);

    return { success: true, data: statementData };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      error:
        error instanceof Error
          ? error.message
          : "An error occurred while processing the request",
    };
  }
}
