

## TradeZella-Level Upgrade Plan

### Current State Summary

The app already has:
- `src/lib/analytics.ts` with pure functions (KPIs, equity curve, drawdown, heatmap, breakdowns)
- `src/store/trades.ts` with `useFilters()` (URL-synced) and `useTrades(filters)` hooks
- Dashboard, Analytics, Reports already use `useFilters()` + `useTrades()` -- no direct `mockTrades` imports on those pages
- `src/lib/mock-data.ts` still exports `mockTrades`, but it's only consumed as fallback seed in `trade-store.ts`

**Remaining issues to fix:**
- `Trade` type is still imported from `@/lib/mock-data` everywhere (11 files) -- should come from a dedicated types file
- `Assets.tsx` directly imports `mockAssetSummaries`
- `CapitalFlows.tsx` directly imports `mockCapitalFlows`  
- `TradingPlans.tsx` directly imports `mockTradingPlans`
- `lib/mock-data.ts` has duplicate analytics functions (same as `analytics.ts`) -- dead code
- No click-to-filter drilldowns from Dashboard/Reports charts
- No Tag Manager in Settings
- Dashboard missing "Top Setups" and "Top Mistakes" mini tables
- Dashboard missing calendar heatmap widget

---

### Plan

#### 1. Extract `Trade` type to `src/lib/types.ts`

Create `src/lib/types.ts` with the `Trade`, `Setup`, `Emotion`, `Mistake` types and constants (SETUPS, EMOTIONS, MISTAKES). Update all 11 files that import from `mock-data` to import types from `types.ts` instead. Keep `mock-data.ts` only as a generator that imports types from `types.ts`.

#### 2. Remove direct mock imports from pages

- **Assets.tsx**: Refactor to use `useTrades(filters)` and compute asset summaries from trades via a new `getAssetSummaries(trades)` function in `analytics.ts`.
- **CapitalFlows.tsx**: Convert to use a `useCapitalFlows()` hook (API-ready with localStorage fallback, seeded from mock data). Or simpler: show an empty/placeholder state with a note that capital flows require API.
- **TradingPlans.tsx**: Convert to `useTradingPlans()` hook with localStorage persistence + API fallback (same pattern as trades).

#### 3. Clean up `mock-data.ts`

Remove all duplicated analytics functions from `mock-data.ts` (they already exist in `analytics.ts`). Keep only the data generators and type exports (now re-exported from `types.ts`).

#### 4. Click-to-filter drilldowns

Add navigation helpers that set filters and navigate to `/trades`:

- **Dashboard KPI cards**: Make each card clickable. E.g., "Win Rate" navigates to `/trades?pnl=profit`, "Worst Trade" navigates to `/trades?pnl=loss`.
- **Reports charts**: Clicking a bar in "P&L by Setup" navigates to `/trades?setup=Breakout`. Same for "P&L by Day of Week", emotion bars, and mistake cards.
- **Dashboard "Top Setups" / "Top Mistakes" rows**: Clickable rows that drill into TradeLog filtered by that setup/mistake.

Implementation: use `useNavigate()` + `filtersToParams()` to build URLs. Wrap chart bars/table rows with `onClick`.

#### 5. Dashboard enhancements

Add two new sections below the existing charts:

- **Calendar heatmap widget**: Reuse the heatmap component from Analytics page (extract into a shared `CalendarHeatmap` component in `src/components/CalendarHeatmap.tsx`).
- **"Top Setups" mini table**: Show top 5 setups by P&L with count, win rate, total P&L. Each row clickable (drilldown).
- **"Top Mistakes" mini table**: Show top 5 costliest mistakes. Each row clickable.

Both use data from `getPnlBySetup()` and `getMistakeAnalysis()` from `analytics.ts`.

#### 6. Tag Manager in Settings

Add a "Tag Manager" section below the API Connection card in Settings:

- Three columns: Setups, Emotions, Mistakes
- Each shows the current tag list with inline add/rename/delete
- Uses `useTags()` and `useUpdateTags()` hooks (already exist in store)
- Simple UI: list items with edit/delete icons, input + "Add" button at bottom

#### 7. Quality & consistency pass

- Ensure all pages use consistent skeleton loading, error states, and empty states (matching TradeLog style)
- Calendar heatmap extracted as shared component (used by both Dashboard and Analytics)
- Mobile: verify charts stack vertically, tables scroll horizontally

---

### Files to create
- `src/lib/types.ts` -- Trade type + constants
- `src/components/CalendarHeatmap.tsx` -- extracted from Analytics

### Files to edit
- `src/lib/mock-data.ts` -- remove duplicate analytics, import types from types.ts
- `src/lib/analytics.ts` -- add `getAssetSummaries()`, import from types.ts
- `src/lib/trade-store.ts` -- import from types.ts
- `src/services/api.ts` -- import from types.ts
- `src/store/trades.ts` -- import from types.ts, add useTradingPlans/useCapitalFlows hooks
- `src/pages/Dashboard.tsx` -- add heatmap widget, top setups/mistakes tables, click-to-filter on KPIs
- `src/pages/Analytics.tsx` -- use shared CalendarHeatmap component
- `src/pages/Reports.tsx` -- add click-to-filter on chart bars and table rows
- `src/pages/Assets.tsx` -- use useTrades + getAssetSummaries
- `src/pages/CapitalFlows.tsx` -- use localStorage-backed hook
- `src/pages/TradingPlans.tsx` -- use localStorage-backed hook
- `src/pages/Settings.tsx` -- add Tag Manager section
- `src/pages/TradeLog.tsx` -- import Trade from types.ts
- `src/components/trade-log/TradeDetailDrawer.tsx` -- import from types.ts, use useTags() hook
- `src/components/trade-log/FilterBar.tsx` -- import from types.ts

