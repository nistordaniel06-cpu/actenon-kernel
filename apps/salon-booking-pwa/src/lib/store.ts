"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import {
  Appointment,
  AppointmentStatus,
  BoostCampaign,
  Review,
  RewardActivity,
  ShopProduct,
  WheelPrize,
} from "@/lib/types";
import { seedAppointments, currentUser, rewardActivity as seedActivity } from "@/lib/mock/user";
import { salonSeedAppointments } from "@/lib/mock/business";
import { reviewsBySalon } from "@/lib/mock/reviews";
import { wheelPrizes } from "@/lib/mock/wheel";

export type Role = "client" | "barber" | "salonPro";

export interface Toast {
  id: string;
  message: string;
  variant?: "default" | "success" | "destructive";
}

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

interface AppState {
  role: Role;
  setRole: (role: Role) => void;
  currentBarberId: string;

  appointments: Appointment[];
  addAppointment: (a: Appointment) => void;
  updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
  cancelAppointment: (id: string) => void;
  rescheduleAppointment: (id: string, startIso: string, endIso: string) => void;

  points: number;
  pointActivity: RewardActivity[];
  addPoints: (amount: number, label: string) => void;

  wheelLastSpin: string | null;
  canSpinToday: () => boolean;
  spinWheel: () => WheelPrize | null;

  reviewsBySalon: Record<string, Review[]>;
  addReview: (salonId: string, appointmentId: string, review: Review) => void;

  boosts: BoostCampaign[];
  addBoost: (boost: BoostCampaign) => void;
  toggleBoost: (id: string) => void;

  addProductToNextAppointment: (product: ShopProduct, clientName: string) => boolean;

  toasts: Toast[];
  pushToast: (message: string, variant?: Toast["variant"]) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      role: "client",
      setRole: (role) => set({ role }),
      currentBarberId: "barber-1",

      appointments: [...seedAppointments, ...salonSeedAppointments],
      addAppointment: (a) =>
        set((s) => ({ appointments: [...s.appointments, a] })),
      updateAppointmentStatus: (id, status) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status } : a,
          ),
        })),
      cancelAppointment: (id) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, status: "anulat" as AppointmentStatus } : a,
          ),
        })),
      rescheduleAppointment: (id, startIso, endIso) =>
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === id ? { ...a, startIso, endIso, status: "confirmat" as AppointmentStatus } : a,
          ),
        })),

      points: currentUser.points,
      pointActivity: seedActivity,
      addPoints: (amount, label) =>
        set((s) => ({
          points: s.points + amount,
          pointActivity: [
            { id: uid("ra"), label, points: amount, date: new Date().toISOString() },
            ...s.pointActivity,
          ],
        })),

      wheelLastSpin: null,
      canSpinToday: () => get().wheelLastSpin !== todayKey(),
      spinWheel: () => {
        if (!get().canSpinToday()) return null;
        const prize = wheelPrizes[Math.floor(Math.random() * wheelPrizes.length)];
        set({ wheelLastSpin: todayKey() });
        if (prize.kind === "points" && prize.value > 0) {
          get().addPoints(prize.value, `Roata zilnică — ${prize.label}`);
        }
        return prize;
      },

      reviewsBySalon: reviewsBySalon,
      addReview: (salonId, appointmentId, review) =>
        set((s) => ({
          reviewsBySalon: {
            ...s.reviewsBySalon,
            [salonId]: [review, ...(s.reviewsBySalon[salonId] ?? [])],
          },
          appointments: s.appointments.map((a) =>
            a.id === appointmentId ? { ...a, reviewed: true } : a,
          ),
        })),

      boosts: [],
      addBoost: (boost) => set((s) => ({ boosts: [boost, ...s.boosts] })),
      toggleBoost: (id) =>
        set((s) => ({
          boosts: s.boosts.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
        })),

      addProductToNextAppointment: (product, clientName) => {
        const upcoming = get()
          .appointments.filter(
            (a) =>
              a.clientName === clientName &&
              (a.status === "confirmat" || a.status === "in-asteptare"),
          )
          .sort((a, b) => a.startIso.localeCompare(b.startIso))[0];
        if (!upcoming) return false;
        set((s) => ({
          appointments: s.appointments.map((a) =>
            a.id === upcoming.id
              ? {
                  ...a,
                  price: a.price + product.memberPrice,
                  extras: [...(a.extras ?? []), { productId: product.id, name: product.name, price: product.memberPrice }],
                }
              : a,
          ),
        }));
        return true;
      },

      toasts: [],
      pushToast: (message, variant = "default") =>
        set((s) => ({ toasts: [...s.toasts, { id: uid("toast"), message, variant }] })),
      dismissToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: "nearcut-store",
      partialize: (s) => ({
        role: s.role,
        appointments: s.appointments,
        points: s.points,
        pointActivity: s.pointActivity,
        wheelLastSpin: s.wheelLastSpin,
        reviewsBySalon: s.reviewsBySalon,
        boosts: s.boosts,
      }),
    },
  ),
);
