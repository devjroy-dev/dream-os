# FILING B3·2 — PUBLISHING THE OAUTH APP ON THE SPLIT SCOPES (R-41.47)

**Base:** dream-os `68d92c0f51f3c59e7104881f582d37fa49c3480e`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 8, last two links
**On the tree at this base. C1 has landed; the freeze is lifted.**
**Scopes in this packet:** `webmasters.readonly` + `siteverification` **only.**
`business.manage` is out of scope by R-41.47 and returns in B3·3 at G2 s2 (≈2026-10-27).
**Prerequisite:** B3·1 complete — domain, redirect URI, Search Console verification, and the
scope removal. **This packet cannot start before that one finishes.**

**Every Google rule below was read at Google's own page on 2026-09-08:**
`developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification`
— Google's own footer: **Last updated 2026-08-19 UTC**.

---

## 0 · THE BRANCH THAT DECIDES THIS ENTIRE PACKET

**THE READING IS IN. BRANCH A IS LIVE.** The Cloud Console's Data access table places **all
five declared scopes as non-sensitive** (founder's screen, 2026-09-08). F-41.8 is closed.

**Therefore: no data-access review, no justification text, no demo video, no YouTube upload.**
This packet is **§1, §2 and §3 only.** Sections 4 and 5 do not run and are retained below as
the record of what Branch B would have cost — three to five weeks and a video that could not
have been filmed until G3.1 s2 built its door.

**§6's homepage finding still binds** — its *link* half is discharged by A4 (§2 item 5), its
*describes-the-functionality* half is not, and card 4a is where it is read. Requirements 5 and 6
of §2 are **no longer blocking**: A4 landed at `dreamos-pwa@cc109bd7` (F-42.14). What is left
between the estate and a durable refresh token is the card in §7 and nothing else.

The branch table below is kept as written, unedited, so the reasoning that produced the right
answer stays legible.

> **BRANCH A — both remaining scopes are NON-SENSITIVE.**
> Then **there is no data-access review at all.** Google's own exceptions and structure are
> explicit: scope verification is required *"if your app requests sensitive or restricted
> scopes."* An app requesting neither needs **brand verification only** — an automated check
> that Google's page says *"usually completes in a few minutes"*, with a manual fallback of
> 2–3 business days if branding changed.
> **No demo video. No YouTube upload. No justification text. No waiting weeks.**
> The seven-day refresh death ends in **days**, and §3 is the whole packet.
>
> **This is not a remote branch.** `TDW_INFRA_GOOGLE_OAUTH.md` §12 records all three scopes
> landing in the console's **non-sensitive** table with *sensitive* and *restricted* both
> empty. Its author refused to explain that away and wrote *"Reason unknown — not resolved,
> not explained away."* Once `business.manage` — the only one of the three anybody expected to
> be sensitive — is removed under R-41.47, the anomaly and the ruling point the same way.

> **BRANCH B — one or both are SENSITIVE.**
> Then a data-access review is owed: scope justification text (§4), a demo video (§5), the
> privacy policy meeting Google's four requirements (B3·1 §5a), and the homepage requirements
> (§6). Weeks, not days.

> **BRANCH C — restricted.** Not credible for a read-only Search Console scope, and named only
> so the branch table is complete. If the console says restricted, **stop and report**; that is
> a finding, not a step, and it would put CASA back on the table for a scope the estate barely
> uses.

**Do not skip §3 on any branch.** Brand verification is required of every app regardless of
scope class, and Google's page states it plainly: *"you must have a published branding status
before you can request verification for data access."* Branding is the gate under all three.

---

## 1 · WHAT PUBLISHING BUYS, AND WHAT IT COSTS

`TDW_INFRA_GOOGLE_OAUTH.md` §11 already framed this and it is worth restating with Google's own
words beside it.

| | **Testing** (today) | **Production** |
|---|---|---|
| Refresh token | **expires in 7 days** | durable |
| Who may grant | the test-user list only | anyone with a Google account |
| What the user sees | Google's tester warning screen | the ordinary consent screen once verified |
| Grant cap | test-user list | **100 lifetime if unverified — non-resettable** |

Google's own page, on Testing: *"your app is still subject to a tester warning screen, a user
cap is in effect, and the refresh token lifetime is limited."*

**The seven-day death is the whole reason this packet exists.** G3.1 s2 stores a refresh token
encrypted under `INTEGRATION_TOKEN_KEY` and expects it to persist (`index.js:440-441`). In
Testing it dies in a week, silently, and the vendor's Search Console connection simply stops
working with no error worth reading. That is not a G2 s2 problem as the original kickoff
assumed — it is a **G3.1 s2** problem, and it is live the moment a real vendor grants.

**The cost, and it is the one thing in this packet that is irreversible.** The 100-grant
lifetime cap on an unverified production app is **non-resettable**. Every grant spends one
forever, including test grants, including mistakes, including a founder tapping Allow twice
while filming. `TDW_INFRA_GOOGLE_OAUTH.md` §1 records the current state as **0 external grants
spent** — the estate has its full 100 and has not touched them.

**So: publish, then be careful.** If Branch A holds and verification is not required, the cap
may not apply at all — but that is exactly the kind of thing to confirm on the console after
publishing rather than to assume before it. **Do not run casual test grants against production
until the cap's applicability is read off the console.**

---

## 2 · WHAT MUST BE TRUE BEFORE PUBLISHING — the checklist, from Google's own list

Every line is a requirement quoted or paraphrased from the page read 2026-09-08. Tick all
before touching the button.

| # | Requirement | State |
|---|---|---|
| 1 | Authorised domains verified in **Search Console**, using a Google account that is an **Owner or Editor** on the Cloud project | **B3·1 §4** — `thedreamwedding.in` as `dev@thedreamwedding.in` |
| 2 | No unowned domain on Authorised domains | **B3·1** — `api.thedreamwedding.in` replaces the `up.railway.app` dependency; TDW cannot prove ownership of Railway's domain and never could |
| 3 | Branding accurate: app name, logo, support email, home page URI, privacy policy URI all represent the app's real identity | founder, §3 |
| 4 | Homepage **publicly accessible**, not behind login; relevance to the app clear; describes the app's functionality; links to the privacy policy | **§6 — a finding, see below** |
| 5 | Privacy policy on the **same domain** as the homepage, **linked from** the homepage, **linked from the consent screen**, and the two links **identical** | **A4 LANDED** (F-42.14) — `dreamos-pwa@cc109bd7` · homepage link `app/(landing)/page.tsx:864`, the string `https://thedreamwedding.in/privacy`, absolute, no trailing slash; `/terms` beside it at `:866`. **Re-derived at `a96e2e2` (CE-42 G2, 2026-09-10): the same two strings now sit at `:797` and `:799`** — lines moved, bytes unchanged; `:864/:866` were true at `cc109bd7`. The consent-screen side is §3 tap 2 and must be **the same string**. On the tree only — the surface is witnessed at §7 card 4a |
| 6 | Privacy policy discloses how the app accesses, uses, stores and shares Google user data | **A4 LANDED** (F-42.14) — `dreamos-pwa@cc109bd7` · `app/privacy/page.tsx:299–316`, §5 *Your Google account*, `:301` heading and `:303–315` paragraph. Read access only; the pre-A4 text that described a write the estate never held is gone |
| 7 | OAuth clients not ready for production deleted from the project | founder: check **Clients**; there should be exactly one, `TDW Backend (dream-os production)` |
| 8 | Owner/editor roles and the support + developer contact emails current | founder — Google emails these addresses and a missed mail pauses the review |

**Items 5 and 6 are the only true blockers and both are A4.** F-19.13 has been open since the
infra seat and is now the single thing standing between the estate and a durable refresh token.
**It is a one-file pwa rider whose words are already drafted and waiting on the founder's veto.**

---

## 3 · BRAND VERIFICATION AND PUBLISH — the taps, in order, for a phone

**⚠ THE CONSOLE'S ORDER IS NOT THE ORDER BELOW (CE-42 ruling, 2026-09-10).** While the app is in
**Testing**, Google offers **no** *Verify branding* control: Branding and the Verification centre
both read *"Verification is not required since your app is configured with a testing publishing
status"* (witnessed 12:22 IST). Taps 3–5 cannot run before tap 6. **The order walked, and the order
to use:** 1 → 2 → **6 (Publishing status → Production)** → read the Verification centre → **3–5
(Verify branding, read, Publish branding)** → 7 → 8. Tap 4's rule survives the swap intact: **no
grant is minted over a failure** — tap 8 waits on *verified*. If the Verification centre demands a
data-access review or binds a user cap, stop; the chair rules before tap 3. Recorded at §7 and §8.

Runs on every branch. Every console URL must be opened as **`dev@thedreamwedding.in`** — but
**the `authuser` index is profile-specific and is not a constant.** This packet was written
saying `authuser=2`; the Chrome profile that ran B3·1 §3 on 2026-09-10 needed `authuser=1`
(B3·1 §3 tap 1). Read the account chip on the page rather than trusting an index. An action
taken as the wrong account lands in an org-less project and fails only at the first real grant
(`TDW_INFRA_GOOGLE_OAUTH.md` §6). Check the **project number `214847546988`** too, not the name:
a second project called `thedreamwedding` (`823156231613`) exists and the founder landed in it
first.

1. `console.developers.google.com/auth/branding?project=tdw-business-solutions`, with whatever
   `&authuser=` index selects `dev@thedreamwedding.in` in the browser profile in hand.
2. Confirm every branding field: **app name** `The Dream Wedding`, logo, developer contact,
   **Application home page** `https://thedreamwedding.in`, **Privacy policy**
   `https://thedreamwedding.in/privacy`, **Terms** `https://thedreamwedding.in/terms`.
   The privacy URL here and the one linked in the site footer must be **the same string** —
   Google checks that they match, not merely that both exist.
3. **Verify Branding.** The automated review usually returns in minutes.
4. Read the status.
   - **Ready to publish** → go to 5.
   - **Failed** → Google lists the issues. Fix or request manual review. **Do not publish over
     a failure.**
5. **Publish branding.**
   **⚠ Google's own note: a compliant verification result is valid for SEVEN DAYS.** Publish
   inside that window or the status reverts to *Need to re-verify* and the check runs again.
   Verify and publish in the **same sitting**; do not verify on a Friday and publish on a
   Monday week.
6. **Publishing status → Production.** In `console.developers.google.com/auth/audience`, move
   the app from **Testing** to **In production**.
7. **Then read the console and record what it says**, before any grant:
   - Does it show a data-access review as required, or none?
   - Is a user cap shown, and what number?
   This reading is §8's record line and it is what tells the chair which branch is live.
8. **Walk it once, deliberately.** Open the consent screen as
   `dev@thedreamwedding.in`. Two things to look at, and they are the point of B3·1:
   - Does it read **The Dream Wedding**, or a host? `TDW_INFRA_GOOGLE_OAUTH.md` §5 item 10
     says this **must be proven on a real consent screen before it is believed.** If it still
     shows a host, the diagnosis was wrong and that is a finding, not a retry.
   - Is the tester warning screen gone?

**Only on Branch B does anything below §3 apply.**

---

## 4 · BRANCH B ONLY — the scope justification text

**DOES NOT RUN.** Branch A is live. Retained as the record; nothing here is pasted anywhere.

Google asks you to *"describe how you will use the scopes in your app and why more limited
scopes aren't sufficient."* One justification per scope. Paste as written; the founder holds
the veto on every word.

### `https://www.googleapis.com/auth/webmasters.readonly`

```
The Dream Wedding is business software for Indian wedding vendors — photographers,
makeup artists, decorators. Each vendor has a public page on our platform showing her
work, and many also own a website.

Inside her own account, a vendor connects her Google account to see how couples are
finding her online. We call the Search Console API to read the search performance data
for the sites she owns: the queries people searched, impressions, clicks and average
position. We show her that data in her own account, alongside plain-language guidance
on what to improve.

We request the read-only scope because we never write to Search Console. We do not
submit sitemaps on her behalf, we do not add or remove properties, and we do not change
any setting on her account. The full webmasters scope would grant write access we have
no feature for, so the read-only scope is the narrowest that supports the feature.

We read only the properties belonging to the account that authorized us, and only while
she is using the feature.
```

### `https://www.googleapis.com/auth/siteverification`

```
Before we can show a vendor her search performance, Google requires that she owns the
site. We use the Site Verification API to confirm ownership of the domain she is
connecting, so that we request search data only for sites she genuinely controls.

This is a one-time check at connection. We do not use it to claim ownership of any site
on our own behalf, and we do not verify any domain the vendor has not asked us to
connect. There is no narrower scope that performs this check.
```

**Both justifications are bound by R-41.49** and must stay true: no Google-sourced data enters
any model prompt — not Victor's, not Donna's, not any other. Neither text above claims an AI
feature, and neither may be edited to claim one while R-41.49 stands.

---

## 5 · BRANCH B ONLY — the demo video

**DOES NOT RUN.** Branch A is live. Retained as the record.

Google's requirements, from the numbered submission list on the page read 2026-09-08. **Five
requirements, and two of them are unusual enough to be the common failures.**

1. Show the **OAuth grant process as a user experiences it, in English** — consent flow, and
   the sign-in flow if Google Sign-In is used.
2. Show that the consent screen **correctly displays the App Name**.
3. **Show that the browser address bar of the consent screen includes your app's OAuth client
   ID.** ← *the one people miss.* The address bar must be **visible and legible** in frame. Do
   not crop it; do not record in a window that hides it.
4. Demonstrate the functionality enabled by **each** scope requested.
5. Upload to **YouTube Studio**, visibility **Unlisted**, and paste the link into the YouTube
   field.

**This one is recorded on a desktop browser, not a phone** — requirement 3 needs an address
bar, and the estate's Google flow is a server-side web grant, not a mobile screen. That is the
opposite of B2·2's Instagram video and the difference is deliberate.

**Shot list — Branch B only, and only once G3.1 s2's door exists.**

| # | On screen | Caption | Hold |
|---|---|---|---|
| 1 | Vendor signed in to The Dream Wedding, on the *Your website & SEO* room, not yet connected | `A vendor's own account. She has not connected Google.` | 8s |
| 2 | She taps **Connect Google**; the browser navigates | `She asks us to connect her Google account.` | 6s |
| 3 | The Google consent screen, **whole window, address bar legible and showing the client ID** | `Google's consent screen. The app name, and our OAuth client ID in the address bar.` | **16s — longest** |
| 4 | The two permissions listed in Google's own words | `The two permissions we request: read-only search performance, and site verification.` | 10s |
| 5 | She clicks **Allow**; return to The Dream Wedding | `She grants them.` | 6s |
| 6 | Her search performance rendering — queries, impressions, clicks, position | `webmasters.readonly: her own search data, shown in her account.` | 20s |
| 7 | The ownership-confirmed state on the connected property | `siteverification: we confirmed she owns the site before reading its data.` | 12s |
| 8 | She disconnects; the connection gone | `She can disconnect at any time.` | 10s |

Shots 6 and 7 **each** discharge requirement 4 for one scope. A video showing only shot 6 gets
`webmasters.readonly` and loses `siteverification`.

**THIS SHOT LIST IS NOT EXECUTABLE TODAY.** No `googleOAuth.js` exists, no code reads a redirect
URI, no *Connect Google* control has been built — `TDW_INFRA_GOOGLE_OAUTH.md` §4 item 1 records
all of it as owed to G3.1 s2.

**F-42.191, SECOND SITE — STALE, 2026-09-10 (CE-42 seat G2).** The paragraph above is F-42.191's
claim in a second file, and it is not in the original filing; recorded so the cure does not close
half of it. All three now exist: `src/lib/vendor/googleOAuth.js` (reader `:57`, assertion
`:60–70`), and *Connect Google* at `dreamos-pwa app/vendor/(shell)/your-website/screen.tsx:596`
(`a96e2e2`), walked to a live grant 2026-09-10 (§8). The shot list is executable if Branch B ever
applies. Branch A is live, so it does not. **The same rule that blocks B2·3 blocks this**: a permission for a
feature that does not exist cannot be filmed. On Branch B this packet waits for G3.1 s2's door.
**On Branch A it does not wait for anything**, which is the second reason the branch reading at
§0 is the most valuable tap in B3.

---

## 6 · THE HOMEPAGE — a finding, not a step

Google's homepage requirements: publicly accessible and not login-gated; its **relevance to the
app under review must be clear**; it must **describe the app's functionality**; and it must
**link to the privacy policy**.

`https://thedreamwedding.in` is the marketing landing page and it is public — that much this
seat can say. **Whether it describes the app's functionality and carries a visible privacy link
in the footer, this seat has not seen and will not assert.** It is a `dreamos-pwa` surface and
this seat neither reads that repo nor writes it.

**Reported as a finding for the chair.** Someone with the page in front of them must confirm two
things before §3 step 3:

1. A **visible link to `/privacy`** exists on the homepage — Google requires the policy be
   *linked from the homepage so users can find it easily*, and a link that exists only in a
   route table does not satisfy it.
2. The page **describes what the product does**. F-41.1's own note records the landing page as
   the marketing page a signed-in vendor wrongly lands on, so it is at least a product page —
   but "at least a product page" is this seat's inference, not a reading.

If either fails, it is a byte on a surface and therefore **A4's** — the same rider that carries
the privacy words, which is the tidy outcome rather than a second one.

**READ 2026-09-10 (CE-42 G2, card step 4 / 4a).** On the tree at `dreamos-pwa@a96e2e2`: footer
`Privacy` → `https://thedreamwedding.in/privacy` at `app/(landing)/page.tsx:797`, `Terms` at `:799`;
`/privacy` §5 *Your Google account* at `app/privacy/page.tsx:301`. On the surface: **founder's
attestation** that the footer and §5 read as required — no screenshot was pasted for this one
check, and it is recorded as attested, not photographed. Google's own automated brand check
passed against this homepage at 12:29 IST (§8), which is the reading that matters to the review.

---

## 7 · THE FOUNDER'S CARD (CE-42 · G2 s2 (a))

Chair-issued, CE-42 seat G2. **This card replaces the one at kickoff 3 §6.** It is the only
thing the founder reads; every step ends with a paste. Steps 1–3 are B3·1's taps, 4a–4b are
this packet's.

1. **CNAME** — ✅ **CLOSED 2026-09-10.** B3·1 §2, taps 1–6. `https://api.thedreamwedding.in/`
   answers `{"status":"alive","service":"dream-os","version":"0.11.1-alpha"}` over TLS,
   padlock present, Railway tick. Two records, not one — F-42.19.
2. **Redirect URI + scope list** — ✅ **CLOSED 2026-09-10 ~01:35 IST.** B3·1 §3, taps 1–7. Both
   URIs listed; the scope list reads **four**, not two — the card said two and was wrong, see
   B3·1 §3 tap 6. F-41.8 closed off the pre-removal reading: all five declared scopes were
   non-sensitive.
3. **Search Console** — ✅ **CLOSED 2026-09-10 ~01:43 IST.** B3·1 §4. Ownership **auto verified**
   off the existing Google CNAME; no TXT was shown or added. `sc-domain:thedreamwedding.in`
   under `dev@`.
4. **4a · Pre-flight — no publish yet.** §2 items 7 and 8, which have no home in §3:
   - **Clients** in `tdw-business-solutions` (project number `214847546988`, signed in as
     `dev@thedreamwedding.in` — the `authuser` index varies by profile): exactly one OAuth
     client,
     `TDW Backend (dream-os production)`. Delete any other.
   - Owner/editor roles current, and both the support and developer contact emails current —
     Google mails these and a missed mail pauses the review.
   - Then, on a phone: open `thedreamwedding.in` and `thedreamwedding.in/privacy`. The footer
     shows the privacy link; both pages answer; `/privacy` §5 reads **Your Google account**.
     This walk is the witness for §2 items 5 and 6 and for §6's homepage finding — the tree
     says landed, the surface outranks the tree.
   - Paste one screenshot of each page.

   ✅ **CLOSED 2026-09-10 12:02 IST.** One client, `TDW Backend (dream-os production)`, Web
   application, created 7 Sept 2026 · project number `214847546988` witnessed as the client-ID
   prefix · IAM: one principal, `dev@thedreamwedding.in`, **Owner** + Organisation Administrator,
   inherited from `thedreamwedding.in` · developer contact `dev@thedreamwedding.in` (Branding,
   12:21) · footer and §5: tree + founder's attestation (§6). This Chrome profile reaches `dev@`
   at **`authuser=1`**; without it the console opens the default account and reads the project as
   permission-denied (witnessed 11:49 — nothing changed there).
5. **4b · Publish — one sitting.** B3·2 §3, taps 1–8. **Tap 8 is not cosmetic:** the consent
   walk as `dev@thedreamwedding.in` is the grant that mints the refresh token step 5 measures.
   Skip it and day eight reads nothing. Paste **Publishing status = Production**, with the date.

   ✅ **CLOSED 2026-09-10 12:38 IST. THE ORDER AS WALKED** (chair's rulings A, B, C, D and the
   4b·5 order ruling — the console forced it, §3 head):
   1 · Railway `GOOGLE_OAUTH_REDIRECT_URI` → the `api.` host, deployed (12:11) ·
   2 · the door witnessed sending `api.` in the authorize URL (12:16) ·
   3 · railway redirect URI deleted, one remains (12:19) ·
   4 · railway domain off Authorised domains, one remains (12:21) ·
   7 · **Publish app → In production** (12:28) ·
   Verification centre read (12:28) — stop rule **not** triggered ·
   5 · **Verify branding** → verified (12:28–12:29) ·
   6 · **Publish branding** → *"verified and is being shown to users"* (12:29) ·
   8 · consent screen reads **The Dream Wedding** (12:32 — on a state minted at 12:16, **not
   allowed**: the state TTL is ten minutes, `igOAuth.js:167`, checked `:228`, so that tab was dead) ·
   9 · fresh Connect, **Allow** (12:34:53) → `?google=connected` → room reads *Connected* (12:38).
   Step numbers are the founder's 4b card; B3·1 §7 and §8 below carry the readings.
6. **Day 8** — **2026-09-18, after 12:34:53 IST** (07:04:53 UTC, eight days from the grant's
   `connected_at`). The chair hands the check line on that day, not before (conditional-withheld).
7. **The code turn** — `business.manage` at the gate, R-41.47. Chartered only after step 5
   reads green. Withheld.

---

## 8 · RECORD LINE

```
B3·2 · publish the OAuth app on the split scopes
F-41.8 READING (from B3·1 §3 tap 5, Data access, BEFORE the removal, 2026-09-10):
  business.manage      → non-sensitive
  webmasters.readonly  → non-sensitive
  siteverification     → non-sensitive
  userinfo.email       → non-sensitive
  openid               → non-sensitive
BRANCH LIVE: A — all five scopes non-sensitive, founder's screen 2026-09-08, re-read
  2026-09-10 before the removal. F-41.8 CLOSED.
after the removal: four scopes remain. Only business.manage was removed (R-41.47).

publishing status → In production  2026-09-10 12:28 IST
  (dialog "Push to production?" — plain Confirm; its verification clause fired on the LOGO only:
   domains 1 of >10, scopes all non-sensitive. Banner after: "Your app requires verification".)
brand verification: verified 2026-09-10 12:28–12:29 IST (automated, minutes)
branding published 2026-09-10 12:29 IST  (within the 7-day validity window: yes — same sitting)
  Branding reads: "Your branding has been verified and is being shown to users."
console after publishing: data-access review required NO
  Verification centre: "Verification is not required since your app is not requesting any
  sensitive or restricted scopes."
  user cap shown: YES — "1 user / 100 user cap" (Audience, 12:37) — NOT BINDING: Google's own
  text applies it only to unapproved sensitive or restricted scopes, and none is requested.
  Binds only if a sensitive scope is ever added before data-access verification; business.manage
  read non-sensitive (F-41.8) — the code turn re-reads Data access before re-declaring it.
consent screen reads: "The Dream Wedding" — "Sign in to The Dream Wedding", TDW logo (12:32/12:34)
tester warning screen gone: yes — no unverified-app interstitial
THE GRANT (vendor, DEV440 via the pwa Connect — ruling D):
  vendor_google_connections · google_email dev@thedreamwedding.in · has_refresh_token TRUE
  scope: siteverification userinfo.email webmasters.readonly openid
  connected_at 2026-09-10 07:04:53.362 UTC = 12:34:53 IST  ← day 0
  house row (vendor_id NULL): 0 — OWED, not walked (F-40.261, `/google/connect?house=1`)
refresh token durable (first grant + 8 days, still live): not yet — read 2026-09-18 after 12:34:53 IST
F-42.192 OPEN — the callback returns to `/vendor/storefront` (dream-os `src/api/vendor/solutions/
  google.js:43`, RETURN_PATH; redirect at `:44`), and the only reader of `?google=` is
  `dreamos-pwa app/vendor/(shell)/your-website/screen.tsx:316` (`a96e2e2`); nothing under
  `app/vendor/(shell)/storefront/` reads it. A vendor who connects lands on Storefront and never
  sees the connect confirmed (witnessed 12:34, `/vendor/storefront?google=connected`); the room
  reads Connected only on a revisit, from `getStatus`/`connected_at`. Cure unruled — which side
  moves is the chair's call.

Branch B only — justifications pasted <DATE> · demo video <YouTube unlisted link>
```

**The last line of the record is the one that actually closes this packet.** Publishing is not
the proof; a refresh token still alive on day eight is. Until that reading exists, the
seven-day death is cured on paper only.
