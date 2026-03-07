import { useState, useRef, useCallback, useEffect } from "react";
import { TradeJournal, ReviewTemplate } from "@/lib/types";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileText, Lightbulb, TrendingUp, RefreshCw, CheckCircle2, XCircle, BookOpen, ChevronDown } from "lucide-react";

const REVIEW_TEMPLATES: ReviewTemplate[] = [
  {
    id: "default",
    name: "Default Review",
    journal: {
      preTradePlan: "What was my plan before entering?",
      whyEntered: "What signal or setup triggered my entry?",
      whyExited: "What caused me to exit? Was it planned or reactive?",
      whatWentWell: "What did I execute correctly?",
      whatWentWrong: "Where did I deviate from my plan?",
      lessonLearned: "What will I do differently next time?",
    },
  },
  {
    id: "momentum",
    name: "Momentum Setup Review",
    journal: {
      preTradePlan: "Pre-market scanner hit. Volume > 2x avg. Float < 20M. Waiting for first pullback to VWAP.",
      whyEntered: "Strong momentum push with volume confirmation. Entry on pullback to support.",
      whyExited: "",
      whatWentWell: "",
      whatWentWrong: "",
      lessonLearned: "",
    },
    suggestedMistakes: ["Chased", "Oversized", "Late Exit"],
  },
  {
    id: "reversal",
    name: "Reversal Setup Review",
    journal: {
      preTradePlan: "Stock overextended from mean. RSI > 80. Watching for reversal candle at resistance.",
      whyEntered: "Double top / bearish engulfing pattern at key resistance level.",
      whyExited: "",
      whatWentWell: "",
      whatWentWrong: "",
      lessonLearned: "",
    },
    suggestedMistakes: ["Early Entry", "No Stop Loss", "Ignored Plan"],
  },
];

const FIELDS: { key: keyof TradeJournal; label: string; icon: typeof FileText; placeholder: string }[] = [
  { key: "preTradePlan", label: "Pre-Trade Plan", icon: FileText, placeholder: "What was my plan before entering this trade?" },
  { key: "whyEntered", label: "Why I Entered", icon: TrendingUp, placeholder: "What signal or setup triggered my entry?" },
  { key: "whyExited", label: "Why I Exited", icon: RefreshCw, placeholder: "What caused me to exit? Was it planned or reactive?" },
  { key: "whatWentWell", label: "What Went Well", icon: CheckCircle2, placeholder: "What did I execute correctly?" },
  { key: "whatWentWrong", label: "What I Did Wrong", icon: XCircle, placeholder: "Where did I deviate from my plan?" },
  { key: "lessonLearned", label: "Lesson Learned", icon: Lightbulb, placeholder: "What will I do differently next time?" },
];

interface Props {
  journal: TradeJournal;
  editing: boolean;
  onChange: (journal: TradeJournal) => void;
}

export default function NotesTab({ journal, editing, onChange }: Props) {
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const handleFieldChange = useCallback(
    (key: keyof TradeJournal, value: string) => {
      const updated = { ...journal, [key]: value };
      // Optimistic local update
      onChange(updated);
    },
    [journal, onChange]
  );

  const applyTemplate = (template: ReviewTemplate) => {
    const merged: TradeJournal = { ...journal };
    for (const [k, v] of Object.entries(template.journal)) {
      const key = k as keyof TradeJournal;
      // Only overwrite empty fields
      if (!merged[key]) merged[key] = v;
    }
    onChange(merged);
  };

  const filledCount = FIELDS.filter((f) => journal[f.key]?.trim()).length;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Trade Journal</h3>
          <span className="text-[10px] text-muted-foreground bg-muted/30 rounded-full px-2 py-0.5">
            {filledCount}/{FIELDS.length} completed
          </span>
        </div>
        {editing && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                <FileText className="h-3 w-3" />
                Use Template
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              {REVIEW_TEMPLATES.map((t) => (
                <DropdownMenuItem
                  key={t.id}
                  className="text-xs"
                  onClick={() => applyTemplate(t)}
                >
                  {t.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-muted/30 overflow-hidden">
        <div
          className="h-full bg-primary/60 rounded-full transition-all duration-500"
          style={{ width: `${(filledCount / FIELDS.length) * 100}%` }}
        />
      </div>

      {/* Fields */}
      <div className="space-y-4">
        {FIELDS.map((field) => (
          <div key={field.key} className="space-y-1.5">
            <div className="flex items-center gap-1.5">
              <field.icon className={`h-3.5 w-3.5 ${
                journal[field.key]?.trim() ? "text-primary" : "text-muted-foreground/50"
              }`} />
              <label className="text-xs font-medium text-muted-foreground">
                {field.label}
              </label>
            </div>
            {editing ? (
              <Textarea
                value={journal[field.key] || ""}
                onChange={(e) => handleFieldChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="text-xs bg-background/50 min-h-[72px] resize-none border-border/30 focus:border-primary/40"
              />
            ) : (
              <div className={`rounded-lg p-3 min-h-[48px] ${
                journal[field.key]?.trim()
                  ? "bg-muted/15 border border-border/20"
                  : "bg-muted/5 border border-dashed border-border/15"
              }`}>
                <p className={`text-xs whitespace-pre-wrap ${
                  journal[field.key]?.trim() ? "text-foreground" : "text-muted-foreground/40 italic"
                }`}>
                  {journal[field.key] || "Not filled in yet"}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export { REVIEW_TEMPLATES };
