import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  TradeFilters,
  DEFAULT_FILTERS,
  SavedView,
  loadSavedViews,
  saveSavedViews,
  loadTagCategories,
  ColumnKey,
} from "@/lib/trade-store";
import { Search, X, Bookmark, RotateCcw } from "lucide-react";
import { Trade } from "@/lib/types";

interface FilterBarProps {
  filters: TradeFilters;
  onChange: (f: TradeFilters) => void;
  trades: Trade[];
  visibleColumns: ColumnKey[];
}

function countActiveFilters(f: TradeFilters): number {
  let count = 0;
  if (f.search) count++;
  if (f.side !== "all") count++;
  if (f.pnl !== "all") count++;
  if (f.setup !== "all") count++;
  if (f.emotion !== "all") count++;
  if (f.mistake !== "all") count++;
  if (f.symbol !== "all") count++;
  if (f.dateFrom) count++;
  if (f.dateTo) count++;
  return count;
}

export default function FilterBar({ filters, onChange, trades }: FilterBarProps) {
  const [savedViews, setSavedViews] = useState<SavedView[]>(loadSavedViews);
  const [viewName, setViewName] = useState("");
  const cats = loadTagCategories();

  const symbols = useMemo(() => [...new Set(trades.map((t) => t.instrument))].sort(), [trades]);
  const isDefault = JSON.stringify(filters) === JSON.stringify(DEFAULT_FILTERS);
  const activeCount = countActiveFilters(filters);

  const set = (patch: Partial<TradeFilters>) => onChange({ ...filters, ...patch });

  const handleSaveView = () => {
    if (!viewName.trim()) return;
    const view: SavedView = {
      id: `v-${Date.now()}`,
      name: viewName.trim(),
      filters: { ...filters },
      visibleColumns: [],
    };
    const next = [...savedViews, view];
    setSavedViews(next);
    saveSavedViews(next);
    setViewName("");
  };

  const loadView = (v: SavedView) => onChange(v.filters);

  const deleteView = (id: string) => {
    const next = savedViews.filter((v) => v.id !== id);
    setSavedViews(next);
    saveSavedViews(next);
  };

  return (
    <div className="sticky top-0 z-20 -mx-4 lg:-mx-6 px-4 lg:px-6 py-3 bg-background/80 backdrop-blur-xl border-b border-border/40">
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={filters.search}
            onChange={(e) => set({ search: e.target.value })}
            className="h-8 pl-8 text-xs bg-card/60 border-border/50"
          />
        </div>

        {/* Date range */}
        <Input type="date" value={filters.dateFrom} onChange={(e) => set({ dateFrom: e.target.value })} className="h-8 w-32 text-xs bg-card/60 border-border/50" />
        <Input type="date" value={filters.dateTo} onChange={(e) => set({ dateTo: e.target.value })} className="h-8 w-32 text-xs bg-card/60 border-border/50" />

        {/* Symbol */}
        <Select value={filters.symbol} onValueChange={(v) => set({ symbol: v })}>
          <SelectTrigger className="h-8 w-28 text-xs bg-card/60 border-border/50"><SelectValue placeholder="Symbol" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Symbols</SelectItem>
            {symbols.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Side */}
        <Select value={filters.side} onValueChange={(v) => set({ side: v })}>
          <SelectTrigger className="h-8 w-24 text-xs bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
          </SelectContent>
        </Select>

        {/* Setup */}
        <Select value={filters.setup} onValueChange={(v) => set({ setup: v })}>
          <SelectTrigger className="h-8 w-28 text-xs bg-card/60 border-border/50"><SelectValue placeholder="Setup" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Setups</SelectItem>
            {cats.setups.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* Mistake */}
        <Select value={filters.mistake} onValueChange={(v) => set({ mistake: v })}>
          <SelectTrigger className="h-8 w-28 text-xs bg-card/60 border-border/50"><SelectValue placeholder="Mistake" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Mistakes</SelectItem>
            {cats.mistakes.map((m) => <SelectItem key={m} value={m}>{m}</SelectItem>)}
          </SelectContent>
        </Select>

        {/* P&L */}
        <Select value={filters.pnl} onValueChange={(v) => set({ pnl: v })}>
          <SelectTrigger className="h-8 w-24 text-xs bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All P&L</SelectItem>
            <SelectItem value="profit">Profit</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
          </SelectContent>
        </Select>

        {/* Active filter count + Reset */}
        {!isDefault && (
          <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground" onClick={() => onChange(DEFAULT_FILTERS)}>
            <RotateCcw className="h-3 w-3" />
            Reset
            <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono">{activeCount}</Badge>
          </Button>
        )}

        {/* Saved Views */}
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border/50">
              <Bookmark className="h-3 w-3" /> Views
              {savedViews.length > 0 && <Badge variant="secondary" className="h-4 px-1 text-[10px] font-mono ml-0.5">{savedViews.length}</Badge>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3 bg-card border-border/50" align="end">
            <p className="text-xs font-medium mb-2">Saved Views</p>
            {savedViews.length === 0 && <p className="text-xs text-muted-foreground mb-2">No saved views yet.</p>}
            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
              {savedViews.map((v) => (
                <div key={v.id} className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" className="h-7 flex-1 justify-start text-xs" onClick={() => loadView(v)}>{v.name}</Button>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive" onClick={() => deleteView(v.id)}>
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-1">
              <Input value={viewName} onChange={(e) => setViewName(e.target.value)} placeholder="View name..." className="h-7 text-xs bg-background" onKeyDown={(e) => e.key === "Enter" && handleSaveView()} />
              <Button size="sm" className="h-7 text-xs" onClick={handleSaveView}>Save</Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
