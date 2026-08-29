"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Phone, User, Scissors, Store, ChevronRight } from "lucide-react";

import { useAppStore, type Role } from "@/lib/store";
import { Button } from "@/components/ui/button";

const roleCards: { role: Role; href: string; icon: typeof User; title: string; desc: string }[] = [
  { role: "client", href: "/home", icon: User, title: "Sunt client", desc: "Programează și gestionează vizitele." },
  { role: "barber", href: "/barber", icon: Scissors, title: "Sunt frizer", desc: "Gestionează programările și clienții." },
  { role: "salonPro", href: "/salon-pro", icon: Store, title: "Administrez un salon", desc: "Controlează totul într-un singur loc." },
];

export default function WelcomePage() {
  const router = useRouter();
  const setRole = useAppStore((s) => s.setRole);

  function enter(role: Role, href: string) {
    setRole(role);
    router.push(href);
  }

  return (
    <div className="relative flex min-h-dvh flex-col bg-background">
      <div className="relative h-72 w-full shrink-0 overflow-hidden">
        <Image
          src="/images/salons/gentry-room.jpg"
          alt=""
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/10" />
      </div>

      <div className="-mt-16 flex flex-1 flex-col gap-6 px-6 pb-[max(env(safe-area-inset-bottom),1.5rem)]">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-balance">
            Stilul tău, <span className="text-accent">rezervat simplu</span>
          </h1>
        </div>

        <div className="flex flex-col gap-2.5">
          {roleCards.map(({ role, href, icon: Icon, title, desc }) => (
            <button
              key={role}
              onClick={() => enter(role, href)}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 text-left transition-colors active:bg-surface-2"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-surface-2 text-accent">
                <Icon className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-medium">{title}</span>
                <span className="block text-sm text-muted-foreground">{desc}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          SAU CONTINUĂ CU
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="flex flex-col gap-2.5">
          <Button size="lg" className="gap-2" onClick={() => enter("client", "/home")}>
            <Phone className="size-4" /> Continuă cu număr de telefon
          </Button>
          <Button size="lg" variant="secondary" className="gap-2" onClick={() => enter("client", "/home")}>
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden>
              <path d="M16.365 1.43c0 1.14-.462 2.15-1.217 2.909-.83.844-2.18 1.5-3.32 1.412-.135-1.086.44-2.24 1.183-2.99.83-.855 2.24-1.48 3.354-1.33zm3.52 16.66c-.51 1.18-1.13 2.34-2.03 3.34-.79.87-1.66 1.75-2.85 1.77-1.16.02-1.53-.68-2.85-.68-1.32 0-1.73.66-2.83.7-1.14.04-2.01-.94-2.81-1.8-1.65-1.79-2.93-5.05-1.22-7.26 1.83-2.36 4.57-1.35 4.63-1.34.98.02 1.66-.6 2.86-.6 1.16 0 1.7.6 2.87.58 1.9-.03 3.02-1.7 4.24-3.15-.33-.15-2.28-1.34-2.28-3.98-.02-2.15 1.76-3.31 1.85-3.37-1.01-1.48-2.57-1.64-3.11-1.67-1.36-.13-2.63.78-3.31.78-.68 0-1.73-.76-2.85-.74-1.47.02-2.83.85-3.58 2.16-1.53 2.65-.39 6.58 1.1 8.73.73 1.06 1.6 2.25 2.74 2.2 1.09-.04 1.51-.7 2.83-.7 1.32 0 1.7.7 2.86.68 1.18-.02 1.93-1.07 2.66-2.13.34-.5.62-1 .86-1.53z"/>
            </svg>
            Continuă cu Apple
          </Button>
        </div>

        <p className="pb-2 text-center text-xs text-muted-foreground">
          Continuând, accepți{" "}
          <span className="underline underline-offset-2">Termenii</span> și{" "}
          <span className="underline underline-offset-2">Politica de confidențialitate</span>. Autentificarea reală se activează în etapa următoare — acum intri direct în demo.
        </p>
      </div>
    </div>
  );
}
