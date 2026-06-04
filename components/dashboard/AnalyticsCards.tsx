"use client";

import { FileText, TrendingUp, BarChart3, Layers } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  Cell,
} from "recharts";

interface AnalyticsData {
  typeBreakdown: Array<{ type: string; label: string; count: number }>;
  monthlyTrend: Array<{ month: string; count: number }>;
  statusBreakdown: Array<{ status: string; count: number }>;
  totalDocuments: number;
  thisMonthDocuments: number;
}

const COLORS = [
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#d97706",
  "#dc2626",
  "#0891b2",
  "#db2777",
  "#ca8a04",
];

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  generated: "Generated",
  downloaded: "Downloaded",
  archived: "Archived",
  issued: "Issued",
};

const STATUS_COLORS: Record<string, string> = {
  draft: "#6b7280",
  generated: "#059669",
  downloaded: "#2563eb",
  archived: "#d97706",
  issued: "#7c3aed",
};

function formatMonth(ym: string): string {
  const [y, m] = ym.split("-");
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  return `${months[parseInt(m, 10) - 1]} ${y}`;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            {label}
          </p>
          <p className="mt-1 text-2xl font-bold text-card-foreground">{value}</p>
          {subtext && (
            <p className="mt-0.5 text-xs text-muted-foreground">{subtext}</p>
          )}
        </div>
        <div
          className="flex h-10 w-10 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={20} style={{ color }} />
        </div>
      </div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-lg text-xs">
      <p className="font-medium text-card-foreground">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }}>
          {entry.name}: {entry.value}
        </p>
      ))}
    </div>
  );
}

export default function AnalyticsCards({ analytics }: { analytics: AnalyticsData }) {
  return (
    <div className="space-y-6">
      {/* Summary stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={FileText}
          label="Total Documents"
          value={analytics.totalDocuments}
          subtext={`${analytics.thisMonthDocuments} created this month`}
          color="#2563eb"
        />
        <StatCard
          icon={TrendingUp}
          label="This Month"
          value={analytics.thisMonthDocuments}
          subtext={
            analytics.monthlyTrend.length >= 2
              ? `${
                  analytics.monthlyTrend[analytics.monthlyTrend.length - 1].count >=
                  analytics.monthlyTrend[analytics.monthlyTrend.length - 2].count
                    ? "Up"
                    : "Down"
                } from previous month`
              : "Getting started"
          }
          color="#059669"
        />
        <StatCard
          icon={BarChart3}
          label="Most Used"
          value={
            analytics.typeBreakdown[0]?.label ?? "N/A"
          }
          subtext={
            analytics.typeBreakdown[0]
              ? `${analytics.typeBreakdown[0].count} documents`
              : "No documents yet"
          }
          color="#7c3aed"
        />
        <StatCard
          icon={Layers}
          label="Active Statuses"
          value={analytics.statusBreakdown.length}
          subtext={
            analytics.statusBreakdown
              .filter((s) => s.status !== "archived")
              .reduce((sum, s) => sum + s.count, 0) +
            " active documents"
          }
          color="#d97706"
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Monthly Trend */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Monthly Trend
          </h3>
          {analytics.monthlyTrend.every((m) => m.count === 0) ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No document activity yet — create your first document to see trends
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={analytics.monthlyTrend}>
                <defs>
                  <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="month"
                  tickFormatter={formatMonth}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                  width={30}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Documents"
                  stroke="#2563eb"
                  strokeWidth={2}
                  fill="url(#trendGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Most Used Types */}
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
          <h3 className="text-sm font-semibold text-card-foreground mb-4">
            Most Used Document Types
          </h3>
          {analytics.typeBreakdown.length === 0 ? (
            <div className="flex h-48 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                No documents generated yet
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={analytics.typeBreakdown}
                layout="vertical"
                margin={{ left: 0, right: 20, top: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="count" name="Count" radius={[0, 4, 4, 0]} barSize={20}>
                  {analytics.typeBreakdown.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Status breakdown mini-chart */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm transition-shadow hover:shadow-md">
        <h3 className="text-sm font-semibold text-card-foreground mb-4">
          Document Status Overview
        </h3>
        {analytics.statusBreakdown.length === 0 ? (
          <div className="flex h-32 items-center justify-center">
            <p className="text-sm text-muted-foreground">
              No documents yet
            </p>
          </div>
        ) : (
          <div className="flex flex-wrap gap-6">
            {analytics.statusBreakdown.map((s) => (
              <div key={s.status} className="flex items-center gap-3">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: STATUS_COLORS[s.status] ?? "#6b7280" }}
                />
                <div>
                  <p className="text-sm font-medium text-card-foreground">
                    {s.count}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {STATUS_LABELS[s.status] ?? s.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}