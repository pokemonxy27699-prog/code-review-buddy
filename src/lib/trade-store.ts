import { Trade } from "./types";
import { mockTrades } from "./mock-data";
import { SETUPS, EMOTIONS, MISTAKES } from "./types";

// ── Tag categories (user-manageable, persisted to localStorage) ──
export interface TagCategories {
  setups: string[];
  emotions: string[];
  mistakes: string[];
}

const DEFAULT_TAG_CATEGORIES: TagCategories = {
  setups: [...SETUPS],
  emotions: [...EMOTIONS],
  mistakes: [...MISTAKES],
};

export function loadTagCategories(): TagCategories {
  try {
    const raw = localStorage.getItem("tag-categories");
    if (raw) return JSON.parse(raw);
  } catch {}
  return { ...DEFAULT_TAG_CATEGORIES };
}

export function saveTagCategories(cats: TagCategories) {
  localStorage.setItem("tag-categories", JSON.stringify(cats));
}

// ── Trades (localStorage-backed) ──
export function loadTrades(): Trade[] {
  try {
    const raw = localStorage.getItem("trades");
    if (raw) return JSON.parse(raw);
  } catch {}
  // seed once
  const trades = [...mockTrades];
  localStorage.setItem("trades", JSON.stringify(trades));
  return trades;
}

export function saveTrades(trades: Trade[]) {
  localStorage.setItem("trades", JSON.stringify(trades));
}

export function updateTrade(id: string, patch: Partial<Trade>): Trade[] {
  const trades = loadTrades();
  const idx = trades.findIndex((t) => t.id === id);
  if (idx >= 0) trades[idx] = { ...trades[idx], ...patch };
  saveTrades(trades);
  return trades;
}

// ── Saved filter views ──
export interface SavedView {
  id: string;
  name: string;
  filters: TradeFilters;
  visibleColumns: string[];
}

export interface TradeFilters {
  search: string;
  side: string;
  pnl: string;
  setup: string;
  emotion: string;
  mistake: string;
  account: string;
  dateFrom: string;
  dateTo: string;
  symbol: string;
}

export const DEFAULT_FILTERS: TradeFilters = {
  search: "",
  side: "all",
  pnl: "all",
  setup: "all",
  emotion: "all",
  mistake: "all",
  account: "all",
  dateFrom: "",
  dateTo: "",
  symbol: "all",
};

export function loadSavedViews(): SavedView[] {
  try {
    const raw = localStorage.getItem("saved-views");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveSavedViews(views: SavedView[]) {
  localStorage.setItem("saved-views", JSON.stringify(views));
}

// ── Column definitions ──
export const ALL_COLUMNS = [
  { key: "date", label: "Date", defaultVisible: true },
  { key: "instrument", label: "Symbol", defaultVisible: true },
  { key: "side", label: "Side", defaultVisible: true },
  { key: "setup", label: "Setup", defaultVisible: true },
  { key: "rating", label: "Rating", defaultVisible: true },
  { key: "rMultiple", label: "R-Mult", defaultVisible: true },
  { key: "pnl", label: "P&L", defaultVisible: true },
  { key: "emotion", label: "Emotion", defaultVisible: false },
  { key: "mistake", label: "Mistake", defaultVisible: false },
  { key: "quantity", label: "Qty", defaultVisible: false },
  { key: "price", label: "Price", defaultVisible: false },
  { key: "fees", label: "Fees", defaultVisible: false },
  { key: "holdTime", label: "Hold Time", defaultVisible: false },
  { key: "stopLoss", label: "Stop Loss", defaultVisible: false },
  { key: "takeProfit", label: "Take Profit", defaultVisible: false },
  { key: "tags", label: "Tags", defaultVisible: false },
] as const;

export type ColumnKey = (typeof ALL_COLUMNS)[number]["key"];

export function loadVisibleColumns(): ColumnKey[] {
  try {
    const raw = localStorage.getItem("visible-columns");
    if (raw) return JSON.parse(raw);
  } catch {}
  return ALL_COLUMNS.filter((c) => c.defaultVisible).map((c) => c.key);
}

export function saveVisibleColumns(cols: ColumnKey[]) {
  localStorage.setItem("visible-columns", JSON.stringify(cols));
}

// ── CSV Export ──
export function exportTradesToCsv(trades: Trade[]) {
  const headers = ["Date", "Symbol", "Side", "Qty", "Price", "Fees", "P&L", "R-Mult", "Setup", "Emotion", "Mistake", "Rating", "Tags", "Notes"];
  const rows = trades.map((t) => [
    t.date,
    t.instrument,
    t.side,
    t.quantity,
    t.price,
    t.fees,
    t.pnl,
    t.rMultiple ?? "",
    t.setup ?? "",
    t.emotion ?? "",
    t.mistake ?? "",
    t.rating ?? "",
    (t.tags ?? []).join(";"),
    (t.notes ?? "").replace(/"/g, '""'),
  ]);
  const csv = [headers.join(","), ...rows.map((r) => r.map((v) => `"${v}"`).join(","))].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Filter logic ──
export function applyFilters(trades: Trade[], f: TradeFilters): Trade[] {
  let result = [...trades];
  if (f.search) {
    const q = f.search.toLowerCase();
    result = result.filter(
      (t) =>
        t.instrument.toLowerCase().includes(q) ||
        t.tags?.some((tag) => tag.toLowerCase().includes(q)) ||
        t.notes?.toLowerCase().includes(q)
    );
  }
  if (f.side !== "all") result = result.filter((t) => t.side === f.side);
  if (f.pnl === "profit") result = result.filter((t) => t.pnl > 0);
  if (f.pnl === "loss") result = result.filter((t) => t.pnl < 0);
  if (f.setup !== "all") result = result.filter((t) => t.setup === f.setup);
  if (f.emotion !== "all") result = result.filter((t) => t.emotion === f.emotion);
  if (f.mistake !== "all") result = result.filter((t) => t.mistake === f.mistake);
  if (f.symbol !== "all") result = result.filter((t) => t.instrument === f.symbol);
  if (f.dateFrom) result = result.filter((t) => t.date >= f.dateFrom);
  if (f.dateTo) result = result.filter((t) => t.date <= f.dateTo);
  return result;
}
