import { Appointment, ClientProfile, RewardActivity } from "@/lib/types";

import { daysAgo } from "./time";

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
  referralCode: "DANIEL10",
  memberSince: "2025-03-12",
};

export const rewardActivity: RewardActivity[] = [
  { id: "ra-1", label: "Programare la Urban Cuts", points: 100, date: daysAgo(3) },
  { id: "ra-2", label: "Bonus recomandare — Adrian s-a alăturat", points: 200, date: daysAgo(10) },
  { id: "ra-3", label: "Programare la Gentlemen's Club", points: 70, date: daysAgo(18) },
  { id: "ra-4", label: "Review verificat", points: 20, date: daysAgo(19) },
  { id: "ra-5", label: "Programare la Lumière Hair Studio", points: 180, date: daysAgo(32) },
];

export const seedAppointments: Appointment[] = [
  {
    id: "appt-1",
    salonId: "salon-1",
    barberId: "barber-1",
    serviceId: "svc-5",
    clientName: currentUser.name,
    clientAvatar: currentUser.avatar,
    startIso: inDays(2, 15),
    endIso: addMin(inDays(2, 15), 60),
    status: "confirmat",
    price: 100,
  },
  {
    id: "appt-2",
    salonId: "salon-3",
    barberId: "barber-5",
    serviceId: "svc-7",
    clientName: currentUser.name,
    clientAvatar: currentUser.avatar,
    startIso: inDays(9, 11),
    endIso: addMin(inDays(9, 11), 150),
    status: "confirmat",
    price: 260,
  },
  {
    id: "appt-3",
    salonId: "salon-2",
    barberId: "barber-3",
    serviceId: "svc-1",
    clientName: currentUser.name,
    clientAvatar: currentUser.avatar,
    startIso: daysAgo(6),
    endIso: addMin(daysAgo(6), 40),
    status: "finalizat",
    price: 70,
    pointsEarned: 70,
    reviewed: true,
  },
  {
    id: "appt-4",
    salonId: "salon-1",
    barberId: "barber-2",
    serviceId: "svc-8",
    clientName: currentUser.name,
    clientAvatar: currentUser.avatar,
    startIso: daysAgo(21),
    endIso: addMin(daysAgo(21), 30),
    status: "finalizat",
    price: 50,
    pointsEarned: 50,
    reviewed: false,
  },
  {
    id: "appt-5",
    salonId: "salon-1",
    barberId: "barber-1",
    serviceId: "svc-2",
    clientName: currentUser.name,
    clientAvatar: currentUser.avatar,
    startIso: daysAgo(14),
    endIso: addMin(daysAgo(14), 45),
    status: "anulat",
    price: 80,
  },
];
