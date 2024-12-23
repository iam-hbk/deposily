import { NewPayerForm } from "@/components/new-payer-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { OrganizationSelector } from "@/components/organization-selector";
import { Tables } from "@/lib/supabase/database.types";

async function getUserOrganizations(userId: string): Promise<Tables<"organizations">[]> {
  const supabase = createClient();
  
  // Get organizations created by the user
  const { data: createdOrgs, error: createdError } = await supabase
    .from("organizations")
    .select("*")
    .eq("created_by", userId);

  if (createdError) {
    console.error("Error fetching created organizations:", createdError);
    return [];
  }

  // Get organizations where user is in the admins array
  const { data: adminOrgs, error: adminError } = await supabase
    .from("organizations")
    .select("*")
    .contains('admins', [userId]);

  if (adminError) {
    console.error("Error fetching admin organizations:", adminError);
    return [];
  }

  // Combine both sets of organizations and remove duplicates
  const allOrgs = [...(createdOrgs || []), ...(adminOrgs || [])];
  const uniqueOrgs = allOrgs.filter((org, index, self) =>
    index === self.findIndex((o) => o.organization_id === org.organization_id)
  );

  return uniqueOrgs;
}

export default async function NewPayerPage({
  searchParams,
}: {
  searchParams: { 
    reference?: string; 
    organizationId?: string;
    paymentId?: string;
  };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const organizations = await getUserOrganizations(user.id);

  if (organizations.length === 0) {
    redirect("/dashboard/organizations/new");
  }

  const selectedOrganizationId = searchParams.organizationId && /^\d+$/.test(searchParams.organizationId)
    ? parseInt(searchParams.organizationId)
    : undefined;

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Add New Payer</h1>
      <div className="space-y-6">
        <OrganizationSelector 
          organizations={organizations}
          defaultValue={selectedOrganizationId}
        />
        {selectedOrganizationId && (
          <NewPayerForm 
            reference={searchParams.reference}
            organizationId={selectedOrganizationId}
            paymentId={searchParams.paymentId}
          />
        )}
      </div>
    </div>
  );
} 