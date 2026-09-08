# FILING B2·3 — `instagram_business_manage_messages` (the DM bridge, I2)

**Base:** dream-os `68d92c0f51f3c59e7104881f582d37fa49c3480e`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 4 · master §5 row **I2**
**STATUS OF THIS FILE: NOT FILEABLE. ON THE TREE, MARKED HELD.**

**Held for a build reason, not a process one.** The push freeze that first held this file has
lifted (C1 landed at `68d92c0`). Nothing about that changes §0: the DM bridge does not exist,
and a permission for a feature that does not exist cannot be filmed. **This file is on the tree
so the blocker is legible to the seat that builds I2, not because it is ready to file.** It
becomes fileable when I2 is built dark and walked, and not one day before.

This packet is written as far as it can honestly go and stops where it must. Two of its
three parts are complete. The third — the shot list — **cannot be written**, and the
reason is not a gap in this seat's work. It is stated at §0 and it governs every
remaining Instagram packet in B2.

---

## 0 · WHY THIS CANNOT BE FILED YET — the sequencing collision, derived

Meta's App Review requirement, read at Meta's own page 2026-09-08
(`developers.facebook.com/docs/app-review/submission-guide/screen-recordings`):

> For each permission and feature in your submission, show an app user accessing data that
> requires the permission or feature **and show what your app does with that data.**

and:

> If our reviewers are unable to verify that your app needs a specific permission or feature
> based on what you've shown in your recordings, you will not be approved for that permission.

**There is nothing to show.** Derived by command at `38a70b0`, not assumed:

```
grep -rln "manage_messages|instagram.*message|ig_message|IG_DM" src/   → 1 hit
grep -rln "manage_insights|content_publish|manage_comments"      src/   → 0 hits
```

The single hit is `src/agent/systemPrompt.js:293`, a `source:"instagram"` string inside a
`create_lead` example. It is a lead's provenance field. **It is not a DM bridge.** The only
Instagram plane built in this estate is portfolio import — `igImport.js` reading
`graph.instagram.com/me/media` — which is I1's plane and B2·2's subject.

**So the DM bridge does not exist, and a permission for a feature that does not exist cannot
be filmed.** A shot list written against screens nobody has built is the hollow-green class
this estate forbids: an artifact that looks complete over something it cannot see.

**The estate's own law already says so.** Master §5's filing law for the Instagram table:
*"Build-dark law (§2.2) applies to every row: the feature is built whole and walked on a
test/developer-role account, ships behind one flag per permission, and flips on grant."*
Build, walk, film, file — in that order. Roadmap §3's item ordering (item 4, *file first
after the WhatsApp pair returns*) reads as though filing leads. It does not and cannot.
**The two are not in conflict about intent; they are in conflict about what "next" means,
and the build-dark law wins because Meta enforces it.**

**Reported to the chair as a sequencing finding, unnamed by this seat.** The chair names it.

### 0a · A second blocker, in the code, not mine to cure

`src/lib/vendor/igOAuth.js:132` at origin holds:

```
const IG_SCOPE = 'instagram_business_basic';
```

**One scope, deliberately** — the file's own comment at `:127-128` records the reason, and it
is correct: requesting a permission the screencast does not visibly exercise is a documented
rejection axis. But it means the authorize URL cannot request `manage_messages`, so the
consent screen in any future recording cannot show it being granted, so **shot 6 — the shot
this class of submission turns on — is unfilmable until that constant carries both scopes.**

That is a dream-os product byte. **§7 forbids this seat from writing it.** It is named here
as a finding for whoever builds I2, with the shape stated and nothing more: the constant
becomes a per-flow scope list, and the extra scope is requested only on the flow that
exercises it, so I1's existing import consent screen does not silently widen.

---

## 1 · THE USE-CASE TEXT — written, and correct only once I2 exists

Held, not final. The text below describes the DM bridge **as R6/R9 and master §5 I2 specify
it**, and must be re-read against the built feature before it is pasted anywhere. A use-case
text written from a spec and filed against a different build is the F-40.234 class — a seal
authored from memory.

```
The Dream Wedding is business software for Indian wedding vendors. A large share of the
enquiries these vendors receive arrive as Instagram direct messages, and are lost —
the vendor is on a shoot, replies two days later, and the couple has booked elsewhere.

This permission exists so that the vendor's own assistant inside our product can read
and answer those messages on her behalf, with her account's consent, and move a real
enquiry into her enquiry list where it is tracked.

What the vendor does: inside her own account she connects her Instagram professional
account and turns on message handling. When a person sends her a direct message on
Instagram, our app reads that conversation, drafts a reply in her own voice, checks her
calendar for the date the person is asking about, and sends the reply from her account.
The exchange appears in her enquiries with the person's name and the date discussed.

What we read with this permission: the message threads and messages on the account that
authorized us, and the sender's Instagram-scoped id and username as Instagram provides
them on those messages. We read only the account that authorized us.

What we do not do: we do not read messages on any account that has not authorized us,
we do not read follower lists or any contact list, we do not message anyone who has not
messaged the vendor first, and we do not send outside Instagram's messaging window.

The vendor can turn message handling off, and can disconnect the account entirely, from
the same screen. We implement Instagram's deauthorize and data deletion callbacks.
```

**Two things this text must not become.** It must not claim TDW answers *for* the vendor
without her sight of the words — F-39.70/.71 and the Victor sitting's own rulings say a send
to a lead happens only after the vendor has seen the exact words and said yes to those
words, and if the built feature honours that, the text must say so plainly. And it must not
mention insights, publishing or comments; those are separate submissions.

---

## 2 · THE TEST-USER SETUP — unchanged from B2·2, with one addition

§2a–§2d of `docs/filings/META_instagram_business_basic.md` apply verbatim: the app-role
account per R-41.7, the professional account, the accepted invitation, Development mode.

**The addition this permission needs:** a **second** Instagram account to send the test
message from. The recording must show a real inbound DM arriving. That account does not
need a role on the app and does not need to be professional — it is playing the couple.
The founder's own personal Instagram is sufficient and is the least trouble.

---

## 3 · THE SHOT LIST — **NOT WRITTEN**

Withheld with reasons, not omitted by oversight.

A shot list is a description of screens in the order a finger touches them. The screens do
not exist. Writing them now would produce a document that reads as ready, gets executed on
the day, and fails at the first tap — after the founder has set up two Instagram accounts
and cleared an hour to record.

**It is written when I2 is built dark and walked**, in the same sitting that walks it, from
the built screens. Its shape will follow B2·2's: logged-out start, the vendor's own sign-in,
the connect flow with the consent screen held longest and **both scopes visible on it**, the
inbound DM arriving, the draft shown to the vendor, her approval, the reply landing on the
sending account's phone, and the enquiry appearing in her list. Nine or ten shots, captions
burned in, no audio, 1080p.

---

## 4 · WHAT THIS MEANS FOR THE REST OF B2

The same test kills the same way for three more:

| Packet | Permission | Feature | Built? | Fileable? |
|---|---|---|---|---|
| B2·2 | `instagram_business_basic` | I1 portfolio import | **YES** — `igImport.js`, doors derived | **YES** — blocked only on the founder's account nomination |
| B2·3 | `instagram_business_manage_messages` | I2 DM bridge | NO | no |
| B2·4 | `instagram_business_manage_insights` | I3 Sunday brief, reach cards | NO | no |
| B2·5 | `instagram_business_content_publish` | I4 publishing | NO — and F-40.16 (no ffmpeg on the image) sits under the reel case | no |
| B2·6 | `instagram_business_manage_comments` | I5 comments | NO | no |
| B2·7 | second Meta app + `ads_read` / `business_management` | G4.5 ads reading | app not created | no — but see below |

**B2·2 is the only Instagram packet that can be filed today, and it is the one that unblocks
the rest** (roadmap §3 item 3: *unblocks every IG plane*). That is not a coincidence — it is
the only one whose feature was built before its permission was wanted.

**B2·7 is different in kind and may be able to move.** The second Meta app must be *created*
before anything else can happen on it, and creating an app is not a filing. If the chair
wants the ads app standing so its review clock can start the day G4.5's reading arm exists,
that is a founder console task with no build dependency and could be written now.

**B3 (Google) is not blocked this way at all.** `api.thedreamwedding.in`, Search Console
verification and the restricted-scope review are infrastructure and consent-screen work, not
feature demonstrations. B3 can proceed while the Instagram planes wait on their builds. On
the current sequence it is the most valuable thing left in this seat's charter.

---

## 5 · RECORD LINE — not yet applicable

This packet has no submission and will have none until I2 is built. When it does:

```
B2·3 · instagram_business_manage_messages
BLOCKED ON BUILD until <I2 walked>. Scope constant widened at <commit>. Then:
submission id: <ID>   filed: <DATE>   state: <In review>
```
