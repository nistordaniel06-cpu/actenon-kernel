"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Lock, Scissors } from "lucide-react";
import { useRouter } from "next/navigation";

import { currentUser } from "@/lib/mock/user";
import { getSalon } from "@/lib/mock/salons";
import { getService } from "@/lib/mock/services";
import { getBarber } from "@/lib/mock/barbers";
import { shopProducts } from "@/lib/mock/shop";
import { useAppStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { formatDayMonth } from "@/lib/utils";

const TECH_NOTES: Record<string, string[]> = {
  "svc-2": ["Fade jos, contur precis", "Sus: foarfecă, 5 cm", "Barbă: contur natural"],
  "svc-1": ["Tuns clasic, cu foarfeca", "Lungime medie păstrată"],
  "svc-5": ["Fade + barbă aranjată", "Ceară mată la finisare"],
};

export default function StylePassportPage() {
  const router = useRouter();
  const appointments = useAppStore((s) => s.appointments);

  const history = appointments
    .filter((a) => a.clientName === currentUser.name && a.status === "finalizat")
    .sort((a, b) => b.startIso.localeCompare(a.startIso));

  const last = history[0];
  const lastSalon = last ? getSalon(last.salonId) : null;
  const lastService = last ? getService(last.serviceId) : null;
  const lastBarber = last ? getBarber(last.barberId) : null;
  const favoriteProduct = shopProducts[0];

  const nextVisit = last ? new Date(new Date(last.startIso).getTime() + 21 * 86_400_000) : null;

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-full bg-surface-2">
            <ArrowLeft className="size-4" />
          </button>
          <h1 className="text-lg font-semibold">Style Passport</h1>
        </div>
        <Lock className="size-4 text-muted-foreground" />
      </div>

      {!last || !lastSalon || !lastService ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
          <Scissors className="size-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            După prima ta programare finalizată, aici vei găsi istoricul tunsorilor.
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <p className="text-xs font-medium text-muted-foreground">
              Ultimul tuns · {formatDayMonth(last.startIso)} · {lastSalon.name}
            </p>
            <div className="flex gap-3">
              <div className="relative size-24 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                <Image src={lastSalon.coverImage} alt={lastService.name} fill sizes="96px" className="object-cover" />
              </div>
              <div className="flex-1 rounded-xl bg-surface-2 p-3">
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Note tehnice
                </p>
                <ul className="flex flex-col gap-1 text-sm">
                  {(TECH_NOTES[lastService.id] ?? [lastService.name]).map((note) => (
                    <li key={note}>• {note}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
              <span className="text-muted-foreground">Produs preferat</span>
              <span className="font-medium">{favoriteProduct.name}</span>
            </div>
            {lastBarber && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Frizer</span>
                <span className="font-medium">{lastBarber.name}</span>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-4">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-accent">
              <CheckCircle2 className="size-4" /> Serviciu finalizat cu succes
            </p>
            <p className="text-lg font-semibold">Rezervă următoarea vizită</p>
            {nextVisit && (
              <p className="text-sm text-muted-foreground">
                Recomandat peste <strong className="text-foreground">3 săptămâni</strong> ({formatDayMonth(nextVisit.toISOString())})
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Ca membru, primești <strong>5% reducere</strong> la această programare.
            </p>
            <Link href={`/book/${lastSalon.id}?service=${lastService.id}&barber=${last.barberId}`}>
              <Button className="w-full">Rezervă acum</Button>
            </Link>
          </div>

          {history.length > 1 && (
            <div className="flex flex-col gap-2">
              <h2 className="px-1 text-sm font-semibold">Istoric priviri</h2>
              <div className="no-scrollbar flex gap-2 overflow-x-auto">
                {history.slice(1).map((h) => {
                  const salon = getSalon(h.salonId);
                  if (!salon) return null;
                  return (
                    <div key={h.id} className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2">
                      <Image src={salon.coverImage} alt="" fill sizes="80px" className="object-cover" />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
