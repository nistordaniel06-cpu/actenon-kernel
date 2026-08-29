"use client";

import { CalendarX2 } from "lucide-react";

import { currentUser } from "@/lib/mock/user";
import { useAppStore } from "@/lib/store";
import { AppointmentCard } from "@/components/client/appointment-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppointmentsPage() {
  const appointments = useAppStore((s) => s.appointments);
  const mine = appointments.filter((a) => a.clientName === currentUser.name);

  const upcoming = mine
    .filter((a) => a.status === "confirmat" || a.status === "in-asteptare")
    .sort((a, b) => a.startIso.localeCompare(b.startIso));
  const past = mine
    .filter((a) => !["confirmat", "in-asteptare"].includes(a.status))
    .sort((a, b) => b.startIso.localeCompare(a.startIso));

  return (
    <div className="flex flex-col gap-4 px-5 pt-[max(env(safe-area-inset-top),1rem)]">
      <h1 className="text-xl font-semibold">Programările mele</h1>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming">Viitoare ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Istoric</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <EmptyState label="Nu ai programări viitoare încă." />
          ) : (
            upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)
          )}
        </TabsContent>
        <TabsContent value="past" className="flex flex-col gap-3">
          {past.length === 0 ? (
            <EmptyState label="Istoricul programărilor tale va apărea aici." />
          ) : (
            past.map((a) => <AppointmentCard key={a.id} appointment={a} />)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-14 text-center text-muted-foreground">
      <CalendarX2 className="size-8" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
