import { useState, useMemo, useRef, useEffect } from "react";
import { useFilters, useTrades } from "@/store/trades";
import { loadRules, saveRules } from "@/lib/rules-store";
import { computeScorecard, generateCoachingInsights, CoachingInsight } from "@/lib/scorecard-logic";
import { TradingRule, RuleCategory } from "@/lib/types";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Shield, Plus, Pencil, Trash2, Check, X, AlertCircle,
  TrendingUp, TrendingDown, Target, Award, AlertTriangle,
  Lightbulb, ChevronRight, ToggleLeft, ToggleRight,
} from "lucide-react";

const CATEGORIES: RuleCategory[] = ["Risk", "Execution", "Psychology", "Process"];

const catColors: Record<RuleCategory, string> = {
  Risk: "text-destructive bg-destructive/10",
  Execution: "text-primary bg-primary/10",
  Psychology: "text-[hsl(var(--warning))] bg-[hsl(var(--warning))]/10",
  Process: "text-[hsl(var(--accent))] bg-[hsl(var(--accent))]/10",
};

const insightStyle: Record<CoachingInsight["type"], string> = {
  positive: "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5",
  warning: "border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/5",
  danger: "border-destructive/30 bg-destructive/5",
};

const insightIcon: Record<CoachingInsight["type"], typeof TrendingUp> = {
  positive: TrendingUp,
  warning: AlertTriangle,
  danger: AlertCircle,
};

const impactBadge: Record<string, string> = {
  high: "bg-destructive/20 text-destructive",
  medium: "bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]",
  low: "bg-muted text-muted-foreground",
};

export default function Scorecard() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);
  const navigate = useNavigate();

  const [rules, setRulesState] = useState<TradingRule[]>(loadRules);
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editingRule, setEditingRule] = useState<TradingRule | null>(null);

  const persistRules = (next: TradingRule[]) => {
    setRulesState(next);
    saveRules(next);
  };

  const metrics = useMemo(() => computeScorecard(trades, rules), [trades, rules]);
  const insights = useMemo(() => generateCoachingInsights(metrics, trades), [metrics, trades]);

  const tradesWithAdherence = useMemo(() => trades.filter(t => t.ruleAdherence && t.ruleAdherence.length > 0).length, [trades]);

  const adherenceColor = metrics.adherenceRate >= 80 ? "text-[hsl(var(--success))]" : metrics.adherenceRate >= 60 ? "text-[hsl(var(--warning))]" : "text-destructive";
  const adherenceBarColor = metrics.adherenceRate >= 80 ? "[&>div]:bg-[hsl(var(--success))]" : metrics.adherenceRate >= 60 ? "[&>div]:bg-[hsl(var(--warning))]" : "[&>div]:bg-destructive";

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-medium">Failed to load trades.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scorecard</h1>
        <p className="text-sm text-muted-foreground">Track rule adherence and measure trading discipline</p>
      </div>

      {/* ── Coaching Insights ── */}
      {!isLoading && insights.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {insights.map((ins, i) => {
            const Icon = insightIcon[ins.type];
            return (
              <div key={i} className={`glass-card p-4 border ${insightStyle[ins.type]}`}>
                <div className="flex items-start gap-3">
                  <Icon className="h-5 w-5 shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium leading-snug">{ins.message}</p>
                    <span className={`inline-block mt-2 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${impactBadge[ins.impact]}`}>
                      {ins.impact} impact
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── KPI Cards ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-4 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-7 w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Rule Adherence</span>
              <Shield className={`h-4 w-4 ${adherenceColor}`} />
            </div>
            <p className={`mt-1 font-mono text-2xl font-bold ${adherenceColor}`}>
              {tradesWithAdherence > 0 ? `${metrics.adherenceRate}%` : "—"}
            </p>
            {tradesWithAdherence > 0 && (
              <Progress value={metrics.adherenceRate} className={`mt-2 h-1.5 ${adherenceBarColor}`} />
            )}
            <p className="text-[10px] text-muted-foreground mt-1">{tradesWithAdherence} trades reviewed</p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Avg PnL (Rules Followed)</span>
              <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />
            </div>
            <p className={`mt-1 font-mono text-2xl font-bold ${metrics.avgPnlFollowed >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
              ${metrics.avgPnlFollowed.toLocaleString()}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Avg PnL (Rules Broken)</span>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </div>
            <p className={`mt-1 font-mono text-2xl font-bold ${metrics.avgPnlBroken >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
              ${metrics.avgPnlBroken.toLocaleString()}
            </p>
          </div>

          <div className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Mistake Frequency</span>
              <AlertTriangle className={`h-4 w-4 ${metrics.mistakeFrequency > 40 ? "text-destructive" : "text-[hsl(var(--warning))]"}`} />
            </div>
            <p className={`mt-1 font-mono text-2xl font-bold ${metrics.mistakeFrequency > 40 ? "text-destructive" : "text-[hsl(var(--warning))]"}`}>
              {metrics.mistakeFrequency}%
            </p>
          </div>
        </div>
      )}

      {/* ── Most Broken / Best Followed ── */}
      {!isLoading && tradesWithAdherence > 0 && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Most Broken */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" /> Most Broken Rules
            </h3>
            {metrics.mostBrokenRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No broken rules — excellent! 🎉</p>
            ) : (
              <div className="space-y-2">
                {metrics.mostBrokenRules.slice(0, 5).map(({ rule, brokenCount, totalCost }) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg bg-destructive/5 p-3 cursor-pointer hover:bg-destructive/10 transition-colors group"
                    onClick={() => navigate("/trades")}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{rule.title}</p>
                      <p className="text-xs text-muted-foreground">{brokenCount} times broken</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-mono text-sm font-bold ${totalCost < 0 ? "text-destructive" : "text-[hsl(var(--success))]"}`}>
                        ${totalCost.toLocaleString()}
                      </span>
                      <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Best Followed */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
              <Award className="h-4 w-4 text-[hsl(var(--success))]" /> Best Followed Rules
            </h3>
            {metrics.bestFollowedRules.length === 0 ? (
              <p className="text-sm text-muted-foreground">No adherence data yet. Review trades to track rules.</p>
            ) : (
              <div className="space-y-2">
                {metrics.bestFollowedRules.slice(0, 5).map(({ rule, followedCount }) => (
                  <div
                    key={rule.id}
                    className="flex items-center justify-between rounded-lg bg-[hsl(var(--success))]/5 p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{rule.title}</p>
                      <p className="text-xs text-muted-foreground">{followedCount} times followed</p>
                    </div>
                    <Check className="h-4 w-4 text-[hsl(var(--success))]" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Empty State ── */}
      {!isLoading && tradesWithAdherence === 0 && (
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <Target className="h-10 w-10" />
          <p className="text-sm font-medium">No rule adherence data yet</p>
          <p className="text-xs">Open any trade review and use the "Rules" tab to mark rule adherence</p>
        </div>
      )}

      {/* ── Rules Management ── */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" /> Trading Rules
          </h3>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1"
            onClick={() => { setEditingRule(null); setShowRuleForm(true); }}
          >
            <Plus className="h-3 w-3" /> Add Rule
          </Button>
        </div>

        {showRuleForm && (
          <RuleForm
            initial={editingRule}
            onSave={(rule) => {
              if (editingRule) {
                persistRules(rules.map(r => r.id === rule.id ? rule : r));
              } else {
                persistRules([...rules, rule]);
              }
              setShowRuleForm(false);
              setEditingRule(null);
            }}
            onCancel={() => { setShowRuleForm(false); setEditingRule(null); }}
          />
        )}

        <div className="space-y-2">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-center gap-3 rounded-lg border border-border/30 bg-muted/10 p-3 group">
              <button
                onClick={() => persistRules(rules.map(r => r.id === rule.id ? { ...r, active: !r.active } : r))}
                className="shrink-0"
              >
                {rule.active ? (
                  <ToggleRight className="h-5 w-5 text-[hsl(var(--success))]" />
                ) : (
                  <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-medium ${!rule.active ? "text-muted-foreground line-through" : ""}`}>{rule.title}</span>
                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${catColors[rule.category]}`}>
                    {rule.category}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {"●".repeat(rule.severityWeight)}{"○".repeat(3 - rule.severityWeight)}
                  </span>
                </div>
                {rule.description && (
                  <p className="text-xs text-muted-foreground truncate">{rule.description}</p>
                )}
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => { setEditingRule(rule); setShowRuleForm(true); }}
                >
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 w-7 p-0"
                  onClick={() => persistRules(rules.filter(r => r.id !== rule.id))}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RuleForm({ initial, onSave, onCancel }: {
  initial: TradingRule | null;
  onSave: (rule: TradingRule) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || "");
  const [category, setCategory] = useState<RuleCategory>(initial?.category || "Risk");
  const [description, setDescription] = useState(initial?.description || "");
  const [severity, setSeverity] = useState(initial?.severityWeight || 2);

  const save = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id || `rule-${Date.now()}`,
      title: title.trim(),
      category,
      description: description.trim(),
      active: initial?.active ?? true,
      severityWeight: severity,
    });
  };

  return (
    <div className="rounded-lg border border-border/30 bg-muted/20 p-4 mb-4 space-y-3">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Rule title..."
        className="h-8 text-sm bg-background"
        autoFocus
      />
      <div className="flex items-center gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              category === c ? catColors[c] : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <Textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description (optional)..."
        className="text-xs bg-background min-h-[60px] resize-none"
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Severity:</span>
        {[1, 2, 3].map((w) => (
          <button
            key={w}
            onClick={() => setSeverity(w)}
            className={`h-6 w-6 rounded-full text-xs font-bold transition-colors ${
              severity >= w ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground"
            }`}
          >
            {w}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <Button size="sm" className="h-8 text-xs" onClick={save}>
          <Check className="h-3 w-3 mr-1" /> {initial ? "Update" : "Add"} Rule
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
