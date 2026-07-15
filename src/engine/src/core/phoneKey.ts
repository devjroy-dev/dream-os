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
  const key = digits.slice(-10);
  // TDW_04 rider (F-04.3(a), CE-ruled 2026-07-15): reject DEGENERATE keys —
  // a single repeated digit ("0000000000") is a placeholder, not a phone.
  // One harvested placeholder is benign; two would FALSE-FUSE strangers by
  // "phone". Same guard, same comment, in the PWA twin (lib/vendor/cabinet.ts).
  if (/^(\d)\1{9}$/.test(key)) return null;
  return key;
}

// Fallback join key when phones are absent/asymmetric: the lowercase trimmed name.
// Two characters minimum so stray initials never pair strangers.
export function nameKey(n: string | null | undefined): string | null {
  const t = (n ?? '').trim().toLowerCase();
  return t.length >= 2 ? t : null;
}
