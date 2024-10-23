// components/organizations-page.tsx
"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquareTextIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationsTable } from "@/components/organizations-table";
import { AddOrganizationModal } from "@/components/add-organization-dialog";
import { OrganizationWithAdminProfiles } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";

interface ClientOrganizationsPageProps {
  userId: string;
}

const getOrganizationsWithProfiles = async (userId: string) => {
  const supabase = createClient();
  const { data: organizations, error: orgError } = await supabase
    .from("organizations")
    .select("*")
    .eq("created_by", userId);

  if (orgError) {
    throw new Error("Error fetching organizations");
  }

  const adminIds = [...new Set(organizations.flatMap((org) => org.admins))];

  const { data: profiles, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .in("id", adminIds);

  if (profileError) {
    throw new Error("Error fetching profiles");
  }

  return organizations.map((org) => ({
    ...org,
    admins:
      org.admins?.map((adminId) => {
        const profile = profiles.find((profile) => profile.id === adminId);
        return {
          email: profile?.email || "",
          first_name: profile?.first_name || null,
          id: profile?.id || "",
          last_name: profile?.last_name || null,
          role: profile?.role || null,
        };
      }) || [],
  }));
};

export function Organizations({ userId }: ClientOrganizationsPageProps) {
  const {
    data: organizations,
    isLoading,
    error,
  } = useQuery<OrganizationWithAdminProfiles[], Error>({
    queryKey: ["organizations", userId],
    queryFn: () => getOrganizationsWithProfiles(userId),
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div>
        Error loading organizations. Please try again.
        <pre className="border">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 flex flex-col items-center w-full">
      <div className="flex justify-between items-center mb-6 w-full">
        <h1 className="text-3xl font-bold">Organizations</h1>
        <AddOrganizationModal />
      </div>
      <OrganizationsTable data={organizations || []} />

      {organizations && organizations.length === 0 && (
        <Alert className="max-w-md bg-gray-100">
          <MessageSquareTextIcon className="h-4 w-4" />
          <AlertTitle className="font-bold">
            You don&apos;t have any organizations yet
          </AlertTitle>
          <AlertDescription className="flex flex-col items-start justify-center space-y-3">
            <p>
              Organizations are a way to group your payers, payments and manage
              your team. This is where your organizations will appear. You do
              not have any organizations yet.
            </p>
            <Button size="sm" className="self-end">
              <Plus className="mr-2 h-4 w-4" /> Create Organization
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
