"use client";

import { use } from "react";

import { businessClients } from "@/lib/mock/business";
import { ClientDetail } from "@/components/shared/client-detail";

export default function SalonProClientDetailPage({ params }: PageProps<"/salon-pro/clients/[id]">) {
  const { id } = use(params);
  const client = businessClients.find((c) => c.id === id);
  return <ClientDetail client={client} />;
}
