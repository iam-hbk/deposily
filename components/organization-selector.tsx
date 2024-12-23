"use client";

import { Tables } from "@/lib/supabase/database.types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

interface OrganizationSelectorProps {
  organizations: Tables<"organizations">[];
  defaultValue?: number;
}

export function OrganizationSelector({
  organizations,
  defaultValue,
}: OrganizationSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleOrganizationChange = (organizationId: string) => {
    const params = new URLSearchParams(searchParams);
    params.set("organizationId", organizationId);
    router.push(`/dashboard/payers/new?${params.toString()}`);
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-medium">Select Organization</label>
      <Select
        defaultValue={defaultValue?.toString()}
        onValueChange={handleOrganizationChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select an organization" />
        </SelectTrigger>
        <SelectContent>
          {organizations.map((org) => (
            <SelectItem
              key={org.organization_id}
              value={org.organization_id.toString()}
            >
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
} 