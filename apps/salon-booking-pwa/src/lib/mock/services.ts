import { Service } from "@/lib/types";

export const services: Service[] = [
  { id: "svc-1", name: "Signature Haircut", category: "hair", durationMin: 45, price: 55, description: "Precision cut, wash and style." },
  { id: "svc-2", name: "Skin Fade", category: "hair", durationMin: 40, price: 45, description: "Clean fade with sharp lineup." },
  { id: "svc-3", name: "Beard Sculpt", category: "beard", durationMin: 25, price: 30, description: "Shape, trim and hot towel finish." },
  { id: "svc-4", name: "Hot Towel Shave", category: "beard", durationMin: 30, price: 35 },
  { id: "svc-5", name: "Cut + Beard Combo", category: "combo", durationMin: 60, price: 75, description: "Our most popular package." },
  { id: "svc-6", name: "Full Color", category: "color", durationMin: 90, price: 120 },
  { id: "svc-7", name: "Balayage", category: "color", durationMin: 150, price: 190 },
  { id: "svc-8", name: "Blowout & Style", category: "hair", durationMin: 35, price: 40 },
  { id: "svc-9", name: "Scalp Spa Treatment", category: "spa", durationMin: 30, price: 50 },
  { id: "svc-10", name: "Kids Haircut", category: "kids", durationMin: 25, price: 25 },
  { id: "svc-11", name: "Deluxe Facial", category: "spa", durationMin: 50, price: 80 },
  { id: "svc-12", name: "Buzz Cut", category: "hair", durationMin: 20, price: 25 },
];

export function getService(id: string) {
  return services.find((s) => s.id === id);
}
