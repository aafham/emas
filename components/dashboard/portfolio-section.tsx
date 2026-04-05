"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { Trash2 } from "lucide-react";
import { SectionCard } from "@/components/section-card";
import { LabeledInput, Metric } from "@/components/dashboard/shared";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { PortfolioState, PortfolioTransaction, PortfolioTransactionType } from "@/lib/types";

export function PortfolioSection({
  portfolio,
  portfolioSummary,
  onAddTransaction,
  onDeleteTransaction,
}: {
  portfolio: PortfolioState;
  portfolioSummary: {
    gramsHeld: number;
    averageBuyPrice: number;
    currentValue: number;
    totalCost: number;
    investedCapital: number;
    realizedProfitLoss: number;
    unrealizedProfitLoss: number;
    profitLoss: number;
    profitPercent: number;
    totalBoughtGrams: number;
    totalSoldGrams: number;
  };
  onAddTransaction: (transaction: Omit<PortfolioTransaction, "id">) => void;
  onDeleteTransaction: (transactionId: string) => void;
}) {
  const [transactionType, setTransactionType] = useState<PortfolioTransactionType>("BUY");
  const [gramsInput, setGramsInput] = useState("");
  const [priceInput, setPriceInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const sortedTransactions = useMemo(
    () =>
      [...portfolio.transactions].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [portfolio.transactions],
  );

  const submitTransaction = () => {
    const grams = Number(gramsInput);
    const pricePerGram = Number(priceInput);

    if (!Number.isFinite(grams) || grams <= 0) {
      setFormError("Transaction grams must be above 0.");
      return;
    }

    if (!Number.isFinite(pricePerGram) || pricePerGram <= 0) {
      setFormError("Price per gram must be above 0.");
      return;
    }

    if (transactionType === "SELL" && grams > portfolioSummary.gramsHeld) {
      setFormError("Sell transactions cannot exceed your current holdings.");
      return;
    }

    onAddTransaction({
      type: transactionType,
      grams,
      pricePerGram,
      createdAt: new Date().toISOString(),
      note: noteInput.trim() || undefined,
    });

    setGramsInput("");
    setPriceInput("");
    setNoteInput("");
    setFormError(null);
  };

  return (
    <SectionCard title="Portfolio" subtitle="Track every buy and sell, then let the dashboard calculate holdings and performance.">
      <div className="grid gap-4">
        <div className="flex flex-wrap gap-2">
          {(["BUY", "SELL"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setTransactionType(type)}
              aria-pressed={transactionType === type}
              className={clsx(
                "rounded-full px-4 py-2 text-sm font-medium transition",
                transactionType === type
                  ? "bg-[color:var(--gold)] text-black"
                  : "surface-card text-[color:var(--muted)]",
              )}
            >
              {type === "BUY" ? "Add buy" : "Add sell"}
            </button>
          ))}
        </div>

        <div className="grid gap-4">
          <LabeledInput
            label="Transaction grams"
            type="number"
            value={gramsInput}
            min={0}
            step="0.0001"
            helperText={transactionType === "BUY" ? "Enter how many grams you bought." : "Enter how many grams you sold."}
            error={null}
            onChange={setGramsInput}
          />
          <LabeledInput
            label="Price per gram (RM)"
            type="number"
            value={priceInput}
            min={0}
            step="0.01"
            helperText="Use the actual transaction price, not only the current estimate."
            error={null}
            onChange={setPriceInput}
          />
          <LabeledInput
            label="Note"
            value={noteInput}
            helperText="Optional: dealer name, branch, or anything you want to remember."
            error={null}
            onChange={setNoteInput}
          />
          {formError ? <p className="text-xs font-medium text-[color:var(--danger)]">{formError}</p> : null}
          <button
            onClick={submitTransaction}
            className="rounded-2xl bg-[color:var(--gold)] px-4 py-3 text-sm font-semibold text-black transition hover:opacity-90"
          >
            Save transaction
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Metric label="Current holdings" value={`${formatNumber(portfolioSummary.gramsHeld, 4)} g`} />
          <Metric label="Average cost" value={formatCurrency(portfolioSummary.averageBuyPrice, "MYR")} />
          <Metric label="Current value" value={formatCurrency(portfolioSummary.currentValue, "MYR")} />
          <Metric label="Remaining cost basis" value={formatCurrency(portfolioSummary.totalCost, "MYR")} />
          <Metric label="Realized P/L" value={formatCurrency(portfolioSummary.realizedProfitLoss, "MYR")} />
          <Metric label="Unrealized P/L" value={formatCurrency(portfolioSummary.unrealizedProfitLoss, "MYR")} />
        </div>

        <div
          className={clsx(
            "rounded-2xl px-4 py-3 text-sm font-medium",
            portfolioSummary.profitLoss >= 0
              ? "bg-emerald-500/12 text-[color:var(--success)]"
              : "bg-rose-500/12 text-[color:var(--danger)]",
          )}
        >
          Total return: {formatCurrency(portfolioSummary.profitLoss, "MYR")} ({formatNumber(portfolioSummary.profitPercent)}%)
        </div>

        <div className="rounded-2xl bg-black/5 p-4 dark:bg-white/5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-[color:var(--muted)]">Transaction history</p>
            <p className="text-xs text-[color:var(--muted)]">
              Bought {formatNumber(portfolioSummary.totalBoughtGrams, 4)}g, sold {formatNumber(portfolioSummary.totalSoldGrams, 4)}g
            </p>
          </div>

          {sortedTransactions.length === 0 ? (
            <p className="mt-3 text-sm text-[color:var(--muted)]">No transactions yet. Add your first buy to start tracking performance.</p>
          ) : (
            <div className="mt-3 space-y-3">
              {sortedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-white/10 px-4 py-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={clsx(
                          "rounded-full px-2.5 py-1 text-xs font-semibold",
                          transaction.type === "BUY"
                            ? "bg-emerald-500/15 text-[color:var(--success)]"
                            : "bg-rose-500/15 text-[color:var(--danger)]",
                        )}
                      >
                        {transaction.type}
                      </span>
                      <span className="text-sm font-medium">
                        {formatNumber(transaction.grams, 4)}g at {formatCurrency(transaction.pricePerGram, "MYR")}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-[color:var(--muted)]">
                      {new Date(transaction.createdAt).toLocaleString("en-MY", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </p>
                    {transaction.note ? (
                      <p className="mt-2 text-sm text-[color:var(--muted)]">{transaction.note}</p>
                    ) : null}
                  </div>
                  <button
                    onClick={() => onDeleteTransaction(transaction.id)}
                    aria-label="Delete transaction"
                    className="rounded-xl border border-white/10 p-2 text-[color:var(--muted)] transition hover:text-[color:var(--danger)]"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
