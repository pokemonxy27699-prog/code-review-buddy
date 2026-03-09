import { TradingRule } from "./types";

const STORAGE_KEY = "trading-rules";

const DEFAULT_RULES: TradingRule[] = [
  { id: "r1", title: "Follow stop loss", category: "Risk", description: "Always honor the pre-set stop loss level", active: true, severityWeight: 3 },
  { id: "r2", title: "No revenge trading", category: "Psychology", description: "Do not enter a trade to recover a loss", active: true, severityWeight: 3 },
  { id: "r3", title: "No oversized positions", category: "Risk", description: "Never exceed max position size", active: true, severityWeight: 2 },
  { id: "r4", title: "Trade only A+ setups", category: "Process", description: "Only enter trades that match the highest conviction criteria", active: true, severityWeight: 2 },
  { id: "r5", title: "Wait for confirmation", category: "Execution", description: "Do not anticipate breakouts — wait for the candle to close", active: true, severityWeight: 1 },
];

export function loadRules(): TradingRule[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_RULES));
  return [...DEFAULT_RULES];
}

export function saveRules(rules: TradingRule[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rules));
}
