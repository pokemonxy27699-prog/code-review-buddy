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

export interface ParseResult {
  trades: ParsedCsvTrade[];
  totalRows: number;
  tradingRows: number;
  skippedGroups: number;
  errors: string[];
}

function isValidSide(val: string): val is "BUY" | "SELL" {
  return val === "BUY" || val === "SELL";
}

export function parseCryptoComCsv(text: string): ParseResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim());

  if (lines.length < 5) {
    return { trades: [], totalRows: 0, tradingRows: 0, skippedGroups: 0, errors: ["File has fewer than 5 lines — not a valid Crypto.com export."] };
  }

  const headerLine = lines[3];
  const headers = parseCSVLine(headerLine);

  if (!headers.includes("Journal Type") || !headers.includes("Trade Match ID")) {
    return { trades: [], totalRows: 0, tradingRows: 0, skippedGroups: 0, errors: ["Header row missing expected columns. Ensure this is an OEX_TRANSACTION.csv export."] };
  }

  const dataLines = lines.slice(4);
  let parseErrors = 0;

  const rows: RawRow[] = [];
  for (const line of dataLines) {
    const vals = parseCSVLine(line);
    if (vals.length < headers.length) { parseErrors++; continue; }
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => (obj[h] = vals[i] ?? ""));
    rows.push(obj as unknown as RawRow);
  }

  if (parseErrors > 0) {
    errors.push(`${parseErrors} row(s) skipped due to column count mismatch.`);
  }

  const tradingRows = rows.filter((r) => r["Journal Type"] === "TRADING");

  const groups = new Map<string, RawRow[]>();
  for (const row of tradingRows) {
    const key = row["Trade Match ID"];
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const trades: ParsedCsvTrade[] = [];
  let skippedGroups = 0;

  for (const [tradeMatchId, groupRows] of groups) {
    const cryptoRow = groupRows.find((r) => r.Instrument !== "USD_Stable_Coin");
    const usdRow = groupRows.find((r) => r.Instrument === "USD_Stable_Coin");

    if (!cryptoRow) { skippedGroups++; continue; }

    // Get side from crypto row's Side field; fallback to Taker Side only if valid
    let side = cryptoRow.Side?.trim();
    if (!isValidSide(side ?? "")) {
      side = cryptoRow["Taker Side"]?.trim();
    }
    if (!isValidSide(side ?? "")) {
      skippedGroups++;
      continue;
    }

    const quantity = Math.abs(parseFloat(cryptoRow["Transaction Quantity"]) || 0);
    if (quantity === 0) { skippedGroups++; continue; }

    const value = usdRow ? Math.abs(parseFloat(usdRow["Transaction Quantity"]) || 0) : 0;
    const price = quantity > 0 ? value / quantity : 0;

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

  if (skippedGroups > 0) {
    errors.push(`${skippedGroups} trade group(s) skipped (missing crypto row or valid side).`);
  }

  trades.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { trades, totalRows: dataLines.length, tradingRows: tradingRows.length, skippedGroups, errors };
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
