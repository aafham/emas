import {
  AlertState,
  GoldApiResponse,
  PortfolioState,
  PortfolioTransaction,
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
  const fallback: PortfolioState = { transactions: [] };
  const rawPortfolio = parseJson<
    PortfolioState | { grams?: number; averageBuyPrice?: number; transactions?: PortfolioTransaction[] }
  >(typeof window === "undefined" ? null : localStorage.getItem(KEYS.portfolio), fallback);

  if (Array.isArray(rawPortfolio.transactions)) {
    return { transactions: rawPortfolio.transactions };
  }

  const raw = rawPortfolio as { grams?: number; averageBuyPrice?: number };

  const grams = Number(raw.grams) || 0;
  const averageBuyPrice = Number(raw.averageBuyPrice) || 0;

  if (grams <= 0 || averageBuyPrice <= 0) {
    return fallback;
  }

  return {
    transactions: [
      {
        id: "legacy-holding",
        type: "BUY",
        grams,
        pricePerGram: averageBuyPrice,
        createdAt: new Date().toISOString(),
        note: "Imported from legacy portfolio",
      },
    ],
  };
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
