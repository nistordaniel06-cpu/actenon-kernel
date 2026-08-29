import Link from "next/link";
import {
  ChevronRight,
  User,
  CreditCard,
  Bell,
  CalendarSync,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Store,
} from "lucide-react";

import { currentUser } from "@/lib/mock/user";
import { TierBadge } from "@/components/client/tier-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const menuGroups: { title: string; items: { icon: typeof User; label: string }[] }[] = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Edit profile" },
      { icon: CreditCard, label: "Payment methods" },
      { icon: Bell, label: "Notifications" },
    ],
  },
  {
    title: "Calendar",
    items: [{ icon: CalendarSync, label: "Google Calendar & Apple Calendar sync" }],
  },
  {
    title: "Support",
    items: [
      { icon: ShieldCheck, label: "Privacy & security" },
      { icon: HelpCircle, label: "Help center" },
    ],
  },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <h1 className="text-xl font-semibold">Profile</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-16">
          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{currentUser.name}</p>
          <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
          <TierBadge tier={currentUser.tier} className="mt-1.5" />
        </div>
      </div>

      <Link
        href="/business"
        className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent/10 p-4"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-accent/20 text-accent">
          <Store className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-accent">I&apos;m a barber or salon owner</p>
          <p className="text-xs text-muted-foreground">Switch to your business dashboard</p>
        </div>
        <ChevronRight className="size-4 text-accent" />
      </Link>

      {menuGroups.map((group) => (
        <div key={group.title} className="flex flex-col gap-2">
          <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {group.title}
          </h2>
          <div className="flex flex-col rounded-2xl border border-border bg-card px-4">
            {group.items.map(({ icon: Icon, label }) => (
              <button
                key={label}
                className="flex items-center gap-3 border-b border-border/70 py-3.5 text-left last:border-0"
              >
                <Icon className="size-4.5 text-muted-foreground" />
                <span className="flex-1 text-sm font-medium">{label}</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </button>
            ))}
          </div>
        </div>
      ))}

      <button className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive">
        <LogOut className="size-4" /> Sign out
      </button>
    </div>
  );
}
