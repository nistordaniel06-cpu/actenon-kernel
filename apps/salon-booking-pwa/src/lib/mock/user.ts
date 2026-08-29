import { Appointment, ClientProfile, RewardActivity } from "@/lib/types";

function daysAgo(d: number) {
  return new Date(Date.now() - d * 86_400_000).toISOString();
}
function inDays(d: number, hour = 14) {
  const dt = new Date(Date.now() + d * 86_400_000);
  dt.setHours(hour, 0, 0, 0);
  return dt.toISOString();
}
function addMin(iso: string, mins: number) {
  return new Date(new Date(iso).getTime() + mins * 60_000).toISOString();
}

export const currentUser: ClientProfile = {
  id: "user-1",
  name: "Daniel Nistor",
  email: "nistordaniel06@gmail.com",
  avatar: "/images/avatars/68.png",
  points: 1240,
  tier: "Silver",
  referralCode: "DANIEL10",
  memberSince: "2025-03-12",
};

export const rewardTiers: { tier: ClientProfile["tier"]; min: number; perk: string }[] = [
  { tier: "Bronze", min: 0, perk: "Earn 1 point per $1 spent" },
  { tier: "Silver", min: 500, perk: "5% off every 5th booking" },
  { tier: "Gold", min: 1500, perk: "Priority slots + free add-on monthly" },
  { tier: "Premiere", min: 3000, perk: "VIP support + exclusive hot deals" },
];

export const rewardActivity: RewardActivity[] = [
  { id: "ra-1", label: "Booking at The Gentry Room", points: 55, date: daysAgo(3) },
  { id: "ra-2", label: "Referral bonus — Alex joined", points: 200, date: daysAgo(10) },
  { id: "ra-3", label: "Booking at Dario's Classic Cuts", points: 35, date: daysAgo(18) },
  { id: "ra-4", label: "Left a 5-star review", points: 20, date: daysAgo(19) },
  { id: "ra-5", label: "Booking at Lumière Hair Studio", points: 120, date: daysAgo(32) },
];

export const appointments: Appointment[] = [
  {
    id: "appt-1",
    salonId: "salon-1",
    barberId: "barber-1",
    serviceId: "svc-5",
    startIso: inDays(2, 15),
    endIso: addMin(inDays(2, 15), 60),
    status: "upcoming",
    price: 75,
  },
  {
    id: "appt-2",
    salonId: "salon-3",
    barberId: "barber-5",
    serviceId: "svc-7",
    startIso: inDays(9, 11),
    endIso: addMin(inDays(9, 11), 150),
    status: "upcoming",
    price: 190,
  },
  {
    id: "appt-3",
    salonId: "salon-2",
    barberId: "barber-3",
    serviceId: "svc-1",
    startIso: daysAgo(6),
    endIso: addMin(daysAgo(6), 45),
    status: "completed",
    price: 55,
    pointsEarned: 55,
  },
  {
    id: "appt-4",
    salonId: "salon-1",
    barberId: "barber-2",
    serviceId: "svc-8",
    startIso: daysAgo(21),
    endIso: addMin(daysAgo(21), 35),
    status: "completed",
    price: 40,
    pointsEarned: 40,
  },
  {
    id: "appt-5",
    salonId: "salon-7",
    barberId: "barber-10",
    serviceId: "svc-2",
    startIso: daysAgo(14),
    endIso: addMin(daysAgo(14), 40),
    status: "cancelled",
    price: 45,
  },
];
