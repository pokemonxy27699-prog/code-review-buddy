import { Trade } from "@/lib/mock-data";

export function getKPIs(trades: Trade[]) {
  if (trades.length === 0) {
    return { totalPnl: 0, winRate: 0, totalTrades: 0, bestTrade: 0, worstTrade: 0, avgTradeSize: 0, profitFactor: 0, sharpeRatio: 0, avgRMultiple: 0 };
  }
  const totalPnl = trades.reduce((s, t) => s + t.pnl, 0);
  const wins = trades.filter((t) => t.pnl > 0);
  const losses = trades.filter((t) => t.pnl < 0);
  const winRate = (wins.length / trades.length) * 100;
  const best = trades.reduce((b, t) => (t.pnl > b.pnl ? t : b), trades[0]);
  const worst = trades.reduce((w, t) => (t.pnl < w.pnl ? t : w), trades[0]);
  const avgSize = trades.reduce((s, t) => s + t.price * t.quantity, 0) / trades.length;
  const grossProfit = wins.reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(losses.reduce((s, t) => s + t.pnl, 0));
  const profitFactor = grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : grossProfit > 0 ? Infinity : 0;
  const avgReturn = totalPnl / trades.length;
  const stdDev = trades.length > 1
    ? Math.sqrt(trades.reduce((s, t) => s + (t.pnl - avgReturn) ** 2, 0) / (trades.length - 1))
    : 0;
  const sharpeRatio = stdDev > 0 ? +((avgReturn / stdDev) * Math.sqrt(252)).toFixed(2) : 0;
  const avgRMultiple = +(trades.reduce((s, t) => s + (t.rMultiple || 0), 0) / trades.length).toFixed(2);

  return {
    totalPnl: +totalPnl.toFixed(2),
    winRate: +winRate.toFixed(1),
    totalTrades: trades.length,
    bestTrade: +best.pnl.toFixed(2),
    worstTrade: +worst.pnl.toFixed(2),
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
  if (trades.length === 0) return { maxWin: 0, maxLoss: 0, currentStreak: 0, streaks: [] };
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
  return { maxWin, maxLoss, currentStreak: streaks[streaks.length - 1].streak, streaks };
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
