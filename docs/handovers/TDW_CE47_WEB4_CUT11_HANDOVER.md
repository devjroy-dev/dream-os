# TDW · CE-47 · WEB-4 · CUT 11 HANDOVER · F-44.271: no account without a name (dream-os)

Cut at dream-os `a7620ce`, 3 October 2026; re-stamped r2 onto `dd05516` (cut 12; none of these paths), 4 October 2026. Rung **b205**. No migration. LANDS AFTER FE-9's app half is live (it handles
`name_required` and `needs_name`); re-stamped onto the tip at that time.

## The cause (diagnosis accepted)
dreamos-pwa's sign-in door signs up an unknown number with no name (5752b1e), the 18 Aug cure (89e03eb) gated only the join
door, and 0d761e2 (4 Sep) made the landing's main doors sign-in doors. The server stored whatever it was given.

## The rulings, as built
a · provision (vendor and couple) REFUSES a NEW account without a name: 400 { ok:false, reason:'name_required',
    field:'name', error:'Please add your name.' }. A new account = no users row, or a users row with no row in this role.
    A name already on the users row counts (src/lib/provisionRole.js, NameRequiredError, before any write).
b · a RETURNING nameless account (its role row exists) is never refused: provision answers ok with needs_name:true; when it
    sends the name, provisionRole fills it (only into absence, as before) and needs_name is false.
c · send-otp no longer mints a users row or a role row (both doors). verify-otp, finding no account, mints the session on
    the phone's auth identity (identityForPhone, src/lib/ensureAuthIdentity.js; mintSessionForAuth in each door) and answers
    { ok, user_id: null, <role>_id: null, pin_set: false, new_account: true, tokens }; provision then makes the ONE users
    row, bound to that identity, with its name. A reset on a number with no account: 404 account_not_found.
    The vendor row is now born at provision, and still born status 'pending' (vendors.status defaults to 'active').
    The wrong-role refusal at send-otp stands.
d · the admin vendor mint (src/api/admin/vendors.js) requires a name: the typed business name or the name the users row
    already holds; else 400 "name is required." (the Dreamer mint's own line). The 'Vendor' placeholder is gone.
e · enquiry-side rows (WhatsApp, own number, website) are not accounts: their writers are untouched.
Existing nameless accounts are asked through (b) at their next sign-in. No automatic back-fill.

## Benches amended by label (each the ruled change, nothing else)
b05_f0589 (sections 1, 2, 4: send-otp mints nothing; the abandon leaves nothing), b05_f059 (B1/B2: the new flow end to
end, still one identity, one users row), b152 (2.4, 5.1), b156 (`passed`), b45 (D': no vendors insert at the OTP door;
provision births it pending), bOB (1.4, 1.8 refused; 3.4's mutation string), b10_p3 (two virgin mints carry a name).

## Proven
b205 28/0, on the REAL doors end to end, both roles: join; sign-in on an unknown number (refused without a name, made
with one); sign-in on a known named account; a returning nameless account (needs_name, then filled); the PIN path; reset on
an unknown number; wrong role; the admin mint (refused, stored name, typed name); enquiry writers untouched; three mutations
run and restored. On the clean tip a7620ce: 8 passed (the still-signs-in controls), 20 failed. Differential over every
reader of the auth doors, provisionRole, ensureAuthIdentity and the admin mint, and the source walkers (41 benches), engine
built both sides: exits identical; output moved only in the labelled cells above.
