"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Star } from "lucide-react";

import { BusinessClient } from "@/lib/types";
import { getService } from "@/lib/mock/services";
import { useAppStore } from "@/lib/store";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { formatDateTime, formatPrice, initials } from "@/lib/utils";

export function ClientDetail({ client }: { client: BusinessClient | undefined }) {
  const router = useRouter();
  const appointments = useAppStore((s) => s.appointments);
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  if (!client) {
    return (
      <div className="px-5 pt-[max(env(safe-area-inset-top),1rem)]">
        <p className="text-sm text-muted-foreground">Client negăsit.</p>
      </div>
    );
  }

  const history = appointments
    .filter((a) => a.clientName === client.name)
    .sort((a, b) => b.startIso.localeCompare(a.startIso));

  return (
    <div className="flex flex-col gap-5 px-5 pt-[max(env(safe-area-inset-top),1rem)] pb-8">
      <div className="flex items-center gap-3">
        <button onClick={() => router.back()} className="flex size-9 items-center justify-center rounded-full bg-surface-2">
          <ArrowLeft className="size-4" />
        </button>
        <h1 className="text-lg font-semibold">Detalii client</h1>
      </div>

      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
        <Avatar className="size-14">
          <AvatarImage src={client.avatar} alt={client.name} />
          <AvatarFallback>{initials(client.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{client.name}</p>
          <p className="text-sm text-muted-foreground">
            {client.visits} vizite · {formatPrice(client.totalSpent)} total
          </p>
        </div>
        <Badge variant="soft" className="gap-1">
          <Star className="size-3 fill-accent text-accent" /> preferă {client.favoriteService}
        </Badge>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Istoric programări</h2>
        <div className="flex flex-col gap-2">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nicio programare încă.</p>
          ) : (
            history.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-xl border border-border bg-card p-3 text-sm">
                <div>
                  <p className="font-medium">{getService(a.serviceId)?.name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(a.startIso)}</p>
                </div>
                <span className="font-semibold">{formatPrice(a.price)}</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-semibold text-muted-foreground">Note (vizibile doar echipei)</h2>
        <Textarea
          value={note}
          onChange={(e) => {
            setNote(e.target.value);
            setSaved(false);
          }}
          placeholder="Ex: preferă fade mediu, alergic la anumite produse..."
          rows={3}
        />
        <Button size="sm" variant="outline" onClick={() => setSaved(true)}>
          {saved ? "Notă salvată" : "Salvează nota"}
        </Button>
      </div>
    </div>
  );
}
