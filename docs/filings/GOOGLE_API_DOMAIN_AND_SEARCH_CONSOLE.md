# FILING B3·1 — `api.thedreamwedding.in` (R-40.128) AND SEARCH CONSOLE VERIFICATION

**Base:** dream-os `38a70b010180ab0f05128b8bf6b02e83c609b7cb`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 8, first two links
**Held in clone under the push freeze.** Executable by the founder the moment it lands.
**Owed to:** G3.1 s2 (Search Console), G2 s2 (Business Profile, ≈2026-10-27), and to the
publishing prerequisites at `TDW_INFRA_GOOGLE_OAUTH.md` §4 items 7, 8 and 10.

---

## 0 · THE SCOPE SPLIT (R-41.47), AND A CORRECTION THIS SEAT OWNS

### 0a · The correction

An earlier draft of this file opened by asserting that `business.manage` carries an **annual
paid CASA security assessment**, and treated that as a live constraint on publishing. **That
was over-stated and the chair's challenge was right.**

What is derived at Google, read 2026-09-08 at
`developers.google.com/identity/protocols/oauth2/production-readiness/restricted-scope-verification`
(Google's own footer: **Last updated 2026-08-19 UTC**):

- CASA binds **restricted** scopes only — *"Every app that requests access to Google users'
  restricted data and has the ability to access data from or through a third-party server must
  go through a security assessment."* Re-assessment at least every 12 months from the
  assessor's Letter of Assessment date.
- Restricted scopes are **few**. The page does not list them. It points to the **OAuth API
  Verification FAQ** (`support.google.com/cloud/answer/9110914`) as holding the current list of
  Sensitive and Restricted scopes.
- Google's *sensitive* scope page gives its own examples of **sensitive** — reading Calendar
  events, writing a Contact, deleting a YouTube video. Those are ordinary business-data scopes,
  and they carry verification with a demo video and **no** security assessment.

**What is NOT derived, declared:** the FAQ page at `answer/9110914` **did not render** to this
seat — it returns an empty client-side shell with no list in it. So this seat has **not read
Google's restricted-scope list** and cannot state from Google's own words whether
`business.manage` is on it.

**Best available evidence, and it points away from CASA:** a third-party integration guide
published within the last week states plainly that Google classifies
`https://www.googleapis.com/auth/business.manage` as **Sensitive**. Sensitive means
verification, a demo video and a branding check — **not** a security assessment.

**F-41.8 therefore does not close on this fetch, and the derivation that closes it is one tap
the founder already has.** The Cloud Console's **Data Access** page groups declared scopes into
*non-sensitive*, *sensitive* and *restricted*. `TDW_INFRA_GOOGLE_OAUTH.md` §12 records all
three landing in **non-sensitive**, with both other tables empty, and its author wrote *"Reason
unknown — not resolved, not explained away."* That reading contradicts even *sensitive*, so the
console table is itself suspect and the **Verification Centre** is the arbiter, exactly as §12
says. Step 6 of §4 below collects it.

**Nothing in this packet waits on that answer.**

### 0b · R-41.47 — the split, ruled

The client declares only what the room in hand needs.

- **G3.1 s2 publishes on `webmasters.readonly` + `siteverification`.**
- **`business.manage` is declared only when G2 s2 needs it (≈2026-10-27).**

Publishing earlier is worth more than one combined review, and it **kills the seven-day refresh
death now** rather than after a review widened by a scope no shipped code yet calls. The ruling
stands whichever way F-41.8 resolves — if `business.manage` turns out to be merely sensitive,
the split still buys an earlier publish and a narrower demo video; if it turns out restricted,
the split is the difference between publishing this month and publishing after an assessment.

The console change that effects the split is the founder's tap and is written into §4 step 5.

---

## 1 · WHY THIS PACKET IS FIRST, AND WHAT IT UNBLOCKS

`TDW_INFRA_GOOGLE_OAUTH.md` §5 item 10 records the disease: the consent screen reads
*"dream-os-production.up.railway.app wants access to your Google Account"* and attributes TDW's
privacy policy and terms to that host. Branding saved *The Dream Wedding*; it is not displayed.

**A vendor is being asked to grant delete-access to her Google business listing by a
`railway.app` URL.** That is the first screen she sees. R-40.128 rules the cure:
`api.thedreamwedding.in` before the first real grant.

Doing it clears three separate items at once:

- **§4 item 8** — `up.railway.app` sits on Authorised domains, auto-added when the redirect URI
  was registered, and **TDW cannot prove ownership of Railway's domain.** Google requires
  authorised domains be verified in Search Console. This is not a cosmetic problem; it is an
  unpassable one, and moving to an owned domain is the only cure.
- **§4 item 7** — Search Console domain verification, owed to publishing and shared with
  G3.1 s2's own SEO feature. Not doubled: one verification serves both.
- **§5 item 10** — the consent screen's identity.

---

## 2 · THE CNAME — the exact record, and why it cannot be written here

**A CNAME target this seat cannot know is a CNAME this seat must not invent.** Railway mints the
target per service when the custom domain is added; it is not derivable from the repo and a
guessed value produces a domain that resolves nowhere and a founder who spent an evening on it.

The order is: **Railway first, registrar second.** Railway hands you the value.

1. Railway → project `dream-os` → service `dream-os` → **Settings → Networking → Custom Domain**.
2. Enter `api.thedreamwedding.in`. **Do not enter the apex domain** — `thedreamwedding.in` is
   Vercel's and belongs to the PWA. This is the subdomain and only the subdomain.
3. Railway displays a **CNAME target** of the form `<something>.up.railway.app`. **Copy it
   exactly.** That value, not any value written in any document.
4. At the registrar holding `thedreamwedding.in` DNS, add:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `CNAME` | `api` | *(the target Railway displayed, verbatim)* | automatic / 3600 |

5. Wait for Railway to report the domain **verified / active**. Minutes to an hour, occasionally
   longer.
6. **Prove it before going further:** open `https://api.thedreamwedding.in/` in a browser. It
   must reach the dream-os service, and the padlock must be present — Railway issues the
   certificate itself, and a domain that serves plain HTTP is not finished.

**Do not delete the `up.railway.app` domain.** Railway's own domain keeps serving; nothing that
points at it breaks. The next step adds the new URI **beside** the old one, and only a later,
deliberate act removes anything.

---

## 3 · RE-REGISTERING THE REDIRECT URI — additive, never a swap

`TDW_INFRA_GOOGLE_OAUTH.md` §2 names the hazard in its own words: Google matches redirect URIs
**byte-for-byte**, and a host swap is the silent `redirect_uri_mismatch` class.

The path is derived by mount arithmetic and is unchanged:
`/api/v2/vendor/solutions/google/callback` (§2's four-line derivation).

1. Google Cloud Console — **every URL carries `authuser=2`**. Two personal Google accounts are
   signed in beside `dev@thedreamwedding.in` and a console action taken as the wrong one lands
   in an org-less project and fails only at the first real grant (§6).
2. Project **`tdw-business-solutions`** — never the AI-Studio project also named `dream-os`.
3. **Credentials → OAuth 2.0 Client IDs → `TDW Backend (dream-os production)`**.
4. **Add** this Authorised redirect URI, keeping the existing one:
   ```
   https://api.thedreamwedding.in/api/v2/vendor/solutions/google/callback
   ```
5. **The scope split (R-41.47).** Still in `tdw-business-solutions`, go to
   **Data access** (the scopes page). Remove
   `https://www.googleapis.com/auth/business.manage` from the declared scopes, leaving
   `https://www.googleapis.com/auth/webmasters.readonly` and
   `https://www.googleapis.com/auth/siteverification`. Save.
   **Before removing it, photograph or note which table each of the three scopes sits in** —
   *non-sensitive*, *sensitive* or *restricted*. That reading is what closes F-41.8 and it is
   the only place the estate can get it. Then check the **Verification Centre**
   (`console.developers.google.com/auth/verification`) and note what it says about data-access
   status; the Centre is the arbiter where the Data access table and Google's own docs
   disagree.
   **Nothing breaks by removing it.** No shipped code calls `business.manage` today — the
   Business Profile APIs are quota-blocked until ≈2026-10-27 regardless, and `GBP_QUOTA_APPROVED`
   is unset. G2 s2 re-declares it in its own packet when it can actually use it.
6. Save. Confirm **both redirect URIs** are listed and the scope list now reads two, not three.
7. Under **Branding → Authorised domains**, confirm `thedreamwedding.in` is present.

**The env variable is a separate act and is NOT part of this packet.** `GOOGLE_OAUTH_REDIRECT_URI`
does not exist in Railway today and §4 item 1 records that nothing in `src/` reads it — G3.1 s2
writes that constant and its `isConfigured()` assertion. Setting a variable no code reads is how
a dead control comes to return `true`. **Registering both URIs now costs nothing and blocks
nothing**; the cutover to the new host happens in G3.1 s2's own packet, with the code that reads
it.

---

## 4 · SEARCH CONSOLE VERIFICATION — the method, chosen with a reason

**Chosen: DNS TXT record, on the domain property `thedreamwedding.in`.**

Google offers HTML file upload, HTML meta tag, Google Analytics, Google Tag Manager, and DNS.
The reasons for DNS here, in order of weight:

1. **A domain property covers every subdomain and both protocols in one verification** —
   `thedreamwedding.in`, `www`, and `api` together. The URL-prefix methods verify one prefix
   each, and this estate has at least three that matter. One record, all of them.
2. **It survives deploys.** An HTML file or meta tag lives in the PWA and can be lost in a
   rebuild, a framework change, or a route rewrite. Verification silently lapsing is the
   failure nobody notices until a Google review cites an unverified domain.
3. **It requires no PWA byte.** §6 of this seat's charter forbids writing one, and the meta-tag
   method would need one.
4. **The founder already holds the DNS pane** — he is adding a CNAME there in §2 of this packet.
   One sitting, two records.

**Steps.**
1. `search.google.com/search-console` — signed in as **`dev@thedreamwedding.in`**, the same
   identity that owns the Cloud project. A property verified under a personal account is a
   property the Cloud project cannot use.
2. **Add property → Domain** → enter `thedreamwedding.in` (no `https://`, no `www`).
3. Google displays a **TXT record** beginning `google-site-verification=`. Copy it exactly.
4. At the registrar, add:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `TXT` | `@` *(or blank — the apex)* | `google-site-verification=…` verbatim | automatic / 3600 |

5. Return to Search Console → **Verify**. If it fails, wait and retry — DNS propagation, not a
   wrong record, is the usual cause. Do not add a second record on a failure.
6. **Do not remove the TXT record afterwards.** Google re-checks periodically and verification
   lapses if it disappears.

**Do this in the same sitting as §2, at the same registrar pane.** Two records, one visit.

---

## 5 · WHAT IS OWED ON A SURFACE — named, not written (§6 of this seat's charter)

**F-19.13 stands and is now on the critical path.** `TDW_INFRA_GOOGLE_OAUTH.md` §4 item 6:
the privacy page names no Google data.

Google's verification requirements, read 2026-09-08 (`support.google.com/cloud/answer/13464321`
and the restricted-scope verification page), are specific and all four must hold:

- the privacy policy is **hosted on the same domain as the homepage**;
- it is **linked from the homepage**, so a user can find it without signing in;
- it is **linked from the OAuth consent screen**, and **the two links are the same**;
- it **discloses how the app accesses, uses, stores and shares Google user data**, and the app's
  use is limited to what the policy discloses.

And the homepage itself must be publicly accessible, not behind a login, must make its relevance
to the app clear, and must describe the app's functionality.

**So a PWA byte is owed before publishing: the privacy page must name the Google data.** At
minimum, that TDW reads a vendor's Search Console site data and (when G2 s2 lands) her Google
Business Profile, at her request and under her grant; what is stored; and that she may revoke.

**This seat does not write it into `app/`.** Per the chair's ruling the words are drafted here
as a veto block; the founder rules them; **seat A cuts them as A4**, a one-file pwa rider after
A3, with the homepage link and the consent-screen URL identical.

---

### 5a · VETO BLOCK — the Google-data section for `/privacy`

**PROPOSED. NOT VETOED. NOT ON ANY SURFACE.** Every byte below is the founder's to strike or
rewrite. It is written to satisfy Google's four requirements literally, and each paragraph
names which requirement it discharges.

> **Google account data**
>
> If you connect your Google account to The Dream Wedding, we access data from that account
> only with your permission and only to provide the features described below. You can withdraw
> that permission at any time.
>
> **What we access.** With your permission we read the search performance data for the website
> you own — the queries people used to find your pages, and how those pages performed in Google
> Search — through the Google Search Console API. We also use Google's Site Verification API to
> confirm that you own the website you are connecting.
>
> **Why we access it.** We use this data to show you, inside your own account, how couples are
> finding your pages and what to improve. It is used for that feature and for nothing else.
>
> **What we store.** We store the access credential Google issues, encrypted, so that the
> feature keeps working without asking you to sign in again. We store the search figures needed
> to draw your own reports. We do not store the contents of any other Google service.
>
> **What we never do.** We do not sell Google account data. We do not share it with anyone
> except where you ask us to, or where the law requires it. We do not use it for advertising.
> We do not use it to train any AI or machine-learning model. We do not read your Gmail, your
> Drive, your Calendar or your Contacts, and we do not ask for permission to.
>
> **How to remove it.** You can disconnect your Google account from your settings at any time.
> Disconnecting deletes the stored credential. You can also revoke our access directly from
> your Google account at `myaccount.google.com/permissions`. Write to us at
> `hello@thedreamwedding.in` to ask us to delete anything we hold.
>
> **Limited Use.** The Dream Wedding's use of information received from Google APIs adheres to
> the Google API Services User Data Policy, including the Limited Use requirements.

**Which requirement each part discharges** — so the founder can strike words without breaking
compliance, and whoever checks it checks against Google's list rather than this seat's summary:

| Requirement (Google's own words, read 2026-09-08) | Discharged by |
|---|---|
| The privacy policy must disclose the manner in which your application **accesses, uses, stores, or shares** Google user data | *What we access* · *Why we access it* · *What we store* · *What we never do* |
| Use of Google user data limited to the practices the published policy discloses | *Why we access it* — "for that feature and for nothing else" |
| Must comply with the **Limited Use requirements** | the closing Limited Use sentence, which is the form Google's own examples use |
| Hosted on the **same domain** as the homepage; **linked from** the homepage; **linked from the consent screen**; the two links **identical** | not copy — **A4's job**: `https://thedreamwedding.in/privacy`, linked in the footer, and the same string in the consent screen's Privacy policy URI |

**Three notes for the founder before he rules.**

1. **`business.manage` is deliberately absent.** Under R-41.47 the client no longer declares it,
   so a paragraph about reading Google Business Profile data would describe access the app does
   not have — which is its own compliance problem. **G2 s2 adds that paragraph in its own
   packet**, in the same sitting that re-declares the scope.
2. **The "no AI training" line is load-bearing and must be true.** Google's Limited Use rules
   are strict about it, and the estate's data-handling declaration to Meta already names
   Anthropic and DeepSeek as processors. If any Google-derived byte were ever to reach a model
   prompt, this sentence becomes false and the policy becomes the violation. This seat believes
   it is true today — no shipped code calls a Google API at all — and names it so the line is
   re-read by whoever first pipes Search Console data anywhere near an agent.
3. **The words are plain on purpose.** The reader is a wedding vendor, not a lawyer, and Google
   requires the policy be *visible to users* — which a wall of legal text technically satisfies
   and practically does not.

---

## 6 · WHAT THIS PACKET DOES NOT DO

- **It does not publish the app.** Publishing is roadmap §3 item 8's last link and is blocked on
  F-19.13, on the restricted-scope question at §0, and on the Verification Centre reading.
- **It does not fix the seven-day refresh death.** `TDW_INFRA_GOOGLE_OAUTH.md` §11: in Testing
  the refresh token expires in seven days, and G3.1 s2 stores one expecting it to persist. This
  packet is a prerequisite to the cure, not the cure. **It remains the only clock in this
  charter already costing the estate something.**
- **It does not prove §5 item 10's cure.** The consent screen must be *seen* reading
  *The Dream Wedding* rather than a `railway.app` host. That file says it plainly: **must be
  proven on a real consent screen before it is believed.** After §2 and §3, re-open the consent
  screen and look. If it still shows a host rather than the app name, the diagnosis was wrong
  and that is a finding, not a retry.

---

## 7 · RECORD LINE

```
B3·1 · api.thedreamwedding.in + Search Console
CNAME api → <RAILWAY TARGET>            added <DATE>   Railway status: <active>
https://api.thedreamwedding.in/ reachable over TLS: <yes/no>
redirect URI added (both listed):        <yes/no>
Search Console domain property thedreamwedding.in, TXT, verified <DATE>, as dev@thedreamwedding.in
consent screen after the move reads: <"The Dream Wedding" | a host — if a host, this is a finding>
scope split (R-41.47): business.manage removed <yes/no> · two scopes remain <yes/no>
F-41.8 reading, from Data access BEFORE removal:
  webmasters.readonly  → <non-sensitive | sensitive | restricted>
  siteverification     → <non-sensitive | sensitive | restricted>
  business.manage      → <non-sensitive | sensitive | restricted>
Verification Centre data-access status reads: <verbatim>
```
