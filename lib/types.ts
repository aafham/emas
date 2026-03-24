export type CurrencyMode = "MYR" | "USD";
export type CalculatorMode = "RM_TO_GRAM" | "GRAM_TO_RM" | "DINAR_TO_RM";
export type ChartRange = "24H" | "7D";
export type Trend = "bullish" | "bearish" | "sideways";

export interface PricePoint {
  timestamp: string;
  adjustedPrice: number;
  spotPrice: number;
}

export interface GoldApiResponse {
  adjustedPriceMYR: number;
  adjustedPriceUSD: number;
  spotPriceMYR: number;
  spotPriceUSD: number;
  usdMyrRate: number;
  spread: number;
  updatedAt: string;
  previousAdjustedPriceMYR: number;
  changePercent: number;
  history: PricePoint[];
  source: string;
  warning?: string;
  isFallback: boolean;
}

export interface PortfolioState {
  grams: number;
  averageBuyPrice: number;
}

export interface AlertState {
  enabled: boolean;
  targetPrice: number;
  lastTriggeredAt?: string;
}

export interface PreferencesState {
  spread: number;
  currency: CurrencyMode;
  darkMode: boolean;
  manualMode: boolean;
  manualSpotUsd: number;
  manualUsdMyr: number;
  calculatorMode: CalculatorMode;
  chartRange: ChartRange;
}
