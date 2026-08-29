import { businessStatsSummary, weeklyStats } from "@/lib/mock/business";
import { StatsClient } from "./stats-client";

export default function BusinessStatsPage() {
  return <StatsClient weeklyStats={weeklyStats} summary={businessStatsSummary} />;
}
