'use client';
// hooks/useVendorData.ts
// Per-slice data loaders for the List hub.
// Module-scoped cache (30s TTL) avoids re-fetching on every tab switch.
// refresh() forces a re-fetch and cache bust — called after agent write tools fire.
// Block 1b: also subscribes to the pub/sub invalidation bus (lib/cache/invalidate).
// Form-driven writes call invalidateSlice(slice) → hook refetches within one tick.

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  fetchClients, fetchLeads, fetchInvoices,
  fetchExpenses, fetchEvents,
} from '@/lib/api/vendor';
import type {
  Client, Lead, Invoice, Expense, VendorEvent,
} from '@/lib/types/vendor';
import { subscribeToSlice } from '@/lib/cache/invalidate';

type Kind = 'clients' | 'leads' | 'invoices' | 'expenses' | 'events';

type CacheEntry<T> = { data: T; ts: number };
const cache = new Map<string, CacheEntry<unknown>>();
const CACHE_TTL = 30_000;

function cacheKey(vendorId: string, kind: Kind) {
  return `${vendorId}:${kind}`;
}

interface LoadState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
}

function useLoader<T>(
  vendorId: string | null,
  kind: Kind,
  fetcher: (id: string) => Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
  extract: (raw: Record<string, unknown>) => T | null,
): LoadState<T> {
  const key = vendorId ? cacheKey(vendorId, kind) : null;
  const cached = key ? (cache.get(key) as CacheEntry<T> | undefined) : undefined;

  const [data, setData] = useState<T | null>(cached?.data ?? null);
  const [loading, setLoading] = useState<boolean>(!cached);
  const [error, setError] = useState<string | null>(null);
  const tick = useRef(0);

  const run = useCallback(async (force: boolean) => {
    if (!vendorId || !key) return;
    const existing = cache.get(key) as CacheEntry<T> | undefined;
    if (!force && existing && Date.now() - existing.ts < CACHE_TTL) {
      setData(existing.data);
      setLoading(false);
      return;
    }
    const my = ++tick.current;
    setLoading(true);
    setError(null);
    try {
      const raw = await fetcher(vendorId);
      if (my !== tick.current) return;
      if (!raw.ok) throw new Error(raw.error ?? 'Request failed');
      const extracted = extract(raw as Record<string, unknown>);
      cache.set(key, { data: extracted as T, ts: Date.now() });
      setData(extracted);
    } catch (e) {
      if (my !== tick.current) return;
      setError(e instanceof Error ? e.message : 'Network error');
    } finally {
      if (my === tick.current) setLoading(false);
    }
  }, [vendorId, key, fetcher, extract]);

  useEffect(() => { run(false); }, [run]);

  // Block 1b: subscribe to pub/sub invalidation bus.
  // When form-driven writes call invalidateSlice(slice), this hook refetches.
  useEffect(() => subscribeToSlice(kind, () => run(true)), [kind, run]);

  const refresh = useCallback(() => run(true), [run]);
  return { data, loading, error, refresh };
}

// Public invalidation — call after agent writes
export function invalidateSlice(vendorId: string, kind: Kind) {
  cache.delete(cacheKey(vendorId, kind));
}

// ── Public hooks ──────────────────────────────────────────────────────────

export function useClientsData(vendorId: string | null): LoadState<Client[]> {
  return useLoader<Client[]>(
    vendorId, 'clients',
    (id) => fetchClients(id) as unknown as Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
    (raw) => Array.isArray(raw.clients) ? (raw.clients as Client[]) : null,
  );
}

export function useLeadsData(vendorId: string | null): LoadState<Lead[]> {
  return useLoader<Lead[]>(
    vendorId, 'leads',
    (id) => fetchLeads(id) as unknown as Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
    (raw) => Array.isArray(raw.leads) ? (raw.leads as Lead[]) : null,
  );
}

export function useInvoicesData(vendorId: string | null): LoadState<Invoice[]> {
  return useLoader<Invoice[]>(
    vendorId, 'invoices',
    (id) => fetchInvoices(id) as unknown as Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
    (raw) => Array.isArray(raw.invoices) ? (raw.invoices as Invoice[]) : null,
  );
}

export function useExpensesData(vendorId: string | null): LoadState<Expense[]> {
  return useLoader<Expense[]>(
    vendorId, 'expenses',
    (id) => fetchExpenses(id) as unknown as Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
    (raw) => Array.isArray(raw.expenses) ? (raw.expenses as Expense[]) : null,
  );
}

export function useEventsData(vendorId: string | null): LoadState<VendorEvent[]> {
  return useLoader<VendorEvent[]>(
    vendorId, 'events',
    (id) => fetchEvents(id) as unknown as Promise<{ ok: boolean; error?: string } & Record<string, unknown>>,
    (raw) => Array.isArray(raw.events) ? (raw.events as VendorEvent[]) : null,
  );
}

// ── Block 1b — subscribe to pub/sub invalidation per slice ────────────────
