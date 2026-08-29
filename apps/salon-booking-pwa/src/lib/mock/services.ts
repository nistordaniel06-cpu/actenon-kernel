import { Service } from "@/lib/types";

export const services: Service[] = [
  { id: "svc-1", name: "Tuns clasic", category: "hair", durationMin: 40, price: 70, description: "Tuns, spălat și styling." },
  { id: "svc-2", name: "Tuns fade", category: "hair", durationMin: 45, price: 80, description: "Fade curat cu contur precis." },
  { id: "svc-3", name: "Aranjat barbă", category: "beard", durationMin: 25, price: 45, description: "Conturare, prindere cu prosop cald." },
  { id: "svc-4", name: "Bărbierit clasic", category: "beard", durationMin: 30, price: 55 },
  { id: "svc-5", name: "Tuns + barbă", category: "combo", durationMin: 60, price: 100, description: "Pachetul nostru cel mai cerut." },
  { id: "svc-6", name: "Vopsit complet", category: "color", durationMin: 90, price: 180 },
  { id: "svc-7", name: "Balayage", category: "color", durationMin: 150, price: 260 },
  { id: "svc-8", name: "Styling", category: "hair", durationMin: 30, price: 50 },
  { id: "svc-9", name: "Tratament scalp", category: "spa", durationMin: 30, price: 65 },
  { id: "svc-10", name: "Tuns copii", category: "kids", durationMin: 25, price: 40 },
  { id: "svc-11", name: "Facial deluxe", category: "spa", durationMin: 50, price: 120 },
  { id: "svc-12", name: "Tuns periuță", category: "hair", durationMin: 20, price: 40 },
];

export function getService(id: string) {
  return services.find((s) => s.id === id);
}
