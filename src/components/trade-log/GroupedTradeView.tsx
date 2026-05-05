import { useMemo } from "react";
import { Trade } from "@/lib/types";
import { groupTradesByLifecycle, formatDuration, GroupedTradeStatus } from "@/lib/trade-grouping";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Inbox } from "lucide-react";

interface Props {
  trades: Trade[];
  density: "comfortable" | "compact";
}

const statusStyles: Record<GroupedTradeStatus, string> = {
  WIN: "bg-success/15 text-success",
  LOSS: "bg-destructive/15 text-destructive",
  OPEN: "bg-warning/15 text-warning",
  BREAKEVEN: "bg-muted text-muted-foreground",
};

export default function GroupedTradeView({ trades, density }: Props) {
  const groups = useMemo(() => groupTradesByLifecycle(trades), [trades]);
  const cellPadding = density === "compact" ? "px-3 py-1.5" : "px-4 py-3";

  if (groups.length === 0) {
    return (
      <div className="glass-card flex flex-col items-center justify-center py-20 gap-3">
        <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
          <Inbox className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm font-medium">No grouped trades</p>
        <p className="text-xs text-muted-foreground">Import executions to build trade lifecycles.</p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className={cellPadding}>#</TableHead>
              <TableHead className={cellPadding}>Symbol</TableHead>
              <TableHead className={cellPadding}>Entry</TableHead>
              <TableHead className={cellPadding}>Exit</TableHead>
              <TableHead className={`text-right ${cellPadding}`}>Qty</TableHead>
              <TableHead className={`text-right ${cellPadding}`}>Avg Entry</TableHead>
              <TableHead className={`text-right ${cellPadding}`}>Avg Exit</TableHead>
              <TableHead className={cellPadding}>Duration</TableHead>
              <TableHead className={`text-right ${cellPadding}`}>P&L</TableHead>
              <TableHead className={cellPadding}>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {groups.slice(0, 200).map((g) => (
              <TableRow
                key={g.id}
                className={`border-border/30 ${
                  g.status === "WIN" ? "hover:bg-success/5" : g.status === "LOSS" ? "hover:bg-destructive/5" : "hover:bg-warning/5"
                }`}
              >
                <TableCell className={`font-mono text-xs text-muted-foreground ${cellPadding}`}>#{g.tradeNumber}</TableCell>
                <TableCell className={`font-medium ${cellPadding}`}>{g.symbol}</TableCell>
                <TableCell className={`font-mono text-xs text-muted-foreground whitespace-nowrap ${cellPadding}`}>
                  {new Date(g.entryTime).toLocaleString()}
                </TableCell>
                <TableCell className={`font-mono text-xs text-muted-foreground whitespace-nowrap ${cellPadding}`}>
                  {g.exitTime ? new Date(g.exitTime).toLocaleString() : <span className="text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className={`text-right font-mono text-xs ${cellPadding}`}>
                  {g.totalQuantity}
                  {g.remainingQuantity > 0 && (
                    <span className="text-warning"> ({g.remainingQuantity} open)</span>
                  )}
                </TableCell>
                <TableCell className={`text-right font-mono text-xs ${cellPadding}`}>
                  ${g.avgEntryPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </TableCell>
                <TableCell className={`text-right font-mono text-xs ${cellPadding}`}>
                  {g.avgExitPrice != null
                    ? `$${g.avgExitPrice.toLocaleString(undefined, { maximumFractionDigits: 4 })}`
                    : <span className="text-muted-foreground/40">—</span>}
                </TableCell>
                <TableCell className={`font-mono text-xs ${cellPadding}`}>{formatDuration(g.durationMs)}</TableCell>
                <TableCell className={`text-right font-mono text-sm font-semibold ${cellPadding} ${
                  g.realizedPnl > 0 ? "text-success" : g.realizedPnl < 0 ? "text-destructive" : "text-muted-foreground"
                }`}>
                  {g.realizedPnl >= 0 ? "+" : ""}${g.realizedPnl.toLocaleString()}
                </TableCell>
                <TableCell className={cellPadding}>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${statusStyles[g.status]}`}>
                    {g.status}
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
