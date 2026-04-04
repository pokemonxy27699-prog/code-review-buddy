import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, FileText, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";
import {
  parseCryptoComCsv,
  csvTradesToAppTrades,
  findDuplicates,
  ParsedCsvTrade,
  ParseResult,
} from "@/lib/csv-parser";
import { Trade } from "@/lib/types";

interface CsvImportModalProps {
  open: boolean;
  onClose: () => void;
  existingTrades: Trade[];
  onImport: (trades: Trade[]) => void;
}

type Step = "upload" | "preview";

export default function CsvImportModal({
  open,
  onClose,
  existingTrades,
  onImport,
}: CsvImportModalProps) {
  const [step, setStep] = useState<Step>("upload");
  const [parsed, setParsed] = useState<ParsedCsvTrade[]>([]);
  const [dupes, setDupes] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [importing, setImporting] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseWarnings, setParseWarnings] = useState<string[]>([]);
  const [fileName, setFileName] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep("upload");
    setParsed([]);
    setDupes(new Set());
    setSelected(new Set());
    setImporting(false);
    setParsing(false);
    setError(null);
    setParseWarnings([]);
    setFileName("");
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file: File) => {
    setError(null);
    setParseWarnings([]);
    setFileName(file.name);
    setParsing(true);
    try {
      const text = await file.text();
      const result = parseCryptoComCsv(text);
      if (result.trades.length === 0) {
        setError(
          result.errors.length > 0
            ? result.errors.join(" ")
            : "No trading rows found in this file. Make sure it's a Crypto.com OEX_TRANSACTION export."
        );
        setParsing(false);
        return;
      }
      if (result.errors.length > 0) {
        setParseWarnings(result.errors);
      }
      const duplicates = findDuplicates(result.trades, existingTrades);
      const newIds = new Set(
        result.trades.filter((r) => !duplicates.has(r.tradeMatchId)).map((r) => r.tradeMatchId)
      );
      setParsed(result.trades);
      setDupes(duplicates);
      setSelected(newIds);
      setStep("preview");
    } catch (e) {
      setError("Failed to parse CSV file. Please check the format.");
    } finally {
      setParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file?.name.endsWith(".csv")) handleFile(file);
    else setError("Please drop a .csv file.");
  };

  const handleImport = () => {
    setImporting(true);
    const toImport = parsed.filter((p) => selected.has(p.tradeMatchId));
    const trades = csvTradesToAppTrades(toImport);
    onImport(trades);
    setImporting(false);
    handleClose();
  };

  const toggleAll = () => {
    const nonDupes = parsed.filter((p) => !dupes.has(p.tradeMatchId));
    if (selected.size === nonDupes.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(nonDupes.map((p) => p.tradeMatchId)));
    }
  };

  const toggleOne = (id: string) => {
    if (dupes.has(id)) return;
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const newCount = parsed.filter((p) => !dupes.has(p.tradeMatchId)).length;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col overflow-hidden p-6">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-lg font-bold">Import CSV — Crypto.com Exchange</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Upload an OEX_TRANSACTION.csv export to import trades.
          </DialogDescription>
        </DialogHeader>

        {step === "upload" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 py-8">
            <div
              className={`w-full border-2 border-dashed border-border/60 rounded-xl p-10 flex flex-col items-center gap-3 transition-colors ${
                parsing ? "opacity-60 pointer-events-none" : "cursor-pointer hover:border-primary/40 hover:bg-primary/5"
              }`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !parsing && fileRef.current?.click()}
            >
              <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center">
                {parsing ? (
                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <p className="text-sm font-medium">
                {parsing ? "Parsing CSV…" : "Drop CSV file here or click to browse"}
              </p>
              <p className="text-xs text-muted-foreground">Accepts Crypto.com OEX_TRANSACTION.csv</p>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
                e.target.value = "";
              }}
            />
            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>
        )}

        {step === "preview" && (
          <>
            {parseWarnings.length > 0 && (
              <div className="shrink-0 rounded-lg bg-warning/10 border border-warning/30 px-3 py-2 text-xs text-warning flex items-start gap-2">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                <div>{parseWarnings.join(" ")}</div>
              </div>
            )}
            <div className="shrink-0 flex items-center justify-between gap-3 py-2 flex-wrap">
              <div className="flex items-center gap-2 text-sm">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{fileName}</span>
                <Badge variant="secondary" className="text-[10px]">{parsed.length} trades found</Badge>
                {dupes.size > 0 && (
                  <Badge variant="outline" className="text-[10px] border-warning/50 text-warning">
                    {dupes.size} duplicates
                  </Badge>
                )}
                <Badge variant="outline" className="text-[10px] border-success/50 text-success">
                  {selected.size} to import
                </Badge>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={reset}>
                Choose different file
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto border border-border/30 rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow className="border-border/50">
                    <TableHead className="w-10 px-3">
                      <Checkbox
                        checked={selected.size === newCount && newCount > 0}
                        onCheckedChange={toggleAll}
                        className="h-3.5 w-3.5"
                      />
                    </TableHead>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Symbol</TableHead>
                    <TableHead className="text-xs">Side</TableHead>
                    <TableHead className="text-xs text-right">Qty</TableHead>
                    <TableHead className="text-xs text-right">Price</TableHead>
                    <TableHead className="text-xs text-right">Value</TableHead>
                    <TableHead className="text-xs">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsed.map((p) => {
                    const isDupe = dupes.has(p.tradeMatchId);
                    return (
                      <TableRow
                        key={p.tradeMatchId}
                        className={`border-border/30 ${isDupe ? "opacity-40" : ""}`}
                      >
                        <TableCell className="px-3">
                          <Checkbox
                            checked={selected.has(p.tradeMatchId)}
                            onCheckedChange={() => toggleOne(p.tradeMatchId)}
                            disabled={isDupe}
                            className="h-3.5 w-3.5"
                          />
                        </TableCell>
                        <TableCell className="text-xs font-mono text-muted-foreground whitespace-nowrap">
                          {p.date}
                        </TableCell>
                        <TableCell className="text-xs font-medium">{p.symbol}</TableCell>
                        <TableCell>
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${
                              p.side === "BUY"
                                ? "bg-success/15 text-success"
                                : "bg-destructive/15 text-destructive"
                            }`}
                          >
                            {p.side}
                          </span>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          {p.quantity.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          ${p.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-right">
                          ${p.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </TableCell>
                        <TableCell>
                          {isDupe ? (
                            <span className="text-[10px] text-warning flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" /> Duplicate
                            </span>
                          ) : (
                            <span className="text-[10px] text-success flex items-center gap-1">
                              <CheckCircle2 className="h-3 w-3" /> New
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            <div className="shrink-0 flex items-center justify-end gap-3 pt-3 border-t border-border/30">
              <Button variant="outline" size="sm" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={selected.size === 0 || importing}
                onClick={handleImport}
              >
                {importing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                ) : (
                  <Upload className="h-3.5 w-3.5 mr-1.5" />
                )}
                Import {selected.size} trade{selected.size !== 1 ? "s" : ""}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
