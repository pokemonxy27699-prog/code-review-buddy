import { NavLink, Outlet } from "react-router-dom";
import { LayoutDashboard, List, PieChart, ArrowUpDown, RefreshCw, CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/trades", icon: List, label: "Trade Log" },
  { to: "/assets", icon: PieChart, label: "Assets" },
  { to: "/capital", icon: ArrowUpDown, label: "Capital Flows" },
  { to: "/analytics", icon: CalendarDays, label: "Analytics" },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r border-border/40 bg-sidebar backdrop-blur-xl">
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
      </aside>

      {/* Main content */}
      <main className="ml-64 flex-1 p-6">
        <Outlet />
      </main>
    </div>
  );
}
