import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Building } from "lucide-react";



// TODO: Make this right, should pull data based on current user id 
async function getDashboardData() {
  const supabase = createClient();

  const [
    { count: payersCount },
    { count: paymentsCount },
    { count: organizationsCount },
    {
      data: { user },
    },
  ] = await Promise.all([
    supabase.from("payers").select("*", { count: "exact", head: true }),
    supabase.from("payments").select("*", { count: "exact", head: true }),
    supabase.from("organizations").select("*", { count: "exact", head: true }),
    supabase.auth.getUser(),
  ]);

  return {
    totalPayers: payersCount || 0,
    totalPayments: paymentsCount || 0,
    totalOrganizations: organizationsCount || 0,
    user,
  };
}

export default async function dashboardPage() {
  const { totalPayers, totalPayments, totalOrganizations, user } =
    await getDashboardData();

  if (!user) {
    return redirect("/sign-in");
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payers</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayers}</div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Payments</CardTitle>
          <CreditCard className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalPayments}</div>
        </CardContent>
      </Card>
      <Card className="shadow-none">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Total Organizations
          </CardTitle>
          <Building className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalOrganizations}</div>
        </CardContent>
      </Card>
      <div className="flex-1 w-full flex flex-col gap-12 col-span-full">
        <div className="w-full">
          <div className="bg-accent text-sm p-3 px-5 rounded-md text-foreground flex gap-3 items-center">
            <InfoIcon size="16" strokeWidth={2} />
            This is a dashboard page that you can only see as an authenticated
            user
          </div>
        </div>
        <div className="flex flex-col gap-2 items-start">
          <h2 className="font-bold text-2xl mb-4">Your user details</h2>
          <pre className="text-xs font-mono p-3 rounded border max-h-32 overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
