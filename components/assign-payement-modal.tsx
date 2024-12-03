import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { PayerAssignmentCard } from "./PayerAssignmentCard";

interface AssignPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unallocatedPayment: Tables<"unallocated_payments">;
  organizationId: number;
  onAssigned: () => void;
}

export function AssignPaymentModal({
  open,
  onOpenChange,
  unallocatedPayment,
  organizationId,
  onAssigned,
}: AssignPaymentModalProps) {
  const [search, setSearch] = useState("");
  const supabase = createClient();

  const { data: payers, isLoading } = useQuery({
    queryKey: ["payers", organizationId, search],
    queryFn: async () => {
      const { data: orgRefs, error: refsError } = await supabase
        .from("references")
        .select("payer_id")
        .eq("organization_id", organizationId);

      if (refsError) throw refsError;

      const payerIds = [...new Set(orgRefs.map(ref => ref.payer_id))];

      if (payerIds.length === 0) return [];

      const query = supabase
        .from("payers")
        .select(`
          *,
          references!references_payer_id_fkey (
            reference_details,
            organization_id
          )
        `)
        .in("user_id", payerIds);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            ) : payers && payers.length > 0 ? (
              payers.map((payer) => (
                <PayerAssignmentCard
                  key={payer.user_id}
                  payer={payer}
                  unallocatedPayment={unallocatedPayment}
                  organizationId={organizationId}
                  onAssigned={() => {
                    onAssigned();
                    onOpenChange(false);
                  }}
                />
              ))
            ) : (
              <div className="text-center text-muted-foreground py-4">
                No payers found for this organization.
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


