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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Tables } from "@/lib/supabase/database.types";
import { format } from "date-fns";
import { PlusIcon, MoreVertical, UserPlus, UserCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AssignPaymentModal } from "./assign-payement-modal";

interface UnallocatedPaymentsTableProps {
  organizationId: number;
}

export function UnallocatedPaymentsTable({
  organizationId,
}: UnallocatedPaymentsTableProps) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [selectedPayment, setSelectedPayment] =
    useState<Tables<"unallocated_payments"> | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: unallocatedPayments, isLoading } = useQuery({
    queryKey: ["unallocated_payments", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("unallocated_payments")
        .select("*")
        .eq("organization_id", organizationId)
        .order("date", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const columns: ColumnDef<Tables<"unallocated_payments">>[] = [
    {
      accessorKey: "date",
      header: "Date",
      cell: ({ row }) => format(new Date(row.getValue("date")), "dd/MM/yyyy"),
    },
    {
      accessorKey: "transaction_reference",
      header: "Reference",
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
    {
      id: "actions",
      cell: ({ row }) => {
        const payment = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setSelectedPayment(payment)}>
                <span className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4" />
                  Assign
                </span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  router.push(
                    `/dashboard/payers/new?reference=${payment.transaction_reference}&organizationId=${organizationId}&paymentId=${payment.unallocated_payment_id}`
                  )
                }
              >
                <span className="flex items-center gap-2">
                  <UserPlus className="w-4 h-4" />
                  Create Payer
                </span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  const table = useReactTable({
    data: unallocatedPayments || [],
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
    return <div>Loading unallocated payments...</div>;
  }

  return (
    <div className="my-4 flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Unallocated Payments</h2>
        <Button variant="outline">
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Payment
        </Button>
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
                  No unallocated payments found.
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
      {selectedPayment && (
        <AssignPaymentModal
          open={!!selectedPayment}
          onOpenChange={(open) => !open && setSelectedPayment(null)}
          unallocatedPayment={selectedPayment}
          organizationId={organizationId}
          onAssigned={() => {
            queryClient.invalidateQueries({
              queryKey: ["unallocated_payments", organizationId],
            });
            setSelectedPayment(null);
          }}
        />
      )}
    </div>
  );
}
