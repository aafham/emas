import {
  DEFAULT_SPREAD,
  DINAR_IN_GRAMS,
  TROY_OUNCE_IN_GRAMS,
} from "@/lib/constants";
import { CalculatorMode, GoldApiResponse, PortfolioState, Trend } from "@/lib/types";

export function calculateAdjustedPricePerGram(
  spotUsdPerOunce: number,
  usdMyrRate: number,
  spread: number = DEFAULT_SPREAD,
) {
  const priceMyrPerOunce = spotUsdPerOunce * usdMyrRate;
  const pricePerGram = priceMyrPerOunce / TROY_OUNCE_IN_GRAMS;

  return {
    spotPriceMYR: round(pricePerGram),
    adjustedPriceMYR: round(pricePerGram * (1 + spread)),
    spotPriceUSD: round(spotUsdPerOunce / TROY_OUNCE_IN_GRAMS),
    adjustedPriceUSD: round((spotUsdPerOunce / TROY_OUNCE_IN_GRAMS) * (1 + spread)),
  };
}

export function convertValue(
  mode: CalculatorMode,
  input: number,
  adjustedPricePerGram: number,
) {
  if (!Number.isFinite(input) || adjustedPricePerGram <= 0) {
    return 0;
  }

  switch (mode) {
    case "RM_TO_GRAM":
      return input / adjustedPricePerGram;
    case "GRAM_TO_RM":
      return input * adjustedPricePerGram;
    case "DINAR_TO_RM":
      return input * DINAR_IN_GRAMS * adjustedPricePerGram;
    default:
      return 0;
  }
}

export function calculatePortfolio(portfolio: PortfolioState, pricePerGram: number) {
  const currentValue = portfolio.grams * pricePerGram;
  const totalCost = portfolio.grams * portfolio.averageBuyPrice;
  const profitLoss = currentValue - totalCost;
  const profitPercent = totalCost > 0 ? (profitLoss / totalCost) * 100 : 0;

  return {
    currentValue: round(currentValue),
    totalCost: round(totalCost),
    profitLoss: round(profitLoss),
    profitPercent: round(profitPercent),
  };
}

export function determineTrend(history: GoldApiResponse["history"]): Trend {
  if (history.length < 3) {
    return "sideways";
  }

  const first = history[0]?.adjustedPrice ?? 0;
  const last = history[history.length - 1]?.adjustedPrice ?? first;
  const delta = last - first;

  if (delta > 1.5) {
    return "bullish";
  }

  if (delta < -1.5) {
    return "bearish";
  }

  return "sideways";
}

export function formatCurrency(value: number, currency: "MYR" | "USD") {
  return new Intl.NumberFormat("en-MY", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatNumber(value: number, digits = 2) {
  return new Intl.NumberFormat("en-MY", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function percentageChange(current: number, previous: number) {
  if (!previous) {
    return 0;
  }

  return round(((current - previous) / previous) * 100);
}

export function round(value: number, digits = 2) {
  return Number(value.toFixed(digits));
}
