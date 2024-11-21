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

async function getOrganization(id: string) {
  const supabase = createClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select(
      `
      *,
      references (
          payers (
              *
          )
      )
  `
    )
    .eq("organization_id", id)
    .single();

  if (error || !organization) {
    console.error("Error fetching organization:", error);
    return null;
  }

  return organization;
}

export default async function OrganizationPage({
  params,
}: {
  params: { id: string };
}) {
  const organization = await getOrganization(params.id);

  if (!organization) {
    return (
      <div>
        <h1>Organization not found</h1>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Total Payers</CardTitle>
            <CardDescription>
              Number of payers in this organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {organization.references.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Active Payers</CardTitle>
            <CardDescription>Number of active payers</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {/* {
                organization.payers.filter(
                  (payer) => payer.payment_status === "active"
                ).length
              } */}
              0
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Created At</CardTitle>
            <CardDescription>Date the organization was created</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-xl">
              {new Date(organization.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Payers</CardTitle>
          <CardDescription>Manage payers for this organization</CardDescription>
        </CardHeader>
        <CardContent>
          <PayersTable
            payers={
              organization.references
                .map((reference) => reference.payers)
                .filter(Boolean) as {
                email: string;
                first_name: string;
                last_name: string | null;
                phone_number: string;
                user_id: string;
              }[]
            }
            organizationId={params.id}
          />
        </CardContent>
      </Card>

      {/* <PaymentsTable organizationId={parseInt(params.id)} /> */}
      <UnallocatedPaymentsTable organizationId={parseInt(params.id)} />
      <Separator />
      <PaymentsTable organizationId={parseInt(params.id)} />
    </>
  );
}
