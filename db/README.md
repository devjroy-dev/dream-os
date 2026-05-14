# dream-os — Database

Schema source of truth. The Supabase database state equals the sum of all
migration files in migrations/, applied in order.

## Current state

- Project: dream-os (Supabase project ID: nvzkbagqxbysoeszxent)
- Region: ap-south-1 (Mumbai)
- Latest migration applied: 0001_initial_schema.sql (applied 2026-05-14, Session 1)

## Rules

1. Migrations are append-only and immutable.
2. Every schema change goes through a migration file.
3. The most recent migration represents truth.
4. Naming: NNNN_short_description.sql.
5. Every migration has a header (date, session, author, summary).
