import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trade } from "@/lib/mock-data";
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
import { useState, useCallback } from "react";

// ── Global filter state (simple module-level singleton) ──
let _filters: TradeFilters = { ...DEFAULT_FILTERS };
let _listeners: Array<() => void> = [];

function notifyListeners() {
  _listeners.forEach((l) => l());
}

export function useFilters() {
  const [, rerender] = useState(0);

  const subscribe = useCallback(() => {
    const cb = () => rerender((n) => n + 1);
    _listeners.push(cb);
    return () => {
      _listeners = _listeners.filter((l) => l !== cb);
    };
  }, []);

  // Subscribe on mount
  useState(() => {
    const unsub = subscribe();
    return unsub;
  });

  const setFilters = useCallback((f: TradeFilters) => {
    _filters = f;
    notifyListeners();
  }, []);

  return { filters: _filters, setFilters };
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
      // Mock fallback
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
      // Mock: add to localStorage
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
