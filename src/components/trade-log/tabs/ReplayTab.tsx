import { useState, useEffect, useRef, useCallback } from "react";
import { Trade, TimelineEvent, TimelineEventType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Plus,
  Trash2,
  Pencil,
  X,
  Check,
  Image as ImageIcon,
  Grid3X3,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Props {
  trade: Trade;
  screenshot: string | null;
  timeline: TimelineEvent[];
  onTimelineChange: (timeline: TimelineEvent[]) => void;
}

const EVENT_TYPES: { value: TimelineEventType; label: string; color: string }[] = [
  { value: "entry", label: "Entry", color: "bg-primary text-primary-foreground" },
  { value: "scale_in", label: "Scale In", color: "bg-success/20 text-success" },
  { value: "scale_out", label: "Scale Out", color: "bg-warning/20 text-warning" },
  { value: "stop_move", label: "Stop Move", color: "bg-accent/20 text-accent" },
  { value: "exit", label: "Exit", color: "bg-destructive/20 text-destructive" },
];

function getEventMeta(type: TimelineEventType) {
  return EVENT_TYPES.find((e) => e.value === type) || EVENT_TYPES[0];
}

export default function ReplayTab({ trade, screenshot, timeline, onTimelineChange }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [editingEvent, setEditingEvent] = useState<TimelineEvent | null>(null);
  const [addingEvent, setAddingEvent] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  // Draft state for add/edit
  const [draftType, setDraftType] = useState<TimelineEventType>("entry");
  const [draftTime, setDraftTime] = useState("");
  const [draftPrice, setDraftPrice] = useState("");
  const [draftSize, setDraftSize] = useState("");
  const [draftNote, setDraftNote] = useState("");

  const sorted = [...timeline].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  // Playback
  useEffect(() => {
    if (playing && sorted.length > 0) {
      intervalRef.current = setInterval(() => {
        setActiveIdx((prev) => {
          if (prev >= sorted.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1500 / speed);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [playing, speed, sorted.length]);

  // Scroll active event into view
  useEffect(() => {
    if (timelineRef.current) {
      const active = timelineRef.current.querySelector(`[data-idx="${activeIdx}"]`);
      active?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [activeIdx]);

  const stepForward = () => {
    if (activeIdx < sorted.length - 1) setActiveIdx(activeIdx + 1);
  };
  const stepBack = () => {
    if (activeIdx > 0) setActiveIdx(activeIdx - 1);
  };

  const resetDraft = useCallback(() => {
    setDraftType("entry");
    setDraftTime("");
    setDraftPrice("");
    setDraftSize("");
    setDraftNote("");
    setEditingEvent(null);
    setAddingEvent(false);
  }, []);

  const startAdd = () => {
    resetDraft();
    setDraftTime(new Date().toISOString().slice(0, 16));
    setAddingEvent(true);
  };

  const startEdit = (ev: TimelineEvent) => {
    setEditingEvent(ev);
    setAddingEvent(false);
    setDraftType(ev.type);
    setDraftTime(ev.time.slice(0, 16));
    setDraftPrice(String(ev.price));
    setDraftSize(ev.size != null ? String(ev.size) : "");
    setDraftNote(ev.note || "");
  };

  const saveEvent = () => {
    const newEv: TimelineEvent = {
      id: editingEvent?.id || `ev-${Date.now()}`,
      type: draftType,
      time: new Date(draftTime).toISOString(),
      price: parseFloat(draftPrice) || 0,
      size: draftSize ? parseFloat(draftSize) : undefined,
      note: draftNote || undefined,
    };
    if (editingEvent) {
      onTimelineChange(timeline.map((e) => (e.id === editingEvent.id ? newEv : e)));
    } else {
      onTimelineChange([...timeline, newEv]);
    }
    resetDraft();
  };

  const deleteEvent = (id: string) => {
    onTimelineChange(timeline.filter((e) => e.id !== id));
    if (activeIdx >= sorted.length - 1 && activeIdx > 0) setActiveIdx(activeIdx - 1);
  };

  const progress = sorted.length > 1 ? (activeIdx / (sorted.length - 1)) * 100 : 0;

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* ── Chart / Visual Area ── */}
      <div className="flex-1 min-w-0">
        <div className="rounded-lg border border-border/30 bg-muted/30 overflow-hidden" style={{ minHeight: 280 }}>
          {screenshot ? (
            <div className="relative w-full h-[300px]">
              <img
                src={screenshot}
                alt="Trade chart"
                className="w-full h-full object-contain bg-background/50"
              />
              {/* Active event marker overlay */}
              {sorted.length > 0 && (
                <div className="absolute bottom-3 left-3 right-3">
                  <div className="rounded-md bg-card/90 backdrop-blur-sm border border-border/40 px-3 py-2 flex items-center gap-2">
                    <Badge className={`text-[10px] ${getEventMeta(sorted[activeIdx]?.type).color}`}>
                      {getEventMeta(sorted[activeIdx]?.type).label}
                    </Badge>
                    <span className="text-xs font-mono text-foreground">
                      ${sorted[activeIdx]?.price.toLocaleString()}
                    </span>
                    {sorted[activeIdx]?.note && (
                      <span className="text-xs text-muted-foreground truncate">{sorted[activeIdx].note}</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="w-full h-[300px] flex flex-col items-center justify-center gap-3">
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                <Grid3X3 className="h-6 w-6 text-muted-foreground/50" />
              </div>
              <p className="text-xs text-muted-foreground">Chart area — upload a screenshot in the Screenshot tab</p>
              {sorted.length > 0 && (
                <div className="rounded-md bg-card/80 border border-border/30 px-3 py-2 flex items-center gap-2">
                  <Badge className={`text-[10px] ${getEventMeta(sorted[activeIdx]?.type).color}`}>
                    {getEventMeta(sorted[activeIdx]?.type).label}
                  </Badge>
                  <span className="text-xs font-mono">${sorted[activeIdx]?.price.toLocaleString()}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Playback Controls ── */}
        <div className="mt-3 rounded-lg border border-border/30 bg-card/60 p-3">
          {/* Progress bar */}
          <div className="relative h-1.5 bg-muted rounded-full mb-3 overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
            {sorted.map((_, i) => (
              <button
                key={i}
                className={`absolute top-1/2 -translate-y-1/2 h-3 w-3 rounded-full border-2 transition-all ${
                  i === activeIdx
                    ? "bg-primary border-primary scale-125"
                    : i < activeIdx
                    ? "bg-primary/60 border-primary/60"
                    : "bg-muted-foreground/30 border-muted-foreground/20"
                }`}
                style={{ left: sorted.length > 1 ? `${(i / (sorted.length - 1)) * 100}%` : "50%", transform: "translate(-50%, -50%)" }}
                onClick={() => { setActiveIdx(i); setPlaying(false); }}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={stepBack} disabled={activeIdx <= 0 || sorted.length === 0}>
                <SkipBack className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant={playing ? "default" : "outline"}
                size="sm"
                className="h-7 w-7 p-0"
                onClick={() => {
                  if (sorted.length === 0) return;
                  if (activeIdx >= sorted.length - 1 && !playing) setActiveIdx(0);
                  setPlaying(!playing);
                }}
                disabled={sorted.length === 0}
              >
                {playing ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
              </Button>
              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={stepForward} disabled={activeIdx >= sorted.length - 1 || sorted.length === 0}>
                <SkipForward className="h-3.5 w-3.5" />
              </Button>
            </div>

            <span className="text-[10px] text-muted-foreground font-mono">
              {sorted.length > 0 ? `${activeIdx + 1} / ${sorted.length}` : "No events"}
            </span>

            <div className="flex items-center gap-1">
              {[1, 2].map((s) => (
                <Button
                  key={s}
                  variant={speed === s ? "secondary" : "ghost"}
                  size="sm"
                  className="h-6 px-2 text-[10px]"
                  onClick={() => setSpeed(s)}
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline Panel ── */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold">Timeline Events</h3>
          <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={startAdd}>
            <Plus className="h-3 w-3" /> Add
          </Button>
        </div>

        {/* Add / Edit form */}
        {(addingEvent || editingEvent) && (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 mb-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium">{editingEvent ? "Edit Event" : "New Event"}</span>
              <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={resetDraft}>
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Select value={draftType} onValueChange={(v) => setDraftType(v as TimelineEventType)}>
              <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((et) => (
                  <SelectItem key={et.value} value={et.value} className="text-xs">{et.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="datetime-local"
              className="h-7 text-xs"
              value={draftTime}
              onChange={(e) => setDraftTime(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                placeholder="Price"
                className="h-7 text-xs"
                type="number"
                step="any"
                value={draftPrice}
                onChange={(e) => setDraftPrice(e.target.value)}
              />
              <Input
                placeholder="Size"
                className="h-7 text-xs"
                type="number"
                step="any"
                value={draftSize}
                onChange={(e) => setDraftSize(e.target.value)}
              />
            </div>
            <Input
              placeholder="Note (optional)"
              className="h-7 text-xs"
              value={draftNote}
              onChange={(e) => setDraftNote(e.target.value)}
            />
            <Button size="sm" className="h-7 text-xs w-full gap-1" onClick={saveEvent} disabled={!draftPrice}>
              <Check className="h-3 w-3" /> {editingEvent ? "Update" : "Add Event"}
            </Button>
          </div>
        )}

        {/* Event list */}
        <ScrollArea className="h-[340px]">
          <div className="relative" ref={timelineRef}>
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-xs text-muted-foreground">No events yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Add entry, exit, and stop events to replay your trade</p>
              </div>
            ) : (
              <div className="space-y-0">
                {sorted.map((ev, i) => {
                  const meta = getEventMeta(ev.type);
                  const isActive = i === activeIdx;
                  return (
                    <div
                      key={ev.id}
                      data-idx={i}
                      className={`group relative flex gap-3 py-2.5 px-2 rounded-md cursor-pointer transition-colors ${
                        isActive ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/40 border border-transparent"
                      }`}
                      onClick={() => { setActiveIdx(i); setPlaying(false); }}
                    >
                      {/* Connector line */}
                      {i < sorted.length - 1 && (
                        <div className="absolute left-[17px] top-[32px] bottom-0 w-px bg-border/40" />
                      )}
                      {/* Dot */}
                      <div className={`relative z-10 mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isActive ? "bg-primary ring-2 ring-primary/30" : "bg-muted-foreground/20"
                      }`}>
                        <div className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-primary-foreground" : "bg-muted-foreground/50"}`} />
                      </div>
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge className={`text-[9px] px-1.5 py-0 ${meta.color}`}>{meta.label}</Badge>
                          <span className="text-xs font-mono font-medium">${ev.price.toLocaleString()}</span>
                          {ev.size != null && (
                            <span className="text-[10px] text-muted-foreground">×{ev.size}</span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 font-mono">
                          {new Date(ev.time).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </div>
                        {ev.note && (
                          <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{ev.note}</p>
                        )}
                      </div>
                      {/* Actions */}
                      <div className="flex items-start gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={(e) => { e.stopPropagation(); startEdit(ev); }}>
                          <Pencil className="h-2.5 w-2.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-5 w-5 p-0 text-destructive" onClick={(e) => { e.stopPropagation(); deleteEvent(ev.id); }}>
                          <Trash2 className="h-2.5 w-2.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
