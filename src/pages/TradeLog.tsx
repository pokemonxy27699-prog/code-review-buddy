import { useState, useMemo, useCallback } from "react";
import { Trade } from "@/lib/mock-data";
import {
  loadTrades,
  loadVisibleColumns,
  applyFilters,
  exportTradesToCsv,
  TradeFilters,
  DEFAULT_FILTERS,
  ColumnKey,
} from "@/lib/trade-store";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowUpDown, Star, Download, Upload, Clock } from "lucide-react";
import FilterBar from "@/components/trade-log/FilterBar";
import ColumnPicker from "@/components/trade-log/ColumnPicker";
import TradeDetailDrawer from "@/components/trade-log/TradeDetailDrawer";
import CsvImportDialog from "@/components/trade-log/CsvImportDialog";

type SortKey = keyof Trade;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

export default function TradeLog() {
  const [trades, setTrades] = useState<Trade[]>(loadTrades);
  const [filters, setFilters] = useState<TradeFilters>(DEFAULT_FILTERS);
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(loadVisibleColumns);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [csvOpen, setCsvOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = applyFilters(trades, filters);
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [trades, filters, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map((t) => t.id)));
  };

  const SortHeader = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <button onClick={() => toggleSort(sortField)} className="flex items-center gap-1 hover:text-foreground">
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  // Cell renderer per column
  const renderCell = (t: Trade, col: ColumnKey) => {
    switch (col) {
      case "date":
        return <span className="font-mono text-xs text-muted-foreground">{new Date(t.date).toLocaleDateString()}</span>;
      case "instrument":
        return <span className="font-medium">{t.instrument}</span>;
      case "side":
        return (
          <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${t.side === "BUY" ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"}`}>
            {t.side}
          </span>
        );
      case "setup":
        return <span className="text-xs text-muted-foreground">{t.setup}</span>;
      case "rating":
        return <StarRating rating={t.rating || 0} />;
      case "rMultiple":
        return <span className={`font-mono text-sm ${(t.rMultiple || 0) >= 0 ? "text-success" : "text-destructive"}`}>{t.rMultiple}R</span>;
      case "pnl":
        return (
          <span className={`font-mono text-sm font-semibold ${t.pnl >= 0 ? "text-success" : "text-destructive"}`}>
            {t.pnl >= 0 ? "+" : ""}${t.pnl.toLocaleString()}
          </span>
        );
      case "emotion":
        return <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{t.emotion}</Badge>;
      case "mistake":
        return <Badge variant={t.mistake === "None" ? "outline" : "destructive"} className="text-[10px]">{t.mistake}</Badge>;
      case "quantity":
        return <span className="font-mono text-xs">{t.quantity}</span>;
      case "price":
        return <span className="font-mono text-xs">${t.price.toLocaleString()}</span>;
      case "fees":
        return <span className="font-mono text-xs">${t.fees}</span>;
      case "holdTime":
        return <span className="font-mono text-xs flex items-center gap-1"><Clock className="h-3 w-3 text-muted-foreground" />{t.holdTime}m</span>;
      case "stopLoss":
        return <span className="font-mono text-xs text-destructive">${t.stopLoss}</span>;
      case "takeProfit":
        return <span className="font-mono text-xs text-success">${t.takeProfit}</span>;
      case "tags":
        return (
          <div className="flex flex-wrap gap-0.5">
            {t.tags?.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-[9px] px-1">{tag}</Badge>
            ))}
            {(t.tags?.length || 0) > 2 && <span className="text-[9px] text-muted-foreground">+{(t.tags?.length || 0) - 2}</span>}
          </div>
        );
      default:
        return null;
    }
  };

  const isRightAligned = (col: ColumnKey) => ["pnl", "rMultiple", "price", "fees", "quantity"].includes(col);

  return (
    <div className="space-y-0">
      {/* Filter bar */}
      <FilterBar filters={filters} onChange={setFilters} trades={trades} visibleColumns={visibleCols} />

      {/* Toolbar */}
      <div className="flex items-center justify-between py-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Trade Log</h1>
          <span className="text-xs text-muted-foreground">{filtered.length} trades</span>
          {selected.size > 0 && (
            <Badge variant="secondary" className="text-[10px]">{selected.size} selected</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1 border-border/50" onClick={() => setCsvOpen(true)}>
            <Upload className="h-3 w-3" /> Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 border-border/50"
            onClick={() => exportTradesToCsv(selected.size > 0 ? filtered.filter((t) => selected.has(t.id)) : filtered)}
          >
            <Download className="h-3 w-3" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
          <ColumnPicker visible={visibleCols} onChange={setVisibleCols} />
        </div>
      </div>

      {/* Table */}
      <div className="glass-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="border-border/50 hover:bg-transparent">
              <TableHead className="w-10">
                <Checkbox
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onCheckedChange={toggleAll}
                  className="h-3.5 w-3.5"
                />
              </TableHead>
              {visibleCols.map((col) => (
                <TableHead key={col} className={isRightAligned(col) ? "text-right" : ""}>
                  {["date", "instrument", "pnl", "rMultiple", "price", "quantity"].includes(col)
                    ? <SortHeader label={col === "rMultiple" ? "R-Mult" : col === "pnl" ? "P&L" : col.charAt(0).toUpperCase() + col.slice(1)} sortField={col as SortKey} />
                    : <span className="text-xs">{col === "holdTime" ? "Hold" : col.charAt(0).toUpperCase() + col.slice(1)}</span>
                  }
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.slice(0, 100).map((t) => (
              <TableRow
                key={t.id}
                className={`cursor-pointer border-border/30 ${selected.has(t.id) ? "bg-primary/5" : ""} ${t.pnl >= 0 ? "hover:bg-success/5" : "hover:bg-destructive/5"}`}
              >
                <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(t.id)}
                    onCheckedChange={() => toggleSelect(t.id)}
                    className="h-3.5 w-3.5"
                  />
                </TableCell>
                {visibleCols.map((col) => (
                  <TableCell
                    key={col}
                    className={isRightAligned(col) ? "text-right" : ""}
                    onClick={() => setDetailTrade(t)}
                  >
                    {renderCell(t, col)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Detail drawer */}
      <TradeDetailDrawer trade={detailTrade} onClose={() => setDetailTrade(null)} onUpdate={setTrades} />

      {/* CSV Import */}
      <CsvImportDialog open={csvOpen} onClose={() => setCsvOpen(false)} />
    </div>
  );
}
