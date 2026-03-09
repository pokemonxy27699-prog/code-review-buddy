export const SETUPS = ["Breakout", "Reversal", "Scalp", "Trend Follow", "Range Play", "News Play", "DCA"] as const;
export const EMOTIONS = ["Confident", "Fearful", "Greedy", "Calm", "Anxious", "FOMO", "Revenge"] as const;
export const MISTAKES = ["Early Entry", "Late Exit", "Oversized", "No Stop Loss", "Chased", "Ignored Plan", "None"] as const;

export type Setup = typeof SETUPS[number];
export type Emotion = typeof EMOTIONS[number];
export type Mistake = typeof MISTAKES[number];

export interface TradeJournal {
  preTradePlan?: string;
  whyEntered?: string;
  whyExited?: string;
  whatWentWell?: string;
  whatWentWrong?: string;
  lessonLearned?: string;
}

export interface MistakeReview {
  mistakes?: string[];
  severity?: "low" | "medium" | "high";
  avoidable?: boolean;
  reflection?: string;
}

export type TimelineEventType = "entry" | "scale_in" | "scale_out" | "stop_move" | "exit";

export interface TimelineEvent {
  id: string;
  time: string;
  price: number;
  size?: number;
  type: TimelineEventType;
  note?: string;
}

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
  rating?: number;
  rMultiple?: number;
  stopLoss?: number;
  takeProfit?: number;
  tags?: string[];
  holdTime?: number;
  journal?: TradeJournal;
  mistakeReview?: MistakeReview;
  screenshot?: string;
  annotations?: string;
  timeline?: TimelineEvent[];
}

export interface ReviewTemplate {
  id: string;
  name: string;
  journal: TradeJournal;
  suggestedMistakes?: string[];
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

export interface DailyJournal {
  date: string;
  preMarketPlan?: string;
  marketConditions?: string;
  whatDidWell?: string;
  mistakesMade?: string;
  lessonLearned?: string;
  tomorrowFocus?: string;
  grade?: string;
  emotionTags?: string[];
}

export interface TradingPlan {
  id: string;
  title: string;
  rules: string[];
  checklist: string[];
  createdAt: string;
  updatedAt: string;
}

export type RuleCategory = "Risk" | "Execution" | "Psychology" | "Process";

export interface TradingRule {
  id: string;
  title: string;
  category: RuleCategory;
  description: string;
  active: boolean;
  severityWeight: number; // 1-3
}

export interface RuleAdherence {
  ruleId: string;
  followed: boolean;
  note?: string;
}
