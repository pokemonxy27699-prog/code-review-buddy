import { useMemo } from "react";
import { Trade } from "@/lib/types";
import { getAssetSummaries } from "@/lib/analytics";
import { useFilters, useTrades } from "@/store/trades";
import { TrendingUp, TrendingDown, AlertCircle, Coins } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";

const miniSparkline = (data: number[]) => {
  const max = Math.max(...data.map(Math.abs));
  const h = 40;
  const w = 120;
  const step = w / (data.length - 1);
  const points = data.map((v, i) => `${i * step},${h / 2 - (v / (max || 1)) * (h / 2 - 4)}`).join(" ");
  const lastVal = data[data.length - 1];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
      <polyline fill="none" stroke={lastVal >= 0 ? "hsl(var(--success))" : "hsl(var(--destructive))"} strokeWidth="2" points={points} />
    </svg>
  );
};

export default function Assets() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);
  const navigate = useNavigate();
  const assets = useMemo(() => getAssetSummaries(trades), [trades]);

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
        <h1 className="text-2xl font-bold tracking-tight">Per-Asset Breakdown</h1>
        <p className="text-sm text-muted-foreground">Performance by coin</p>
      </div>

      {isLoading && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <Skeleton className="h-9 w-20" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </div>
      )}

      {!isLoading && assets.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Coins className="h-10 w-10" />
          <p className="text-sm font-medium">No trades match current filters</p>
        </div>
      )}

      {!isLoading && assets.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {assets.map((a) => (
            <div
              key={a.asset}
              className="glass-card-hover p-5 cursor-pointer"
              onClick={() => navigate(`/trades?symbol=${a.asset}_USDT`)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 font-mono text-sm font-bold text-primary">
                    {a.asset.slice(0, 3)}
                  </div>
                  <div>
                    <p className="font-semibold">{a.asset}</p>
                    <p className="text-xs text-muted-foreground">{a.tradeCount} trades</p>
                  </div>
                </div>
                {a.totalPnl >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-destructive" />
                )}
              </div>

              <div className="mt-4">{miniSparkline(a.pnlHistory)}</div>

              <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Total PnL</p>
                  <p className={`font-mono font-semibold ${a.totalPnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {a.totalPnl >= 0 ? "+" : ""}${a.totalPnl.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                  <p className="font-mono font-semibold">{a.winRate}%</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Avg Return</p>
                  <p className={`font-mono font-semibold ${a.avgReturn >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    ${a.avgReturn}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
