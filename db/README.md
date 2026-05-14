# dream-os — Database

Schema source of truth. The Supabase database state equals the sum of all
migration files in `migrations/`, applied in order.

## Current state

- **Project:** dream-os (Supabase project ID: nvzkbagqxbysoeszxent)
- **Region:** ap-south-1 (Mumbai)
- **Latest migration applied:** 0002_agent_substrate.sql (applied 2026-05-14, Session 2)

## Tables (as of latest migration)

| Table | Purpose |
|---|---|
| users | Universal identity. Every human on the platform. |
| vendors | Vendor-specific profile. Links to users.id. |
| couples | Couple-specific profile, lazy-created when a couple WhatsApps a vendor. |
| conversations | One thread between a vendor and a counterparty. Channel-agnostic. |
| messages | Every inbound/outbound message. Stores tool_calls + tool_results. |
| vendor_state | Agent's per-vendor working memory. summary + recent_notes cache. |
| notes | Durable, append-only log of facts the agent has captured per vendor. |
| pending_actions | Drafts awaiting vendor approval (draft mode). |

## Rules

1. Migrations are append-only and immutable.
2. Every schema change goes through a migration file.
3. The most recent migration represents truth.
4. Naming: NNNN_short_description.sql.
5. Every migration has a header (date, session, author, summary).
