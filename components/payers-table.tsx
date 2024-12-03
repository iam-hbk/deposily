"use client";

import { Database } from "@/lib/supabase/database-gen.types";
import { format } from "date-fns";
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
  paymentStatus: "Paid" | "Pending" | "Owing";
  reference: string | null;
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
    accessorKey: "reference",
    header: "Reference",
  },
  {
    accessorKey: "paymentStatus",
    header: "Status",
    cell: ({ row }) => (
      <span
        className={`px-2 py-1 rounded-full text-xs ${
          row.original.paymentStatus === "Paid"
            ? "bg-green-100 text-green-800"
            : row.original.paymentStatus === "Pending"
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
}: {
  payers: PayerWithPaymentStatus[] | null;
  organizationId: string;
}) {
  const table = useReactTable({
    data: payers || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

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
