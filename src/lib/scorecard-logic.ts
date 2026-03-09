import { Trade, TradingRule, RuleAdherence } from "./types";

export interface ScorecardMetrics {
  totalTrades: number;
  adherenceRate: number; // 0-100
  mostBrokenRules: { rule: TradingRule; brokenCount: number; totalCost: number }[];
  bestFollowedRules: { rule: TradingRule; followedCount: number }[];
  avgPnlFollowed: number;
  avgPnlBroken: number;
  avgRating: number;
  mistakeFrequency: number; // % of trades with mistakes
}

export interface CoachingInsight {
  message: string;
  type: "positive" | "warning" | "danger";
  impact: "high" | "medium" | "low";
  drilldownParams?: Record<string, string>;
}

export function computeScorecard(trades: Trade[], rules: TradingRule[]): ScorecardMetrics {
  const activeRules = rules.filter(r => r.active);
  const tradesWithAdherence = trades.filter(t => t.ruleAdherence && t.ruleAdherence.length > 0);
  
  let totalChecks = 0;
  let totalFollowed = 0;
  const brokenMap = new Map<string, { count: number; pnlSum: number }>();
  const followedMap = new Map<string, number>();

  let pnlWhenFollowedAll = 0;
  let countFollowedAll = 0;
  let pnlWhenBrokenAny = 0;
  let countBrokenAny = 0;

  for (const trade of tradesWithAdherence) {
    const adherence = trade.ruleAdherence!;
    let allFollowed = true;

    for (const a of adherence) {
      totalChecks++;
      if (a.followed) {
        totalFollowed++;
        followedMap.set(a.ruleId, (followedMap.get(a.ruleId) || 0) + 1);
      } else {
        allFollowed = false;
        const prev = brokenMap.get(a.ruleId) || { count: 0, pnlSum: 0 };
        prev.count++;
        prev.pnlSum += trade.pnl;
        brokenMap.set(a.ruleId, prev);
      }
    }

    if (allFollowed) {
      pnlWhenFollowedAll += trade.pnl;
      countFollowedAll++;
    } else {
      pnlWhenBrokenAny += trade.pnl;
      countBrokenAny++;
    }
  }

  const ruleMap = new Map(activeRules.map(r => [r.id, r]));

  const mostBrokenRules = Array.from(brokenMap.entries())
    .map(([ruleId, data]) => ({ rule: ruleMap.get(ruleId)!, brokenCount: data.count, totalCost: data.pnlSum }))
    .filter(x => x.rule)
    .sort((a, b) => b.brokenCount - a.brokenCount);

  const bestFollowedRules = Array.from(followedMap.entries())
    .map(([ruleId, count]) => ({ rule: ruleMap.get(ruleId)!, followedCount: count }))
    .filter(x => x.rule)
    .sort((a, b) => b.followedCount - a.followedCount);

  const tradesWithMistakes = trades.filter(t => t.mistake && t.mistake !== "None").length;
  const ratingSum = trades.reduce((s, t) => s + (t.rating || 0), 0);
  const ratedCount = trades.filter(t => t.rating && t.rating > 0).length;

  return {
    totalTrades: trades.length,
    adherenceRate: totalChecks > 0 ? Math.round((totalFollowed / totalChecks) * 100) : 0,
    mostBrokenRules,
    bestFollowedRules,
    avgPnlFollowed: countFollowedAll > 0 ? Math.round(pnlWhenFollowedAll / countFollowedAll) : 0,
    avgPnlBroken: countBrokenAny > 0 ? Math.round(pnlWhenBrokenAny / countBrokenAny) : 0,
    avgRating: ratedCount > 0 ? Number((ratingSum / ratedCount).toFixed(1)) : 0,
    mistakeFrequency: trades.length > 0 ? Math.round((tradesWithMistakes / trades.length) * 100) : 0,
  };
}

export function generateCoachingInsights(metrics: ScorecardMetrics, trades: Trade[]): CoachingInsight[] {
  const insights: CoachingInsight[] = [];

  // PnL difference when rules followed vs broken
  if (metrics.avgPnlFollowed !== 0 || metrics.avgPnlBroken !== 0) {
    const diff = metrics.avgPnlFollowed - metrics.avgPnlBroken;
    if (diff > 0) {
      insights.push({
        message: `Your avg PnL is $${diff.toLocaleString()} better when you follow all rules`,
        type: "positive",
        impact: diff > 200 ? "high" : "medium",
      });
    }
  }

  // Most broken rule
  if (metrics.mostBrokenRules.length > 0) {
    const worst = metrics.mostBrokenRules[0];
    insights.push({
      message: `"${worst.rule.title}" is your most broken rule (${worst.brokenCount} times)`,
      type: "danger",
      impact: worst.brokenCount > 5 ? "high" : "medium",
    });
    if (worst.totalCost < 0) {
      insights.push({
        message: `Breaking "${worst.rule.title}" has cost you $${Math.abs(worst.totalCost).toLocaleString()}`,
        type: "danger",
        impact: "high",
      });
    }
  }

  // Adherence rate
  if (metrics.adherenceRate > 0) {
    if (metrics.adherenceRate >= 85) {
      insights.push({
        message: `Great discipline! ${metrics.adherenceRate}% rule adherence`,
        type: "positive",
        impact: "medium",
      });
    } else if (metrics.adherenceRate < 60) {
      insights.push({
        message: `Rule adherence is low at ${metrics.adherenceRate}% — focus on discipline`,
        type: "warning",
        impact: "high",
      });
    }
  }

  // Mistake frequency
  if (metrics.mistakeFrequency > 40) {
    insights.push({
      message: `${metrics.mistakeFrequency}% of your trades have tagged mistakes — review your process`,
      type: "warning",
      impact: "high",
    });
  }

  // Best followed rule with positive PnL correlation
  if (metrics.bestFollowedRules.length > 0) {
    const best = metrics.bestFollowedRules[0];
    insights.push({
      message: `"${best.rule.title}" is your best followed rule (${best.followedCount} times)`,
      type: "positive",
      impact: "medium",
    });
  }

  return insights;
}
