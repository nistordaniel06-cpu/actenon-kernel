import { Appointment, BusinessClient, StatPoint } from "@/lib/types";

import { daysAgo } from "./time";

function todayAt(hour: number, minute = 0) {
  const dt = new Date();
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}
function addMin(iso: string, mins: number) {
  return new Date(new Date(iso).getTime() + mins * 60_000).toISOString();
}

export const businessClients: BusinessClient[] = [
  { id: "bc-1", name: "Andrei Popa", avatar: "/images/avatars/5.png", visits: 14, lastVisit: daysAgo(6), totalSpent: 1260, tag: "vip", favoriteService: "Tuns fade" },
  { id: "bc-2", name: "Alina Moraru", avatar: "/images/avatars/9.png", visits: 8, lastVisit: daysAgo(14), totalSpent: 640, tag: "regular", favoriteService: "Tuns + barbă" },
  { id: "bc-3", name: "Sorin Chiriac", avatar: "/images/avatars/15.png", visits: 2, lastVisit: daysAgo(2), totalSpent: 140, tag: "new", favoriteService: "Tuns clasic" },
  { id: "bc-4", name: "Marius Tudor", avatar: "/images/avatars/22.png", visits: 21, lastVisit: daysAgo(60), totalSpent: 1890, tag: "at-risk", favoriteService: "Bărbierit clasic" },
  { id: "bc-5", name: "Bogdan Oprea", avatar: "/images/avatars/27.png", visits: 5, lastVisit: daysAgo(10), totalSpent: 320, tag: "regular", favoriteService: "Tuns copii" },
  { id: "bc-6", name: "Georgiana Lazăr", avatar: "/images/avatars/36.png", visits: 1, lastVisit: daysAgo(1), totalSpent: 70, tag: "new", favoriteService: "Tuns clasic" },
];

export const salonSeedAppointments: Appointment[] = [
  { id: "sa-1", salonId: "salon-1", barberId: "barber-1", serviceId: "svc-2", clientName: "Andrei Popa", clientAvatar: "/images/avatars/5.png", startIso: todayAt(9), endIso: addMin(todayAt(9), 45), status: "finalizat", price: 80, extras: [] },
  { id: "sa-2", salonId: "salon-1", barberId: "barber-1", serviceId: "svc-1", clientName: "Sorin Chiriac", clientAvatar: "/images/avatars/15.png", startIso: todayAt(10), endIso: addMin(todayAt(10), 40), status: "confirmat", price: 70 },
  { id: "sa-3", salonId: "salon-1", barberId: "barber-1", serviceId: "svc-5", clientName: "Alina Moraru", clientAvatar: "/images/avatars/9.png", startIso: todayAt(13), endIso: addMin(todayAt(13), 60), status: "confirmat", price: 100 },
  { id: "sa-4", salonId: "salon-1", barberId: "barber-2", serviceId: "svc-3", clientName: "Petra Ionică", clientAvatar: "/images/avatars/44.png", startIso: todayAt(14), endIso: addMin(todayAt(14), 25), status: "in-asteptare", price: 45 },
  { id: "sa-5", salonId: "salon-1", barberId: "barber-2", serviceId: "svc-4", clientName: "Marius Tudor", clientAvatar: "/images/avatars/22.png", startIso: todayAt(16), endIso: addMin(todayAt(16), 30), status: "confirmat", price: 55 },
  { id: "sa-6", salonId: "salon-1", barberId: "barber-8", serviceId: "svc-2", clientName: "Georgiana Lazăr", clientAvatar: "/images/avatars/36.png", startIso: todayAt(11), endIso: addMin(todayAt(11), 45), status: "checkin", price: 80 },
];

export const weeklyStats: StatPoint[] = [
  { label: "Lun", revenue: 780, bookings: 8 },
  { label: "Mar", revenue: 690, bookings: 7 },
  { label: "Mie", revenue: 920, bookings: 10 },
  { label: "Joi", revenue: 840, bookings: 9 },
  { label: "Vin", revenue: 1240, bookings: 13 },
  { label: "Sâm", revenue: 1480, bookings: 16 },
  { label: "Dum", revenue: 540, bookings: 6 },
];

export const businessStatsSummary = {
  revenueThisWeek: weeklyStats.reduce((a, b) => a + b.revenue, 0),
  bookingsThisWeek: weeklyStats.reduce((a, b) => a + b.bookings, 0),
  newClientsThisWeek: 5,
  chairUtilization: 78,
  hotDealsFilled: 6,
  avgRating: 4.9,
};
