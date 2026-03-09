import { RuleAdherence, TradingRule } from "@/lib/types";
import { loadRules } from "@/lib/rules-store";
import { Check, X, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface Props {
  adherence: RuleAdherence[];
  editing: boolean;
  onChange: (adherence: RuleAdherence[]) => void;
}

const categoryColors: Record<string, string> = {
  Risk: "text-destructive",
  Execution: "text-primary",
  Psychology: "text-[hsl(var(--warning))]",
  Process: "text-[hsl(var(--accent))]",
};

export default function RulesTab({ adherence, editing, onChange }: Props) {
  const rules = loadRules().filter(r => r.active);
  const [noteOpen, setNoteOpen] = useState<string | null>(null);

  const getAdherence = (ruleId: string): RuleAdherence | undefined =>
    adherence.find(a => a.ruleId === ruleId);

  const setFollowed = (ruleId: string, followed: boolean) => {
    const existing = adherence.filter(a => a.ruleId !== ruleId);
    existing.push({ ruleId, followed, note: getAdherence(ruleId)?.note });
    onChange(existing);
  };

  const setNote = (ruleId: string, note: string) => {
    const existing = adherence.filter(a => a.ruleId !== ruleId);
    const prev = getAdherence(ruleId);
    existing.push({ ruleId, followed: prev?.followed ?? true, note });
    onChange(existing);
  };

  if (rules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <p className="text-sm">No trading rules defined yet.</p>
        <p className="text-xs mt-1">Go to the Scorecard page to create rules.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-4">
        Mark whether each rule was followed or broken for this trade.
      </p>
      {rules.map((rule) => {
        const a = getAdherence(rule.id);
        const isFollowed = a?.followed;
        const isBroken = a ? !a.followed : false;
        const isUnchecked = !a;

        return (
          <div key={rule.id} className="rounded-lg border border-border/30 bg-muted/10 p-3">
            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                isFollowed ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" :
                isBroken ? "bg-destructive/15 text-destructive" :
                "bg-muted/30 text-muted-foreground"
              }`}>
                {isFollowed ? <Check className="h-4 w-4" /> :
                 isBroken ? <X className="h-4 w-4" /> :
                 <span className="text-xs">—</span>}
              </div>

              {/* Rule info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{rule.title}</span>
                  <span className={`text-[10px] font-medium ${categoryColors[rule.category] || "text-muted-foreground"}`}>
                    {rule.category}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">{rule.description}</p>
              </div>

              {/* Actions */}
              {editing && (
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    variant={isFollowed ? "default" : "outline"}
                    size="sm"
                    className={`h-7 text-[10px] px-2 gap-1 ${isFollowed ? "bg-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/90 text-[hsl(var(--success-foreground))]" : ""}`}
                    onClick={() => setFollowed(rule.id, true)}
                  >
                    <Check className="h-3 w-3" /> Followed
                  </Button>
                  <Button
                    variant={isBroken ? "default" : "outline"}
                    size="sm"
                    className={`h-7 text-[10px] px-2 gap-1 ${isBroken ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground" : ""}`}
                    onClick={() => setFollowed(rule.id, false)}
                  >
                    <X className="h-3 w-3" /> Broken
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 w-7 p-0"
                    onClick={() => setNoteOpen(noteOpen === rule.id ? null : rule.id)}
                  >
                    <MessageSquare className="h-3 w-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Note */}
            {(noteOpen === rule.id || (a?.note && !editing)) && (
              <div className="mt-2 pl-11">
                {editing ? (
                  <Textarea
                    value={a?.note || ""}
                    onChange={(e) => setNote(rule.id, e.target.value)}
                    placeholder="Why was this rule broken? What happened?"
                    className="text-xs bg-background min-h-[60px] resize-none"
                  />
                ) : a?.note ? (
                  <p className="text-xs text-muted-foreground italic">{a.note}</p>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
