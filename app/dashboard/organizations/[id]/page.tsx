import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PaymentsTable } from "@/components/payments-table";
import { UnallocatedPaymentsTable } from "@/components/unallocated-payments-table";
import { Separator } from "@/components/ui/separator";

import { notFound } from "next/navigation";
import { Tables } from "@/lib/supabase/database.types";
import { createPaymentNotification } from "@/lib/notifications";

export const dynamic = "force-dynamic"; // or use revalidate = 0

type Payer = Tables<"payers">;

type PayerWithPaymentStatus = Payer & {
  lastPaymentDate: Date | null;
  paymentStatus: "Paid" | "Pending" | "Owing";
  reference: string;
};

type OrganizationWithReferences = Tables<"organizations"> & {
  references: Array<{
    payers: Tables<"payers"> | null;
    payer_id: string;
    reference_details: string;
  }>;
};

async function getOrganizationData(id: string): Promise<{
  organization: OrganizationWithReferences | null;
  payersWithStatus: PayerWithPaymentStatus[];
}> {
  const supabase = createClient();

  // Fetch organization with references and payers
  const { data: organization, error: orgError } = await supabase
    .from("organizations")
    .select(
      `
      *,
      references (
        payer_id,
        reference_details,
        payers (
          *
        )
      )
    `
    )
    .eq("organization_id", id)
    .single();

  if (orgError) {
    console.error("Error fetching organization:", orgError.message);
    return { organization: null, payersWithStatus: [] };
  }

  // Get or create payment check record
  let lastChecked = new Date(0).toISOString();
  
  if (organization.created_by) {
    const { data: paymentCheck } = await supabase
      .from("payment_checks")
      .select("last_checked_at")
      .eq("organization_id", id)
      .eq("user_id", organization.created_by)
      .single();

    lastChecked = paymentCheck?.last_checked_at || lastChecked;
  }

  // Fetch all payments for this organization's payers
  const payerIds = organization.references
    .map((ref) => ref.payer_id)
    .filter(Boolean);

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .in("payer_id", payerIds)
    .order('date', { ascending: false });

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError.message);
    return {
      organization: organization as OrganizationWithReferences,
      payersWithStatus: [],
    };
  }

  // Check for new payments and create notifications
  const newPayments = payments?.filter(payment => new Date(payment.date) > new Date(lastChecked)) || [];
  
  for (const payment of newPayments) {
    const payer = organization.references
      .find(ref => ref.payer_id === payment.payer_id)
      ?.payers;
      
    if (payer && organization.created_by) {
      try {
        await createPaymentNotification({
          userId: organization.created_by,
          payerName: `${payer.first_name} ${payer.last_name}`,
          amount: payment.amount,
          organizationName: organization.name,
        });
      } catch (error) {
        console.error('Error creating notification:', error);
      }
    }
  }

  // Update the last checked timestamp
  if (newPayments.length > 0 && organization.created_by) {
    const { error: updateError } = await supabase
      .from("payment_checks")
      .upsert({
        user_id: organization.created_by,
        organization_id: parseInt(id),
        last_checked_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (updateError) {
      console.error('Error updating payment check:', updateError);
    }
  }

  // Transform payers data with payment status
  const payersWithStatus: PayerWithPaymentStatus[] = organization.references
    .map((reference) => {
      if (!reference.payers) return null;
      const payer = reference.payers;
      
      const payerPayments =
        payments?.filter((payment) => payment.payer_id === payer.user_id) || [];
      const lastPayment = payerPayments[0];
      const lastPaymentDate = lastPayment ? new Date(lastPayment.date) : null;

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
        ...payer,
        reference: reference.reference_details || 'N/A',
        lastPaymentDate,
        paymentStatus,
      };
    })
    .filter((payer): payer is PayerWithPaymentStatus => payer !== null);

  return {
    organization: organization as OrganizationWithReferences,
    payersWithStatus,
  };
}

function StatCard({
  title,
  description,
  value,
}: {
  title: string;
  description: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p
          className={`${typeof value === "number" ? "text-3xl" : "text-xl"} font-bold`}
        >
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export default async function OrganizationPage({
  params,
}: {
  params: { id: string };
}) {
  const { organization, payersWithStatus } = await getOrganizationData(
    params.id
  );

  if (!organization) {
    notFound();
  }

  const activePayers = payersWithStatus.filter(
    (payer) => payer.paymentStatus === "Paid"
  ).length;

  const stats = [
    {
      title: "Total Payers",
      description: "Number of payers in this organization",
      value: payersWithStatus.length,
    },
    {
      title: "Active Payers",
      description: "Number of active payers",
      value: activePayers,
    },
    {
      title: "Created At",
      description: "Date the organization was created",
      value: organization.created_at 
        ? new Date(organization.created_at).toLocaleDateString(undefined, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })
        : "N/A",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            description={stat.description}
            value={stat.value}
          />
        ))}
      </div>

      {/* <Card>
        <CardHeader>
          <CardTitle>Payers</CardTitle>
          <CardDescription>Manage payers for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <PayersTable payers={payersWithStatus} organizationId={params.id} />
        </CardContent>
      </Card> */}

      <div className="space-y-4">
        <UnallocatedPaymentsTable organizationId={parseInt(params.id)} />
        <Separator className="my-4" />
        <PaymentsTable organizationId={parseInt(params.id)} />
      </div>
    </div>
  );
}
