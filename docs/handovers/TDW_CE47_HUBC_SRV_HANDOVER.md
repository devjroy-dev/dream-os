# TDW · CE-47 · CLB PART C SERVER · Her packages as cards in her Instagram messages · handover

Base: dream-os 5058d8c with HUB2E_SRV_1 applied (bab9daf5; server train 16). Rides the server train after 16. Migration: **0221** (one capabilities row). Seat: CLB.

## The rulings this carries (the chair, 8 Oct 2026)
- **The gate is the capabilities row** `flag.ig_package_cards` (0221). Under the founder's standing rule for Meta-gated features, her choice is ON unless she turns it off, and the feature goes live by itself once Meta grants instagram_business_basic and instagram_business_manage_messages. Until then it opens only for a vendor on clb.testers who is also on the Instagram lane's walk list (IG_DM_WALK_VENDOR_IDS, DEV440).
- **The picture**: the cover of a published look tied to the package, else her portfolio's hero, else none. Every candidate passes `profiles.pictureOnPage` (R-47.2), so a held picture is never sent to Meta. Picture rows are read whole (`select('*')`), so WEB-4's `safety_state` reaches that one function with no edit here.
- **The price line** matches the storefront: "From Rs <amount>" in Indian commas, only when her website shows prices (vendors.rate_display, the switch `vendorCard.publicPackages` obeys) and the package has a total.
- **The starter** "See packages" is set and removed with the switch. Starters of her own are never overwritten.
- **Cards go only inside the 24-hour window.** "See details" opens her TDW website (`storefrontUrl`, her short address).

## How it works
- `src/lib/metaGates.js`: one more feature, `flag.ig_package_cards` ("Package cards in Instagram messages"), with the messages pair. The sweep reads it like the other three and turns its row on by itself after the live probe passes.
- `src/lib/featureGate.js`:
  - The key joins NEEDS_INSTAGRAM (she must have connected Instagram).
  - Its walk list before approval is the Instagram lane's.
  - Its live probe is the messages probe (`me/conversations`).
  - `choiceOf` is exported.
  - The name holds no "collab" (b280 5.4).
- `src/lib/instagram/igCards.js` (new):
  - `gateFor`: the gate and her choice. When she has turned it off, it also says whether the feature is available to her at all.
  - `cardsFor`: her cards, at most 10, in her order (the default first, then oldest first, as her website lists them).
  - `templateOf`: Meta's generic template, with titles and subtitles cut to 80 and one web_url button.
  - `setStarter` and `removeStarter`: hers are kept; ours goes beside them, or nowhere when she has four.
  - `answer`: the cards, or one sentence when she has no packages, inside the window only.
  - `room`: her room's answer.
  - `ensureStarter`: puts the starter in place by itself the first time one of her clients writes after the gate opens (once in six hours per vendor), so it goes live without her opening the room.
- `src/lib/instagram/igInbound.js`:
  - `parseIgMessages` also reads a tap on a starter (`messaging[].postback { mid, title, payload }`) as her client's message, with its payload.
  - `receive` answers "See packages" with the cards under the thread's turn lock. When the feature is closed for her, the tap goes to the ordinary reply.
  - An ordinary message also calls `ensureStarter`.
- `src/api/vendor/solutions/instagram.js`: `GET` and `POST /api/v2/vendor/solutions/instagram/package-cards`.
  - The answer is `{ ok, state: 'on' | 'off' | 'full' | 'failed' | 'no_packages' | 'not_connected', line, cards: [{ title, subtitle, image_url, button }] }`.
  - POST takes `{ on: true | false }`.
  - When the feature is not available to her at all, the answer is 404 (dark; the app draws nothing).

## The founder's step before the push: migration 0221
Run `db/migrations/0221_ig_package_cards_gate.sql` in Supabase, then this check:
`SELECT key, kind, status, auto_on, walk_ref IS NOT NULL AS has_walk_ref FROM public.capabilities WHERE key = 'flag.ig_package_cards';`
It must read one row: `flag.ig_package_cards | flag | pending | true | true`. Then run a schema reload, then the push.

## R-47.1: every new line
| Who reads it | Where | Old line | New line |
|---|---|---|---|
| Her client | No package to show after the tap | | There are no packages to show here yet. Please send your question, and you will get a reply. |
| She | The switch is on | | When someone taps "See packages" in your Instagram messages, they get these cards. |
| She | She turned it off | | Your packages are not shown in your Instagram messages. |
| She | She has no packages | | You have no packages yet. Add a package, and it will be shown here. |
| She | She already has four starters of her own | | Your Instagram account already has 4 conversation starters. Remove one in Instagram, and TDW will add "See packages". |
| She | Instagram refused the change | | Instagram did not accept the change. Please try again. |
| She | Her Instagram is not connected | | Connect your Instagram first, and your packages can be shown in your messages. |

**Labels:** "See packages" (the starter), "See details" (the button), "From Rs <amount>" (the price line), and the package name as the card's title. The founder's line when the row goes live: "Package cards in Instagram messages are now live for every vendor."

## Files
- ADDED `db/migrations/0221_ig_package_cards_gate.sql`.
- CHANGED `src/lib/metaGates.js`, `src/lib/featureGate.js`, `src/lib/instagram/igInbound.js` and `src/api/vendor/solutions/instagram.js`.
- ADDED `src/lib/instagram/igCards.js`.
- ADDED `scripts/b289_clb_c_ig_package_cards_bench.js`:
  - §1 the gate (1.1 to 1.3), §2 the cards (2.1 to 2.6), §3 the starter (3.1 to 3.4), §4 the tap (4.1 to 4.4).
  - §5 her room (5.1 to 5.4), §6 the words.
  - §7 mutations M1 to M6 through scripts/lib/mutation_guard.js.
  - Its supabase double applies several order() calls in turn and answers upsert (b289's copy only).
- ADDED `scripts/floor-manifest-ce47-hubc-srv.txt`, this handover, and the b289 ledger.
- No bench is amended.

## Proof (on 5058d8c with HUB2E_SRV_1 applied; each run its own log; floor lines under env -u ANTHROPIC_API_KEY -u DEEPSEEK_API_KEY)
- b289 30/0: its cells §1 to §6, and M1 to M6 each reddening the cell it names, restored by sha, nothing left pending (7.9).
- b289 ran 20 times under load (b290 and b292 looping beside it): 20 green. The ledger is docs/handovers/b289_ledger_HUBC.txt.
- Lesson 1, every bench that names a touched path, head against the base (the same tree without this package), red by red:
  - Green on both sides: b119, b119b, b136, b136c, b149, b153, b255, b280 (5.4: no "collab" in the gate's name or in featureGate), b5, b221, b284, b287, b290, b292.
  - Red on both sides, the same list: b90 (its retired-cell table, as on main); b105 (it cannot load `engine/dist`, which is not built here).
- The five walkers (e-273, e-274), on both sides, all green: b07_f0789, b128, bOB_taxonomy, b15 and b91; also bOB_d2, bOB_m and bOB_micro.
- Also green on the head: b288, b286, b283, b282, b296 and b298.
- `node --check` is clean on every changed and added file.
