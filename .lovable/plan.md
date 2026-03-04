

# CryptoJournal — Crypto Trading Dashboard

A personal crypto trading journal that connects directly to the Crypto.com Exchange API to fetch, analyze, and display your trade history with detailed performance analytics.

## 1. Dashboard Overview (Home Page)
- **KPI Cards**: Total PnL, Win Rate, Total Trades, Best/Worst Trade, Average Trade Size
- **Equity Curve Chart**: Line chart showing cumulative PnL over time
- **Daily P&L Bar Chart**: Color-coded bars (green for profit, red for loss) showing daily performance
- Glassmorphism dark theme matching your original design aesthetic

## 2. Trade Log
- Full searchable & sortable table of all trades
- Columns: Date, Instrument, Side (Buy/Sell), Quantity, Price, Fees, PnL, Notes
- Filters by asset, side (buy/sell), date range, and profit/loss
- Color-coded rows for winning vs losing trades

## 3. Per-Asset Breakdown
- Performance cards for each coin (ETH, SOL, XRP, BTC, CRO, etc.)
- Per-asset stats: total PnL, trade count, win rate, average return
- Small sparkline charts per asset showing PnL trend

## 4. Capital Flow Tracking
- Overview of deposits, withdrawals, dusting, and rewards
- Summary cards showing totals for each flow type
- Table view of all capital flow events with dates and amounts

## 5. Crypto.com API Sync (Backend)
- Secure edge function that calls Crypto.com Exchange API using your API keys (stored as secrets)
- Fetches trades and transactions, processes them into the same structure as your Python script
- "Sync" button on the dashboard to pull latest data
- Data stored in a Supabase database for persistence (no login needed — single user)

## 6. Navigation & Layout
- Sidebar navigation: Dashboard, Trade Log, Assets, Capital Flows
- Dark theme with glassmorphism cards throughout
- Responsive layout that works on desktop and tablet

