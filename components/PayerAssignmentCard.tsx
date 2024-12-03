import { Button } from "@/components/ui/button";
import { Tables } from "@/lib/supabase/database.types";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PayerAssignmentCardProps {
  payer: Tables<"payers">;
  unallocatedPayment: Tables<"unallocated_payments">;
  organizationId: number;
  onAssigned: () => void;
}

const useAssignPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      payer,
      unallocatedPayment,
      organizationId,
    }: {
      payer: Tables<"payers">;
      unallocatedPayment: Tables<"unallocated_payments">;
      organizationId: number;
    }) => {
      const response = await fetch(
        `/api/organizations/${organizationId}/payments/assign`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ payer, unallocatedPayment }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to assign payment");
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["unallocated-payments"] });
    },
  });
};

export function PayerAssignmentCard({
  payer,
  unallocatedPayment,
  organizationId,
  onAssigned,
}: PayerAssignmentCardProps) {
  const assignPayment = useAssignPayment();

  const handleAssignment = async () => {
    try {
      await assignPayment.mutateAsync({
        payer,
        unallocatedPayment,
        organizationId,
      });
      toast.success("Payment assigned successfully");
      onAssigned();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to assign payment"
      );
    }
  };

  return (
    <div className="flex items-center justify-between p-2 border rounded hover:bg-accent">
      <div>
        <div>
          {payer.first_name} {payer.last_name}
        </div>
        <div className="text-sm text-muted-foreground">{payer.email}</div>
      </div>
      <Button onClick={handleAssignment} disabled={assignPayment.isPending}>
        {assignPayment.isPending ? "Assigning..." : "Assign"}
      </Button>
    </div>
  );
}
