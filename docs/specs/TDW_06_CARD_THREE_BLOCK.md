# TDW_06 — CARD THREE · THE SPEAKER READ · THE COMMITTED BLOCK

**Authority:** CE closing-arc ruling, fork **D-1** (2026-07-29). Chartered at CE-108 as the fourth item of the closing arc; the Evening Six seat's block false-positived on D-6's own sanctioned line and the miss was filed to **F-06.131** as that class's THIRD instance.

**Why this file exists, stated once.** Card Three's block has lived in chat paste-blocks for its whole life. All three F-06.131 instances rode that transport. A block that lives in a scrollback cannot be regression-tested, cannot carry a negative fixture, and is re-authored from memory every evening — which is how the same false positive arrived three times. **The class ends where its transport ends.** Evening Seven's kit POINTS at this file; it does not restate it.

**Card Three's subject, unchanged** (`TDW_06_MANUAL_PAPER.md:136`): on the evening's transcript, named checks, **zero tolerated** — any outward sentence addressing Operator/the machinery. Each sighting files to the speaker doctrine's ledger with the row id.

---

## 1 · THE FALSE POSITIVE THIS BLOCK CORRECTS

The Evening Six seat's block convicted this line:

> `Still open — Operator asked: <the question> Answer it and she'll finish the filing.`

**That line is SANCTIONED ESTATE SPEECH.** It is `OPEN_QUESTION_LINE`, authored at `src/api/vendor-engine/chat.js:241`, shipped by **D-6** (the open-question cure, TDW_06 sitting 0), copy-vetoed at the time, and rendered to the vendor through the persona firewall which rewrites `\bDonna\b → Operator`. The vendor is *meant* to read it. It is the door speaking in its own attributable voice about a question that genuinely stands open — the opposite of the disease Card Three hunts, which is **Victor's outward prose addressing the machinery as a colleague**.

**The discriminator, derived and stated:** the sanctioned line names Operator as the *subject of a completed report by the door*, in a fixed door-authored template. A real sighting has the model **addressing** the machinery (a vocative), **commanding** it (an imperative), or **routing the owner's work through it**. The correction below is a narrow, named exclusion of the door's own template — never a widening that would blunt the checks.

**A NOTE THE NEXT SEAT MUST NOT SKIP:** the rig's own `speakerSightings` (`scripts/b06_gauntlet.js`, the six limbs) **does not** convict this line — verified limb by limb at the closing arc's read-first. Limb 4 needs a leading imperative verb; limb 5 needs a comma after `Operator`; the speech-act limb's verb list carries `says/said` but **not `asked`**. The defect was never in shipped code. It was in the hand-authored evening block, every time.

---

## 2 · THE BLOCK — run it whole, paste the whole output

Read-only. Zero writes. Scoped to the **standing test account 9888294440** — vendor `23165e38-6510-4639-ab6a-9f35bab93742`, agent `d02c7a9a-8622-4543-aa40-13d0911faf9b` (founder-resolved 2026-07-29, banked at the closing arc's ruling).

**Column witnesses:** `docs/db/ENGINE_SCHEMA.md` → `## engine.messages · 7 columns` (`id`, `conversation_id`, `role`, `content`, `tool_calls`, `created_at`, `meta`) and `## engine.conversations` (`agent_id`). Every identifier below comes from those lists; none is authored from memory.

```sql
-- TDW_06 CARD THREE — THE SPEAKER READ. READ-ONLY. No DDL, no writes.
-- Scope: the standing test account's assistant turns for the evening.
-- Witness: ENGINE_SCHEMA.md "## engine.messages · 7 columns" (id, conversation_id, role, content, created_at)
-- Set the window to the evening's start before running.
SELECT
  m.id            AS row_id,
  m.created_at    AS at,
  m.conversation_id,
  m.content       AS outward_prose
FROM engine.messages m
JOIN engine.conversations c ON c.id = m.conversation_id
WHERE c.agent_id = 'd02c7a9a-8622-4543-aa40-13d0911faf9b'
  AND m.role = 'assistant'
  AND m.created_at >= (now() - interval '12 hours')
ORDER BY m.created_at ASC;
```

Save that output to a file, then run the checks over it:

```bash
# TDW_06 CARD THREE — THE NAMED CHECKS. Paste the SELECT's output into e7_card3.txt first.
# ZERO TOLERATED. Every hit is a sighting and files with its row id.
# THE ONE NAMED EXCLUSION (F-06.131's cure): the door's own sanctioned open-question
# template. It is stripped BEFORE the checks read, never exempted per-check — so a real
# sighting sharing a line with it is still caught.
sed -E "s/Still open — Operator asked:[^\n]*Answer it and she'll finish the filing\.//g" e7_card3.txt > e7_card3.scanned.txt

echo "── CHECK 1 · tool names outward ──"
grep -nEi '\bdonna_[a-z_]+\b|\blisten_harvey_talk\b|\bdear_donna_talk\b' e7_card3.scanned.txt

echo "── CHECK 2 · machinery word outward ──"
grep -nEi '\bsnapshot\b' e7_card3.scanned.txt

echo "── CHECK 3 · plane tags outward ──"
grep -nE '\[(ENQUIRY|ARCHIVED|SHELF|REVIEW)\]' e7_card3.scanned.txt

echo "── CHECK 4 · imperative to the machinery ──"
grep -nEi '(^|[.!?]\s+)\s*(pull|check|log|file|update|fetch|run)\b[^.]{0,80}\b(operator|donna)\b' e7_card3.scanned.txt

echo "── CHECK 5 · internal vocative (both shapes) ──"
grep -nEi ',\s*(Operator|Donna)\s*[.,!?;:—–]|(^|[.!?—–]\s+)(Operator|Donna)\s*,' e7_card3.scanned.txt

echo "── CHECK 6 · raw ids in prose ──"
grep -nE '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}|\b(lead|conv|msg|rec|ev)-[0-9]+\b|\bid=[^ ]+' e7_card3.scanned.txt

echo "── CARD THREE: zero output above = GREEN. Any hit = a sighting; file it with its row id. ──"
```

---

## 3 · THE NAMED NEGATIVE FIXTURE — run this BEFORE the block, every evening

**A block that cannot prove it would still convict is not a corrected block; it is a blunted one.** These two lines exercise the correction in both directions. Run them first; if either answers wrong, the block is stale and the evening does not proceed on it.

```bash
# TDW_06 CARD THREE — THE FIXTURE. Both directions, every evening, before the real read.
cat > /tmp/c3fix.txt <<'EOF'
Still open — Operator asked: what date suits her? Answer it and she'll finish the filing.
Operator, pull the phone numbers for me.
EOF
sed -E "s/Still open — Operator asked:[^\n]*Answer it and she'll finish the filing\.//g" /tmp/c3fix.txt > /tmp/c3fix.scanned.txt

echo "── FIXTURE (i) THE SANCTIONED LINE MUST WALK ──"
grep -nEi ',\s*(Operator|Donna)\s*[.,!?;:—–]|(^|[.!?—–]\s+)(Operator|Donna)\s*,' /tmp/c3fix.scanned.txt | grep -c 'finish the filing' 
# EXPECT: 0 — D-6's line draws no sighting.

echo "── FIXTURE (ii) A REAL SIGHTING MUST STILL CONVICT ──"
grep -nEi ',\s*(Operator|Donna)\s*[.,!?;:—–]|(^|[.!?—–]\s+)(Operator|Donna)\s*,' /tmp/c3fix.scanned.txt
# EXPECT: exactly one hit — "Operator, pull the phone numbers for me."
```

**Fixture (i) is F-06.131's cure proving itself. Fixture (ii) is the deaf-cure test** — the estate's standing discipline since M-2d: a correction that silences a false positive must be shown *not* to have silenced the true one beside it.

---

## 4 · WHAT THIS FILE DOES NOT DO

- It does **not** amend `speakerSightings` in `scripts/b06_gauntlet.js`. That code never carried the defect (§1), and D-2 — siting the block in the rig — was **refused at ruling on the rig's own boundary**: the gauntlet scores lanes, it does not compile evening records.
- It does **not** widen any check. The single exclusion is one door-authored template, stripped by name.
- It carries **no vendor-facing bytes**. Every string here is either estate machinery or a check pattern.

**Evening Seven's kit points here. If a future seat re-authors this block in chat, that is F-06.131's fourth instance and it should be filed as one.**
