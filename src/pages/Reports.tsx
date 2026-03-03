import { useMemo } from "react";
import { getPnlByDayOfWeek, getPnlByHour, getPnlBySetup, getWinLossStreaks, getPnlByEmotion, getMistakeAnalysis } from "@/lib/analytics";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";
import { TrendingUp, TrendingDown, Flame, Frown, Star, AlertCircle, FileBarChart } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useFilters, useTrades } from "@/store/trades";

export default function Reports() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);

  const byDay = useMemo(() => getPnlByDayOfWeek(trades), [trades]);
  const byHour = useMemo(() => getPnlByHour(trades), [trades]);
  const bySetup = useMemo(() => getPnlBySetup(trades), [trades]);
  const streaks = useMemo(() => getWinLossStreaks(trades), [trades]);
  const byEmotion = useMemo(() => getPnlByEmotion(trades), [trades]);
  const mistakes = useMemo(() => getMistakeAnalysis(trades), [trades]);

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
        <h1 className="text-2xl font-bold tracking-tight">Detailed Reports</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your trading patterns</p>
      </div>

      {/* Streak Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-8 w-12" />
            </div>
          ))
        ) : (
          <>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-[hsl(var(--warning))]" />
                <span className="text-xs text-muted-foreground">Best Win Streak</span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-[hsl(var(--success))]">{streaks.maxWin}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <Frown className="h-4 w-4 text-destructive" />
                <span className="text-xs text-muted-foreground">Worst Loss Streak</span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold text-destructive">{streaks.maxLoss}</p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-[hsl(var(--warning))]" />
                <span className="text-xs text-muted-foreground">Current Streak</span>
              </div>
              <p className={`mt-2 font-mono text-2xl font-bold ${streaks.currentStreak >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {streaks.currentStreak > 0 ? `+${streaks.currentStreak}` : streaks.currentStreak}
              </p>
            </div>
            <div className="glass-card p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">Avg R-Multiple</span>
              </div>
              <p className="mt-2 font-mono text-2xl font-bold">
                {trades.length > 0 ? (trades.reduce((s, t) => s + (t.rMultiple || 0), 0) / trades.length).toFixed(2) : "0.00"}R
              </p>
            </div>
          </>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && trades.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <FileBarChart className="h-10 w-10" />
          <p className="text-sm font-medium">No trades match current filters</p>
        </div>
      )}

      {/* Charts Row */}
      {isLoading ? (
        <div className="grid gap-6 lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="glass-card p-6 space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-[240px] w-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : trades.length > 0 ? (
        <>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* PnL by Day of Week */}
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">P&L by Day of Week</h3>
              <ChartContainer config={{ pnl: { label: "P&L", color: "hsl(var(--primary))" } }} className="h-[240px] w-full">
                <BarChart data={byDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
                  <XAxis dataKey="day" tick={{ fill: "hsl(215 15% 55%)", fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {byDay.map((e, i) => (
                      <Cell key={i} fill={e.pnl >= 0 ? "hsl(var(--chart-profit))" : "hsl(var(--chart-loss))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>

            {/* PnL by Hour */}
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">P&L by Hour of Day</h3>
              <ChartContainer config={{ pnl: { label: "P&L", color: "hsl(var(--primary))" } }} className="h-[240px] w-full">
                <BarChart data={byHour.filter(h => h.count > 0)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
                  <XAxis dataKey="hour" tick={{ fill: "hsl(215 15% 55%)", fontSize: 9 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                    {byHour.filter(h => h.count > 0).map((e, i) => (
                      <Cell key={i} fill={e.pnl >= 0 ? "hsl(var(--chart-profit))" : "hsl(var(--chart-loss))"} />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
            </div>
          </div>

          {/* Setup Performance Table */}
          <div className="glass-card p-6">
            <h3 className="mb-4 text-sm font-semibold">Performance by Setup</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
                    <th className="pb-3 font-medium">Setup</th>
                    <th className="pb-3 font-medium text-right">Trades</th>
                    <th className="pb-3 font-medium text-right">Win Rate</th>
                    <th className="pb-3 font-medium text-right">Avg P&L</th>
                    <th className="pb-3 font-medium text-right">Total P&L</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {bySetup.map((s) => (
                    <tr key={s.setup} className="hover:bg-card/40">
                      <td className="py-3 font-medium">{s.setup}</td>
                      <td className="py-3 text-right font-mono">{s.count}</td>
                      <td className="py-3 text-right font-mono">{s.winRate}%</td>
                      <td className={`py-3 text-right font-mono font-semibold ${s.avgPnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                        {s.avgPnl >= 0 ? "+" : ""}${s.avgPnl}
                      </td>
                      <td className={`py-3 text-right font-mono font-semibold ${s.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                        {s.pnl >= 0 ? "+" : ""}${s.pnl.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Emotion & Mistake Analysis */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">Performance by Emotion</h3>
              <div className="space-y-3">
                {byEmotion.map((e) => {
                  const maxPnl = Math.max(...byEmotion.map(x => Math.abs(x.pnl)), 1);
                  const width = Math.abs(e.pnl) / maxPnl * 100;
                  return (
                    <div key={e.emotion} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-medium">{e.emotion}</span>
                        <span className="text-muted-foreground">{e.count} trades • {e.winRate}% WR</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-muted/30 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${width}%`,
                              backgroundColor: e.pnl >= 0 ? "hsl(var(--chart-profit))" : "hsl(var(--chart-loss))",
                            }}
                          />
                        </div>
                        <span className={`font-mono text-xs font-semibold min-w-[60px] text-right ${e.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                          {e.pnl >= 0 ? "+" : ""}${e.pnl.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="glass-card p-6">
              <h3 className="mb-4 text-sm font-semibold">Costly Mistakes</h3>
              {mistakes.length === 0 ? (
                <p className="text-sm text-muted-foreground">No mistakes tagged yet</p>
              ) : (
                <div className="space-y-3">
                  {mistakes.map((m) => (
                    <div key={m.mistake} className="flex items-center justify-between rounded-lg bg-destructive/5 p-3">
                      <div>
                        <p className="text-sm font-medium">{m.mistake}</p>
                        <p className="text-xs text-muted-foreground">{m.count} occurrences • Avg: ${m.avgPnl}</p>
                      </div>
                      <p className="font-mono text-sm font-bold text-destructive">
                        ${m.pnl.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}
