import { createClient } from "@/lib/supabase/server";
import { InfoIcon } from "lucide-react";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Building } from "lucide-react";

async function getDashboardData(userId: string) {
  const supabase = createClient();

  const [
    { count: payersCount },
    { count: paymentsCount },
    { count: organizationsCount },
  ] = await Promise.all([
    supabase
      .from("payers")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("created_by", userId),
  ]);

  return {
    totalPayers: payersCount || 0,
    totalPayments: paymentsCount || 0,
    totalOrganizations: organizationsCount || 0,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const { totalPayers, totalPayments, totalOrganizations } = await getDashboardData(user.id);

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
      </div>
    </div>
  );
}