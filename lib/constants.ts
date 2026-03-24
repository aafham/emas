import { PreferencesState } from "@/lib/types";

export const TROY_OUNCE_IN_GRAMS = 31.1035;
export const DINAR_IN_GRAMS = 4.25;
export const AUTO_REFRESH_MS = 1_200_000;
export const DEFAULT_SPREAD = 0.07;
export const SPREAD_MIN = 0.05;
export const SPREAD_MAX = 0.1;
export const MAX_HISTORY_POINTS = 10;

export const DEFAULT_PREFERENCES: PreferencesState = {
  spread: DEFAULT_SPREAD,
  currency: "MYR",
  darkMode: false,
  manualMode: false,
  manualSpotUsd: 2325,
  manualUsdMyr: 4.72,
  calculatorMode: "RM_TO_GRAM",
  chartRange: "24H",
};
