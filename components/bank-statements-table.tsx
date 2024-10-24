"use client";

import React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreVertical,
  Trash2,
  Download,
  Edit,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useGetOrganizationBankStatements } from "@/lib/supabase/hooks/useBankStatement";
import { useGetAnyAdminProfileById } from "@/lib/supabase/hooks/useUser";

interface FileData {
  file_id: number;
  file_path: string;
  file_type: string;
  organization_id: number;
  processed: boolean;
  uploaded_at: string;
  uploaded_by: string;
}

const columnHelper = createColumnHelper<FileData>();

const UploaderCell = ({ userId }: { userId: string }) => {
  const { data: profile, isLoading, error } = useGetAnyAdminProfileById(userId);

  if (isLoading) return <span>Loading...</span>;
  if (error) return <span>Error loading profile</span>;
  if (!profile) return <span>Unknown user</span>;

  return (
    <Tooltip>
      <TooltipTrigger>
        <Badge
          variant={"secondary"}
        >{`${profile.first_name} ${profile.last_name}`}</Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{profile.email}</p>
      </TooltipContent>
    </Tooltip>
  );
};

const columns = [
  columnHelper.accessor("file_path", {
    header: "File Name",
    cell: (info) => info.getValue().split("/").pop(),
  }),
  columnHelper.accessor("file_type", {
    header: "Type",
  }),
  columnHelper.accessor("uploaded_by", {
    header: "Uploaded By",
    cell: (info) => <UploaderCell userId={info.getValue()} />,
  }),
  columnHelper.accessor("uploaded_at", {
    header: "Uploaded At",
    cell: (info) => new Date(info.getValue()).toLocaleString(),
  }),
  columnHelper.accessor("processed", {
    header: "Status",
    cell: (info) => (
      <Badge
        className={cn({
          "border-green-600 text-green-600 bg-green-100": info.getValue(),
          "border-yellow-500 text-yellow-600 bg-yellow-100": !info.getValue(),
        })}
        variant="outline"
      >
        {info.getValue() ? "Processed" : "Pending"}
      </Badge>
    ),
  }),
  columnHelper.accessor("file_id", {
    header: "Actions",
    cell: (info) => <FileActions file={info.row.original} />,
  }),
];

const FileActions = ({ file }: { file: FileData }) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="h-8 w-8 p-0">
        <span className="sr-only">Open menu</span>
        <MoreVertical className="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuLabel>Actions</DropdownMenuLabel>
      <DropdownMenuItem
        onClick={() => navigator.clipboard.writeText(file.file_id.toString())}
      >
        Copy file ID
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => alert(`Download ${file.file_path}`)}>
        <Download className="mr-2 h-4 w-4" /> Download file
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => alert(`Edit ${file.file_path}`)}>
        <Edit className="mr-2 h-4 w-4" /> Edit file details
      </DropdownMenuItem>
      <DropdownMenuItem onClick={() => alert(`Delete ${file.file_path}`)}>
        <Trash2 className="mr-2 w-4 h-4" /> Delete file
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

export function FilesTable({ organization_id }: { organization_id: number }) {
  const { data, error, isLoading } =
    useGetOrganizationBankStatements(organization_id);

  const table = useReactTable({
    data: data || [],
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: {
      pagination: {
        pageSize: 10,
      },
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!data || data.length === 0) {
    return <div>No files uploaded</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder ? null : (
                    <div
                      {...{
                        className: header.column.getCanSort()
                          ? "cursor-pointer select-none"
                          : "",
                        onClick: header.column.getToggleSortingHandler(),
                      }}
                    >
                      {flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                      {{
                        asc: <ChevronUp className="ml-2 h-4 w-4" />,
                        desc: <ChevronDown className="ml-2 h-4 w-4" />,
                      }[header.column.getIsSorted() as string] ?? null}
                    </div>
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
