# TDW_09 · F-09.165 + F-09.167 — THE MONEY WRITE DOOR
**Repo:** `dream-os` @ `556e164` · **dream-os ONLY.** The pwa ZIP follows, second.
**Rulings:** CE R-26.5 (W-1 lift, narrow) · R-26.6 (arm (b) EXPAND, the three bytes, the floor) · founder 「 ok 」
**CE-209 BRIDE INTEGRATION WALK REQUIRED before this seals.** Not optional; §7 is the card.

## Gates
`node --check` clean on both writers · `tdw09_rider2_budget` **54 / 54** cured · **41 RED at `556e164`** · **nine mutations, all biting**.

## 1 · ONE SEAT, TWO DOORS
New: `src/lib/coerceBudget.js`. Both writers now **call** it — `brideEngine.js` (WhatsApp *and* the in-app Dream room, same engine) and `src/api/couple/me.js` (Settings). Neither keeps a private copy. Carries the F-06.85 mechanism comment naming itself the single seat and telling the next editor to change the rule *there*.

**W-1 lift honoured narrowly.** The whole `brideEngine.js` diff is: one `require`, one `let savedSay`, and the budget arm's body. No adjacent tuning, no prose, no other field.

## 2 · THE CURE, EXECUTED
| she types | before | now |
|---|---|---|
| `12,50,000` | **Rs 12** | Rs 12,50,000 |
| `4,50,000` | **Rs 4** | Rs 4,50,000 |
| `4.5L` | **Rs 4** | Rs 4,50,000 |
| `1 crore` | **Rs 1** | Rs 1,00,00,000 |
| `2Cr` | **Rs 2** | Rs 2,00,00,000 |
| `₹4,50,000` | refused | Rs 4,50,000 |
| `45.5` | **Rs 45** | refused |
| `1e6` | **Rs 1** | refused |
| `50` | **Rs 50** | **asks** |
| `50000` | Rs 50,000 | **asks** |

The three founder bytes ship **verbatim** and are asserted character-for-character (§6). The query on the ruled specimen reproduces exactly: *Rs 50,000 — is that the full wedding budget, or did you mean Rs 50,00,000?*

**The suggestion arithmetic** is derived from that specimen: `≥1000 → ×100`, `<1000 → ×100000`. Both regimes give the same spoken figure re-read as lakhs — 50,000 and 50 both suggest Rs 50,00,000.

## 3 · REPORTED, NOT ADAPTED — three
**(a) THE VERBATIM BYTES CANNOT BE GUARANTEED THROUGH THE AGENT.** `brideEngine.js:271` hands tool results to the model as `JSON.stringify(result)`; the model then writes the sentence. There is **no verbatim-relay convention** in `brideSystemPrompt.js` — I grepped for one. The bytes ship in the tool result under `say_verbatim`, which is the strongest signal available without a system-prompt line, **and a system-prompt line is outside the W-1 lift** (budget coercion arm only). So: the read-back will be *substantially* right and may be *paraphrased*. If verbatim matters — and after this finding it may — that needs a wider lift, and it is one line.

**(b) THE FLOOR AT A DOOR WITH NO CONVERSATION.** R-26.6 scoped the floor to Dream Ai — 「 below it Dream Ai asks 」 — and said nothing about the REST route, which has no next message to listen for. Its only arms are accept-silently (which *is* the defect) or hand the question back. **It hands the question back: HTTP 409** (so a client can distinguish "invalid" from "confirm what you meant"), carrying the verbatim query byte, **writing nothing**. The Settings sheet already renders a save error, so the question reaches her with no new UI. A true confirm handshake is a rider if you want one.

**(c) NO CLEAR-TO-NULL, still.** Unchanged and still named in-file.

## 4 · THE BENCH CHANGED SHAPE, AND WHY
Before the cure, "no clash" meant lifting *both writers' own coercion bytes* and racing them. There is one seat now, so racing two copies that no longer exist would be a **vacuous green**. The honest question changed: §2.0 asserts both writers **call** the seat, §2.0b that neither kept a private coercion, and §2 drives the shipped seat against twenty rows.

**§5 INVERTED in this same commit**, as ruled. The cells that read *"F-09.165 STILL OPEN: 12,50,000 is accepted as Rs 12"* now assert the cure and name the close.

## 5 · THREE DEFECTS OF MINE, CAUGHT BY THE LEDGER
- **Cell 2.0 asserted an import string.** Mutation S-7 replaced the call with an inline `parseInt`, left the `require` standing, and the cell went green. **This is a REPEAT** — parity cell 7.2's first draft did the same thing this arc. Named in-file so the next reader distrusts the pattern rather than the author.
- **The bench read comments as code.** Cell 2.0b went red on `parseInt(value, 10)` inside the comment explaining that parseInt was *removed*. **Third time this class has bitten this arc** (the census's 147-vs-145 was the first). Decomment shim added; the prose cells now read `ROUTE_RAW` deliberately, and that split is named in-file.
- **The bench CRASHED at the uncured tree** on a static import of a module that does not exist there. A crash is not a red; it is an absent bench. Loaded dynamically now, with the seat's absence convicted **by name** — which is what produced the 41-red reading above.

## 6 · F-09.167, DISTINCT AND CURED HERE
`"50" → Rs 50` involves no truncation; the arithmetic is perfect and the outcome is still silently wrong. **A parsing defect and an ambiguity defect are different animals** and expansion alone never touches the second. Cells at `50`, `45`, `50000`, and both sides of the floor (`100000` accepts, `99999` asks).

**Standing law recorded at the seat:** the money register binds at INGESTION, not only rendering. The Expenses and Vendors sheets still take free text through the old `parseInt` shape — **named as this cure's natural next scope, not chartered here.**

## 7 · CE-209 INTEGRATION WALK CARD — Dev performs, LE reads
On WhatsApp **and** in the in-app Dream room. Both, because they are one engine behind two doors and that is the whole point.

1. *"my budget is 12,50,000"* → should land as **Rs 12,50,000**, and Dream Ai should say the figure back.
2. *"budget is 4.5L"* → **Rs 4,50,000**, said back.
3. *"make it 1 crore"* → **Rs 1,00,00,000**, said back.
4. *"my budget is 50"* → she should be **asked**, not told "saved". Answer her own way and check what lands.
5. *"budget 45.5"* → refused, with a reason she can act on.
6. Repeat **1 and 4** in the other surface. Same answers, or the two doors have drifted.
7. Settings → Total budget → type `50000` → the sheet should show the question, **and the row must not change.**

**Step 6 is the one that matters** — it is the founder-witness form of "no clash". **Step 4 is the one that tests the new idea**; watch whether the read-back arrives in the ruled words or paraphrased, per §3(a).
