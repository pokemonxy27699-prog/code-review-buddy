import { Trade } from "@/lib/types";
import { getPnlBySetup, getMistakeAnalysis, getPnlByDayOfWeek, getPnlByHour, getPnlByEmotion, getKPIs } from "@/lib/analytics";

export interface CoachingCard {
  id: string;
  icon: "trophy" | "alert" | "clock" | "calendar" | "brain" | "target";
  title: string;
  detail: string;
  sentiment: "positive" | "negative" | "neutral";
  drilldown: Record<string, string>;
}

export interface Recommendation {
  id: string;
  action: string;
  reason: string;
  impact: "high" | "medium" | "low";
  drilldown: Record<string, string>;
}

export interface SetupComparison {
  name: string;
  pnl: number;
  count: number;
  winRate: number;
  avgPnl: number;
}

export function generateCoachingCards(trades: Trade[]): CoachingCard[] {
  if (trades.length < 3) return [];
  const cards: CoachingCard[] = [];

  const setups = getPnlBySetup(trades);
  if (setups.length > 0) {
    const best = setups[0];
    cards.push({
      id: "best-setup",
      icon: "trophy",
      title: `Your ${best.setup} trades perform best`,
      detail: `${best.count} trades, ${best.winRate}% win rate, $${best.pnl.toLocaleString()} total P&L`,
      sentiment: "positive",
      drilldown: { setup: best.setup },
    });
    const worst = setups[setups.length - 1];
    if (worst.pnl < 0) {
      cards.push({
        id: "worst-setup",
        icon: "alert",
        title: `${worst.setup} has low expectancy`,
        detail: `${worst.count} trades, ${worst.winRate}% win rate, $${worst.pnl.toLocaleString()} total P&L`,
        sentiment: "negative",
        drilldown: { setup: worst.setup },
      });
    }
  }

  const mistakes = getMistakeAnalysis(trades);
  if (mistakes.length > 0) {
    const costliest = mistakes[0];
    cards.push({
      id: "costly-mistake",
      icon: "alert",
      title: `${costliest.mistake} is costing you the most`,
      detail: `${costliest.count} occurrences, $${Math.abs(costliest.pnl).toLocaleString()} total loss`,
      sentiment: "negative",
      drilldown: { mistake: costliest.mistake },
    });
  }

  const days = getPnlByDayOfWeek(trades);
  const tradedDays = days.filter(d => d.count > 0);
  if (tradedDays.length > 0) {
    const bestDay = tradedDays.reduce((a, b) => a.pnl > b.pnl ? a : b);
    const worstDay = tradedDays.reduce((a, b) => a.pnl < b.pnl ? a : b);
    if (bestDay.pnl > 0) {
      cards.push({
        id: "best-day",
        icon: "calendar",
        title: `${bestDay.day} is your best day`,
        detail: `$${bestDay.pnl.toLocaleString()} P&L, ${bestDay.winRate}% win rate across ${bestDay.count} trades`,
        sentiment: "positive",
        drilldown: {},
      });
    }
    if (worstDay.pnl < 0) {
      cards.push({
        id: "worst-day",
        icon: "calendar",
        title: `You perform worst on ${worstDay.day}`,
        detail: `$${worstDay.pnl.toLocaleString()} P&L across ${worstDay.count} trades`,
        sentiment: "negative",
        drilldown: {},
      });
    }
  }

  const emotions = getPnlByEmotion(trades);
  const fearful = emotions.find(e => e.emotion === "Fearful" && e.pnl < 0);
  if (fearful) {
    cards.push({
      id: "fearful-emotion",
      icon: "brain",
      title: `Fearful trades are losing money`,
      detail: `${fearful.count} trades with $${fearful.pnl.toLocaleString()} total P&L`,
      sentiment: "negative",
      drilldown: { emotion: "Fearful" },
    });
  }

  return cards;
}

export function generateRecommendations(trades: Trade[]): Recommendation[] {
  if (trades.length < 3) return [];
  const recs: Recommendation[] = [];

  const setups = getPnlBySetup(trades);
  if (setups.length > 0) {
    const best = setups[0];
    if (best.pnl > 0) {
      recs.push({
        id: "trade-more-setup",
        action: `Trade more ${best.setup}`,
        reason: `Your best strategy with ${best.winRate}% win rate and $${best.avgPnl} avg P&L`,
        impact: "high",
        drilldown: { setup: best.setup },
      });
    }
    const worst = setups[setups.length - 1];
    if (worst.pnl < 0 && worst.count >= 3) {
      recs.push({
        id: "reduce-setup",
        action: `Reduce or stop ${worst.setup} trades`,
        reason: `Losing $${Math.abs(worst.avgPnl)} per trade on average with ${worst.winRate}% win rate`,
        impact: "high",
        drilldown: { setup: worst.setup },
      });
    }
  }

  const mistakes = getMistakeAnalysis(trades);
  if (mistakes.length > 0) {
    recs.push({
      id: "reduce-mistake",
      action: `Eliminate "${mistakes[0].mistake}" from your trading`,
      reason: `Costing you $${Math.abs(mistakes[0].pnl).toLocaleString()} across ${mistakes[0].count} trades`,
      impact: "high",
      drilldown: { mistake: mistakes[0].mistake },
    });
  }

  const hours = getPnlByHour(trades);
  const tradedHours = hours.filter(h => h.count >= 2);
  if (tradedHours.length > 0) {
    const worstHour = tradedHours.reduce((a, b) => a.pnl < b.pnl ? a : b);
    if (worstHour.pnl < 0) {
      recs.push({
        id: "avoid-hour",
        action: `Avoid trading at ${worstHour.hour}`,
        reason: `Lost $${Math.abs(worstHour.pnl).toLocaleString()} across ${worstHour.count} trades during this hour`,
        impact: "medium",
        drilldown: {},
      });
    }
  }

  const emotions = getPnlByEmotion(trades);
  const negEmotions = emotions.filter(e => e.pnl < 0 && e.emotion !== "Unknown");
  if (negEmotions.length > 0) {
    const worst = negEmotions[negEmotions.length - 1].emotion === negEmotions[0].emotion ? negEmotions[0] : negEmotions.reduce((a, b) => a.pnl < b.pnl ? a : b);
    recs.push({
      id: "review-emotion",
      action: `Review losing trades tagged "${worst.emotion}"`,
      reason: `${worst.count} trades with this emotion lost $${Math.abs(worst.pnl).toLocaleString()} total`,
      impact: "medium",
      drilldown: { emotion: worst.emotion },
    });
  }

  return recs;
}

export interface CompareResult {
  labelA: string;
  labelB: string;
  a: { pnl: number; count: number; winRate: number; avgPnl: number; profitFactor: number };
  b: { pnl: number; count: number; winRate: number; avgPnl: number; profitFactor: number };
}

function summarize(trades: Trade[]) {
  const kpis = getKPIs(trades);
  return {
    pnl: kpis.totalPnl,
    count: kpis.totalTrades,
    winRate: kpis.winRate,
    avgPnl: kpis.totalTrades > 0 ? +(kpis.totalPnl / kpis.totalTrades).toFixed(2) : 0,
    profitFactor: kpis.profitFactor,
  };
}

export function compareSetups(trades: Trade[], setupA: string, setupB: string): CompareResult {
  return {
    labelA: setupA,
    labelB: setupB,
    a: summarize(trades.filter(t => t.setup === setupA)),
    b: summarize(trades.filter(t => t.setup === setupB)),
  };
}

export function compareWinVsLoss(trades: Trade[]): CompareResult {
  return {
    labelA: "Winners",
    labelB: "Losers",
    a: summarize(trades.filter(t => t.pnl > 0)),
    b: summarize(trades.filter(t => t.pnl <= 0)),
  };
}

export function compareMistakeVsClean(trades: Trade[]): CompareResult {
  return {
    labelA: "With Mistakes",
    labelB: "Clean Trades",
    a: summarize(trades.filter(t => t.mistake && t.mistake !== "None")),
    b: summarize(trades.filter(t => !t.mistake || t.mistake === "None")),
  };
}

export function compareMonths(trades: Trade[], monthA: string, monthB: string): CompareResult {
  return {
    labelA: monthA,
    labelB: monthB,
    a: summarize(trades.filter(t => t.date.slice(0, 7) === monthA)),
    b: summarize(trades.filter(t => t.date.slice(0, 7) === monthB)),
  };
}
