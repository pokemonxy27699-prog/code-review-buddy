import { useMemo } from "react";
import { mockTrades, getCalendarHeatmap } from "@/lib/mock-data";

function getMonthWeeks(year: number, month: number) {
  const weeks: { date: string; day: number; week: number }[][] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  let currentWeek: { date: string; day: number; week: number }[] = [];
  
  // Pad start of first week
  for (let i = 0; i < firstDay.getDay(); i++) {
    currentWeek.push({ date: "", day: 0, week: 0 });
  }
  
  for (let d = 1; d <= lastDay.getDate(); d++) {
    const date = new Date(year, month, d);
    const dateStr = date.toISOString().slice(0, 10);
    currentWeek.push({ date: dateStr, day: d, week: weeks.length });
    if (date.getDay() === 6 || d === lastDay.getDate()) {
      // Pad end of last week
      while (currentWeek.length < 7) {
        currentWeek.push({ date: "", day: 0, week: weeks.length });
      }
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }
  return weeks;
}

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function getPnlColor(pnl: number, maxAbs: number): string {
  if (pnl === 0) return "hsl(225 25% 14%)";
  const intensity = Math.min(Math.abs(pnl) / (maxAbs || 1), 1);
  if (pnl > 0) return `hsl(145 65% ${42 - intensity * 20}% / ${0.3 + intensity * 0.7})`;
  return `hsl(0 72% ${51 - intensity * 15}% / ${0.3 + intensity * 0.7})`;
}

export default function Analytics() {
  const heatmapData = useMemo(() => getCalendarHeatmap(mockTrades), []);
  const pnlMap = useMemo(() => {
    const map: Record<string, number> = {};
    heatmapData.forEach((d) => (map[d.date] = d.pnl));
    return map;
  }, [heatmapData]);

  const maxAbs = useMemo(() => Math.max(...heatmapData.map((d) => Math.abs(d.pnl)), 1), [heatmapData]);

  // Show last 3 months
  const now = new Date();
  const months = useMemo(() => {
    const result: { year: number; month: number }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      result.push({ year: d.getFullYear(), month: d.getMonth() });
    }
    return result;
  }, []);

  // Stats
  const totalDays = heatmapData.length;
  const profitDays = heatmapData.filter((d) => d.pnl > 0).length;
  const lossDays = heatmapData.filter((d) => d.pnl < 0).length;
  const bestDay = heatmapData.reduce((best, d) => (d.pnl > best.pnl ? d : best), heatmapData[0] || { pnl: 0, date: "" });
  const worstDay = heatmapData.reduce((worst, d) => (d.pnl < worst.pnl ? d : worst), heatmapData[0] || { pnl: 0, date: "" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Calendar heatmap & advanced metrics</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Trading Days</p>
          <p className="mt-1 font-mono text-xl font-bold">{totalDays}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Profit Days</p>
          <p className="mt-1 font-mono text-xl font-bold text-[hsl(var(--success))]">{profitDays}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Loss Days</p>
          <p className="mt-1 font-mono text-xl font-bold text-destructive">{lossDays}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-muted-foreground">Best Day</p>
          <p className="mt-1 font-mono text-lg font-bold text-[hsl(var(--success))]">+${bestDay?.pnl?.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">{bestDay?.date}</p>
        </div>
      </div>

      {/* Calendar Heatmap */}
      <div className="glass-card p-6">
        <h3 className="mb-6 text-sm font-semibold">Daily P&L Heatmap</h3>
        <div className="grid gap-8 lg:grid-cols-3">
          {months.map(({ year, month }) => {
            const weeks = getMonthWeeks(year, month);
            return (
              <div key={`${year}-${month}`}>
                <p className="mb-3 text-xs font-semibold text-muted-foreground">
                  {monthNames[month]} {year}
                </p>
                <div className="space-y-1">
                  {/* Day labels */}
                  <div className="flex gap-1">
                    {dayLabels.map((d) => (
                      <div key={d} className="flex h-4 w-8 items-center justify-center text-[9px] text-muted-foreground">
                        {d}
                      </div>
                    ))}
                  </div>
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex gap-1">
                      {week.map((cell, ci) => {
                        const pnl = cell.date ? pnlMap[cell.date] || 0 : 0;
                        return (
                          <div
                            key={ci}
                            className="group relative flex h-8 w-8 items-center justify-center rounded-sm text-[9px] font-mono transition-transform hover:scale-125"
                            style={{
                              backgroundColor: cell.date ? getPnlColor(pnl, maxAbs) : "transparent",
                            }}
                            title={cell.date ? `${cell.date}: $${pnl.toLocaleString()}` : ""}
                          >
                            {cell.day > 0 && (
                              <span className="text-foreground/60">{cell.day}</span>
                            )}
                            {cell.date && pnl !== 0 && (
                              <div className="absolute -top-8 left-1/2 z-50 hidden -translate-x-1/2 rounded-md bg-popover px-2 py-1 text-[10px] text-foreground shadow-lg group-hover:block whitespace-nowrap">
                                {pnl >= 0 ? "+" : ""}${pnl.toLocaleString()}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
          <span>Loss</span>
          <div className="flex gap-0.5">
            {[-1, -0.5, 0, 0.5, 1].map((v) => (
              <div
                key={v}
                className="h-3 w-6 rounded-sm"
                style={{ backgroundColor: getPnlColor(v * maxAbs, maxAbs) }}
              />
            ))}
          </div>
          <span>Profit</span>
        </div>
      </div>
    </div>
  );
}
