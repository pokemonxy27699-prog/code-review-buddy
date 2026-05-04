import { ParsedCsvTrade } from "./csv-parser";

interface Lot {
  price: number;
  remaining: number;
  feePerUnit: number;
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
 * FIFO realized P&L engine for spot trading with fee handling.
 *
 * - BUY adds inventory lots per symbol; buy-side fees are amortized into cost basis.
 * - SELL closes against oldest BUY lots (FIFO) and computes realized P&L.
 *   Sell-side fees reduce realized P&L for that trade.
 * - Partial lot matching is fully supported.
 */
export function computeFifoPnl(trades: ParsedCsvTrade[]): Map<string, number> {
  const sorted = [...trades].sort(
    (a, b) => toTimestampMs(a.timestamp) - toTimestampMs(b.timestamp)
  );

  const inventory = new Map<string, Lot[]>();
  const pnlMap = new Map<string, number>();

  for (const trade of sorted) {
    const { symbol, side, quantity, price, tradeMatchId } = trade;
    const fees = trade.fees ?? 0;
    const lots = inventory.get(symbol) ?? [];

    if (side === "BUY") {
      const feePerUnit = quantity > 0 ? fees / quantity : 0;
      lots.push({ price, remaining: quantity, feePerUnit });
      inventory.set(symbol, lots);
      pnlMap.set(tradeMatchId, 0);
    } else {
      let remaining = quantity;
      let realizedPnl = 0;

      while (remaining > 0 && lots.length > 0) {
        const oldest = lots[0];
        const matched = Math.min(remaining, oldest.remaining);

        const costBasis = matched * (oldest.price + oldest.feePerUnit);
        const proceeds = matched * price;
        realizedPnl += proceeds - costBasis;

        oldest.remaining -= matched;
        remaining -= matched;

        if (oldest.remaining <= 1e-12) {
          lots.shift();
        }
      }

      // Naked sell fallback: treat unmatched portion as zero cost basis
      if (remaining > 0) {
        realizedPnl += remaining * price;
      }

      // Sell-side fees reduce realized P&L
      realizedPnl -= fees;

      inventory.set(symbol, lots);
      pnlMap.set(tradeMatchId, Math.round(realizedPnl * 100) / 100);
    }
  }

  return pnlMap;
}
