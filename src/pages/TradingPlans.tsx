import { useState } from "react";
import { mockTradingPlans, TradingPlan } from "@/lib/mock-data";
import { CheckCircle2, Circle, Plus, BookOpen, ListChecks, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function TradingPlans() {
  const [plans] = useState<TradingPlan[]>(mockTradingPlans);
  const [expanded, setExpanded] = useState<string | null>(plans[0]?.id || null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trading Plans</h1>
          <p className="text-sm text-muted-foreground">Define your rules and pre-trade checklists</p>
        </div>
        <Button variant="outline" className="gap-2 border-primary/30 text-primary hover:bg-primary/10">
          <Plus className="h-4 w-4" />
          New Plan
        </Button>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => (
          <div key={plan.id} className="glass-card-hover overflow-hidden">
            {/* Header */}
            <button
              onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
              className="flex w-full items-center justify-between p-5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{plan.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    {plan.rules.length} rules • {plan.checklist.length} checklist items •
                    Updated {new Date(plan.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              {expanded === plan.id ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            {/* Expanded content */}
            {expanded === plan.id && (
              <div className="border-t border-border/40 p-5">
                <div className="grid gap-6 lg:grid-cols-2">
                  {/* Rules */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <ListChecks className="h-4 w-4 text-primary" />
                      <h4 className="text-sm font-semibold">Trading Rules</h4>
                    </div>
                    <ul className="space-y-2">
                      {plan.rules.map((rule, i) => (
                        <li key={i} className="flex items-start gap-2 rounded-lg bg-muted/20 p-3 text-sm">
                          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                            {i + 1}
                          </span>
                          {rule}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Checklist */}
                  <div>
                    <div className="mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))]" />
                      <h4 className="text-sm font-semibold">Pre-Trade Checklist</h4>
                    </div>
                    <ChecklistItems items={plan.checklist} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChecklistItems({ items }: { items: string[] }) {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  const toggle = (i: number) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  };

  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i}>
          <button
            onClick={() => toggle(i)}
            className={`flex w-full items-start gap-2 rounded-lg p-3 text-sm text-left transition-colors ${
              checked.has(i) ? "bg-[hsl(var(--success)/0.08)]" : "bg-muted/20 hover:bg-muted/30"
            }`}
          >
            {checked.has(i) ? (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[hsl(var(--success))]" />
            ) : (
              <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
            )}
            <span className={checked.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
