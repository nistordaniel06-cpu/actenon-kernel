"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, Users, Flame, Star, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/barber", label: "Agendă", icon: CalendarDays },
  { href: "/barber/clients", label: "Clienți", icon: Users },
  { href: "/barber/boost", label: "Boost", icon: Flame },
  { href: "/barber/reviews", label: "Recenzii", icon: Star },
  { href: "/profile", label: "Profil", icon: User },
] as const;

export function BarberBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-1">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/barber" ? pathname === "/barber" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <Icon
                className={cn("size-6 transition-colors", active ? "text-accent" : "text-muted-foreground")}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
