# Session 5 file writes

## write_detail.py

```python
content = r"""// src/admin/views/detail.js
// Session 5: adds TDW handle + Instagram to vendor profile rows

const TDW_WA_NUMBER = process.env.TDW_WA_NUMBER || '14787788550';

function renderDetail({ vendor, user, state, messages, notes, leads }) {
  const name = user?.name || vendor.id.slice(0, 8);

  const statusLabel = vendor.onboarding_state === 'complete' || !vendor.onboarding_state
    ? 'Active' : vendor.onboarding_state === 'new' ? 'Invited' : 'Onboarding';

  const tdwHandle  = vendor.routing_handle || null;
  const tdwDisplay = tdwHandle
    ? `<a href="https://wa.me/${TDW_WA_NUMBER}?text=TDW-${tdwHandle}" target="_blank" style="color:#B08D6A;text-decoration:none;">TDW-${tdwHandle}</a> <span style="color:#8C8480;font-size:11px;">· wa.me/${TDW_WA_NUMBER}?text=TDW-${tdwHandle}</span>`
    : '—';
  const igDisplay  = vendor.instagram_handle
    ? `<a href="https://instagram.com/${vendor.instagram_handle}" target="_blank" style="color:#B08D6A;text-decoration:none;">@${vendor.instagram_handle}</a>`
    : '—';

  const profileRows = [
    ['Name',      name],
    ['Phone',     user?.phone || '—'],
    ['Category',  vendor.category || '—'],
    ['City',      vendor.city || '—'],
    ['Status',    statusLabel],
    ['TDW Link',  tdwDisplay],
    ['Instagram', igDisplay],
    ['Summary',   state?.summary || '—'],
  ].map(([k, v]) => `
    <tr>
      <td style="color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;width:120px;padding:8px 0;">${k}</td>
      <td style="font-size:13px;padding:8px 0;">${v}</td>
    </tr>
  `).join('');

  const bubbles = messages.length === 0
    ? '<div class="empty-state">No messages yet.</div>'
    : messages.map(m => `
        <div class="message-row ${m.direction}">
          <div>
            <div class="bubble ${m.direction === 'inbound' ? 'bubble-in' : 'bubble-out'}">${m.body || ''}</div>
            <div class="msg-meta">${m.sent_by} · ${new Date(m.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
          </div>
        </div>`).join('');

  const notesList = notes.length === 0
    ? '<div class="empty-state">No notes yet.</div>'
    : notes.map(n => `
        <div class="note-row">
          <div class="note-content">${n.content}</div>
          <div class="note-meta">${(n.tags || []).join(', ')} · ${new Date(n.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</div>
        </div>`).join('');

  const leadsList = leads.length === 0
    ? '<div class="empty-state">No leads yet.</div>'
    : `<table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead>
          <tr style="border-bottom:1px solid #2a2a2a;">
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Name</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Date</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">City</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Budget</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">State</th>
            <th style="text-align:left;padding:8px 0;color:#8C8480;font-size:11px;text-transform:uppercase;letter-spacing:.1em;">Received</th>
          </tr>
        </thead>
        <tbody>
          ${leads.map(l => {
            const budget = l.budget_min
              ? `Rs ${(l.budget_min/100000).toFixed(1)}L${l.budget_max && l.budget_max !== l.budget_min ? `–${(l.budget_max/100000).toFixed(1)}L` : ''}`
              : '—';
            return `<tr style="border-bottom:1px solid #1a1a1a;">
              <td style="padding:8px 0;">${l.name || '—'}</td>
              <td style="font-size:12px;">${l.wedding_date || '—'}</td>
              <td style="font-size:12px;">${l.wedding_city || '—'}</td>
              <td style="font-size:12px;">${budget}</td>
              <td style="font-size:12px;">${l.state}</td>
              <td style="font-size:12px;">${new Date(l.created_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${name} — dream-os admin</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #111; color: #E8E0D8; font-family: 'DM Sans', system-ui, sans-serif; min-height: 100vh; }
    .topbar { background: #1a1a1a; border-bottom: 1px solid #2a2a2a; padding: 16px 32px; display: flex; align-items: center; gap: 16px; }
    .topbar a { color: #8C8480; text-decoration: none; font-size: 13px; }
    .topbar a:hover { color: #E8E0D8; }
    .topbar .sep { color: #2a2a2a; }
    h1 { font-size: 20px; font-weight: 500; }
    .subtitle { color: #8C8480; font-size: 13px; margin-top: 2px; }
    .container { max-width: 960px; margin: 0 auto; padding: 32px; }
    .card { background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px; padding: 24px; margin-bottom: 24px; }
    .card-title { font-size: 11px; text-transform: uppercase; letter-spacing: .1em; color: #8C8480; margin-bottom: 16px; }
    .tabs { display: flex; gap: 0; border-bottom: 1px solid #2a2a2a; margin-bottom: 24px; }
    .tab { padding: 10px 20px; font-size: 13px; color: #8C8480; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; text-decoration: none; }
    .tab.active { color: #E8E0D8; border-bottom-color: #B08D6A; }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .message-row { display: flex; margin-bottom: 12px; }
    .message-row.outbound { justify-content: flex-end; }
    .bubble { padding: 10px 14px; border-radius: 12px; max-width: 70%; font-size: 13px; line-height: 1.5; }
    .bubble-in { background: #2a2a2a; }
    .bubble-out { background: #3a2e24; }
    .msg-meta { font-size: 10px; color: #8C8480; margin-top: 4px; }
    .message-row.outbound .msg-meta { text-align: right; }
    .note-row { padding: 10px 0; border-bottom: 1px solid #1f1f1f; }
    .note-content { font-size: 13px; }
    .note-meta { font-size: 11px; color: #8C8480; margin-top: 4px; }
    .empty-state { color: #8C8480; font-size: 13px; padding: 16px 0; }
    table { width: 100%; }
  </style>
</head>
<body>
  <div class="topbar">
    <a href="/admin">dream-os</a>
    <span class="sep">/</span>
    <span style="font-size:13px;">${name}</span>
  </div>
  <div class="container">
    <div style="margin-bottom:24px;">
      <h1>${name}</h1>
      <p class="subtitle">${user?.phone || ''} · ${vendor.category || ''} · ${vendor.city || ''}</p>
    </div>
    <div class="card">
      <div class="card-title">Profile</div>
      <table><tbody>${profileRows}</tbody></table>
    </div>
    <div class="tabs">
      <a class="tab active" onclick="showTab('messages',this)">Messages</a>
      <a class="tab" onclick="showTab('leads',this)">Leads</a>
      <a class="tab" onclick="showTab('notes',this)">Notes</a>
    </div>
    <div id="messages" class="tab-content active">${bubbles}</div>
    <div id="leads" class="tab-content">${leadsList}</div>
    <div id="notes" class="tab-content">${notesList}</div>
  </div>
  <script>
    function showTab(id, el) {
      document.querySelectorAll('.tab-content').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(id).classList.add('active');
      el.classList.add('active');
    }
  </script>
</body>
</html>`;
}

module.exports = { renderDetail };
"""
with open('src/admin/views/detail.js', 'w') as f:
    f.write(content)
print("done")
```

## write_handover.py

```python
content = """# dream-os — Session Handover
**Last updated:** 2026-05-14
**Session:** 5
**Version:** 0.5.0

## What shipped this session

### Migration 0005 (db/migrations/0005_tdw_handles.sql)
- vendors.routing_handle — UNIQUE, uppercase, alphanumeric + hyphen. TDW code suffix e.g. RAHULCLICKS
- vendors.instagram_handle — raw IG handle as vendor provided (without @). NULL if skipped
- users.email — collected naturally in conversation, no dedicated onboarding step
- Index: vendors_routing_handle_idx for fast routing lookups on every inbound message

### Onboarding (src/agent/onboarding.js)
- New step: asked_instagram inserted between asked_rate and complete
- Full state chain: new -> asked_category -> asked_city -> asked_rate -> asked_instagram -> complete
- Instagram skip detection: message without @, or common skip words (no/nope/skip/later/nah) -> auto-generate handle
- Handle normalisation: strip @, uppercase, strip all non-alphanumeric (dots, underscores removed)
- Handle generation cascade: Instagram handle -> FIRSTNAME-CITY -> FIRSTNAME-CATEGORY -> FIRSTNAME-PHONE4 -> FIRSTNAME-TIMESTAMP
- Uniqueness: each candidate checked against DB before use
- Completion message (exact, locked):
  "Perfect — you're all set. Here's your TDW link: wa.me/[TDW_WA_NUMBER]?text=TDW-[HANDLE] — put this in your Instagram bio so couples can reach you directly. Or you just send me the messages you receive. From here just talk to me like you'd talk to a trusted assistant."
- TDW_WA_NUMBER env var: defaults to 14787788550, swap to 91XXXXXXXXX when +91 arrives

### Couple routing (src/index.js)
Three-mode routing replaces the old dead-end for non-vendor numbers:

Mode 1 — Returning couple
- Check: conversations table has row with counterparty_phone = this number and kind = couple_thread
- Action: log message to thread, notify vendor on their self-thread: "Message from your enquiry: [body]"
- No TDW code needed — covers all repeat messages

Mode 2 — TDW code
- Check: first word of message (stripped of TDW- prefix) matches vendors.routing_handle
- Action: create couple_thread conversation -> log message -> create lead (deduped on vendor_id + phone) -> notify vendor: "New enquiry via your TDW link. They said: [body]"
- Lead dedup: one lead per (vendor_id, counterparty_phone), ever

Mode 3 — Fallback
- No Mode 1 or Mode 2 match
- Reply: "Hi! To reach a TDW vendor, send their TDW code — you'll find it in their Instagram bio or the link they shared."

### Admin (src/admin/views/detail.js)
- Vendor detail now shows TDW Link (clickable wa.me link) and Instagram (linked @handle)
- TDW_WA_NUMBER read from env var — survives number swap without code change

## Railway env var to add
TDW_WA_NUMBER = 14787788550
(No whatsapp: prefix, no +, just the digits. Swap to 91XXXXXXXXX when +91 arrives.)

## Verified working
- [ ] curl https://dream-os-production.up.railway.app -> version 0.5.0
- [ ] New vendor onboarding: all 5 steps fire in order
- [ ] Vendor with Instagram handle -> handle set to normalised IG handle
- [ ] Vendor who skips Instagram -> handle auto-generated FIRSTNAME-CITY
- [ ] Completion message contains correct TDW link
- [ ] Unknown number sends TDW-[HANDLE] -> vendor notified, lead created
- [ ] Same couple messages again -> Mode 1 routing, vendor notified
- [ ] Random message with no TDW code -> Mode 3 fallback reply
- [ ] Admin vendor detail shows TDW link and Instagram

## Known gaps (fix in Session 6+)
1. Agent cannot send replies to couples — vendor copy-pastes manually
2. No lead deduplication on vendor-forwarded messages — only Mode 2 deduped
3. update_lead_state still requires UUID — name-based update deferred to Session 8
4. No status callback URL on Twilio — needed for Session 6 delivery receipts
5. Draft-reply-to-couple capability not yet assigned to a session — owned by this assistant, ship in Session 6

## WhatsApp numbers reference
| Number | Currently points to | Notes |
|---|---|---|
| +14155238886 | Twilio sandbox | Retired from dream-os |
| +14787788550 | dream-os Railway | Active now, TDW_WA_NUMBER set to this |
| +91XXXXXXXXX | Pending Twilio approval | Will become primary dream-os number |

When +91 arrives:
1. Point +91 -> dream-os (update TWILIO_WHATSAPP_NUMBER Railway env var)
2. Point +14787788550 -> dream-wedding
3. Update TDW_WA_NUMBER Railway env var to 91XXXXXXXXX (no + prefix)
4. No code changes needed — fully parameterised

## Test credentials
- WhatsApp: +14787788550 (no join code needed)
- Test vendor phone: +918757788550
- Test vendor UUID: 2eb5d3fb-31eb-4b26-859a-cf10ae477d53
- Test vendor user UUID: f1d6d3af-a828-4e42-98ab-862b05dbc110
- Test conversation UUID: c2740497-6f40-4469-8bc1-8d66c9bda7bd
- Supabase project: nvzkbagqxbysoeszxent (Mumbai)
- Railway URL: https://dream-os-production.up.railway.app
- Admin URL: https://dream-os-production.up.railway.app/admin

## First thing next session
curl https://dream-os-production.up.railway.app
Should return: {"status":"alive","service":"dream-os","version":"0.5.0"}

Reset test vendor onboarding_state to 'asked_rate' in Supabase to test the new asked_instagram step:
update vendors set onboarding_state = 'asked_rate' where id = '2eb5d3fb-31eb-4b26-859a-cf10ae477d53';

## Document update protocol
HANDOVER.md — fully rewritten every session
SCHEMA.md — fully rewritten every session
ROADMAP.md — updated every session
All three committed before session closes. No exceptions.
git add docs/ && git commit -m "docs: session N handover, schema, roadmap" && git push
"""
with open('docs/HANDOVER.md', 'w') as f:
    f.write(content)
print("done")
```

## write_schema.py

```python
content = """# dream-os — Schema Reference
**Last updated:** 2026-05-14
**Supabase project:** nvzkbagqxbysoeszxent (Mumbai, ap-south-1)
**Latest migration applied:** 0005_tdw_handles.sql

## Migration history
| File | Date | Session | What it added |
|---|---|---|---|
| 0001_initial_schema.sql | 2026-05-14 | 1 | users, vendors, couples, conversations, messages |
| 0002_agent_substrate.sql | 2026-05-14 | 2 | vendor_state, notes, pending_actions |
| 0003_vendor_onboarding.sql | 2026-05-14 | 3 | vendors.onboarding_state, invite_vendor() function |
| 0004_leads.sql | 2026-05-14 | 4 | leads table |
| 0005_tdw_handles.sql | 2026-05-14 | 5 | vendors.routing_handle, vendors.instagram_handle, users.email |

## Tables

### users
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| phone | text UNIQUE NOT NULL | always E.164 e.g. +918757788550 |
| name | text | first name, set on invite or from WhatsApp profile |
| email | text | collected naturally in conversation |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### vendors
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK -> users.id | CASCADE delete |
| business_name | text | studio/brand name (optional) |
| category | text | set during onboarding e.g. 'photography' |
| vertical | text | default 'wedding' |
| city | text | set during onboarding |
| routing_handle | text UNIQUE | TDW code suffix e.g. RAHULCLICKS. Uppercase, alphanumeric + hyphen only. |
| instagram_handle | text | raw IG handle without @ e.g. rahulclicks. NULL if skipped. |
| upi_id | text | future — payment collection |
| gstin | text | future — tax |
| status | text | 'active' or 'paused' or 'churned' |
| tier | text | 'trial' or 'essential' or 'signature' or 'prestige' |
| founding_cohort | boolean | true for first 50 vendors |
| onboarding_state | text | NULL or 'complete' = active. 'new' or 'asked_category' or 'asked_city' or 'asked_rate' or 'asked_instagram' = in progress |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### couples
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| user_id | uuid FK -> users.id | CASCADE delete |
| partner_name | text | |
| wedding_date | date | |
| wedding_city | text | |
| budget_total | integer | in Rs |
| events_planned | jsonb | e.g. ['mehndi','sangeet','wedding','reception'] |
| planning_state | text | 'browsing' or 'shortlisting' or 'booked' or 'planning' or 'wedding_done' |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

### conversations
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| counterparty_user_id | uuid FK -> users.id | nullable |
| counterparty_phone | text | denormalized for WhatsApp routing |
| kind | text | 'vendor_self' or 'couple_thread' or 'network' |
| state | text | 'new' or 'qualifying' or 'negotiating' or 'booked' or 'planning' or 'event_done' or 'closed' |
| mode | text | 'auto' or 'draft' or 'manual' |
| last_message_at | timestamptz | updated on every message |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

### messages
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| conversation_id | uuid FK -> conversations.id | CASCADE delete |
| direction | text | 'inbound' or 'outbound' |
| channel | text | 'whatsapp' or 'web' or 'native' or 'system' |
| body | text | message text |
| media_url | text | future |
| sent_by | text | 'vendor' or 'couple' or 'agent' or 'system' |
| tool_calls | jsonb | full audit trail of agent tool calls |
| tool_results | jsonb | reserved |
| twilio_sid | text | Twilio message SID |
| created_at | timestamptz | auto |

Realtime: enabled

### vendor_state
| Column | Type | Notes |
|---|---|---|
| vendor_id | uuid PK FK -> vendors.id | CASCADE delete |
| summary | text | free-form summary the agent maintains |
| pricing_policy | jsonb | {stated_rate: string} |
| recent_notes | jsonb | cache of last 10 notes |
| open_threads | integer | denormalized count |
| pending_actions | integer | denormalized count |
| updated_at | timestamptz | auto via trigger |

### notes
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| conversation_id | uuid FK -> conversations.id | SET NULL on delete |
| content | text NOT NULL | short factual note |
| tags | text[] | e.g. ['lead','pricing','onboarding'] |
| created_at | timestamptz | auto |

Realtime: enabled

### pending_actions
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| conversation_id | uuid FK -> conversations.id | CASCADE delete |
| action_type | text | 'reply_to_couple' or 'create_invoice' etc |
| payload | jsonb NOT NULL | full action payload |
| state | text | 'pending' or 'approved' or 'rejected' or 'expired' |
| summary | text | human-readable summary |
| expires_at | timestamptz | |
| resolved_at | timestamptz | |
| created_at | timestamptz | auto |

Realtime: enabled

### leads
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | auto-generated |
| vendor_id | uuid FK -> vendors.id | CASCADE delete |
| name | text | couple name e.g. "Preethi" or "Priya & Rohit" |
| phone | text | couple's phone if given |
| email | text | couple's email if given |
| wedding_date | date | extracted date |
| wedding_city | text | where the wedding is |
| event_types | text[] | e.g. ['wedding','reception','mehndi'] |
| budget_min | integer | in Rs e.g. 150000 |
| budget_max | integer | in Rs |
| source | text | default 'whatsapp'. 'instagram' or 'referral' or 'discover' or 'other' |
| referrer_name | text | person who referred the couple |
| state | text | 'new' or 'contacted' or 'quoted' or 'booked' or 'lost' |
| raw_message | text | original forwarded text verbatim |
| notes | text | anything else extracted |
| created_at | timestamptz | auto |
| updated_at | timestamptz | auto via trigger |

Realtime: enabled

## Key relationships
- Every vendor has one user (identity)
- Every message belongs to one conversation -> one vendor
- Every note belongs to one vendor, optionally one conversation
- Every lead belongs to one vendor
- vendor_id is always the scoping key — never query without it
- couple_thread conversations scoped by counterparty_phone for routing

## Indexes added in Session 5
- vendors_routing_handle_idx on vendors(routing_handle) — fast TDW code lookup on every inbound message

## Postgres functions
| Function | Args | Returns | Purpose |
|---|---|---|---|
| invite_vendor | p_phone text, p_name text | uuid | Creates user + vendor rows, sets onboarding_state = 'new' |
| set_updated_at | — | trigger | Auto-stamps updated_at |

## RLS
Disabled on all tables. service_role key held by Railway only.
Will enable when bride-side public access is needed.

## Realtime enabled on
conversations, messages, notes, pending_actions, leads
"""
with open('docs/SCHEMA.md', 'w') as f:
    f.write(content)
print("done")
```

## write_roadmap.py

```python
content = """# dream-os — Roadmap
**Last updated:** 2026-05-14
**Current version:** 0.5.0

## Vision
WhatsApp-first chief of staff for wedding vendors.
Vendor runs their business by texting a number.
Agent remembers everything, handles routine, escalates judgment calls.
Admin layer lets Dev/Swati manage the founding cohort of 50 vendors.
Marketplace (thedreamwedding.in) surfaces curated vendors to brides.

## What's shipped

| Session | What | Version |
|---|---|---|
| 1 | WhatsApp echo bot, schema (5 tables), Railway deploy, Twilio sandbox | 0.1.0 |
| 2 | Agentic loop (Claude Haiku), note_to_self, update_conversation_state, respond_to_vendor, vendor_state + notes + pending_actions | 0.2.0 |
| 3 | Admin layer, onboarding flow (Swati greeting), conversation history, system prompt tightening, invite_vendor() | 0.3.0 |
| 4 | leads table, create_lead tool, list_leads, update_lead_state, lead/referrer distinction, post-processing commentary strip, admin leads tab | 0.4.0 |
| 5 | TDW handles, asked_instagram onboarding step, three-mode couple routing, admin TDW link display, migration 0005 | 0.5.0 |

## Decisions locked
- Model: claude-haiku-4-5-20251001 (never change without founder approval)
- Phone format: always E.164 (+918757788550)
- Schema discipline: every change through numbered migration file
- Three docs updated every session: HANDOVER.md, SCHEMA.md, ROADMAP.md
- Currency: Rs (never Rs with rupee symbol)
- Unknown numbers: three-mode couple routing (Mode 1/2/3)
- Admin auth: single ADMIN_PASSWORD env var
- Monorepo: backend now, web/ and discover/ added in Sessions 9+
- Routing: one shared number + TDW codes (not one number per vendor)
- TDW code format: TDW-[HANDLE] e.g. TDW-RAHULCLICKS
- Handle source: vendor Instagram handle if they have one, else auto-generated (FIRSTNAME-CITY -> FIRSTNAME-CATEGORY -> FIRSTNAME-PHONE4)
- Lead dedup in Mode 2: one lead per (vendor_id, counterparty_phone), ever
- TDW_WA_NUMBER env var: parameterised, swap when +91 arrives, no code change needed
- Draft-reply-to-couple: not yet built, owned by this assistant, ship in Session 6

## Session 6 — Morning briefing + draft reply to couples
**Goal:** Vendor gets a WhatsApp briefing every morning. Agent can draft and send replies to couples.

What ships:
- Cron job: 8am IST daily per active vendor
- Format: "Morning [Name]. X open leads, Y pending replies, Z events this week."
- Overdue nudge: "You haven't replied to Preethi's enquiry in 3 days."
- Railway cron configuration
- Draft reply: vendor says "reply to Preethi: we'd love to work with you" -> agent sends via Twilio to couple's phone
- Twilio template submission for outbound initiated messages (approval 1-7 days)

Estimated time: 90 minutes

## Session 7 — Money tools
**Goal:** Vendor logs expenses, creates invoices, tracks payments through WhatsApp.

What ships:
- Migration: invoices table, expenses table
- New tools: create_invoice, log_expense, record_payment
- Agent answers: "Who owes me money?" "What did I spend this month?"
- Admin: Money tab on vendor detail

Estimated time: 90 minutes

## Session 8.1 — Smart model routing (Haiku -> Sonnet)
**Goal:** Route complex tasks to Sonnet, keep simple tasks on Haiku. 80/20 split.

What ships:
- Task classifier: lightweight Haiku call determines complexity
- Router in engine.js: sets MODEL based on classifier output
- Sonnet for: complex extraction, nuanced drafting, financial reasoning
- Haiku for: simple notes, greetings, status questions
- Cost tracking: model_used, input_tokens, output_tokens, cost_usd on messages table
- Admin: AI cost this month on vendor detail page

Estimated time: 45-60 minutes

## Session 8 — Admin polish + +91 number live
**Goal:** Admin production-ready for 50 founding vendors.

What ships:
- +91 number live — update TWILIO_WHATSAPP_NUMBER and TDW_WA_NUMBER env vars
- Vendor list: search + filter by status
- Bulk invite: CSV upload of name + phone
- Manual onboarding_state override in admin
- Lead name-based state updates (no UUID required from vendor)

Estimated time: 60 minutes

## Session 9 — thedreamwedding.in Discover
**Goal:** Bride-side curated marketplace. Couples browse vendors, send enquiries.

What ships:
- discover/ folder added to monorepo
- Migration: discover_curation table, discover_editorial table
- Next.js site on Vercel
- Vendor profile pages (public, read-only)
- Bride can browse, no auth required
- Enquiry from Discover -> vendor WhatsApp thread automatically

Estimated time: 2-3 sessions

## Session 10 — Instagram DM integration
**Goal:** Vendor connects Instagram Business account. DMs auto-route to their WhatsApp thread.

What ships:
- Migration: vendor_integrations table
- OAuth flow: vendor connects Instagram Business account from admin panel
- Meta webhook: /webhook/instagram receives new DMs
- Auto lead creation from Instagram DMs
- Vendor WhatsApp notification

Estimated time: 2 sessions

## Session 11-12 — thedreamai.in vendor dashboard
**Goal:** Web dashboard as read layer over WhatsApp-captured data.

What ships:
- web/ folder added to monorepo
- Leads, money, calendar as read-only views
- Built on existing dreamai design language (Frost palette, Cormorant + DM Sans)

## Open questions
1. +91 number — applied, arriving soon
2. Founding cohort pricing — free forever or free for X months?
3. Couple phone collection on Discover enquiry
4. thedreamwedding.in domain — currently pointing where?
5. Swati's role in Discover editorial curation

## Deliberately out of scope
- iOS/Android native app (WhatsApp is the app for now)
- Razorpay subscription billing (after 50 vendors proven)
- RLS (after bride-side public access needed)
- Multi-vertical (weddings first)
- Email/SMS fallback (WhatsApp only)
- One number per vendor (TDW code system solves routing cleanly)
"""
with open('docs/ROADMAP.md', 'w') as f:
    f.write(content)
print("done")
```
