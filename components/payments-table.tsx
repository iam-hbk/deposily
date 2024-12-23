"use client";

import { formatDistanceToNow } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";
import { type Tables } from "@/lib/supabase/database.types";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

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

interface PaymentsTableProps {
  data?: PaymentWithPayer[];
  organizationId?: number;
}

const columns: ColumnDef<PaymentWithPayer>[] = [
  {
    accessorKey: "payer",
    header: "Payer",
    cell: ({ row }) => {
      const payer = row.original.payer;
      return payer ? `${payer.first_name} ${payer.last_name || ''}` : 'N/A';
    },
  },
  {
    accessorKey: "amount",
    header: "Amount",
    cell: ({ row }) => `$${row.original.amount}`,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: () => (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        completed
      </span>
    ),
  },
  {
    accessorKey: "created_at",
    header: "Date",
    cell: ({ row }) => {
      const date = row.original.created_at;
      return date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : 'N/A';
    },
  },
];

export function PaymentsTable({ data, organizationId }: PaymentsTableProps) {
  const [payments, setPayments] = useState<PaymentWithPayer[]>(data || []);
  const [isLoading, setIsLoading] = useState(!data && !!organizationId);

  useEffect(() => {
    if (organizationId && !data) {
      const fetchPayments = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const { data: paymentsData } = await supabase
          .from("payments")
          .select(`
            *,
            payer:payer_id (*)
          `)
          .eq("organization_id", organizationId)
          .order("created_at", { ascending: false });

        if (paymentsData) {
          const typedPayments = paymentsData.map(payment => ({
            ...payment,
            payer: payment.payer ? (payment.payer as unknown as PayerDetails) : null
          }));
          setPayments(typedPayments);
        }
        setIsLoading(false);
      };

      fetchPayments();
    } else if (data) {
      setPayments(data);
    }
  }, [organizationId, data]);

  const table = useReactTable({
    data: payments,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  if (isLoading) {
    return <div className="py-8 text-center">Loading payments...</div>;
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
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && "selected"}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
