import { createClient } from "@/lib/supabase/server";
import { PayersTable } from "@/components/payers-table";
import { NewPayerForm } from "@/components/new-payer-form";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { UserPlus2 } from "lucide-react";
import { Database } from "@/lib/supabase/database.types";

type Payer = Database["public"]["Tables"]["payers"]["Row"];

type PayerWithPaymentStatus = Payer & {
  lastPaymentDate: Date | null;
  paymentStatus: "Paid" | "Pending" | "Owing";
  reference: string | null;
};

async function getPayersWithPaymentStatus(
  organizationId: string
): Promise<PayerWithPaymentStatus[]> {
  const supabase = createClient();

  // First get all payers for this organization
  const { data: organizationPayers, error: payersError } = await supabase
    .from("payers")
    .select(
      `
      *,
      payments (
        amount,
        date,
        transaction_reference,
        payment_id
      ),
      references (
        reference_details
      )
    `
    )
    .eq("organization_id", organizationId);

  if (payersError) throw payersError;

  // Transform the data
  return organizationPayers.map((payer) => {
    const payments = payer.payments || [];
    const sortedPayments = payments.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const lastPayment = sortedPayments[0];
    const lastPaymentDate = lastPayment ? new Date(lastPayment.date) : null;
    const references = payer.references || [];
    const reference = references.length > 0 ? references[0].reference_details : null;

    let paymentStatus: "Paid" | "Pending" | "Owing" = "Owing";
    if (lastPaymentDate) {
      const daysSinceLastPayment = Math.floor(
        (new Date().getTime() - lastPaymentDate.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      if (daysSinceLastPayment <= 30) {
        paymentStatus = "Paid";
      } else if (daysSinceLastPayment <= 45) {
        paymentStatus = "Pending";
      }
    }

    return {
      email: payer.email,
      first_name: payer.first_name,
      last_name: payer.last_name,
      phone_number: payer.phone_number,
      user_id: payer.user_id,
      organization_id: payer.organization_id,
      lastPaymentDate,
      reference,
      paymentStatus,
    };
  });
}

export const dynamic = "force-dynamic"; // or use revalidate = 0

export default async function PayersPage({
  params,
}: {
  params: { id: string };
}) {
  const payers = await getPayersWithPaymentStatus(params.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-row">
        <h2 className="text-2xl font-bold">Payers</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline">
              <UserPlus2 className="mr-2 w-4 h-4" />
              Add a New Payer
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add a New Payer</DialogTitle>
              <DialogDescription>
                Add a New Payer to this organization.
              </DialogDescription>
            </DialogHeader>
            <NewPayerForm
              organizationId={Number(params.id)}
              reference=""
            />
          </DialogContent>
        </Dialog>
      </div>
      <PayersTable payers={payers} organizationId={params.id} />
    </div>
  );
}
