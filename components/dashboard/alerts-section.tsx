"use client";

import type { Dispatch, SetStateAction } from "react";
import clsx from "clsx";
import { Bell, BellRing } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { LabeledInput } from "@/components/dashboard/shared";
import { formatCurrency } from "@/lib/calculations";
import { AlertState, GoldApiResponse } from "@/lib/types";

export function AlertsSection({
  alertState,
  alertTargetError,
  priceHistory,
  onSetAlertState,
}: {
  alertState: AlertState;
  alertTargetError: string | null;
  priceHistory: GoldApiResponse["history"];
  onSetAlertState: Dispatch<SetStateAction<AlertState>>;
}) {
  return (
    <SectionCard title="Alerts & history" subtitle="Get notified when your target price is reached.">
      <div className="space-y-4">
        <button
          onClick={() => onSetAlertState((current) => ({ ...current, enabled: !current.enabled }))}
          aria-pressed={alertState.enabled}
          className={clsx(
            "flex w-full items-center justify-between rounded-[24px] px-4 py-3.5 text-sm font-medium",
            alertState.enabled ? "bg-[color:var(--gold)] text-black" : "surface-card",
          )}
        >
          <span className="flex items-center gap-2">
            {alertState.enabled ? <BellRing className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
            Price alert
          </span>
          <span>{alertState.enabled ? "On" : "Off"}</span>
        </button>

        <LabeledInput
          label="Target price (RM/g)"
          type="number"
          value={String(alertState.targetPrice)}
          min={0}
          step="0.01"
          helperText="Notifications trigger when the adjusted buy estimate reaches or exceeds this level."
          error={alertTargetError}
          onChange={(value) =>
            onSetAlertState((current) => ({ ...current, targetPrice: Number(value) || 0 }))
          }
        />

        <div className="surface-card rounded-[26px] p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[color:var(--muted)]">Last 10 updates</p>
            <span className="rounded-full bg-black/10 px-2.5 py-1 text-xs text-[color:var(--muted)] dark:bg-white/5">
              {priceHistory.length} points
            </span>
          </div>
          <div className="mt-3 max-h-[320px] space-y-2 overflow-y-auto pr-1">
            {priceHistory.slice().reverse().map((point) => (
              <div
                key={point.timestamp}
                className="flex items-center justify-between rounded-2xl border border-white/6 bg-black/5 px-3 py-2.5 text-sm dark:bg-white/[0.02]"
              >
                <span className="text-[color:var(--muted)]">
                  {new Date(point.timestamp).toLocaleString("en-MY", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
                <span className="font-medium">{formatCurrency(point.adjustedPrice, "MYR")}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}
