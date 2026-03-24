import { GoldApiResponse } from "@/lib/types";

export async function fetchGoldData(spread: number) {
  const response = await fetch(`/api/gold?spread=${spread}`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("Unable to fetch gold price");
  }

  return (await response.json()) as GoldApiResponse;
}
