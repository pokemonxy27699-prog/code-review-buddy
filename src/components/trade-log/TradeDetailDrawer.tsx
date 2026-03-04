import { useState, useEffect, useRef, useCallback } from "react";
import { Trade } from "@/lib/types";
import { loadTagCategories } from "@/lib/trade-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Star, X, Plus, Pencil, Eye, Clock, DollarSign, TrendingUp } from "lucide-react";

function StarRatingInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((i) => (
        <button key={i} onClick={() => !disabled && onChange(i)} className="focus:outline-none" disabled={disabled}>
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
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [mistakes, setMistakes] = useState<Record<string, boolean>>({});
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || "");
      setRating(trade.rating || 0);
      setTags(trade.tags || []);
      const m: Record<string, boolean> = {};
      cats.mistakes.forEach((k) => (m[k] = trade.mistake === k));
      setMistakes(m);
      setEditing(false);
    }
  }, [trade?.id]);

  // Autosave notes after 1s of inactivity
  const scheduleAutosave = useCallback(
    (newNotes: string) => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
      autosaveTimer.current = setTimeout(() => {
        if (trade && editing) {
          onSave(trade.id, { notes: newNotes });
        }
      }, 1000);
    },
    [trade, editing, onSave]
  );

  useEffect(() => {
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, []);

  const handleNotesChange = (val: string) => {
    setNotes(val);
    scheduleAutosave(val);
  };

  const save = () => {
    if (!trade) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const activeMistakes = Object.entries(mistakes)
      .filter(([, v]) => v)
      .map(([k]) => k);
    onSave(trade.id, {
      notes,
      rating,
      tags,
      mistake: (activeMistakes[0] as Trade["mistake"]) || "None",
    });
    setEditing(false);
  };

  const cancel = () => {
    if (!trade) return;
    setNotes(trade.notes || "");
    setRating(trade.rating || 0);
    setTags(trade.tags || []);
    const m: Record<string, boolean> = {};
    cats.mistakes.forEach((k) => (m[k] = trade.mistake === k));
    setMistakes(m);
    setEditing(false);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  if (!trade) return null;

  const duration = trade.holdTime ? `${Math.floor(trade.holdTime / 60)}h ${trade.holdTime % 60}m` : "—";
  const pnlPct = trade.price && trade.quantity ? ((trade.pnl / (trade.price * trade.quantity)) * 100).toFixed(2) : "0.00";

  return (
    <Sheet open={!!trade} onOpenChange={() => onClose()}>
      <SheetContent side="right" className="w-full sm:w-[440px] p-0 bg-card border-l border-border/40 overflow-y-auto">
        <SheetHeader className="p-5 pb-3 border-b border-border/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-base">
              <span>{trade.instrument}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${trade.side === "BUY" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
                {trade.side}
              </span>
            </SheetTitle>
            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setEditing(!editing)}
            >
              {editing ? <><Eye className="h-3 w-3" /> View</> : <><Pencil className="h-3 w-3" /> Edit</>}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground font-mono">
            {new Date(trade.date).toLocaleString()}
          </p>
        </SheetHeader>

        <div className="p-5 space-y-5">
          {/* ── Section 1: Summary ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <DollarSign className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Summary</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "P&L", value: `${trade.pnl >= 0 ? "+" : ""}$${trade.pnl.toLocaleString()}`, sub: `${Number(pnlPct) >= 0 ? "+" : ""}${pnlPct}%`, color: trade.pnl >= 0 ? "text-success" : "text-destructive" },
                { label: "R-Multiple", value: `${trade.rMultiple}R`, sub: null, color: (trade.rMultiple || 0) >= 0 ? "text-success" : "text-destructive" },
                { label: "Duration", value: duration, sub: null, color: "text-foreground" },
              ].map((m) => (
                <div key={m.label} className="rounded-lg bg-muted/30 p-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{m.label}</p>
                  <p className={`font-mono text-sm font-bold ${m.color}`}>{m.value}</p>
                  {m.sub && <p className={`font-mono text-[10px] ${m.color} opacity-70`}>{m.sub}</p>}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs mt-3">
              {[
                { l: "Quantity", v: trade.quantity },
                { l: "Entry Price", v: `$${trade.price.toLocaleString()}` },
                { l: "Fees", v: `$${trade.fees}` },
                { l: "Setup", v: trade.setup },
                { l: "Stop Loss", v: trade.stopLoss ? `$${trade.stopLoss}` : "—", c: "text-destructive" },
                { l: "Take Profit", v: trade.takeProfit ? `$${trade.takeProfit}` : "—", c: "text-success" },
              ].map((d) => (
                <div key={d.l}>
                  <p className="text-muted-foreground">{d.l}</p>
                  <p className={`font-mono ${(d as { c?: string }).c || ""}`}>{d.v}</p>
                </div>
              ))}
            </div>

            {/* Rating */}
            <div className="mt-3">
              <p className="text-xs text-muted-foreground mb-1.5">Rating</p>
              <StarRatingInput value={rating} onChange={setRating} disabled={!editing} />
            </div>

            {/* Emotion */}
            <div className="mt-3 flex items-center gap-2">
              <p className="text-xs text-muted-foreground">Emotion</p>
              <Badge variant="outline" className="border-primary/30 text-primary text-xs">{trade.emotion}</Badge>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* ── Section 2: Tags (setup/mistake) ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <TrendingUp className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tags & Mistakes</p>
            </div>

            {/* Tags */}
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">Tags</p>
              <div className="flex flex-wrap gap-1 mb-2">
                {tags.map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs gap-1 pr-1">
                    {t}
                    {editing && (
                      <button onClick={() => removeTag(t)} className="hover:text-destructive">
                        <X className="h-2.5 w-2.5" />
                      </button>
                    )}
                  </Badge>
                ))}
                {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags</span>}
              </div>
              {editing && (
                <div className="flex gap-1">
                  <Input value={newTag} onChange={(e) => setNewTag(e.target.value)} placeholder="Add tag..." className="h-7 text-xs bg-background" onKeyDown={(e) => e.key === "Enter" && addTag()} />
                  <Button size="sm" variant="outline" className="h-7 w-7 p-0" onClick={addTag}><Plus className="h-3 w-3" /></Button>
                </div>
              )}
            </div>

            {/* Mistakes checklist */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Mistakes Checklist</p>
              <div className="space-y-1.5 rounded-lg bg-muted/20 p-3">
                {cats.mistakes.filter((m) => m !== "None").map((m) => (
                  <label key={m} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={!!mistakes[m]}
                      onCheckedChange={(v) => editing && setMistakes({ ...mistakes, [m]: !!v })}
                      disabled={!editing}
                      className="h-3.5 w-3.5"
                    />
                    <span className={mistakes[m] ? "text-destructive" : "text-muted-foreground"}>{m}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <Separator className="bg-border/30" />

          {/* ── Section 3: Notes (autosave) ── */}
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Clock className="h-3.5 w-3.5 text-primary" />
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Notes</p>
              {editing && <span className="text-[10px] text-muted-foreground ml-auto">autosaves</span>}
            </div>
            {editing ? (
              <Textarea
                value={notes}
                onChange={(e) => handleNotesChange(e.target.value)}
                placeholder="What happened in this trade..."
                className="text-xs bg-background min-h-[100px] resize-none"
              />
            ) : (
              <div className="rounded-lg bg-muted/20 p-3 min-h-[60px]">
                <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                  {notes || "No notes yet."}
                </p>
              </div>
            )}
          </div>

          {/* Save / Cancel */}
          {editing && (
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 h-9 text-xs" onClick={cancel}>Cancel</Button>
              <Button className="flex-1 h-9 text-xs" onClick={save}>Save Changes</Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
