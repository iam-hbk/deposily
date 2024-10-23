// app/dashboard/organizations/page.tsx
import { createClient } from "@/lib/supabase/server";
import { Organizations as ClientOrgComp } from "@/components/organizations-page";

export default async function OrganizationsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view organizations.</div>;
  }

  return <ClientOrgComp userId={user.id} />;
}