"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight,
  User,
  CreditCard,
  Bell,
  CalendarSync,
  ShieldCheck,
  HelpCircle,
  LogOut,
  Scissors,
  Store,
  BookImage,
} from "lucide-react";

import { currentUser } from "@/lib/mock/user";
import { useAppStore, type Role } from "@/lib/store";
import { rankForPoints } from "@/lib/ranks";
import { TierBadge } from "@/components/client/tier-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const menuGroups: { title: string; items: { icon: typeof User; label: string }[] }[] = [
  {
    title: "Cont",
    items: [
      { icon: User, label: "Editează profilul" },
      { icon: CreditCard, label: "Metode de plată" },
      { icon: Bell, label: "Notificări" },
    ],
  },
  {
    title: "Calendar",
    items: [{ icon: CalendarSync, label: "Sincronizare Google & Apple Calendar" }],
  },
  {
    title: "Suport",
    items: [
      { icon: ShieldCheck, label: "Confidențialitate și securitate" },
      { icon: HelpCircle, label: "Centru de ajutor" },
    ],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const points = useAppStore((s) => s.points);
  const setRole = useAppStore((s) => s.setRole);
  const rank = rankForPoints(points);

  function switchRole(role: Role, href: string) {
    setRole(role);
    router.push(href);
  }

  return (
    <div className="flex flex-col gap-6 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-6">
      <h1 className="text-xl font-semibold">Profil</h1>

      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-16">
          <AvatarImage src={currentUser.avatar} alt={currentUser.name} />
          <AvatarFallback>{initials(currentUser.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="truncate font-semibold">{currentUser.name}</p>
          <p className="truncate text-sm text-muted-foreground">{currentUser.email}</p>
          <TierBadge rank={rank} className="mt-1.5" />
        </div>
      </div>

      <Link
        href="/passport"
        className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
      >
        <div className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-accent">
          <BookImage className="size-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium">Style Passport</p>
          <p className="text-xs text-muted-foreground">Istoricul tunsorilor și preferințele tale</p>
        </div>
        <ChevronRight className="size-4 text-muted-foreground" />
      </Link>

      <div className="flex flex-col gap-2">
        <h2 className="px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Schimbă rolul (demo)
        </h2>
        <button
          onClick={() => switchRole("barber", "/barber")}
          className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 text-left"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-accent">
            <Scissors className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-accent">Sunt frizer</p>
            <p className="text-xs text-muted-foreground">Vezi agenda, clienții și veniturile</p>
          </div>
          <ChevronRight className="size-4 text-accent" />
        </button>
        <button
          onClick={() => switchRole("salonPro", "/salon-pro")}
          className="flex items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4 text-left"
        >
          <div className="flex size-10 items-center justify-center rounded-full bg-surface-2 text-accent">
            <Store className="size-5" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-accent">Administrez un salon</p>
            <p className="text-xs text-muted-foreground">Controlează totul într-un singur loc</p>
          </div>
          <ChevronRight className="size-4 text-accent" />
        </button>
      </div>

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

      <button
        onClick={() => router.push("/")}
        className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive"
      >
        <LogOut className="size-4" /> Deconectare
      </button>
    </div>
  );
}
