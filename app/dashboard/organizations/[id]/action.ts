"use server";

import { createClient } from "@/lib/supabase/server";
import { parseBankCSV } from "@/lib/parsers/bank-csv-parser";
import { revalidatePath } from "next/cache";
import { writeFile, unlink } from "fs/promises";
import { join } from "path";
import os from "os";

export async function processBankStatement(formData: FormData) {
  const supabase = createClient();

  const file = formData.get("file") as File;
  const fileName = formData.get("fileName") as string;
  const organizationId = formData.get("organizationId") as string;
  const processFile = formData.get("processFile") as string;

  if (!file || !fileName || !organizationId) {
    return { error: "Missing required fields" };
  }

  // Upload file to Supabase Storage
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from("organization-files")
    .upload(`${organizationId}/${fileName}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) {
    return { error: "Error uploading file" };
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from("organization-files").getPublicUrl(uploadData.path);

  // Insert record into bank_statements table
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) {
    return { error: "User not authenticated" };
  }

  const { error: insertError } = await supabase.from("bank-statements").insert({
    file_path: publicUrl,
    file_type: file.type,
    organization_id: parseInt(organizationId),
    processed: false,
    uploaded_at: new Date().toISOString(),
  });

  if (insertError) {
    return { error: "Error inserting record" };
  }

  // Process file if checkbox is checked
  if (processFile === "true") {
    try {
      const { data: fileData } = await supabase.storage
        .from("organization-files")
        .download(uploadData.path);

      if (!fileData) {
        throw new Error("Failed to download file");
      }

      const buffer = await fileData.arrayBuffer();
      const tempFilePath = join(os.tmpdir(), fileName);
      await writeFile(tempFilePath, new Uint8Array(buffer));

      const parseResult = await parseBankCSV(tempFilePath);

      // Insert transactions into the database
      const { error: transactionError } = await supabase
        .from("payments")
        .insert(
          parseResult.transactions.map((transaction) => ({
            ...transaction,
            organization_id: parseInt(organizationId),
            bank_statement_id: uploadData.id,
          }))
        );

      if (transactionError) {
        throw new Error("Failed to insert transactions");
      }

      // Update bank_statement as processed
      await supabase
        .from("bank-statements")
        .update({ processed: true })
        .eq("id", uploadData.id);

      // Clean up temp file
      await unlink(tempFilePath);
    } catch (error) {
      console.error("Error processing file:", error);
      return { error: "Error processing file" };
    }
  }

  revalidatePath("/dashboard/bank-statements");
  return { success: true };
}
