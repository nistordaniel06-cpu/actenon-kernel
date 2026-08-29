"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  UserCog,
  Tag,
  Megaphone,
  FileText,
  Tablet,
  Store,
} from "lucide-react";

import { myBusinessSalon } from "@/lib/mock/business-context";
import { cn } from "@/lib/utils";

const items = [
  { href: "/salon-pro", label: "Dashboard", icon: LayoutDashboard },
  { href: "/salon-pro/calendar", label: "Calendar echipă", icon: CalendarDays },
  { href: "/salon-pro/clients", label: "Clienți", icon: Users },
  { href: "/salon-pro/staff", label: "Personal", icon: UserCog },
  { href: "/salon-pro/services", label: "Servicii", icon: Tag },
  { href: "/salon-pro/campaigns", label: "Campanii", icon: Megaphone },
  { href: "/salon-pro/reports", label: "Facturi & rapoarte", icon: FileText },
  { href: "/salon-pro/checkin", label: "Check-in tabletă", icon: Tablet },
] as const;

export function SalonProSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card px-4 py-6 md:flex">
      <div className="mb-6 flex items-center gap-2 px-2">
        <div className="flex size-9 items-center justify-center rounded-full bg-surface-2 text-accent">
          <Store className="size-4.5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{myBusinessSalon.name}</p>
          <p className="text-xs text-muted-foreground">Salon Pro</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === "/salon-pro" ? pathname === "/salon-pro" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-accent-soft text-accent" : "text-muted-foreground hover:bg-surface-2 hover:text-foreground",
              )}
            >
              <Icon className="size-4.5" /> {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
