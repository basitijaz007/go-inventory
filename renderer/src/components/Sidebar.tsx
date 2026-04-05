"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ArrowDownToLine,
  ShoppingCart,
  Warehouse,
  BookOpenText,
  FileText,
  Settings,
} from "lucide-react";

interface SidebarProps {
  className?: string;
}

const routes = [
  { label: "Dashboard", href: "/", icon: LayoutDashboard },
  { label: "Products", href: "/products", icon: Package },
  { label: "Stock Entry", href: "/stock", icon: ArrowDownToLine },
  { label: "Sales (POS)", href: "/sales", icon: ShoppingCart },
  { label: "Inventory", href: "/inventory", icon: Warehouse },
  { label: "Ledger", href: "/ledger", icon: BookOpenText },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className={cn("flex flex-col bg-card text-card-foreground gap-4 py-8", className)}>
      <div className="px-6 mb-4">
        <h1 className="text-xl font-bold tracking-tight text-primary">
          Pump Lubricants
          <br />
          Inventory
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1">
        {routes.map((route) => {
          const isActive = pathname === route.href || (route.href !== "/" && pathname?.startsWith(route.href));
          return (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all group",
                isActive 
                  ? "bg-primary text-primary-foreground shadow-sm" 
                  : "hover:bg-muted text-muted-foreground hover:text-foreground"
              )}
            >
              <route.icon className={cn("w-5 h-5", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
              {route.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-6 mt-auto">
        <p className="text-xs text-muted-foreground">Version 1.0.0</p>
      </div>
    </aside>
  );
}
