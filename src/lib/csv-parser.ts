import { Trade } from "./types";

export interface ParsedCsvTrade {
  timestamp: string;
  date: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  value: number;
  price: number;
  orderId: string;
  tradeMatchId: string;
}

interface RawRow {
  "Journal ID": string;
  "Time (UTC)": string;
  "Event Date": string;
  "Journal Type": string;
  Instrument: string;
  "Taker Side": string;
  Side: string;
  "Transaction Quantity": string;
  "Transaction Cost": string;
  "Realized PNL": string;
  "Order ID": string;
  "Trade ID": string;
  "Trade Match ID": string;
  "Client Order Id": string;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseCryptoComCsv(text: string): ParsedCsvTrade[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  // Skip 3 non-data lines, line 4 is header
  if (lines.length < 5) return [];

  const headerLine = lines[3];
  const headers = parseCSVLine(headerLine);
  const dataLines = lines.slice(4);

  const rows: RawRow[] = dataLines
    .map((line) => {
      const vals = parseCSVLine(line);
      if (vals.length < headers.length) return null;
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
      return obj as unknown as RawRow;
    })
    .filter(Boolean) as RawRow[];

  // Filter TRADING only
  const tradingRows = rows.filter((r) => r["Journal Type"] === "TRADING");

  // Group by Trade Match ID
  const groups = new Map<string, RawRow[]>();
  for (const row of tradingRows) {
    const key = row["Trade Match ID"];
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const trades: ParsedCsvTrade[] = [];

  for (const [tradeMatchId, rows] of groups) {
    // Each group has 2 rows: one crypto, one USD_Stable_Coin
    const cryptoRow = rows.find((r) => r.Instrument !== "USD_Stable_Coin");
    const usdRow = rows.find((r) => r.Instrument === "USD_Stable_Coin");

    if (!cryptoRow) continue;

    const quantity = Math.abs(parseFloat(cryptoRow["Transaction Quantity"]) || 0);
    const value = usdRow ? Math.abs(parseFloat(usdRow["Transaction Quantity"]) || 0) : 0;
    const price = quantity > 0 ? value / quantity : 0;
    const side = cryptoRow.Side === "BUY" ? "BUY" : "SELL";

    trades.push({
      timestamp: cryptoRow["Time (UTC)"],
      date: cryptoRow["Event Date"],
      symbol: cryptoRow.Instrument,
      side: side as "BUY" | "SELL",
      quantity: Math.round(quantity * 1e8) / 1e8,
      value: Math.round(value * 100) / 100,
      price: Math.round(price * 100) / 100,
      orderId: cryptoRow["Order ID"],
      tradeMatchId,
    });
  }

  // Sort by timestamp desc
  trades.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return trades;
}

export function csvTradesToAppTrades(parsed: ParsedCsvTrade[]): Trade[] {
  return parsed.map((p) => ({
    id: `csv-${p.tradeMatchId}`,
    date: p.date,
    instrument: p.symbol,
    side: p.side,
    quantity: p.quantity,
    price: p.price,
    fees: 0,
    pnl: 0,
    notes: `Imported from Crypto.com | Order: ${p.orderId} | Value: $${p.value.toLocaleString()}`,
    tags: ["crypto.com-import"],
  }));
}

export function findDuplicates(
  parsed: ParsedCsvTrade[],
  existing: Trade[]
): Set<string> {
  const existingIds = new Set(existing.map((t) => t.id));
  const dupes = new Set<string>();
  for (const p of parsed) {
    if (existingIds.has(`csv-${p.tradeMatchId}`)) {
      dupes.add(p.tradeMatchId);
    }
  }
  return dupes;
}
