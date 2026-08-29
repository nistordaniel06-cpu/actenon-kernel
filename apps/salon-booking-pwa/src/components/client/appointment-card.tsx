"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { MapPin, Home, CalendarPlus } from "lucide-react";

import { Appointment, AppointmentStatus } from "@/lib/types";
import { getSalon } from "@/lib/mock/salons";
import { getBarber } from "@/lib/mock/barbers";
import { getService } from "@/lib/mock/services";
import { useAppStore } from "@/lib/store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReviewForm } from "@/components/client/review-form";
import { downloadIcs } from "@/lib/calendar";
import { formatDateTime, formatPrice } from "@/lib/utils";

export function AppointmentCard({ appointment }: { appointment: Appointment }) {
  const [cancelOpen, setCancelOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const cancelAppointment = useAppStore((s) => s.cancelAppointment);
  const pushToast = useAppStore((s) => s.pushToast);

  const salon = getSalon(appointment.salonId);
  const barber = getBarber(appointment.barberId);
  const service = getService(appointment.serviceId);
  if (!salon || !barber || !service) return null;

  const date = formatDateTime(appointment.startIso);
  const isUpcoming = appointment.status === "confirmat" || appointment.status === "in-asteptare";

  function addToCalendar() {
    downloadIcs({
      uid: `${appointment.id}`,
      title: `${service?.name} la ${salon?.name}`,
      description: `Programare cu ${barber?.name} pentru ${service?.name}.`,
      location: appointment.isHomeService ? appointment.address ?? "" : salon?.address ?? "",
      startIso: appointment.startIso,
      endIso: appointment.endIso,
    });
    pushToast("Programare adăugată în calendar", "success");
  }

  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-3">
          <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-surface-2">
            <Image src={salon.coverImage} alt={salon.name} fill sizes="48px" className="object-cover" />
          </div>
          <div>
            <p className="font-semibold">{salon.name}</p>
            <p className="text-sm text-muted-foreground">{service.name} · {barber.name}</p>
          </div>
        </div>
        <StatusBadge status={appointment.status} />
      </div>

      <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
        <span className="text-muted-foreground">{date}</span>
        <span className="font-semibold">{formatPrice(appointment.price)}</span>
      </div>

      <p className="flex items-center gap-1 text-xs text-muted-foreground">
        {appointment.isHomeService ? <Home className="size-3" /> : <MapPin className="size-3" />}
        {appointment.isHomeService ? appointment.address : salon.address}
      </p>

      {isUpcoming && (
        <div className="flex gap-2 pt-1">
          <Link href={`/book/${salon.id}?service=${service.id}&barber=${barber.id}&reschedule=${appointment.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Reprogramează
            </Button>
          </Link>
          <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={addToCalendar}>
            <CalendarPlus className="size-3.5" /> Calendar
          </Button>
          <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="flex-1 text-destructive hover:bg-destructive/10">
                Anulează
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Anulezi această programare?</DialogTitle>
                <DialogDescription>
                  Locul tău la {salon.name} din {date} va fi eliberat pentru alți clienți.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCancelOpen(false)}>
                  Păstrează programarea
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    cancelAppointment(appointment.id);
                    setCancelOpen(false);
                    pushToast("Programare anulată", "destructive");
                  }}
                >
                  Anulează programarea
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {appointment.status === "finalizat" && !appointment.reviewed && (
        <>
          <Button size="sm" className="w-full" onClick={() => setReviewOpen(true)}>
            Lasă un review
          </Button>
          <ReviewForm
            open={reviewOpen}
            onOpenChange={setReviewOpen}
            appointment={appointment}
            salonName={salon.name}
            serviceName={service.name}
          />
        </>
      )}

      {appointment.status === "finalizat" && appointment.reviewed && (
        <Link href={`/salon/${salon.id}`}>
          <Button variant="outline" size="sm" className="w-full">
            Rezervă din nou
          </Button>
        </Link>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: AppointmentStatus }) {
  if (status === "confirmat") return <Badge variant="success">Confirmată</Badge>;
  if (status === "in-asteptare") return <Badge variant="secondary">În așteptare</Badge>;
  if (status === "checkin") return <Badge variant="soft">Check-in</Badge>;
  if (status === "in-progres") return <Badge variant="soft">În desfășurare</Badge>;
  if (status === "anulat") return <Badge variant="destructive">Anulată</Badge>;
  if (status === "no-show") return <Badge variant="destructive">Neprezentare</Badge>;
  return <Badge variant="secondary">Finalizată</Badge>;
}
