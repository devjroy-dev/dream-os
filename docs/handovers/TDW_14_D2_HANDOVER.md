# repo: dream-os @ 3ebdc7b · TDW_14 · D-2 — THE CIRCLE TEMPLATE

**Seat:** LE · **Rulings:** CE-32 D-2 (① three-over-time · ② the member STOP · ③ stops at filing).
**Tips at build, fetch-first, SIBLING-FULL:** dream-os `3ebdc7b` · dreamos-pwa `403faf9`.
**dream-os only. Zero pwa bytes. Zero DDL. Zero prompt bytes — W-1 shut.**

---

## 1 · WHAT SHIPPED — three paths

| Path | State |
|---|---|
| `src/lib/templates.js` | `circle_place_ready` entry added, `status: 'approved'`, authored **from the wire** |
| `docs/TEMPLATES.md` | §2 entry 9 + §3 tracker row 9 |
| `scripts/b14_d2_template_bench.js` | **NEW** — 27 cells, 5 mutations, both-ways |

**No caller ships** (ruling ③). Filing-ahead is P-06.T clause 5's own practice; `status` + `sendWa`'s approval gate mean nothing sends unintentionally.

---

## 2 · THE WIRE WITNESS — and why the render was demanded after the wamid

| witness | value |
|---|---|
| Meta template ID | `2069520823656352` · Utility · English |
| Dashboard | **Active – Quality pending**, 2026-08-13 (founder screen) |
| Live send | PNID `1193630900506451` (the **bride** lane — the circle rides it, §7.1) → `+918757788550` |
| Accepted | `wamid.HBgMOTE4NzU3Nzg4NTUwFQIAERgSNjY2MTMxNzg0MkRDNDEwQ0FEAA==` |
| Delivery | bride-webhook callbacks **sent · delivered · read** |
| Render | witnessed on the handset |

**"Quality pending" is the QUALITY RATING, not the review state — Active is the approval.** The same reading `demo_lead_alert` and `enquiry_alert_vendor` already carry; written down again at the new entry because it has been misread once in this estate's history.

**THE RENDER IS THE ONLY SLOT-ORDER ORACLE, and this is why it was worth a second ask.** Parameters are **positional and Meta only counts them**. A payload whose three values are right but ordered wrong is *accepted*, returns a wamid, delivers cleanly, and reads *"Hi Dev Test 23, your place in Mehek's wedding circle…"* — wrong, silently, on a real invitee's phone. No API response can catch it, and the wrong order would then have been baked into `variables:` and shipped. The handset rendered **"Hi Mehek, your place in Dev Test 23's wedding circle…"** for parameters sent as `[Mehek, Dev Test 23, <link>]`, so `variables: ['invitee','bride','link']` is **read off the delivered message**, never inferred from the filing form.

**A residual closed en route:** `enquiry_alert_vendor`'s comment names `en` vs `en_US` as an undecided risk whose signature is a Meta `132001`. The accepted send **answers it for this WABA: `en` is correct.** `WA_TEMPLATE_LANGUAGE` stays unset.

**One disclosure carried forward honestly:** the test send's copy was **not true for its recipient** — Mehek is `status='active'` and completed setup weeks ago, and `CIRCLE-WIRETEST` resolves to nothing. It was a wire-and-render test on the founder's own test handset, declared as such before it was fired. The first *product* send goes to someone for whom the sentence is true.

---

## 3 · THE COPY REFUSAL, on the record

The first draft — *"your invitation to join {{2}}'s wedding circle … is still open. Tap here to set up your access"* — was **refused by Meta's pre-submission classifier as MARKETING**, verbatim: *"This message template will be rejected."*

Three signals, each visible in hindsight: **"invitation"** is an offer · **"is still open"** is urgency · **"set up your access"** implies the recipient has nothing yet. Meta's dialog defines Utility as messages about *"an existing order or account"*, and this file's three approved UTILITY bodies obey that literally — each **asserts in past tense a thing that already exists**, then names the action servicing it. `vendor_welcome`'s own comment records the identical failure one template earlier. **The precedent was in the file and I read past it; I mirrored `demo_invite`'s tone rather than its structure.**

The filed body is **truthful rather than merely compliant**, and that distinction is the whole cure: `invite_circle_member` writes the `circle_members` row — her name, her role, her token — at the moment the bride invites, so *"your place … has been created"* asserts a record that genuinely exists at send time. It passes Utility because it is true, not because the words were sanded. The template **name** moved with the body (`tdw_circle_invite_reminder` → `tdw_circle_place_ready`) because "invite" was doing part of the damage.

**Veto satisfied by the founder's own filing hand** — the bytes were entered in his dashboard, recorded at CE-32 as veto-by-filing.

---

## 4 · PROOF

**Both-ways.** Cured tree **27/27, exit 0**. Against the pre-D-2 registry (`git checkout 3ebdc7b -- src/lib/templates.js docs/TEMPLATES.md`): **14 cells RED** — every D-2 cell and only D-2 cells.

**The anchor is the wire, not the draft (F-08.75).** `WIRE_PAYLOAD` in the bench is the `template` object of the accepted POST; `RENDERED_BODY` is the handset text. Neither is copied from the veto sheet — a bench anchored on the draft would agree with its author about a filing it never saw.

**The load-bearing cells:**
- **§2.1** fills the registry body with the wire's parameters positionally and asserts the result **equals the message the handset showed**.
- **§2.3** builds through the **named-vars** path a real caller uses and asserts the payload is `deepStrictEqual` to what Meta accepted. **§4.M1** swaps the variable order and both red — the silent-wrong-send class, mechanised.
- **§3.1–§3.6** check TEMPLATES.md §1 compliance mechanically, including an absence cell for the refused draft's three signals.

**5 mutations, all on production registry data**, restores sha256 byte-identical.

**Floors:** dream-os **21 non-zero exits — DELTA ZERO** against the adopted seventeen plus the four credential-blocked. `b14_d1_visibility_bench` **62/62 unmoved**. `b07_f0772` **158/159**, pinned §12.14. pwa untouched (zero pwa bytes). `npm run build` exit 0, `node --check` clean.

---

## 5 · MY CORRECTION, owned in-band

**Two mutations targeted strings that appear in the comment prose above the entry.** `§4.M2` aimed at `'has been '` and `§4.M5` at `'your place in'` — both of which this file quotes in the paragraph explaining the refusal. `String.replace` takes the **first** occurrence, so both edited a comment, the body never moved, the named cells stayed green, and the harness reported them **decorative**. It was right.

**This is comment-blindness wearing the other face.** The standing law strips comments before *asserting* against source; this is the same hazard while *mutating* it, and it is sharper here because a well-documented entry quotes its own body. Both targets now carry the JS concatenation syntax (`' +`), which exists only in the code. The lesson is written into the bench beside them.

---

## 6 · THE TWO FINDINGS, recorded at the site a caller will read

Neither has machinery to attach to (ruling ③ ships no caller), so both are **declarations under F-06.85 that instruct their own re-read**, homed at the registry entry rather than in a document the caller's author may never open.

**F-14.6 — the window signal on this lane is a trap.** `conversations.last_message_at` is bumped by **coplanner web sends** (`circle/messages.js`), so supplying it to `sendWa` claims an open 24h WhatsApp session because somebody typed in a browser. Any caller derives last-inbound from `messages`. `sendWa` refuses to guess; it must not be taught to guess wrong. CE-212 §⑤'s circle specimen.

**F-14.7 — the member's STOP is half-armed, cure ruled.** FULL STOP is phone-keyed and blocks a member **only if** her phone already exists as an opted-out prospect row — and no circle path creates one. NUDGE-CLASS is lane-scoped to `bride|vendor`, so a member's pause would also silence her bride-lane morning nudge. **Ruled (CE-32): a STOP lands on the lane it was said in** — cure is `nudge_optout`'s vocabulary widened with `'circle'` at its one home, `_assertLane` widened with it, consulted at every circle send site **at birth**. Minting a prospects row for a member was **REFUSED** — a wedding guest must never enter the marketing lane's terminal register — and the refusal is recorded so no future hand re-proposes it as new. **§5.3 reds if any part of that record is deleted.**

**Chair's §0.2 check discharged:** my read-first §5.2 arm (b) was *"add `circle` as a third `nudge_optout` lane"* — character-identical to the ruled shape. No material difference, so no bounce-back was owed.

---

## 7 · SPEC DEPARTURE, labelled

**TDW_14 C-6 specified ONE template with a variable slot** carrying invite · task-assigned · poll-closing. **Superseded at CE-32 with reasons on the record:** a body vague enough to carry three meanings cannot earn UTILITY — §6's legacy `tdw_morning_brief_…` is the estate's own evidence, classified Marketing for exactly that — and only one of the three subjects exists today (`circle_activity` writes `save_added` · `comment` · `removed` and nothing else). **Three-over-time ruled:** D-3 files its own for polls, D-4 for delegation, each at its feature's birth.

---

## 8 · WHAT THE FOUNDER DOES

**STEP 1 — apply the ZIP. STEP 2 — verify. STEP 3 — git.**

**No SQL. No dashboard acts. No file to open. No env var.** The template is already filed and Active; this delivery only teaches the repo what you filed.

## 9 · WHAT D-3 INHERITS

- **The template pattern is now proven end to end** — filed, wire-witnessed, registry-bound, render-verified. D-3's poll-closing template follows the same path: draft → your veto → you file → Active → wire test → registry entry.
- **The two findings are waiting where its author will look.** D-3 mints polls; if it also mints a *send*, it owes F-14.7's cure at that send site's birth and must obey F-14.6's window rule.
- **D-1's resolver is the choke point** D-3's poll visibility reads through; `§5.1` of the D-1 bench reds if a fourth consumer appears without going through it.

**Sequencing beyond this delivery is the founder's.**
