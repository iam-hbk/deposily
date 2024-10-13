"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Home,
  Users,
  CreditCard,
  FileText,
  Building,
  Settings,
  NotebookTabs,
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "dashboard", icon: Home },
  { href: "/dashboard/organizations", label: "organizations", icon: Building },
  { href: "/dashboard/statements", label: "statements", icon: FileText },
  { href: "/dashboard/payers", label: "payers", icon: Users },
  { href: "/dashboard/payments", label: "payments", icon: CreditCard },
  { href: "/dashboard/settings", label: "settings", icon: Settings },
  { href: "/dashboard/notes", label: "notes", icon: NotebookTabs },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col w-64 bg-background border-r over h-full">
      <div className="space-y-1 p-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            variant="ghost"
            className={cn(
              "w-full justify-start",
              pathname === item.href && "bg-secondary"
            )}
            asChild
          >
            <Link href={item.href} className="capitalize">
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
