import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileUp, ArrowRight, Check } from "lucide-react";

const TARGET_FIELDS = ["date", "instrument", "side", "quantity", "price", "fees", "pnl", "notes", "setup", "emotion", "-- skip --"] as const;

interface Props {
  open: boolean;
  onClose: () => void;
}

type Step = "upload" | "map" | "preview" | "done";

export default function CsvImportDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<Step>("upload");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<string[][]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});

  const reset = () => {
    setStep("upload");
    setHeaders([]);
    setRows([]);
    setMapping({});
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter(Boolean);
      if (lines.length < 2) return;
      const h = lines[0].split(",").map((s) => s.trim().replace(/^"|"$/g, ""));
      const r = lines.slice(1, 11).map((l) => l.split(",").map((s) => s.trim().replace(/^"|"$/g, "")));
      setHeaders(h);
      setRows(r);
      // Auto-map by name similarity
      const autoMap: Record<string, string> = {};
      h.forEach((hdr) => {
        const lower = hdr.toLowerCase();
        const match = TARGET_FIELDS.find((f) => lower.includes(f));
        if (match) autoMap[hdr] = match;
        else autoMap[hdr] = "-- skip --";
      });
      setMapping(autoMap);
      setStep("map");
    };
    reader.readAsText(file);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl border-border/50 bg-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileUp className="h-4 w-4 text-primary" />
            Import Trades from CSV
          </DialogTitle>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
          {(["upload", "map", "preview", "done"] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              {i > 0 && <ArrowRight className="h-3 w-3" />}
              <Badge variant={step === s ? "default" : "outline"} className="text-[10px]">
                {s === "upload" ? "1. Upload" : s === "map" ? "2. Map Columns" : s === "preview" ? "3. Preview" : "4. Done"}
              </Badge>
            </div>
          ))}
        </div>

        {step === "upload" && (
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="rounded-xl border-2 border-dashed border-border/60 p-8 text-center w-full hover:border-primary/40 transition-colors">
              <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">Drop your CSV file here or click to browse</p>
              <label>
                <input type="file" accept=".csv" onChange={handleFile} className="hidden" />
                <Button variant="outline" size="sm" className="text-xs" asChild>
                  <span>Choose File</span>
                </Button>
              </label>
            </div>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Map each CSV column to a trade field:</p>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {headers.map((h) => (
                <div key={h} className="flex items-center gap-2">
                  <span className="text-xs font-mono truncate w-28">{h}</span>
                  <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                  <Select value={mapping[h] || "-- skip --"} onValueChange={(v) => setMapping({ ...mapping, [h]: v })}>
                    <SelectTrigger className="h-7 text-xs bg-background flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TARGET_FIELDS.map((f) => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setStep("upload")}>
                Back
              </Button>
              <Button size="sm" className="text-xs" onClick={() => setStep("preview")}>
                Next: Preview
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">Preview of first {rows.length} rows:</p>
            <div className="overflow-auto max-h-[300px] rounded-lg border border-border/30">
              <Table>
                <TableHeader>
                  <TableRow className="border-border/30">
                    {headers.map((h) => mapping[h] !== "-- skip --" && (
                      <TableHead key={h} className="text-[10px] h-8 whitespace-nowrap">{mapping[h]}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className="border-border/20">
                      {row.map((cell, j) => mapping[headers[j]] !== "-- skip --" && (
                        <TableCell key={j} className="text-[10px] py-1.5 font-mono whitespace-nowrap">{cell}</TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setStep("map")}>
                Back
              </Button>
              <Button size="sm" className="text-xs gap-1" onClick={() => setStep("done")}>
                <Check className="h-3 w-3" /> Import {rows.length} trades
              </Button>
            </div>
          </div>
        )}

        {step === "done" && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="h-12 w-12 rounded-full bg-success/20 flex items-center justify-center">
              <Check className="h-6 w-6 text-success" />
            </div>
            <p className="text-sm font-medium">Import Complete (Mock)</p>
            <p className="text-xs text-muted-foreground text-center">
              In production, {rows.length} trades would be added to your journal.
              <br />Connect a backend to enable real imports.
            </p>
            <Button size="sm" className="text-xs" onClick={handleClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
