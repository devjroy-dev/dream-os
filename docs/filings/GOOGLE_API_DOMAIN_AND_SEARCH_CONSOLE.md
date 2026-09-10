# FILING B3·1 — `api.thedreamwedding.in` (R-40.128) AND SEARCH CONSOLE VERIFICATION

**Base:** dream-os `68d92c0f51f3c59e7104881f582d37fa49c3480e`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 8, first two links
**On the tree at this base.** Executable by the founder the moment it lands.
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

**F-41.8 IS CLOSED — by the founder's screen, 2026-09-08.** The Cloud Console's **Data access**
table places **all five declared scopes as non-sensitive**. `business.manage` is therefore not
restricted, CASA does not bind, and this seat's earlier alarm was wrong in the direction the
chair suspected. **B3·2 runs on Branch A.**

**One residue worth a line, since the number changed.** `TDW_INFRA_GOOGLE_OAUTH.md` §1 records
**three** scopes declared on the client; the console shows **five**. The likeliest reading is
Google's own documented behaviour — *"an initial set of scopes necessary for Google Sign-In are
pre-filled in the Non-sensitive scopes section"* — in which case the extra two are `openid` and
an identity scope. **If one of them is `userinfo.email`, then `TDW_INFRA_GOOGLE_OAUTH.md` §13's
open fork** — *"Identity scopes — a fork, not a decision"*, left open for the founder — **has
been settled by a console default rather than by anyone's choice.** Not urgent, no cost either
way, and named only so a decision is not inherited as a fact. **The former text of this section
is left below as written, because a correction that erases what it corrects teaches nothing.**

**The reading that closed it, kept for the record:** The Cloud Console's **Data Access** page groups declared scopes into
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
4. **In Vercel → Domains → `thedreamwedding.in` → DNS Records**, add **both** records Railway
   asks for. **F-42.19:** the zone is registered with a third party but served by **Vercel
   nameservers**, so the registrar's DNS pane is decorative and the records must go here.
   Railway mints **two**, not one, and neither value is derivable — copy both verbatim:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `CNAME` | `api` | *(the target Railway displayed, verbatim)* | 60 |
   | `TXT` | `_railway-verify.api` | *(the `railway-verify=…` string Railway displayed, verbatim)* | 60 |

   The TXT is what Railway reads while it says *Validating domain ownership*; without it the
   CNAME resolves and the domain never activates.

   **The zone carries a wildcard**, so every unconfigured label already answers on Vercel's edge
   with a `DEPLOYMENT_NOT_FOUND` page. An explicit `api` record beats the wildcard — nothing
   needs removing, and **do not remove it**. It also means *the domain answering in a browser is
   not proof the record landed*: tap 6 is the proof, and only tap 6.

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

1. Google Cloud Console — signed in as **`dev@thedreamwedding.in`**. **The `authuser` index
   varies by browser profile** and is not a constant: it was `authuser=2` when this packet was
   written and `authuser=1` in the Chrome profile that actually ran it (2026-09-10). Read the
   account chip on the page; do not trust the number in a URL copied from anywhere, including
   from here. A console action taken as the wrong account lands in an org-less project and
   fails only at the first real grant (§6).
2. Project **`tdw-business-solutions`**, project number **`214847546988`**. **Check the number,
   not the name.** Two decoys exist: the AI-Studio project also called `dream-os`, and a project
   called **`thedreamwedding`**, number **`823156231613`**, which carries a free-trial banner —
   the founder landed in it first on 2026-09-10. Nothing was changed there. A near-identical
   name is the trap; the project number is the only thing that distinguishes them at a glance.
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
   **The F-41.8 reading was taken on 2026-09-10, before the removal, and it is CLOSED.** The
   Data access table listed **five** declared scopes, **all five non-sensitive**, with the
   *sensitive* and *restricted* tables empty: `business.manage`, `webmasters.readonly`,
   `siteverification`, `userinfo.email`, `openid`. **`business.manage` was non-sensitive.**
   The instruction that produced it is kept below because the reading is unrepeatable once a
   scope is gone — *photograph which table each declared scope sits in before removing any of
   them* — but this particular reading does not need taking again. Then check the
   **Verification Centre** (`console.developers.google.com/auth/verification`) and note what it
   says about data-access status; the Centre is the arbiter where the Data access table and
   Google's own docs disagree.
   **Nothing breaks by removing it.** No shipped code calls `business.manage` today — the
   Business Profile APIs are quota-blocked until ≈2026-10-27 regardless, and `GBP_QUOTA_APPROVED`
   is unset. G2 s2 re-declares it in its own packet when it can actually use it.
6. Save. Confirm **both redirect URIs** are listed. **The scope list now reads FOUR, not two** —
   `webmasters.readonly`, `siteverification`, `userinfo.email`, `openid`. The earlier text here
   said "two, not three" and was wrong in both halves: the declared set was never three, and
   R-41.47 removes **only `business.manage`**. `userinfo.email` and `openid` are the sign-in
   scopes and are not part of the split. Five before, four after, one removed.
7. Under **Branding → Authorised domains**, confirm `thedreamwedding.in` is present.

**The env variable is a separate act and is NOT part of this packet.** `GOOGLE_OAUTH_REDIRECT_URI`
does not exist in Railway today and §4 item 1 records that nothing in `src/` reads it — G3.1 s2
writes that constant and its `isConfigured()` assertion. Setting a variable no code reads is how
a dead control comes to return `true`. **Registering both URIs now costs nothing and blocks
nothing**; the cutover to the new host happens in G3.1 s2's own packet, with the code that reads
it.

---

## 4 · SEARCH CONSOLE VERIFICATION — the method, chosen with a reason

**Chosen: a domain property on `thedreamwedding.in`, verified through DNS.** The method was
written as *DNS TXT record*; it resolved as **auto-verification off an existing Google CNAME**
(see the taps). The property shape — domain, not URL-prefix — is what the reasoning below
actually argues for, and that part held.

Google offers HTML file upload, HTML meta tag, Google Analytics, Google Tag Manager, and DNS.

**FIRST LIST — why DNS, not the other four. Reasoning, not taps. Nothing here is a step.**

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

**SECOND LIST — the taps. This is what the founder's card means by "§4, the second list".**

**⚠ WHAT ACTUALLY HAPPENED, 2026-09-10: no TXT was ever shown, and taps 3–6 below did not
run.** Google **auto-verified** the property off a Google verification CNAME already sitting in
the Vercel DNS pane since May — `yr2kzeyuikgy → gv-fofn2czma64t66.dv.googlehosted.com` — and
reported the method as **Domain name provider**, ownership **auto verified**. The taps are kept
below because they are the path for any domain that has no such record, and because a re-verify
after that CNAME is lost would need them. Read tap 2's outcome first and only continue into
tap 3 if Google actually asks for a record.

1. `search.google.com/search-console` — signed in as **`dev@thedreamwedding.in`**, the same
   identity that owns the Cloud project. A property verified under a personal account is a
   property the Cloud project cannot use.
2. **Add property → Domain** → enter `thedreamwedding.in` (no `https://`, no `www`).
   **If Google says *Ownership auto verified*, §4 is finished here.** Record the method it
   names and stop; taps 3–6 do not apply.
3. Otherwise Google displays a **TXT record** beginning `google-site-verification=`. Copy it
   exactly.
4. **In Vercel → Domains → `thedreamwedding.in` → DNS Records** (F-42.19 — the same pane as §2
   tap 4, not the registrar), add:

   | Type | Name | Value | TTL |
   |---|---|---|---|
   | `TXT` | `@` *(or blank — the apex)* | `google-site-verification=…` verbatim | 60 |

5. Return to Search Console → **Verify**. If it fails, wait and retry — DNS propagation, not a
   wrong record, is the usual cause. Do not add a second record on a failure.
6. **NEVER REMOVE THE RECORD THAT CARRIES THE VERIFICATION.** Google re-checks periodically and
   verification lapses if it disappears. **On this estate that record is the CNAME
   `yr2kzeyuikgy → gv-fofn2czma64t66.dv.googlehosted.com`, not a TXT.** It predates this packet,
   it looks like debris in the DNS pane, and deleting it silently unverifies the domain — which
   is the failure nobody notices until a Google review cites an unverified domain. If a TXT is
   ever added by tap 4, that one is never removed either.

**Do this in the same sitting as §2, in the same Vercel DNS pane.**

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

### 5a · A4 — THE TRIO, AS A DIFF (R-41.50; the chair vetoes)

**Derived at dreamos-pwa `3d20215236ed2b3af2628b8312fa24cf0a9b3ee2`** by fresh clone, read by
command. Three bytes, one rider, cut by seat A. **This seat wrote none of them into `app/`.**

#### The finding that changes the shape of this

The chair's derivation was that `/privacy` exists with a Google section. It does — and it is
**worse than a missing section.** Read at `app/privacy/page.tsx:299-315`, §5 is headed
**Google Business Profile** and says the app *"read[s] your profile details, reviews and
performance metrics"* and *"update[s] the fields you edit in our app &mdash; your description,
hours, services and photos &mdash; on your profile."*

**Every word of that describes `business.manage`, which R-41.47 has just removed from the
declared scopes.** And it describes **write** access, which the estate has never held: GBP is
quota-blocked until ≈2026-10-27, `GBP_QUOTA_APPROVED` is unset, and no shipped code calls a
Business Profile endpoint.

So the live policy currently **describes Google access the app does not have, and omits the
Google access it is about to request.** F-19.13 was filed as *"the privacy page names no Google
data."* The truer statement is: it names the wrong Google data. A reviewer comparing the consent
screen (Search Console, read-only) against the policy (Business Profile, read and write) sees a
mismatch, and mismatch between what is declared and what is shown is the commonest rejection
cause in Google's own guidance.

**Amend §5. Do not add a §5b.** Two Google sections describing different scopes is the same
mismatch with more words.

#### BYTE 1 — `app/privacy/page.tsx`, the §5 heading

Line 301. **OLD:**

```
            <span className="num">5</span> Google Business Profile
```

**NEW:**

```
            <span className="num">5</span> Your Google account
```

*Why:* the section now covers Search Console and site verification, and will cover Business
Profile again at G2 s2. A heading naming one product goes stale every time the scope set moves.

#### BYTE 2 — `app/privacy/page.tsx`, the §5 paragraph

Lines 304-313, the whole paragraph between `<p>` (303) and `</p>` (314). **Replace entire.**

**OLD** (verbatim at `3d20215`, for the applier to match against):

```
            If you connect your Google Business Profile to your vendor account, we
            access it only with your consent, through Google&rsquo;s official APIs. We
            read your profile details, reviews and performance metrics to show them in
            your dashboard, and we update the fields you edit in our app &mdash; your
            description, hours, services and photos &mdash; on your profile. We never
            create profiles without your authorisation, never act on a profile you have
            not connected, and never sync in the other direction. Your Google access
            tokens are encrypted at rest and used only for these purposes. You can
            disconnect at any time from your account settings, or revoke our access
            directly from your Google account.
```

**NEW:**

```
            If you connect your Google account to your vendor account, we access it
            only with your consent, through Google&rsquo;s official APIs. We read the
            search performance of websites you own &mdash; the searches people used to
            find your pages, and how those pages ranked in Google Search &mdash; and we
            confirm that you own a site before we read anything about it. We show that
            information to you in your own account and use it for nothing else. Your
            Google access tokens are encrypted at rest. We never act on an account you
            have not connected. We do not sell Google account data, we do not use it for
            advertising, and we do not use it to train any AI or machine-learning model.
            You can disconnect at any time from your account settings, or revoke our
            access directly from your Google account.
```

**House style held:** `&rsquo;` and `&mdash;` as entities, matching the surrounding file — R-40.57's
apostrophe rule and JSX escaping both. No raw apostrophe enters this file.

**Each Google requirement, and the clause that discharges it** — so the chair can strike words
without breaking compliance:

| Google's requirement (read 2026-09-08) | Discharged by |
|---|---|
| Discloses how the app **accesses** Google user data | *only with your consent, through Google&rsquo;s official APIs* |
| Discloses what it **uses** the data for | *We show that information to you in your own account and use it for nothing else* |
| Discloses how it **stores** the data | *Your Google access tokens are encrypted at rest* |
| Discloses how it **shares** the data | *We do not sell &hellip; not for advertising &hellip; not to train any AI* |
| Use **limited to the practices disclosed** | *use it for nothing else* — the sentence that binds the app to its own policy |
| Deletion / revocation available to the user | *disconnect at any time &hellip; or revoke our access directly from your Google account* |

**Three notes for the chair before the veto.**

1. **Business Profile is deliberately gone, not forgotten.** Under R-41.47 the app does not
   declare `business.manage`, so a GBP paragraph would describe access it does not have.
   **B3·3 restores it at G2 s2**, in the same sitting that re-declares the scope — and that
   restoration must describe **read** and, if the sync ships, **write**, because the old text
   claimed write the estate never had.
2. **The AI sentence is R-41.49 as law, in the vendor's words.** It is true today only because
   no shipped code calls a Google API at all. The first byte that puts Search Console data near
   a model prompt makes the published policy false, which is a worse failure than the feature.
   The sentence belongs here *and* the rule belongs in the protocol.
3. **"how those pages ranked" replaces "average position"** deliberately. The reader is a
   wedding vendor. Google requires the policy be *visible to users*, which a wall of API
   vocabulary technically satisfies and practically does not.

#### BYTE 3 — the homepage privacy link

**Derived, not assumed:** `app/(landing)/page.tsx` at `3d20215` is 1,242 lines and contains
**no link to `/privacy` or `/terms`** — the only match for *terms* is a code comment at `:910`.
There is no footer component on that page.

Google requires the privacy policy be **linked from the homepage so users can find it easily**,
and that the link **match the Privacy policy URI on the consent screen exactly**.

**Owed:** a visible link on `https://thedreamwedding.in` to **`https://thedreamwedding.in/privacy`**
— that exact string, no trailing slash, no relative path that renders differently, because
Google compares it to the consent-screen URI. A `/terms` link beside it costs nothing and is
Google's *optional terms of service* line.

**Placement and styling are seat A's and the founder's, not this seat's.** What is required is
only that it be present, visible without signing in, and byte-identical to the consent-screen
URI. This is the one byte of A4 whose *words* are not this seat's to draft — it is a link, and
naming its label would be reaching into a surface.

**The trio LANDED at `dreamos-pwa@cc109bd7` (F-42.14).** Requirements 5 and 6 of B3·2 §2 are
exactly these bytes and are marked landed there. The tree says so; the surface is witnessed at
B3·2 §7 card 4a, and the surface outranks the tree.

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

STEP 1 CLOSED 2026-09-10 (CE-42 · G2 · card step 1 · F-42.18 CLOSED)
  CNAME api               → b3f9r8hu.up.railway.app            added 2026-09-10, TTL 60
  TXT   _railway-verify.api → railway-verify=b0ea88b0…          added 2026-09-10, TTL 60
  pane: Vercel DNS (F-42.19) · Railway status: active, tick shown
  https://api.thedreamwedding.in/ over TLS: YES, padlock present
    body: {"status":"alive","service":"dream-os","version":"0.11.1-alpha"}
  resolution proof: api.thedreamwedding.in and b3f9r8hu.up.railway.app both → 69.46.46.48;
    an impossible label still falls to the Vercel wildcard, so the explicit record is the
    one answering.

STEP 2 CLOSED 2026-09-10 ~01:35 IST (CE-42 · G2 · card step 2)
  project: tdw-business-solutions, number 214847546988, as dev@thedreamwedding.in
    (authuser=1 in that Chrome profile — the index is profile-specific, §3 tap 1)
    trap: first attempt landed in project "thedreamwedding", 823156231613, free-trial
    banner. Nothing was changed there.
  redirect URI added beside the existing one: YES, both listed. "OAuth client saved".
    https://api.thedreamwedding.in/api/v2/vendor/solutions/google/callback
  F-41.8 READING, from Data access BEFORE removal — CLOSED:
    five declared scopes, ALL FIVE NON-SENSITIVE. sensitive: none. restricted: none.
      business.manage      → non-sensitive   ← the reading F-41.8 was opened for
      webmasters.readonly  → non-sensitive
      siteverification     → non-sensitive
      userinfo.email       → non-sensitive
      openid               → non-sensitive
  scope split (R-41.47): business.manage removed YES · FOUR scopes remain (not two —
    userinfo.email and openid are sign-in scopes and were never part of the split).
    "Data access changes saved".
  branding at this point: app name The Dream Wedding · support dev@ · logo present ·
    home/privacy/terms set · authorised domains thedreamwedding.in and
    dream-os-production.up.railway.app · Publishing status: Testing.

STEP 3 CLOSED 2026-09-10 ~01:43 IST (CE-42 · G2 · card step 3)
  property sc-domain:thedreamwedding.in under dev@thedreamwedding.in
  ownership AUTO VERIFIED — method "Domain name provider". NO TXT was shown or added;
    §4 taps 3–6 did not run. Google recognised the May CNAME
    yr2kzeyuikgy → gv-fofn2czma64t66.dv.googlehosted.com. THAT record now carries the
    verification and is the one that must never be removed.
  sitemap https://thedreamwedding.in/sitemap.xml submitted: Success · discovered pages 1 ·
    last read 10 Nov 2025 (Google's cached read, not a fresh crawl).
  a 2022 sitemap.website.xml row reads "Couldn't fetch" — old site, left alone.

STILL OPEN
consent screen after the move reads: <"The Dream Wedding" | a host — if a host, this is a finding>
Verification Centre data-access status reads: <verbatim>
```
