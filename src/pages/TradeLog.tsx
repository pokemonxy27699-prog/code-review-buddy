import { useState, useMemo } from "react";
import { mockTrades, Trade, SETUPS, EMOTIONS } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowUpDown, Star, Clock } from "lucide-react";

type SortKey = keyof Trade;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? "fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function TradeLog() {
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [pnlFilter, setPnlFilter] = useState<string>("all");
  const [setupFilter, setSetupFilter] = useState<string>("all");
  const [emotionFilter, setEmotionFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const filtered = useMemo(() => {
    let result = [...mockTrades];
    if (search) result = result.filter((t) => t.instrument.toLowerCase().includes(search.toLowerCase()) || t.tags?.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
    if (sideFilter !== "all") result = result.filter((t) => t.side === sideFilter);
    if (pnlFilter === "profit") result = result.filter((t) => t.pnl > 0);
    if (pnlFilter === "loss") result = result.filter((t) => t.pnl < 0);
    if (setupFilter !== "all") result = result.filter((t) => t.setup === setupFilter);
    if (emotionFilter !== "all") result = result.filter((t) => t.emotion === emotionFilter);
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [search, sideFilter, pnlFilter, setupFilter, emotionFilter, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortHeader = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <button onClick={() => toggleSort(sortField)} className="flex items-center gap-1 hover:text-foreground">
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Trade Log</h1>
        <p className="text-sm text-muted-foreground">{filtered.length} trades • Click a row for details</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search instrument or tag..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card/60 border-border/50" />
        </div>
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger className="w-28 bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pnlFilter} onValueChange={setPnlFilter}>
          <SelectTrigger className="w-28 bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All P&L</SelectItem>
            <SelectItem value="profit">Profit</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
          </SelectContent>
        </Select>
        <Select value={setupFilter} onValueChange={setSetupFilter}>
          <SelectTrigger className="w-32 bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Setups</SelectItem>
            {SETUPS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={emotionFilter} onValueChange={setEmotionFilter}>
          <SelectTrigger className="w-32 bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Emotions</SelectItem>
            {EMOTIONS.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead><SortHeader label="Date" sortField="date" /></TableHead>
              <TableHead><SortHeader label="Instrument" sortField="instrument" /></TableHead>
              <TableHead>Side</TableHead>
              <TableHead>Setup</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead className="text-right"><SortHeader label="R-Mult" sortField="rMultiple" /></TableHead>
              <TableHead className="text-right"><SortHeader label="P&L" sortField="pnl" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 50).map((t) => (
              <TableRow
                key={t.id}
                onClick={() => setSelectedTrade(t)}
                className={`cursor-pointer border-border/30 ${t.pnl >= 0 ? "hover:bg-[hsl(var(--success)/0.05)]" : "hover:bg-[hsl(var(--destructive)/0.05)]"}`}
              >
                <TableCell className="font-mono text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{t.instrument}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${t.side === "BUY" ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]" : "bg-destructive/15 text-destructive"}`}>
                    {t.side}
                  </span>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{t.setup}</TableCell>
                <TableCell><StarRating rating={t.rating || 0} /></TableCell>
                <TableCell className={`text-right font-mono text-sm ${(t.rMultiple || 0) >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                  {t.rMultiple}R
                </TableCell>
                <TableCell className={`text-right font-mono text-sm font-semibold ${t.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                  {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Trade Detail Dialog */}
      <Dialog open={!!selectedTrade} onOpenChange={() => setSelectedTrade(null)}>
        <DialogContent className="max-w-lg border-border/50 bg-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span>{selectedTrade?.instrument}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${selectedTrade?.side === "BUY" ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]" : "bg-destructive/15 text-destructive"}`}>
                {selectedTrade?.side}
              </span>
            </DialogTitle>
          </DialogHeader>

          {selectedTrade && (
            <div className="space-y-5">
              {/* Top stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">P&L</p>
                  <p className={`font-mono text-lg font-bold ${selectedTrade.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {selectedTrade.pnl >= 0 ? "+" : ""}${selectedTrade.pnl.toLocaleString()}
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">R-Multiple</p>
                  <p className={`font-mono text-lg font-bold ${(selectedTrade.rMultiple || 0) >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                    {selectedTrade.rMultiple}R
                  </p>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <StarRating rating={selectedTrade.rating || 0} />
                </div>
              </div>

              {/* Details grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-mono">{new Date(selectedTrade.date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="font-mono">{selectedTrade.quantity}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-mono">${selectedTrade.price.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fees</p>
                  <p className="font-mono">${selectedTrade.fees}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Stop Loss</p>
                  <p className="font-mono text-destructive">${selectedTrade.stopLoss}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Take Profit</p>
                  <p className="font-mono text-[hsl(var(--success))]">${selectedTrade.takeProfit}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Hold Time</p>
                  <p className="flex items-center gap-1 font-mono">
                    <Clock className="h-3 w-3 text-muted-foreground" />
                    {selectedTrade.holdTime}m
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Setup</p>
                  <p>{selectedTrade.setup}</p>
                </div>
              </div>

              {/* Emotion & Mistake */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Emotion</p>
                  <Badge variant="outline" className="border-primary/30 text-primary">{selectedTrade.emotion}</Badge>
                </div>
                <div className="rounded-lg bg-muted/30 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Mistake</p>
                  <Badge variant={selectedTrade.mistake === "None" ? "outline" : "destructive"}>
                    {selectedTrade.mistake}
                  </Badge>
                </div>
              </div>

              {/* Tags */}
              {selectedTrade.tags && selectedTrade.tags.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Tags</p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTrade.tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {selectedTrade.notes && (
                <div className="rounded-lg bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Notes</p>
                  <p className="text-sm">{selectedTrade.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
