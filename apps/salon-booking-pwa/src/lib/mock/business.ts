import { BusinessClient, CalendarBooking, StatPoint } from "@/lib/types";

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}
function todayAt(hour: number, minute = 0) {
  const dt = new Date();
  dt.setHours(hour, minute, 0, 0);
  return dt.toISOString();
}
function addMin(iso: string, mins: number) {
  return new Date(new Date(iso).getTime() + mins * 60_000).toISOString();
}

export const businessClients: BusinessClient[] = [
  { id: "bc-1", name: "Jordan Park", avatar: "/images/avatars/5.png", visits: 14, lastVisit: daysAgo(6), totalSpent: 840, tag: "vip", favoriteService: "Skin Fade" },
  { id: "bc-2", name: "Alicia Moreno", avatar: "/images/avatars/9.png", visits: 8, lastVisit: daysAgo(14), totalSpent: 480, tag: "regular", favoriteService: "Cut + Beard Combo" },
  { id: "bc-3", name: "Sam Keough", avatar: "/images/avatars/15.png", visits: 2, lastVisit: daysAgo(2), totalSpent: 100, tag: "new", favoriteService: "Signature Haircut" },
  { id: "bc-4", name: "Marcus Tran", avatar: "/images/avatars/22.png", visits: 21, lastVisit: daysAgo(60), totalSpent: 1260, tag: "at-risk", favoriteService: "Hot Towel Shave" },
  { id: "bc-5", name: "Ben Osei", avatar: "/images/avatars/27.png", visits: 5, lastVisit: daysAgo(10), totalSpent: 220, tag: "regular", favoriteService: "Kids Haircut" },
  { id: "bc-6", name: "Grace Liu", avatar: "/images/avatars/36.png", visits: 1, lastVisit: daysAgo(1), totalSpent: 55, tag: "new", favoriteService: "Signature Haircut" },
];

export const calendarBookings: CalendarBooking[] = [
  { id: "cb-1", clientName: "Jordan Park", clientAvatar: "/images/avatars/5.png", serviceName: "Skin Fade", barberId: "barber-1", startIso: todayAt(9), endIso: addMin(todayAt(9), 40), status: "confirmed", price: 45 },
  { id: "cb-2", clientName: "Sam Keough", clientAvatar: "/images/avatars/15.png", serviceName: "Signature Haircut", barberId: "barber-1", startIso: todayAt(10), endIso: addMin(todayAt(10), 45), status: "confirmed", price: 55 },
  { id: "cb-3", clientName: "", clientAvatar: "", serviceName: "Open slot", barberId: "barber-1", startIso: todayAt(11), endIso: addMin(todayAt(11), 45), status: "hot-deal", price: 0 },
  { id: "cb-4", clientName: "Alicia Moreno", clientAvatar: "/images/avatars/9.png", serviceName: "Cut + Beard Combo", barberId: "barber-1", startIso: todayAt(13), endIso: addMin(todayAt(13), 60), status: "confirmed", price: 75 },
  { id: "cb-5", clientName: "Priya S.", clientAvatar: "/images/avatars/44.png", serviceName: "Beard Sculpt", barberId: "barber-2", startIso: todayAt(14), endIso: addMin(todayAt(14), 25), status: "pending", price: 30 },
  { id: "cb-6", clientName: "", clientAvatar: "", serviceName: "Open slot", barberId: "barber-2", startIso: todayAt(15), endIso: addMin(todayAt(15), 40), status: "hot-deal", price: 0 },
  { id: "cb-7", clientName: "Marcus Tran", clientAvatar: "/images/avatars/22.png", serviceName: "Hot Towel Shave", barberId: "barber-2", startIso: todayAt(16), endIso: addMin(todayAt(16), 30), status: "confirmed", price: 35 },
];

export const weeklyStats: StatPoint[] = [
  { label: "Mon", revenue: 420, bookings: 8 },
  { label: "Tue", revenue: 380, bookings: 7 },
  { label: "Wed", revenue: 510, bookings: 10 },
  { label: "Thu", revenue: 460, bookings: 9 },
  { label: "Fri", revenue: 690, bookings: 13 },
  { label: "Sat", revenue: 820, bookings: 16 },
  { label: "Sun", revenue: 300, bookings: 6 },
];

export const businessStatsSummary = {
  revenueThisWeek: weeklyStats.reduce((a, b) => a + b.revenue, 0),
  bookingsThisWeek: weeklyStats.reduce((a, b) => a + b.bookings, 0),
  newClientsThisWeek: 5,
  chairUtilization: 78,
  hotDealsFilled: 6,
  avgRating: 4.9,
};
