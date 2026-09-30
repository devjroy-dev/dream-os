# CE-46 · ELZ-4 · LAYER A · THE PRICE SWITCH (0183) WITH F-44.231 · HANDOVER

Built by ELZ-3 on 91babd0 and carried by it to a9f7935 (patch 0001 of its seat-close pack, 7fa54c1a...); taken by ELZ-4 on a fresh clone of
a9f7935 (origin main, derived by command on 30 September 2026), `git am` clean, no carry needed (nothing landed after a9f7935). The chair
accepted the layer in shape at CE-46 and ruled the register record on 30 September 2026. The founder's ruling of 29 September 2026: her own
switch, "Share approximate prices in chat", OFF until she turns it on.

## 0 · MIGRATION ORDER: 0183 APPLIES AFTER 0184

0183 was named by the chair; 0184 (G6-4 cut B, ig_deletion_purge) is already applied. So 0183 fills a hole below the applied ladder tip and
runs out of number order. Per F-SW.3's standing cure (R-34.41 to .43) this delivery adds its record to db/migrations/OUT_OF_ORDER.json
(number 183, stale_for `public.vendors`, state OWED until the next PAIR regen). 0183 must run in Supabase BEFORE the code is pushed:
me.js's PATCH selects name price_share_enabled, and a select naming a missing column is a 500 on every settings save.

## 1 · What ships (14 paths)

db/migrations/0183_price_share.sql · vendors.price_share_enabled boolean NOT NULL DEFAULT false; alters one table, creates none (A-45.8
grants nothing); one transaction, idempotent; the revert is written commented.

db/migrations/OUT_OF_ORDER.json · 0183's record (above). Only the register array moved; the README is untouched.

src/lib/vendor/couplePriceState.js (new) · priceFacts reads the switch, rate_min and her live packages fresh from the rows (columns witnessed
in PUBLIC_SCHEMA.md: vendors.rate_min, vendor_packages.name, total, deleted_at; price_share_enabled by 0183). priceOn holds only with the
switch on AND rate_min above 0. priceState composes the founder's sentences in code: S1 "Packages start from Rs {rate_min}. The final price
depends on your date and what you need; {studio} will confirm." and S2 "The {package} package is Rs {total}. ..." when her words hold every
content word of one package's name (the chair's P1 (a)) and that total is at or above rate_min; a tie, or a total below rate_min, is S1.
priceGuard: with the switch on, a reply naming a rupee figure other than rate_min, a quoted matched total or a figure the client wrote
herself is refused. Every function answers and never throws.

src/agent/coupleSystemPrompt.js · WHEN THEY ASK ABOUT PRICE and the rules that point at it, in the STABLE text only (a per-vendor fact,
F-44.230), and only when priceOn. Switch OFF: byte-identical to F-44.230's prompt (a9f7935) on all 12 lane, branch and channel combinations.

src/agent/engine.js · the price facts read before the prompt is built; the price_state tool offered only when priceOn; the guard on the final
reply, replacing a refused reply with S1 (the chair: no new line) and logging `[couple-agent] price guard refused [...]`. Off: no tool, no
guard, today's turn.

src/api/vendor/me.js · price_share_enabled beside date_check_enabled at all four sites (GET as `=== true`, ALLOWED_FIELDS, BOOLEAN_FIELDS,
the echo) and in both PATCH selects. The pwa switch is FE-4's.

src/lib/vendor/workingDoor.js · F-44.231 cured: when every line of a turn is B8 over the same clients, ONE is spoken and the pick note keeps
every act of the message.

Benches: b142d (new, 29 cells, --mutate 7); b142b (2.4f, 2.4g, M12 for F-44.231); b115 re-pinned by label (engine.js cap 930 to 990);
b06_m0 §4.7 and b20_a2's register cell re-aimed by label (§3).

## 2 · CORRECTION TO F-44.230's HANDOVER (the chair's ruling (ii))

TDW_CE46_ELZ3_F230_HANDOVER.md §1 says the RETURNING branch's prefix "is under Haiku 4.5's minimum ... so it never cached and pays no write".
That is wrong. K (m230 --live, the founder's keyed run at a9f7935, relayed by the chair) counted the returning branch's PREFIX at 4,327
tokens, above Haiku 4.5's 4,096 minimum, so its one block is cacheable and, carrying cache_control, is written. Whether it is ever READ is
F-44.249, open: (b) is the founder's "hi" from Sarah's number and her [couple-agent] usage line; (c), only if it writes every turn, splits the
returning text. m230's "$0.00045 later turns" for the returning line was unproven and is withdrawn (e-249). This file is the correction; the
F-44.230 handover is left as it was written, as history.

## 3 · Proof (ELZ-4's container, engine built, keys unset)

BOTH WAYS. b142d in a clean worktree of a9f7935 with only couplePriceState.js added: red on exactly the cure cells (2.2, 2.4, 2.5, 3.3, 3.5,
3.8, 4.1 to 4.4); green there on the lib's own §1, on 2.1 and 2.3, and on the cells that say today holds (3.1, 3.2, 3.6, 3.7); 3.4 is green at
the base too (the stub's S2 reply goes out with no tool and no guard), disclosed. Cured: 29/29; --mutate 7/7, restored by sha256. b142b at
the base: red on exactly 2.4f, 2.4g, M12; cured 45/45.

THREE REDS CURED HERE THAT THE PATCH WOULD HAVE PLANTED:
- e-252 (ELZ-3, recorded by the chair): b142d 2.1 pinned 8f0da70, ELZ-3's local and never-pushed commit of F-44.230; every other clone read
  0/12. Re-pinned by label to a9f7935.
- b06_m0 §4.7 anchored on the first "reply: finalReply" in engine.js, which is now the guard's argument; re-aimed by label to the return's
  own "reply: finalReply ||", the same five keys. Proof: renaming toolCalls in the return reddens it.
- b20_a2 pinned the register empty; re-aimed by label to its subject, no record names 148. Proof: a planted 148 record reddens it.

THE DIFFERENTIAL. Radius derived by command before the base run: the 126 benches reading engine.js, coupleSystemPrompt.js, workingDoor.js,
me.js, couplePriceState.js, the register or db/migrations. A truly clean worktree of a9f7935 (own engine build) against this layer, one bench
at a time, dirt checked after every member (zero both sides). Exits identical on 125; b142d differs (base MODULE_NOT_FOUND, its own new
file; cured 0). Reached cells differ only in b142d (new), b142b (43 to 45) and b15 (7 to 8: the record renders through the real formatter).
Output differs only there and in b115 (the cap label), b20_a2 (its relabel), b14_d1 (the src/ walk counts 451 files) and b91_rls_ladder
(0183 listed in scope, no table). Red on both sides with byte-identical output, the named base's own: b05_arc_m4, b06_gauntlet (exit 3),
b07_f0772_circle_auth, b07_p4b_body, b10_p1_search, b10_p2_bridge, b10_p3_mint_deck, b51_referrals, b59_g34_reminders, b59_mutations.

SHIFTED CLOCKS (C-44.13): b142d, b142b, b06_m0, b20_a2 green at 1 October 2026 IST, 31 December 2027 23:50 IST and 29 February 2028.

## 4 · The walk (DEV440, Sarah 9625759924 on the shared line)

Witness first (read only): DEV440's rate_min, price_share_enabled and live packages with their totals. Then the switch on (rate_min kept if
set). Sarah: "how much do you charge?" gives S1. Sarah names a DEV440 package at or above rate_min, in the words the witness shows: S2 with
that total. Then the switch off: "how much do you charge?" gives today's reply (no figure; the studio will confirm). Finally DEV440 is put
back as the witness found it.

## 5 · Disclosed

No paid run. W-1: elizaSoul.js and listenerDoor.js unmoved. The pwa switch and the app's second bubble are FE-4's. Layers B (F-44.248) and C
(R-46.17) follow on top of this one, each with its own differential.
