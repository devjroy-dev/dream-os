# CE-47 · ELZ-4 · THE PER-VENDOR ELIZA SWITCH FOR WHATSAPP · 0212 · HANDOVER

Base: dream-os eb6b51cd8c81 (re-derived at the cut). Built on 01197ac and carried (eb6b51c brought ADS-2's scopes: six paths, none of this
package's; every path cmp-equal after the carry). Rulings: the chair's design note r2 accepted (4 October 2026); Q1 (b) her OFF means
nothing answers on her behalf; Q2 the master absolute; R1 one lead by code on the first inbound; R2 the alert's words and its two triggers;
numbered into ELZ-4's range (0212, b250). Rides server train 1, before the Meta sitting. The room's screen and S9 are FE-9's.
The live master (the founder's read-only query, 4 October 21:57 IST): couple.eliza_enabled = true.

## 1 · What ships (12 paths)

db/migrations/0212_wa_eliza_state.sql (ADDED) · vendors.wa_eliza_state text NULL (no default; CHECK on|off) and wa_eliza_consented_at
timestamptz NULL. Every existing row NULL = follow the master = exactly today. Above the applied tip (0193): no OUT_OF_ORDER record; if
WEB-4's reserved 0194 or 0195 lands AFTER 0212, that seat records its number below the tip. RUN IN SUPABASE BEFORE THE PUSH (engine.js reads
the column on every WhatsApp turn while the master is on; a missing column reads as no row, i.e. Eliza as today, but the room's doors would
500).
src/lib/vendor/waEliza.js (ADDED) · isOff (master true AND whatsapp_shared|whatsapp_own AND hers 'off'); offTurn (R1, R2); the room's
answer and flip; roomState (on · off · waiting).
src/api/vendor/solutions/whatsappEliza.js (ADDED) + src/api/vendor/solutions/index.js · GET /api/v2/vendor/solutions/whatsapp-eliza and
POST .../switch { on }, beside /instagram, wired as instagram.js wires igRoom.js; not dark by a Meta gate.
src/agent/engine.js · the lane flag is read ONCE at the turn's start (laneEliza; Instagram and the website true, as before); for WhatsApp
with the master on, her row is read fresh and OFF returns the silent turn before any history read or model call; useEliza = laneEliza
further down (b08_p5 §1.4's one site holds). New optional argument profileName.
src/lib/vendorInbound.js · the four shared-line callers pass profileName and send and record only a non-empty reply; their alert block is
unchanged and carries R2's line when Eliza is off. ON: unchanged (the turn always returns a reply today).
src/lib/ownNumber/turn.js · a silent turn sends nothing from her number and sends her alert (outcome eliza_off).
scripts/b250 (ADDED) · 31 cells, M1 to M6. scripts/b115 · re-pinned by label (7). scripts/b135 · 1.2 re-pinned by label (each caller
block gained the profileName line). docs/handovers (this file, ADDED) · scripts/floor-manifest-ce47-elz4-waeliza.txt (ADDED).

## 2 · The words (R2), exactly

New enquiry from {name or phone}: "{the message}". Eliza is off on WhatsApp, so please reply yourself.
Sent on the thread's first inbound, and again when the client writes 24 hours or more after her previous message with no outbound from the
vendor since. The callers' scrubModelFrame passes it byte for byte (b250 5.4; the quote is byte-exact by design).

## 3 · Proof (ELZ-4's container; no whole floor, per (b))

b250 31/31: §1 the rule (the master absolute; both numbers; NULL and on = today; Instagram and website untouched; the room's states), §2 the
off turn (silent; one lead; the alert exact; none within 24h; again after 24h unanswered; none if she replied; the phone as name; an existing
lead named), §3 the doors (on, off with consent, waiting, 400 on a non-boolean), §4 through engine.js with a model stub that throws if
called (shared line silent with no model call; own number the same; master off: the guard lets the turn through, no lead, no alert), §5 the
callers, own number, migration and the scrub (source); M1 to M6 each redden (M6: engine.js ignoring the master).
BOTH WAYS on a truly clean eb6b51c with only waEliza.js added: red on exactly 4.1, 4.2, 4.3 (the engine has no guard; 4.3's fixture is chained
to 4.1's, named), 5.1, 5.2, 5.3, M5, M6; green on §1 to §3, 5.4, M1 to M4 (the module's own).
THE DIFFERENTIAL (radius by command before the base run: 100 benches reading engine.js, vendorInbound.js, ownNumber/turn.js, laneFlags.js
or the solutions router; clean eb6b51c vs this package; one at a time; zero dirt both sides): exits and cells identical; output differs only
in b135 (its re-pin's label). FOUND AND CURED ON THE FIRST PASS: b08_p5 §1.4 (the gate must be read at ONE site: my first build read it twice;
now one read, shared); b115 2.1 and b135 1.2 (pins, re-pinned by label). Reds both sides, the named base's: b05_arc_m6, b05_p4_crons,
b07_p5, b08_p5_oow_relay.
SHIFTED CLOCKS: b250, b135, b115, b08_p5 green at 5 October 2026 IST, 31 December 2027 23:50 IST and 29 February 2028.

## 4 · The walk (after the deploy)

1. Supabase, read only: DEV440's wa_eliza_state is NULL.
2. Business Solutions is FE-9's; until it ships, the switch is flipped by the founder in Supabase:
   update public.vendors set wa_eliza_state = 'off' where routing_handle = 'DEV440' returning wa_eliza_state;
3. From a client number to TDW's line for DEV440 (a NEW number, chosen by the founder): "Hi, are you free in December?" → no reply to the
   client; DEV440's WhatsApp gets the alert, exactly the words above; a new lead in Enquiries named by the client's WhatsApp name.
4. The same client again within minutes: no reply, no alert, no second lead.
5. Back on: set wa_eliza_state = null (or 'on'); the same client writes: Eliza answers as today.

## 5 · Carried

F-44.269's cure comes to the chair next. Findings raised here take numbers from F-44.380. W-1: elizaSoul.js and listenerDoor.js unmoved.
No paid run. run-floor.sh at the base has no --resume (e-267): the floor block sets TMPDIR=$HOME/floortmp and runs under nohup setsid; its
"resume" is a re-run from the start until --resume exists.
