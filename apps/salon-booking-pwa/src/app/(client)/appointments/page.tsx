import { CalendarX2 } from "lucide-react";

import { appointments } from "@/lib/mock/user";
import { AppointmentCard } from "@/components/client/appointment-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AppointmentsPage() {
  const upcoming = appointments
    .filter((a) => a.status === "upcoming")
    .sort((a, b) => a.startIso.localeCompare(b.startIso));
  const past = appointments
    .filter((a) => a.status !== "upcoming")
    .sort((a, b) => b.startIso.localeCompare(a.startIso));

  return (
    <div className="flex flex-col gap-4 px-5 pt-[max(env(safe-area-inset-top),1rem)]">
      <h1 className="text-xl font-semibold">My appointments</h1>

      <Tabs defaultValue="upcoming">
        <TabsList className="w-full">
          <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
        </TabsList>
        <TabsContent value="upcoming" className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <EmptyState label="No upcoming appointments yet." />
          ) : (
            upcoming.map((a) => <AppointmentCard key={a.id} appointment={a} />)
          )}
        </TabsContent>
        <TabsContent value="past" className="flex flex-col gap-3">
          {past.length === 0 ? (
            <EmptyState label="Your booking history will show up here." />
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
