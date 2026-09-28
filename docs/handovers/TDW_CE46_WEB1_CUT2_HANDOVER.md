# TDW · CE-46 · WEB-1 · CUT 2 HANDOVER · her own domain (dream-os)

Cut at dream-os 5f6624d (base; r4, carried from 0ac1a01 with no overlap by path), 28 September 2026 IST. Sibling dreamos-pwa dc8dbdd1 + cut 1.

## What shipped
1. `db/migrations/0178_vendor_domains.sql`: one table, the sole home of a domain's life (paying → registering → wiring → live; error retried for a day, then refund_due → refunded; expired), columns retries, refund_due_at, refunded_at, four UNIQUEs (domain, razorpay_link_id, razorpay_payment_id, registrar_order_id), CHECKs on status and on price ≥ cost, the registrant as jsonb (her name, her studio, India), RLS enabled on the table with no policy (SEC-1, the 0171 shape; added at the re-cut after the chair's refusal of the first cut), and the A-45.8 grant to service_role, all in the same transaction. Number allocated by the chair.
2. `src/lib/domains/pricing.js`: the ten percent in one place: the registrar's pre-tax paise × (1 + GST 18%) × 1.10, rounded UP to the whole rupee (Rs 625 → Rs 812). `RESELLERCLUB_GST_PCT` overrides the 18 if the registrar's invoice says otherwise.
3. `src/lib/domains/resellerclub.js`: the registrar behind one client (availability for .in, .com, .co.in; the reseller price list; customer signup and contact in HER details; register with Vercel's nameservers, privacy on, no registrar invoice; the order's expiry). Injectable fetch; nothing spends on its own.
4. `src/lib/domains/vercelDomains.js`: add the domain to the project (409 counts as added), read verified and configured.
5. `src/lib/domains/razorpayLinks.js`: one Payment Link per order, INR, the row id as reference, notes vendor_id and tdw_kind=domain.
6. `src/lib/domains/service.js`: the ONE writer on vendor_domains: search (no row), order (a row in paying with the link; no buy), onPaid (the webhook's word: customer, contact, register once, nameservers, Vercel add → wiring; a row already bought is refused; an underpayment is refused; a registrar failure marks error with the reason and keeps the payment on the row), sweepRetry (S8, below) and sweepWiring (verified and configured → live).
7. `src/api/vendor/solutions/domain.js` (mounted at `/api/v2/vendor/solutions/domain`): GET / (DomainStatus), GET /search?q=, POST /order {domain, registrant, years?}, POST /wire; every door behind env.gates().p2; closed answers as the stubs did. The two stubs in index.js are retired.
8. `src/index.js`: after the ledger write and after the 200, `payment_link.paid` with notes tdw_kind=domain calls onPaid with the row id. The estate's one money door stays the one.
9. `src/cron.js`: at :50 every hour (Asia/Kolkata), the retry sweep then the wiring sweep; a no-op without the P2 keys.
10. `contract.js`: DomainStatus gained `pricePaise` and `paymentUrl`; status gained `paying`; CONTRACT_DIGEST moved to 2ad7b3f8…; the pwa twin literal (lib/solutions/types.ts) moves in WEB-1 cut 3, the mirror working as G2 wrote it.
11. `scripts/b146_ce46_web1_domain_bench.js` (56 cells, 5.4b pins the RLS line and 6.4b its mutation; 3b pins S8's policy and 6.6 its adopt-before-rebuy): pricing; the client on a fake that refuses unknown fields and paths; the whole life on a Postgres-shaped double; the doors over HTTP behind the gate closed and open; the source pins; five mutations. `scripts/lib/b146r_0178_rehearse.sh` + plant: A-45.8's rehearsal as service_role on a throwaway Postgres, asserting relrowsecurity true and no policy.

## r4 (carried onto 5f6624d)
- The QR: `storefront.js` storefrontUrl now encodes her short address `https://<handle>.thedreamwedding.in` (the founder, 28 September), with the same shape rule as dreamos-pwa `lib/public/vendorHost.ts`; a reserved or odd handle keeps `/v/<handle>`. b59 §6.1 amended by label. `vendorCard.js` checked: it publishes no URL, nothing to move.
- The sweep moved from :40 to :50. At :40 an hourly job sat on the Search Console pull's minute at 03:40, which b59 §8.1 forbids; r3 was never run against b59, the executor's miss, caught at this carry. b146 5.7b pins :50 alone and :40 the pull's alone.

## Proven
- b146 58/58; b59 64/0; b43 (the doors bench, which reads the digest and GET /domain) 35 PASS · 0 FAIL after the change; npm run build:engine unchanged.
- NOT run in this seat: the 0178 rehearsal (no Postgres in the container). The chair runs `bash scripts/lib/b146r_0178_rehearse.sh` on a machine with `initdb`; its output is pasted before the founder runs the SQL.

## S8 · when a paid registration fails (the chair for the founder, 28 September)
TDW tries the registration again for one day. The retry sweep takes every PAID row in `error` with no order; before any second register call it asks the registrar whether the name is already ours and adopts that order if so (an answer lost in transit is never bought twice). Past one day from her payment the row becomes `refund_due` and the logs print one line: `[domains] REFUND DUE <domain> · row <id> · payment <razorpay payment id> · <paise> paise · founder refunds in Razorpay`.
THE FOUNDER'S TASK, until a refund door exists: in the Razorpay dashboard, Payments › that payment id › Refund › full amount. Then mark it: `UPDATE public.vendor_domains SET status='refunded', refunded_at=now() WHERE id='<row id>' AND status='refund_due';` To see what is due: `SELECT id, domain, razorpay_payment_id, price_paise, refund_due_at FROM public.vendor_domains WHERE status='refund_due';`
The vendor's line in the room (cut 3), as approved: "We could not register <domain> yet. Your payment is safe. We will try again, and if it is not done within a day, you get a full refund."

## Env, on Railway (the founder's numbered clicks; no value in any file)
1. RESELLERCLUB_USER_ID and RESELLERCLUB_API_KEY from his ResellerClub account (Settings › API). Optional: RESELLERCLUB_BASE=https://test.httpapi.com/api for a sandbox walk first (ResellerClub's demo account), then removed.
2. VERCEL_TOKEN (a token with the pwa project's scope), VERCEL_PROJECT_ID (the pwa project), VERCEL_TEAM_ID if the project is on a team.
3. STOREFRONT_ROOT_DOMAIN=thedreamwedding.in (already the fallback).
4. Razorpay: the existing RAZORPAY_KEY_ID / _SECRET / _WEBHOOK_SECRET; in the Razorpay dashboard the webhook must subscribe to `payment_link.paid` (Settings › Webhooks › the existing endpoint /webhook/razorpay › add the event).
With 1 to 3 set, env.gates().p2 opens and the room's "Your own name" search goes live (cut 3 draws the register).

## The SQL block (the one §7 exception), in the Supabase editor, one paste
The whole of db/migrations/0178_vendor_domains.sql, as delivered; then two witnesses: `SELECT count(*) FROM information_schema.role_table_grants WHERE table_name='vendor_domains' AND grantee='service_role' AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');` → 4, and `SELECT relrowsecurity FROM pg_class WHERE relname='vendor_domains';` → true.

## The founder's walk (after cut 3 lands the room's register; cost first)
Cost: the registrar's price for the name he picks, printed by the search before any link exists (Rs 812 for a Rs 625 .in at today's list); he pays it himself through the Razorpay link as the vendor would; TDW spends nothing. Search a throwaway name on DEV440 → "yourname.in · Rs 812 a year · Get" → the registrant sheet → the link opens → pay → the row reads registering, then wiring, then live within the hour's sweep → https://yourname.in shows DEV440's storefront on its own name. The Vercel add and the nameservers need no click of his.

## Drift and open
- Registrant address: vendors holds no state or PIN code; the room's sheet (cut 3) asks for address line, city, state and PIN once and the row keeps them. Not a schema change.
- Renewal and auto-renew doors: not this cut (the columns exist; the toggle waits on the room's line).
- Email forwarding (spec §5 :103): not this cut.
- F-44.238, F-44.241, the site cuts: as listed in read-first 3.
