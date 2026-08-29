import { CommunityTitle } from "@/lib/types";

export const communityTitles: CommunityTitle[] = [
  { id: "ct-1", barberId: "barber-1", title: "Vocea clienților", week: "18–24 aug" },
  { id: "ct-2", barberId: "barber-3", title: "Look-ul săptămânii", week: "18–24 aug" },
  { id: "ct-4", barberId: "barber-6", title: "Revelația săptămânii", week: "18–24 aug" },
];

export interface LeaderboardEntry {
  barberId: string;
  score: number;
  bookingsWeek: number;
  ratingWeek: number;
}

export const leaderboard: LeaderboardEntry[] = [
  { barberId: "barber-1", score: 96, bookingsWeek: 24, ratingWeek: 4.9 },
  { barberId: "barber-3", score: 94, bookingsWeek: 21, ratingWeek: 5.0 },
  { barberId: "barber-7", score: 88, bookingsWeek: 19, ratingWeek: 4.8 },
  { barberId: "barber-5", score: 85, bookingsWeek: 15, ratingWeek: 4.9 },
  { barberId: "barber-6", score: 79, bookingsWeek: 12, ratingWeek: 4.6 },
];

export function getCommunityTitlesForBarber(barberId: string) {
  return communityTitles.filter((c) => c.barberId === barberId);
}
