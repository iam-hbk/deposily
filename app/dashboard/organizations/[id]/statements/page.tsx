import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FilesTable } from "@/components/bank-statements-table";
import { FileUpload } from "@/components/fileUpload";

async function getOrganization(id: string) {
  const supabase = createClient();
  const { data: organization, error } = await supabase
    .from("organizations")
    .select("*")
    .eq("organization_id", id)
    .single();

  if (error || !organization) {
    console.error("Error fetching organization:", error);
    return null;
  }

  return organization;
}

export default async function StatementsPage({
  params,
}: {
  params: { id: string };
}) {
  const organization = await getOrganization(params.id);

  if (!organization) {
    return <div>Organization not found</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex flex-row justify-between">
          <div>Bank Statements</div>
          <FileUpload organizationId={organization.organization_id} />
        </CardTitle>
        <CardDescription>
          Manage bank statements for this organization
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FilesTable organization_id={organization.organization_id} />
      </CardContent>
    </Card>
  );
} 