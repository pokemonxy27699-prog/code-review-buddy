import { useState, useEffect, useCallback, useRef } from "react";
import { Trade, TradeJournal, MistakeReview, TimelineEvent } from "@/lib/types";
import { useTags } from "@/store/trades";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Pencil, Eye, LayoutDashboard, FileText, ShieldAlert, Image, Play } from "lucide-react";
import OverviewTab from "./tabs/OverviewTab";
import NotesTab from "./tabs/NotesTab";
import MistakesTab from "./tabs/MistakesTab";
import ScreenshotTab, { type Annotation } from "./tabs/ScreenshotTab";
import ReplayTab from "./tabs/ReplayTab";

interface Props {
  trade: Trade | null;
  onClose: () => void;
  onSave: (id: string, patch: Partial<Trade>) => void;
}

export default function TradeReviewModal({ trade, onClose, onSave }: Props) {
  const { data: tagCats } = useTags();
  const cats = tagCats || { setups: [], emotions: [], mistakes: [] };

  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [journal, setJournal] = useState<TradeJournal>({});
  const [mistakeReview, setMistakeReview] = useState<MistakeReview>({});
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load trade data
  useEffect(() => {
    if (trade) {
      setRating(trade.rating || 0);
      setTags(trade.tags || []);
      setJournal(trade.journal || {});
      setMistakeReview(trade.mistakeReview || {
        mistakes: trade.mistake && trade.mistake !== "None" ? [trade.mistake] : [],
        severity: undefined,
        avoidable: false,
        reflection: "",
      });
      setScreenshot(trade.screenshot || null);
      setAnnotations(trade.annotations ? JSON.parse(trade.annotations) : []);
      setTimeline(trade.timeline || []);
      setEditing(false);
      setActiveTab("overview");
    }
  }, [trade?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Autosave journal changes
  const scheduleAutosave = useCallback(() => {
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    autosaveTimer.current = setTimeout(() => {
      if (trade && editing) {
        onSave(trade.id, { journal, mistakeReview, screenshot, annotations: JSON.stringify(annotations), timeline });
      }
    }, 1000);
  }, [trade, editing, journal, mistakeReview, screenshot, annotations, timeline, onSave]);

  useEffect(() => {
    if (editing) scheduleAutosave();
  }, [journal, mistakeReview]); // eslint-disable-line react-hooks/exhaustive-deps

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
  }, [trade, editing, rating, tags, journal, mistakeReview, screenshot, annotations]); // eslint-disable-line react-hooks/exhaustive-deps

  const save = () => {
    if (!trade) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    onSave(trade.id, {
      rating,
      tags,
      journal,
      mistakeReview,
      screenshot,
      annotations: JSON.stringify(annotations),
      timeline,
      mistake: (mistakeReview.mistakes?.[0] as Trade["mistake"]) || "None",
    });
    setEditing(false);
  };

  const cancel = () => {
    if (!trade) return;
    setRating(trade.rating || 0);
    setTags(trade.tags || []);
    setJournal(trade.journal || {});
    setMistakeReview(trade.mistakeReview || { mistakes: [], severity: undefined, avoidable: false, reflection: "" });
    setScreenshot(trade.screenshot || null);
    setAnnotations(trade.annotations ? JSON.parse(trade.annotations) : []);
    setTimeline(trade.timeline || []);
    setEditing(false);
  };

  if (!trade) return null;

  const pnlPct =
    trade.price && trade.quantity
      ? ((trade.pnl / (trade.price * trade.quantity)) * 100).toFixed(2)
      : "0.00";

  const TABS = [
    { value: "overview", label: "Overview", icon: LayoutDashboard },
    { value: "notes", label: "Notes", icon: FileText },
    { value: "mistakes", label: "Mistakes", icon: ShieldAlert },
    { value: "screenshot", label: "Screenshot", icon: Image },
    { value: "replay", label: "Replay", icon: Play },
  ];

  return (
    <Dialog open={!!trade} onOpenChange={() => onClose()}>
      <DialogContent
        className="max-w-6xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden flex flex-col bg-card border-border/50"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/30 bg-card/80 shrink-0">
          <DialogTitle className="flex items-center gap-3 text-base font-semibold">
            <span className="text-lg font-bold">{trade.instrument}</span>
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
              ({Number(pnlPct) >= 0 ? "+" : ""}{pnlPct}%)
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
                <><Eye className="h-3 w-3" /> View</>
              ) : (
                <><Pencil className="h-3 w-3" /> Edit</>
              )}
            </Button>
          </div>
        </div>

        {/* ── Tabs + Body ── */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col overflow-hidden flex-1">
          <div className="px-6 pt-3 border-b border-border/20 bg-card/60 shrink-0">
            <TabsList className="bg-transparent h-auto p-0 gap-0">
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-2.5 text-xs font-medium gap-1.5 text-muted-foreground data-[state=active]:text-foreground"
                >
                  <tab.icon className="h-3.5 w-3.5" />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="overflow-y-auto flex-1 min-h-0 p-6 pr-4">
            <TabsContent value="overview" className="mt-0 focus-visible:ring-0">
              <OverviewTab
                trade={trade}
                editing={editing}
                rating={rating}
                onRatingChange={setRating}
                tags={tags}
              />
            </TabsContent>

            <TabsContent value="notes" className="mt-0 focus-visible:ring-0">
              <NotesTab
                journal={journal}
                editing={editing}
                onChange={setJournal}
              />
            </TabsContent>

            <TabsContent value="mistakes" className="mt-0 focus-visible:ring-0">
              <MistakesTab
                review={mistakeReview}
                mistakeOptions={cats.mistakes}
                editing={editing}
                onChange={setMistakeReview}
              />
            </TabsContent>

            <TabsContent value="screenshot" className="mt-0 focus-visible:ring-0">
              <ScreenshotTab
                screenshot={screenshot}
                annotations={annotations}
                onScreenshotChange={setScreenshot}
                onAnnotationsChange={setAnnotations}
              />
            </TabsContent>

            <TabsContent value="replay" className="mt-0 focus-visible:ring-0">
              <ReplayTab
                trade={trade}
                screenshot={screenshot}
                timeline={timeline}
                onTimelineChange={(t) => {
                  setTimeline(t);
                  if (trade) {
                    onSave(trade.id, { timeline: t });
                  }
                }}
              />
            </TabsContent>
          </div>
        </Tabs>

        {/* ── Save / Cancel bar ── */}
        {editing && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-border/20 bg-card/80">
            <span className="text-[10px] text-muted-foreground">
              Autosaves notes · Ctrl+Enter to save all
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs" onClick={cancel}>
                Cancel
              </Button>
              <Button size="sm" className="h-8 text-xs" onClick={save}>
                Save Changes
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
