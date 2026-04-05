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
            "flex w-full items-center justify-between rounded-2xl px-4 py-3 text-sm font-medium",
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

        <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
          <p className="text-sm text-[color:var(--muted)]">Last 10 updates</p>
          <div className="mt-3 space-y-2">
            {priceHistory.slice().reverse().map((point) => (
              <div key={point.timestamp} className="flex items-center justify-between text-sm">
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
