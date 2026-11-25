"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartDataPoint } from "@/features/admin/lib/admin";
import { useLanguage } from "@/lib/i18n";

const currency = new Intl.NumberFormat("en-EG", {
  style: "currency",
  currency: "EGP",
  maximumFractionDigits: 0,
});

export function AdminCharts({ data }: { data: ChartDataPoint[] }) {
  const { locale } = useLanguage();
  const isAr = locale === "ar";
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isAr ? "الطلبات عبر الزمن" : "Orders over time"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {isAr ? "آخر 6 أشهر" : "Last 6 months"}
        </p>
        <div className="mt-4 h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [
                  Number(value),
                  isAr ? "الطلبات" : "Orders",
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4, fill: "hsl(var(--primary))" }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="rounded-xl border border-border bg-background p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {isAr ? "الإيرادات الشهرية" : "Revenue by month"}
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          {isAr ? "آخر 6 أشهر" : "Last 6 months"}
        </p>
        <div className="mt-4 h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tickFormatter={(v: number) => currency.format(v)}
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                formatter={(value) => [
                  currency.format(Number(value)),
                  isAr ? "الإيرادات" : "Revenue",
                ]}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  backgroundColor: "hsl(var(--background))",
                  fontSize: 12,
                }}
              />
              <Bar
                dataKey="revenue"
                fill="hsl(var(--primary))"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
    </div>
  );
}
