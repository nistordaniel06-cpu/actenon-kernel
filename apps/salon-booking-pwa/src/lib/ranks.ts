export type Rank = "Ucenic" | "Calfă" | "Meșter" | "Maestru" | "Legendă";

export const RANKS: { rank: Rank; min: number; perk: string }[] = [
  { rank: "Ucenic", min: 0, perk: "1 punct pentru fiecare 1 leu cheltuit" },
  { rank: "Calfă", min: 500, perk: "5% reducere la fiecare a 5-a programare" },
  { rank: "Meșter", min: 1500, perk: "Sloturi prioritare + un extra gratuit lunar" },
  { rank: "Maestru", min: 3000, perk: "Suport prioritar + oferte exclusive" },
  { rank: "Legendă", min: 6000, perk: "Acces la evenimente private și cadouri surpriză" },
];

export function rankForPoints(points: number): Rank {
  let current: Rank = "Ucenic";
  for (const tier of RANKS) {
    if (points >= tier.min) current = tier.rank;
  }
  return current;
}

export function nextRank(points: number) {
  const idx = RANKS.findIndex((r) => r.rank === rankForPoints(points));
  return RANKS[idx + 1] ?? null;
}
