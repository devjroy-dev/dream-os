-- db/migrations/0205_shop_class_link.sql
-- TDW · CE-47 · OFF-A1b · THE CLASS LINK (R1, reversed by the founder, 7 October 2026).
-- Number: the chair's reserved OFF range (0204-0207), second of the four.
-- WHAT (additive; one column; no row changed): shop_items.class_link, her own Meet or Zoom link for an online class or an
--   online workshop, https only. The server gives it to a buyer only once the seat is paid (src/lib/shop/shop.js markPaid);
--   the public shop door never selects it. No table is created (e-273's grant rule is for new tables; 0204's grants cover it).
-- (Postgres caps a regex repetition count at 255, so the length is a separate test: 'https://' plus 3 to 500 characters.)
-- Witnesses: public.shop_items (0204, applied live at server train 2).
-- REVERT (by hand, with a witness; never run as part of this file):
--   ALTER TABLE public.shop_items DROP COLUMN IF EXISTS class_link;

BEGIN;

ALTER TABLE public.shop_items
  ADD COLUMN class_link text CHECK (class_link IS NULL OR (char_length(class_link) BETWEEN 11 AND 508 AND class_link ~ '^https://[^\s<>"'']+$'));

COMMIT;
