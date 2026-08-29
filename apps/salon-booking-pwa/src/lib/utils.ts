import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number) {
  return `${new Intl.NumberFormat("ro-RO", { maximumFractionDigits: 0 }).format(amount)} lei`;
}

export function formatShortTime(iso: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function formatWeekday(iso: string) {
  return new Intl.DateTimeFormat("ro-RO", { weekday: "short" }).format(
    new Date(iso),
  );
}

export function formatDayMonth(iso: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    month: "short",
    day: "numeric",
  }).format(new Date(iso));
}

export function formatDateTime(iso: string) {
  return new Intl.DateTimeFormat("ro-RO", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}
