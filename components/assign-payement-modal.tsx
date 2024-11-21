"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Tables } from "@/lib/supabase/database.types";
import { toast } from "sonner";

interface AssignPayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reference: string;
  organizationId: number;
  onAssigned: () => void;
}

export function AssignPayementModal({
  open,
  onOpenChange,
  reference,
  organizationId,
  onAssigned,
}: AssignPayerModalProps) {
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const { data: payers, isLoading } = useQuery({
    queryKey: ["payers", organizationId, search],
    queryFn: async () => {
      const query = supabase
        .from("payers")
        .select("*")
        .eq("organization_id", organizationId);

      if (search) {
        query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  async function assignPayment(payer: Tables<"payers">) {
    try {
      // Check if the reference already exists for this payer
      const { data: existingRef } = await supabase
        .from("references")
        .select("*")
        .eq("reference_details", reference)
        .eq("organization_id", organizationId)
        .eq("payer_id", payer.user_id)
        .single();

      if (!existingRef) {
        toast.error("This reference is not associated with the selected payer");
        return;
      }

      // Move the payment from unallocated_payments to payments
      const { data: unallocatedPayment, error: fetchError } = await supabase
        .from("unallocated_payments")
        .select("*")
        .eq("transaction_reference", reference)
        .eq("organization_id", organizationId)
        .single();

      if (fetchError || !unallocatedPayment) {
        toast.error("Failed to fetch unallocated payment");
        return;
      }

      const { error: insertError } = await supabase.from("payments").insert({
        amount: unallocatedPayment.amount,
        date: unallocatedPayment.date,
        transaction_reference: unallocatedPayment.transaction_reference, // Add null check
        bank_statement_id: unallocatedPayment.bank_statement_id,
        organization_id: organizationId,
        created_at: new Date().toISOString(),
      });

      if (insertError) throw insertError;

      // Delete the unallocated payment
      const { error: deleteError } = await supabase
        .from("unallocated_payments")
        .delete()
        .eq(
          "unallocated_payment_id",
          unallocatedPayment.unallocated_payment_id
        );

      if (deleteError) throw deleteError;

      toast.success("Payment assigned successfully");
      onAssigned();
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to assign payment");
      console.error(error);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
    >
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Assign Payment to Existing Payer</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Search payers by their name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <div className="space-y-2">
            {isLoading ? (
              <div>Loading payers...</div>
            ) : (
              payers?.map((payer) => (
                <div
                  key={payer.user_id}
                  className="flex items-center justify-between p-2 border rounded hover:bg-accent"
                >
                  <div>
                    <div>
                      {payer.first_name} {payer.last_name}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {payer.email}
                    </div>
                  </div>
                  <Button onClick={() => assignPayment(payer)}>Assign</Button>
                </div>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
