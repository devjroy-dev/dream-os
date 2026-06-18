-- 0069_blocked_kind.sql — add 'blocked' to the event kind, so a vendor can mark
-- themselves unavailable. A block is reason-agnostic: personal, professional, out
-- of town — all the system needs is that the day is not available. Any reason the
-- vendor wants to record goes in title (free text), never required, never reasoned about.
--
-- Mirrors how 0013 already extended this CHECK. Additive, safe, idempotent.

alter table events drop constraint if exists events_kind_check;
alter table events add constraint events_kind_check
  check (kind in ('shoot','call','meeting','task','reminder','recce','fitting','trial','family','ceremony','social','blocked','other'));
