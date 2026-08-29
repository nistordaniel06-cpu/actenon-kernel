import { Deal } from "@/lib/types";

import { inMin } from "./time";

export const deals: Deal[] = [
  {
    id: "deal-1",
    salonId: "salon-1",
    title: "Slot liber la 15:00 — Tuns clasic",
    discountPercent: 30,
    startIso: inMin(90),
    endIso: inMin(135),
    serviceId: "svc-1",
    seatsLeft: 1,
  },
  {
    id: "deal-2",
    salonId: "salon-3",
    title: "Balayage — loc eliberat de ultim moment",
    discountPercent: 20,
    startIso: inMin(200),
    endIso: inMin(350),
    serviceId: "svc-7",
    seatsLeft: 1,
  },
  {
    id: "deal-3",
    salonId: "salon-1",
    title: "Aranjat barbă pentru clienți noi",
    discountPercent: 25,
    startIso: inMin(60),
    endIso: inMin(90),
    serviceId: "svc-3",
    seatsLeft: 2,
  },
];

export function getDealsForSalon(salonId: string) {
  return deals.filter((d) => d.salonId === salonId);
}
