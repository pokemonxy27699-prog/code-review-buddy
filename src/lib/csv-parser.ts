import { Trade } from "./types";
import { computeFifoPnl } from "./fifo-pnl";

export interface ParsedCsvTrade {
  timestamp: string;
  date: string;
  symbol: string;
  side: "BUY" | "SELL";
  quantity: number;
  value: number;
  price: number;
  fees: number;
  orderId: string;
  tradeMatchId: string;
}

function toUtcIsoString(timestamp: string): string {
  const normalized = timestamp.includes("T") ? timestamp : timestamp.replace(" ", "T");
  return new Date(normalized.endsWith("Z") ? normalized : `${normalized}Z`).toISOString();
}

export function buildCsvTradeId(tradeMatchId: string, orderId?: string): string {
  return tradeMatchId ? `csv-${tradeMatchId}` : `csv-order-${orderId ?? "unknown"}`;
}

export function tradeToParsedCsvTrade(trade: Trade): ParsedCsvTrade | null {
  const tradeMatchId = trade.tradeMatchId ?? (trade.id.startsWith("csv-") ? trade.id.slice(4) : "");

  if ((trade.source !== "crypto_com_csv" && !trade.id.startsWith("csv-")) || !tradeMatchId) {
    return null;
  }

  return {
    timestamp: trade.date,
    date: trade.date.slice(0, 10),
    symbol: trade.instrument,
    side: trade.side,
    quantity: trade.quantity,
    value: trade.value ?? Math.round(trade.quantity * trade.price * 100) / 100,
    price: trade.price,
    fees: trade.fees ?? 0,
    orderId: trade.orderId ?? "",
    tradeMatchId,
  };
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

function isUsdInstrument(instrument: string): boolean {
  const i = (instrument || "").toUpperCase();
  return i === "USD_STABLE_COIN" || i === "USD" || i === "USDC" || i === "USDT";
}

function num(val: string | undefined): number {
  if (!val) return 0;
  const n = parseFloat(val);
  return Number.isFinite(n) ? n : 0;
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

  const journalTypeOf = (r: RawRow) => (r["Journal Type"] || "").toUpperCase();
  const isFeeRow = (r: RawRow) => journalTypeOf(r).includes("FEE");
  const isTradingRow = (r: RawRow) => journalTypeOf(r) === "TRADING" || isFeeRow(r);

  const relevantRows = rows.filter(isTradingRow);

  const groups = new Map<string, RawRow[]>();
  for (const row of relevantRows) {
    const key = row["Trade Match ID"];
    if (!key) continue;
    const arr = groups.get(key) ?? [];
    arr.push(row);
    groups.set(key, arr);
  }

  const trades: ParsedCsvTrade[] = [];
  let skippedGroups = 0;
  let inconsistentSideGroups = 0;
  let multiSymbolGroups = 0;
  let zeroQtyGroups = 0;

  for (const [tradeMatchId, groupRows] of groups) {
    const tradingRows = groupRows.filter((r) => journalTypeOf(r) === "TRADING");
    const feeRows = groupRows.filter(isFeeRow);

    const cryptoRows = tradingRows.filter((r) => !isUsdInstrument(r.Instrument));
    const usdRows = tradingRows.filter((r) => isUsdInstrument(r.Instrument));

    if (cryptoRows.length === 0) { skippedGroups++; continue; }

    // Ensure all crypto rows share the same instrument
    const symbols = new Set(cryptoRows.map((r) => r.Instrument));
    if (symbols.size > 1) { skippedGroups++; multiSymbolGroups++; continue; }
    const symbol = cryptoRows[0].Instrument;

    // Strict, consistent side derived from crypto rows only
    const sides = new Set<string>();
    for (const r of cryptoRows) {
      const s = (r.Side || "").trim().toUpperCase();
      if (isValidSide(s)) sides.add(s);
    }
    if (sides.size !== 1) { skippedGroups++; inconsistentSideGroups++; continue; }
    const side = [...sides][0] as "BUY" | "SELL";

    // Aggregate quantities and values across all fills in the group
    const quantity = cryptoRows.reduce((s, r) => s + Math.abs(num(r["Transaction Quantity"])), 0);
    if (quantity === 0) { skippedGroups++; zeroQtyGroups++; continue; }

    let value = usdRows.reduce((s, r) => s + Math.abs(num(r["Transaction Quantity"])), 0);
    if (value === 0) {
      // Fall back to Transaction Cost on crypto rows when USD legs are missing
      value = cryptoRows.reduce((s, r) => s + Math.abs(num(r["Transaction Cost"])), 0);
    }
    const price = quantity > 0 ? value / quantity : 0;

    // Fees: prefer dedicated fee rows; sum absolute values of either USD or crypto fee legs
    let fees = 0;
    for (const r of feeRows) {
      const usd = isUsdInstrument(r.Instrument);
      const qty = Math.abs(num(r["Transaction Quantity"]));
      const cost = Math.abs(num(r["Transaction Cost"]));
      // Use USD-equivalent: USD fee rows use quantity directly; non-USD fees use Transaction Cost when available
      fees += usd ? qty : cost || qty * price;
    }

    // Pick the latest timestamp in the group as the execution time
    const timestamp = cryptoRows
      .map((r) => r["Time (UTC)"])
      .filter(Boolean)
      .sort()
      .pop() || cryptoRows[0]["Time (UTC)"];
    const date = cryptoRows[0]["Event Date"];

    trades.push({
      timestamp,
      date,
      symbol,
      side,
      quantity: Math.round(quantity * 1e8) / 1e8,
      value: Math.round(value * 100) / 100,
      price: Math.round(price * 100) / 100,
      fees: Math.round(fees * 100) / 100,
      orderId: cryptoRows[0]["Order ID"],
      tradeMatchId,
    });
  }

  if (skippedGroups > 0) {
    const parts: string[] = [];
    if (inconsistentSideGroups > 0) parts.push(`${inconsistentSideGroups} with inconsistent or invalid side`);
    if (multiSymbolGroups > 0) parts.push(`${multiSymbolGroups} with multiple symbols`);
    if (zeroQtyGroups > 0) parts.push(`${zeroQtyGroups} with zero quantity`);
    const detail = parts.length > 0 ? ` (${parts.join(", ")})` : "";
    errors.push(`${skippedGroups} trade group(s) skipped${detail}.`);
  }

  trades.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  return { trades, totalRows: dataLines.length, tradingRows: relevantRows.length, skippedGroups, errors };
}

export function csvTradesToAppTrades(
  parsed: ParsedCsvTrade[],
  pnlMap: Map<string, number> = computeFifoPnl(parsed)
): Trade[] {
  return parsed.map((p) => ({
    id: buildCsvTradeId(p.tradeMatchId, p.orderId),
    date: toUtcIsoString(p.timestamp),
    instrument: p.symbol,
    side: p.side,
    quantity: p.quantity,
    value: p.value,
    price: p.price,
    fees: p.fees ?? 0,
    pnl: pnlMap.get(p.tradeMatchId) ?? 0,
    orderId: p.orderId,
    tradeMatchId: p.tradeMatchId,
    source: "crypto_com_csv",
    tags: ["crypto.com-import"],
  }));
}

export function findDuplicates(
  parsed: ParsedCsvTrade[],
  existing: Trade[]
): Set<string> {
  const existingIds = new Set(existing.map((t) => t.id));
  const existingTradeMatchIds = new Set(
    existing
      .map((t) => t.tradeMatchId ?? (t.id.startsWith("csv-") ? t.id.slice(4) : ""))
      .filter(Boolean)
  );
  const existingOrderIds = new Set(existing.map((t) => t.orderId).filter(Boolean));
  const dupes = new Set<string>();
  for (const p of parsed) {
    if (
      existingIds.has(buildCsvTradeId(p.tradeMatchId, p.orderId)) ||
      existingTradeMatchIds.has(p.tradeMatchId) ||
      (!!p.orderId && existingOrderIds.has(p.orderId))
    ) {
      dupes.add(p.tradeMatchId);
    }
  }
  return dupes;
}
