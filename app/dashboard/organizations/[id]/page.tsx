import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PayersTable } from "@/components/payers-table";
import { PaymentsTable } from "@/components/payments-table";
import { UnallocatedPaymentsTable } from "@/components/unallocated-payments-table";
import { Separator } from "@/components/ui/separator";

import { notFound } from "next/navigation";
import { Tables } from "@/lib/supabase/database.types";

export const dynamic = "force-dynamic"; // or use revalidate = 0

type PayerWithPaymentStatus = {
  email: string;
  first_name: string;
  last_name: string | null;
  phone_number: string;
  user_id: string;
} & {
  lastPaymentDate: Date | null;
  paymentStatus: "Paid" | "Pending" | "Owing";
  reference:string;
};

type OrganizationWithReferences = Tables<"organizations"> & {
  references: Array<{
    payers: Tables<"payers"> | null;
    payer_id: string;
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

  // Fetch all payments for this organization's payers
  const payerIds = organization.references
    .map((ref) => ref.payer_id)
    .filter(Boolean);

  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("*")
    .in("payer_id", payerIds)
    .order("date", { ascending: false });

  if (paymentsError) {
    console.error("Error fetching payments:", paymentsError.message);
    return {
      organization: organization as OrganizationWithReferences,
      payersWithStatus: [],
    };
  }

  // Transform payers data with payment status
  const payersWithStatus: PayerWithPaymentStatus[] = organization.references
    .map((reference) => reference.payers)
    .filter((payer): payer is Tables<"payers"> => payer !== null)
    .map((payer) => {
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
        email: payer.email,
        first_name: payer.first_name,
        last_name: payer.last_name,
        phone_number: payer.phone_number,
        user_id: payer.user_id,
        reference: lastPayment.transaction_reference,
        lastPaymentDate,
        paymentStatus,
      };
    });

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
      value: new Date(organization.created_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
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

      <Card>
        <CardHeader>
          <CardTitle>Payers</CardTitle>
          <CardDescription>Manage payers for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <PayersTable payers={payersWithStatus} organizationId={params.id} />
        </CardContent>
      </Card>

      <div className="space-y-4">
        <UnallocatedPaymentsTable organizationId={parseInt(params.id)} />
        <Separator className="my-4" />
        <PaymentsTable organizationId={parseInt(params.id)} />
      </div>
    </div>
  );
}
