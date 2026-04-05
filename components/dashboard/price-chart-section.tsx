"use client";

import clsx from "clsx";
import { PriceChart } from "@/components/price-chart";
import { SectionCard } from "@/components/section-card";
import { Metric } from "@/components/dashboard/shared";
import { formatCurrency } from "@/lib/calculations";
import { GoldApiResponse, PreferencesState } from "@/lib/types";

export function PriceChartSection({
  preferences,
  priceData,
  displayHistory,
  onChangeRange,
}: {
  preferences: PreferencesState;
  priceData: GoldApiResponse | null;
  displayHistory: GoldApiResponse["history"];
  onChangeRange: (range: "24H" | "7D") => void;
}) {
  return (
    <SectionCard
      title="Price chart"
      subtitle="Track the estimated adjusted buy price against your preferred currency view."
      action={
        <div className="surface-card flex rounded-full p-1" role="tablist" aria-label="Chart range">
          {(["24H", "7D"] as const).map((range) => (
            <button
              key={range}
              onClick={() => onChangeRange(range)}
              aria-pressed={preferences.chartRange === range}
              className={clsx(
                "rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] transition",
                preferences.chartRange === range ? "bg-[color:var(--gold)] text-black" : "text-[color:var(--muted)]",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      }
    >
      <div className="rounded-[28px] border border-white/6 bg-black/5 px-3 py-4 dark:bg-white/[0.02] sm:px-4">
        <PriceChart
          data={displayHistory}
          currency={preferences.currency}
          usdMyrRate={priceData?.usdMyrRate ?? 4.72}
        />
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Adjusted buy" value={formatCurrency(priceData?.adjustedPriceMYR ?? 0, "MYR")} />
        <Metric label="Raw spot" value={formatCurrency(priceData?.spotPriceMYR ?? 0, "MYR")} />
        <Metric label="Source" value={priceData?.source ?? "--"} />
      </div>
    </SectionCard>
  );
}
