import { useState, useEffect } from "react";
import { Trade } from "@/lib/mock-data";
import { loadTagCategories } from "@/lib/trade-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Star, X, Plus } from "lucide-react";

function StarRatingInput({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} onClick={() => onChange(i)} className="focus:outline-none">
          <Star className={`h-4 w-4 transition-colors ${i <= value ? "fill-warning text-warning" : "text-muted-foreground/30 hover:text-warning/50"}`} />
        </button>
      ))}
    </div>
  );
}

interface Props {
  trade: Trade | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Trade>) => void;
}

export default function TradeDetailDrawer({ trade, onClose, onSave }: Props) {
  const cats = loadTagCategories();
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [mistakes, setMistakes] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || "");
      setRating(trade.rating || 0);
      setTags(trade.tags || []);
      const m: Record<string, boolean> = {};
      cats.mistakes.forEach((k) => (m[k] = trade.mistake === k));
      setMistakes(m);
    }
  }, [trade?.id]);

  const save = () => {
    if (!trade) return;
    const activeMistakes = Object.entries(mistakes)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onSave(trade.id, {
      notes,
      rating,
      tags,
      mistake: (activeMistakes[0] as Trade["mistake"]) || "None",
    });
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  if (!trade) return null;

  return (
    <Sheet open={!!trade} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:w-[420px] p-0 bg-card border-l border-border/40 overflow-y-auto">
        <SheetHeader className="p-5 pb-3 border-b border-border/30">
          <SheetTitle className="flex items-center gap-2 text-base">
            <span>{trade.instrument}</span>
            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${trade.side === "BUY" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
              {trade.side}
            </span>
          </SheetTitle>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(trade.date).toLocaleString()}
          </p>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* Metrics grid */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "P&L", value: `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toLocaleString()}`, color: trade.pnl >= 0 ? "text-success" : "text-destructive" },
              { label: "R-Multiple", value: `${trade.rMultiple}R`, color: (trade.rMultiple || 0) >= 0 ? "text-success" : "text-destructive" },
              { label: "Hold Time", value: `${trade.holdTime}m`, color: "text-foreground" },
            ].map((m) => (
              <div key={m.label} className="rounded-lg bg-muted/30 p-2.5">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                <p className={`font-mono text-sm font-bold ${m.color}`}>{m.value}</p>
              </div>
            ))}
          </div>

          {/* Entry / Exit details */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs">
            {[
              { l: "Quantity", v: trade.quantity },
              { l: "Price", v: `$${trade.price.toLocaleString()}` },
              { l: "Fees", v: `$${trade.fees}` },
              { l: "Setup", v: trade.setup },
              { l: "Stop Loss", v: `$${trade.stopLoss}`, c: "text-destructive" },
              { l: "Take Profit", v: `$${trade.takeProfit}`, c: "text-success" },
            ].map((d) => (
              <div key={d.l}>
                <p className="text-muted-foreground">{d.l}</p>
                <p className={`font-mono ${(d as { c?: string }).c || ""}`}>{d.v}</p>
              </div>
            ))}
          </div>

          {/* Rating */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Trade Rating</p>
            <StarRatingInput value={rating} onChange={setRating} />
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Tags</p>
            <div className="flex flex-wrap gap-1 mb-2">
              {tags.map((t) => (
                <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1">
                  {t}
                  <button onClick={() => removeTag(t)} className="hover:text-destructive">
                    <X className="h-2.5 w-2.5" />
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-1">
              <Input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                placeholder="Add tag..."
                className="h-7 text-xs bg-background"
                onKeyDown={(e) => e.key === "Enter" && addTag()}
              />
              <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={addTag}>
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Mistakes checklist */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Mistakes Checklist</p>
            <div className="space-y-1.5 rounded-lg bg-muted/20 p-3">
              {cats.mistakes.filter((m) => m !== "None").map((m) => (
                <label key={m} className="flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    checked={!!mistakes[m]}
                    onCheckedChange={(v) => setMistakes({ ...mistakes, [m]: !!v })}
                    className="h-3.5 w-3.5"
                  />
                  <span className={mistakes[m] ? "text-destructive" : "text-muted-foreground"}>{m}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs text-muted-foreground mb-1.5">Notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What happened in this trade..."
              className="text-xs bg-background min-h-[80px] resize-none"
            />
          </div>

          {/* Emotion */}
          <div className="rounded-lg bg-muted/20 p-3">
            <p className="text-xs text-muted-foreground mb-1">Emotion</p>
            <Badge variant="outline" className="border-primary/30 text-primary text-xs">
              {trade.emotion}
            </Badge>
          </div>

          {/* Save */}
          <Button className="w-full h-9 text-xs" onClick={save}>
            Save Changes
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
