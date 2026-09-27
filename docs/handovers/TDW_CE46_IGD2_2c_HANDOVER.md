# repo: devjroy-dev/dream-os @ de38b5c · TDW CE-46 · IGD-2 · CUT 2c HANDOVER (the dark walk's three findings, cured)

Built on 6efcf91, carried by command onto the chair's named base de38b5c (G6-2's 2b): the only path both touched is src/index.js
(G6-2's mount lines; this cut's one line), and the content of the patch is identical at both bases (git's blob-hash header for
index.js is the only byte that differs). The own-number door stays mounted after /webhook/instagram: b136c 5.3 holds it.

## What the walk found, and what this cut does

The dark walk of 27 September 2026 (DEV440, the brand account thedreamwedding_in, the founder's ruling) reached M5 and stopped
three times. Each stop is a cure here.

1. E3 settled. The first delivered webhook logged "signature matched IG_APP_SECRET". igInbound.verifyIgSignature now reads
   IG_APP_SECRET alone; the META_APP_SECRET fallback is gone. A body signed with the other secret is refused (b119 3.1, b136c 1.1).

2. F-44.194 confirmed and cured, ruled (a). The webhook addresses the professional account (the 1784... id), and the connect had
   stored only the Instagram-scoped id (2846..., the token exchange's user_id), so the DM was "not recorded: unknown_account".
   Now: 0176 adds vendor_ig_connections.ig_account_id with a partial UNIQUE (one vendor per Instagram account); the messages
   callback stores the profile read's user_id there with igConnection.setAccountId, a separate best-effort write after saveToken
   that never fails a connect (before 0176, or on the UNIQUE's refusal, the error is logged and the connection stands with no
   account id, so no webhook reaches it); the DM webhook and the dead letter look the vendor up with the NEW findByIgAccountId.
   THE RULING'S WORD, AND WHY IT CHANGED: the chair ruled "findByIgUserId matches ig_account_id". Built that way, the differential's
   b07_p4a §11.9 reddened: findByIgUserId also serves Meta's signed deauthorize and data-deletion requests (ig.js :314, :366),
   which carry the scoped id. So findByIgUserId stays on ig_user_id and findByIgAccountId is the webhook's. The chair credited the
   catch (e-172). ig_user_id and every insights read are untouched.

3. F-44.212 cured. The founder tapped Turn on 13 s before Instagram's grant landed; flip subscribes only when the grant is already
   there, and the callback never did, so the room read "On" with no subscription and nothing was delivered. Now:
   igRoom.subscribeIfOn, called by the messages callback after the grant is proved, subscribes her account when dm_state is
   already 'on' and stamps dm_subscribed_at; deriveState reads 'on' only once dm_subscribed_at is set, otherwise 'waiting' (a
   state the pwa already draws, with Turn off); the door carries an additive `live` (true only when 'on').
   FE-4's line, drawn when live is false, with the founder for his yes:
   "Switched on, but not working yet: Instagram is not sending us your messages. Turn it off and on again."

4. Meta's refusal reason reaches the log. igOAuth.metaDetail reads error.message (300 chars, token-like runs masked),
   error_subcode and fbtrace_id; logMetaRefusal writes "[ig:meta] <where> refused (<status>, <code>): <detail>" at both refusal
   homes (metaRefusal, the photo list). The returned `error` string is byte-unchanged (it can reach the vendor, ig.js :228). The
   request, the code, the secret and the token never reach the line. Named for IGD-3, untouched: igSend.js :79 and igMeta.js keep
   status only.

## Proof at de38b5c

- b136c (new): 15/15; --mutate 10 of 10 (the fallback restored, the lookup moved back, the account write unguarded, subscribe
  without the on-check, the refusal stamped, 'on' without the subscription, live forced, the two callback calls removed).
- b136b (new): 10/10; --mutate 5 of 5. Uncured: RED (metaDetail absent).
- b136: 38/38, --mutate 12 of 12 (its double's row carries ig_account_id; its dead-letter dep renamed; re-pinned by label).
- b119 28/28 (3.1 and M4 re-pinned by label for E3; the account double renamed). b119b 34/34 (5.1 re-pinned by label for
  F-44.212). b07_p4a 110/110.
- b136cr (0176 on a throwaway Postgres 16): 16/16, including the partial UNIQUE's refusal and NULL rows coexisting.
- Differential: 45 benches (radius by command), engine built, de38b5c against the cure. Exits identical in all 45; the same 6
  pre-existing reds both sides; PASS 1223 = 1223. Outputs attributed: b10_p1/p2/p3 and b91 (0176 the new top), b119 and b119b
  (labels), b77 (the [ig:meta] lines on its own refusal fixture), b07_f0772 (the base worktree's missing-sibling skip).
- Floor: see the card's block F; the seat's own floor at de38b5c is recorded below.

## Not in this card

0176 is not applied by this card. The lane is dark by the lane; DEV440's room is Off. The walk resumes on the chair's word with
0176 applied and read back, a fresh connect (Turn on after the grant), dm_subscribed_at and ig_account_id read back, then M5 to
M7 and the window rule.

## Disclosed

- e-171: b136c's first fixtures lacked two columns readConn selects; cells 3.1 to 3.3 were red at the cure and two mutation reds
  vacuous. Fixed.
- e-172: the findByIgUserId move (above), caught by the differential before any cut; credited by the chair.
