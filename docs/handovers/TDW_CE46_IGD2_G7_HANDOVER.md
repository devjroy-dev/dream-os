# repo: devjroy-dev/dream-os @ 1b8789f · TDW CE-46 · IGD-2 · G7 HANDOVER (the App Review reviewer's sign-in)

## Why

Meta's reviewer must sign in to TDW to test the Instagram import, Instagram messages and, later, ads. Vendor sign-in sends a
WhatsApp code to a real phone, so a reviewer could not get in. The only bypass in the tree, DEV_OTP (auth.js :320), works for
EVERY phone and must never be handed to Meta. The chair ruled (29 September 2026): one reviewer vendor account, a fixed code
valid for that phone only, both set by the founder in Railway, logged on every use, refused if either is unset.

## What this cut does

- src/lib/vendor/reviewerLogin.js (new), the one home: reviewerFor(phone, env) returns null when REVIEWER_PHONE is unset or the
  phone is another; { refuse: true } when REVIEWER_OTP is unset or not six digits; { code } when both are set and the phone
  matches.
- src/api/vendor/auth.js:
  - send-otp and forgot-pin: the reviewer phone with the code unset is refused BEFORE anything is minted (503
    reviewer_unavailable, no session, no send), logged "[reviewer] refused ...". With both set, the session row holds the fixed
    code's bcrypt hash (as every other session holds its random code's) and NO WhatsApp is sent; logged "[reviewer] session
    opened for the reviewer account (... no message sent)". Every other phone is exactly as before.
  - verify-otp: its comparison is untouched, so the fixed code is checked by the same bcrypt line as every code. One log line
    for the reviewer phone: "[reviewer] verify-otp for the reviewer account purpose=...".
  - DEV_OTP's line is untouched; its universal path is named for a later removal.
- The couple sign-in is untouched.

## The reviewer account (the founder's card, after landing)

REVIEWER_PHONE = +919999999999 (the founder's choice, a repdigit no one realistically holds; no message is ever sent to it).
REVIEWER_OTP = six digits the founder picks himself (not a sequence), set only in Railway. The studio: "Dev Roy Photography
Studio", photography, tier signature (the chair's ruling). The account is minted by the real send-otp path, then a witnessed
SQL card names the studio and adds invented leads and clients with no phone numbers, so no message can reach anyone. Portfolio
photos are uploaded through the app by the founder. The reviewer vendor's id joins IG_DM_WALK_VENDOR_IDS so Meta can test
Instagram messages before approval.

## Proof at 1b8789f (built on 9d3d772; overlap with ELZ-3 cut 1 by name: 0; the patch identical both ways)

- b152: 14/14; --mutate 8 of 8 redden (the no-send return removed; the fixed code replaced by a random one; the refusal removed
  in send-otp and in forgot-pin; the six-digit check loosened; another phone matched; the verify log removed; the forgot-pin
  return removed). Uncured: RED (the home module absent).
- Radius by command: 9 benches naming the vendor auth door. Engine built; 9d3d772 against the cure: exits and outputs
  identical, PASS/ok 425 = 425, no red either side.
- Floor: see the card.

## Owed, named

DEV_OTP (auth.js :320) is a universal code for every vendor and couple phone when set; a later cut removes it or scopes it.
