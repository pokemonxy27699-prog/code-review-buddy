// Re-export types from canonical location
export type { Trade, Setup, Emotion, Mistake, CapitalFlow, AssetSummary, TradingPlan } from "./types";
export { SETUPS, EMOTIONS, MISTAKES } from "./types";

import type { Trade, CapitalFlow, TradingPlan } from "./types";
import { SETUPS, EMOTIONS, MISTAKES } from "./types";

const assets = ["BTC", "ETH", "SOL", "XRP", "CRO", "DOGE", "ADA", "AVAX"];

function rand(min: number, max: number) { return Math.random() * (max - min) + min; }
function randInt(min: number, max: number) { return Math.floor(rand(min, max)); }
function pick<T>(arr: readonly T[]): T { return arr[randInt(0, arr.length)]; }

function generateTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();
  const tagOptions = ["momentum", "high-vol", "low-cap", "earnings", "support", "resistance", "breakout-retest"];

  for (let i = 0; i < count; i++) {
    const asset = assets[randInt(0, assets.length)];
    const side = Math.random() > 0.45 ? "BUY" : "SELL";
    const price = asset === "BTC" ? rand(25000, 70000) : asset === "ETH" ? rand(1500, 4000) : rand(0.1, 200);
    const qty = asset === "BTC" ? rand(0.001, 0.5) : asset === "ETH" ? rand(0.01, 5) : rand(10, 5000);
    const fees = price * qty * rand(0.001, 0.003);
    const pnl = rand(-500, 800);
    const setup = pick(SETUPS);
    const emotion = pick(EMOTIONS);
    const mistake = Math.random() > 0.6 ? pick(MISTAKES.filter(m => m !== "None")) : "None";
    const rating = randInt(1, 6);
    const riskAmt = rand(50, 300);
    const rMultiple = +(pnl / riskAmt).toFixed(2);
    const stopLoss = side === "BUY" ? +(price * (1 - rand(0.01, 0.05))).toFixed(2) : +(price * (1 + rand(0.01, 0.05))).toFixed(2);
    const takeProfit = side === "BUY" ? +(price * (1 + rand(0.02, 0.1))).toFixed(2) : +(price * (1 - rand(0.02, 0.1))).toFixed(2);
    const tags = Array.from({ length: randInt(0, 3) }, () => pick(tagOptions));
    const holdTime = randInt(5, 480);

    trades.push({
      id: `t-${i}`,
      date: new Date(now - randInt(0, 90 * 24 * 60 * 60 * 1000)).toISOString(),
      instrument: `${asset}_USDT`,
      side, quantity: +qty.toFixed(6), price: +price.toFixed(2), fees: +fees.toFixed(2),
      pnl: +pnl.toFixed(2), notes: Math.random() > 0.5 ? pick(["Solid execution", "Entered too early", "Great R:R", "Should have held longer", "Perfect setup", "Broke my rules", "Followed the plan"]) : undefined,
      setup, emotion, mistake, rating, rMultiple, stopLoss, takeProfit, tags: [...new Set(tags)], holdTime,
    });
  }
  return trades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateCapitalFlows(count: number): CapitalFlow[] {
  const types: CapitalFlow["type"][] = ["deposit", "withdrawal", "dusting", "reward"];
  const flows: CapitalFlow[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const type = types[randInt(0, types.length)];
    const asset = assets[randInt(0, assets.length)];
    const amount = type === "dusting" ? rand(0.0001, 0.01) : rand(10, 5000);
    flows.push({
      id: `cf-${i}`,
      date: new Date(now - randInt(0, 180 * 24 * 60 * 60 * 1000)).toISOString(),
      type, asset, amount: +amount.toFixed(6), usdValue: +(amount * rand(0.5, 70000)).toFixed(2),
    });
  }
  return flows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export const mockTrades = generateTrades(150);
export const mockCapitalFlows = generateCapitalFlows(60);

export const mockTradingPlans: TradingPlan[] = [
  {
    id: "plan-1", title: "Scalp Trading Plan",
    rules: ["Only trade during high volume hours", "Max 3 trades per session", "Risk no more than 1% per trade", "Always use stop losses", "Take profits at 2R minimum"],
    checklist: ["Check market trend direction", "Identify key support/resistance levels", "Confirm volume above average", "Set stop loss before entry", "Calculate position size"],
    createdAt: "2025-12-01T10:00:00Z", updatedAt: "2026-01-15T14:30:00Z",
  },
  {
    id: "plan-2", title: "Swing Trading Plan",
    rules: ["Only trade with the trend", "Hold for 2-7 days minimum", "Use daily chart for direction, 4H for entry", "Max 5% portfolio risk at any time"],
    checklist: ["Analyze weekly trend", "Check for upcoming news events", "Verify correlation with BTC", "Set alerts at key levels"],
    createdAt: "2025-11-15T08:00:00Z", updatedAt: "2026-02-01T09:00:00Z",
  },
];
