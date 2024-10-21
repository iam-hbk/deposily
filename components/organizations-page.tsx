"use client";

import { useQuery } from "@tanstack/react-query";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MessageSquareTextIcon, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrganizationsTable } from "@/components/organizations-table";
import { AddOrganizationModal } from "@/components/add-organization-dialog";
import { User } from "@supabase/supabase-js";
import { OrganizationWithAdminProfiles } from "@/lib/supabase/database.types";



interface ClientOrganizationsPageProps {
  user: User;
  organizations: OrganizationWithAdminProfiles[];
}

export function Organizations({
  user,
  organizations,
}: ClientOrganizationsPageProps) {
  const {
    data: organizationsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["organizations", user.id],
    queryFn: () => Promise.resolve(organizations),
    initialData: organizations,
  });

  if (!user) {
    return <div>Please log in to view organizations.</div>;
  }

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    console.error("Error fetching organizations:", error);
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
      <OrganizationsTable data={organizationsData} />

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
