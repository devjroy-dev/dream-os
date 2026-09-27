# CE-46 · ELZ-2 · CUT 1 · THE CHANNEL-AWARE TURN · HANDOVER

Base 31cd6fd (ASK-1's cut 1d on ELZ-2's m181 landing; r2 of this cut, ordered by the chair 27 September 2026 after 1d landed at
31cd6fd while the 9dff862 card was unrun). THE CARRY, by command (R-45.14): the tracked diff at 31cd6fd is byte-identical to the
tracked diff at 9dff862 (diff of the two patches empty), the three new files byte-identical (cmp); 1d's six paths (askTools.js,
spokenRange.js, b130a, b130m, its handover and manifest) overlap none of these nine; b135 both ways, the differential and the
rehearsal repeated at 31cd6fd (§2).
Ruled by the chair on ELZ-2's read-first (27 September): F1 (a), F2 (a), F3 (a), F4 (a), F6 out, the Instagram and own-number seams
with IGD-2 and G6-2; the founder's answers the same day: Q6 yes, Q3 yes, Q2 = 1, Q1 = 1 (no byte here), Q4 = 2. W-1 lift, named and
bounded: engine.js at the phone sites plus the parameter and the source value; coupleSystemPrompt.js at :117 and :127 and the two
channel blocks; elizaSoul.js UNTOUCHED (C6 stands). Rung b135. Findings cured: F-44.190, F-44.191 (F-44.206 is cured at the lane by
the persona path running on Instagram; F-44.205 is the fifth fact below). Errors: none.

## 1 · What shipped

ONE optional parameter on runCoupleAgenticTurn, `counterparty`, defaulting to today's shape (src/agent/engine.js, resolveCounterparty):
```
counterparty: { channel: 'whatsapp_shared' | 'whatsapp_own' | 'instagram',
                phone: E.164 | null,          the couple's key on both WhatsApp channels (falls back to couplePhone)
                igsid: string | null,         the couple's key on Instagram (leads.counterparty_ig_id, 0173)
                enquireLink: string | null,   Instagram only: the studio's WhatsApp link from enquireLinkFor (§7c); the fifth fact
                chatted_before: boolean }     whatsapp_own only: the caller says the couple has written to this number before
```
THE SIGNATURE, PINNED for IGD-2 and G6-2: `runCoupleAgenticTurn({ vendor, vendorUser, conversation, couplePhone, coupleId,
inboundMessage, rawInboundBody, supabase, anthropic, counterparty })`; the return is unchanged: `{ reply, toolCalls, iterations,
vendorNotification, leadName }`. The turn COMPOSES; the caller sends and records (the four WhatsApp sites in vendorInbound.js, pinned
by label in b135 §1); no studio prefix on Eliza's replies on any channel (c-46.7); the quiet time and the lane's own switch are the
caller's; an unknown channel value falls to the shared line. IGD-2's caller passes `{ channel: 'instagram', phone: null, igsid,
enquireLink }` and NO flag; G6-2's passes `{ channel: 'whatsapp_own', phone, chatted_before }`.

Site by site (engine.js): the returning-client read and the capture's existing-lead read keyed by the channel's column (phone, or
counterparty_ig_id on Instagram; F-44.190's :257 and :519); the Frost read (users by phone, then couples) SKIPPED on Instagram (:282);
the log line names channel and key (:296); the insert carries `phone` (null on Instagram), `counterparty_ig_id` (null on WhatsApp)
and `source` 'instagram' or 'whatsapp' (:563, :578); the capture notice `New enquiry on Instagram. {summary}. Lead saved.` on
Instagram, his WhatsApp bytes unchanged (:667/:668, C2, IGD-2's V1); the returning fallback `{name} just messaged on Instagram:
"{message}"` on Instagram, his WhatsApp bytes unchanged (:732, C3, IGD-2's V1b); the persona path on Instagram regardless of
couple.eliza_enabled, the flag not consulted there, the shared line's read unchanged (:309, Q2 = 1); {client} on the vendor's date line
through one word rule, clientWord: the name, else the last four digits on WhatsApp, else "An Instagram client" on Instagram
(VENDOR_DATE_LINE untouched). The turn no longer throws on a null phone.

The shell (coupleSystemPrompt.js): the header reads `You answer messages for {studio}, a {trade} based in {city}.` in both branches
(Q6, F-44.191); on Instagram, when a link is handed in, one block "IF THEY WOULD RATHER TALK ON WHATSAPP" gives her the link as a fact
to offer in her words only when asked (IGD-1's Q2); on the own number with chatted_before and not yet in conversation by the thread's
record, one block drops the first-contact greeting (Q4 = 2). Neither block is a vendor- or couple-facing byte; FACT 1 still wins.

Evidence found and NOT changed: the "...NNNN just messaged" fallback at the old :732 is unreachable at the tree (a returning client is
one with a name on file, engine.js isReturningBride); the reachable no-name word is the date line's (b135 2.5, 3.11).

## 2 · Proof

b135 38/38 (no clock read; green on five shifted clocks under C-44.13: next day IST, 31 December 2027 23:30 IST, 1 January 2028,
29 February 2028, mid-2027); --mutate 52/52: M1 the key always phone, M2 source always whatsapp, M3 the WhatsApp notice head on
Instagram, M4 the flag consulted on Instagram, M5 the link block dropped, M6 chatted_before ignored, M7 the Frost read made on
Instagram, each reddening its named cell, files restored by sha. BOTH WAYS: at the uncured base 9dff862 b135 reads 19/38 (at 9dff862 and again at 31cd6fd) with exactly
the cure cells red (2.3 the new column on the insert, 2.7 and 5.1 to 5.4 the header, every §3 cell, 4.2, 4.6); at the cut 38/38.
Re-pinned by label (old bytes grepped across scripts/ first): b08_p5_eliza (§1.1, §1.2: the header byte), b115 (runCoupleAgenticTurn
c846323d1783, the cap 820 to 860, every money pin unchanged), b118a (M1's and M2's anchors re-aimed at the channel-keyed read). The
differential at 9dff862 and again at 31cd6fd, engine built both sides, over the 28 benches reading engine.js or coupleSystemPrompt.js plus b135, exits and
reached cells: only b135 differs; b05_arc_m4 (floor-base) and b06_gauntlet (key refusal) identical both sides. The floor: the
founder's block F.

## 3 · Walk record

The shared line's walk (the card in the attach): the turn as today on his couple handset against DEV440; the vendor's notice on his
WhatsApp with his unchanged bytes. The Instagram walk and the own-number walk happen only on the chair's word after IGD-2's 2b and
G6-2's 2b land with their env and Meta steps.

## 4 · Open

Cut 2: the cache breakpoint (F5 (b)) with the probe. F-44.183 (a vendor relay to an Instagram-only client cannot find its thread by
counterparty_phone, relayToCouple.js findOrCreateCoupleThread :91): the relay road, later. F-44.181's cure: the next seat's, as ruled
(TDW_CE46_ELZ2_M181_HANDOVER.md §3). IGD-2 pins against the signature above; G6-2's F-44.207 hunk lands in vendorInbound.js outside
the four call-site blocks b135 pins.
