// phoneKey.ts — TDW_04 engine-lane sitting (ST-3b, absorbed 02-HOTFIX-2 per L-9).
// The engine-side TWIN of dreamos-pwa lib/vendor/cabinet.ts phoneKey — byte-for-byte
// semantics: normalize to the last 10 digits (Indian numbers; strips +91/0 prefixes
// and formatting) so both planes compare on the same key. DISCLOSED LIMITATION
// carries over verbatim: a phone-asymmetric twin (binder without a phone — the
// Kavya case, Exhibit B) will NOT match; absence of a match means "no phone match",
// never "no twin". Display/annotation-only consumers — this key never drives a write
// (the R1(b)/R2 boundary: no rival spine before TDW_16).

export function phoneKey(p: string | null | undefined): string | null {
  if (!p) return null;
  const digits = String(p).replace(/\D/g, '');
  if (digits.length < 10) return null;
  return digits.slice(-10);
}

// Fallback join key when phones are absent/asymmetric: the lowercase trimmed name.
// Two characters minimum so stray initials never pair strangers.
export function nameKey(n: string | null | undefined): string | null {
  const t = (n ?? '').trim().toLowerCase();
  return t.length >= 2 ? t : null;
}
