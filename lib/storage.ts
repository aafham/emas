import {
  AlertState,
  GoldApiResponse,
  PortfolioState,
  PreferencesState,
} from "@/lib/types";
import { DEFAULT_PREFERENCES } from "@/lib/constants";

const KEYS = {
  preferences: "emas.preferences",
  portfolio: "emas.portfolio",
  alert: "emas.alert",
  lastPrice: "emas.lastPrice",
};

function parseJson<T>(value: string | null, fallback: T): T {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function loadPreferences(): PreferencesState {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }

  return {
    ...DEFAULT_PREFERENCES,
    ...parseJson<Partial<PreferencesState>>(localStorage.getItem(KEYS.preferences), {}),
  };
}

export function savePreferences(value: PreferencesState) {
  localStorage.setItem(KEYS.preferences, JSON.stringify(value));
}

export function loadPortfolio(): PortfolioState {
  return parseJson<PortfolioState>(
    typeof window === "undefined" ? null : localStorage.getItem(KEYS.portfolio),
    { grams: 0, averageBuyPrice: 0 },
  );
}

export function savePortfolio(value: PortfolioState) {
  localStorage.setItem(KEYS.portfolio, JSON.stringify(value));
}

export function loadAlert(): AlertState {
  return parseJson<AlertState>(
    typeof window === "undefined" ? null : localStorage.getItem(KEYS.alert),
    { enabled: false, targetPrice: 0 },
  );
}

export function saveAlert(value: AlertState) {
  localStorage.setItem(KEYS.alert, JSON.stringify(value));
}

export function loadLastPrice(): GoldApiResponse | null {
  return parseJson<GoldApiResponse | null>(
    typeof window === "undefined" ? null : localStorage.getItem(KEYS.lastPrice),
    null,
  );
}

export function saveLastPrice(value: GoldApiResponse) {
  localStorage.setItem(KEYS.lastPrice, JSON.stringify(value));
}
