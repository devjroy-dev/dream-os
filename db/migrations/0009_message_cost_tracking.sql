-- ════════════════════════════════════════════════════════════════════
-- Migration 0009 — Message cost tracking + vendor style_notes
-- Date:    2026-05-15
-- Session: 8.1
-- Author:  Dev
-- ════════════════════════════════════════════════════════════════════
-- Foundation for smart model routing (Haiku <-> Sonnet).
-- Records which model handled each message, token counts, and cost
-- in both USD (Anthropic's billing currency) and INR (admin display).
--
-- Also adds vendors.style_notes for capturing qualifiers like
-- "luxury", "celebrity", "budget" during smart onboarding.
-- ════════════════════════════════════════════════════════════════════

-- ───────────────────────────────────────────────────────────────────
-- messages: cost tracking columns
-- ───────────────────────────────────────────────────────────────────
alter table messages
  add column if not exists model         text,
  add column if not exists input_tokens  integer check (input_tokens is null or input_tokens >= 0),
  add column if not exists output_tokens integer check (output_tokens is null or output_tokens >= 0),
  add column if not exists cost_usd      numeric(10,6) check (cost_usd is null or cost_usd >= 0),
  add column if not exists cost_inr      numeric(10,2) check (cost_inr is null or cost_inr >= 0);

-- Index on model for "AI cost this month by model" admin queries
create index if not exists messages_model_idx on messages(model);

-- ───────────────────────────────────────────────────────────────────
-- vendors: style_notes for onboarding qualifiers
-- ───────────────────────────────────────────────────────────────────
-- Captures qualifiers like "luxury", "celebrity", "budget", "boutique",
-- "destination" — populated by Haiku during smart onboarding.
-- vendors.category stays clean and filterable for Discover.
alter table vendors
  add column if not exists style_notes text;

-- ───────────────────────────────────────────────────────────────────
-- Notes
-- ───────────────────────────────────────────────────────────────────
-- All new columns are nullable. Pre-existing messages and vendors
-- rows remain valid (NULL is permitted by the CHECK clauses).
--
-- cost_usd uses numeric(10,6) — six decimal places handles fractions
-- of a cent (e.g., a single Haiku turn ≈ $0.000275).
-- cost_inr uses numeric(10,2) — paisa precision is enough for display.
--
-- USD→INR conversion happens at write time using a constant defined
-- in src/agent/models.js (USD_TO_INR = 100, Dev's call 2026-05-15).
