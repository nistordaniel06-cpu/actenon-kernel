"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, CalendarCheck, Gift, User } from "lucide-react";

import { cn } from "@/lib/utils";

const tabs = [
  { href: "/", label: "Home", icon: Home },
  { href: "/explore", label: "Explore", icon: Compass },
  { href: "/appointments", label: "Bookings", icon: CalendarCheck },
  { href: "/rewards", label: "Rewards", icon: Gift },
  { href: "/profile", label: "Profile", icon: User },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-md pb-[max(env(safe-area-inset-bottom),0.5rem)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between px-2">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            >
              <Icon
                className={cn(
                  "size-6 transition-colors",
                  active ? "text-accent" : "text-muted-foreground",
                )}
                strokeWidth={active ? 2.4 : 2}
              />
              <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
