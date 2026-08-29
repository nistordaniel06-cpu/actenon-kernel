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
  gallery?: string[];
}

export interface Review {
  id: string;
  author: string;
  avatar: string;
  rating: number;
  quality?: number;
  punctuality?: number;
  cleanliness?: number;
  tags?: string[];
  comment: string;
  date: string;
  serviceName: string;
  verified?: boolean;
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

export type AppointmentStatus =
  | "confirmat"
  | "in-asteptare"
  | "checkin"
  | "in-progres"
  | "finalizat"
  | "anulat"
  | "no-show";

export interface AppointmentExtra {
  productId: string;
  name: string;
  price: number;
}

export interface Appointment {
  id: string;
  salonId: string;
  barberId: string;
  serviceId: string;
  clientName: string;
  clientAvatar: string;
  startIso: string;
  endIso: string;
  status: AppointmentStatus;
  price: number;
  pointsEarned?: number;
  isHomeService?: boolean;
  address?: string;
  travelFee?: number;
  extras?: AppointmentExtra[];
  reviewed?: boolean;
  clientNotes?: string;
}

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
  referralCode: string;
  memberSince: string;
}

export interface ShopProduct {
  id: string;
  name: string;
  category: "pomade" | "beard" | "shampoo" | "tools";
  price: number;
  memberPrice: number;
  image: string;
  description: string;
  pickupOnly?: boolean;
}

export interface BoostCampaign {
  id: string;
  barberId: string;
  startIso: string;
  endIso: string;
  discountPercent: number;
  radiusKm: number;
  budgetLei: number;
  channels: ("instagram" | "whatsapp" | "push")[];
  active: boolean;
}

export interface StaffMember {
  id: string;
  barberId: string;
  shift: string;
  commissionPercent: number;
}

export interface WheelPrize {
  id: string;
  label: string;
  kind: "points" | "discount" | "product";
  value: number;
  color: string;
}

export interface CommunityTitle {
  id: string;
  barberId: string;
  title: string;
  week: string;
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

