import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  CreditCard,
  Building,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { PaymentsTable } from "@/components/payments-table";
import { type Tables } from "@/lib/supabase/database.types";

type PayerDetails = Tables<"payers">;

type PaymentWithPayer = {
  amount: number;
  bank_statement_id: number;
  created_at: string | null;
  date: string;
  organization_id: number | null;
  payer_id: string | null;
  payment_id: number;
  reference_on_deposit: string | null;
  transaction_reference: string;
  updated_at: string | null;
  payer: PayerDetails | null;
};

interface PayerWithOrg {
  email: string;
  first_name: string;
  last_name: string | null;
  organization_id: number | null;
  phone_number: string;
  user_id: string;
  created_at: string;
  organization: {
    name: string;
    organization_id: number;
  };
}

interface PayerResponse {
  email: string;
  first_name: string;
  last_name: string | null;
  organization_id: number | null;
  phone_number: string;
  user_id: string;
  created_at: string | null;
  organization: {
    name: string;
    organization_id: number;
  };
}

type DashboardData = {
  totalPayers: number;
  totalPayments: number;
  totalOrganizations: number;
  recentPayments: PaymentWithPayer[];
  recentPayers: PayerWithOrg[];
};

async function getDashboardData(userId: string): Promise<DashboardData> {
  const supabase = createClient();

  // First get the organizations managed by the user
  const { data: userOrgs } = await supabase
    .from("organizations")
    .select("organization_id")
    .eq("created_by", userId);

  const orgIds = userOrgs?.map((org) => org.organization_id) || [];

  if (orgIds.length === 0) {
    return {
      totalPayers: 0,
      totalPayments: 0,
      totalOrganizations: 0,
      recentPayments: [],
      recentPayers: [],
    };
  }

  const [
    { count: payersCount },
    { count: paymentsCount },
    { count: organizationsCount },
    { data: paymentsData },
    { data: payersData },
  ] = await Promise.all([
    supabase
      .from("payers")
      .select("*", { count: "exact", head: true })
      .in("organization_id", orgIds),
    supabase
      .from("payments")
      .select("*", { count: "exact", head: true })
      .in("organization_id", orgIds),
    supabase
      .from("organizations")
      .select("*", { count: "exact", head: true })
      .eq("created_by", userId),
    supabase
      .from("payments")
      .select(
        `
        *,
        payer:payer_id (*)
      `
      )
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false })
      .limit(5),
    // Get recent payers with their organization info
    supabase
      .from("payers")
      .select(
        `
        *,
        organization:organizations!inner (
          name,
          organization_id
        )
      `
      )
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  console.log("payersData", payersData);

  const typedPayments = (paymentsData || []).map((payment) => ({
    ...payment,
    payer: payment.payer ? (payment.payer as unknown as PayerDetails) : null,
  }));

  const recentPayers = ((payersData || []) as unknown as PayerResponse[]).map(
    (payer) => ({
      ...payer,
      created_at: payer.created_at || new Date().toISOString(),
    })
  ) as PayerWithOrg[];

  return {
    totalPayers: payersCount || 0,
    totalPayments: paymentsCount || 0,
    totalOrganizations: organizationsCount || 0,
    recentPayments: typedPayments,
    recentPayers,
  };
}

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/sign-in");
  }

  const {
    totalPayers,
    totalPayments,
    totalOrganizations,
    recentPayments,
    recentPayers,
  } = await getDashboardData(user.id);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayers}</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Payments
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPayments}</div>
            <p className="text-xs text-muted-foreground">
              +12.5% from last month
            </p>
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
            <p className="text-xs text-muted-foreground">
              +3.1% from last month
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$12,234</div>
            <p className="text-xs text-muted-foreground">
              +8.2% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentsTable data={recentPayments} />
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Payers</CardTitle>
            <Button variant="outline" size="sm">
              View all
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {recentPayers.map((payer) => (
                <div
                  key={`${payer.user_id}-${payer.email}`}
                  className="flex items-start space-x-4"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage
                      src={`https://avatar.vercel.sh/${payer.email}`}
                      alt={`${payer.first_name} ${payer.last_name || ""}`}
                    />
                    <AvatarFallback>
                      {payer.first_name[0]}
                      {payer.last_name?.[0] || ""}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium leading-none">
                        {`${payer.first_name} ${payer.last_name || ""}`}
                      </p>
                      {payer.organization && (
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {payer.organization.name}
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{payer.email}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CreditCard className="h-3 w-3" />
                        <span>{payer.phone_number}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="ml-auto">
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {recentPayers.length === 0 && (
                <div className="flex h-[200px] items-center justify-center text-sm text-muted-foreground">
                  No recent payers
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-4">
            <Button className="w-full" variant="outline">
              Add New Payer
            </Button>
            <Button className="w-full" variant="outline">
              Record Payment
            </Button>
            <Button className="w-full" variant="outline">
              Create Organization
            </Button>
            <Button className="w-full" variant="outline">
              Generate Report
            </Button>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Payment Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium">Success Rate</p>
                  <p className="text-2xl font-bold">98.5%</p>
                </div>
                <ArrowUpRight className="h-4 w-4 text-green-500" />
              </div>
              <div className="flex items-center">
                <div className="flex-1">
                  <p className="text-sm font-medium">Failed Payments</p>
                  <p className="text-2xl font-bold">1.5%</p>
                </div>
                <ArrowDownRight className="h-4 w-4 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
