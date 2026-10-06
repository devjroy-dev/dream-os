-- db/migrations/0194_demo_phones_with_code.sql
-- TDW · CE-47 · WEB-4 cut 13 · THE STORED PHONES (the chair's option 1, the founder's yes, 4 October 2026).
-- The country code added to the demo numbers stored without it, so the admin can offer WhatsApp and Call:
--   demo_vendors.whatsapp_phone and demo_claim_requests.phone, ONLY these two shapes (the founder's read-only counts:
--   demo_vendors 3 rows "91 then ten digits"; demo_claim_requests 1 row "ten digits starting 6 to 9"):
--     ten digits starting 6 to 9            -> '+91' || the ten
--     '91' then ten digits starting 6 to 9  -> '+'   || the twelve
-- Every other shape (has +, empty, anything else) is left untouched. Duplicates after this (the demo pair ending 4440)
-- are NAMED to the founder by the read-only check run before this file, never merged.
-- NOT prospects.phone: the prospects lane stores numbers in Meta's own form (no '+', metaCloud.normalizeTo) and finds a
-- prospect by it (src/lib/prospects.js findProspectByPhone); inbound numbers arrive that way and opt-outs go through it.
-- Changing it would split a prospect in two. Its writer is unchanged.
-- Re-running is a no-op: after the first run no row has either shape.
-- REVERT (by hand, with a witness): UPDATE ... SET col = substr(col, 2) / substr(col, 4) on the listed rows.

BEGIN;

UPDATE public.demo_vendors        SET whatsapp_phone = '+91' || whatsapp_phone WHERE whatsapp_phone ~ '^[6-9][0-9]{9}$';
UPDATE public.demo_vendors        SET whatsapp_phone = '+'   || whatsapp_phone WHERE whatsapp_phone ~ '^91[6-9][0-9]{9}$';
UPDATE public.demo_claim_requests SET phone          = '+91' || phone          WHERE phone          ~ '^[6-9][0-9]{9}$';
UPDATE public.demo_claim_requests SET phone          = '+'   || phone          WHERE phone          ~ '^91[6-9][0-9]{9}$';

COMMIT;
