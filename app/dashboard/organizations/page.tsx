import { createClient } from "@/lib/supabase/server";
import { Organizations as ClientOrgComp } from "@/components/organizations-page";

const getOrganizationsWithProfiles = async (userId: string) => {
  const supabase = createClient();
  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("created_by", userId);

  if (orgError) {
    console.error("Error fetching organizations:", orgError);
    return { organizations: [], error: orgError };
  } else {
    // Extract unique admin IDs
    const adminIds = [...new Set(organizations.flatMap((org) => org.admins))];

    // Fetch profiles for the unique admin IDs
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .in("id", adminIds);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      return { organizations: [], error: profileError };
    } else {
      // Combine organizations with their respective profiles
      const organizationsWithProfiles = organizations.map((org) => {
        return {
          ...org,
          admins: org.admins?.map((adminId) => {
            const profile = profiles.find((profile) => profile.id === adminId);
            return {
              email: profile?.email || "",
              first_name: profile?.first_name || null,
              id: profile?.id || "",
              last_name: profile?.last_name || null,
              role: profile?.role || null,
              updated_at: profile?.updated_at || null,
            };
          }) || [],
        };
      });

      // console.log("Organizations with profiles:", organizationsWithProfiles);
      return { organizations: organizationsWithProfiles, error: null };
    }
  }
};
export default async function OrganizationsPage() {
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to view organizations.</div>;
  }

  const {organizations,error} = await getOrganizationsWithProfiles(user.id);


  if (error) {
    console.error("Error fetching organizations:", error);
    return (
      <div>
        Error loading organizations. Please try again.
        <pre className="border">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  const cleanedOrganizations = organizations.map((org) => ({
    ...org,
    admins: org.admins?.map((admin) => ({
      ...admin,
    })),
  }));

  return <ClientOrgComp user={user} organizations={cleanedOrganizations} />;
}
