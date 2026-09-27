# repo: devjroy-dev/dream-os · IGD-1's seat-close, carried by IGD-2 with cut 2b (R-40.95), byte for byte as the founder pasted it on 27 September 2026

FOR THE CHAIR ONLY: NOT TO BE RUN
IGD-1 · SEAT-CLOSE · CE-45 into CE-46 · closed under R-46.1 on the chair's word · 27 September 2026
For IGD-2 to carry into dream-os docs/handovers/ with its first cut (R-40.95). IGD-1's records live in dream-os (the chair, 26 Sept
2026, after the founder's "this needs to go into dream os not pwa").

======================================================================================================
1 · WHAT SHIPPED
======================================================================================================
CUT 1 (dreamos-pwa) · R-45.27: the room "WhatsApp and Instagram"
  ZIP sha256 dd9e90dbf050d50b7ca2f03f6bba04971c0cb2741c837443425160408ca6aa0a. Commit f08df476 on d78461c7.
  The 'number' row renamed with its line and the two-bubble icon (F-44.164 cured). S1: OwnNumberFlow gains sectionHead and after, so
  G6's screen, "Instagram messages" (C1 to C9, C13) and the quiet time (QT1, QT2) share one shell, dark until the doors answer.
  lib/worklist/metaRoom.ts is the room's copy home; lib/vendor/metaRoomDoor.ts is the doors' wire and parser.
  Build handover: dreamos-pwa docs/handovers/TDW_CE45_IGD1_1_HANDOVER.md, pushed with the cut, before the one-home ruling.
  Walk record: dream-os e07f7fa, docs/handovers/TDW_CE45_IGD1_1_WALK_HANDOVER.md (docs ZIP sha256 512743c1...). W1 to W4 PASS in both
  themes.
CUT 1b (dreamos-pwa) · R-45.28: "WhatsApp and Instagram" first in Get booked
  ZIP sha256 d1b807d366c5a0c27c9fb778d2ffdb74c4271648df86f3f9c3e0240fabb7698d. Commit 6bb8e7e6 on afe6b076.
  Walked in both themes. CLOSED. Record in dream-os docs/handovers/TDW_CE45_IGD1_1b_HANDOVER.md (landed in 7a38025).
CUT 2a-i (dream-os) · the Instagram door's receiving half
  ZIP sha256 689524cc95fa1f038fdbaef548e4f96e1c12f505afeeaa11930da4747f0eb553. Commit 7a38025 on 1b37c26.
  POST and GET /webhook/instagram on the vendor service, never the shared receiver. The signature is checked against IG_APP_SECRET or
  META_APP_SECRET with the match named (E3). A DM is recorded on one Instagram thread per sender and never answered.
  F-44.162 cured: the shared receiver drops non-WhatsApp bodies before routeChange.
  0173 (conversations.channel and counterparty_ig_id; leads.counterparty_ig_id; vendors.reply_quiet_minutes default 120) was APPLIED
    in production and its three checks read (whatsapp 50).
  b121 1.1 carries LCV-16's cure (pinned to bd9d153). Handover: docs/handovers/TDW_CE45_IGD1_2ai_HANDOVER.md.
CUT 2a-ii (dream-os) · the room's doors, the connect's messages flavour, the reply transport
  ZIP sha256 d79ea8d1535452f0fe7b267f9f146fbfb293b41aa8a9a5a110f8b8686dacbd03. Commit 5fa06cb on 951146c.
  GET /solutions/instagram, POST /instagram/switch and GET/POST /solutions/quiet, all DARK BY THE LANE (404). The state is derived. The
  messages flavour is signed like insights, and its callback proves the grant (GET /me/conversations) before storing it.
  subscribed_apps is turned on only on a proved grant. igSend: Graph v26.0 in one constant, the 24-hour window, no human-agent tag, the
  1000-byte split at sentence ends. NOTHING CALLS igSend YET.
  0174 (vendor_ig_connections: messages_granted_at, dm_state off|on, dm_consented_at, dm_subscribed_at) was APPLIED in production and
    its three checks read (off 13).
  pwaPaths gains 'number'. Handover: docs/handovers/TDW_CE45_IGD1_2aii_HANDOVER.md.
Tips at close, as last read by the seat: dream-os 5fa06cb (others may have landed since); dreamos-pwa 6bb8e7e6 or later.

======================================================================================================
2 · WHAT IS PROVEN (rungs and counts at their landing)
======================================================================================================
  b126 (pwa, cut 1): 48/48, the real room in Chromium in both themes, 4 mutations; 1.6 re-aimed FIRST in 1b.
  b119 (dream-os, 2a-i): 28/28, 5 in-memory mutations. b119r (0173 on a throwaway Postgres, A-45.8): 16/16.
  b119b (2a-ii): 34/34, with a boot cell requiring all 10 touched modules and 5 in-memory mutations. b119br (0174, A-45.8): 9/9.
  b121: 41/41 at LCV-16's cure bytes.
  Differentials:
    cut 1: 17 readers; b77 the one delta, cured.
    1b: 18 readers on afe6b076; exits and cell counts equal.
    2a-i: 120 readers on 7505ff2 (byte-identical to cda36fa); 7024 = 7024 cells; 6 outputs attributed.
    2a-ii: 111 readers on 7a38025; 6826 = 6826; 6 attributed.
    Every carry (5cba98e, cda36fa, 1b37c26, 951146c) had an empty overlap by name and shared readers equal.
  Floors of record:
    cut 1 and 1b: NAMED BASE, no delta.
    2a-i and 2a-ii: the founder's block 2 floor, model keys withheld: NAMED BASE, no delta, 3 key refusals.
    The seat's 2a-ii floor showed b89 red identically on base and cut (the container's, ruling (a)); b89 was green in his Codespace.
  0173 and 0174 read in production by the founder's SELECTs, each with a control.

======================================================================================================
3 · WHAT DRIFTED FROM THE KICKOFF AND THE READ-FIRST (each ruled or disclosed at the time)
======================================================================================================
  The vendor's control moved from Settings into the room "WhatsApp and Instagram" (R-45.27). "Your own number" became that room.
  Cut 2 was split into 2a-i (receive and record, never answer) and 2a-ii (doors, connect, transport). The turn is NOT wired: 2b.
  0174 was needed and not in the read-first's list, because F7 put her switch on vendor_ig_connections.
  The quiet door is also dark by the Instagram lane until 2b gives it an effect.
  R-45.29 (pin the room in every trade) was built, then WITHDRAWN by the founder; nothing of it landed.
  The seat's byte-anchored b121 exception was WITHDRAWN for LCV-16's general cure.
  The walk docs moved from pwa to dream-os. The pwa walk-docs ZIP (41e0713d...) was withdrawn unrun.
  The R-45.30 census of the room's lines went to COPY-1, which stood down. The room's lines return to IGD-2 from the founder through the
    chair.
  C4 (the portfolio's H2, REUSE) carries an em dash. It was offered to the founder as a comma, not a gate; unanswered at close.
  The master §5 row I2 amendment ("Eliza answers IG DMs", K4, banked) is not yet made in the spec file.

======================================================================================================
4 · OPEN ITEMS, BY NAME
======================================================================================================
  2b NOT STARTED: Eliza answering Instagram DMs through the channel-aware turn, with ELZ-1. Read-first first. The forks as listed on
    26 Sept:
    runCoupleAgenticTurn's counterparty parameter at its five couplePhone sites (the throw at :692);
    the lead keyed by leads.counterparty_ig_id;
    F10's Instagram fact and F4's studio WhatsApp link;
    igSend called only within the window, with C12 told when it lapses;
    Q4's quiet time for both channels;
    Q3 in the agent's own words;
    a measured half kept as small as the proof allows, under A-45.15 and A-46.1 (green bare, --live for the paid run).
  THE BRAND MARKS: deferred by the founder ("The seat can proceed with the icons that are available. The ig and WhatsApp exact icon can
    be done later"). Meta's terms read 25 Sept are recorded in cut 1's handover as the rules that cut follows.
  THE DATE-CHECK SWITCH'S PLACEMENT in the WhatsApp and Instagram room: open, as the chair names it. This seat built nothing for it and
    holds no ruling on it.
  K5's OPEN-BINDER DEFAULT on the door's road: open, as the chair names it. This seat's record holds only K5 itself (c-45.48: the gate is
    perm.instagram_business_manage_messages, seeded pending by 0149, not a new flag) and F7's allowlist for the pre-grant walk.
  THE DARK WALK, HELD BY THE CHAIR (2a-ii's handover):
    Railway: IG_VERIFY_TOKEN (new) and IG_DM_WALK_VENDOR_IDS (DEV440, new); IG_APP_SECRET exists.
    Meta: add DEV440's Instagram account, type the vendor service's /webhook/instagram and the verify token in the Instagram Login use
      case's section 3, tick messages ONLY, never the shared receiver's URL.
    Then Connect, consent and Turn on as DEV440; a DM from his second account is recorded, not answered until 2b.
    E3 is settled by that first DM's log line; the next cut keeps only the matching secret.
  I5 (comments as the first reply): "later" by the founder.
  The filing packet for instagram_business_manage_messages: after the dark walk.
  G6-1 reads vendors.reply_quiet_minutes as the one quiet-time home.
  FE-2 and IGD: b126's dev-server helper converges with FE-2's into one shared helper at the next cut touching either.

======================================================================================================
5 · THE FOUNDER'S RULINGS, AS RECORDED
======================================================================================================
  On the read-first's table (relayed by the chair, 25 Sept 2026), verbatim: "ok to all but ig also goes inside business solution.
  whatsapp and IG (meta room)". His answers, as the chair recorded them:
    Q1 · comments as the first reply: later.
    Q2 · booking on Instagram as on WhatsApp (her date answered or "let me check", her details taken, the lead filed, the studio
         confirms; her WhatsApp link if she wants WhatsApp; Eliza never confirms a booking): yes.
    Q3 · saying it is automated: (c) only when asked.
    Q4 · when the vendor replies herself: quiet for that couple for two hours after the vendor replies herself, the time her setting
         (one home, shared with G6's own number).
  C1 to C12: his as written. The room's name: "WhatsApp and Instagram".
  A1 to A5, QT1, QT2 and C13: "ok", with the chair's A4.
  After cut 1's walk, verbatim: "whatsaapp and instagram should come in place of wedding pages in pinned." and "whatsapp and instagram
    should be the First one in GET BOOKED-above open dates and rates." (R-45.28 landed.)
  R-45.29, verbatim: "pin it now. all pages", "all trades", "replace posts and ads", "for decor we can remove teams". Then WITHDRAWN,
    verbatim: "any which way we will later on allow for pinning any room, so why waste time with just pinning whatsapp and IG."

======================================================================================================
6 · THIS SEAT'S e-NUMBERS
======================================================================================================
  e-127 · the addendum claimed OwnNumberFlow would not be edited; S1 edits it.
  e-128 · b126's probe omitted the service-worker bypass; two hollow greens, found by the API trace, cured.
  e-129 · b77 missed by cut 1's build; the differential and the floor put in one turn.
  e-141 · the 97031c40 comparison read cut 1's old folder; discarded before any claim.
  e-146 · marketingIndex.js called an identifier its destructure never bound; caught before any run.
  e-148 · a dream-os differential run without src/engine/dist (A-45.11); discarded.
  e-149 · a normaliser whose sed rejected its own delimiter ("0 outputs differing" false); discarded, re-read proven.
  Also disclosed, unnumbered or ruled no number: the foreign run in the container (quarantined; A-45.7); b119's two vacuous cells cured
    with webhookCore's test hook; the pwaPaths boot throw caught before any run (now guarded by b119b 1.1); the disk-full npm ci; the
    /bin/sh packing slip (no number, the chair's word).
Numbers as last held by this seat: next free F-44.182, e-153, c-45.58. The chair's own ledger governs.

The seat is closed.
