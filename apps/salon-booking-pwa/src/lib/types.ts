export type ServiceCategory = "hair" | "beard" | "color" | "spa" | "kids" | "combo";

export interface Service {
  id: string;
  name: string;
  category: ServiceCategory;
  durationMin: number;
  price: number;
  description?: string;
}

export interface Barber {
  id: string;
  salonId: string;
  name: string;
  avatar: string;
  title: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  specialties: string[];
  availableNow: boolean;
  nextSlotIso?: string;
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  comment: string;
  date: string;
  serviceName: string;
}

export type DealBadge = "hot" | "last-minute" | "new-client" | null;

export interface Deal {
  id: string;
  salonId: string;
  title: string;
  discountPercent: number;
  startIso: string;
  endIso: string;
  serviceId: string;
  seatsLeft: number;
}

export interface Salon {
  id: string;
  name: string;
  type: "salon" | "barbershop";
  coverImage: string;
  gallery: string[];
  logo: string;
  rating: number;
  reviewCount: number;
  distanceKm: number;
  address: string;
  lat: number;
  lng: number;
  priceLevel: 1 | 2 | 3;
  availableNow: boolean;
  nextAvailableIso: string;
  openNowUntil: string;
  tags: string[];
  services: Service[];
  barberIds: string[];
  hasHotDeal: boolean;
}

export type AppointmentStatus = "upcoming" | "completed" | "cancelled";

export interface Appointment {
  id: string;
  salonId: string;
  barberId: string;
  serviceId: string;
  startIso: string;
  endIso: string;
  status: AppointmentStatus;
  price: number;
  pointsEarned?: number;
}

export type RewardTier = "Bronze" | "Silver" | "Gold" | "Premiere";

export interface RewardActivity {
  id: string;
  label: string;
  points: number;
  date: string;
}

export interface ClientProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  points: number;
  tier: RewardTier;
  referralCode: string;
  memberSince: string;
}

export interface BusinessClient {
  id: string;
  name: string;
  avatar: string;
  visits: number;
  lastVisit: string;
  totalSpent: number;
  tag: "new" | "regular" | "vip" | "at-risk";
  favoriteService: string;
}

export interface StatPoint {
  label: string;
  revenue: number;
  bookings: number;
}

export interface CalendarBooking {
  id: string;
  clientName: string;
  clientAvatar: string;
  serviceName: string;
  barberId: string;
  startIso: string;
  endIso: string;
  status: "confirmed" | "pending" | "hot-deal";
  price: number;
}
