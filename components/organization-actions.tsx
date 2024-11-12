"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tables } from "@/lib/supabase/database.types";
import { MoreHorizontal } from "lucide-react";

export function OrganizationActions({
  organization,
}: {
  organization: Tables<"organizations">;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(organization.organization_id.toString())}
        >
          Copy organization ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert("Add new payer")}>
          Add new payer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert("Invite new admin")}>
          Invite new admin
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => alert("Edit organization")}>
          Edit organization
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => alert("Delete organization")}>
          Delete organization
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
