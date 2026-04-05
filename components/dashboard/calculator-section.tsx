"use client";

import type { Dispatch, SetStateAction } from "react";
import clsx from "clsx";
import { SectionCard } from "@/components/section-card";
import { LabeledInput, QUICK_ACTIONS } from "@/components/dashboard/shared";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { DINAR_IN_GRAMS } from "@/lib/constants";
import { PreferencesState } from "@/lib/types";

export function CalculatorSection({
  preferences,
  calculatorInput,
  calculationResult,
  calculatorError,
  onSetPreferences,
  onSetCalculatorInput,
}: {
  preferences: PreferencesState;
  calculatorInput: string;
  calculationResult: number;
  calculatorError: string | null;
  onSetPreferences: Dispatch<SetStateAction<PreferencesState>>;
  onSetCalculatorInput: (value: string) => void;
}) {
  return (
    <SectionCard title="Gold calculator" subtitle="Instant conversion for ringgit, grams, and dinar.">
      <div className="flex flex-wrap gap-2">
        {([
          ["RM_TO_GRAM", "RM to gram"],
          ["GRAM_TO_RM", "Gram to RM"],
          ["DINAR_TO_RM", "Dinar to RM"],
        ] as const).map(([mode, label]) => (
          <button
            key={mode}
            onClick={() => onSetPreferences((current) => ({ ...current, calculatorMode: mode }))}
            aria-pressed={preferences.calculatorMode === mode}
            className={clsx(
              "rounded-full px-4 py-2 text-sm font-medium transition",
              preferences.calculatorMode === mode
                ? "bg-[color:var(--gold)] text-black"
                : "surface-card text-[color:var(--muted)]",
            )}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-5 grid gap-4">
        <LabeledInput
          label={
            preferences.calculatorMode === "RM_TO_GRAM"
              ? "Amount (RM)"
              : preferences.calculatorMode === "GRAM_TO_RM"
                ? "Weight (gram)"
                : "Dinar"
          }
          type="number"
          value={calculatorInput}
          min={0}
          step="0.01"
          helperText="Calculator uses the current adjusted buy estimate shown above."
          error={calculatorError}
          onChange={onSetCalculatorInput}
        />

        <div className="rounded-[24px] bg-black/5 p-4 dark:bg-white/5">
          <p className="text-sm text-[color:var(--muted)]">Result</p>
          <p className="mt-3 text-3xl font-semibold">
            {preferences.calculatorMode === "RM_TO_GRAM"
              ? `${formatNumber(calculationResult, 4)} g`
              : formatCurrency(calculationResult, "MYR")}
          </p>
          {preferences.calculatorMode === "DINAR_TO_RM" && (
            <p className="mt-2 text-sm text-[color:var(--muted)]">1 dinar = {DINAR_IN_GRAMS}g</p>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS[preferences.calculatorMode].map((value) => (
            <button
              key={value}
              onClick={() => onSetCalculatorInput(String(value))}
              className="surface-card rounded-full px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5"
            >
              {preferences.calculatorMode === "RM_TO_GRAM"
                ? `RM ${value}`
                : preferences.calculatorMode === "GRAM_TO_RM"
                  ? `${value}g`
                  : `${value} dinar`}
            </button>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}
