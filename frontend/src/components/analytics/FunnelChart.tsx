"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FunnelStage } from "@/types/analytics";

const STAGE_LABEL: Record<string, string> = {
  APPLIED: "Applied",
  SCREENING: "Screening",
  SHORTLISTED: "Shortlisted",
  TECHNICAL_INTERVIEW: "Tech Interview",
  HR_INTERVIEW: "HR Interview",
  OFFER: "Offer",
  HIRED: "Hired",
  REJECTED: "Rejected",
};

function colorForStage(status: string) {
  if (status === "HIRED") return "var(--color-success)";
  if (status === "REJECTED") return "var(--color-danger)";
  return "var(--color-brand)";
}

type TooltipPayloadItem = { value?: number; payload?: { status?: string } };

function ChartTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadItem[] }) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  const status = item.payload?.status ?? "";
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium text-foreground">{STAGE_LABEL[status] ?? status}</p>
      <p className="text-muted">{item.value} application{item.value === 1 ? "" : "s"}</p>
    </div>
  );
}

export function FunnelChart({ data }: { data: FunnelStage[] }) {
  const chartData = data.map((d) => ({ ...d, label: STAGE_LABEL[d.status] ?? d.status }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
          <CartesianGrid stroke="var(--color-border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={{ stroke: "var(--color-border)" }}
            tickLine={false}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={50}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fill: "var(--color-muted)", fontSize: 12 }}
            axisLine={false}
            tickLine={false}
            width={28}
          />
          <Tooltip cursor={{ fill: "var(--color-background)" }} content={<ChartTooltip />} />
          <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((entry) => (
              <Cell key={entry.status} fill={colorForStage(entry.status)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
