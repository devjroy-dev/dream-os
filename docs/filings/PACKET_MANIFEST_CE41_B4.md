# CE-41 · SEAT B · PACKET MANIFEST — B1c AND THE B4 READS

**Base:** dream-os `18e46be19684b65ad51ba44049694c389aeb9093` (seat D's D0), fetch-first, full
hash derived by command from the chair's abbreviation.
**Cut:** 2026-09-09 · CE-41 LE-B · docs-only · nothing under `src/`, `db/`, `scripts/`, nothing
in the pwa.

Seven files. This packet accumulated across two freezes.

| # | File | What it is | New or amended |
|---|---|---|---|
| 1 | `docs/TEMPLATES.md` | **B1c.** §2 row 10 — body and slot order confirmed correct at the Manager (founder's capture 01:30, 2026-09-09) and the registry's divergence dated with its `file:line` and F-41.63. §2 row 12 — witnessed at the Manager; body, four variables, order `name · month · category · handle`, no button, all as filed. | amended |
| 2 | `docs/filings/B1_CONCIERGE_TEMPLATES.md` | **B1c.** New §5a: the four concierge templates as a table — two witnessed at source, one witnessed **wrong on the wire**. | amended |
| 3 | `docs/filings/B4_5a_DONNA_PROVIDER_ROW.md` | The `donna_provider` row; the `pwa_vendor` correction (c-41.18); F-41.46; §3 closed as derived; R-41.84's held rows. | new |
| 4 | `docs/filings/META_INCORPORATED_DOCS_F4133.md` | F-41.33 opening — the January finding, the Business Agents location, the six-link list. | new |
| 5 | `docs/filings/META_INCORPORATED_DOCS_READ.md` | F-41.33 — six documents read whole; four unpriced obligations. | new |
| 6 | `docs/filings/MODEL_PROVIDERS_VS_META_4_7.md` | B4·4 — §2b the chair's Z.ai read (F-41.34); §2c F-41.48's Anthropic clause derived at the Commercial Terms. | amended |
| 7 | `docs/filings/PACKET_MANIFEST_CE41_B4.md` | this file, regenerated at the real base | amended |

---

## F-41.63 is cured at this base — verified, not assumed

D0's subject says the registry body went *"verbatim to TEMPLATES.md §2 row 10."* Checked at
`18e46be` by command rather than taken from the message:

```
src/lib/templates.js  assist_lead_outside
  variables: ['name', 'month_year', 'city', 'category_words', 'budget_rs']
  body:      "Hi {{1}}, a couple planning a {{2}} wedding in {{3}} asked The Dream Wedding to …"
```

Slot order `name · month · city · category · budget` — matching §2 row 10 and the Manager
capture. **The registry, the document and the filing now agree.** §2 row 10 therefore describes
the divergence in the **past tense**, which is correct against this tree.

**`docs/TEMPLATES.md` is byte-identical between this seat's base (`0b27cc6`) and `18e46be`** —
verified by checksum before the edits were re-applied, so nothing of D0's was overwritten.

---

## A correction this seat made mid-cut, for the second time

Re-basing headers, a blanket regex over `docs/filings/*.md` rewrote the `Base:` line on **eight
files already on the tree and not in this packet.** Classified by command — header-only versus
content — and all eight reverted before the cut. `git status` shows exactly the seven files
above.

**This is c-41.14 repeating, by the same mechanism, four days later.** The lesson did not hold
because it was written as a finding and not as a habit. The habit that would hold: **re-base
only the files the packet is cutting**, named explicitly, never a glob over a directory.

---

## What is owed after this push

**The three reads, in order** — the DPA's **APAC annex** (it governs India), the **WhatsApp
Business Messaging Policy**, then **Anthropic's DPA**. F-41.33 closes on the first two; F-41.48
closes for Anthropic on the third.

**R-41.97's cell (`b64`)** — this seat reads it when it lands. The document side was written to
this seat's spec; the spec's own warning stands: **arity and sequentiality alone would have been
green on F-41.63**, and only the literal-subsequence assertion catches it. A permuted
`variables` array with an unchanged body is outside what any document-to-document cell can see,
and that residue belongs in the cell's comment.

**Still open:** F-41.9 (pricing re-check, 09-25) · F-41.20 (the six orphan templates) · F-41.49
(per-Client segregation, R9 J2) · A4's three bytes, still the last thing between the estate and
a durable Google refresh token.
