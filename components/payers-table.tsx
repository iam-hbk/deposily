"use client";

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
import { MoreVertical, Trash2 } from "lucide-react";
import { PayerWithReferences } from "@/lib/supabase/database.types";

export function PayersTable({ payers }: { payers: PayerWithReferences[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {payers.map((payer) => (
          <TableRow key={payer.user_id}>
            <TableCell className="font-medium capitalize">{`${payer.first_name} ${payer.last_name}`}</TableCell>
            <TableCell>{payer.email}</TableCell>
            <TableCell>
              {/* {payer.status} */}
              last paid
            </TableCell>
            <TableCell className="text-right">
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
                    onClick={() => navigator.clipboard.writeText(payer.user_id)}
                  >
                    Copy payer ID
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => alert(`Edit ${payer.first_name}`)}
                  >
                    Edit payer
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      alert(`Delete ${payer.first_name} ${payer.last_name}`)
                    }
                  >
                    <Trash2 className="mr-2 w-4 h-4" /> Delete payer
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
