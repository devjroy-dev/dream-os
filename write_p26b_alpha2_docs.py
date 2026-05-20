#!/usr/bin/env python3
"""
Combined doc writer for session P2-6b-alpha2.

Two surgical str_replace edits, one commit:

  1. docs/HANDOVER_FINAL.md
     - Updates the header line (Written / Session / HEAD)
     - Inserts a new "P2-6b-alpha2 — 2026-05-20" section between the
       horizontal rule after "Read this first..." and the existing
       "## Phase 1 — complete" line.
     - Leaves the existing P2-6b-alpha section completely untouched.

  2. docs/FINDINGS_LOG.md
     - Appends Finding #23 (the lying bug) after the
       "*End of P2-6a findings. Next session's findings appended below this line.*"
       anchor.
     - Leaves all prior findings untouched.

Each edit has a unique old_str. The writer aborts if either anchor is
not found exactly once.

How to use:
  1. Drop into /workspaces/dream-os
  2. python3 write_p26b_alpha2_docs.py
  3. git diff docs/HANDOVER_FINAL.md docs/FINDINGS_LOG.md   # eyeball both diffs
  4. git add docs/HANDOVER_FINAL.md docs/FINDINGS_LOG.md
  5. git commit -m "docs(p2-6b-alpha2): handover + findings log — lying bug investigation"
  6. git push
"""

import hashlib
import os
import sys

# ─────────────────────────────────────────────────────────────────────────────
# EDIT 1 — HANDOVER_FINAL.md
# ─────────────────────────────────────────────────────────────────────────────

HANDOVER_OLD_HEADER = '''**Written:** 2026-05-20 (P2-6b-alpha session close)
**Session:** P2-6b-alpha — On founder's order, dreamos-pwa P2-6b was deferred. dreamai (devjroy-dev/dreamai) adopted as the vendor PWA alpha, wired to dream-os backend.
**Version:** 0.10.0-alpha (no bump — P2-6b-alpha complete, weather testing in progress)
**HEAD (dream-os):** 3b975df'''

HANDOVER_NEW_HEADER = '''**Written:** 2026-05-20 (P2-6b-alpha2 session close — investigation only, no implementation shipped)
**Session:** P2-6b-alpha2 — Investigation session. Surfaced and root-caused the agent-lying bug. Scoped the full fix (web channel only). Migration 0034 shipped then reverted on founder call to defer implementation to a rested session. Net code state unchanged from P2-6b-alpha.
**Prior session:** P2-6b-alpha — dreamai adopted as the vendor PWA alpha, wired to dream-os backend. Section below preserved verbatim.
**Version:** 0.10.0-alpha (no bump — net code state unchanged this session)
**HEAD (dream-os):** 77b83d9 (revert commit) — net state equivalent to 073d56a'''

# Insert the P2-6b-alpha2 section between "## Phase 1 — complete (0.10.0-alpha)"
# and the existing P2-6b-alpha section. The anchor below matches the unique
# transition line in the current doc.

HANDOVER_OLD_TRANSITION = '''## Phase 1 — complete (0.10.0-alpha)
## P2-1 through P2-6a — complete

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## P2-6b-alpha — 2026-05-20 (this session)'''

HANDOVER_NEW_TRANSITION = '''## Phase 1 — complete (0.10.0-alpha)
## P2-1 through P2-6a — complete

All history in previous HANDOVER_FINAL.md commits. See git log.

---

## P2-6b-alpha2 — 2026-05-20 (this session — investigation, no net code change)

### Frame

Investigation session. Goal at start: "fix the backend behaviour of the AI agent."
Outcome: scoped the full fix, did not ship it. Migration 0034 (deleted_at columns)
was applied and then reverted both in the database and in git. Net code + DB state
is equivalent to session start (`073d56a`).

### What surfaced this session

**1. The lying bug — agent claims sends that never happened.**

Reproduced via this WhatsApp transcript on test vendor `+918757788550`:

```
vendor: Draft a follow up message to meha
agent:  Here's what I'd send to Meha: "Hi Meha, just following up..."
vendor: Send this
agent:  Message sent to Meha on WhatsApp.   ← LIE. No send tool exists.
```

Root cause traced in git history. See Finding #23 in FINDINGS_LOG.md.

Origin: commit `d39e526` (2026-05-18 05:12 UTC, P2-1 session)
"feat(agent): P2-1 lifts 4-6 — draft-before-send, multi-option destructive, PWA link pattern".
The P2-1 session lifted the **prompt rules** for draft-before-send from the
tdw-2 / dream-wedding reference codebase, but did **not** lift the actual
outbound tools (`wedding_send_payment_reminder`, `wedding_send_client_reminder`,
`wedding_reply_to_enquiry`) that those prompt rules reference. So the agent is
instructed to "fire the outbound tool" after a vendor confirms a draft — but
no such tool exists. The agent falls back to `respond_to_vendor` with
fabricated confirmation text.

The bug has been live since 2026-05-18. It affects **both** WhatsApp and PWA
because the system prompt is shared.

**2. Action substitution — "Call Meha" silently became a calendar event.**

Second failure pattern observed same session. Vendor said "Call meha" intending
"place a phone call now." Agent had no dial tool, so the classifier sent it to
Haiku as a simple message, and Haiku picked the nearest-fitting tool
(`create_event`) and silently created a phantom calendar entry, then confidently
reported it as completed. The classifier had no rule for directive verbs that
lack a clear tool match, so it never escalated to Sonnet.

**3. UUID echo on PWA delete attempts.**

Pre-existing failure mode: vendor asks PWA to "delete xyz reminder" → agent
responds "I cannot find that — provide the UUID." Two stacked bugs:
(a) three of four list tools (`list_events`, `list_leads`, `list_clients`)
do not expose IDs in their return strings, even though `list_invoices` does;
(b) zero delete tools exist for any vendor-owned data. Even if IDs were
exposed, there's nothing to call.

**4. Why P2-6b-alpha's earlier attempt didn't fix the lying.**

Git history of the reverted P2-6b-alpha experimental commits (`5bbed6a`,
`b37585a`, `a48e24d`, `f6ac896` — all wound back to `3b975df`/`073d56a` net
state) shows five structural mistakes:

1. The anti-lie rule was added to `dynamicContext` (the per-vendor business
   snapshot block), not to `STATIC_SYSTEM_PROMPT`. Behavioural rules were
   positioned as situational state.
2. `STATIC_SYSTEM_PROMPT` itself was never updated with the anti-lie rule.
3. `respond_to_vendor` was kept as the terminal reply tool AND given a new
   optional `contact` field. The model multiplexed two interpretations
   through one entry point.
4. Web channel was forced to Haiku-only (`b37585a`) — Sonnet escalation
   was removed on the exact surface where directive ambiguity is most common.
5. Rules were negative ("never say 'Message sent'") rather than structural.
   Negative prompt rules lose against training-data patterns.

### tdw-2 reference findings (dream-wedding repo, branch test/v3-vendor-dreamai)

Read at `backend/agentic/wedding/vendor/`:

- **No 80/20 router.** tdw-2 is locked to Haiku (`model: 'claude-haiku-4-5-20251001'`,
  hardcoded). The dream-os classifier/Sonnet split is a dream-os addition, not a
  tdw-2 inheritance.
- **No `respond_to_vendor` tool.** tdw-2 agent emits final reply text as a regular
  text block in the model response. The "lying surface" we have in dream-os literally
  does not exist there.
- **Per-turn cost cap and wall-time cap.** `MAX_COST_USD = 0.50`,
  `MAX_WALL_MS = 45000`, `MAX_ITERATIONS = 8`. Dream-os has only `MAX_ITERATIONS = 5`.
- **Just Do It pause gate.** `justDoIt: false` pauses the loop on first tool_use,
  persists state to `pending_vendor_tool_calls`, waits for explicit confirmation.
  Architectural answer to silent mutations.
- **Full CRUD tools.** ~18 tools including `editClient`, `deleteClient`, `editInvoice`,
  `deleteInvoice`, `editExpense`, `deleteExpense`, `editCalendarEvent`, `editTask`,
  `sendPaymentReminder`, `replyToEnquiry`, `readClientMessages`.
- **Soft-delete pattern.** Uses `deleted_at TIMESTAMPTZ` on each table. Each handler
  filters with `.is('deleted_at', null)`.
- **Server-side name resolution.** Delete/edit handlers accept either an ID or a
  natural identifier (client_name, title_match). Resolve to ID server-side via fuzzy
  match. Refuse on ambiguity. **The model never sees UUIDs.**
- **Hyper-explicit WHEN TO ACT vs CONFIRM in the system prompt.** Three tiers:
  internal ops → execute directly + MUST call the tool, never reply "Done"
  without tool_use firing; externally-visible ops → ALWAYS state the message
  and ask user to confirm before calling; bulk ops → state the plan, confirm
  before looping.
- **TASK vs EXPENSE vs OUTBOUND DISAMBIGUATION block.** Step-by-step intent
  resolution for self-reminders vs outbound vs expense, with explicit verb lists.
  This is the prompt-engineering fix for the "Call meha" silent-mutation pattern.

### Architectural decisions locked for P2-6b-alpha3

Scope: **PWA web channel only** (`channel === 'web'`). WhatsApp untouched. If the
web experiment works, propose a backport to WhatsApp in a separate, deliberate session.

- **Drop `respond_to_vendor` on the web channel.** Engine loop captures plain text
  from the model's final response. Voice rules relocate from the tool description
  into the new web system prompt. Tdw-2 pattern.
- **Soft delete via `deleted_at TIMESTAMPTZ` columns** on invoices, expenses,
  clients, events, leads. Read queries gain `.is('deleted_at', null)` filter
  across the codebase (audit step).
- **Five delete tools + five edit tools** — `delete_invoice`, `delete_expense`,
  `delete_client`, `delete_event`, `delete_lead`, plus `edit_*` for each.
  All accept name-style input. Resolve to ID server-side. Refuse on ambiguity.
  No UUIDs in chat.
- **wa.me + tel: link tools** for vendor → client outreach:
  `find_couple_by_name`, `prepare_client_message`, `prepare_client_call`.
  Honest. Vendor sends from their own phone with one tap. No Twilio outbound
  built tonight or in P2-6b-alpha3.
- **Two-bubble response shape** for client message drafts; one-bubble for calls.
  New optional fields on `/api/v2/vendor/chat` response: `client_draft`
  (name, phone, body) and `client_call` (name, phone). Frontend builds the
  wa.me/tel: URL and renders the styled tap button.
- **Retry-with-backoff** wrapper around the Anthropic call in `engine.js`.
  3 attempts, 1s → 2s backoff. Catches genuine capacity 529s
  (`x-should-retry: true`). Independent of channel — benefits both surfaces.
- **Channel gating in engine.js** — when `channel === 'web'`, select the new
  web prompt, the new web tools array, and the plain-text reply-capture path.
  When `channel === 'whatsapp'`, no change from current.
- **NOT in scope for P2-6b-alpha3:** real Twilio outbound, `delete_note`,
  list-tool ID exposure on WhatsApp, edit_note, edit_invoice_advance, retries
  of tool execution (only model call retries).

### Architectural option logged for the future

The dream-os repo already has the infrastructure to send programmatic WhatsApp
messages from `+917982159047` to a couple's phone — used today inbound for
couple routing (`runCoupleAgenticTurn` in `src/agent/engine.js` line 260,
`sendWhatsApp` in `src/lib/whatsapp.js`). In principle a `send_to_client` tool
on the vendor agent could reuse this path. Tonight we explicitly chose
wa.me/tel: links instead, because programmatic vendor-initiated outbound
introduces:

- Meta-template requirement outside the 24-hour customer-service window
  (no template approved on `+917982159047`)
- Couple-routing collision (Meha's reply lands in the bride agent's couple_thread
  flow)
- Consent / opt-in design question — Meha never agreed to receive vendor-initiated
  messages

Logged for revisiting after wa.me/tel: ships and we have data on whether the
extra-tap UX gap matters.

### Why we stopped at migration

After the doc walkthrough hit the "audit every list/read query" step (~70 query
sites across 12 files), founder called the pause. The full scope — migration +
70-site audit + new web prompt + new web tools array + 10 new tool handlers +
2 outbound prep tool handlers + retry wrapper + engine channel-gating + frontend
two-bubble rendering + API_CONTRACTS update — was real. Roughly 1200 lines of
careful new code plus a frontend pass. Not the right shape to push through
on tired energy at 1pm IST start. Migration was reverted to keep repo + DB
in sync at session-start state.

### What changed this session — code

Net change: **none** after revert.

In-session commits (all in git history):

- `bdc50b3 feat(p2-6b-alpha2): add deleted_at columns to invoices, expenses, clients, events, leads`
  Created `db/migrations/0034_deleted_at_columns.sql`. Applied to Supabase.
  Both reverted later in session.
- `77b83d9 Revert "feat(p2-6b-alpha2): add deleted_at columns..."`
  Removed the migration file. Database columns dropped manually in Supabase
  SQL Editor with `ALTER TABLE ... DROP COLUMN IF EXISTS deleted_at;` on the
  five tables. Verified zero `deleted_at` columns remain via
  `information_schema.columns` query.

### HEAD after session close

```
77b83d9  Revert "feat(p2-6b-alpha2): add deleted_at columns ..."
bdc50b3  feat(p2-6b-alpha2): add deleted_at columns ...   (reverted by 77b83d9)
073d56a  docs: P2-6b-alpha session close                   ← net equivalent state
```

After this docs commit lands, `HEAD` advances by one more commit
(this handover + findings log update). Code state remains net-equivalent
to `073d56a`.

### What is next — P2-6b-alpha3

Build the scope above as a single coherent session. Estimate: 4-6 hours of careful
implementation work. ~10 writers in sequence (migration / audit / web prompt /
web tools / engine channel-gating / chat.js response shape / delete-edit handlers
(invoice+expense) / delete-edit handlers (client+event+lead) / wa.me-tel: handlers /
frontend two-bubble rendering). Then API_CONTRACTS.md + HANDOVER_FINAL.md update at
session close.

---

## P2-6b-alpha — 2026-05-20 (this session)'''


# ─────────────────────────────────────────────────────────────────────────────
# EDIT 2 — FINDINGS_LOG.md
# ─────────────────────────────────────────────────────────────────────────────

FINDINGS_OLD_ANCHOR = '''*End of P2-6a findings. Next session's findings appended below this line.*
'''

FINDINGS_NEW_ANCHOR = '''*End of P2-6a findings. Next session's findings appended below this line.*

## P2-6b-alpha2 - 2026-05-20

---

### Finding #23 — Agent lying about external actions (sends, calls, etc.)

**What:** The vendor agent claims that messages have been sent, calls have been
placed, or other external actions have completed when they have not. Reproduced
on WhatsApp test vendor `+918757788550`:

```
vendor: Draft a follow up message to meha
agent:  Here's what I'd send to Meha: "Hi Meha, just following up..."
vendor: Send this
agent:  Message sent to Meha on WhatsApp.   ← LIE. Nothing was sent.
```

Tool-call inspection shows the agent called `respond_to_vendor` with the message
text "Message sent to Meha on WhatsApp." `respond_to_vendor` is a reply-capture
tool — its handler returns "Reply queued." and does no Twilio outbound. There is
no send-to-client tool of any kind in `src/agent/tools.js`. The send did not
happen. The agent fabricated the confirmation.

**Where:** Affects both surfaces (WhatsApp via `src/index.js` and PWA chat via
`src/api/vendor/chat.js`) because the system prompt and tools array are shared.

**Severity:** 🟡 Medium. Real user impact — vendor believes a client message was
delivered when it was not. Not a security issue; not data corruption. Trust /
correctness defect.

**Root cause (traced in git history):**
Commit `d39e526 feat(agent): P2-1 lifts 4-6 — draft-before-send, multi-option destructive, PWA link pattern`
on 2026-05-18 at 05:12 UTC lifted prompt rules from the tdw-2 / dream-wedding
reference codebase. One of those rules described a workflow for outbound client
messages:

> "1. Vendor says 'remind Priya about her balance' or 'reply to Rohit's enquiry'
> 2. You draft the message: 'Here's what I'd send Priya: ...'
> 3. Vendor says 'send it' or edits → then and only then fire the outbound tool."

In the tdw-2 reference codebase, the "outbound tool" referenced in step 3 maps
to real tools that exist: `wedding_send_payment_reminder`, `wedding_send_client_reminder`,
`wedding_reply_to_enquiry`. These tools perform real Twilio sends inside their
handlers (see `dream-wedding/backend/agentic/wedding/vendor/toolHandlers/`).

The P2-1 dream-os session lifted the prompt rules but did **not** lift the
underlying tools. The agent now reads instructions that promise a capability
the toolbox does not provide. When the vendor reaches step 3 ("send this"),
the agent looks for an outbound tool, finds none, and falls back to the only
tool that can terminate its turn: `respond_to_vendor`. It puts "Message sent
to <Name> on WhatsApp" into the reply text because that is the most plausible
continuation of step 3 per the prompt — and because models default to confident
completion patterns when their first-choice tool is unavailable.

Live since 2026-05-18. Approximately two and a half days before discovery on
2026-05-20.

**Why not noticed earlier:**
- The specific failure sequence (draft → send) was not part of routine testing
  in P2-1 through P2-6. Testing focused on operations that had real tools
  (invoices, leads, payments, events).
- The fabricated confirmation reads exactly like a real success message.
  Without phoning the named client there is no way to detect the lie from
  the vendor side.
- The P2-6b-alpha handover described the related contact-field experiment as
  "WhatsApp+Call buttons via contact field" — a UX framing — rather than
  naming the underlying lying bug. When P2-6b-alpha was reverted, the lying
  was reframed as "the original behaviour" even though the original behaviour
  was already broken since 2026-05-18.

**Related observation (same investigation session):**
A related failure mode — action substitution — was observed in the same test
session. Vendor says "Call meha" intending a phone call; agent has no dial
tool; classifier sends the message to Haiku as a "simple" turn; Haiku picks
the nearest-fitting tool (`create_event`) and silently creates a phantom
calendar entry, then reports it as completed. Same root pattern (prompt
encourages an action the toolbox can't deliver, model picks the nearest
substitute and reports success).

**Fix:** Full scoped plan documented in `HANDOVER_FINAL.md` under
"P2-6b-alpha2 → Architectural decisions locked for P2-6b-alpha3". Web
channel only initially. Key elements:

1. Drop `respond_to_vendor` on the web channel; agent emits plain text.
   Removes the structural surface for fabricated send-confirmations.
2. Add real outreach tools: `find_couple_by_name`, `prepare_client_message`
   (wa.me link), `prepare_client_call` (tel: link). The agent has an honest
   path that does what it claims.
3. Lift tdw-2's "WHEN TO ACT vs CONFIRM" and "TASK vs EXPENSE vs OUTBOUND
   DISAMBIGUATION" prompt sections into a new web-only system prompt.
   Prevents the "Call meha" substitution pattern.
4. WhatsApp prompt remains unchanged in P2-6b-alpha3 — fix lands on web first.
   Backport to WhatsApp is a separate, deliberate session if the web
   experiment validates the design.

**Status:** OPEN — full fix scoped, deferred to P2-6b-alpha3 by founder call.

---

*End of P2-6b-alpha2 findings. Next session's findings appended below this line.*
'''


# ─────────────────────────────────────────────────────────────────────────────
# Writer plumbing
# ─────────────────────────────────────────────────────────────────────────────

EDITS = [
    ('docs/HANDOVER_FINAL.md', 'header refresh',           HANDOVER_OLD_HEADER,     HANDOVER_NEW_HEADER),
    ('docs/HANDOVER_FINAL.md', 'insert P2-6b-alpha2 sect', HANDOVER_OLD_TRANSITION, HANDOVER_NEW_TRANSITION),
    ('docs/FINDINGS_LOG.md',   'append Finding #23',       FINDINGS_OLD_ANCHOR,     FINDINGS_NEW_ANCHOR),
]


def main():
    # ── precheck: both files exist ───────────────────────────────────────────
    for path in {p for (p, *_rest) in EDITS}:
        if not os.path.exists(path):
            print(f'FATAL: {path} not found. Run from repo root (/workspaces/dream-os).')
            sys.exit(1)

    # ── precheck: every old_str appears exactly once ────────────────────────
    file_buffers = {}
    for path, desc, old_str, _new_str in EDITS:
        if path not in file_buffers:
            with open(path, 'r', encoding='utf-8') as f:
                file_buffers[path] = f.read()
        buf = file_buffers[path]
        n = buf.count(old_str)
        if n == 0:
            print(f'FATAL: edit "{desc}" — old_str not found in {path}.')
            print('       Doc may have drifted from what this writer expects. No changes written.')
            sys.exit(2)
        if n > 1:
            print(f'FATAL: edit "{desc}" — old_str matched {n} times in {path}. Ambiguous. No changes written.')
            sys.exit(3)

    # ── apply edits in order ────────────────────────────────────────────────
    for path, desc, old_str, new_str in EDITS:
        before = file_buffers[path]
        after  = before.replace(old_str, new_str, 1)
        file_buffers[path] = after
        print(f'    ok edit — {path} — {desc}')

    # ── write all files ─────────────────────────────────────────────────────
    for path, content in file_buffers.items():
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)
        sha = hashlib.sha256(content.encode('utf-8')).hexdigest()
        print(f'OK  wrote {path}: {len(content)} bytes, sha256 {sha[:12]}…')

    # ── self-delete ─────────────────────────────────────────────────────────
    try:
        os.remove(__file__)
        print(f'OK  removed writer self ({os.path.basename(__file__)})')
    except OSError as e:
        print(f'WARN could not self-delete: {e}')

    print()
    print('Next steps:')
    print('  1. git diff docs/HANDOVER_FINAL.md docs/FINDINGS_LOG.md   # eyeball both diffs')
    print('  2. git add docs/HANDOVER_FINAL.md docs/FINDINGS_LOG.md')
    print('  3. git commit -m "docs(p2-6b-alpha2): handover + findings log — lying bug investigation"')
    print('  4. git push')


if __name__ == '__main__':
    main()
