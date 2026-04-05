"use client";

import type { ReactNode } from "react";
import { useId } from "react";
import clsx from "clsx";
import { CandlestickChart, Coins, WalletCards } from "lucide-react";
import { CalculatorMode, GoldApiResponse } from "@/lib/types";

export const QUICK_ACTIONS = {
  RM_TO_GRAM: [100, 500, 1000, 5000],
  GRAM_TO_RM: [1, 5, 10, 20],
  DINAR_TO_RM: [1, 5, 10],
} satisfies Record<CalculatorMode, number[]>;

export function formatRelativeTime(timestamp?: string) {
  if (!timestamp) return "No update yet";
  const deltaMs = Date.now() - new Date(timestamp).getTime();
  if (!Number.isFinite(deltaMs) || deltaMs < 0) return "Updated just now";
  const minutes = Math.floor(deltaMs / 60_000);
  if (minutes < 1) return "Updated just now";
  if (minutes < 60) return `Updated ${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Updated ${hours}h ago`;
  return `Updated ${Math.floor(hours / 24)}d ago`;
}

export function getDataStatus(priceData: GoldApiResponse | null, manualMode: boolean) {
  if (manualMode) {
    return {
      label: "Manual mode",
      tone: "border-sky-400/30 bg-sky-500/10 text-sky-950 dark:text-sky-100",
      description: "Live fetching is paused. Prices are coming from your manual spot and FX inputs.",
    };
  }
  if (!priceData) {
    return {
      label: "Loading",
      tone: "border-white/10 bg-black/5 text-[color:var(--text)] dark:bg-white/5",
      description: "Fetching the latest gold estimate and exchange rate.",
    };
  }
  if (priceData.source === "offline fallback") {
    return {
      label: "Offline estimate",
      tone: "border-amber-400/30 bg-amber-400/10 text-amber-950 dark:text-amber-100",
      description: "Live providers are unavailable, so this number is a fallback estimate and may lag the market.",
    };
  }
  if (priceData.isFallback) {
    return {
      label: "Cached estimate",
      tone: "border-amber-400/30 bg-amber-400/10 text-amber-950 dark:text-amber-100",
      description: "Latest live refresh failed. You are seeing the most recent cached value.",
    };
  }
  return {
    label: "Live estimate",
    tone: "border-emerald-500/30 bg-emerald-500/10 text-emerald-950 dark:text-emerald-100",
    description: `Pulled from ${priceData.source} and adjusted using your selected spread.`,
  };
}

export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="surface-card relative rounded-[24px] px-4 py-4">
      <p className="text-sm text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

export function SummaryMiniStats({
  todayValue,
  yesterdayValue,
  changeValue,
}: {
  todayValue: string;
  yesterdayValue: string;
  changeValue: string;
}) {
  return (
    <div className="grid gap-3">
      <MiniStat icon={<CandlestickChart className="h-5 w-5" />} label="Today" value={todayValue} />
      <MiniStat icon={<Coins className="h-5 w-5" />} label="Yesterday" value={yesterdayValue} />
      <MiniStat icon={<WalletCards className="h-5 w-5" />} label="% change" value={changeValue} />
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card relative flex items-center gap-3 rounded-[26px] p-4">
      <div className="rounded-[18px] bg-[color:var(--gold)]/12 p-3 text-[color:var(--gold)]">{icon}</div>
      <div>
        <p className="text-sm text-[color:var(--muted)]">{label}</p>
        <p className="mt-1 text-2xl font-semibold tracking-tight">{value}</p>
      </div>
    </div>
  );
}

export function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  helperText,
  error,
  min,
  step,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  helperText?: string;
  error?: string | null;
  min?: number;
  step?: string;
}) {
  const id = useId();
  const helperId = `${id}-helper`;
  const errorId = `${id}-error`;
  const describedBy = [helperText ? helperId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  return (
    <label className="block">
      <span className="text-sm font-medium text-[color:var(--muted)]">{label}</span>
      <input
        id={id}
        type={type}
        value={value}
        min={min}
        step={step}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={describedBy}
        className={clsx(
          "mt-2 w-full rounded-[22px] border bg-black/5 px-4 py-3.5 outline-none ring-0 transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--gold)] focus:bg-black/10 dark:bg-white/[0.03] dark:focus:bg-white/[0.05]",
          error ? "border-rose-400/60" : "border-white/10",
        )}
      />
      {helperText ? (
        <p id={helperId} className="mt-2 text-xs leading-5 text-[color:var(--muted)]">
          {helperText}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="mt-2 text-xs font-medium text-[color:var(--danger)]">
          {error}
        </p>
      ) : null}
    </label>
  );
}
