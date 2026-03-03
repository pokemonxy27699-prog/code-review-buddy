import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, DollarSign, Scale, Gauge, AlertCircle } from "lucide-react";
import { getKPIs, getDailyPnl, getEquityCurve, getDrawdownCurve, getMaxDrawdown } from "@/lib/analytics";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters, useTrades } from "@/store/trades";

export default function Dashboard() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);

  const kpis = useMemo(() => getKPIs(trades), [trades]);
  const dailyPnl = useMemo(() => getDailyPnl(trades), [trades]);
  const equityCurve = useMemo(() => getEquityCurve(trades), [trades]);
  const drawdownCurve = useMemo(() => getDrawdownCurve(trades), [trades]);
  const maxDrawdown = useMemo(() => getMaxDrawdown(trades), [trades]);

  const kpiCards = [
    { label: "Total PnL", value: kpis.totalPnl, prefix: "$", icon: DollarSign, trend: kpis.totalPnl >= 0 },
    { label: "Win Rate", value: kpis.winRate, suffix: "%", icon: Target, trend: kpis.winRate >= 50 },
    { label: "Profit Factor", value: kpis.profitFactor, icon: Scale, trend: kpis.profitFactor >= 1 },
    { label: "Sharpe Ratio", value: kpis.sharpeRatio, icon: Gauge, trend: kpis.sharpeRatio >= 0 },
    { label: "Total Trades", value: kpis.totalTrades, icon: Activity, trend: true },
    { label: "Best Trade", value: kpis.bestTrade, prefix: "$", icon: TrendingUp, trend: true },
    { label: "Worst Trade", value: kpis.worstTrade, prefix: "$", icon: TrendingDown, trend: false },
    { label: "Max Drawdown", value: maxDrawdown, suffix: "%", icon: BarChart3, trend: false },
  ];

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-medium">Failed to load trades. Check your API connection in Settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Your crypto trading performance at a glance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : kpiCards.map((kpi) => (
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

      {/* Empty state */}
      {!isLoading && trades.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <BarChart3 className="h-10 w-10" />
          <p className="text-sm font-medium">No trades match current filters</p>
        </div>
      )}

      {/* Charts */}
      {!isLoading && trades.length > 0 && (
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

          {/* Drawdown Chart */}
          <div className="glass-card p-6 lg:col-span-2">
            <h3 className="mb-4 text-sm font-semibold">Drawdown</h3>
            <ChartContainer config={{ drawdown: { label: "Drawdown %", color: "hsl(var(--destructive))" } }} className="h-[220px] w-full">
              <AreaChart data={drawdownCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
                <XAxis dataKey="date" tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <defs>
                  <linearGradient id="drawdownGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="drawdown" stroke="hsl(var(--destructive))" fill="url(#drawdownGrad)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ChartContainer>
          </div>
        </div>
      )}
    </div>
  );
}
