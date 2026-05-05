import { Trade } from "./types";

export type GroupedTradeStatus = "WIN" | "LOSS" | "OPEN" | "BREAKEVEN";

export interface GroupedTrade {
  id: string;
  tradeNumber: number;
  symbol: string;
  entryTime: string;
  exitTime: string | null;
  totalQuantity: number;
  remainingQuantity: number;
  avgEntryPrice: number;
  avgExitPrice: number | null;
  realizedPnl: number;
  durationMs: number | null;
  status: GroupedTradeStatus;
  executionCount: number;
  executionIds: string[];
}

const EPS = 1e-9;

function tsMs(d: string): number {
  const n = d.includes("T") ? d : d.replace(" ", "T");
  return new Date(n.endsWith("Z") || /[+-]\d\d:?\d\d$/.test(n) ? n : `${n}Z`).getTime();
}

/**
 * Groups executions per symbol into complete trades based on position lifecycle:
 * - A grouped trade opens when position goes from 0 -> non-zero
 * - A grouped trade closes when position returns to 0
 * - Realized P&L is summed from each execution's pre-computed FIFO pnl
 *   (FIFO logic is NOT recomputed here — this is a visualization layer only).
 */
export function groupTradesByLifecycle(trades: Trade[]): GroupedTrade[] {
  // Group executions by symbol, sorted by date ascending
  const bySymbol = new Map<string, Trade[]>();
  for (const t of trades) {
    if (!bySymbol.has(t.instrument)) bySymbol.set(t.instrument, []);
    bySymbol.get(t.instrument)!.push(t);
  }

  const groups: GroupedTrade[] = [];

  for (const [symbol, execs] of bySymbol) {
    const sorted = [...execs].sort((a, b) => tsMs(a.date) - tsMs(b.date));

    let position = 0;
    let buyQty = 0;
    let buyNotional = 0;
    let sellQty = 0;
    let sellNotional = 0;
    let pnl = 0;
    let entryTime: string | null = null;
    let lastTime: string | null = null;
    let execIds: string[] = [];

    const flush = (status: GroupedTradeStatus) => {
      if (execIds.length === 0) return;
      const startMs = entryTime ? tsMs(entryTime) : null;
      const endMs = lastTime ? tsMs(lastTime) : null;
      groups.push({
        id: `g-${symbol}-${entryTime}-${groups.length}`,
        tradeNumber: 0, // assigned later
        symbol,
        entryTime: entryTime!,
        exitTime: status === "OPEN" ? null : lastTime,
        totalQuantity: buyQty,
        remainingQuantity: Math.max(0, position),
        avgEntryPrice: buyQty > 0 ? buyNotional / buyQty : 0,
        avgExitPrice: sellQty > 0 ? sellNotional / sellQty : null,
        realizedPnl: Math.round(pnl * 100) / 100,
        durationMs: startMs && endMs ? endMs - startMs : null,
        status,
        executionCount: execIds.length,
        executionIds: [...execIds],
      });
    };

    const reset = () => {
      position = 0;
      buyQty = 0;
      buyNotional = 0;
      sellQty = 0;
      sellNotional = 0;
      pnl = 0;
      entryTime = null;
      lastTime = null;
      execIds = [];
    };

    for (const t of sorted) {
      if (execIds.length === 0) entryTime = t.date;
      lastTime = t.date;
      execIds.push(t.id);
      pnl += t.pnl || 0;

      if (t.side === "BUY") {
        position += t.quantity;
        buyQty += t.quantity;
        buyNotional += t.quantity * t.price;
      } else {
        position -= t.quantity;
        sellQty += t.quantity;
        sellNotional += t.quantity * t.price;
      }

      if (Math.abs(position) < EPS) {
        const status: GroupedTradeStatus =
          pnl > EPS ? "WIN" : pnl < -EPS ? "LOSS" : "BREAKEVEN";
        flush(status);
        reset();
      }
    }

    if (execIds.length > 0) {
      flush("OPEN");
    }
  }

  // Sort all groups by entry time desc and assign trade numbers (ascending by entry)
  const ascending = [...groups].sort((a, b) => tsMs(a.entryTime) - tsMs(b.entryTime));
  ascending.forEach((g, i) => (g.tradeNumber = i + 1));

  return groups.sort((a, b) => tsMs(b.entryTime) - tsMs(a.entryTime));
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}
