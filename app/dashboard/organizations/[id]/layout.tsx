import { createClient } from "@/lib/supabase/server";
import { OrganizationNav } from "@/components/organization-nav";
import { OrganizationActions } from "@/components/organization-actions";

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

export default async function OrganizationLayout({
  children,
  params,
}: {
  children: React.ReactNode;
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
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold capitalize">{organization.name}</h1>
        <OrganizationActions organization={organization} />
      </div>
      <OrganizationNav organizationId={organization.organization_id.toString()} />

      {children}
    </div>
  );
} 