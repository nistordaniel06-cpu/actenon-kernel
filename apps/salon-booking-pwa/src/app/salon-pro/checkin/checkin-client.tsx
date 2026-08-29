"use client";

import { useState } from "react";
import { QrCode, Search, CheckCircle2 } from "lucide-react";

import { Barber, Salon } from "@/lib/types";
import { useAppStore } from "@/lib/store";
import { Appointment } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatShortTime } from "@/lib/utils";

function isToday(iso: string) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

export function CheckinClient({ salon, barbers }: { salon: Salon; barbers: Barber[] }) {
  const [query, setQuery] = useState("");
  const [match, setMatch] = useState<Appointment | null>(null);
  const [checkedIn, setCheckedIn] = useState(false);
  const appointments = useAppStore((s) => s.appointments);
  const updateStatus = useAppStore((s) => s.updateAppointmentStatus);

  const todays = appointments.filter(
    (a) => a.salonId === salon.id && isToday(a.startIso) && a.status !== "anulat",
  );

  function search() {
    const found = todays.find((a) => a.clientName.toLowerCase().includes(query.trim().toLowerCase()));
    setMatch(found ?? null);
    setCheckedIn(false);
  }

  function scanDemo() {
    setMatch(todays[Math.floor(Math.random() * todays.length)] ?? null);
    setCheckedIn(false);
  }

  function confirmArrival() {
    if (!match) return;
    updateStatus(match.id, "checkin");
    setCheckedIn(true);
  }

  const matchService = match ? salon.services.find((s) => s.id === match.serviceId) : null;
  const matchBarber = match ? barbers.find((b) => b.id === match.barberId) : null;

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center gap-6 px-6 py-10 text-center">
      <div>
        <p className="text-sm text-muted-foreground">{salon.name}</p>
        <h1 className="text-2xl font-semibold">Check-in clienți</h1>
      </div>

      <div className="flex w-full max-w-sm flex-col gap-3">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Introdu numele sau telefonul"
          className="text-center text-lg h-14"
        />
        <Button size="lg" className="gap-2" onClick={search}>
          <Search className="size-4" /> Caută programarea
        </Button>
        <Button size="lg" variant="outline" className="gap-2" onClick={scanDemo}>
          <QrCode className="size-4" /> Scanează codul (demo)
        </Button>
      </div>

      {match && (
        <div className="flex w-full max-w-sm flex-col gap-3 rounded-2xl border border-border bg-card p-5 text-left">
          <p className="font-semibold">{match.clientName}</p>
          <p className="text-sm text-muted-foreground">
            {matchService?.name} · {matchBarber?.name} · {formatShortTime(match.startIso)}
          </p>
          {checkedIn ? (
            <p className="flex items-center gap-2 text-sm font-medium text-accent">
              <CheckCircle2 className="size-4" /> Check-in confirmat
            </p>
          ) : (
            <Button onClick={confirmArrival}>Confirmă sosirea</Button>
          )}
        </div>
      )}

      {!match && query && (
        <p className="text-sm text-muted-foreground">Nicio programare găsită pentru azi cu acest nume.</p>
      )}
    </div>
  );
}
