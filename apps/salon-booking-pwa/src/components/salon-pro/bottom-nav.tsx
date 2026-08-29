"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { LayoutDashboard, CalendarDays, Tag, Users, MoreHorizontal, UserCog, Megaphone, FileText, Tablet, ChevronRight } from "lucide-react";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const tabs = [
  { href: "/salon-pro", label: "Dashboard", icon: LayoutDashboard },
  { href: "/salon-pro/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/salon-pro/services", label: "Servicii", icon: Tag },
  { href: "/salon-pro/clients", label: "Clienți", icon: Users },
] as const;

const moreItems = [
  { href: "/salon-pro/staff", label: "Personal, ture, procente", icon: UserCog },
  { href: "/salon-pro/campaigns", label: "Campanii & giveaway", icon: Megaphone },
  { href: "/salon-pro/reports", label: "Facturi & rapoarte", icon: FileText },
  { href: "/salon-pro/checkin", label: "Mod tabletă check-in", icon: Tablet },
] as const;

export function SalonProBottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const moreActive = moreItems.some((m) => pathname.startsWith(m.href));

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.5rem)] md:hidden">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
          {tabs.map(({ href, label, icon: Icon }) => {
            const active = href === "/salon-pro" ? pathname === "/salon-pro" : pathname.startsWith(href);
            return (
              <Link key={href} href={href} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium">
                <Icon className={cn("size-6", active ? "text-accent" : "text-muted-foreground")} strokeWidth={active ? 2.4 : 2} />
                <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
              </Link>
            );
          })}
          <button onClick={() => setMoreOpen(true)} className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium">
            <MoreHorizontal className={cn("size-6", moreActive ? "text-accent" : "text-muted-foreground")} />
            <span className={cn(moreActive ? "text-foreground" : "text-muted-foreground")}>Mai mult</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>Mai multe secțiuni</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-1 px-5 pb-6">
            {moreItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMoreOpen(false)}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3.5"
              >
                <Icon className="size-4.5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
