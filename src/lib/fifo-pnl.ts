import { ParsedCsvTrade } from "./csv-parser";

interface Lot {
  price: number;
  remaining: number;
}

function toTimestampMs(timestamp: string): number {
  const normalized = timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`).getTime();
}

export interface FifoResult {
  tradeMatchId: string;
  realizedPnl: number;
}

/**
 * FIFO realized P&L engine for spot trading.
 *
 * - BUY adds inventory lots per symbol.
 * - SELL closes against oldest BUY lots (FIFO) and computes realized P&L.
 * - Partial lot matching is fully supported.
 * - Trades must be sorted chronologically before calling this function.
 */
export function computeFifoPnl(trades: ParsedCsvTrade[]): Map<string, number> {
  // Sort chronologically (earliest first)
  const sorted = [...trades].sort(
    (a, b) => toTimestampMs(a.timestamp) - toTimestampMs(b.timestamp)
  );

  // Per-symbol inventory of open lots (FIFO queue)
  const inventory = new Map<string, Lot[]>();
  // Per tradeMatchId realized P&L
  const pnlMap = new Map<string, number>();

  for (const trade of sorted) {
    const { symbol, side, quantity, price, tradeMatchId } = trade;
    const lots = inventory.get(symbol) ?? [];

    if (side === "BUY") {
      // Add a new lot to inventory
      lots.push({ price, remaining: quantity });
      inventory.set(symbol, lots);
      pnlMap.set(tradeMatchId, 0); // BUYs have no realized P&L
    } else {
      // SELL — match against oldest BUY lots
      let remaining = quantity;
      let realizedPnl = 0;

      while (remaining > 0 && lots.length > 0) {
        const oldest = lots[0];
        const matched = Math.min(remaining, oldest.remaining);

        const costBasis = matched * oldest.price;
        const proceeds = matched * price;
        realizedPnl += proceeds - costBasis;

        oldest.remaining -= matched;
        remaining -= matched;

        if (oldest.remaining <= 1e-12) {
          lots.shift(); // lot fully consumed
        }
      }

      // If remaining > 0 after exhausting inventory, it's a "naked" sell
      // (shouldn't happen in normal spot trading) — treat excess as zero-cost basis
      if (remaining > 0) {
        realizedPnl += remaining * price;
      }

      inventory.set(symbol, lots);
      pnlMap.set(tradeMatchId, Math.round(realizedPnl * 100) / 100);
    }
  }

  return pnlMap;
}
