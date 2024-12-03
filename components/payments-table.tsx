"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { format } from "date-fns";

// Base type from Supabase response
type PaymentWithPayer = Tables<"payments"> & {
  payer: Tables<"payers">;
};

// Extended type with additional fields
type PaymentWithDetails = PaymentWithPayer & {
  has_reference: boolean;
};

interface PaymentsTableProps {
  organizationId: number;
}

export function PaymentsTable({ organizationId }: PaymentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const supabase = createClient();

  const { data: payments, isLoading } = useQuery({
    queryKey: ["payments", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payments")
        .select(
          `
            *,
            payer:payers!payments_payer_id_fkey (
              first_name,
              last_name,
              email,
              phone_number,
              user_id
            )
          `
        )
        .eq("organization_id", organizationId)
        .order("date", { ascending: false });
      if (error) throw error;

      // Transform the data to include has_reference
      const transformedData: PaymentWithDetails[] = (
        data as PaymentWithPayer[]
      ).map((payment) => ({
        ...payment,
        has_reference: false, // Set this based on your business logic
      }));

      return transformedData;
      // return data;
    },
  });

  const columns: ColumnDef<PaymentWithDetails>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.getValue("date")), "dd/MM/yyyy"),
    },
    {
      accessorKey: "payer",
      header: "Payer",
      cell: ({ row }) => {
        const payer = row.getValue("payer") as Tables<"payers"> | null;
        if (!payer) return "Unknown";
        return (
          <div className="flex flex-col">
            <span className="font-medium">
              {payer.first_name} {payer.last_name}
            </span>
            <span className="text-sm text-gray-500">{payer.email}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "transaction_reference",
      header: "Reference",
      cell: ({ row }) => {
        const reference = row.getValue("transaction_reference") as
          | string
          | null;

        return (
          <div className="flex items-center gap-2">
            <span>{reference}</span>
            {/* {reference && !hasReference && (
              <Badge variant="secondary">New Reference</Badge>
            )} */}
          </div>
        );
      },
    },
    {
      accessorKey: "reference_on_deposit",
      header: "Reference Used on Deposit",
      cell: ({ row }) => {
        const reference = row.getValue("reference_on_deposit") as string | null;

        return (
          <div className="flex items-center gap-2">
            <span>{reference ? reference : "same"}</span>
          </div>
        );
      },
    },
    {
      accessorKey: "payer.phone_number",
      header: "Phone",
      cell: ({ row }) => {
        const payer = row.original.payer;
        return payer?.phone_number || "N/A";
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-GB", {
          style: "currency",
          currency: "ZAR",
        }).format(amount);
        return formatted;
      },
    },
  ];

  const table = useReactTable({
    data: payments || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
    },
  });

  if (isLoading) {
    return <div>Loading payments...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Payments</h2>
        <Button>Add Payment</Button>
      </div>
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
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No payments found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
