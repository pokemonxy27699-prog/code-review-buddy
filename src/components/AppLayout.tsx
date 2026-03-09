import { useState, useEffect } from "react";
import { NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, List, PieChart, ArrowUpDown, CalendarDays, BarChart3, BookOpen, RefreshCw, Menu, Settings, Calendar as CalendarIcon, NotebookPen, Lightbulb, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { useFilters, getActivePreset, getDatePresetRange, DatePreset } from "@/store/trades";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/trades", icon: List, label: "Trade Log" },
  { to: "/assets", icon: PieChart, label: "Assets" },
  { to: "/capital", icon: ArrowUpDown, label: "Capital Flows" },
  { to: "/analytics", icon: CalendarDays, label: "Analytics" },
  { to: "/reports", icon: BarChart3, label: "Reports" },
  { to: "/journal", icon: NotebookPen, label: "Daily Journal" },
  { to: "/plans", icon: BookOpen, label: "Trading Plans" },
  { to: "/insights", icon: Lightbulb, label: "Insights" },
  { to: "/settings", icon: Settings, label: "Settings" },
];

const DATE_PRESETS: DatePreset[] = ["7D", "30D", "90D", "YTD", "ALL"];

function DatePresetBar() {
  const { filters, setFilters } = useFilters();
  const activePreset = getActivePreset(filters);
  const [customOpen, setCustomOpen] = useState(false);

  const fromDate = filters.dateFrom ? new Date(filters.dateFrom + "T00:00:00") : undefined;
  const toDate = filters.dateTo ? new Date(filters.dateTo + "T00:00:00") : undefined;

  const handlePreset = (p: DatePreset) => {
    const range = getDatePresetRange(p);
    setFilters({ ...filters, ...range });
  };

  const isCustom = !activePreset && (filters.dateFrom || filters.dateTo);

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {DATE_PRESETS.map((p) => (
        <button
          key={p}
          onClick={() => handlePreset(p)}
          className={cn(
            "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
            activePreset === p
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          )}
        >
          {p}
        </button>
      ))}
      <Popover open={customOpen} onOpenChange={setCustomOpen}>
        <PopoverTrigger asChild>
          <button
            className={cn(
              "flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              isCustom
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            )}
          >
            <CalendarIcon className="h-3 w-3" />
            {isCustom && fromDate
              ? `${format(fromDate, "MMM d")}${toDate ? ` – ${format(toDate, "MMM d")}` : ""}`
              : "Custom"}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 text-xs text-muted-foreground font-medium">Select date range</div>
          <div className="flex flex-col sm:flex-row">
            <div className="border-r border-border/50">
              <div className="px-3 pb-1 text-[10px] text-muted-foreground uppercase tracking-wider">From</div>
              <Calendar
                mode="single"
                selected={fromDate}
                onSelect={(d) => {
                  setFilters({ ...filters, dateFrom: d ? d.toISOString().slice(0, 10) : "" });
                }}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
            <div>
              <div className="px-3 pb-1 text-[10px] text-muted-foreground uppercase tracking-wider">To</div>
              <Calendar
                mode="single"
                selected={toDate}
                onSelect={(d) => {
                  setFilters({ ...filters, dateTo: d ? d.toISOString().slice(0, 10) : "" });
                }}
                className={cn("p-3 pointer-events-auto")}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

function SidebarContent({ onNavClick }: { onNavClick?: () => void }) {
  return (
    <>
      <div className="flex h-16 items-center gap-2 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
          <span className="text-lg font-bold text-primary glow-text">C</span>
        </div>
        <span className="text-lg font-bold tracking-tight text-foreground">CryptoJournal</span>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            onClick={onNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-border/40 p-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary/10"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Sync Trades
        </Button>
      </div>
    </>
  );
}

export default function AppLayout() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const handler = () => {
      if (mql.matches) setOpen(false);
    };
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 z-40 h-screen w-64 flex-col border-r border-border/40 bg-sidebar backdrop-blur-xl">
        <SidebarContent />
      </aside>

      {/* Mobile sheet sidebar */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r border-border/40">
          <VisuallyHidden>
            <SheetTitle>Navigation</SheetTitle>
          </VisuallyHidden>
          <div className="flex h-full flex-col">
            <SidebarContent onNavClick={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar with date presets */}
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border/40 bg-background/80 backdrop-blur-md px-4 lg:px-6 h-12">
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2 lg:hidden shrink-0">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/20">
              <span className="text-sm font-bold text-primary glow-text">C</span>
            </div>
          </div>
          <div className="flex-1 overflow-x-auto scrollbar-none">
            <DatePresetBar />
          </div>
        </header>

        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
