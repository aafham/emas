"use client";

import type { Dispatch, SetStateAction } from "react";
import clsx from "clsx";
import { SectionCard } from "@/components/section-card";
import { LabeledInput, Metric } from "@/components/dashboard/shared";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { GoldApiResponse, PreferencesState } from "@/lib/types";

export function SpreadControlsSection({
  preferences,
  priceData,
  onSetPreferences,
}: {
  preferences: PreferencesState;
  priceData: GoldApiResponse | null;
  onSetPreferences: Dispatch<SetStateAction<PreferencesState>>;
}) {
  return (
    <SectionCard title="Spread controls" subtitle="Tune the Public Gold-style premium and compare spot versus adjusted pricing.">
      <div className="space-y-4">
        <div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-[color:var(--muted)]">Spread slider</span>
            <span className="font-semibold">{formatNumber(preferences.spread * 100)}%</span>
          </div>
          <input
            type="range"
            min={5}
            max={10}
            step={0.5}
            value={preferences.spread * 100}
            onChange={(event) =>
              onSetPreferences((current) => ({
                ...current,
                spread: Number((Number(event.target.value) / 100).toFixed(3)),
              }))
            }
            aria-label="Adjust pricing spread percentage"
            className="mt-3 w-full"
          />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Spot per gram" value={formatCurrency(priceData?.spotPriceMYR ?? 0, "MYR")} />
          <Metric label="Adjusted per gram" value={formatCurrency(priceData?.adjustedPriceMYR ?? 0, "MYR")} />
        </div>

        <button
          onClick={() => onSetPreferences((current) => ({ ...current, manualMode: !current.manualMode }))}
          aria-pressed={preferences.manualMode}
          className="surface-card flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium"
        >
          <span>Manual input mode</span>
          <span
            className={clsx(
              "rounded-full px-3 py-1 text-xs",
              preferences.manualMode ? "bg-emerald-500/15 text-[color:var(--success)]" : "bg-black/10 text-[color:var(--muted)]",
            )}
          >
            {preferences.manualMode ? "Enabled" : "Disabled"}
          </span>
        </button>

        {preferences.manualMode && (
          <div className="grid gap-3 sm:grid-cols-2">
            <LabeledInput
              label="Spot XAU/USD"
              type="number"
              value={String(preferences.manualSpotUsd)}
              min={0}
              step="0.01"
              helperText="Set your own spot ounce price when you want to simulate without live data."
              error={preferences.manualSpotUsd <= 0 ? "Spot XAU/USD must be above 0." : null}
              onChange={(value) =>
                onSetPreferences((current) => ({
                  ...current,
                  manualSpotUsd: Number(value) || 0,
                }))
              }
            />
            <LabeledInput
              label="USD/MYR"
              type="number"
              value={String(preferences.manualUsdMyr)}
              min={0}
              step="0.0001"
              helperText="Enter the FX rate you want to use in manual mode."
              error={preferences.manualUsdMyr <= 0 ? "USD/MYR must be above 0." : null}
              onChange={(value) =>
                onSetPreferences((current) => ({
                  ...current,
                  manualUsdMyr: Number(value) || 0,
                }))
              }
            />
          </div>
        )}
      </div>
    </SectionCard>
  );
}
