import { useMemo } from "react";
import { TrendingUp, TrendingDown, Activity, Target, BarChart3, DollarSign, Scale, Gauge, AlertCircle, ArrowRight } from "lucide-react";
import { getKPIs, getDailyPnl, getEquityCurve, getDrawdownCurve, getMaxDrawdown, getPnlBySetup, getMistakeAnalysis } from "@/lib/analytics";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Line, LineChart, Bar, BarChart, Area, AreaChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters, useTrades } from "@/store/trades";
import { useNavigate } from "react-router-dom";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import RecentJournalWidget from "@/components/RecentJournalWidget";

export default function Dashboard() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);
  const navigate = useNavigate();

  const kpis = useMemo(() => getKPIs(trades), [trades]);
  const dailyPnl = useMemo(() => getDailyPnl(trades), [trades]);
  const equityCurve = useMemo(() => getEquityCurve(trades), [trades]);
  const drawdownCurve = useMemo(() => getDrawdownCurve(trades), [trades]);
  const maxDrawdown = useMemo(() => getMaxDrawdown(trades), [trades]);
  const topSetups = useMemo(() => getPnlBySetup(trades).slice(0, 5), [trades]);
  const topMistakes = useMemo(() => getMistakeAnalysis(trades).slice(0, 5), [trades]);

  const drilldown = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    navigate(`/trades?${sp.toString()}`);
  };

  const kpiCards = [
    { label: "Total PnL", value: kpis.totalPnl, prefix: "$", icon: DollarSign, trend: kpis.totalPnl >= 0, onClick: () => drilldown({}) },
    { label: "Win Rate", value: kpis.winRate, suffix: "%", icon: Target, trend: kpis.winRate >= 50, onClick: () => drilldown({ pnl: "profit" }) },
    { label: "Profit Factor", value: kpis.profitFactor, icon: Scale, trend: kpis.profitFactor >= 1, onClick: () => drilldown({}) },
    { label: "Sharpe Ratio", value: kpis.sharpeRatio, icon: Gauge, trend: kpis.sharpeRatio >= 0, onClick: () => drilldown({}) },
    { label: "Total Trades", value: kpis.totalTrades, icon: Activity, trend: true, onClick: () => drilldown({}) },
    { label: "Best Trade", value: kpis.bestTrade, prefix: "$", icon: TrendingUp, trend: true, onClick: () => drilldown({ pnl: "profit" }) },
    { label: "Worst Trade", value: kpis.worstTrade, prefix: "$", icon: TrendingDown, trend: false, onClick: () => drilldown({ pnl: "loss" }) },
    { label: "Max Drawdown", value: maxDrawdown, suffix: "%", icon: BarChart3, trend: false, onClick: () => drilldown({ pnl: "loss" }) },
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
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-4 space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-7 w-24" />
              </div>
            ))
          : kpiCards.map((kpi) => (
              <div
                key={kpi.label}
                className="glass-card-hover p-4 cursor-pointer"
                onClick={kpi.onClick}
              >
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
        <>
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

          {/* Calendar Heatmap */}
          <div className="glass-card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold">Daily P&L Heatmap</h3>
              <button onClick={() => navigate("/analytics")} className="text-xs text-primary hover:underline flex items-center gap-1">
                Full view <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <CalendarHeatmap trades={trades} monthCount={3} />
          </div>

          {/* Top Setups + Top Mistakes */}
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Setups */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Top Setups</h3>
                <button onClick={() => navigate("/reports")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  All setups <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {topSetups.length === 0 ? (
                <p className="text-sm text-muted-foreground">No setup data yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                        <th className="pb-2 font-medium">Setup</th>
                        <th className="pb-2 font-medium text-right">Trades</th>
                        <th className="pb-2 font-medium text-right">Win%</th>
                        <th className="pb-2 font-medium text-right">P&L</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/30">
                      {topSetups.map((s) => (
                        <tr
                          key={s.setup}
                          className="hover:bg-card/40 cursor-pointer"
                          onClick={() => drilldown({ setup: s.setup })}
                        >
                          <td className="py-2.5 font-medium">{s.setup}</td>
                          <td className="py-2.5 text-right font-mono text-xs">{s.count}</td>
                          <td className="py-2.5 text-right font-mono text-xs">{s.winRate}%</td>
                          <td className={`py-2.5 text-right font-mono text-xs font-semibold ${s.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                            {s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Top Mistakes */}
            <div className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold">Costly Mistakes</h3>
                <button onClick={() => navigate("/reports")} className="text-xs text-primary hover:underline flex items-center gap-1">
                  All mistakes <ArrowRight className="h-3 w-3" />
                </button>
              </div>
              {topMistakes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mistakes tagged yet 🎉</p>
              ) : (
                <div className="space-y-2">
                  {topMistakes.map((m) => (
                    <div
                      key={m.mistake}
                      className="flex items-center justify-between rounded-lg bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors"
                      onClick={() => drilldown({ mistake: m.mistake })}
                    >
                      <div>
                        <p className="text-sm font-medium">{m.mistake}</p>
                        <p className="text-xs text-muted-foreground">{m.count} occurrences • Avg: ${m.avgPnl}</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-destructive">${m.pnl.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
