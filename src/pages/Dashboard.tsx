import { TrendingUp, TrendingDown, Activity, Target, BarChart3, DollarSign } from "lucide-react";
import { mockTrades, getKPIs, getDailyPnl, getEquityCurve } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Cell } from "recharts";

const kpis = getKPIs(mockTrades);
const dailyPnl = getDailyPnl(mockTrades);
const equityCurve = getEquityCurve(mockTrades);

const kpiCards = [
  { label: "Total PnL", value: kpis.totalPnl, prefix: "$", icon: DollarSign, trend: kpis.totalPnl >= 0 },
  { label: "Win Rate", value: kpis.winRate, suffix: "%", icon: Target, trend: kpis.winRate >= 50 },
  { label: "Total Trades", value: kpis.totalTrades, icon: Activity, trend: true },
  { label: "Best Trade", value: kpis.bestTrade, prefix: "$", icon: TrendingUp, trend: true },
  { label: "Worst Trade", value: kpis.worstTrade, prefix: "$", icon: TrendingDown, trend: false },
  { label: "Avg Trade Size", value: kpis.avgTradeSize, prefix: "$", icon: BarChart3, trend: true },
];

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your crypto trading performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        {kpiCards.map((kpi) => (
          <div key={kpi.label} className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">{kpi.label}</span>
              <kpi.icon className={`h-4 w-4 ${kpi.trend ? "text-[hsl(var(--success))]" : "text-destructive"}`} />
            </div>
            <p className={`mt-2 font-mono text-xl font-bold ${kpi.trend ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
              {kpi.prefix}
              {typeof kpi.value === "number" ? kpi.value.toLocaleString() : kpi.value}
              {kpi.suffix}
            </p>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Equity Curve */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Equity Curve</h3>
          <ChartContainer config={{ equity: { label: "Equity", color: "hsl(var(--primary))" } }} className="h-[280px] w-full">
            <LineChart data={equityCurve}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line type="monotone" dataKey="equity" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        </div>

        {/* Daily PnL */}
        <div className="glass-card p-6">
          <h3 className="mb-4 text-sm font-semibold">Daily P&L</h3>
          <ChartContainer config={{ pnl: { label: "P&L", color: "hsl(var(--primary))" } }} className="h-[280px] w-full">
            <BarChart data={dailyPnl}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
              <XAxis dataKey="date" tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                {dailyPnl.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? "hsl(var(--chart-profit))" : "hsl(var(--chart-loss))"} />
                ))}
              </Bar>
            </BarChart>
          </ChartContainer>
        </div>
      </div>
    </div>
  );
}
