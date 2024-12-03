import { createClient } from "@/lib/supabase/server";
import { parseFile } from "@/lib/parsers/ai-parser";
import { NextRequest, NextResponse } from "next/server";
import { Database } from "@/lib/supabase/database.types";


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



type Transaction = {
  amount: number;
  date: string;
  transaction_reference: string;
};

type PaymentInsert = Database["public"]["Tables"]["payments"]["Insert"];
type UnallocatedPaymentInsert =
  Database["public"]["Tables"]["unallocated_payments"]["Insert"];

type ProcessingResult = {
  allocated: number;
  unallocated: number;
};

async function processTransactions(
  supabase: ReturnType<typeof createClient>,
  transactions: Transaction[],
  organizationId: number,
  statementId: number
): Promise<ProcessingResult> {
  // Normalize and collect all references
  const normalizedReferences = transactions.map((t) =>
    t.transaction_reference.toLowerCase().trim()
  );

  // Fetch references with their associated payer information for this organization
  const { data: existingReferences, error: refsError } = await supabase
    .from("references")
    .select(`
      reference_details,
      payer_id,
      payer:payers!references_payer_id_fkey (
        user_id,
        first_name,
        last_name,
        email
      )
    `)
    .eq("organization_id", organizationId)
    .in("reference_details", normalizedReferences);

  if (refsError) {
    throw new Error(`Error fetching references: ${refsError.message}`);
  }

  // Create a map for quick reference lookup that includes payer info
  const referenceMap = new Map(
    existingReferences.map((ref) => [
      ref.reference_details?.toLowerCase(),
      ref.payer // Now includes the full payer object
    ])
  );

  // Prepare batch inserts
  const paymentsToInsert: PaymentInsert[] = [];
  const unallocatedToInsert: UnallocatedPaymentInsert[] = [];
  const now = new Date().toISOString();

  // Process each transaction
  transactions.forEach((transaction) => {
    const normalizedRef = transaction.transaction_reference.toLowerCase().trim();
    const payer = referenceMap.get(normalizedRef);

    const baseTransaction = {
      amount: transaction.amount,
      date: transaction.date,
      transaction_reference: normalizedRef,
      bank_statement_id: statementId,
      organization_id: organizationId,
      created_at: now,
    };

    if (payer?.user_id) {
      paymentsToInsert.push({
        ...baseTransaction,
        payer_id: payer.user_id,
      });
    } else {
      unallocatedToInsert.push(baseTransaction);
    }
  });

  // Batch insert payments
  if (paymentsToInsert.length > 0) {
    const { error: paymentsError } = await supabase
      .from("payments")
      .insert(paymentsToInsert)
      .select(); // Added select to verify insertion

    if (paymentsError) {
      throw new Error(`Error inserting payments: ${paymentsError.message}`);
    }
  }

  // Batch insert unallocated payments
  if (unallocatedToInsert.length > 0) {
    const { error: unallocatedError } = await supabase
      .from("unallocated_payments")
      .insert(unallocatedToInsert);

    if (unallocatedError) {
      throw new Error(
        `Error inserting unallocated payments: ${unallocatedError.message}`
      );
    }
  }

  return {
    allocated: paymentsToInsert.length,
    unallocated: unallocatedToInsert.length,
  };
}

type ApiResponse = {
  data?: {
    statement: Database["public"]["Tables"]["bank-statements"]["Row"];
    processing: {
      totalTransactions: number;
      allocatedPayments: number;
      unallocatedPayments: number;
    } | null;
  };
  error?: {
    message: string;
    details?: Record<string, boolean | string>;
  };
};

export async function POST(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
): Promise<NextResponse<ApiResponse>> {
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
        {
          error: {
            message: "Missing required fields",
            details: {
              file: !file,
              fileName: !fileName,
              orgCreatedBy: !orgCreatedBy,
              orgName: !orgName,
            },
          },
        },
        { status: 400 }
      );
    }

    const allowedTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/pdf",
    ] as const;
    type AllowedFileType = (typeof allowedTypes)[number];

    if (!allowedTypes.includes(file.type as AllowedFileType)) {
      return NextResponse.json(
        {
          error: {
            message:
              "Invalid file type. Please upload a CSV, Excel, or PDF file.",
          },
        },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          error: {
            message: "Unauthorized",
          },
        },
        { status: 401 }
      );
    }

    // Start transaction
    await supabase.rpc("begin_transaction");

    try {
      const timestamp = new Date().getTime();
      const fileExt = `.${file.name.split(".").pop()}`;
      const filePath =
        `${orgCreatedBy}/${params.organizationId}/${timestamp}-${fileName}${fileExt}`
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9_.-\/]/gi, "-");

      const fileBuffer = await file.arrayBuffer();
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("organization-files")
        .upload(filePath, fileBuffer, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type,
          metadata: {
            organization_id: params.organizationId,
            uploaded_by: user.id,
            uploaded_at: new Date().toISOString(),
            original_name: file.name,
            process_immediately: processFile.toString(),
          },
        });

      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }

      uploadedFilePath = uploadData.path;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("organization-files")
        .getPublicUrl(uploadData.path);

      if (!publicUrl) {
        throw new Error("Failed to generate public URL");
      }

      const { data: statementData, error: insertError } = await supabase
        .from("bank-statements")
        .insert({
          file_path: publicUrl,
          file_type: file.type,
          organization_id: parseInt(params.organizationId),
          processed: false,
          uploaded_at: new Date().toISOString(),
          uploaded_by: user.id,
        })
        .select()
        .single();

      if (insertError || !statementData) {
        throw new Error(`Database insert error: ${insertError?.message}`);
      }

      let processingResults: ProcessingResult | null = null;

      if (processFile) {
        const parseResult = await parseFile(file);

        if ("code" in parseResult) {
          throw new Error(`File parsing error: ${parseResult.message}`);
        }

        processingResults = await processTransactions(
          supabase,
          parseResult.transactions,
          parseInt(params.organizationId),
          statementData.file_id
        );

        const { error: updateError } = await supabase
          .from("bank-statements")
          .update({ processed: true })
          .eq("file_id", statementData.file_id);

        if (updateError) {
          throw new Error(
            `Error updating statement status: ${updateError.message}`
          );
        }
      }

      await supabase.rpc("commit_transaction");

      return NextResponse.json({
        data: {
          statement: statementData,
          processing: processingResults
            ? {
                totalTransactions:
                  processingResults.allocated + processingResults.unallocated,
                allocatedPayments: processingResults.allocated,
                unallocatedPayments: processingResults.unallocated,
              }
            : null,
        },
      });
    } catch (error) {
      await supabase.rpc("rollback_transaction");

      if (uploadedFilePath) {
        await supabase.storage
          .from("organization-files")
          .remove([uploadedFilePath])
          .catch(console.error);
      }

      throw error;
    }
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      {
        error: {
          message: "Failed to process file",
          details: {
            message: error instanceof Error ? error.message : "Unknown error",
          },
        },
      },
      { status: 500 }
    );
  }
}
