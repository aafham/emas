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
  const sortedTransactions = [...portfolio.transactions].sort((a, b) =>
    a.createdAt.localeCompare(b.createdAt),
  );

  let gramsHeld = 0;
  let costBasis = 0;
  let investedCapital = 0;
  let realizedProfitLoss = 0;
  let totalBoughtGrams = 0;
  let totalSoldGrams = 0;

  for (const transaction of sortedTransactions) {
    if (transaction.type === "BUY") {
      gramsHeld += transaction.grams;
      costBasis += transaction.grams * transaction.pricePerGram;
      investedCapital += transaction.grams * transaction.pricePerGram;
      totalBoughtGrams += transaction.grams;
      continue;
    }

    totalSoldGrams += transaction.grams;

    if (gramsHeld <= 0) {
      continue;
    }

    const saleGrams = Math.min(transaction.grams, gramsHeld);
    const averageCostPerGram = gramsHeld > 0 ? costBasis / gramsHeld : 0;
    const removedCost = saleGrams * averageCostPerGram;

    gramsHeld -= saleGrams;
    costBasis -= removedCost;
    realizedProfitLoss += saleGrams * transaction.pricePerGram - removedCost;
  }

  const averageBuyPrice = gramsHeld > 0 ? costBasis / gramsHeld : 0;
  const currentValue = gramsHeld * pricePerGram;
  const unrealizedProfitLoss = currentValue - costBasis;
  const totalProfitLoss = realizedProfitLoss + unrealizedProfitLoss;
  const profitPercent = investedCapital > 0 ? (totalProfitLoss / investedCapital) * 100 : 0;

  return {
    gramsHeld: round(gramsHeld, 4),
    averageBuyPrice: round(averageBuyPrice),
    currentValue: round(currentValue),
    totalCost: round(costBasis),
    investedCapital: round(investedCapital),
    realizedProfitLoss: round(realizedProfitLoss),
    unrealizedProfitLoss: round(unrealizedProfitLoss),
    profitLoss: round(totalProfitLoss),
    profitPercent: round(profitPercent),
    totalBoughtGrams: round(totalBoughtGrams, 4),
    totalSoldGrams: round(totalSoldGrams, 4),
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
