1. Patch the existing CSV parser to aggregate full Trade Match ID groups
- Keep `src/lib/csv-parser.ts` as the parser module.
- Change group parsing so each `Trade Match ID` is reduced from all rows in the group instead of assuming one crypto row plus one `USD_Stable_Coin` row.
- Within each group:
  - collect all non-USD rows for the traded crypto symbol
  - collect all `USD_Stable_Coin`/`USD` rows for quote value
  - sum absolute crypto `Transaction Quantity` for total quantity
  - sum absolute USD stable coin quantity for total gross trade value
  - compute weighted execution price as `totalUsdValue / totalCryptoQty`
- Keep the current skip-3-lines behavior and current OEX header validation.
- If a group has no crypto rows, zero quantity, or multiple crypto symbols, skip it with a parse warning.

2. Tighten side handling and warnings
- Derive side only from the grouped crypto rows.
- Normalize and validate side values strictly to `BUY` or `SELL`.
- If grouped crypto rows contain blank/invalid sides or inconsistent BUY/SELL values within the same group, skip that group and add a warning message.
- Do not fall back to dummy values or invalid `Taker Side` values.
- Preserve the existing modal warning UI, but feed it more precise parser warnings so the user can see why rows were skipped.

3. Add fee extraction to parsed trade data
- Extend `ParsedCsvTrade` to include aggregated fee data.
- Detect fee rows/amounts from the same grouped rows when present in the export.
- Prefer a parser strategy that keeps fee detection conservative:
  - include rows that clearly represent fee legs or non-principal cost inside the group
  - avoid double-counting the principal USD settlement rows already used for trade value
- Save aggregated fees on the resulting `Trade` object; if no fee is found, keep `fees = 0`.
- Preserve `tradeMatchId`, `orderId`, and `source: "crypto_com_csv"` on each normalized trade.

4. Recompute FIFO P&L on the full stored Crypto.com ledger
- Keep `src/lib/fifo-pnl.ts` as the FIFO module.
- Update FIFO input/output so the engine can use the aggregated parsed rows, including fees.
- Recompute FIFO over the full merged Crypto.com ledger:
  - existing stored `crypto_com_csv` trades converted back into parsed form
  - newly selected parsed trades from the current import
  - sorted chronologically before matching
- Continue matching by symbol only and FIFO within the same symbol.
- Apply fees to realized P&L where possible, so sell-side realized P&L reflects execution costs instead of always using raw proceeds minus cost basis.

5. Persist recalculated P&L back into existing stored CSV trades
- Patch the current import/save flow instead of redesigning it.
- The current gap is that `CsvImportModal` computes a full-ledger FIFO map but only sends newly selected trades to `onImport`, so existing stored CSV trades never receive the updated `pnl` values.
- Change the import callback contract so the modal returns all affected normalized CSV trades after recomputation, not only the new rows.
- In `TradeLog.tsx`, persist the recalculated set back into storage:
  - create new rows for newly imported IDs
  - update existing stored CSV rows when the same `csv-{tradeMatchId}` already exists
- Keep local duplicate prevention stable by preserving `csv-{tradeMatchId}` IDs and keeping `tradeMatchId`/`orderId` on every stored row.
- If API mode is active, use the existing update path for already-existing rows rather than relying on create-only behavior.

6. Preserve current UI behavior and compatibility
- Keep the current `CsvImportModal` layout and flow.
- Keep duplicate detection based on `Trade Match ID`, with `Order ID` as backup.
- Keep current Trade Log, dashboard analytics, filters, and trade detail UI working off the same `Trade` shape.
- Do not reintroduce mock/demo seeding; imported real trades remain the source data.

Technical details
- Files to patch:
  - `src/lib/csv-parser.ts`
  - `src/lib/fifo-pnl.ts`
  - `src/components/trade-log/CsvImportModal.tsx`
  - `src/pages/TradeLog.tsx`
  - possibly `src/store/trades.ts` if the existing upsert path needs a small adjustment for full-ledger CSV updates
- Data model changes:
  - extend `ParsedCsvTrade` with `fees`
  - make `tradeToParsedCsvTrade()` round-trip `fees` back into FIFO input
  - make `csvTradesToAppTrades()` persist `fees` and recomputed `pnl`
- Expected result:
  - one normalized trade per `Trade Match ID`
  - grouped partial fills aggregate correctly
  - no invalid BUY/SELL values
  - fees are stored when present
  - re-importing overlapping files does not duplicate rows
  - previously imported CSV sells get refreshed realized P&L after later imports complete the ledger history