import { ShopProduct } from "@/lib/types";

export const shopProducts: ShopProduct[] = [
  {
    id: "prod-1",
    name: "Pomadă Matte Clay",
    category: "pomade",
    price: 89,
    memberPrice: 75,
    image: "/images/salons/gentry-1.jpg",
    description: "Fixare medie, finisaj mat, ideală pentru texturi scurte.",
    pickupOnly: true,
  },
  {
    id: "prod-2",
    name: "Ulei pentru barbă",
    category: "beard",
    price: 79,
    memberPrice: 65,
    image: "/images/salons/darios-1.jpg",
    description: "Hidratare și strălucire, parfum lemnos discret.",
    pickupOnly: true,
  },
  {
    id: "prod-3",
    name: "Șampon revitalizant",
    category: "shampoo",
    price: 69,
    memberPrice: 58,
    image: "/images/salons/lumiere-1.jpg",
    description: "Curățare blândă, potrivit pentru folosire zilnică.",
  },
  {
    id: "prod-4",
    name: "Balsam pentru barbă",
    category: "beard",
    price: 59,
    memberPrice: 49,
    image: "/images/salons/darios-2.jpg",
    description: "Înmoaie firul de păr și reduce mâncărimea.",
  },
  {
    id: "prod-5",
    name: "Ceară pentru styling",
    category: "pomade",
    price: 65,
    memberPrice: 55,
    image: "/images/salons/uptown-1.jpg",
    description: "Fixare puternică, finisaj natural.",
    pickupOnly: true,
  },
  {
    id: "prod-6",
    name: "Foarfecă profesională",
    category: "tools",
    price: 349,
    memberPrice: 299,
    image: "/images/salons/gentry-2.jpg",
    description: "Oțel japonez, folosită de echipa Urban Cuts.",
  },
  {
    id: "prod-7",
    name: "Aparat de tuns 5-în-1",
    category: "tools",
    price: 429,
    memberPrice: 379,
    image: "/images/salons/blackout-1.jpg",
    description: "Kit complet pentru întreținere între programări.",
  },
  {
    id: "prod-8",
    name: "Șampon anti-mătreață",
    category: "shampoo",
    price: 72,
    memberPrice: 62,
    image: "/images/salons/lumiere-2.jpg",
    description: "Formulă cu zinc piritionă, recomandat de coloriști.",
  },
];

export function getProduct(id: string) {
  return shopProducts.find((p) => p.id === id);
}
