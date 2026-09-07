# TDW · INFRA — GOOGLE OAUTH CLIENT (Search Console + Business Profile)

**Seat:** CE-40 infra, 2026-09-07. Docs-only. No product bytes.
**Derived at:** dream-os `52f0b2f` (fresh clone; the walk opened at `8c262cc` and the tip
moved mid-sitting — every citation below re-derived at `52f0b2f`, none carried forward).
**Owed to:** G3.1 s2 (Search Console), G2 s2 (Business Profile, ≈2026-10-27).

---

## 1 · WHAT LANDED

| Field | Value |
|---|---|
| Google Cloud org | `thedreamwedding.in` · `970665222370` |
| Project name / ID | `tdw-business-solutions` (ID **equals** name — no Google-appended suffix) |
| Project number | `214847546988` |
| Signed-in identity | `dev@thedreamwedding.in` (Workspace on the domain, `authuser=2`) |
| OAuth client name | `TDW Backend (dream-os production)` · Web application · created 2026-09-07 |
| Client ID prefix | `214847546988-…` (project-number prefix = right project) |
| Client secret | **not recorded anywhere.** Railway only. |
| Redirect URI | `https://dream-os-production.up.railway.app/api/v2/vendor/solutions/google/callback` |
| JS origins | none (server-side grant) |
| Consent mode | External · **Testing** · test user `dev@thedreamwedding.in` |
| User cap | 1 user (1 test, **0 other**) / 100 — no external grant spent |

**Railway** — project `dream-os`, service `dream-os`, env `production`
(`dream-os-marketing` untouched). Three variables set, names matching
`src/api/vendor/solutions/env.js:50-52` exactly:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `INTEGRATION_TOKEN_KEY` (`openssl rand -hex 32`, generated in the Codespace, pasted to
  Railway only)

No `GOOGLE_OAUTH_REDIRECT_URI` — census of `GOOGLE_` across `src/` finds nothing reads it.

**Scopes on the app** (`Data access`, saved):

```
https://www.googleapis.com/auth/business.manage
https://www.googleapis.com/auth/siteverification
https://www.googleapis.com/auth/webmasters.readonly
```

**APIs enabled — nine of ten.** Search Console, Site Verification, and seven Business
Profile APIs (Account Management, Business Information, Lodging, Notifications, Place
Actions, Verifications, Performance). The legacy `Google My Business API` (v4) is
**invisible in Library** pre-quota-approval — derived, not assumed: the enabled list runs
`Google Cloud Storage JSON API` → `Google Search Console API` with nothing between, and
Library search returns 8 results without it. Owed to G2 s2.

The eight Business Profile APIs share **one** scope, `business.manage`. Nine APIs bought
one scope. `plus.business.manage` is deprecated and deliberately not declared.

---

## 2 · THE REDIRECT URI — HOW IT WAS DERIVED

Path by mount arithmetic at `52f0b2f`, never typed from memory:

- `src/index.js:136` — `app.use('/api/v2', apiRouter)`
- `src/api/router.js:53` — `router.use('/vendor', require('./vendor/core'))`
- `src/api/vendor/core.js:89` — `router.use('/solutions', require('./solutions/index'))`
- `src/api/vendor/solutions/index.js:439` — `/google/callback`

Host by witness at origin: Railway → `dream-os` → Settings → Networking, **one** public
domain, `dream-os-production.up.railway.app` → port 3000. No custom domain, no second
domain. This answers `TDW_19_P0A_LEDGER.md:53` (`NOT DERIVED — owed before A-5`) and
`:309`.

**Registered for GET** (F2). Proven, not asserted: Google validates `redirect_uri` before
rendering the account chooser, so the chooser rendering is byte-for-byte proof.

**Hazard:** if a custom API domain is ever wired to this service, the new URI must be
registered alongside. Google matches byte-for-byte; a host swap is the silent
`redirect_uri_mismatch` class that `src/lib/vendor/igOAuth.js:106-114` exists to prevent.

---

## 3 · RULINGS APPLIED (CE-40, 2026-09-07)

- **F1(a)** — host read off the Railway service page by the founder; recorded above.
- **F2** — GET. `index.js:439`'s `POST /google/callback` comment is wrong and will mislead
  the door's author → **F-40.255**, cured by G3.1 s2 when it writes the handler.
- **F3** — both scope sets declared now. `spec:128` names `siteverification` +
  `webmasters.readonly`; `spec:70` names `business.manage`. Per **c-40.54**, the kickoff
  named the sitting and the tree names the phase (`§6 P3`) — same room, G3.1 sitting 2.
  **Cost:** a restricted scope widens the publishing review.
- **F4** — against `tdw-business-solutions`. Never a second project.
- **F5** — `INTEGRATION_TOKEN_KEY` landed this seat. `env.gates().p1` is the verify.
- **F6** — Testing mode. Publishing owed behind F-19.13.

---

## 4 · OWED

### To G3.1 s2

1. **The IG precedent, not yet adopted.** No `googleOAuth.js` exists; no code reads a
   redirect URI; no path constant. G3.1 s2 writes
   `GOOGLE_OAUTH_REDIRECT_URI` + a `GOOGLE_CALLBACK_PATH` constant + an
   `isConfigured()` assertion that the URI ends at that path — the shape of
   `igOAuth.js:115` / `igImport.js:204-215`. Without it, a stale URI is a dead control
   that returns `true`.
2. **F-40.255** — cure the POST comment at `index.js:439`.
3. Add the vendor's Google account to Test users before walking a real grant.

### To G2 s2

4. Enable `Google My Business API` (legacy v4) once quota is approved.
5. GBP quota application — blocked on 60-day profile age, ≈2026-10-27
   (`TDW_19_P0A_LEDGER.md:314`). `GBP_QUOTA_APPROVED` unset; `business.manage` on the
   client does **not** grant API access.

### Publishing prerequisites (all must clear before *Publish app*)

6. **F-19.13** — the privacy page names no Google data (`ledger:302`, `:35`). PWA byte
   under founder veto.
7. **Search Console domain verification** — Branding's own blurb requires authorised
   domains to be verified. Shared work with G3.1 s2, not doubled.
8. **`up.railway.app` on authorised domains** — auto-added when the redirect URI was
   registered. TDW cannot prove ownership of Railway's domain; a reviewer may object.
   Cured by item 10.
9. **Restricted-scope review** for `business.manage`.

---

## 5 · OPEN — FOR THE CHAIR

### 10 · The consent screen does not say "The Dream Wedding"

It reads *dream-os-production.up.railway.app wants access to your Google Account*, and
attributes TDW's privacy policy and terms to that host. Branding saved `The Dream Wedding`
correctly; it is not displayed.

**Lead, not witness:** a Google developer-forum report (2026-08-06) describes the same
shape — the consent screen showing the registrable domain from Authorised domains rather
than the configured app name. Consistent with our structure, since the redirect URI's
domain was auto-added.

**Product weight:** this is the first screen a vendor sees. She is asked to grant
delete-access to her Google business listing by a `railway.app` URL. That is a trust and
conversion problem, and verification alone may not fix it if the *domain* is what is
displayed.

**Proposed cure, owed as a derive:** wire `api.thedreamwedding.in` to the Railway service,
re-register the redirect URI on that host. Also clears item 8. Must be proven on a real
consent screen before it is believed.

### 11 · Testing vs production — neither is clean for G3.1 s2

| | Testing | Production, unverified |
|---|---|---|
| Refresh token | **expires in 7 days** | durable |
| Grant limit | test-user list | **100 lifetime, non-resettable** |
| Vendor sees | unverified warning | unverified warning |

P1 stores a refresh token encrypted under `INTEGRATION_TOKEN_KEY` and expects it to
persist (`index.js:440-441`). In Testing it dies in a week. So **verification is a harder
prerequisite for G3.1 s2 than the kickoff assumed**, not only for G2 s2. Chair's call.

### 12 · The console's scope tiering disagreed with F3

All three scopes saved into the **non-sensitive** table; *Your sensitive scopes* and *Your
restricted scopes* both read "No rows to display". Reason unknown — not resolved, not
explained away. F3's cost stands as recorded; `See, edit, create and delete your Google
business listings` is not a non-sensitive capability, and Google determines verification
at submission, not from this table. **Resolve at the Verification centre before
publishing.**

### 13 · Identity scopes — a fork, not a decision

`userinfo.email` would let a vendor see *which* Google account she connected. Non-sensitive,
no cap cost, no review widening. Against: TDW's vendor identity is the WhatsApp OTP line,
and no code reads a Google email today. **No timing pressure** — zero grants exist, so the
deadline is the first real vendor grant (G3.1 s2's), not this seat's.

---

## 6 · HAZARDS FOR ANY LATER SEAT

- **Two personal Google accounts** (`devjroy@gmail.com`, `devroy.dr3@gmail.com`) are signed
  in beside `dev@thedreamwedding.in`. Every console URL must carry `authuser=2`. A client
  created under a personal account would be in an org-less project and fail only at the
  first real grant.
- **A second project named `dream-os`** exists (`gen-lang-client-0017514064`), AI-Studio-
  minted, almost certainly the home of `GOOGLE_API_KEY` (`src/lib/groundedSearch.js:33`)
  and `GOOGLE_VISION_API_KEY` (`src/lib/imagePipeline.js:200`). **The OAuth client lives in
  `tdw-business-solutions`, never in `dream-os`.** A reader picking by name picks wrong.
- **Console MFA required by 2026-10-20** — seven days *before* G2 s2's date certain of
  ≈2026-10-27. Enrol first or be locked out in the week the quota unblocks.
- **RBI e-mandate** — reauthorise the billing account before 2026-10-01 or payments lapse
  under the project.

---

## 7 · WITNESS

Google's consent page rendered at `accounts.google.com/signin/oauth/v3/consent` for
`dev@thedreamwedding.in`, listing all three permissions in Google's own words. No
`redirect_uri_mismatch`. No "unverified app" interstitial — consistent with Google's docs,
which show it when requested scopes differ from those configured. **Allow was not pressed.**
The token exchange is G3.1 s2's walk, against a door that does not yet exist.

2026-09-07.
