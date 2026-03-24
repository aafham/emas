import { PricePoint } from "@/lib/types";
import { round } from "@/lib/calculations";

export function buildSyntheticHistory(
  basePrice: number,
  previousPrice: number,
  range: "24H" | "7D",
) {
  const totalPoints: number = range === "24H" ? 24 : 7;
  const start = previousPrice || basePrice * 0.985;
  const diff = basePrice - start;

  return Array.from({ length: totalPoints }).map((_, index) => {
    const progress = index / (totalPoints - 1);
    const seasonal = Math.sin(progress * Math.PI * 2) * basePrice * 0.0035;
    const value = start + diff * progress + seasonal;
    const date = new Date();

    if (range === "24H") {
      date.setHours(date.getHours() - (totalPoints - 1 - index));
    } else {
      date.setDate(date.getDate() - (totalPoints - 1 - index));
    }

    return {
      timestamp: date.toISOString(),
      adjustedPrice: round(value),
      spotPrice: round(value / 1.07),
    } satisfies PricePoint;
  });
}
