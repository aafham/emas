"use client";

import {
  Area,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PricePoint } from "@/lib/types";
import { formatCurrency } from "@/lib/calculations";

interface PriceChartProps {
  data: PricePoint[];
  currency: "MYR" | "USD";
  usdMyrRate: number;
}

export function PriceChart({ data, currency, usdMyrRate }: PriceChartProps) {
  const normalized = data.map((point) => ({
    ...point,
    label:
      data.length > 10
        ? new Date(point.timestamp).toLocaleTimeString("en-MY", {
            hour: "numeric",
            minute: "2-digit",
          })
        : new Date(point.timestamp).toLocaleDateString("en-MY", {
            month: "short",
            day: "numeric",
          }),
    value: currency === "MYR" ? point.adjustedPrice : point.adjustedPrice / usdMyrRate,
  }));
  const firstValue = normalized[0]?.value;
  const lastValue = normalized[normalized.length - 1]?.value;
  const chartSummary =
    normalized.length > 1 && firstValue !== undefined && lastValue !== undefined
      ? `Price chart with ${normalized.length} points. It starts at ${formatCurrency(firstValue, currency)} and ends at ${formatCurrency(lastValue, currency)}.`
      : "Price chart unavailable until pricing data is loaded.";
  const values = normalized.map((point) => point.value);
  const minValue = values.length > 0 ? Math.min(...values) : 0;
  const maxValue = values.length > 0 ? Math.max(...values) : 0;
  const spread = Math.max(maxValue - minValue, currency === "MYR" ? 8 : 2);
  const chartMin = Math.max(0, minValue - spread * 0.55);
  const chartMax = maxValue + spread * 0.55;

  return (
    <div className="h-72 w-full" role="img" aria-label={chartSummary}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalized}>
          <defs>
            <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#F0C54E" />
              <stop offset="100%" stopColor="#17C989" />
            </linearGradient>
            <linearGradient id="chartFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="rgba(240,197,78,0.24)" />
              <stop offset="100%" stopColor="rgba(23,201,137,0.02)" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.15)" vertical={false} strokeDasharray="3 6" />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            dy={10}
          />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={74}
            tickCount={5}
            domain={[chartMin, chartMax]}
            tickFormatter={(value) =>
              currency === "MYR" ? `RM${Number(value).toFixed(0)}` : `$${Number(value).toFixed(1)}`
            }
          />
          <Tooltip
            contentStyle={{
              background: "rgba(17,17,17,0.94)",
              border: "1px solid rgba(240,197,78,0.14)",
              borderRadius: "18px",
              color: "#fff",
              boxShadow: "0 14px 40px rgba(0,0,0,0.24)",
            }}
            formatter={(value: number) => formatCurrency(value, currency)}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke="none"
            fill="url(#chartFill)"
            fillOpacity={1}
            isAnimationActive={false}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#chartStroke)"
            strokeWidth={3.25}
            dot={false}
            activeDot={{ r: 5, fill: "#F0C54E", stroke: "#111", strokeWidth: 2 }}
            animationDuration={820}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
