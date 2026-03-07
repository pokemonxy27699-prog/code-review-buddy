import { MistakeReview } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ShieldAlert, AlertTriangle, Ban, CheckCircle2 } from "lucide-react";

interface Props {
  review: MistakeReview;
  mistakeOptions: string[];
  editing: boolean;
  onChange: (review: MistakeReview) => void;
}

const SEVERITY_OPTIONS = [
  { value: "low" as const, label: "Low", color: "bg-warning/15 text-warning border-warning/30" },
  { value: "medium" as const, label: "Medium", color: "bg-accent/15 text-accent-foreground border-accent/30" },
  { value: "high" as const, label: "High", color: "bg-destructive/15 text-destructive border-destructive/30" },
];

export default function MistakesTab({ review, mistakeOptions, editing, onChange }: Props) {
  const activeMistakes = review.mistakes || [];
  const totalMistakes = activeMistakes.length;
  const isAvoidable = review.avoidable ?? false;

  const toggleMistake = (m: string) => {
    const updated = activeMistakes.includes(m)
      ? activeMistakes.filter((x) => x !== m)
      : [...activeMistakes, m];
    onChange({ ...review, mistakes: updated });
  };

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl bg-muted/15 border border-border/20 p-4 text-center">
          <ShieldAlert className="h-5 w-5 mx-auto mb-1.5 text-destructive/60" />
          <p className="font-mono text-2xl font-bold text-foreground">{totalMistakes}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Mistakes</p>
        </div>
        <div className="rounded-xl bg-muted/15 border border-border/20 p-4 text-center">
          <Ban className="h-5 w-5 mx-auto mb-1.5 text-warning/60" />
          <p className="font-mono text-2xl font-bold text-foreground">{isAvoidable ? "Yes" : "No"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Avoidable</p>
        </div>
        <div className="rounded-xl bg-muted/15 border border-border/20 p-4 text-center">
          <AlertTriangle className="h-5 w-5 mx-auto mb-1.5 text-accent/60" />
          <p className="font-mono text-2xl font-bold text-foreground capitalize">{review.severity || "—"}</p>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Severity</p>
        </div>
      </div>

      {/* Mistake checklist */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <ShieldAlert className="h-3.5 w-3.5 text-destructive/70" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Mistake Checklist
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {mistakeOptions
            .filter((m) => m !== "None")
            .map((m) => {
              const checked = activeMistakes.includes(m);
              return (
                <label
                  key={m}
                  className={`flex items-center gap-2.5 rounded-lg border p-3 cursor-pointer transition-colors ${
                    checked
                      ? "bg-destructive/5 border-destructive/30"
                      : "bg-muted/5 border-border/20 hover:bg-muted/15"
                  } ${!editing ? "pointer-events-none" : ""}`}
                >
                  <Checkbox
                    checked={checked}
                    onCheckedChange={() => editing && toggleMistake(m)}
                    disabled={!editing}
                    className="h-4 w-4"
                  />
                  <span className={`text-xs font-medium ${checked ? "text-destructive" : "text-muted-foreground"}`}>
                    {m}
                  </span>
                </label>
              );
            })}
        </div>
      </div>

      {/* Severity */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Severity</p>
        <div className="flex gap-2">
          {SEVERITY_OPTIONS.map((s) => (
            <button
              key={s.value}
              onClick={() => editing && onChange({ ...review, severity: s.value })}
              disabled={!editing}
              className={`rounded-lg border px-4 py-2 text-xs font-medium transition-all ${
                review.severity === s.value
                  ? s.color
                  : "bg-muted/5 border-border/20 text-muted-foreground hover:bg-muted/15"
              } ${!editing ? "pointer-events-none" : ""}`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Avoidable toggle */}
      <div className="flex items-center justify-between rounded-lg bg-muted/10 border border-border/20 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          <div>
            <p className="text-xs font-medium">Was this avoidable?</p>
            <p className="text-[10px] text-muted-foreground">Could you have prevented this mistake?</p>
          </div>
        </div>
        <Switch
          checked={isAvoidable}
          onCheckedChange={(v) => editing && onChange({ ...review, avoidable: v })}
          disabled={!editing}
        />
      </div>

      {/* Reflection */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Reflection</p>
        {editing ? (
          <Textarea
            value={review.reflection || ""}
            onChange={(e) => onChange({ ...review, reflection: e.target.value })}
            placeholder="What would I do differently to avoid this mistake?"
            className="text-xs bg-background/50 min-h-[80px] resize-none border-border/30"
          />
        ) : (
          <div className={`rounded-lg p-3 min-h-[48px] ${
            review.reflection?.trim()
              ? "bg-muted/15 border border-border/20"
              : "bg-muted/5 border border-dashed border-border/15"
          }`}>
            <p className={`text-xs whitespace-pre-wrap ${
              review.reflection?.trim() ? "text-foreground" : "text-muted-foreground/40 italic"
            }`}>
              {review.reflection || "No reflection yet"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
