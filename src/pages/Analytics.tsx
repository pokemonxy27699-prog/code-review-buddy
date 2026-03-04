import { useMemo } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CalendarDays } from "lucide-react";
import { useFilters, useTrades } from "@/store/trades";
import { getCalendarHeatmap } from "@/lib/analytics";
import CalendarHeatmap from "@/components/CalendarHeatmap";

export default function Analytics() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);

  const heatmapData = useMemo(() => getCalendarHeatmap(trades), [trades]);
  const totalDays = heatmapData.length;
  const profitDays = heatmapData.filter((d) => d.pnl > 0).length;
  const lossDays = heatmapData.filter((d) => d.pnl < 0).length;
  const bestDay = heatmapData.reduce((best, d) => (d.pnl > best.pnl ? d : best), heatmapData[0] || { pnl: 0, date: "" });

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
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground">Calendar heatmap & advanced metrics</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))
        ) : (
          <>
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
          </>
        )}
      </div>

      {/* Empty state */}
      {!isLoading && trades.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <CalendarDays className="h-10 w-10" />
          <p className="text-sm font-medium">No trades match current filters</p>
        </div>
      )}

      {/* Calendar Heatmap */}
      {isLoading ? (
        <div className="glass-card p-6 space-y-4">
          <Skeleton className="h-4 w-40" />
          <div className="grid gap-8 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : trades.length > 0 ? (
        <div className="glass-card p-6">
          <h3 className="mb-6 text-sm font-semibold">Daily P&L Heatmap</h3>
          <CalendarHeatmap trades={trades} monthCount={3} />
        </div>
      ) : null}
    </div>
  );
}
