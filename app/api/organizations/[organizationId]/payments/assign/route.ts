import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const supabase = createClient();
    const { payer, unallocatedPayment } = await req.json();

    // Verify user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Start transaction
    await supabase.rpc("begin_transaction");

    try {
      // 1. Get payer's existing reference for this organization
      const { data: existingReference, error: refError } = await supabase
        .from("references")
        .select("reference_details")
        .eq("organization_id", parseInt(params.organizationId))
        .eq("payer_id", payer.user_id)
        .single();

      if (refError || !existingReference) {
        throw new Error("Payer doesn't have a reference for this organization");
      }

      // 2. Create the allocated payment with original reference
      const { error: insertError } = await supabase.from("payments").insert({
        amount: unallocatedPayment.amount,
        date: unallocatedPayment.date,
        transaction_reference: existingReference.reference_details!,
        reference_on_deposit: unallocatedPayment.transaction_reference,
        bank_statement_id: unallocatedPayment.bank_statement_id,
        organization_id: parseInt(params.organizationId),
        payer_id: payer.user_id,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // 3. Delete the unallocated payment
      const { error: deleteError } = await supabase
        .from("unallocated_payments")
        .delete()
        .eq(
          "unallocated_payment_id",
          unallocatedPayment.unallocated_payment_id
        );

      if (deleteError) throw deleteError;

      // Commit transaction
      await supabase.rpc("commit_transaction");

      return NextResponse.json({ success: true });
    } catch (error) {
      // Rollback transaction
      await supabase.rpc("rollback_transaction");
      throw error;
    }
  } catch (error) {
    console.error("Error assigning payment:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to assign payment",
      },
      { status: 500 }
    );
  }
}
