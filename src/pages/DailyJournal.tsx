import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { format, addDays, subDays } from "date-fns";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Activity, Target, Star, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trade } from "@/lib/types";
import { loadTrades } from "@/lib/trade-store";
import { loadJournal, saveJournal } from "@/lib/journal-store";
import type { DailyJournal as DailyJournalType } from "@/lib/types";
import TradeReviewModal from "@/components/trade-log/TradeReviewModal";

const GRADES = ["A", "B", "C", "D", "F"] as const;
const EMOTION_TAGS = ["Calm", "FOMO", "Revenge", "Overconfident", "Disciplined"] as const;

const GRADE_COLORS: Record<string, string> = {
  A: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))] border-[hsl(var(--success))]/30",
  B: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]/80 border-[hsl(var(--success))]/20",
  C: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  D: "bg-destructive/10 text-destructive/80 border-destructive/20",
  F: "bg-destructive/15 text-destructive border-destructive/30",
};

interface ReflectionField {
  key: keyof Pick<DailyJournalType, "preMarketPlan" | "marketConditions" | "whatDidWell" | "mistakesMade" | "lessonLearned" | "tomorrowFocus">;
  label: string;
  placeholder: string;
}

const REFLECTION_FIELDS: ReflectionField[] = [
  { key: "preMarketPlan", label: "Pre-Market Plan", placeholder: "What was your plan going into the session?" },
  { key: "marketConditions", label: "Market Conditions", placeholder: "How were market conditions today? Trending, ranging, volatile?" },
  { key: "whatDidWell", label: "What I Did Well", placeholder: "What trades or decisions went well today?" },
  { key: "mistakesMade", label: "Mistakes Made", placeholder: "What mistakes did you make? What caused them?" },
  { key: "lessonLearned", label: "Lesson Learned", placeholder: "Key takeaway from today's session" },
  { key: "tomorrowFocus", label: "Tomorrow's Focus", placeholder: "What will you focus on in the next session?" },
];

function getEmptyJournal(date: string): DailyJournalType {
  return {
    date,
    preMarketPlan: "",
    marketConditions: "",
    whatDidWell: "",
    mistakesMade: "",
    lessonLearned: "",
    tomorrowFocus: "",
    grade: undefined,
    emotionTags: [],
  };
}

export default function DailyJournal() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  const dateStr = format(selectedDate, "yyyy-MM-dd");

  const [journal, setJournal] = useState<DailyJournalType>(() => {
    return loadJournal(dateStr) ?? getEmptyJournal(dateStr);
  });

  // Reload journal when date changes
  useEffect(() => {
    setJournal(loadJournal(dateStr) ?? getEmptyJournal(dateStr));
  }, [dateStr]);

  // Autosave with 1s debounce
  const saveTimer = useRef<ReturnType<typeof setTimeout>>();
  const autoSave = useCallback(
    (updated: DailyJournalType) => {
      setJournal(updated);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => saveJournal(updated), 1000);
    },
    []
  );

  // Get trades for selected date
  const allTrades = useMemo(() => loadTrades(), []);
  const dayTrades = useMemo(
    () => allTrades.filter((t) => t.date === dateStr),
    [allTrades, dateStr]
  );

  // Metrics
  const metrics = useMemo(() => {
    if (dayTrades.length === 0) return null;
    const totalPnl = dayTrades.reduce((s, t) => s + t.pnl, 0);
    const wins = dayTrades.filter((t) => t.pnl > 0).length;
    const winRate = Math.round((wins / dayTrades.length) * 100);
    const best = Math.max(...dayTrades.map((t) => t.pnl));
    const worst = Math.min(...dayTrades.map((t) => t.pnl));
    return { totalPnl, totalTrades: dayTrades.length, winRate, best, worst };
  }, [dayTrades]);

  const updateField = (key: string, value: string) => {
    autoSave({ ...journal, [key]: value });
  };

  const toggleGrade = (g: string) => {
    autoSave({ ...journal, grade: journal.grade === g ? undefined : g });
  };

  const toggleEmotion = (tag: string) => {
    const tags = journal.emotionTags ?? [];
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    autoSave({ ...journal, emotionTags: next });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Daily Journal</h1>
          <p className="text-sm text-muted-foreground">Review and reflect on your trading sessions</p>
        </div>
      </div>

      {/* Date Navigator */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="glass-card px-5 py-2.5 text-center min-w-[200px]">
          <p className="text-lg font-semibold">{format(selectedDate, "EEEE")}</p>
          <p className="text-sm text-muted-foreground">{format(selectedDate, "MMMM d, yyyy")}</p>
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setSelectedDate(new Date())}>
          Today
        </Button>
      </div>

      {/* Metrics */}
      {metrics ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {[
            { label: "Total PnL", value: `$${metrics.totalPnl.toLocaleString()}`, icon: metrics.totalPnl >= 0 ? TrendingUp : TrendingDown, positive: metrics.totalPnl >= 0 },
            { label: "Trades", value: metrics.totalTrades, icon: Activity, positive: true },
            { label: "Win Rate", value: `${metrics.winRate}%`, icon: Target, positive: metrics.winRate >= 50 },
            { label: "Best", value: `$${metrics.best.toLocaleString()}`, icon: TrendingUp, positive: true },
            { label: "Worst", value: `$${metrics.worst.toLocaleString()}`, icon: TrendingDown, positive: false },
          ].map((m) => (
            <div key={m.label} className="glass-card p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{m.label}</span>
                <m.icon className={`h-3.5 w-3.5 ${m.positive ? "text-[hsl(var(--success))]" : "text-destructive"}`} />
              </div>
              <p className={`mt-1 font-mono text-lg font-bold ${m.positive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                {m.value}
              </p>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card flex items-center justify-center gap-2 py-8 text-muted-foreground">
          <Activity className="h-5 w-5" />
          <p className="text-sm">No trades on this day</p>
        </div>
      )}

      {/* Trades Table */}
      {dayTrades.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-3 border-b border-border/50">
            <h3 className="text-sm font-semibold">Trades of the Day</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/30 text-left text-xs text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Symbol</th>
                  <th className="px-4 py-2 font-medium">Side</th>
                  <th className="px-4 py-2 font-medium text-right">Entry</th>
                  <th className="px-4 py-2 font-medium text-right">P&L</th>
                  <th className="px-4 py-2 font-medium">Setup</th>
                  <th className="px-4 py-2 font-medium">Mistakes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {dayTrades.map((t) => (
                  <tr
                    key={t.id}
                    className="hover:bg-card/60 cursor-pointer transition-colors"
                    onClick={() => setSelectedTrade(t)}
                  >
                    <td className="px-4 py-2.5 font-medium">{t.instrument}</td>
                    <td className="px-4 py-2.5">
                      <Badge variant="outline" className={t.side === "BUY" ? "border-[hsl(var(--success))]/30 text-[hsl(var(--success))]" : "border-destructive/30 text-destructive"}>
                        {t.side}
                      </Badge>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-xs">${t.price.toLocaleString()}</td>
                    <td className={`px-4 py-2.5 text-right font-mono text-xs font-semibold ${t.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                      {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
                    </td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.setup ?? "—"}</td>
                    <td className="px-4 py-2.5 text-xs text-muted-foreground">{t.mistake && t.mistake !== "None" ? t.mistake : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Grade + Emotions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3">Session Grade</h3>
          <div className="flex gap-2">
            {GRADES.map((g) => (
              <button
                key={g}
                onClick={() => toggleGrade(g)}
                className={`h-11 w-11 rounded-lg border text-sm font-bold transition-all ${
                  journal.grade === g
                    ? GRADE_COLORS[g]
                    : "border-border/50 text-muted-foreground hover:border-border"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-3">Session Emotions</h3>
          <div className="flex flex-wrap gap-2">
            {EMOTION_TAGS.map((tag) => {
              const active = journal.emotionTags?.includes(tag);
              return (
                <button
                  key={tag}
                  onClick={() => toggleEmotion(tag)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-all ${
                    active
                      ? "bg-primary/15 text-primary border-primary/30"
                      : "border-border/50 text-muted-foreground hover:border-border"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reflection Fields */}
      <div className="glass-card p-5 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Daily Reflection</h3>
        </div>
        <div className="grid gap-5 lg:grid-cols-2">
          {REFLECTION_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground">{field.label}</label>
              <Textarea
                value={(journal[field.key] as string) ?? ""}
                onChange={(e) => updateField(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="min-h-[100px] bg-background/50 border-border/50 text-sm resize-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Trade Review Modal */}
      {selectedTrade && (
        <TradeReviewModal
          trade={selectedTrade}
          onClose={() => setSelectedTrade(null)}
          onSave={() => {}}
        />
      )}
    </div>
  );
}
