import { Trade } from "@/lib/types";
import { TradeFilters } from "@/lib/trade-store";
import { TagCategories } from "@/lib/trade-store";

// ── API config ──
const API_BASE_URL_KEY = "api-base-url";

export function getApiBaseUrl(): string {
  return localStorage.getItem(API_BASE_URL_KEY) || "";
}

export function setApiBaseUrl(url: string) {
  localStorage.setItem(API_BASE_URL_KEY, url.replace(/\/+$/, ""));
}

export function isApiConfigured(): boolean {
  return !!getApiBaseUrl();
}

// ── Generic fetch helper ──
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const base = getApiBaseUrl();
  if (!base) throw new Error("API base URL not configured");

  const res = await fetch(`${base}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body || res.statusText}`);
  }

  return res.json();
}

// ── Health ──
export async function testConnection(): Promise<{ status: string }> {
  return apiFetch("/health");
}

// ── Trades ──
export interface CreateTradePayload extends Omit<Trade, "id"> { id?: string; }

function filtersToParams(f: TradeFilters): string {
  const params = new URLSearchParams();
  Object.entries(f).forEach(([k, v]) => {
    if (v && v !== "all") params.set(k, v);
  });
  return params.toString();
}

export async function getTrades(filters: TradeFilters): Promise<Trade[]> {
  const qs = filtersToParams(filters);
  return apiFetch(`/trades${qs ? `?${qs}` : ""}`);
}

export async function getTrade(id: string): Promise<Trade> {
  return apiFetch(`/trades/${id}`);
}

export async function createTrade(payload: CreateTradePayload): Promise<Trade> {
  return apiFetch("/trades", { method: "POST", body: JSON.stringify(payload) });
}

export async function updateTradeApi(id: string, payload: Partial<Trade>): Promise<Trade> {
  return apiFetch(`/trades/${id}`, { method: "PATCH", body: JSON.stringify(payload) });
}

export async function deleteTrade(id: string): Promise<void> {
  await apiFetch(`/trades/${id}`, { method: "DELETE" });
}

// ── Tags ──
export async function getTags(): Promise<TagCategories> {
  return apiFetch("/tags");
}

export async function updateTagsApi(tags: TagCategories): Promise<TagCategories> {
  return apiFetch("/tags", { method: "PUT", body: JSON.stringify(tags) });
}
