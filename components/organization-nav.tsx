"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function OrganizationNav({ organizationId }: { organizationId: string }) {
  const pathname = usePathname();

  const links = [
    {
      href: `/dashboard/organizations/${organizationId}`,
      label: "Overview",
    },
    {
      href: `/dashboard/organizations/${organizationId}/statements`,
      label: "Bank Statements",
    },
    {
      href: `/dashboard/organizations/${organizationId}/admins`,
      label: "Admins",
    },
    {
      href: `/dashboard/organizations/${organizationId}/settings`,
      label: "Settings",
    },
  ];

  return (
    <nav className="flex space-x-4 mb-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 rounded-md ${
            pathname === link.href
              ? "bg-primary text-primary-foreground"
              : "hover:bg-muted"
          }`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
} 