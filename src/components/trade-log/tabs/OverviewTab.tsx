import { Trade } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Target, TrendingUp, DollarSign, BarChart3, Gauge } from "lucide-react";

function StarRatingInput({
  value,
  onChange,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          onClick={() => !disabled && onChange(i)}
          className="focus:outline-none"
          disabled={disabled}
        >
          <Star
            className={`h-4 w-4 transition-colors ${
              i <= value
                ? "fill-warning text-warning"
                : "text-muted-foreground/30 hover:text-warning/50"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

interface Props {
  trade: Trade;
  editing: boolean;
  rating: number;
  onRatingChange: (v: number) => void;
  tags: string[];
}

export default function OverviewTab({ trade, editing, rating, onRatingChange, tags }: Props) {
  const duration = trade.holdTime
    ? `${Math.floor(trade.holdTime / 60)}h ${trade.holdTime % 60}m`
    : "—";
  const pnlPct =
    trade.price && trade.quantity
      ? ((trade.pnl / (trade.price * trade.quantity)) * 100).toFixed(2)
      : "0.00";

  return (
    <div className="space-y-6">
      {/* Hero PnL Card */}
      <div className={`rounded-xl p-5 border ${
        trade.pnl >= 0
          ? "bg-success/5 border-success/20"
          : "bg-destructive/5 border-destructive/20"
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net P&L</p>
            <p className={`font-mono text-3xl font-bold ${trade.pnl >= 0 ? "text-success" : "text-destructive"}`}>
              {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
            </p>
            <p className={`font-mono text-sm mt-0.5 ${Number(pnlPct) >= 0 ? "text-success/70" : "text-destructive/70"}`}>
              {Number(pnlPct) >= 0 ? "+" : ""}{pnlPct}%
            </p>
          </div>
          <div className="text-right space-y-2">
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">R-Multiple</p>
              <p className={`font-mono text-xl font-bold ${(trade.rMultiple || 0) >= 0 ? "text-success" : "text-destructive"}`}>
                {trade.rMultiple || 0}R
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: DollarSign, label: "Entry", value: `$${trade.price.toLocaleString()}`, color: "text-foreground" },
          { icon: Target, label: "Stop Loss", value: trade.stopLoss ? `$${trade.stopLoss}` : "—", color: "text-destructive" },
          { icon: TrendingUp, label: "Take Profit", value: trade.takeProfit ? `$${trade.takeProfit}` : "—", color: "text-success" },
          { icon: BarChart3, label: "Quantity", value: `${trade.quantity} units`, color: "text-foreground" },
          { icon: Clock, label: "Duration", value: duration, color: "text-foreground" },
          { icon: Gauge, label: "Fees", value: `$${trade.fees}`, color: "text-muted-foreground" },
        ].map((m) => (
          <div key={m.label} className="rounded-lg bg-muted/15 border border-border/20 p-3.5">
            <div className="flex items-center gap-1.5 mb-1">
              <m.icon className="h-3 w-3 text-muted-foreground/60" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
            </div>
            <p className={`font-mono text-sm font-semibold ${m.color}`}>{m.value}</p>
          </div>
        ))}
      </div>

      {/* Rating */}
      <div className="rounded-lg bg-muted/10 border border-border/20 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-1">Execution Rating</p>
            <StarRatingInput value={rating} onChange={onRatingChange} disabled={!editing} />
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Setup</p>
            <p className="text-sm font-medium">{trade.setup || "—"}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground mb-1">Emotion</p>
            <p className="text-sm font-medium">{trade.emotion || "—"}</p>
          </div>
        </div>
      </div>

      {/* Tags */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Tags</p>
        <div className="flex flex-wrap gap-1.5">
          {trade.setup && (
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">{trade.setup}</Badge>
          )}
          {trade.emotion && (
            <Badge variant="outline" className="text-xs border-accent/30 text-accent-foreground">{trade.emotion}</Badge>
          )}
          {trade.mistake && trade.mistake !== "None" && (
            <Badge variant="destructive" className="text-xs">{trade.mistake}</Badge>
          )}
          {tags.map((t) => (
            <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
          ))}
          {tags.length === 0 && !trade.setup && !trade.emotion && (!trade.mistake || trade.mistake === "None") && (
            <span className="text-xs text-muted-foreground">No tags</span>
          )}
        </div>
      </div>
    </div>
  );
}
