"use client";

import {
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

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={normalized}>
          <defs>
            <linearGradient id="chartStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#D4AF37" />
              <stop offset="100%" stopColor="#0F9F6E" />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
          <XAxis dataKey="label" tick={{ fill: "var(--muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis
            tick={{ fill: "var(--muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={74}
            tickFormatter={(value) =>
              currency === "MYR" ? `RM${Number(value).toFixed(0)}` : `$${Number(value).toFixed(1)}`
            }
          />
          <Tooltip
            contentStyle={{
              background: "rgba(17,17,17,0.9)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: "16px",
              color: "#fff",
            }}
            formatter={(value: number) => formatCurrency(value, currency)}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke="url(#chartStroke)"
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 5, fill: "#D4AF37" }}
            animationDuration={700}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
