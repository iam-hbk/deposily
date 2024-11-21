import { createClient } from "@/lib/supabase/server";
import { PayersTable } from "@/components/payers-table";
import { NewPayerForm } from "@/components/new-payer-form";

async function getPayers(organizationId: string) {
  const supabase = createClient();

  // const 
  
  //TODO: Select from payments all the users that are under this organization.

  if (error) {
    console.error("Error fetching payers:", error);
    return [];
  }

  return payers;
}

export default async function PayersPage({
  params,
}: {
  params: { id: string };
}) {
  const payers = await getPayers(params.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-col">
        <h2 className="text-2xl font-bold">Payers</h2>
        <NewPayerForm
          organizationId={Number(params.id)}
          reference={undefined}
        />
      </div>
      <PayersTable payers={payers} organizationId={params.id} />
    </div>
  );
}
