import { Barber, BusinessClient, Salon, Service, ShopProduct, StaffMember } from "@/lib/types";
import {
  BarberRow,
  SalonClientRow,
  SalonRow,
  ServiceRow,
  ShopProductRow,
  StaffRow,
} from "@/lib/supabase/types";

// Funcții pure de mapare rând-Postgres → tip din aplicație, refolosite de
// orice strat de citire (server sau, în viitor, browser) fără să depindă de
// vreun client Supabase anume.

const BUCHAREST_REFERENCE = { lat: 44.4325, lng: 26.1039 };

// Distanța nu are încă geolocație reală a device-ului — e calculată față de
// un punct fix din centrul Bucureștiului, ca aproximare până la acea etapă.
export function distanceKmFrom(lat: number, lng: number) {
  const R = 6371;
  const dLat = ((lat - BUCHAREST_REFERENCE.lat) * Math.PI) / 180;
  const dLng = ((lng - BUCHAREST_REFERENCE.lng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((BUCHAREST_REFERENCE.lat * Math.PI) / 180) *
      Math.cos((lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function mapService(row: ServiceRow): Service {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    durationMin: row.duration_min,
    price: Number(row.price),
    description: row.description ?? undefined,
  };
}

export function mapBarber(row: BarberRow): Barber {
  return {
    id: row.id,
    salonId: row.salon_id,
    name: row.name,
    avatar: row.avatar ?? "",
    title: row.title ?? "",
    rating: Number(row.rating),
    reviewCount: row.review_count,
    yearsExperience: row.years_experience,
    specialties: row.specialties,
    availableNow: row.available_now,
    nextSlotIso: row.next_slot_at ?? undefined,
    gallery: row.gallery.length > 0 ? row.gallery : undefined,
  };
}

export function mapSalon(row: SalonRow, services: Service[], barbers: Barber[]): Salon {
  const availableNow = barbers.some((b) => b.availableNow);
  const nextAvailableIso =
    barbers
      .map((b) => b.nextSlotIso)
      .filter((iso): iso is string => Boolean(iso))
      .sort()[0] ?? new Date().toISOString();

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    coverImage: row.cover_image ?? "",
    gallery: row.gallery,
    logo: row.logo ?? "",
    rating: Number(row.rating),
    reviewCount: row.review_count,
    distanceKm: distanceKmFrom(row.lat, row.lng),
    address: row.address,
    lat: row.lat,
    lng: row.lng,
    priceLevel: row.price_level,
    availableNow,
    nextAvailableIso,
    openNowUntil: row.open_now_until ?? "",
    tags: row.tags,
    services,
    barberIds: barbers.map((b) => b.id),
    hasHotDeal: row.has_hot_deal,
  };
}

export function mapShopProduct(row: ShopProductRow): ShopProduct {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    price: Number(row.price),
    memberPrice: Number(row.member_price),
    image: row.image ?? "",
    description: row.description ?? "",
    pickupOnly: row.pickup_only,
  };
}

export function mapStaff(row: StaffRow): StaffMember {
  return {
    id: row.id,
    barberId: row.barber_id,
    shift: row.shift,
    commissionPercent: row.commission_percent,
  };
}

// "tag"-ul clientului nu e stocat — se calculează din tiparul real de vizite,
// nu dintr-o valoare inventată. Reguli simple, documentate aici:
// 0 vizite finalizate → nou; ultima vizită peste 45 de zile → în risc;
// 8+ vizite → VIP; altfel, fidel.
function computeClientTag(visits: number, lastVisitIso: string | null): BusinessClient["tag"] {
  if (visits === 0) return "new";
  if (lastVisitIso) {
    const daysSince = (Date.now() - new Date(lastVisitIso).getTime()) / 86_400_000;
    if (daysSince > 45) return "at-risk";
  }
  if (visits >= 8) return "vip";
  return "regular";
}

export function mapBusinessClient(row: SalonClientRow, favoriteServiceName: string): BusinessClient {
  return {
    id: row.client_id ?? row.client_name,
    name: row.client_name,
    avatar: row.client_avatar ?? "",
    visits: row.visits,
    lastVisit: row.last_visit ?? new Date().toISOString(),
    totalSpent: Number(row.total_spent),
    tag: computeClientTag(row.visits, row.last_visit),
    favoriteService: favoriteServiceName,
  };
}
