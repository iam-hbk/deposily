"use server";
import { parseFile } from "@/lib/parsers/ai-parser";
import { createClient } from "@/lib/supabase/server";
import { SupabaseClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

type UploadResult = {
  success: boolean;
  data?: BankStatement;
  error?: string;
};

interface BankStatementData {
  file: File;
  fileName: string;
  organizationId: number;
  processFile: boolean;
  orgCreatedBy: string;
  orgName: string;
}

interface BankStatement {
  file_id: string;
  file_path: string;
  file_type: string;
  organization_id: number;
  processed: boolean;
  uploaded_at: string;
  uploaded_by: string;
}

interface Transaction {
  amount: number;
  date: string;
  reference: string;
}

interface ParsedTransactions {
  transactions: Transaction[];
}

async function uploadFileToStorage(
  supabase: SupabaseClient,
  data: BankStatementData,
  fileBuffer: ArrayBuffer,
  userId: string
) {
  const fileExt = `.${data.file.name.split(".").pop()}`;
  const filePath = `${data.orgCreatedBy}/${data.organizationId}-${
    data.orgName
  }/${data.fileName}${fileExt}`
    .trimStart()
    .replace(/[^a-z0-9_.-\/]/gi, "-");

  const { error: uploadError, data: uploadData } = await supabase.storage
    .from("organization-files")
    .upload(filePath, fileBuffer, {
      cacheControl: "3600",
      upsert: false,
      metadata: {
        organization_id: data.organizationId.toString(),
        uploaded_by: userId,
        uploaded_at: new Date().toISOString(),
        original_name: data.file.name,
        process_immediately: data.processFile.toString(),
      },
    });

  if (uploadError) {
    if (uploadError.message === "The resource already exists") {
      throw new Error("File already exists");
    }
    throw new Error(`Error uploading file: ${uploadError.message}`);
  }

  return uploadData;
}

async function createBankStatement(supabase: SupabaseClient, {
  publicUrl,
  file,
  organizationId,
  processFile,
  userId,
}: {
  publicUrl: string;
  file: File;
  organizationId: number;
  processFile: boolean;
  userId: string;
}): Promise<BankStatement> {
  const { data: statementData, error: insertError } = await supabase
    .from("bank-statements")
    .insert({
      file_path: publicUrl,
      file_type: file.type,
      organization_id: organizationId,
      processed: processFile,
      uploaded_at: new Date().toISOString(),
      uploaded_by: userId,
    })
    .select()
    .single();

  if (insertError) {
    throw new Error(`Error inserting record: ${insertError.message}`);
  }

  return statementData;
}

async function processTransactions(supabase: SupabaseClient, {
  file,
  statementData,
  organizationId,
  userId,
}: {
  file: File;
  statementData: BankStatement;
  organizationId: number;
  userId: string;
}) {
  const transactions = await parseFile(file) as ParsedTransactions;

  const { error: paymentsError } = await supabase.from("payments").insert(
    transactions.transactions.map((transaction) => ({
      amount: transaction.amount,
      date: transaction.date,
      transaction_reference: transaction.reference,
      bank_statement_id: statementData.file_id,
      organization_id: organizationId,
      created_at: new Date().toISOString(),
      created_by: userId,
    }))
  );

  if (paymentsError) {
    throw new Error(`Error inserting payments: ${paymentsError.message}`);
  }
}

export async function processBankStatement(formData: FormData): Promise<UploadResult> {
  try {
    // Extract and validate form data
    const data = {
      file: formData.get("file") as File,
      fileName: formData.get("fileName") as string,
      organizationId: parseInt(formData.get("organizationId") as string),
      processFile: formData.get("processFile") === "true",
      orgCreatedBy: formData.get("orgCreatedBy") as string,
      orgName: formData.get("orgName") as string,
    };

    if (!data.file || !data.fileName || !data.organizationId || !data.orgCreatedBy || !data.orgName) {
      throw new Error("Missing required fields");
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error("User is not logged in");
    }

    // Upload file to storage
    const fileBuffer = await data.file.arrayBuffer();
    const uploadData = await uploadFileToStorage(supabase, data, fileBuffer, user.id);

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("organization-files")
      .getPublicUrl(uploadData.path);

    if (!publicUrl) {
      throw new Error("Error getting public URL");
    }

    // Create bank statement record
    const statementData = await createBankStatement(supabase, {
      publicUrl,
      file: data.file,
      organizationId: data.organizationId,
      processFile: data.processFile,
      userId: user.id,
    });

    // Process transactions if needed
    if (data.processFile) {
      await processTransactions(supabase, {
        file: data.file,
        statementData,
        organizationId: data.organizationId,
        userId: user.id,
      });
    }

    // Force revalidation of the statements page
    revalidatePath(`/dashboard/organizations/${data.organizationId}/statements`);

    return { success: true, data: statementData };
  } catch (error) {
    console.error("Error processing request:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "An error occurred while processing the request",
    };
  }
}
