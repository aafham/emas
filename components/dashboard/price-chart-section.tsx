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
        <div className="flex rounded-full border border-white/10 p-1" role="tablist" aria-label="Chart range">
          {(["24H", "7D"] as const).map((range) => (
            <button
              key={range}
              onClick={() => onChangeRange(range)}
              aria-pressed={preferences.chartRange === range}
              className={clsx(
                "rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] transition",
                preferences.chartRange === range ? "bg-[color:var(--gold)] text-black" : "text-[color:var(--muted)]",
              )}
            >
              {range}
            </button>
          ))}
        </div>
      }
    >
      <PriceChart
        data={displayHistory}
        currency={preferences.currency}
        usdMyrRate={priceData?.usdMyrRate ?? 4.72}
      />
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <Metric label="Adjusted buy" value={formatCurrency(priceData?.adjustedPriceMYR ?? 0, "MYR")} />
        <Metric label="Raw spot" value={formatCurrency(priceData?.spotPriceMYR ?? 0, "MYR")} />
        <Metric label="Source" value={priceData?.source ?? "--"} />
      </div>
    </SectionCard>
  );
}
