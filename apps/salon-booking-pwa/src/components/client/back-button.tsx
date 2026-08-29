"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { cn } from "@/lib/utils";

export function BackButton({ className }: { className?: string }) {
  const router = useRouter();
  return (
    <button
      onClick={() => router.back()}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-card/90 shadow-sm backdrop-blur",
        className,
      )}
      aria-label="Înapoi"
    >
      <ArrowLeft className="size-4.5" />
    </button>
  );
}
