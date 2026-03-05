import { useState, useEffect, useRef, useCallback } from "react";
import { Trade } from "@/lib/types";
import { useTags } from "@/store/trades";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Star,
  X,
  Plus,
  Pencil,
  Eye,
  ImagePlus,
  Clock,
  Target,
  TrendingUp,
  ShieldAlert,
  Lightbulb,
  CheckCircle2,
} from "lucide-react";

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
  trade: Trade | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Trade>) => void;
}

export default function TradeReviewModal({ trade, onClose, onSave }: Props) {
  const { data: tagCats } = useTags();
  const cats = tagCats || { setups: [], emotions: [], mistakes: [] };

  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState("");
  const [lessons, setLessons] = useState("");
  const [wentWell, setWentWell] = useState("");
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [mistakes, setMistakes] = useState<Record<string, boolean>>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trade) {
      setNotes(trade.notes || "");
      setLessons("");
      setWentWell("");
      setRating(trade.rating || 0);
      setTags(trade.tags || []);
      const m: Record<string, boolean> = {};
      cats.mistakes.forEach((k) => (m[k] = trade.mistake === k));
      setMistakes(m);
      setEditing(false);
      setScreenshot(null);
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Keyboard: Ctrl+Enter saves
  useEffect(() => {
    if (!trade) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey) && editing) {
        e.preventDefault();
        save();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [trade, editing, notes, rating, tags, mistakes]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setScreenshot(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  if (!trade) return null;

  const duration = trade.holdTime
    ? `${Math.floor(trade.holdTime / 60)}h ${trade.holdTime % 60}m`
    : "—";
  const pnlPct =
    trade.price && trade.quantity
      ? ((trade.pnl / (trade.price * trade.quantity)) * 100).toFixed(2)
      : "0.00";

  return (
    <Dialog open={!!trade} onOpenChange={() => onClose()}>
      <DialogContent
        className="max-w-6xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden bg-card border-border/50"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/80">
          <DialogTitle className="flex items-center gap-3 text-base font-semibold">
            <span className="text-lg">{trade.instrument}</span>
            <span
              className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${
                trade.side === "BUY"
                  ? "bg-success/15 text-success"
                  : "bg-destructive/15 text-destructive"
              }`}
            >
              {trade.side === "BUY" ? "LONG" : "SHORT"}
            </span>
            <span
              className={`font-mono text-lg font-bold ${
                trade.pnl >= 0 ? "text-success" : "text-destructive"
              }`}
            >
              {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
            </span>
            <span
              className={`font-mono text-xs ${
                Number(pnlPct) >= 0 ? "text-success/70" : "text-destructive/70"
              }`}
            >
              ({Number(pnlPct) >= 0 ? "+" : ""}
              {pnlPct}%)
            </span>
          </DialogTitle>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-mono">
              {new Date(trade.date).toLocaleString()}
            </span>
            <Button
              variant={editing ? "default" : "outline"}
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => setEditing(!editing)}
            >
              {editing ? (
                <>
                  <Eye className="h-3 w-3" /> View
                </>
              ) : (
                <>
                  <Pencil className="h-3 w-3" /> Edit
                </>
              )}
            </Button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="overflow-y-auto max-h-[calc(90vh-60px)] p-6 space-y-6">
          {/* ── Trade Visual Area ── */}
          <div className="rounded-xl border border-border/30 bg-muted/10 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/20">
              <div className="flex items-center gap-1.5">
                <ImagePlus className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Trade Chart / Screenshot
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus className="h-3 w-3" />
                Upload Screenshot
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleScreenshotUpload}
              />
            </div>
            <div className="h-[280px] flex items-center justify-center">
              {screenshot ? (
                <img
                  src={screenshot}
                  alt="Trade screenshot"
                  className="h-full w-full object-contain p-2"
                />
              ) : (
                <div className="text-center space-y-2">
                  <div className="h-12 w-12 rounded-full bg-muted/30 flex items-center justify-center mx-auto">
                    <ImagePlus className="h-6 w-6 text-muted-foreground/40" />
                  </div>
                  <p className="text-xs text-muted-foreground/50">
                    Upload a trade screenshot or chart image
                  </p>
                  <p className="text-[10px] text-muted-foreground/30">
                    TradingView integration coming soon
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── Analysis Section: Two Column Grid ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── Left: Trade Metrics ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trade Metrics
                </h3>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  {
                    label: "R-Multiple",
                    value: `${trade.rMultiple}R`,
                    color:
                      (trade.rMultiple || 0) >= 0
                        ? "text-success"
                        : "text-destructive",
                  },
                  {
                    label: "Duration",
                    value: duration,
                    color: "text-foreground",
                  },
                  {
                    label: "Fees",
                    value: `$${trade.fees}`,
                    color: "text-muted-foreground",
                  },
                ].map((m) => (
                  <div key={m.label} className="rounded-lg bg-muted/20 p-3">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      {m.label}
                    </p>
                    <p className={`font-mono text-sm font-bold ${m.color}`}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detail grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-xs">
                {[
                  {
                    l: "Entry Price",
                    v: `$${trade.price.toLocaleString()}`,
                  },
                  {
                    l: "Position Size",
                    v: `${trade.quantity} units`,
                  },
                  {
                    l: "Stop Loss",
                    v: trade.stopLoss ? `$${trade.stopLoss}` : "—",
                    c: "text-destructive",
                  },
                  {
                    l: "Take Profit",
                    v: trade.takeProfit ? `$${trade.takeProfit}` : "—",
                    c: "text-success",
                  },
                  { l: "Setup", v: trade.setup || "—" },
                  { l: "Emotion", v: trade.emotion || "—" },
                ].map((d) => (
                  <div key={d.l} className="flex justify-between items-baseline py-1.5 border-b border-border/10">
                    <span className="text-muted-foreground">{d.l}</span>
                    <span
                      className={`font-mono font-medium ${
                        (d as { c?: string }).c || "text-foreground"
                      }`}
                    >
                      {d.v}
                    </span>
                  </div>
                ))}
              </div>

              {/* Rating */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">
                  Execution Rating
                </p>
                <StarRatingInput
                  value={rating}
                  onChange={setRating}
                  disabled={!editing}
                />
              </div>

              {/* Tags section */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Tags
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {trade.setup && (
                    <Badge
                      variant="outline"
                      className="text-xs border-primary/30 text-primary"
                    >
                      {trade.setup}
                    </Badge>
                  )}
                  {trade.emotion && (
                    <Badge
                      variant="outline"
                      className="text-xs border-accent/30 text-accent-foreground"
                    >
                      {trade.emotion}
                    </Badge>
                  )}
                  {trade.mistake && trade.mistake !== "None" && (
                    <Badge variant="destructive" className="text-xs">
                      {trade.mistake}
                    </Badge>
                  )}
                  {tags.map((t) => (
                    <Badge
                      key={t}
                      variant="secondary"
                      className="text-xs gap-1 pr-1"
                    >
                      {t}
                      {editing && (
                        <button
                          onClick={() => removeTag(t)}
                          className="hover:text-destructive"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      )}
                    </Badge>
                  ))}
                  {tags.length === 0 &&
                    !trade.setup &&
                    !trade.emotion &&
                    (!trade.mistake || trade.mistake === "None") && (
                      <span className="text-xs text-muted-foreground">
                        No tags
                      </span>
                    )}
                </div>
                {editing && (
                  <div className="flex gap-1">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add custom tag..."
                      className="h-7 text-xs bg-background"
                      onKeyDown={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 w-7 p-0"
                      onClick={addTag}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Right: Trade Review Journal ── */}
            <div className="space-y-5">
              <div className="flex items-center gap-1.5">
                <Pencil className="h-3.5 w-3.5 text-primary" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Trade Review
                </h3>
                {editing && (
                  <span className="text-[10px] text-muted-foreground ml-auto">
                    autosaves · Ctrl+Enter to save all
                  </span>
                )}
              </div>

              {/* Notes */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Clock className="h-3 w-3 text-muted-foreground" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Notes
                  </p>
                </div>
                {editing ? (
                  <Textarea
                    value={notes}
                    onChange={(e) => handleNotesChange(e.target.value)}
                    placeholder="What happened in this trade..."
                    className="text-xs bg-background min-h-[80px] resize-none"
                  />
                ) : (
                  <div className="rounded-lg bg-muted/20 p-3 min-h-[60px]">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {notes || "No notes yet."}
                    </p>
                  </div>
                )}
              </div>

              {/* Mistakes checklist */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <ShieldAlert className="h-3 w-3 text-destructive/70" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Mistakes Checklist
                  </p>
                </div>
                <div className="space-y-1.5 rounded-lg bg-muted/10 p-3">
                  {cats.mistakes
                    .filter((m) => m !== "None")
                    .map((m) => (
                      <label
                        key={m}
                        className="flex items-center gap-2 text-xs cursor-pointer"
                      >
                        <Checkbox
                          checked={!!mistakes[m]}
                          onCheckedChange={(v) =>
                            editing &&
                            setMistakes({ ...mistakes, [m]: !!v })
                          }
                          disabled={!editing}
                          className="h-3.5 w-3.5"
                        />
                        <span
                          className={
                            mistakes[m]
                              ? "text-destructive"
                              : "text-muted-foreground"
                          }
                        >
                          {m}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              {/* Lessons learned */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Lightbulb className="h-3 w-3 text-warning/70" />
                  <p className="text-xs text-muted-foreground font-medium">
                    Lessons Learned
                  </p>
                </div>
                {editing ? (
                  <Textarea
                    value={lessons}
                    onChange={(e) => setLessons(e.target.value)}
                    placeholder="What did you learn from this trade?"
                    className="text-xs bg-background min-h-[60px] resize-none"
                  />
                ) : (
                  <div className="rounded-lg bg-muted/20 p-3 min-h-[40px]">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {lessons || "No lessons recorded."}
                    </p>
                  </div>
                )}
              </div>

              {/* What went well */}
              <div>
                <div className="flex items-center gap-1.5 mb-1.5">
                  <CheckCircle2 className="h-3 w-3 text-success/70" />
                  <p className="text-xs text-muted-foreground font-medium">
                    What Went Well
                  </p>
                </div>
                {editing ? (
                  <Textarea
                    value={wentWell}
                    onChange={(e) => setWentWell(e.target.value)}
                    placeholder="What did you do right?"
                    className="text-xs bg-background min-h-[60px] resize-none"
                  />
                ) : (
                  <div className="rounded-lg bg-muted/20 p-3 min-h-[40px]">
                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {wentWell || "Nothing recorded."}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Save / Cancel bar ── */}
          {editing && (
            <>
              <Separator className="bg-border/20" />
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={cancel}
                >
                  Cancel
                </Button>
                <Button size="sm" className="h-8 text-xs" onClick={save}>
                  Save Changes
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
