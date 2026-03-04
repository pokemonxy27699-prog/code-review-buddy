import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trade } from "@/lib/types";
import {
  TradeFilters,
  DEFAULT_FILTERS,
  loadTrades,
  saveTrades,
  updateTrade as updateTradeLocal,
  loadTagCategories,
  saveTagCategories,
  TagCategories,
  applyFilters,
} from "@/lib/trade-store";
import {
  isApiConfigured,
  getTrades as apiGetTrades,
  updateTradeApi,
  createTrade as apiCreateTrade,
  deleteTrade as apiDeleteTrade,
  getTags as apiGetTags,
  updateTagsApi,
  CreateTradePayload,
} from "@/services/api";
import { useState, useCallback, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";

// ── URL ↔ Filter serialization ──
const FILTER_PARAMS: Record<string, keyof TradeFilters> = {
  from: "dateFrom",
  to: "dateTo",
  q: "search",
  symbol: "symbol",
  side: "side",
  setup: "setup",
  emotion: "emotion",
  mistake: "mistake",
  pnl: "pnl",
  account: "account",
};

function filtersToParams(f: TradeFilters): URLSearchParams {
  const p = new URLSearchParams();
  for (const [param, key] of Object.entries(FILTER_PARAMS)) {
    const val = f[key];
    const def = DEFAULT_FILTERS[key];
    if (val && val !== def) p.set(param, val);
  }
  return p;
}

function paramsToFilters(p: URLSearchParams): Partial<TradeFilters> {
  const partial: Partial<TradeFilters> = {};
  for (const [param, key] of Object.entries(FILTER_PARAMS)) {
    const val = p.get(param);
    if (val) (partial as any)[key] = val;
  }
  return partial;
}

// ── Global filter state (simple module-level singleton) ──
let _filters: TradeFilters = { ...DEFAULT_FILTERS };
let _listeners: Array<() => void> = [];
let _initialized = false;

function notifyListeners() {
  _listeners.forEach((l) => l());
}

export function setGlobalFilters(f: TradeFilters) {
  _filters = f;
  notifyListeners();
}

export function getGlobalFilters() {
  return _filters;
}

export function useFilters() {
  const [, rerender] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Subscribe to global state
  useEffect(() => {
    const cb = () => rerender((n) => n + 1);
    _listeners.push(cb);
    return () => {
      _listeners = _listeners.filter((l) => l !== cb);
    };
  }, []);

  // Hydrate from URL on first mount (only once globally)
  useEffect(() => {
    if (_initialized) return;
    _initialized = true;
    const fromUrl = paramsToFilters(searchParams);
    if (Object.keys(fromUrl).length > 0) {
      _filters = { ...DEFAULT_FILTERS, ...fromUrl };
      notifyListeners();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync filters → URL (debounced)
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const newParams = filtersToParams(_filters);
      const currentStr = searchParams.toString();
      const newStr = newParams.toString();
      if (currentStr !== newStr) {
        setSearchParams(newParams, { replace: true });
      }
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [_filters, setSearchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Listen to popstate (back/forward) to restore filters from URL
  useEffect(() => {
    const handler = () => {
      const params = new URLSearchParams(window.location.search);
      const fromUrl = paramsToFilters(params);
      const restored = { ...DEFAULT_FILTERS, ...fromUrl };
      if (JSON.stringify(restored) !== JSON.stringify(_filters)) {
        _filters = restored;
        notifyListeners();
      }
    };
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, []);

  const setFilters = useCallback((f: TradeFilters) => {
    _filters = f;
    notifyListeners();
  }, []);

  return { filters: _filters, setFilters };
}

// ── Date preset helper ──
export type DatePreset = "7D" | "30D" | "90D" | "YTD" | "ALL";

export function getDatePresetRange(preset: DatePreset): { dateFrom: string; dateTo: string } {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  if (preset === "ALL") return { dateFrom: "", dateTo: "" };
  if (preset === "YTD") return { dateFrom: `${now.getFullYear()}-01-01`, dateTo: to };
  const days = preset === "7D" ? 7 : preset === "30D" ? 30 : 90;
  const from = new Date(now.getTime() - days * 86400000);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to };
}

export function getActivePreset(filters: TradeFilters): DatePreset | null {
  for (const p of ["7D", "30D", "90D", "YTD", "ALL"] as DatePreset[]) {
    const range = getDatePresetRange(p);
    if (filters.dateFrom === range.dateFrom && filters.dateTo === range.dateTo) return p;
  }
  return null;
}

// ── Trades hook ──
export function useTrades(filters: TradeFilters) {
  const apiMode = isApiConfigured();

  return useQuery<Trade[]>({
    queryKey: ["trades", filters, apiMode],
    queryFn: async () => {
      if (apiMode) {
        return apiGetTrades(filters);
      }
      const all = loadTrades();
      return applyFilters(all, filters);
    },
    staleTime: apiMode ? 30_000 : Infinity,
  });
}

// ── Update trade ──
export function useUpdateTrade() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<Trade> }) => {
      if (isApiConfigured()) {
        return updateTradeApi(id, patch);
      }
      updateTradeLocal(id, patch);
      return { id, ...patch } as Trade;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

// ── Create trade ──
export function useCreateTrade() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTradePayload) => {
      if (isApiConfigured()) {
        return apiCreateTrade(payload);
      }
      const trades = loadTrades();
      const newTrade: Trade = { ...payload, id: `t-${Date.now()}` };
      trades.unshift(newTrade);
      saveTrades(trades);
      return newTrade;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

// ── Delete trade ──
export function useDeleteTrade() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (isApiConfigured()) {
        return apiDeleteTrade(id);
      }
      const trades = loadTrades().filter((t) => t.id !== id);
      saveTrades(trades);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
    },
  });
}

// ── Tags ──
export function useTags() {
  return useQuery<TagCategories>({
    queryKey: ["tags", isApiConfigured()],
    queryFn: async () => {
      if (isApiConfigured()) return apiGetTags();
      return loadTagCategories();
    },
    staleTime: Infinity,
  });
}

export function useUpdateTags() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (tags: TagCategories) => {
      if (isApiConfigured()) return updateTagsApi(tags);
      saveTagCategories(tags);
      return tags;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}
