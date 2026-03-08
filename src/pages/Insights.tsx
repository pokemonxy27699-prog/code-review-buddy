import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFilters, useTrades } from "@/store/trades";
import {
  generateCoachingCards,
  generateRecommendations,
  compareSetups,
  compareWinVsLoss,
  compareMistakeVsClean,
  CompareResult,
} from "@/lib/insights";
import {
  getPnlBySetup,
  getMistakeAnalysis,
  getPnlByDayOfWeek,
  getPnlByHour,
  getKPIs,
} from "@/lib/analytics";
import { SETUPS } from "@/lib/types";
import {
  Trophy,
  AlertTriangle,
  Clock,
  Calendar,
  Brain,
  Target,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Zap,
  GitCompareArrows,
  AlertCircle,
  BarChart3,
  Lightbulb,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";

const ICON_MAP = {
  trophy: Trophy,
  alert: AlertTriangle,
  clock: Clock,
  calendar: Calendar,
  brain: Brain,
  target: Target,
};

const SENTIMENT_CLASSES = {
  positive: "border-[hsl(var(--success))]/30 bg-[hsl(var(--success))]/5",
  negative: "border-destructive/30 bg-destructive/5",
  neutral: "border-border bg-card",
};

const IMPACT_BADGE = {
  high: "bg-destructive/10 text-destructive border-destructive/30",
  medium: "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30",
  low: "bg-muted text-muted-foreground border-border",
};

export default function Insights() {
  const { filters } = useFilters();
  const { data: trades = [], isLoading, isError } = useTrades(filters);
  const navigate = useNavigate();

  const coachingCards = useMemo(() => generateCoachingCards(trades), [trades]);
  const recommendations = useMemo(() => generateRecommendations(trades), [trades]);
  const setups = useMemo(() => getPnlBySetup(trades), [trades]);
  const mistakes = useMemo(() => getMistakeAnalysis(trades), [trades]);
  const dayOfWeek = useMemo(() => getPnlByDayOfWeek(trades), [trades]);
  const hourly = useMemo(() => getPnlByHour(trades).filter(h => h.count > 0), [trades]);
  const kpis = useMemo(() => getKPIs(trades), [trades]);

  const drilldown = (params: Record<string, string>) => {
    const sp = new URLSearchParams(params);
    navigate(`/trades?${sp.toString()}`);
  };

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 py-20 text-destructive">
        <AlertCircle className="h-10 w-10" />
        <p className="text-sm font-medium">Failed to load trades.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Insights</h1>
        <p className="text-sm text-muted-foreground">
          Data-driven coaching to improve your trading
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="glass-card p-5 space-y-3">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      ) : trades.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center gap-2 py-16 text-muted-foreground">
          <BarChart3 className="h-10 w-10" />
          <p className="text-sm font-medium">No trades match current filters</p>
        </div>
      ) : (
        <>
          {/* Coaching Cards */}
          {coachingCards.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Zap className="h-4 w-4 text-primary" />
                <h2 className="text-sm font-semibold">Coaching Insights</h2>
              </div>
              <div className="grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {coachingCards.map((card) => {
                  const Icon = ICON_MAP[card.icon];
                  return (
                    <div
                      key={card.id}
                      className={`rounded-xl border p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md ${SENTIMENT_CLASSES[card.sentiment]}`}
                      onClick={() => drilldown(card.drilldown)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5 shrink-0">
                          <Icon
                            className={`h-5 w-5 ${
                              card.sentiment === "positive"
                                ? "text-[hsl(var(--success))]"
                                : card.sentiment === "negative"
                                ? "text-destructive"
                                : "text-muted-foreground"
                            }`}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-tight">{card.title}</p>
                          <p className="mt-1 text-xs text-muted-foreground">{card.detail}</p>
                        </div>
                        <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50 mt-0.5" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Recommendations */}
          {recommendations.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="h-4 w-4 text-[hsl(var(--warning))]" />
                <h2 className="text-sm font-semibold">Actionable Recommendations</h2>
              </div>
              <div className="space-y-2">
                {recommendations.map((rec) => (
                  <div
                    key={rec.id}
                    className="glass-card-hover flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => drilldown(rec.drilldown)}
                  >
                    <Badge
                      variant="outline"
                      className={`shrink-0 text-[10px] uppercase tracking-wider ${IMPACT_BADGE[rec.impact]}`}
                    >
                      {rec.impact}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{rec.action}</p>
                      <p className="text-xs text-muted-foreground">{rec.reason}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Breakdown Charts */}
          <Tabs defaultValue="setups" className="space-y-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Breakdowns</h2>
            </div>
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="setups">Setups</TabsTrigger>
              <TabsTrigger value="mistakes">Mistakes</TabsTrigger>
              <TabsTrigger value="days">Day of Week</TabsTrigger>
              <TabsTrigger value="hours">Time of Day</TabsTrigger>
            </TabsList>

            <TabsContent value="setups">
              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart
                  title="P&L by Setup"
                  data={setups.map((s) => ({ name: s.setup, value: s.pnl }))}
                  onBarClick={(name) => drilldown({ setup: name })}
                />
                <BreakdownTable
                  headers={["Setup", "Trades", "Win%", "Avg P&L", "Net P&L"]}
                  rows={setups.map((s) => ({
                    key: s.setup,
                    cells: [s.setup, s.count, `${s.winRate}%`, `$${s.avgPnl}`, `$${s.pnl.toLocaleString()}`],
                    pnl: s.pnl,
                    onClick: () => drilldown({ setup: s.setup }),
                  }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="mistakes">
              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart
                  title="Cost by Mistake"
                  data={mistakes.map((m) => ({ name: m.mistake, value: m.pnl }))}
                  onBarClick={(name) => drilldown({ mistake: name })}
                />
                <BreakdownTable
                  headers={["Mistake", "Count", "Avg P&L", "Net P&L"]}
                  rows={mistakes.map((m) => ({
                    key: m.mistake,
                    cells: [m.mistake, m.count, `$${m.avgPnl}`, `$${m.pnl.toLocaleString()}`],
                    pnl: m.pnl,
                    onClick: () => drilldown({ mistake: m.mistake }),
                  }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="days">
              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart
                  title="P&L by Day of Week"
                  data={dayOfWeek.map((d) => ({ name: d.day, value: d.pnl }))}
                />
                <BreakdownTable
                  headers={["Day", "Trades", "Win%", "Net P&L"]}
                  rows={dayOfWeek.filter(d => d.count > 0).map((d) => ({
                    key: d.day,
                    cells: [d.day, d.count, `${d.winRate}%`, `$${d.pnl.toLocaleString()}`],
                    pnl: d.pnl,
                  }))}
                />
              </div>
            </TabsContent>

            <TabsContent value="hours">
              <div className="grid gap-6 lg:grid-cols-2">
                <BreakdownChart
                  title="P&L by Hour"
                  data={hourly.map((h) => ({ name: h.hour, value: h.pnl }))}
                />
                <BreakdownTable
                  headers={["Hour", "Trades", "Net P&L"]}
                  rows={hourly.map((h) => ({
                    key: h.hour,
                    cells: [h.hour, h.count, `$${h.pnl.toLocaleString()}`],
                    pnl: h.pnl,
                  }))}
                />
              </div>
            </TabsContent>
          </Tabs>

          {/* Compare Mode */}
          <CompareSection trades={trades} />
        </>
      )}
    </div>
  );
}

/* ─── Breakdown Chart ─── */
function BreakdownChart({
  title,
  data,
  onBarClick,
}: {
  title: string;
  data: { name: string; value: number }[];
  onBarClick?: (name: string) => void;
}) {
  return (
    <div className="glass-card p-5">
      <h3 className="mb-4 text-sm font-semibold">{title}</h3>
      <ChartContainer
        config={{ value: { label: "P&L", color: "hsl(var(--primary))" } }}
        className="h-[260px] w-full"
      >
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(225 15% 20%)" />
          <XAxis
            dataKey="name"
            tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fill: "hsl(215 15% 55%)", fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Bar
            dataKey="value"
            radius={[4, 4, 0, 0]}
            cursor={onBarClick ? "pointer" : undefined}
            onClick={(d: any) => onBarClick?.(d.name)}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={
                  entry.value >= 0
                    ? "hsl(var(--chart-profit))"
                    : "hsl(var(--chart-loss))"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}

/* ─── Breakdown Table ─── */
function BreakdownTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: {
    key: string;
    cells: (string | number)[];
    pnl: number;
    onClick?: () => void;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <div className="glass-card flex items-center justify-center p-10 text-sm text-muted-foreground">
        No data
      </div>
    );
  }
  return (
    <div className="glass-card p-5">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/50 text-left text-xs text-muted-foreground">
              {headers.map((h) => (
                <th key={h} className="pb-2 font-medium last:text-right">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/30">
            {rows.map((row) => (
              <tr
                key={row.key}
                className={`hover:bg-card/40 ${row.onClick ? "cursor-pointer" : ""}`}
                onClick={row.onClick}
              >
                {row.cells.map((cell, i) => (
                  <td
                    key={i}
                    className={`py-2.5 font-mono text-xs ${
                      i === row.cells.length - 1
                        ? `text-right font-semibold ${
                            row.pnl >= 0
                              ? "text-[hsl(var(--success))]"
                              : "text-destructive"
                          }`
                        : i === 0
                        ? "font-medium font-sans"
                        : "text-muted-foreground"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ─── Compare Section ─── */
type CompareMode = "setup" | "winloss" | "mistakes" | "month";

function CompareSection({ trades }: { trades: import("@/lib/types").Trade[] }) {
  const [mode, setMode] = useState<CompareMode>("winloss");
  const [setupA, setSetupA] = useState<string>(SETUPS[0]);
  const [setupB, setSetupB] = useState<string>(SETUPS[1]);

  const uniqueSetups = useMemo(() => {
    const s = new Set(trades.map(t => t.setup).filter(Boolean));
    return Array.from(s) as string[];
  }, [trades]);

  const uniqueMonths = useMemo(() => {
    const m = new Set(trades.map(t => t.date.slice(0, 7)));
    return Array.from(m).sort().reverse();
  }, [trades]);

  const [monthA, setMonthA] = useState("");
  const [monthB, setMonthB] = useState("");

  // Set defaults for months
  useMemo(() => {
    if (uniqueMonths.length >= 2 && !monthA) {
      setMonthA(uniqueMonths[0]);
      setMonthB(uniqueMonths[1]);
    } else if (uniqueMonths.length === 1 && !monthA) {
      setMonthA(uniqueMonths[0]);
      setMonthB(uniqueMonths[0]);
    }
  }, [uniqueMonths]); // eslint-disable-line

  const result: CompareResult | null = useMemo(() => {
    if (trades.length === 0) return null;
    switch (mode) {
      case "setup":
        return uniqueSetups.length >= 2
          ? compareSetups(trades, setupA, setupB)
          : null;
      case "winloss":
        return compareWinVsLoss(trades);
      case "mistakes":
        return compareMistakeVsClean(trades);
      default:
        return null;
    }
  }, [mode, trades, setupA, setupB, uniqueSetups]);

  const metrics = result
    ? [
        { label: "Trades", a: result.a.count, b: result.b.count },
        { label: "Win Rate", a: `${result.a.winRate}%`, b: `${result.b.winRate}%` },
        { label: "Net P&L", a: `$${result.a.pnl.toLocaleString()}`, b: `$${result.b.pnl.toLocaleString()}`, aNum: result.a.pnl, bNum: result.b.pnl },
        { label: "Avg P&L", a: `$${result.a.avgPnl}`, b: `$${result.b.avgPnl}`, aNum: result.a.avgPnl, bNum: result.b.avgPnl },
        { label: "Profit Factor", a: result.a.profitFactor, b: result.b.profitFactor },
      ]
    : [];

  return (
    <section>
      <div className="flex items-center gap-2 mb-3">
        <GitCompareArrows className="h-4 w-4 text-accent" />
        <h2 className="text-sm font-semibold">Compare Mode</h2>
      </div>

      <div className="glass-card p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <Select value={mode} onValueChange={(v) => setMode(v as CompareMode)}>
            <SelectTrigger className="w-44 h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="winloss">Winners vs Losers</SelectItem>
              <SelectItem value="mistakes">Mistakes vs Clean</SelectItem>
              <SelectItem value="setup">Setup vs Setup</SelectItem>
            </SelectContent>
          </Select>

          {mode === "setup" && uniqueSetups.length >= 2 && (
            <>
              <Select value={setupA} onValueChange={setSetupA}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSetups.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="text-xs text-muted-foreground">vs</span>
              <Select value={setupB} onValueChange={setSetupB}>
                <SelectTrigger className="w-36 h-9 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {uniqueSetups.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </>
          )}
        </div>

        {result ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50 text-xs text-muted-foreground">
                  <th className="pb-2 font-medium text-left">Metric</th>
                  <th className="pb-2 font-medium text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {result.labelA}
                    </span>
                  </th>
                  <th className="pb-2 font-medium text-right">
                    <span className="inline-flex items-center gap-1">
                      <span className="h-2 w-2 rounded-full bg-accent" />
                      {result.labelB}
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {metrics.map((m) => (
                  <tr key={m.label} className="hover:bg-card/40">
                    <td className="py-2.5 text-sm font-medium">{m.label}</td>
                    <td className={`py-2.5 text-right font-mono text-xs font-semibold ${
                      m.aNum !== undefined ? (m.aNum >= 0 ? "text-[hsl(var(--success))]" : "text-destructive") : ""
                    }`}>
                      {m.a}
                    </td>
                    <td className={`py-2.5 text-right font-mono text-xs font-semibold ${
                      m.bNum !== undefined ? (m.bNum >= 0 ? "text-[hsl(var(--success))]" : "text-destructive") : ""
                    }`}>
                      {m.b}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 text-center">
            {mode === "setup" && uniqueSetups.length < 2
              ? "Need at least 2 different setups to compare"
              : "No data to compare"}
          </p>
        )}
      </div>
    </section>
  );
}
