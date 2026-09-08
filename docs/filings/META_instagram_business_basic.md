# FILING B2·2 — `instagram_business_basic` (Advanced Access)

**Base:** dream-os `57d12d493e1719feb95b3186c9d9ec0a6ce84f29`
**Seat:** CE-41 LE-B · 2026-09-08 · roadmap §3 item 3 · master §5 row **I1**
**App:** App-LIVE (the IG-import precedent, TDW_07 §2). **Never the ads app.**
**Unblocks:** every Instagram plane — I2 the DM bridge, I3 insights, I4 publishing, I5 comments.
**Scope requested: `instagram_business_basic` ALONE.**

---

## 0 · THE RULES THIS PACKET OBEYS, WITH THEIR SOURCE

Every rule below was read at Meta's own page on **2026-09-08**, not from memory.

| Rule | Source, and Meta's own "Updated" date |
|---|---|
| Every permission needs its own recording; a permission with no recording **is not approved** | *Screen Recordings*, `developers.facebook.com/docs/app-review/submission-guide/screen-recordings` |
| One video per permission; a video showing several permissions **may be rejected** | *App Review*, `.../whatsapp/solution-providers/app-review` |
| Recording shows **how** to test, not **why** — the form asks why | *Screen Recordings* |
| Complete login flow, from logged-out to logged-in | *Screen Recordings* |
| The business login button, the consent screen, and the user **granting** the permission | *Screen Recordings* |
| The data being used, and **what the app does with it** — through to the visible result | *Screen Recordings* |
| English UI; captions and tool-tips for anything not self-explanatory | *Screen Recordings* |
| **Omit audio — reviewers will not listen to it** | *Screen Recordings* |
| Development mode + an account with an **Admin or Developer role** is the sanctioned way to capture | *App Review*, `developers.facebook.com/docs/apps/review` |
| Read the **Allowed Usage** section for the permission; if the app does not satisfy it, no approval | *App Review submission guide* |
| One scope only — a permission the recording does not visibly exercise is a documented rejection axis | Meta's own rejection guidance; the estate's own `igOAuth.js:127-132` records the same and holds `IG_SCOPE = 'instagram_business_basic'` |

**One correction to a widely repeated claim, made here so it is not inherited.** A third-party
guide fetched today asserts that App Review "requires a real Instagram Business or Creator
account, not a developer test user assigned in the App Dashboard." **That is not Meta's rule.**
Meta's own App Review page says the easiest way to show data usage is development mode pulling
data from your own account or from any user with an Admin or Developer role on the app. So
**R-41.7 stands unamended** — the app-role account is the sanctioned path. What Instagram
*separately* requires is that the account be a **professional (Business or Creator)** account;
that is a platform requirement on the account type, not an App Review requirement on the role.

---

## 1 · THE USE-CASE TEXT — paste into the permission's box

Written in the reviewer's frame: the vendor's action, and the data used. Nothing more. No
marketing language, no claims about the business, no second feature smuggled in.

```
The Dream Wedding is business software for Indian wedding vendors — photographers,
makeup artists, decorators. Each vendor has an account with a portfolio page that
couples view.

Most of these vendors already keep their work on Instagram and nowhere else. Building
a portfolio a second time by hand is the single most common reason a vendor abandons
setup. This permission exists to remove that step.

What the vendor does: inside her own account, on the portfolio screen, she taps
"Connect Instagram". She is sent to Instagram's authorization window, where she grants
our app instagram_business_basic for her own professional account. She is returned to
her portfolio, shown a grid of her own recent Instagram media, selects the images she
wants, and taps Import. Those images become photos on her portfolio page.

What we read with this permission: her Instagram user id, username, and the media
objects on her own account (id, media type, media url, permalink, caption, timestamp).
We read only the account that authorized us, and only at her request.

What we do not do: we do not read any other account's data, we do not read follower
lists, we do not read comments or messages, we do not publish, and we do not read
Instagram data on any schedule. There is no background sync. Reading happens only when
the vendor is on the screen and has asked for it.

Storage and deletion: imported images are copied to our own media storage so her
portfolio does not break if a post is later removed from Instagram. The access token is
stored encrypted. She can disconnect from the same screen, which deletes the token. We
implement Instagram's deauthorize callback and data deletion request callback, and a
deletion status endpoint, so a disconnection or deletion initiated from Instagram's side
is honoured on ours.

This is the only Instagram permission we are requesting in this submission.
```

**Why it is shaped this way.** It names one feature and one screen; it lists the fields read
rather than gesturing at "profile data"; it states the negative space explicitly, because the
commonest rejection on a `basic` scope is a reviewer who cannot tell where the reading stops;
and it names the deauthorize and deletion callbacks, which exist in the tree
(`src/api/vendor/ig.js` carries `/deauthorize`, `/data-deletion` and `/deletion-status`) and
which a reviewer checking data-handling will look for.

---

## 2 · THE TEST-USER SETUP (R-41.7) — before any recording

The app must be in **Development mode** and the recording account must hold a role on the app.

**2a · The app role — the vendor identity `9888294440` (DEV440).**
1. `developers.facebook.com/apps` → **App-LIVE** → **App roles** → **Roles**.
2. **Add people** → **Developer** (Tester is enough to authorise, but Developer is what R-41.7
   names and it removes a class of confusion later).
3. Enter the Facebook account that owns DEV440's Instagram professional account.
4. **Accept the invitation from that account's own notifications** — an unaccepted invite looks
   identical to an accepted one on the sender's screen and is the reason a walk fails at the
   consent screen with no error worth reading.
5. Confirm the role shows **Active**, not *Pending*.

**2b · The Instagram account.** It must be a **professional** account — Business or Creator —
before it can appear in the authorization window at all.
1. On the phone: Instagram → **Settings and privacy** → **Account type and tools** →
   **Switch to professional account** if it is not already one.
2. Confirm it is reachable from the Facebook account added in 2a.
3. **Post at least six images to it before recording.** An empty or three-post grid makes the
   import screen look broken on video, and the media grid is the whole evidence of the
   permission being used.

**2c · Which account — RULED, R-41.44 as amended (2026-09-08).**

The recording is shot on **`MAKEUPBYSWATIROY`** (`8595356978`). **Consent is given by the
founders' word on 2026-09-08** — the account is the co-founder's own, so there is no third
party to ask, no consent text to draft, no reply to collect. The RECORD line at §6 notes it as
founders' word and that is the whole of the record owed. R-41.44's first form asked for a
signed line and was withdrawn the same day for this reason; both states are noted here so a
later reader does not go hunting for a consent message that was never owed.

**2d · What her account being a live vendor account changes — read before §3.**

She is not a fixture. She is a production vendor with a portfolio already standing and, in all
likelihood, **Instagram already connected**. Three consequences, each derived at `38a70b0`:

1. **A connected account cannot show a consent screen.** `GET /api/v2/vendor/ig/status`
   (`src/api/vendor/ig.js:58-88`) reports `connected: true` where a live connection exists and
   returns her `ig_username`, so the portfolio screen renders a connected state rather than a
   Connect control. The consent screen is the shot this submission turns on. §2e is therefore
   not optional.
2. **Disconnecting is safe.** `DELETE /api/v2/vendor/ig/disconnect` (`:237-244`) deletes the
   connection and **leaves every mirrored photo in place**. The file states the law in its own
   words: *Instagram is a source, never a dependency — a vendor disconnecting Instagram must
   not wake up to an empty storefront.* Nothing she has is lost by preparing the recording.
3. **Her portfolio will not be empty on camera, and must not pretend to be.** The original shot
   4 read *"It is empty."* On her account that caption is a false statement made to a reviewer,
   on video, about a screen he can see. §3 is re-cut on that basis.

**2e · The pre-record revoke — the step without which shot 6 does not exist.**

Clearing our side is not enough. Instagram remembers the app was authorized, and a
re-authorization on a still-authorized account can return **without rendering the consent
screen at all**. The recording would then cut from *Connect* to *connected*, which is the
commonest rejection on this scope. Both sides must be cleared, in this order:

1. In The Dream Wedding, on her vendor account: portfolio screen → **Disconnect**. Then confirm
   two things on screen before going further: the screen offers a Connect control again, **and
   her existing photos are still there.**
2. On the phone, in Instagram, as her: **Settings and privacy → Apps and websites** → find
   **The Dream Wedding** → **Remove**. The menu label varies by build; *Apps and websites* is
   the target.
3. Re-open the portfolio screen. It must offer **Connect Instagram**.
4. **Do not tap it.** That tap is shot 5, and the recording starts before it.

**If step 2 finds no entry**, Instagram had already released it and step 1 was sufficient —
proceed. **If step 3 still shows connected**, stop and report: something holds a live token and
the recording will not show a grant.

**2f · The app role for her account (R-41.7).**
1. `developers.facebook.com/apps` → **App-LIVE** → **App roles** → **Roles** → **Add people**.
2. Choose **Tester**.
3. Enter the **Facebook account** linked to `MAKEUPBYSWATIROY`'s Instagram professional account
   — the Facebook account, not the Instagram handle.
4. **Accept the invitation from that account's own notifications.** This is the silent failure:
   an unaccepted invitation looks identical to an accepted one on the sender's screen, and the
   walk that fails on it fails at the consent screen with no error worth reading.
5. Confirm the role reads **Active**, not *Pending*.
6. Confirm the app is in **Development mode** — in Development mode the app is automatically
   approved for all permissions, which is what makes the capture possible at all.

**2g · Her Instagram grid.** §2b's six-post floor is almost certainly already met on a working
makeup artist's account. Confirm it rather than assume it, and confirm the recent posts are
work she is content to have in a file Meta retains.

**2d · Confirm the app is in Development mode** before recording. Meta's own note: in
Development mode the app is automatically approved for all permissions, which is what makes the
capture possible; once Live, an unapproved permission cannot be exercised and therefore cannot
be filmed.

---

## 3 · THE SHOT LIST — recorded on the phone, cut in InShot or Instagram's editor

**Before the first tap.**
- Android **Settings → Developer options → Show taps: ON.** Without it the reviewer sees screens
  changing with no visible cause. This is the whole of K-3's legibility law in one toggle.
- Phone language **English**. Notifications silenced. Battery above 50%.
- **Log out of The Dream Wedding entirely.** Meta's page is explicit: capture from *logged-out*.
- Record with Android's built-in screen recorder, **audio off** — Meta will not listen to it.
- One continuous take if possible. Retakes are cheaper than a rejection.

**Target length: 1 minute 50 seconds.** Nine shots.

| # | On screen | Caption typed over it | Hold |
|---|---|---|---|
| 1 | The Dream Wedding sign-in screen, logged out, nothing filled | `The Dream Wedding — vendor sign-in. Starting logged out.` | 6s |
| 2 | She enters her phone number and taps to receive the code | `Vendors sign in with their own phone number. No Facebook login.` | 8s |
| 3 | The WhatsApp one-time code arriving and being entered; landing on the vendor home | `One-time code by WhatsApp, then the vendor's own account.` | 12s |
| 4 | The portfolio screen, showing **the photos already there** | `Her portfolio — what couples see. She has more work on Instagram than she has here.` | 8s |
| 5 | The **Connect Instagram** control, tapped slowly and clearly | `She taps Connect Instagram to bring the rest of her own work across.` | 6s |
| 6 | Instagram's authorization window: the account name, and **the permission being requested, on screen** | `Instagram's own authorization screen. The app asks for instagram_business_basic and nothing else.` | **14s — hold longest of any shot** |
| 7 | She taps **Allow**; the return to The Dream Wedding | `She grants it. This is the consent, given by the account holder.` | 8s |
| 8 | The grid of her own Instagram media rendering; she selects several **she has not imported before**; taps **Import** | `Her own Instagram media, read with this permission. She chooses which to import.` | 20s |
| 9 | The portfolio with the new photos added beside the existing ones; then the public storefront page showing them | `The imported photos are now on her portfolio, live on the page couples see.` | 18s |
| 10 | Back on the portfolio screen, the **Disconnect** control shown and tapped; the connection gone **and the photos still there** | `She can disconnect at any time. The token is deleted. Her photos stay — Instagram is a source, not a dependency.` | 12s |

**Shot 6 is the shot the submission turns on.** Meta's page requires the reviewer to see the
authorization flow and the user granting the permission — a recording that cuts from *Connect*
to *connected* is the single commonest rejection. If the permission string is small on screen,
**zoom into it in InShot** rather than re-recording; Meta's own best-practice section names
zooming for hard-to-see sections.

**Shots 8 and 9 together are the data-usage requirement.** Shot 8 shows the data being read;
shot 9 shows what the app does with it. Meta's page asks for both and treats the second as the
proof that the permission is needed rather than merely requested.

**Shot 10 is not required and should be included anyway.** Deletion and disconnection are what
a data-handling reviewer looks for, and twelve seconds of showing it costs less than an appeal.
On her account it now carries a second load: the disconnect leaves the mirrored photos standing
(`ig.js:237-244`), which is the honest answer to the reviewer's natural next question — *what
happens to the data you copied when she revokes?* Show the photos surviving in the same shot.

**A caution on shot 8 that is specific to a live account.** She has imported before, so some of
her grid is already on her portfolio. Select images that are **not** already there. Importing a
duplicate produces either a no-op or a second copy, and either one makes shot 9 read as though
the permission did nothing.

### Cutting it in InShot (Android)
1. Import the raw recording. **Do not add music.**
2. Trim dead air at the head and tail only. Do not cut inside shot 6 or shot 8.
3. **Text** → add each caption above as an overlay on its shot. White text, black outline or
   band. Large enough to read on a laptop at half size — if in doubt, larger.
4. Position captions at the **top** of the frame. Bottom is where Android draws the nav bar and
   where the app draws its own controls.
5. Every caption stays on screen for its shot's full hold. A caption that flashes is a caption
   the reviewer misses.
6. **Canvas: original.** No crop, no fit-to-square. Cropping a phone recording cuts the
   permission string out of shot 6.
7. Export **1080p, 30fps, highest quality.** Confirm the exported file plays with no audio track.

**Instagram's own editor is the fallback, not the first choice** — it caps duration and pushes
square crops, and this video must not be cropped. Use InShot. If Instagram's editor is all
that is available, export from it and verify shot 6 is intact before submitting.

---

## 4 · THE SUBMISSION, TAP BY TAP (a phone screen, in order)

1. `developers.facebook.com/apps` → **App-LIVE**.
2. **App Review → Permissions and Features.**
3. Search `instagram_business_basic`. **Only this one.** Add nothing else to this submission.
4. **Request advanced access.**
5. Open the request. Paste **§1** into the use-case box.
6. Upload the video from §3. **One video, this permission only.**
7. In the verification / testing details box, state which Instagram professional account was used
   and that it holds a Developer role on the app (§2). Give no Instagram password — Meta's
   guidance is credentials for your *own* test dashboard where relevant, never the social
   account's.
8. Re-read the permission's **Allowed Usage** section on its reference page and confirm §1's text
   does not claim a use outside it.
9. **Submit for review.**
10. Record the submission ID from **App Review → Requests** and paste §6's record line to the chair.

---

## 5 · WHAT THIS PACKET DELIBERATELY DOES NOT DO

- **It does not request a second permission.** `manage_messages` is roadmap §3 item 4 and gets
  its own packet, its own video and its own use-case text. Meta may reject a submission that
  shows several permissions in one video, and the estate's rule against fusing filings says the
  same thing for its own reasons.
- **It does not touch the second Meta app.** `ads_read` / `business_management` is item 7.
- **It does not name a PWA screen this seat has not seen.** The dream-os doors are derived
  (`src/api/vendor/ig.js`: `/status`, `/authorize`, `/callback`, `/media`, `/import`,
  `/deauthorize`, `/data-deletion`, `/deletion-status`; `igOAuth.js:132` holds the single scope).
  The **labels** in §3 — *Connect Instagram*, *Import*, *Disconnect* — are the flow as it must
  read on camera, not strings this seat verified in `dreamos-pwa`. **If the shipped labels differ,
  the captions follow the screen and this file is wrong, not the screen.** Reported to the chair
  rather than asserted.

---

## 6 · RECORD LINE — paste back to the chair after submitting

```
B2·2 · instagram_business_basic
submission id: <ID>          filed: <DATE>          state: <In review>
app: App-LIVE · scope: instagram_business_basic ALONE
IG professional account used: MAKEUPBYSWATIROY (8595356978) · app role: Tester, Active
consent: founders' word, 2026-09-08 (R-41.44 as amended — the co-founder's own account;
         no consent text owed, none collected)
pre-record revoke: our side <done/na> · Instagram side <done/na> · consent screen rendered: <yes/no>
video: <length> · captions burned in · no audio · 1080p · shot 6 (consent) intact
master §6 row: "Meta App Review — instagram_business_basic | I1 | Filed <DATE>, id <ID>, in review"
```
