# CE-45 · ELZ-1 · CUT 2c · THE SAME-NAMED PICKS · HANDOVER

Base cda36fa (the carry: built on 7505ff2, carried onto LCV-16's LSP_5 at 5cba98e, then back to cda36fa when LSP_5 was reverted; cda36fa's tree
is 7505ff2's). Ruled on 26 September 2026 (the read-first, F1 to F5; F-44.178).

## 1 · What shipped

His V9, V10, V12, V14 and V15, hash-carried (doorLines.js): B8 "Two clients are called {name}: 1. {name} ({date}) 2. {name} ({date}). Reply with
the number."; B10 "Which invoice for {client}? 1. {number} 2. {number}. ..."; B24 "Two packages are called {name}: 1. {name} (Rs {total}) 2. ...";
B53 "Which shoot for {client}? 1. {date} 2. {date}. ..."; B61 "Two on your team are called {name}: 1. {name} ({role}) 2. ...". ONE renderer
(numberedPick) reads the head and tail from his line; three or more read the count in place of "Two" (F4, no cap).
F-44.178 (the stable orders): leadsNamed (wedding date, no date last, then id); packagesOf (name, then id); planInvoice's binders (date, then id)
and live invoices (created_at, then id); membersOf (name, then id); shootsOf (date, then id). Shown and noted in the same order.
EVERY PICK A NOTE carrying its options' record ids in that order: B8 (lead or binder ids, every act of the message, F3), B10 (invoice ids), B24
(package ids), B61 and B53C (planAssign's member and shoot ids), and the move-and-cancel SHOOT note (event ids it already held). A bare number is
the Nth SHOWN; the record is re-read by id (live, this vendor's, unchanged since the ask) and a vanished or changed record re-asks from the
CURRENT records, once, then B3.
F1: the client pin rides L: the replay's lifecycle.resolveLead returns the pinned lead for the pinned name (pinLifecycle); planMoney,
planPayment, planBooking, applyRow and reread BYTE-IDENTICAL. The binder pin: a lead pick passes lead.binder_id to an invoice act naming that
client; a binder-raised pick pins the binder on the invoice acts; a mixed message whose ambiguity is binders alone re-asks for the rest.
The picked invoice is SERVED BY ID as B9 (servePicked), the generator never asked for a pick; no document is the glitch line.
F2's lift (planAssign, 2c ONLY): three sites (act.member_id honoured, act.event_id honoured, B53 and B61 handing out ids); the lift ENDS here.
The relayToCouple.js export comment corrected to b131.

## 2 · Proof

b132 24/24 (b106's harness verbatim): every pick binding the SECOND SHOWN record by id; deleted and renamed records re-asking; out of range once,
then B3; the money pins; planAssign's three sites; seven mutations red (the pin dropped; the deleted-lead check removed; each of the five orders
reversed). Re-pinned by label (the old bytes grepped first): b90 (hand-applied at cda36fa), b92, b93 (the three-same-name specimen re-aimed to
B24, cell 3.1b), b95, b98, b105, b106 (fixed member ids: the random UUIDs made F-44.178's order cell pass or fail by chance), b107, b112, b114,
b118a (4.4 flipped), b118b (3.7 flipped; 6.1 planAssign). The differential at cda36fa (39 benches, engine built both sides): only b132 differs.

## 3 · Walk record

Landed as 1b37c26. The founder's walk, 26 September (the app, DEV440, test twins): W1 "tell walk twin hi" -> B8 exactly as ruled ("Two clients
are called walk twin: 1. Walk twin (5 March 2027) 2. Walk twin (12 June 2027). Reply with the number."); "2" bound the SECOND lead correctly (the frame
named Walk twin, +918000000000, the 12 June lead) BUT the draft's body was "<UNKNOWN>": the B8 note did not carry her original words, so the
replayed relay was written from "2" (e-151). He answered NO; nothing was sent. Cured in the e-151 cut, with the placeholder refusal. W1 is re-walked
after that cut lands. W2 to W4 and 2b's W3 to W5 remain to be walked (they compose nothing and were unaffected).
