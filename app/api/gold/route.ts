import { NextRequest, NextResponse } from "next/server";
import { buildSyntheticHistory } from "@/lib/chart";
import { calculateAdjustedPricePerGram, percentageChange, round } from "@/lib/calculations";
import { DEFAULT_SPREAD, MAX_HISTORY_POINTS, SPREAD_MAX, SPREAD_MIN } from "@/lib/constants";
import { GoldApiResponse, PricePoint } from "@/lib/types";

type ProviderPayload = {
  spotUsdPerOunce: number;
  usdMyrRate: number;
  source: string;
};

type ServerCache = {
  latest?: GoldApiResponse;
  history: PricePoint[];
};

const globalCache = globalThis as typeof globalThis & { __emasCache?: ServerCache };
const cache = globalCache.__emasCache ?? { history: [] };
globalCache.__emasCache = cache;

async function fetchGoldApiDotCom(): Promise<ProviderPayload> {
  const goldRes = await fetch("https://gold-api.com/price/XAU", {
    next: { revalidate: 600 },
  });

  if (!goldRes.ok) {
    throw new Error("gold-api.com unavailable");
  }

  const goldJson = (await goldRes.json()) as { price?: number };
  const usdMyrRate = await fetchUsdMyrRate();

  if (!goldJson.price) {
    throw new Error("gold-api.com returned invalid payload");
  }

  return {
    spotUsdPerOunce: goldJson.price,
    usdMyrRate,
    source: "gold-api.com",
  };
}

async function fetchGoldApiIo(): Promise<ProviderPayload> {
  const apiKey = process.env.GOLDAPI_API_KEY;

  if (!apiKey) {
    throw new Error("goldapi.io key missing");
  }

  const [goldRes, fxRes] = await Promise.all([
    fetch("https://www.goldapi.io/api/XAU/USD", {
      headers: { "x-access-token": apiKey, "Content-Type": "application/json" },
      next: { revalidate: 600 },
    }),
    fetch("https://www.goldapi.io/api/USD/MYR", {
      headers: { "x-access-token": apiKey, "Content-Type": "application/json" },
      next: { revalidate: 600 },
    }),
  ]);

  if (!goldRes.ok || !fxRes.ok) {
    throw new Error("goldapi.io unavailable");
  }

  const goldJson = (await goldRes.json()) as { price?: number };
  const fxJson = (await fxRes.json()) as { price?: number };

  if (!goldJson.price || !fxJson.price) {
    throw new Error("goldapi.io returned invalid payload");
  }

  return {
    spotUsdPerOunce: goldJson.price,
    usdMyrRate: fxJson.price,
    source: "goldapi.io",
  };
}

async function fetchMetalsApi(): Promise<ProviderPayload> {
  const apiKey = process.env.METALS_API_KEY;

  if (!apiKey) {
    throw new Error("metals-api key missing");
  }

  const response = await fetch(
    `https://metals-api.com/api/latest?access_key=${apiKey}&base=USD&symbols=XAU,MYR`,
    {
      next: { revalidate: 600 },
    },
  );

  if (!response.ok) {
    throw new Error("metals-api unavailable");
  }

  const json = (await response.json()) as {
    success?: boolean;
    rates?: { XAU?: number; MYR?: number };
  };
  const xauRate = json.rates?.XAU;
  const myrRate = json.rates?.MYR;

  if (!json.success || !xauRate || !myrRate) {
    throw new Error("metals-api returned invalid payload");
  }

  return {
    spotUsdPerOunce: 1 / xauRate,
    usdMyrRate: myrRate,
    source: "metals-api.com",
  };
}

async function fetchUsdMyrRate() {
  const response = await fetch("https://open.er-api.com/v6/latest/USD", {
    next: { revalidate: 600 },
  });

  if (!response.ok) {
    throw new Error("USD/MYR unavailable");
  }

  const json = (await response.json()) as { rates?: { MYR?: number } };

  if (!json.rates?.MYR) {
    throw new Error("Invalid USD/MYR payload");
  }

  return json.rates.MYR;
}

async function fetchProviderPayload() {
  const providers = [fetchGoldApiDotCom, fetchGoldApiIo, fetchMetalsApi];
  const errors: string[] = [];

  for (const provider of providers) {
    try {
      return await provider();
    } catch (error) {
      errors.push(error instanceof Error ? error.message : "Unknown provider error");
    }
  }

  throw new Error(errors.join("; "));
}

function pushHistory(point: PricePoint) {
  cache.history = [...cache.history, point].slice(-MAX_HISTORY_POINTS);
}

export async function GET(request: NextRequest) {
  const spreadParam = Number(request.nextUrl.searchParams.get("spread"));
  const spread = Math.min(Math.max(Number.isFinite(spreadParam) ? spreadParam : DEFAULT_SPREAD, SPREAD_MIN), SPREAD_MAX);

  try {
    const provider = await fetchProviderPayload();
    const calculated = calculateAdjustedPricePerGram(
      provider.spotUsdPerOunce,
      provider.usdMyrRate,
      spread,
    );
    const previousAdjustedPriceMYR =
      cache.latest?.adjustedPriceMYR ?? round(calculated.adjustedPriceMYR * 0.992);
    const point: PricePoint = {
      timestamp: new Date().toISOString(),
      adjustedPrice: calculated.adjustedPriceMYR,
      spotPrice: calculated.spotPriceMYR,
    };

    pushHistory(point);

    const response: GoldApiResponse = {
      adjustedPriceMYR: calculated.adjustedPriceMYR,
      adjustedPriceUSD: calculated.adjustedPriceUSD,
      spotPriceMYR: calculated.spotPriceMYR,
      spotPriceUSD: calculated.spotPriceUSD,
      usdMyrRate: provider.usdMyrRate,
      spread,
      updatedAt: point.timestamp,
      previousAdjustedPriceMYR,
      changePercent: percentageChange(calculated.adjustedPriceMYR, previousAdjustedPriceMYR),
      history:
        cache.history.length >= 4
          ? cache.history
          : buildSyntheticHistory(calculated.adjustedPriceMYR, previousAdjustedPriceMYR, "24H"),
      source: provider.source,
      isFallback: false,
    };

    cache.latest = response;
    return NextResponse.json(response, {
      headers: { "Cache-Control": "s-maxage=600, stale-while-revalidate=900" },
    });
  } catch (error) {
    const cached = cache.latest;

    if (cached) {
      return NextResponse.json(
        {
          ...cached,
          warning:
            "Live API unavailable. Showing the latest cached estimate. Actual market prices may have moved.",
          isFallback: true,
          history:
            cached.history.length > 0
              ? cached.history
              : buildSyntheticHistory(cached.adjustedPriceMYR, cached.previousAdjustedPriceMYR, "24H"),
        } satisfies GoldApiResponse,
      );
    }

    const fallbackSpotUsd = 2325;
    const fallbackUsdMyr = 4.72;
    const calculated = calculateAdjustedPricePerGram(fallbackSpotUsd, fallbackUsdMyr, spread);
    const previousAdjustedPriceMYR = round(calculated.adjustedPriceMYR * 0.989);

    return NextResponse.json(
      {
        adjustedPriceMYR: calculated.adjustedPriceMYR,
        adjustedPriceUSD: calculated.adjustedPriceUSD,
        spotPriceMYR: calculated.spotPriceMYR,
        spotPriceUSD: calculated.spotPriceUSD,
        usdMyrRate: fallbackUsdMyr,
        spread,
        updatedAt: new Date().toISOString(),
        previousAdjustedPriceMYR,
        changePercent: percentageChange(calculated.adjustedPriceMYR, previousAdjustedPriceMYR),
        history: buildSyntheticHistory(calculated.adjustedPriceMYR, previousAdjustedPriceMYR, "24H"),
        source: "offline fallback",
        warning:
          error instanceof Error
            ? `Live API unavailable (${error.message}). Using an offline estimate.`
            : "Live API unavailable. Using an offline estimate.",
        isFallback: true,
      } satisfies GoldApiResponse,
      { status: 200 },
    );
  }
}
