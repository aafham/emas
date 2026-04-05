"use client";

import { useEffect, useId, useMemo, useState } from "react";
import clsx from "clsx";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  BellRing,
  CandlestickChart,
  CircleDollarSign,
  Coins,
  MoonStar,
  RefreshCw,
  ShieldAlert,
  SmartphoneCharging,
  SunMedium,
  WalletCards,
} from "lucide-react";
import { PriceChart } from "@/components/price-chart";
import { SectionCard } from "@/components/section-card";
import { fetchGoldData } from "@/lib/api";
import { buildSyntheticHistory } from "@/lib/chart";
import {
  calculatePortfolio,
  convertValue,
  determineTrend,
  formatCurrency,
  formatNumber,
} from "@/lib/calculations";
import { AUTO_REFRESH_MS, DEFAULT_PREFERENCES, DINAR_IN_GRAMS } from "@/lib/constants";
import {
  AlertState,
  CalculatorMode,
  GoldApiResponse,
  PortfolioState,
  PreferencesState,
} from "@/lib/types";
import {
  loadAlert,
  loadLastPrice,
  loadPortfolio,
  loadPreferences,
  saveAlert,
  saveLastPrice,
  savePortfolio,
  savePreferences,
} from "@/lib/storage";

const QUICK_ACTIONS = {
  RM_TO_GRAM: [100, 500, 1000, 5000],
  GRAM_TO_RM: [1, 5, 10, 20],
  DINAR_TO_RM: [1, 5, 10],
} satisfies Record<CalculatorMode, number[]>;

function formatRelativeTime(timestamp?: string) {
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

function getDataStatus(priceData: GoldApiResponse | null, manualMode: boolean) {
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

export function GoldDashboard() {
  const [preferences, setPreferences] = useState<PreferencesState>(DEFAULT_PREFERENCES);
  const [portfolio, setPortfolio] = useState<PortfolioState>({ grams: 0, averageBuyPrice: 0 });
  const [alertState, setAlertState] = useState<AlertState>({ enabled: false, targetPrice: 0 });
  const [priceData, setPriceData] = useState<GoldApiResponse | null>(null);
  const [calculatorInput, setCalculatorInput] = useState("1000");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installable, setInstallable] = useState<Event | null>(null);

  useEffect(() => {
    const loadedPreferences = loadPreferences();
    const loadedPortfolio = loadPortfolio();
    const loadedAlert = loadAlert();
    const cachedPrice = loadLastPrice();
    setPreferences(loadedPreferences);
    setPortfolio(loadedPortfolio);
    setAlertState(loadedAlert);
    if (cachedPrice) {
      setPriceData(cachedPrice);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", preferences.darkMode);
    savePreferences(preferences);
  }, [preferences]);

  useEffect(() => {
    savePortfolio(portfolio);
  }, [portfolio]);

  useEffect(() => {
    saveAlert(alertState);
  }, [alertState]);

  useEffect(() => {
    const registerWorker = async () => {
      if ("serviceWorker" in navigator) {
        await navigator.serviceWorker.register("/sw.js");
      }
    };

    registerWorker().catch(() => undefined);

    const handler = (event: Event) => {
      event.preventDefault();
      setInstallable(event);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    let mounted = true;

    const syncPrice = async () => {
      if (preferences.manualMode) {
        const manualSpread = preferences.spread;
        const base = (preferences.manualSpotUsd * preferences.manualUsdMyr) / 31.1035;
        const adjusted = base * (1 + manualSpread);
        const previous = priceData?.adjustedPriceMYR ?? adjusted * 0.995;
        const manualData: GoldApiResponse = {
          adjustedPriceMYR: Number(adjusted.toFixed(2)),
          adjustedPriceUSD: Number(((preferences.manualSpotUsd / 31.1035) * (1 + manualSpread)).toFixed(2)),
          spotPriceMYR: Number(base.toFixed(2)),
          spotPriceUSD: Number((preferences.manualSpotUsd / 31.1035).toFixed(2)),
          usdMyrRate: preferences.manualUsdMyr,
          spread: manualSpread,
          updatedAt: new Date().toISOString(),
          previousAdjustedPriceMYR: Number(previous.toFixed(2)),
          changePercent: previous > 0 ? Number((((adjusted - previous) / previous) * 100).toFixed(2)) : 0,
          history: buildSyntheticHistory(Number(adjusted.toFixed(2)), Number(previous.toFixed(2)), "24H"),
          source: "manual input",
          warning: "Manual input mode is active. Live price fetching is paused.",
          isFallback: true,
        };

        if (mounted) {
          setPriceData(manualData);
          setLoading(false);
          setError(null);
        }
        return;
      }

      try {
        setLoading(true);
        const live = await fetchGoldData(preferences.spread);
        if (!mounted) return;
        setPriceData(live);
        setError(null);
        setLoading(false);
        saveLastPrice(live);
      } catch {
        const cached = loadLastPrice();
        if (!mounted) return;
        if (cached) {
          setPriceData(cached);
          setError("Live refresh failed. Showing the latest cached estimate.");
        } else {
          setError("Unable to load gold pricing right now.");
        }
        setLoading(false);
      }
    };

    syncPrice();
    const timer = window.setInterval(syncPrice, AUTO_REFRESH_MS);
    return () => {
      mounted = false;
      window.clearInterval(timer);
    };
  }, [preferences.spread, preferences.manualMode, preferences.manualSpotUsd, preferences.manualUsdMyr]);

  useEffect(() => {
    if (!priceData || !alertState.enabled || alertState.targetPrice <= 0) return;
    if (priceData.adjustedPriceMYR < alertState.targetPrice) return;

    const lastTriggeredAt = alertState.lastTriggeredAt
      ? new Date(alertState.lastTriggeredAt).getTime()
      : 0;

    if (Date.now() - lastTriggeredAt < AUTO_REFRESH_MS / 2) return;

    const trigger = async () => {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }
      if (Notification.permission === "granted") {
        new Notification("Gold target reached", {
          body: `Estimated gold price is now ${formatCurrency(priceData.adjustedPriceMYR, "MYR")} per gram.`,
        });
        setAlertState((current) => ({ ...current, lastTriggeredAt: new Date().toISOString() }));
      }
    };

    trigger().catch(() => undefined);
  }, [alertState, priceData]);

  const selectedPrice = useMemo(() => {
    if (!priceData) return 0;
    return preferences.currency === "MYR" ? priceData.adjustedPriceMYR : priceData.adjustedPriceUSD;
  }, [preferences.currency, priceData]);

  const displayHistory = useMemo(() => {
    if (!priceData) return [];
    if (preferences.chartRange === "24H") {
      return priceData.history.length > 0
        ? priceData.history
        : buildSyntheticHistory(priceData.adjustedPriceMYR, priceData.previousAdjustedPriceMYR, "24H");
    }
    return buildSyntheticHistory(priceData.adjustedPriceMYR, priceData.previousAdjustedPriceMYR, "7D");
  }, [preferences.chartRange, priceData]);

  const calculationResult = useMemo(() => {
    if (!priceData) return 0;
    const parsedInput = Number(calculatorInput);
    return convertValue(preferences.calculatorMode, parsedInput, priceData.adjustedPriceMYR);
  }, [calculatorInput, preferences.calculatorMode, priceData]);

  const portfolioSummary = useMemo(
    () => calculatePortfolio(portfolio, priceData?.adjustedPriceMYR ?? 0),
    [portfolio, priceData],
  );

  const todayPrice = priceData?.adjustedPriceMYR ?? 0;
  const yesterdayPrice = priceData?.previousAdjustedPriceMYR ?? 0;
  const priceUp = todayPrice >= yesterdayPrice;
  const changeValue = todayPrice - yesterdayPrice;
  const trend = determineTrend(displayHistory);
  const dataStatus = getDataStatus(priceData, preferences.manualMode);
  const calculatorNumber = Number(calculatorInput);
  const calculatorError =
    calculatorInput.trim() === ""
      ? "Enter a value to calculate."
      : !Number.isFinite(calculatorNumber)
        ? "Use numbers only."
        : calculatorNumber <= 0
          ? "Value must be more than 0."
          : null;
  const portfolioGramsError = portfolio.grams < 0 ? "Total grams cannot be negative." : null;
  const portfolioAverageError =
    portfolio.averageBuyPrice < 0 ? "Average buy price cannot be negative." : null;
  const alertTargetError =
    alertState.targetPrice < 0
      ? "Target price cannot be negative."
      : alertState.enabled && alertState.targetPrice <= 0
        ? "Set a target price above 0 to use alerts."
        : null;

  const manualRefresh = async () => {
    if (preferences.manualMode) return;
    try {
      setLoading(true);
      const live = await fetchGoldData(preferences.spread);
      setPriceData(live);
      saveLastPrice(live);
      setError(null);
    } catch {
      setError("Manual refresh failed. Cached values remain available.");
    } finally {
      setLoading(false);
    }
  };

  const installApp = async () => {
    const deferredPrompt = installable as Event & {
      prompt?: () => Promise<void>;
      userChoice?: Promise<{ outcome: string }>;
    };

    if (!deferredPrompt?.prompt) return;
    await deferredPrompt.prompt();
    setInstallable(null);
  };

  return (
    <main className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
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
                onClick={manualRefresh}
                aria-label="Refresh live gold pricing"
                className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              >
                <RefreshCw className={clsx("h-4 w-4", loading && "animate-spin")} />
                Refresh
              </button>
              <button
                onClick={() => setPreferences((current) => ({ ...current, darkMode: !current.darkMode }))}
                aria-pressed={preferences.darkMode}
                aria-label={`Switch to ${preferences.darkMode ? "light" : "dark"} theme`}
                className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              >
                {preferences.darkMode ? <SunMedium className="h-4 w-4" /> : <MoonStar className="h-4 w-4" />}
                Theme
              </button>
              <button
                onClick={() =>
                  setPreferences((current) => ({
                    ...current,
                    currency: current.currency === "MYR" ? "USD" : "MYR",
                  }))
                }
                aria-pressed={preferences.currency === "USD"}
                aria-label={`Switch display currency from ${preferences.currency}`}
                className="surface-card flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition hover:-translate-y-0.5"
              >
                <CircleDollarSign className="h-4 w-4" />
                {preferences.currency}
              </button>
              <button
                onClick={installApp}
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

            <div className="grid gap-3">
              <MiniStat icon={<CandlestickChart className="h-5 w-5" />} label="Today" value={formatCurrency(todayPrice, "MYR")} />
              <MiniStat icon={<Coins className="h-5 w-5" />} label="Yesterday" value={formatCurrency(yesterdayPrice, "MYR")} />
              <MiniStat icon={<WalletCards className="h-5 w-5" />} label="% change" value={`${formatNumber(priceData?.changePercent ?? 0)}%`} />
            </div>
          </div>

          {(error || priceData?.warning) && (
            <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 text-sm text-amber-950 dark:text-amber-100">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <p>{error ?? priceData?.warning}</p>
            </div>
          )}
        </section>

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <SectionCard
            title="Price chart"
            subtitle="Track the estimated adjusted buy price against your preferred currency view."
            action={
              <div className="flex rounded-full border border-white/10 p-1" role="tablist" aria-label="Chart range">
                {(["24H", "7D"] as const).map((range) => (
                  <button
                    key={range}
                    onClick={() => setPreferences((current) => ({ ...current, chartRange: range }))}
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
                    setPreferences((current) => ({
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
                onClick={() => setPreferences((current) => ({ ...current, manualMode: !current.manualMode }))}
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
                      setPreferences((current) => ({
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
                      setPreferences((current) => ({
                        ...current,
                        manualUsdMyr: Number(value) || 0,
                      }))
                    }
                  />
                </div>
              )}
            </div>
          </SectionCard>
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr,0.9fr]">
          <SectionCard title="Gold calculator" subtitle="Instant conversion for ringgit, grams, and dinar.">
            <div className="flex flex-wrap gap-2">
              {([
                ["RM_TO_GRAM", "RM to gram"],
                ["GRAM_TO_RM", "Gram to RM"],
                ["DINAR_TO_RM", "Dinar to RM"],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() =>
                    setPreferences((current) => ({ ...current, calculatorMode: mode }))
                  }
                  aria-pressed={preferences.calculatorMode === mode}
                  className={clsx(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    preferences.calculatorMode === mode
                      ? "bg-[color:var(--gold)] text-black"
                      : "surface-card text-[color:var(--muted)]",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="mt-5 grid gap-4">
              <LabeledInput
                label={
                  preferences.calculatorMode === "RM_TO_GRAM"
                    ? "Amount (RM)"
                    : preferences.calculatorMode === "GRAM_TO_RM"
                      ? "Weight (gram)"
                      : "Dinar"
                }
                type="number"
                value={calculatorInput}
                min={0}
                step="0.01"
                helperText="Calculator uses the current adjusted buy estimate shown above."
                error={calculatorError}
                onChange={setCalculatorInput}
              />

              <div className="rounded-[24px] bg-black/5 p-4 dark:bg-white/5">
                <p className="text-sm text-[color:var(--muted)]">Result</p>
                <p className="mt-3 text-3xl font-semibold">
                  {preferences.calculatorMode === "RM_TO_GRAM"
                    ? `${formatNumber(calculationResult, 4)} g`
                    : formatCurrency(calculationResult, "MYR")}
                </p>
                {preferences.calculatorMode === "DINAR_TO_RM" && (
                  <p className="mt-2 text-sm text-[color:var(--muted)]">1 dinar = {DINAR_IN_GRAMS}g</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS[preferences.calculatorMode].map((value) => (
                  <button
                    key={value}
                    onClick={() => setCalculatorInput(String(value))}
                    className="surface-card rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
                  >
                    {preferences.calculatorMode === "RM_TO_GRAM"
                      ? `RM ${value}`
                      : preferences.calculatorMode === "GRAM_TO_RM"
                        ? `${value}g`
                        : `${value} dinar`}
                  </button>
                ))}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Portfolio" subtitle="Track current value and performance against your average cost.">
            <div className="grid gap-4">
              <LabeledInput
                label="Total grams owned"
                type="number"
                value={String(portfolio.grams)}
                min={0}
                step="0.01"
                helperText="Use your total accumulated weight across all holdings."
                error={portfolioGramsError}
                onChange={(value) => setPortfolio((current) => ({ ...current, grams: Number(value) || 0 }))}
              />
              <LabeledInput
                label="Average buy price (RM/g)"
                type="number"
                value={String(portfolio.averageBuyPrice)}
                min={0}
                step="0.01"
                helperText="Weighted average cost gives a more realistic profit or loss view."
                error={portfolioAverageError}
                onChange={(value) =>
                  setPortfolio((current) => ({ ...current, averageBuyPrice: Number(value) || 0 }))
                }
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Metric label="Current value" value={formatCurrency(portfolioSummary.currentValue, "MYR")} />
                <Metric label="Profit / loss" value={formatCurrency(portfolioSummary.profitLoss, "MYR")} />
              </div>
              <div
                className={clsx(
                  "rounded-2xl px-4 py-3 text-sm font-medium",
                  portfolioSummary.profitLoss >= 0
                    ? "bg-emerald-500/12 text-[color:var(--success)]"
                    : "bg-rose-500/12 text-[color:var(--danger)]",
                )}
              >
                Return: {formatNumber(portfolioSummary.profitPercent)}%
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Alerts & history" subtitle="Get notified when your target price is reached.">
            <div className="space-y-4">
              <button
                onClick={() => setAlertState((current) => ({ ...current, enabled: !current.enabled }))}
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
                  setAlertState((current) => ({ ...current, targetPrice: Number(value) || 0 }))
                }
              />

              <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
                <p className="text-sm text-[color:var(--muted)]">Last 10 updates</p>
                <div className="mt-3 space-y-2">
                  {(priceData?.history ?? []).slice().reverse().map((point) => (
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
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.3fr,0.7fr]">
          <div className="surface-card rounded-[28px] p-5 sm:p-6">
            <h2 className="text-lg font-semibold">How pricing works</h2>
            <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
              We estimate the buy price from live XAU/USD spot, convert using USD/MYR, divide by 31.1035 grams per
              troy ounce, then apply your selected spread. This mirrors a Public Gold-style retail premium instead of
              displaying raw spot alone.
            </p>
          </div>
          <div className="surface-card rounded-[28px] p-5 sm:p-6">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-[color:var(--gold)]">Disclaimer</p>
            <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
              This app provides estimated gold prices and is not affiliated with Public Gold. Actual prices may differ.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-black/5 px-4 py-3 dark:bg-white/5">
      <p className="text-sm text-[color:var(--muted)]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function MiniStat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 rounded-[24px] p-4">
      <div className="rounded-2xl bg-[color:var(--gold)]/15 p-3 text-[color:var(--gold)]">{icon}</div>
      <div>
        <p className="text-sm text-[color:var(--muted)]">{label}</p>
        <p className="mt-1 text-lg font-semibold">{value}</p>
      </div>
    </div>
  );
}

function LabeledInput({
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
      <span className="text-sm text-[color:var(--muted)]">{label}</span>
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
          "mt-2 w-full rounded-2xl border bg-transparent px-4 py-3 outline-none ring-0 transition placeholder:text-[color:var(--muted)] focus:border-[color:var(--gold)]",
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
