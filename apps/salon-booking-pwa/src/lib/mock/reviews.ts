import { Review } from "@/lib/types";

export const reviewsBySalon: Record<string, Review[]> = {
  "salon-1": [
    {
      id: "rev-1",
      author: "Jordan P.",
      avatar: "/images/avatars/5.png",
      rating: 5,
      comment: "Best fade I've had in the city. Marco is a true artist.",
      date: "2026-08-20",
      serviceName: "Skin Fade",
    },
    {
      id: "rev-2",
      author: "Alicia M.",
      avatar: "/images/avatars/9.png",
      rating: 5,
      comment: "Clean space, on time, and the beard trim was perfect.",
      date: "2026-08-14",
      serviceName: "Cut + Beard Combo",
    },
    {
      id: "rev-3",
      author: "Sam K.",
      avatar: "/images/avatars/15.png",
      rating: 4,
      comment: "Great cut, a little wait past my appointment time.",
      date: "2026-08-02",
      serviceName: "Signature Haircut",
    },
  ],
  "salon-2": [
    {
      id: "rev-4",
      author: "Marcus T.",
      avatar: "/images/avatars/22.png",
      rating: 5,
      comment: "Old-school barbershop feel with modern precision.",
      date: "2026-08-18",
      serviceName: "Hot Towel Shave",
    },
    {
      id: "rev-5",
      author: "Ben O.",
      avatar: "/images/avatars/27.png",
      rating: 5,
      comment: "Took my son here, patient and great with kids.",
      date: "2026-08-10",
      serviceName: "Kids Haircut",
    },
  ],
  "salon-3": [
    {
      id: "rev-6",
      author: "Nina W.",
      avatar: "/images/avatars/31.png",
      rating: 5,
      comment: "Elena's balayage work is unreal. Worth every penny.",
      date: "2026-08-21",
      serviceName: "Balayage",
    },
    {
      id: "rev-7",
      author: "Grace L.",
      avatar: "/images/avatars/36.png",
      rating: 4,
      comment: "Lovely studio, booked a bit far out during weekends.",
      date: "2026-07-30",
      serviceName: "Full Color",
    },
  ],
};

export function getReviewsForSalon(salonId: string) {
  return reviewsBySalon[salonId] ?? [];
}
