import { Deal } from "@/lib/types";

function inMin(mins: number) {
  return new Date(Date.now() + mins * 60_000).toISOString();
}

export const deals: Deal[] = [
  {
    id: "deal-1",
    salonId: "salon-1",
    title: "Empty 3PM slot — Signature Cut",
    discountPercent: 30,
    startIso: inMin(90),
    endIso: inMin(135),
    serviceId: "svc-1",
    seatsLeft: 1,
  },
  {
    id: "deal-2",
    salonId: "salon-3",
    title: "Last-minute Balayage opening",
    discountPercent: 20,
    startIso: inMin(200),
    endIso: inMin(350),
    serviceId: "svc-7",
    seatsLeft: 1,
  },
  {
    id: "deal-3",
    salonId: "salon-5",
    title: "New client Scalp Spa",
    discountPercent: 25,
    startIso: inMin(60),
    endIso: inMin(90),
    serviceId: "svc-9",
    seatsLeft: 2,
  },
  {
    id: "deal-4",
    salonId: "salon-7",
    title: "Fill our 5PM chair",
    discountPercent: 35,
    startIso: inMin(300),
    endIso: inMin(340),
    serviceId: "svc-2",
    seatsLeft: 1,
  },
];

export function getDealsForSalon(salonId: string) {
  return deals.filter((d) => d.salonId === salonId);
}
