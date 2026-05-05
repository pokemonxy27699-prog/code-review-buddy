import { useMemo, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, FastForward } from "lucide-react";
import { getCalendarHeatmap } from "@/lib/analytics";
import { Trade } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

function getMonthWeeks(year: number, month: number) {
  const weeks: { date: string; day: number; week: number }[][] = [];
  const firstDay = new Date(Date.UTC(year, month, 1));
  const lastDay = new Date(Date.UTC(year, month + 1, 0));
  let currentWeek: { date: string; day: number; week: number }[] = [];

  for (let i = 0; i < firstDay.getUTCDay(); i++) {
    currentWeek.push({ date: "", day: 0, week: 0 });
  }

  for (let d = 1; d <= lastDay.getUTCDate(); d++) {
    const date = new Date(Date.UTC(year, month, d));
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    currentWeek.push({ date: dateStr, day: d, week: weeks.length });
    if (date.getUTCDay() === 6 || d === lastDay.getUTCDate()) {
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

interface Props {
  trades: Trade[];
  monthCount?: number;
  className?: string;
}

// monthIndex = year * 12 + month
const toMonthIndex = (y: number, m: number) => y * 12 + m;
const fromMonthIndex = (idx: number) => ({ year: Math.floor(idx / 12), month: idx % 12 });

export default function CalendarHeatmap({ trades, monthCount = 3, className }: Props) {
  const heatmapData = useMemo(() => getCalendarHeatmap(trades), [trades]);

  const pnlMap = useMemo(() => {
    const map: Record<string, number> = {};
    heatmapData.forEach((d) => (map[d.date] = d.pnl));
    return map;
  }, [heatmapData]);

  const maxAbs = useMemo(() => Math.max(...heatmapData.map((d) => Math.abs(d.pnl)), 1), [heatmapData]);

  // Months containing trade activity (sorted ascending)
  const tradeMonths = useMemo(() => {
    const set = new Set<number>();
    heatmapData.forEach((d) => {
      const [y, m] = d.date.split("-");
      set.add(toMonthIndex(parseInt(y, 10), parseInt(m, 10) - 1));
    });
    return Array.from(set).sort((a, b) => a - b);
  }, [heatmapData]);

  const latestTradeMonth = tradeMonths.length > 0 ? tradeMonths[tradeMonths.length - 1] : null;

  // Anchor = the rightmost (most recent) month shown
  const defaultAnchor = useMemo(() => {
    if (latestTradeMonth !== null) return latestTradeMonth;
    const now = new Date();
    return toMonthIndex(now.getFullYear(), now.getMonth());
  }, [latestTradeMonth]);

  const [anchor, setAnchor] = useState<number>(defaultAnchor);

  // Re-sync anchor to latest trade month when trade dataset changes
  useEffect(() => {
    setAnchor(defaultAnchor);
  }, [defaultAnchor]);

  const months = useMemo(() => {
    const result: { year: number; month: number; index: number }[] = [];
    for (let i = monthCount - 1; i >= 0; i--) {
      const idx = anchor - i;
      const { year, month } = fromMonthIndex(idx);
      result.push({ year, month, index: idx });
    }
    return result;
  }, [anchor, monthCount]);

  const handlePrev = () => setAnchor((a) => a - monthCount);
  const handleNext = () => setAnchor((a) => a + monthCount);
  const handleJumpLatest = () => latestTradeMonth !== null && setAnchor(latestTradeMonth);

  const anchorLabel = (() => {
    const { year, month } = fromMonthIndex(anchor);
    return `${monthNames[month]} ${year}`;
  })();

  return (
    <div className={className}>
      {/* Navigation Controls */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="glass-card-hover flex h-8 items-center gap-1 rounded-md px-2 text-xs"
            aria-label="Previous months"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Prev
          </button>
          <button
            onClick={handleNext}
            className="glass-card-hover flex h-8 items-center gap-1 rounded-md px-2 text-xs"
            aria-label="Next months"
          >
            Next <ChevronRight className="h-3.5 w-3.5" />
          </button>
          {latestTradeMonth !== null && (
            <button
              onClick={handleJumpLatest}
              className="glass-card-hover flex h-8 items-center gap-1 rounded-md px-2 text-xs"
              aria-label="Jump to latest trade month"
            >
              <FastForward className="h-3.5 w-3.5" /> Latest trade
            </button>
          )}
        </div>

        {tradeMonths.length > 0 && (
          <Select
            value={String(anchor)}
            onValueChange={(v) => setAnchor(parseInt(v, 10))}
          >
            <SelectTrigger className="h-8 w-[180px] text-xs">
              <SelectValue placeholder={anchorLabel} />
            </SelectTrigger>
            <SelectContent>
              {[...tradeMonths].reverse().map((idx) => {
                const { year, month } = fromMonthIndex(idx);
                return (
                  <SelectItem key={idx} value={String(idx)} className="text-xs">
                    {monthNames[month]} {year}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className={`grid gap-8 ${monthCount <= 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"}`}>
        {months.map(({ year, month }) => {
          const weeks = getMonthWeeks(year, month);
          return (
            <div key={`${year}-${month}`}>
              <p className="mb-3 text-xs font-semibold text-muted-foreground">
                {monthNames[month]} {year}
              </p>
              <div className="space-y-1">
                <div className="flex gap-1">
                  {dayLabels.map((d) => (
                    <div key={d} className="flex h-4 w-8 items-center justify-center text-[9px] text-muted-foreground">{d}</div>
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
                          style={{ backgroundColor: cell.date ? getPnlColor(pnl, maxAbs) : "transparent" }}
                          title={cell.date ? `${cell.date}: $${pnl.toLocaleString()}` : ""}
                        >
                          {cell.day > 0 && <span className="text-foreground/60">{cell.day}</span>}
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
            <div key={v} className="h-3 w-6 rounded-sm" style={{ backgroundColor: getPnlColor(v * maxAbs, maxAbs) }} />
          ))}
        </div>
        <span>Profit</span>
      </div>
    </div>
  );
}
