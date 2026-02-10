import { useState, useMemo } from "react";
import { mockTrades, Trade } from "@/lib/mock-data";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, ArrowUpDown } from "lucide-react";

type SortKey = keyof Trade;

export default function TradeLog() {
  const [search, setSearch] = useState("");
  const [sideFilter, setSideFilter] = useState<string>("all");
  const [pnlFilter, setPnlFilter] = useState<string>("all");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);

  const filtered = useMemo(() => {
    let result = [...mockTrades];
    if (search) result = result.filter((t) => t.instrument.toLowerCase().includes(search.toLowerCase()));
    if (sideFilter !== "all") result = result.filter((t) => t.side === sideFilter);
    if (pnlFilter === "profit") result = result.filter((t) => t.pnl > 0);
    if (pnlFilter === "loss") result = result.filter((t) => t.pnl < 0);
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string") return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [search, sideFilter, pnlFilter, sortKey, sortAsc]);

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
        <p className="text-sm text-muted-foreground">{filtered.length} trades</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search instrument..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-card/60 border-border/50" />
        </div>
        <Select value={sideFilter} onValueChange={setSideFilter}>
          <SelectTrigger className="w-32 bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sides</SelectItem>
            <SelectItem value="BUY">Buy</SelectItem>
            <SelectItem value="SELL">Sell</SelectItem>
          </SelectContent>
        </Select>
        <Select value={pnlFilter} onValueChange={setPnlFilter}>
          <SelectTrigger className="w-32 bg-card/60 border-border/50"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All P&L</SelectItem>
            <SelectItem value="profit">Profit</SelectItem>
            <SelectItem value="loss">Loss</SelectItem>
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
              <TableHead className="text-right"><SortHeader label="Qty" sortField="quantity" /></TableHead>
              <TableHead className="text-right"><SortHeader label="Price" sortField="price" /></TableHead>
              <TableHead className="text-right"><SortHeader label="Fees" sortField="fees" /></TableHead>
              <TableHead className="text-right"><SortHeader label="P&L" sortField="pnl" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 50).map((t) => (
              <TableRow key={t.id} className={`border-border/30 ${t.pnl >= 0 ? "hover:bg-[hsl(var(--success)/0.05)]" : "hover:bg-[hsl(var(--destructive)/0.05)]"}`}>
                <TableCell className="font-mono text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</TableCell>
                <TableCell className="font-medium">{t.instrument}</TableCell>
                <TableCell>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${t.side === "BUY" ? "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]" : "bg-destructive/15 text-destructive"}`}>
                    {t.side}
                  </span>
                </TableCell>
                <TableCell className="text-right font-mono text-sm">{t.quantity}</TableCell>
                <TableCell className="text-right font-mono text-sm">${t.price.toLocaleString()}</TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">${t.fees}</TableCell>
                <TableCell className={`text-right font-mono text-sm font-semibold ${t.pnl >= 0 ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
                  {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
