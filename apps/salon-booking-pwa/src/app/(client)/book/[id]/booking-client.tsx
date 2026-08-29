"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, Clock, CalendarPlus, CalendarCheck2, PartyPopper } from "lucide-react";

import { Barber, Salon, Service } from "@/lib/types";
import { generateSlots } from "@/lib/mock/slots";
import { StepIndicator } from "@/components/client/step-indicator";
import { Rating } from "@/components/client/rating";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn, formatPrice, initials } from "@/lib/utils";
import { buildGoogleCalendarUrl, downloadIcs } from "@/lib/calendar";

const STEPS = ["Service", "Time", "Confirm"];

export function BookingClient({ salon, barbers }: { salon: Salon; barbers: Barber[] }) {
  const searchParams = useSearchParams();
  const [step, setStep] = useState(0);
  const [serviceId, setServiceId] = useState<string | null>(searchParams.get("service"));
  const [barberId, setBarberId] = useState<string | null>(searchParams.get("barber"));
  const [slotIso, setSlotIso] = useState<string | null>(null);
  const [dayIndex, setDayIndex] = useState(0);
  const [done, setDone] = useState(false);

  const service = salon.services.find((s) => s.id === serviceId) ?? null;
  const barber = barbers.find((b) => b.id === barberId) ?? null;

  const days = useMemo(
    () => (barber ? generateSlots(barber.id, service?.durationMin ?? 30) : []),
    [barber, service],
  );

  const canContinue =
    (step === 0 && !!serviceId) || (step === 1 && !!barberId && !!slotIso) || step === 2;

  function handleContinue() {
    if (step < 2) {
      setStep(step + 1);
    } else {
      setDone(true);
    }
  }

  function handleBack() {
    if (step === 0) return;
    setStep(step - 1);
  }

  if (done && service && barber && slotIso) {
    return (
      <BookingConfirmed
        salon={salon}
        barber={barber}
        service={service}
        slotIso={slotIso}
      />
    );
  }

  return (
    <div className="flex flex-col gap-5 pb-32 pt-[max(env(safe-area-inset-top),1rem)]">
      <div className="flex items-center gap-3 px-5">
        <button
          onClick={handleBack}
          className="flex size-9 items-center justify-center rounded-full bg-secondary"
        >
          <ChevronLeft className="size-5" />
        </button>
        <div className="min-w-0">
          <h1 className="truncate font-semibold">{salon.name}</h1>
          <p className="text-xs text-muted-foreground">Booking · Step {step + 1} of 3</p>
        </div>
      </div>

      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <div className="flex flex-col gap-2 px-5">
          <h2 className="text-lg font-semibold">Choose a service</h2>
          {salon.services.map((s) => (
            <button
              key={s.id}
              onClick={() => setServiceId(s.id)}
              className={cn(
                "flex items-center justify-between rounded-2xl border p-4 text-left transition-colors",
                serviceId === s.id ? "border-accent bg-accent/10" : "border-border bg-card",
              )}
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="size-3" /> {s.durationMin} min
                </p>
              </div>
              <p className="font-semibold">{formatPrice(s.price)}</p>
            </button>
          ))}
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4 px-5">
          <div>
            <h2 className="mb-2 text-lg font-semibold">Choose your barber</h2>
            <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setBarberId(b.id);
                    setSlotIso(null);
                  }}
                  className={cn(
                    "flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border p-2.5 w-24",
                    barberId === b.id ? "border-accent bg-accent/10" : "border-border bg-card",
                  )}
                >
                  <Avatar className="size-12">
                    <AvatarImage src={b.avatar} alt={b.name} />
                    <AvatarFallback>{initials(b.name)}</AvatarFallback>
                  </Avatar>
                  <span className="truncate text-xs font-medium">{b.name.split(" ")[0]}</span>
                  <Rating value={b.rating} />
                </button>
              ))}
            </div>
          </div>

          {barber && (
            <div>
              <h2 className="mb-2 text-lg font-semibold">Pick a time</h2>
              <div className="no-scrollbar mb-3 flex gap-2 overflow-x-auto">
                {days.map((d, i) => (
                  <button
                    key={d.dateIso}
                    onClick={() => setDayIndex(i)}
                    className={cn(
                      "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium",
                      dayIndex === i
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border bg-card",
                    )}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {days[dayIndex]?.slots.map(({ iso, available }) => (
                  <button
                    key={iso}
                    disabled={!available}
                    onClick={() => setSlotIso(iso)}
                    className={cn(
                      "rounded-xl border py-2 text-sm font-medium transition-colors",
                      !available && "cursor-not-allowed border-border/50 text-muted-foreground/40 line-through",
                      available && slotIso !== iso && "border-border bg-card",
                      available && slotIso === iso && "border-accent bg-accent text-accent-foreground",
                    )}
                  >
                    {new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(
                      new Date(iso),
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {step === 2 && service && barber && slotIso && (
        <div className="flex flex-col gap-4 px-5">
          <h2 className="text-lg font-semibold">Confirm your booking</h2>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="relative size-12 overflow-hidden rounded-xl bg-secondary">
                <Image src={salon.coverImage} alt={salon.name} fill sizes="48px" className="object-cover" />
              </div>
              <div>
                <p className="font-semibold">{salon.name}</p>
                <p className="text-xs text-muted-foreground">{salon.address}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-3 text-sm">
              <span className="text-muted-foreground">Barber</span>
              <span className="font-medium">{barber.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium">{service.name}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">When</span>
              <span className="font-medium">
                {new Intl.DateTimeFormat("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                }).format(new Date(slotIso))}
              </span>
            </div>
            <div className="flex items-center justify-between border-t border-border/70 pt-3">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">{formatPrice(service.price)}</span>
            </div>
          </div>
          <div className="rounded-2xl bg-accent/10 p-3.5 text-sm text-accent">
            You&apos;ll earn <strong>{service.price} points</strong> toward your next reward tier.
          </div>
        </div>
      )}

      <div className="fixed inset-x-0 bottom-20 z-30 mx-auto w-full max-w-md px-5">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className="w-full"
          size="lg"
        >
          {step === 2 ? "Confirm booking" : "Continue"}
        </Button>
      </div>
    </div>
  );
}

function BookingConfirmed({
  salon,
  barber,
  service,
  slotIso,
}: {
  salon: Salon;
  barber: Barber;
  service: Service;
  slotIso: string;
}) {
  const endIso = new Date(new Date(slotIso).getTime() + service.durationMin * 60_000).toISOString();
  const event = {
    uid: `${salon.id}-${slotIso}`,
    title: `${service.name} at ${salon.name}`,
    description: `Appointment with ${barber.name} for ${service.name}.`,
    location: salon.address,
    startIso: slotIso,
    endIso,
  };

  return (
    <div className="flex flex-col items-center gap-6 px-6 pb-32 pt-16 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-success/15 text-success">
        <PartyPopper className="size-8" />
      </div>
      <div>
        <h1 className="text-xl font-semibold">Booking confirmed!</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {salon.name} is expecting you.
        </p>
      </div>

      <div className="w-full rounded-2xl border border-border bg-card p-4 text-left">
        <p className="font-semibold">{service.name}</p>
        <p className="text-sm text-muted-foreground">with {barber.name}</p>
        <p className="mt-2 text-sm font-medium">
          {new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(slotIso))}
        </p>
        <p className="text-sm text-muted-foreground">{salon.address}</p>
      </div>

      <div className="flex w-full flex-col gap-2.5">
        <a href={buildGoogleCalendarUrl(event)} target="_blank" rel="noreferrer">
          <Button variant="outline" className="w-full gap-2">
            <CalendarPlus className="size-4" /> Add to Google Calendar
          </Button>
        </a>
        <Button variant="outline" className="w-full gap-2" onClick={() => downloadIcs(event)}>
          <CalendarCheck2 className="size-4" /> Add to Apple Calendar (.ics)
        </Button>
        <Link href="/appointments">
          <Button className="w-full">View my appointments</Button>
        </Link>
      </div>
    </div>
  );
}
