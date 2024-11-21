import { NewPayerForm } from "@/components/new-payer-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function NewPayerPage({
  searchParams,
}: {
  searchParams: { reference?: string; organizationId?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  if (!searchParams.organizationId) {
    redirect("/dashboard/organizations");
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Add New Payer</h1>
      <NewPayerForm 
        reference={searchParams.reference}
        organizationId={parseInt(searchParams.organizationId)}
      />
    </div>
  );
} 