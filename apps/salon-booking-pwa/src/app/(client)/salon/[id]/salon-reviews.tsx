"use client";

import { useAppStore } from "@/lib/store";
import { ReviewRow } from "@/components/client/review-row";

export function SalonReviews({ salonId }: { salonId: string }) {
  const reviewsBySalon = useAppStore((s) => s.reviewsBySalon);
  const reviews = reviewsBySalon[salonId] ?? [];

  if (reviews.length === 0) {
    return <p className="py-6 text-center text-sm text-muted-foreground">Niciun review încă.</p>;
  }

  return (
    <div className="flex flex-col">
      {reviews.map((review) => (
        <ReviewRow key={review.id} review={review} />
      ))}
    </div>
  );
}
