"use client";

import type { Dispatch, SetStateAction } from "react";
import clsx from "clsx";
import { SectionCard } from "@/components/section-card";
import { LabeledInput, Metric } from "@/components/dashboard/shared";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { PortfolioState } from "@/lib/types";

export function PortfolioSection({
  portfolio,
  portfolioSummary,
  portfolioGramsError,
  portfolioAverageError,
  onSetPortfolio,
}: {
  portfolio: PortfolioState;
  portfolioSummary: {
    currentValue: number;
    totalCost: number;
    profitLoss: number;
    profitPercent: number;
  };
  portfolioGramsError: string | null;
  portfolioAverageError: string | null;
  onSetPortfolio: Dispatch<SetStateAction<PortfolioState>>;
}) {
  return (
    <SectionCard title="Portfolio" subtitle="Track current value and performance against your average cost.">
      <div className="grid gap-4">
        <LabeledInput
          label="Total grams owned"
          type="number"
          value={String(portfolio.grams)}
          min={0}
          step="0.01"
          helperText="Use your total accumulated weight across all holdings."
          error={portfolioGramsError}
          onChange={(value) => onSetPortfolio((current) => ({ ...current, grams: Number(value) || 0 }))}
        />
        <LabeledInput
          label="Average buy price (RM/g)"
          type="number"
          value={String(portfolio.averageBuyPrice)}
          min={0}
          step="0.01"
          helperText="Weighted average cost gives a more realistic profit or loss view."
          error={portfolioAverageError}
          onChange={(value) =>
            onSetPortfolio((current) => ({ ...current, averageBuyPrice: Number(value) || 0 }))
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Current value" value={formatCurrency(portfolioSummary.currentValue, "MYR")} />
          <Metric label="Profit / loss" value={formatCurrency(portfolioSummary.profitLoss, "MYR")} />
        </div>
        <div
          className={clsx(
            "rounded-2xl px-4 py-3 text-sm font-medium",
            portfolioSummary.profitLoss >= 0
              ? "bg-emerald-500/12 text-[color:var(--success)]"
              : "bg-rose-500/12 text-[color:var(--danger)]",
          )}
        >
          Return: {formatNumber(portfolioSummary.profitPercent)}%
        </div>
      </div>
    </SectionCard>
  );
}
