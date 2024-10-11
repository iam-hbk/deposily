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
} from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/payers", label: "Payers", icon: Users },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/statements", label: "Statements", icon: FileText },
  { href: "/organizations", label: "Organizations", icon: Building },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col w-64 bg-background border-r">
      <div className="p-4 text-2xl font-bold text-primary">Deposily</div>
      <div className="space-y-1">
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
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </div>
    </nav>
  );
}
