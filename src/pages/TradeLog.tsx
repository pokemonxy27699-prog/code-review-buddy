import { useState, useMemo } from "react";
import { Trade } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { loadVisibleColumns, ColumnKey, ALL_COLUMNS } from "@/lib/trade-store";
import { useTrades, useFilters, useUpdateTrade, useDeleteTrade } from "@/store/trades";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, Star, Download, Clock, Loader2, AlertCircle, Inbox, MoreHorizontal, Pencil, Copy, Trash2, Rows3, Rows4 } from "lucide-react";
import FilterBar from "@/components/trade-log/FilterBar";
import ColumnPicker from "@/components/trade-log/ColumnPicker";
import TradeDetailDrawer from "@/components/trade-log/TradeDetailDrawer";
import TradeReviewModal from "@/components/trade-log/TradeReviewModal";
import { exportTradesToCsv } from "@/lib/trade-store";

type SortKey = keyof Trade;
type Density = "comfortable" | "compact";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`h-3 w-3 ${i <= rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
      ))}
    </div>
  );
}

function TableSkeleton({ cols }: { cols: number }) {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <TableRow key={i} className="border-border/30">
          <TableCell><Skeleton className="h-3.5 w-3.5 rounded" /></TableCell>
          {Array.from({ length: cols }).map((_, j) => (
            <TableCell key={j}><Skeleton className="h-4 w-full max-w-[80px]" /></TableCell>
          ))}
          <TableCell><Skeleton className="h-4 w-6" /></TableCell>
        </TableRow>
      ))}
    </>
  );
}

export default function TradeLog() {
  const { filters, setFilters } = useFilters();
  const { data: trades = [], isLoading, isError, error } = useTrades(filters);
  const updateTrade = useUpdateTrade();
  const deleteTrade = useDeleteTrade();
  const [visibleCols, setVisibleCols] = useState<ColumnKey[]>(loadVisibleColumns);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortAsc, setSortAsc] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailTrade, setDetailTrade] = useState<Trade | null>(null);
  const [density, setDensity] = useState<Density>("comfortable");
  const [deleteTarget, setDeleteTarget] = useState<Trade | null>(null);

  const sorted = useMemo(() => {
    const result = [...trades];
    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === "string" && typeof bVal === "string")
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      return sortAsc ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return result;
  }, [trades, sortKey, sortAsc]);

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
    if (selected.size === sorted.length) setSelected(new Set());
    else setSelected(new Set(sorted.map((t) => t.id)));
  };

  const handleDuplicate = (t: Trade) => {
    // Opens drawer with trade data for review; user can save as new
    setDetailTrade({ ...t, id: `t-${Date.now()}` });
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteTrade.mutate(deleteTarget.id);
    setDeleteTarget(null);
    selected.delete(deleteTarget.id);
    setSelected(new Set(selected));
  };

  const cellPadding = density === "compact" ? "px-3 py-1.5" : "px-4 py-3";

  const SortHeader = ({ label, sortField }: { label: string; sortField: SortKey }) => (
    <button onClick={() => toggleSort(sortField)} className="flex items-center gap-1 hover:text-foreground whitespace-nowrap">
      {label} <ArrowUpDown className="h-3 w-3" />
    </button>
  );

  const colLabel = (col: ColumnKey) => ALL_COLUMNS.find((c) => c.key === col)?.label || col;

  const renderCell = (t: Trade, col: ColumnKey) => {
    switch (col) {
      case "date":
        return <span className="font-mono text-xs text-muted-foreground whitespace-nowrap">{new Date(t.date).toLocaleDateString()}</span>;
      case "instrument":
        return <span className="font-medium whitespace-nowrap">{t.instrument}</span>;
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
      <FilterBar filters={filters} onChange={setFilters} trades={trades} visibleColumns={visibleCols} />

      {/* Toolbar */}
      <div className="flex items-center justify-between py-3 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h1 className="text-lg font-bold tracking-tight">Trade Log</h1>
          <span className="text-xs text-muted-foreground">{sorted.length} trades</span>
          {selected.size > 0 && (
            <Badge variant="secondary" className="text-[10px]">{selected.size} selected</Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Density toggle */}
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 border-border/50"
            onClick={() => setDensity(density === "comfortable" ? "compact" : "comfortable")}
            title={density === "comfortable" ? "Switch to compact" : "Switch to comfortable"}
          >
            {density === "comfortable" ? <Rows4 className="h-3 w-3" /> : <Rows3 className="h-3 w-3" />}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs gap-1 border-border/50"
            onClick={() => exportTradesToCsv(selected.size > 0 ? sorted.filter((t) => selected.has(t.id)) : sorted)}
          >
            <Download className="h-3 w-3" /> Export{selected.size > 0 ? ` (${selected.size})` : ""}
          </Button>
          <ColumnPicker visible={visibleCols} onChange={setVisibleCols} />
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="glass-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="w-10"><Skeleton className="h-3.5 w-3.5 rounded" /></TableHead>
                {visibleCols.map((col) => (
                  <TableHead key={col}><Skeleton className="h-4 w-16" /></TableHead>
                ))}
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableSkeleton cols={visibleCols.length} />
            </TableBody>
          </Table>
        </div>
      )}

      {/* Error */}
      {isError && (
        <div className="glass-card flex items-center justify-center py-20 gap-3">
          <AlertCircle className="h-6 w-6 text-destructive" />
          <div>
            <p className="text-sm font-medium text-destructive">Failed to load trades</p>
            <p className="text-xs text-muted-foreground mt-0.5">{(error as Error)?.message || "Check your connection and try again."}</p>
          </div>
        </div>
      )}

      {/* Empty */}
      {!isLoading && !isError && sorted.length === 0 && (
        <div className="glass-card flex flex-col items-center justify-center py-20 gap-3">
          <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">No trades found</p>
            <p className="text-xs text-muted-foreground mt-0.5">Adjust your filters or add a trade to get started.</p>
          </div>
        </div>
      )}

      {/* Table */}
      {!isLoading && !isError && sorted.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
                <TableRow className="border-border/50 hover:bg-transparent">
                  <TableHead className={`w-10 ${cellPadding}`}>
                    <Checkbox
                      checked={sorted.length > 0 && selected.size === sorted.length}
                      onCheckedChange={toggleAll}
                      className="h-3.5 w-3.5"
                    />
                  </TableHead>
                  {visibleCols.map((col) => (
                    <TableHead key={col} className={`${isRightAligned(col) ? "text-right" : ""} ${cellPadding}`}>
                      {["date", "instrument", "pnl", "rMultiple", "price", "quantity", "fees"].includes(col)
                        ? <SortHeader label={colLabel(col)} sortField={col as SortKey} />
                        : <span className="text-xs whitespace-nowrap">{colLabel(col)}</span>
                      }
                    </TableHead>
                  ))}
                  <TableHead className={`w-10 ${cellPadding}`} />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sorted.slice(0, 100).map((t) => (
                  <TableRow
                    key={t.id}
                    className={`cursor-pointer border-border/30 ${selected.has(t.id) ? "bg-primary/5" : ""} ${t.pnl >= 0 ? "hover:bg-success/5" : "hover:bg-destructive/5"}`}
                  >
                    <TableCell className={`w-10 ${cellPadding}`} onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={selected.has(t.id)}
                        onCheckedChange={() => toggleSelect(t.id)}
                        className="h-3.5 w-3.5"
                      />
                    </TableCell>
                    {visibleCols.map((col) => (
                      <TableCell
                        key={col}
                        className={`${isRightAligned(col) ? "text-right" : ""} ${cellPadding}`}
                        onClick={() => setDetailTrade(t)}
                      >
                        {renderCell(t, col)}
                      </TableCell>
                    ))}
                    <TableCell className={`w-10 ${cellPadding}`} onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground">
                            <MoreHorizontal className="h-3.5 w-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36">
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => setDetailTrade(t)}>
                            <Pencil className="h-3 w-3" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2" onClick={() => handleDuplicate(t)}>
                            <Copy className="h-3 w-3" /> Duplicate
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-xs gap-2 text-destructive focus:text-destructive" onClick={() => setDeleteTarget(t)}>
                            <Trash2 className="h-3 w-3" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}

      {/* Detail drawer */}
      <TradeDetailDrawer
        trade={detailTrade}
        onClose={() => setDetailTrade(null)}
        onSave={(id, patch) => {
          updateTrade.mutate({ id, patch });
          setDetailTrade(null);
        }}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete trade?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {deleteTarget?.instrument} {deleteTarget?.side} trade from {deleteTarget ? new Date(deleteTarget.date).toLocaleDateString() : ""}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
