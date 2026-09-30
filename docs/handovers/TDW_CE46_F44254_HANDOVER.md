# TDW · CE-46 · G6-4 · F-44.254 · account events reach her row · handover

Base 24854d2. Ruled 30 September 2026. Found on the F-44.252 walk: Meta's WABA-level account_update events (PARTNER_ADDED,
PARTNER_APP_INSTALLED, PARTNER_APP_UNINSTALLED, PARTNER_REMOVED, bans and restrictions) carry no phone_number_id and name her WABA
only in value.waba_info.waba_id; the ingress looked her row up by entry.id, found none, and routed them to the vendor service's
generic seam. So, for every own number since G6-1, PARTNER_REMOVED never retired a removed row's S6 line, and GONE never marked an
ACTIVE number migrated_out, and SUSPEND/REINSTATE never paused or restored one.

- `src/lib/ownNumber/wabaMap.js` `lookupForChange`: the change's phone_number_id, else value.waba_info.waba_id, else entry.id;
  the first lookup that finds a row wins. When waba_info names a WABA other than entry.id, the pair is logged once per process
  ("[own-number] account_update entry.id X names waba_info.waba_id Y (F-44.254)"), so the live mismatch is read, not assumed.
- `src/marketingIndex.js`: one line, the ingress asks lookupForChange. ELZ-4 is told (the ingress is shared).
- QUALITY EVENTS, read: phone_number_quality_update carries neither a phone_number_id nor waba_info, so it is still found only
  by entry.id. b150 11.3 shows it lands when entry.id is her WABA; the log line above settles from live data whether entry.id is
  her WABA for these too. If it is not, a quality event would still fall through, and a second cure keys it by display number.

## Rungs
b150 74/0: §11 drives the REAL ingress (scripts/lib/b150_ingress_probe.js: marketingIndex's app with the b137 double, over HTTP)
with the walk's exact PARTNER_REMOVED payload, removed and active rows, a quality event, the logged pair and the control; M13
(the map ignores waba_info) reddens 11.1. b121 1.4 re-pinned by label (the ingress asks lookupForChange).
