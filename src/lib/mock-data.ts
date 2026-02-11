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

const assets = ["BTC", "ETH", "SOL", "XRP", "CRO", "DOGE", "ADA", "AVAX"];

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max));
}

function generateTrades(count: number): Trade[] {
  const trades: Trade[] = [];
  const now = Date.now();
  for (let i = 0; i < count; i++) {
    const asset = assets[randInt(0, assets.length)];
    const side = Math.random() > 0.45 ? "BUY" : "SELL";
    const price = asset === "BTC" ? rand(25000, 70000) : asset === "ETH" ? rand(1500, 4000) : rand(0.1, 200);
    const qty = asset === "BTC" ? rand(0.001, 0.5) : asset === "ETH" ? rand(0.01, 5) : rand(10, 5000);
    const fees = price * qty * rand(0.001, 0.003);
    const pnl = rand(-500, 800);
    trades.push({
      id: `t-${i}`,
      date: new Date(now - randInt(0, 90 * 24 * 60 * 60 * 1000)).toISOString(),
      instrument: `${asset}_USDT`,
      side,
      quantity: +qty.toFixed(6),
      price: +price.toFixed(2),
      fees: +fees.toFixed(2),
      pnl: +pnl.toFixed(2),
      notes: Math.random() > 0.7 ? "Scalp trade" : undefined,
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

  return {
    totalPnl: +totalPnl.toFixed(2),
    winRate: +winRate.toFixed(1),
    totalTrades: trades.length,
    bestTrade: best ? +best.pnl.toFixed(2) : 0,
    worstTrade: worst ? +worst.pnl.toFixed(2) : 0,
    avgTradeSize: +avgSize.toFixed(2),
    profitFactor,
    sharpeRatio,
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
