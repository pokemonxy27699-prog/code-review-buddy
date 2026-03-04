import { useState, useMemo, useEffect } from "react";
import { CapitalFlow, TradingPlan } from "@/lib/types";
import { mockCapitalFlows } from "@/lib/mock-data";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowDownLeft, ArrowUpRight, Sparkles, Gift } from "lucide-react";

const STORAGE_KEY = "capital-flows";

function loadCapitalFlows(): CapitalFlow[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  const flows = [...mockCapitalFlows];
  localStorage.setItem(STORAGE_KEY, JSON.stringify(flows));
  return flows;
}

const typeConfig = {
  deposit: { icon: ArrowDownLeft, label: "Deposit", color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success)/0.12)]" },
  withdrawal: { icon: ArrowUpRight, label: "Withdrawal", color: "text-destructive", bg: "bg-destructive/12" },
  dusting: { icon: Sparkles, label: "Dusting", color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning)/0.12)]" },
  reward: { icon: Gift, label: "Reward", color: "text-[hsl(var(--accent))]", bg: "bg-accent/12" },
};

export default function CapitalFlows() {
  const [flows] = useState<CapitalFlow[]>(loadCapitalFlows);

  const summaries = useMemo(() => {
    const sums = { deposit: 0, withdrawal: 0, dusting: 0, reward: 0 };
    flows.forEach((f) => (sums[f.type] += f.usdValue));
    return Object.entries(sums).map(([type, total]) => ({
      type: type as keyof typeof typeConfig,
      total,
      count: flows.filter((f) => f.type === type).length,
    }));
  }, [flows]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Capital Flows</h1>
        <p className="text-sm text-muted-foreground">Deposits, withdrawals, dusting & rewards</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaries.map((s) => {
          const cfg = typeConfig[s.type];
          return (
            <div key={s.type} className="glass-card p-4">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <cfg.icon className={`h-4 w-4 ${cfg.color}`} />
                </div>
                <span className="text-sm font-medium text-muted-foreground">{cfg.label}</span>
              </div>
              <p className={`mt-2 font-mono text-xl font-bold ${cfg.color}`}>${s.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
              <p className="text-xs text-muted-foreground">{s.count} events</p>
            </div>
          );
        })}
      </div>

      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-right">USD Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {flows.map((f) => {
                const cfg = typeConfig[f.type];
                return (
                  <TableRow key={f.id} className="border-border/30">
                    <TableCell className="font-mono text-xs text-muted-foreground">{new Date(f.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${cfg.bg} ${cfg.color}`}>
                        <cfg.icon className="h-3 w-3" />
                        {cfg.label}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{f.asset}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{f.amount}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-semibold ${cfg.color}`}>${f.usdValue.toLocaleString()}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
