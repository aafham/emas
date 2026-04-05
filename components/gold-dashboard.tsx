"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardHeroSection } from "@/components/dashboard/hero-section";
import { PriceChartSection } from "@/components/dashboard/price-chart-section";
import { SpreadControlsSection } from "@/components/dashboard/spread-controls-section";
import { CalculatorSection } from "@/components/dashboard/calculator-section";
import { PortfolioSection } from "@/components/dashboard/portfolio-section";
import { AlertsSection } from "@/components/dashboard/alerts-section";
import { getDataStatus } from "@/components/dashboard/shared";
import { fetchGoldData } from "@/lib/api";
import { buildSyntheticHistory } from "@/lib/chart";
import {
  calculatePortfolio,
  convertValue,
  determineTrend,
} from "@/lib/calculations";
import { AUTO_REFRESH_MS, DEFAULT_PREFERENCES } from "@/lib/constants";
import {
  AlertState,
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
        const previous = loadLastPrice()?.adjustedPriceMYR ?? adjusted * 0.995;
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

        if (!mounted) {
          return;
        }

        setPriceData(live);
        setError(null);
        setLoading(false);
        saveLastPrice(live);
      } catch {
        const cached = loadLastPrice();

        if (!mounted) {
          return;
        }

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
    if (!priceData || !alertState.enabled || alertState.targetPrice <= 0) {
      return;
    }

    if (priceData.adjustedPriceMYR < alertState.targetPrice) {
      return;
    }

    const lastTriggeredAt = alertState.lastTriggeredAt
      ? new Date(alertState.lastTriggeredAt).getTime()
      : 0;

    if (Date.now() - lastTriggeredAt < AUTO_REFRESH_MS / 2) {
      return;
    }

    const trigger = async () => {
      if (!("Notification" in window)) {
        return;
      }

      if (Notification.permission === "default") {
        await Notification.requestPermission();
      }

      if (Notification.permission === "granted") {
        new Notification("Gold target reached", {
          body: `Estimated gold price is now RM ${priceData.adjustedPriceMYR.toFixed(2)} per gram.`,
        });
        setAlertState((current) => ({ ...current, lastTriggeredAt: new Date().toISOString() }));
      }
    };

    trigger().catch(() => undefined);
  }, [alertState, priceData]);

  const selectedPrice = useMemo(() => {
    if (!priceData) {
      return 0;
    }

    return preferences.currency === "MYR" ? priceData.adjustedPriceMYR : priceData.adjustedPriceUSD;
  }, [preferences.currency, priceData]);

  const displayHistory = useMemo(() => {
    if (!priceData) {
      return [];
    }

    if (preferences.chartRange === "24H") {
      return priceData.history.length > 0
        ? priceData.history
        : buildSyntheticHistory(priceData.adjustedPriceMYR, priceData.previousAdjustedPriceMYR, "24H");
    }

    return buildSyntheticHistory(priceData.adjustedPriceMYR, priceData.previousAdjustedPriceMYR, "7D");
  }, [preferences.chartRange, priceData]);

  const calculationResult = useMemo(() => {
    if (!priceData) {
      return 0;
    }

    return convertValue(preferences.calculatorMode, Number(calculatorInput), priceData.adjustedPriceMYR);
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
    if (preferences.manualMode) {
      return;
    }

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

    if (!deferredPrompt?.prompt) {
      return;
    }

    await deferredPrompt.prompt();
    setInstallable(null);
  };

  return (
    <main className="relative mx-auto min-h-screen max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5">
        <DashboardHeroSection
          loading={loading}
          priceData={priceData}
          preferences={preferences}
          selectedPrice={selectedPrice}
          priceUp={priceUp}
          changeValue={changeValue}
          trend={trend}
          todayPrice={todayPrice}
          yesterdayPrice={yesterdayPrice}
          error={error}
          dataStatus={dataStatus}
          installable={installable}
          onRefresh={manualRefresh}
          onToggleTheme={() => setPreferences((current) => ({ ...current, darkMode: !current.darkMode }))}
          onToggleCurrency={() =>
            setPreferences((current) => ({
              ...current,
              currency: current.currency === "MYR" ? "USD" : "MYR",
            }))
          }
          onInstall={installApp}
        />

        <div className="grid gap-5 xl:grid-cols-[1.2fr,0.8fr]">
          <PriceChartSection
            preferences={preferences}
            priceData={priceData}
            displayHistory={displayHistory}
            onChangeRange={(range) => setPreferences((current) => ({ ...current, chartRange: range }))}
          />
          <SpreadControlsSection
            preferences={preferences}
            priceData={priceData}
            onSetPreferences={setPreferences}
          />
        </div>

        <div className="grid gap-5 xl:grid-cols-[1fr,1fr,0.9fr]">
          <CalculatorSection
            preferences={preferences}
            calculatorInput={calculatorInput}
            calculationResult={calculationResult}
            calculatorError={calculatorError}
            onSetPreferences={setPreferences}
            onSetCalculatorInput={setCalculatorInput}
          />
          <PortfolioSection
            portfolio={portfolio}
            portfolioSummary={portfolioSummary}
            portfolioGramsError={portfolioGramsError}
            portfolioAverageError={portfolioAverageError}
            onSetPortfolio={setPortfolio}
          />
          <AlertsSection
            alertState={alertState}
            alertTargetError={alertTargetError}
            priceHistory={priceData?.history ?? []}
            onSetAlertState={setAlertState}
          />
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
