"use client";

import { Database } from "@/lib/supabase/database-gen.types";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { format, differenceInDays } from "date-fns";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Payer = Database["public"]["Tables"]["payers"]["Row"];

type PayerWithPaymentStatus = Payer & {
  lastPaymentDate: Date | null;
  paymentStatus: "paid" | "pending" | "owing";
};

const columns: ColumnDef<PayerWithPaymentStatus>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        {row.original.first_name} {row.original.last_name}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "lastPaymentDate",
    header: "Last Payment",
    cell: ({ row }) => (
      <div>
        {row.original.lastPaymentDate
          ? format(row.original.lastPaymentDate, "dd/MM/yyyy")
          : "No payments"}
      </div>
    ),
  },
  {
    accessorKey: "paymentStatus",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          row.original.paymentStatus === "paid"
            ? "bg-green-100 text-green-800"
            : row.original.paymentStatus === "pending"
              ? "bg-yellow-100 text-yellow-800"
              : "bg-red-100 text-red-800"
        }`}
      >
        {row.original.paymentStatus}
      </span>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: () => <div>{/* Add your action buttons here */}</div>,
  },
];

export function PayersTable({
  payers,
  organizationId,
}: {
  payers: Payer[] | null;
  organizationId: string;
}) {
  const supabase = createClient();

  const { data: payersWithStatus, isLoading } = useQuery({
    queryKey: ["payers-with-status", organizationId],
    queryFn: async () => {
      if (!payers) return [];

      const { data: payments, error } = await supabase
        .from("payments")
        .select("payer_id, date")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false });

      if (error) throw error;

      const payersWithStatus: PayerWithPaymentStatus[] = payers.map((payer) => {
        const lastPayment = payments.find((p) => p.payer_id === payer.user_id);
        const lastPaymentDate = lastPayment ? new Date(lastPayment.date) : null;
        let paymentStatus: "paid" | "pending" | "owing" = "owing";

        if (lastPaymentDate) {
          const daysSinceLastPayment = differenceInDays(
            new Date(),
            lastPaymentDate
          );
          if (daysSinceLastPayment <= 28) {
            paymentStatus = "paid";
          } else if (daysSinceLastPayment <= 32) {
            paymentStatus = "pending";
          }
        }

        return {
          ...payer,
          lastPaymentDate,
          paymentStatus,
        };
      });

      return payersWithStatus;
    },
  });

  const table = useReactTable({
    data: payersWithStatus || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div>Loading payers...</div>;
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
