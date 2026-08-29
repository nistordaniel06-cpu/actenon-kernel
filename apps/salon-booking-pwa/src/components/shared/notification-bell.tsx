"use client";

import { Bell } from "lucide-react";

import { useAppStore } from "@/lib/store";

export function NotificationBell() {
  const pushToast = useAppStore((s) => s.pushToast);

  return (
    <button
      onClick={() => pushToast("Nu ai notificări noi.")}
      className="relative flex size-9 items-center justify-center rounded-full bg-surface-2"
      aria-label="Notificări"
    >
      <Bell className="size-4.5" />
      <span className="absolute right-1.5 top-1.5 size-1.5 rounded-full bg-accent" />
    </button>
  );
}
