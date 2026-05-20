// lib/cache/invalidate.ts
// Pub/sub slice invalidation for form-driven writes.
//
// Problem: the SSE done event with `refresh: true` triggers context refetch
// for chat-driven mutations. Form-driven writes (POST/PATCH/DELETE from UI)
// bypass chat, so they need their own invalidation signal.
//
// Usage:
//   After a successful write: invalidateSlice('leads')
//   Hooks subscribe on mount via subscribeToSlice().

export type Slice = 'leads' | 'clients' | 'invoices' | 'expenses' | 'events';

type Listener = () => void;
const listeners = new Map<Slice, Set<Listener>>();

function getOrCreate(slice: Slice): Set<Listener> {
  if (!listeners.has(slice)) listeners.set(slice, new Set());
  return listeners.get(slice)!;
}

/** Call after any successful POST / PATCH / DELETE for the given slice. */
export function invalidateSlice(slice: Slice): void {
  const subs = listeners.get(slice);
  if (!subs) return;
  subs.forEach(fn => fn());
}

/** Invalidate all slices — e.g. after a bulk import. */
export function invalidateAll(): void {
  listeners.forEach(subs => subs.forEach(fn => fn()));
}

/**
 * Subscribe to invalidation events for a single slice.
 * Returns an unsubscribe function — call it in your useEffect cleanup.
 *
 * @example
 *   useEffect(() => subscribeToSlice('leads', refresh), [refresh]);
 */
export function subscribeToSlice(slice: Slice, listener: Listener): () => void {
  const subs = getOrCreate(slice);
  subs.add(listener);
  return () => subs.delete(listener);
}
