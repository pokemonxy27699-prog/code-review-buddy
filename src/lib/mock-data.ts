export const SETUPS = ["Breakout", "Reversal", "Scalp", "Trend Follow", "Range Play", "News Play", "DCA"] as const;
export const EMOTIONS = ["Confident", "Fearful", "Greedy", "Calm", "Anxious", "FOMO", "Revenge"] as const;
export const MISTAKES = ["Early Entry", "Late Exit", "Oversized", "No Stop Loss", "Chased", "Ignored Plan", "None"] as const;

export type Setup = typeof SETUPS[number];
export type Emotion = typeof EMOTIONS[number];
export type Mistake = typeof MISTAKES[number];

export interface Trade {
  id: string;
  date: string;
  instrument: string;
  side: "BUY" | "SELL";
  quantity: number;
  price: number;
  fees: number;
  pnl: number;
  notes?: string;
  setup?: Setup;
  emotion?: Emotion;
  mistake?: Mistake;
  rating?: number; // 1-5
  rMultiple?: number;
  stopLoss?: number;
  takeProfit?: number;
  tags?: string[];
  holdTime?: number; // minutes
}

export interface CapitalFlow {
  id: string;
  date: string;
  type: "deposit" | "withdrawal" | "dusting" | "reward";
  asset: string;
  amount: number;
  usdValue: number;
}

export interface AssetSummary {
  asset: string;
  totalPnl: number;
  tradeCount: number;
  winRate: number;
  avgReturn: number;
  pnlHistory: number[];
}

export interface TradingPlan {
  id: string;
  title: string;
  rules: string[];
  checklist: string[];
  createdAt: string;
  updatedAt: string;
}

const assets = ["BTC", "ETH", "SOL", "XRP", "CRO", "DOGE", "ADA", "AVAX"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max));
}

function pick<T>(arr: readonly T[]): T {
  return arr[randInt(0, arr.length)];
}

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
      side,
      quantity: +qty.toFixed(6),
      price: +price.toFixed(2),
      fees: +fees.toFixed(2),
      pnl: +pnl.toFixed(2),
      notes: Math.random() > 0.5 ? pick(["Solid execution", "Entered too early", "Great R:R", "Should have held longer", "Perfect setup", "Broke my rules", "Followed the plan"]) : undefined,
      setup,
      emotion,
      mistake,
      rating,
      rMultiple,
      stopLoss,
      takeProfit,
      tags: [...new Set(tags)],
      holdTime,
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
      type,
      asset,
      amount: +amount.toFixed(6),
      usdValue: +(amount * rand(0.5, 70000)).toFixed(2),
    });
  }
  return flows.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

function generateAssetSummaries(trades: Trade[]): AssetSummary[] {
  return assets.map((asset) => {
    const assetTrades = trades.filter((t) => t.instrument.startsWith(asset));
    const wins = assetTrades.filter((t) => t.pnl > 0).length;
    const totalPnl = assetTrades.reduce((sum, t) => sum + t.pnl, 0);
    return {
      asset,
      totalPnl: +totalPnl.toFixed(2),
      tradeCount: assetTrades.length,
      winRate: assetTrades.length > 0 ? +(wins / assetTrades.length * 100).toFixed(1) : 0,
      avgReturn: assetTrades.length > 0 ? +(totalPnl / assetTrades.length).toFixed(2) : 0,
      pnlHistory: Array.from({ length: 14 }, () => +rand(-200, 300).toFixed(2)),
    };
  });
}

export const mockTrades = generateTrades(150);
export const mockCapitalFlows = generateCapitalFlows(60);
export const mockAssetSummaries = generateAssetSummaries(mockTrades);

export const mockTradingPlans: TradingPlan[] = [
  {
    id: "plan-1",
    title: "Scalp Trading Plan",
    rules: [
      "Only trade during high volume hours",
      "Max 3 trades per session",
      "Risk no more than 1% per trade",
      "Always use stop losses",
      "Take profits at 2R minimum",
    ],
    checklist: [
      "Check market trend direction",
      "Identify key support/resistance levels",
      "Confirm volume above average",
      "Set stop loss before entry",
      "Calculate position size",
    ],
    createdAt: "2025-12-01T10:00:00Z",
    updatedAt: "2026-01-15T14:30:00Z",
  },
  {
    id: "plan-2",
    title: "Swing Trading Plan",
    rules: [
      "Only trade with the trend",
      "Hold for 2-7 days minimum",
      "Use daily chart for direction, 4H for entry",
      "Max 5% portfolio risk at any time",
    ],
    checklist: [
      "Analyze weekly trend",
      "Check for upcoming news events",
      "Verify correlation with BTC",
      "Set alerts at key levels",
    ],
    createdAt: "2025-11-15T08:00:00Z",
    updatedAt: "2026-02-01T09:00:00Z",
  },
];

export function getKPIs(trades: Trade[]) {
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const winRate = trades.length > 0 ? (wins.length / trades.length) * 100 : 0;
  const best = trades.reduce((best, t) => (t.pnl > best.pnl ? t : best), trades[0]);
  const worst = trades.reduce((worst, t) => (t.pnl < worst.pnl ? t : worst), trades[0]);
  const avgSize = trades.reduce((s, t) => s + t.price * t.quantity, 0) / (trades.length || 1);

  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? Infinity : 0;

  const avgReturn = trades.length > 0 ? totalPnl / trades.length : 0;
  const stdDev = trades.length > 1
    ? Math.sqrt(trades.reduce((s, t) => s + (t.pnl - avgReturn) ** 2, 0) / (trades.length - 1))
    : 0;
  const sharpeRatio = stdDev > 0 ? +((avgReturn / stdDev) * Math.sqrt(252)).toFixed(2) : 0;

  const avgRMultiple = trades.length > 0 
    ? +(trades.reduce((s, t) => s + (t.rMultiple || 0), 0) / trades.length).toFixed(2) 
    : 0;

  return {
    totalPnl: +totalPnl.toFixed(2),
    winRate: +winRate.toFixed(1),
    totalTrades: trades.length,
    bestTrade: best ? +best.pnl.toFixed(2) : 0,
    worstTrade: worst ? +worst.pnl.toFixed(2) : 0,
    avgTradeSize: +avgSize.toFixed(2),
    profitFactor,
    sharpeRatio,
    avgRMultiple,
  };
}

export function getDailyPnl(trades: Trade[]) {
  const daily: Record<string, number> = {};
  trades.forEach((t) => {
    const day = t.date.slice(0, 10);
    daily[day] = (daily[day] || 0) + t.pnl;
  });
  return Object.entries(daily)
    .map(([date, pnl]) => ({ date, pnl: +pnl.toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function getEquityCurve(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let cumulative = 0;
  return sorted.map((t) => {
    cumulative += t.pnl;
    return { date: t.date.slice(0, 10), equity: +cumulative.toFixed(2) };
  });
}

export function getDrawdownCurve(trades: Trade[]) {
  const equity = getEquityCurve(trades);
  let peak = -Infinity;
  return equity.map((e) => {
    if (e.equity > peak) peak = e.equity;
    const drawdown = peak > 0 ? +((e.equity - peak) / peak * 100).toFixed(2) : 0;
    return { date: e.date, drawdown };
  });
}

export function getMaxDrawdown(trades: Trade[]) {
  const dd = getDrawdownCurve(trades);
  return dd.length > 0 ? Math.min(...dd.map((d) => d.drawdown)) : 0;
}

export function getCalendarHeatmap(trades: Trade[]) {
  const daily: Record<string, number> = {};
  trades.forEach((t) => {
    const day = t.date.slice(0, 10);
    daily[day] = (daily[day] || 0) + t.pnl;
  });
  return Object.entries(daily)
    .map(([date, pnl]) => ({ date, pnl: +pnl.toFixed(2) }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

// Reports helpers
export function getPnlByDayOfWeek(trades: Trade[]) {
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const byDay: Record<string, { pnl: number; count: number; wins: number }> = {};
  days.forEach(d => byDay[d] = { pnl: 0, count: 0, wins: 0 });
  trades.forEach(t => {
    const day = days[new Date(t.date).getDay()];
    byDay[day].pnl += t.pnl;
    byDay[day].count++;
    if (t.pnl > 0) byDay[day].wins++;
  });
  return days.map(d => ({ day: d.slice(0, 3), pnl: +byDay[d].pnl.toFixed(2), count: byDay[d].count, winRate: byDay[d].count > 0 ? +(byDay[d].wins / byDay[d].count * 100).toFixed(1) : 0 }));
}

export function getPnlByHour(trades: Trade[]) {
  const byHour: Record<number, { pnl: number; count: number }> = {};
  for (let h = 0; h < 24; h++) byHour[h] = { pnl: 0, count: 0 };
  trades.forEach(t => {
    const h = new Date(t.date).getHours();
    byHour[h].pnl += t.pnl;
    byHour[h].count++;
  });
  return Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, pnl: +byHour[h].pnl.toFixed(2), count: byHour[h].count }));
}

export function getPnlBySetup(trades: Trade[]) {
  const bySetup: Record<string, { pnl: number; count: number; wins: number }> = {};
  trades.forEach(t => {
    const s = t.setup || "Unknown";
    if (!bySetup[s]) bySetup[s] = { pnl: 0, count: 0, wins: 0 };
    bySetup[s].pnl += t.pnl;
    bySetup[s].count++;
    if (t.pnl > 0) bySetup[s].wins++;
  });
  return Object.entries(bySetup).map(([setup, data]) => ({
    setup,
    pnl: +data.pnl.toFixed(2),
    count: data.count,
    winRate: +(data.wins / data.count * 100).toFixed(1),
    avgPnl: +(data.pnl / data.count).toFixed(2),
  })).sort((a, b) => b.pnl - a.pnl);
}

export function getWinLossStreaks(trades: Trade[]) {
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let maxWin = 0, maxLoss = 0, curWin = 0, curLoss = 0;
  const streaks: { date: string; streak: number }[] = [];
  sorted.forEach(t => {
    if (t.pnl > 0) { curWin++; curLoss = 0; } 
    else { curLoss++; curWin = 0; }
    if (curWin > maxWin) maxWin = curWin;
    if (curLoss > maxLoss) maxLoss = curLoss;
    streaks.push({ date: t.date.slice(0, 10), streak: curWin > 0 ? curWin : -curLoss });
  });
  return { maxWin, maxLoss, currentStreak: streaks.length > 0 ? streaks[streaks.length - 1].streak : 0, streaks };
}

export function getPnlByEmotion(trades: Trade[]) {
  const byEmotion: Record<string, { pnl: number; count: number; wins: number }> = {};
  trades.forEach(t => {
    const e = t.emotion || "Unknown";
    if (!byEmotion[e]) byEmotion[e] = { pnl: 0, count: 0, wins: 0 };
    byEmotion[e].pnl += t.pnl;
    byEmotion[e].count++;
    if (t.pnl > 0) byEmotion[e].wins++;
  });
  return Object.entries(byEmotion).map(([emotion, data]) => ({
    emotion,
    pnl: +data.pnl.toFixed(2),
    count: data.count,
    winRate: +(data.wins / data.count * 100).toFixed(1),
  })).sort((a, b) => b.pnl - a.pnl);
}

export function getMistakeAnalysis(trades: Trade[]) {
  const byMistake: Record<string, { pnl: number; count: number }> = {};
  trades.forEach(t => {
    const m = t.mistake || "None";
    if (m === "None") return;
    if (!byMistake[m]) byMistake[m] = { pnl: 0, count: 0 };
    byMistake[m].pnl += t.pnl;
    byMistake[m].count++;
  });
  return Object.entries(byMistake).map(([mistake, data]) => ({
    mistake,
    pnl: +data.pnl.toFixed(2),
    count: data.count,
    avgPnl: +(data.pnl / data.count).toFixed(2),
  })).sort((a, b) => a.pnl - b.pnl);
}
