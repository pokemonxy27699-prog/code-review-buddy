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
  rating?: number;
  rMultiple?: number;
  stopLoss?: number;
  takeProfit?: number;
  tags?: string[];
  holdTime?: number;
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
