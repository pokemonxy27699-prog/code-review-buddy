import { useMemo } from "react";
import { loadJournals } from "@/lib/journal-store";
import { BookOpen, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const GRADE_COLORS: Record<string, string> = {
  A: "bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]",
  B: "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]/80",
  C: "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]",
  D: "bg-destructive/10 text-destructive/80",
  F: "bg-destructive/15 text-destructive",
};

export default function RecentJournalWidget() {
  const navigate = useNavigate();
  const entries = useMemo(() => {
    return loadJournals()
      .filter((j) => j.grade)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5);
  }, []);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" />
          <h3 className="text-sm font-semibold">Recent Journal Entries</h3>
        </div>
        <button onClick={() => navigate("/journal")} className="text-xs text-primary hover:underline flex items-center gap-1">
          Open Journal <ArrowRight className="h-3 w-3" />
        </button>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No journal entries yet. Start reviewing your sessions!</p>
      ) : (
        <div className="space-y-2">
          {entries.map((e) => (
            <div
              key={e.date}
              className="flex items-center justify-between rounded-lg bg-secondary/30 px-3 py-2.5 cursor-pointer hover:bg-secondary/50 transition-colors"
              onClick={() => navigate("/journal")}
            >
              <div className="flex items-center gap-3">
                <span className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${GRADE_COLORS[e.grade!] ?? ""}`}>
                  {e.grade}
                </span>
                <div>
                  <p className="text-sm font-medium">{e.date}</p>
                  <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                    {e.emotionTags?.length ? e.emotionTags.join(", ") : "No emotions tagged"}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
