"use client";

import { useEffect, useState } from "react";
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
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getCurrentProfile, setProfileRole, signOutSupabase } from "@/lib/supabase/auth";
import { TierBadge } from "@/components/client/tier-badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";

const menuGroups: { title: string; items: { icon: typeof User; label: string; message: string }[] }[] = [
  {
    title: "Cont",
    items: [
      { icon: User, label: "Editează profilul", message: "Editarea profilului va fi disponibilă după conectarea contului real." },
      { icon: CreditCard, label: "Metode de plată", message: "Adăugarea unui card va fi disponibilă la plata online." },
      { icon: Bell, label: "Notificări", message: "Nu ai notificări noi." },
    ],
  },
  {
    title: "Calendar",
    items: [{ icon: CalendarSync, label: "Sincronizare Google & Apple Calendar", message: "Sincronizarea automată se activează în etapa următoare — până atunci, adaugă fiecare programare manual din \"Programările mele\"." }],
  },
  {
    title: "Suport",
    items: [
      { icon: ShieldCheck, label: "Confidențialitate și securitate", message: "Politica de confidențialitate va fi publicată aici." },
      { icon: HelpCircle, label: "Centru de ajutor", message: "Scrie-ne la contact@nearcut.ro pentru orice întrebare." },
    ],
  },
];

export default function ProfilePage() {
  const router = useRouter();
  const points = useAppStore((s) => s.points);
  const setRole = useAppStore((s) => s.setRole);
  const pushToast = useAppStore((s) => s.pushToast);
  const rank = rankForPoints(points);
  const [supabaseEmail, setSupabaseEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    getCurrentProfile().then((profile) => {
      if (!profile) return;
      setSupabaseEmail(profile.email);
      setRole(profile.role);
    });
  }, [setRole]);

  function switchRole(role: Role, href: string) {
    setRole(role);
    if (isSupabaseConfigured() && supabaseEmail) void setProfileRole(role);
    router.push(href);
  }

  function logOut() {
    if (isSupabaseConfigured()) void signOutSupabase();
    router.push("/");
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
          <p className="truncate text-sm text-muted-foreground">{supabaseEmail ?? currentUser.email}</p>
          {supabaseEmail && (
            <p className="mt-0.5 text-[11px] font-medium text-accent">Cont real conectat (Supabase)</p>
          )}
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
            {group.items.map(({ icon: Icon, label, message }) => (
              <button
                key={label}
                onClick={() => pushToast(message)}
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
        onClick={logOut}
        className="flex items-center justify-center gap-2 rounded-2xl border border-destructive/30 py-3.5 text-sm font-semibold text-destructive"
      >
        <LogOut className="size-4" /> Deconectare
      </button>
    </div>
  );
}
