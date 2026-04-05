"use client";

import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  CircleDollarSign,
  MoonStar,
  RefreshCw,
  ShieldAlert,
  SmartphoneCharging,
  SunMedium,
} from "lucide-react";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { GoldApiResponse, PreferencesState, Trend } from "@/lib/types";
import { Metric, SummaryMiniStats, formatRelativeTime } from "@/components/dashboard/shared";

export function DashboardHeroSection({
  loading,
  priceData,
  preferences,
  selectedPrice,
  priceUp,
  changeValue,
  trend,
  todayPrice,
  yesterdayPrice,
  error,
  dataStatus,
  installable,
  onRefresh,
  onToggleTheme,
  onToggleCurrency,
  onInstall,
}: {
  loading: boolean;
  priceData: GoldApiResponse | null;
  preferences: PreferencesState;
  selectedPrice: number;
  priceUp: boolean;
  changeValue: number;
  trend: Trend;
  todayPrice: number;
  yesterdayPrice: number;
  error: string | null;
  dataStatus: { label: string; tone: string; description: string };
  installable: Event | null;
  onRefresh: () => void;
  onToggleTheme: () => void;
  onToggleCurrency: () => void;
  onInstall: () => void;
}) {
  return (
    <section className="glass-card animate-rise overflow-hidden rounded-[34px] border border-white/10 p-6 shadow-glow sm:p-8">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-sm uppercase tracking-[0.28em] text-[color:var(--gold)]">Malaysia Gold Intelligence</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-[color:var(--text)] sm:text-5xl">
            Premium gold tracking built for real buyers, stackers, and investors.
          </h1>
          <p className="mt-4 text-base leading-7 text-[color:var(--muted)]">
            Live XAU pricing, Public Gold-style spread simulation, fast portfolio monitoring, and offline-friendly
            protection in one installable dashboard.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <button
            onClick={onRefresh}
            aria-label="Refresh live gold pricing"
            className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
          >
            <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
            Refresh
          </button>
          <button
            onClick={onToggleTheme}
            aria-pressed={preferences.darkMode}
            aria-label={`Switch to ${preferences.darkMode ? "light" : "dark"} theme`}
            className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
          >
            {preferences.darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
            Theme
          </button>
          <button
            onClick={onToggleCurrency}
            aria-pressed={preferences.currency === "USD"}
            aria-label={`Switch display currency from ${preferences.currency}`}
            className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
          >
            <CircleDollarSign className="h-4 w-4" />
            {preferences.currency}
          </button>
          <button
            onClick={onInstall}
            disabled={!installable}
            className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <SmartphoneCharging className="h-4 w-4" />
            Install
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className={clsx("rounded-full border px-4 py-2 text-sm font-medium", dataStatus.tone)}>
          {dataStatus.label}
        </div>
        <p className="text-sm text-[color:var(--muted)]">
          {dataStatus.description} {formatRelativeTime(priceData?.updatedAt)}.
        </p>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[1.5fr,1fr]">
        <div className="rounded-[28px] bg-[linear-gradient(135deg,rgba(212,175,55,0.18),rgba(17,17,17,0.1))] p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm text-[color:var(--muted)]">Estimated live buy price</p>
              <div className="mt-4 flex items-end gap-3">
                <span className="text-4xl font-semibold tracking-tight sm:text-6xl">
                  {loading && !priceData ? "..." : formatCurrency(selectedPrice, preferences.currency)}
                </span>
                <span className="mb-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.22em] text-[color:var(--gold)]">
                  / gram
                </span>
              </div>
              <div
                aria-live="polite"
                className={clsx(
                  "mt-4 inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium",
                  priceUp ? "bg-emerald-500/12 text-[color:var(--success)]" : "bg-rose-500/12 text-[color:var(--danger)]",
                )}
              >
                {priceUp ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                {formatCurrency(Math.abs(changeValue), "MYR")} ({formatNumber(Math.abs(priceData?.changePercent ?? 0))}%)
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-black/10 px-4 py-3 text-right">
              <p className="text-xs uppercase tracking-[0.2em] text-[color:var(--muted)]">Trend</p>
              <p className="mt-2 text-lg font-semibold capitalize">{trend}</p>
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                Updated{" "}
                {priceData
                  ? new Date(priceData.updatedAt).toLocaleString("en-MY", {
                      dateStyle: "medium",
                      timeStyle: "short",
                    })
                  : "--"}
              </p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Metric
              label="Spot price"
              value={formatCurrency(
                preferences.currency === "MYR" ? priceData?.spotPriceMYR ?? 0 : priceData?.spotPriceUSD ?? 0,
                preferences.currency,
              )}
            />
            <Metric label="USD/MYR" value={formatNumber(priceData?.usdMyrRate ?? 0, 4)} />
            <Metric label="Spread" value={`${formatNumber(preferences.spread * 100)}%`} />
          </div>
        </div>

        <SummaryMiniStats
          todayValue={formatCurrency(todayPrice, "MYR")}
          yesterdayValue={formatCurrency(yesterdayPrice, "MYR")}
          changeValue={`${formatNumber(priceData?.changePercent ?? 0)}%`}
        />
      </div>

      {(error || priceData?.warning) && (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{error ?? priceData?.warning}</p>
        </div>
      )}
    </section>
  );
}
