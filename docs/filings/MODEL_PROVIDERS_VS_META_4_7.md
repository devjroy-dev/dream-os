# FILING B4·4 — THE MODEL PROVIDERS, AGAINST META §4.7(b) AND §4.1(b)

**Base:** dream-os `534059f87527f6b0a3fd8c05167eed3042a2da16`
**Seat:** CE-41 LE-B · read 2026-09-08 · opened by the chair ahead of the Hosting Terms
**Held in clone; the freeze holds.**

**The test, from the 2026-09-23 Meta Terms §4.7(b):** TDW *"may not directly or indirectly allow
WhatsApp Business Platform Data, including any anonymous, aggregate, or derived forms … to be
used to create, develop, train, or improve any … AI Models."* Survives termination.
**And §4.1(b):** no distribution of that data to any third party, the only named exception being
a Solution Provider.

**A DECLARED CONFLICT OF INTEREST.** This seat is Claude, made by Anthropic, and one of the two
providers under review is Anthropic. Both are derived at each provider's own published pages,
by the same standard, and every third-party source is marked as such. Where the evidence
favours Anthropic it is because the published commitment exists and is quoted; where DeepSeek's
position is unclear it is recorded as **unclear**, not as adverse. **Nothing here is concluded.**

---

## 1 · ANTHROPIC

**Trains on API inputs by default: NO.** Anthropic's own support article, *Is my data used for
model training?* (`support.anthropic.com/en/articles/7996868`, read 2026-09-08):

> *By default, we will not use your inputs or outputs from our commercial products (e.g. Claude
> for Work, Anthropic API, Claude Gov, etc.) to train our models.*

**The exceptions are both opt-in and both matter to TDW:**
- **Explicit feedback.** *"If you explicitly report feedback or bugs to us (e.g. via our thumbs
  up/down feedback button) … then we may use your chats and coding sessions to train our
  models."* → **TDW must not ship any feedback mechanism that returns message content to
  Anthropic.** A thumbs-up on a Victor draft would hand Platform Data to training with TDW's own
  hand.
- **Development Partner Program.** Org-admin opt-in, first-party API only. **Must stay off.**

**Retention window: 30 days by default** for commercial users (Anthropic's Claude Code data-usage
page, `docs.anthropic.com/en/docs/claude-code/data-usage`, read 2026-09-08 — *"Commercial users
(Team, Enterprise, and API): Standard: 30-day retention period"*).

**Zero data retention: available, but gated and caveated.** From
`support.anthropic.com/en/articles/8956058` (read 2026-09-08):
- *"Some enterprise API customers, **subject to Anthropic approval**, may have arrangements
  under which Anthropic does not store their inputs or outputs except where needed to comply
  with law or combat misuse."* Safety-classifier results are still retained.
- Applies to the Anthropic API and products using the commercial org API key. **Not** to
  Workbench, beta products, or Claude for Work.

**THE CAVEAT THAT LANDS DIRECTLY ON TDW'S ARCHITECTURE — read this twice:**

> *if you choose to allow **explicit prompt caching**, certain batch API calls … or the Files
> API, those API instructions **may override the zero data retention controls**.*

**Victor runs on a cached static prefix.** So if TDW obtains ZDR, **prompt caching may override
it** for exactly the calls TDW makes most. This is not a reason to avoid ZDR; it is a specific
question to put to Anthropic before assuming ZDR covers Victor's traffic.

**Position against §4.7(b):** an affirmative published no-training commitment covering the
API by default, with two opt-in exceptions TDW controls and must keep off.

---

## 2 · DEEPSEEK

**Trains on API inputs by default: NOT ESTABLISHED — and the absence is the finding.**

This seat could not locate a DeepSeek statement that unambiguously excludes API inputs from
training in the way Anthropic's does. What was found, at DeepSeek's own pages:

- **DeepSeek Privacy Policy** (`cdn.deepseek.com/policies/en-US/deepseek-privacy-policy.html`,
  read 2026-09-08) names, among the purposes for which group entities process personal data:
  storage, content delivery, security, research and development, **foundation model training and
  optimization**, analytics, customer and technical support.
- **The same policy carves out the API case without resolving it:** *"the processing rules for
  Personal Data collected from end users when accessing downstream systems or applications
  developed by developers using our open platform services are **not covered by this privacy
  policy**. The developer … as the controller … should disclose the relevant Personal Data
  protection policies to the end users."*
- **Open Platform Terms of Service**
  (`cdn.deepseek.com/policies/en-US/deepseek-open-platform-terms-of-service.html`, read
  2026-09-08) address ownership of Inputs and Outputs and grant the developer broad rights over
  them — including using outputs to train other models — but **the excerpt reached by this seat
  states no position on DeepSeek's own use of Inputs for training.**

**So: the consumer policy names model training as a purpose; the Open Platform terms carve
developer traffic out of that policy; and no affirmative no-training commitment for API inputs
was found.** Third-party sources fetched today **conflict** — one app's privacy page asserts
*"Per DeepSeek's API terms, API inputs are not used for model training"*; another states
DeepSeek trains on conversations by default. **Neither is DeepSeek's own word and neither is
relied on here.**

**Retention window: not established.** No published deletion timeline was found; a third-party
reading describes data kept *"as long as necessary"*. **Unverified.**

**Zero data retention / no-training tier: none found.**

**Data residency: contested in the sources** — one describes servers in China, another primary
infrastructure in the US with Singapore and Germany. **Not derived. Flagged because it is a
second question** on top of training, and because Cloud API Exhibit B shows Meta itself
disclosing its sub-processor geography while TDW's is undocumented.

---

## 2b · Z.ai / GLM (F-41.34) — the chair's read, recorded

**Read by the chair**, not by this seat, at `docs.z.ai/legal-agreement/privacy-policy` (last
update 2025-09-29) and its Data Processing Addendum for API Services, on 2026-09-08:

- **§1(a)** — processor only, acting on customer instructions.
- **§4(b)** — content **not stored**; processed in real time.
- **§3** — Singapore.

**The endpoint is confirmed by command:** `src/lib/llm.js:23` calls
`https://api.z.ai/api/anthropic` — the entity that DPA binds.

**But see B4·5.** The only lane routed to GLM is harvest, and harvest's single call site is a
**PWA** door. **No WhatsApp Platform Data reaches GLM on the current derivation**, so this
posture — good as it is — is not load-bearing for Meta §4.7(b). It matters for the estate's own
data hygiene, not for this clause.

## 3 · WHAT THIS MEANS FOR §4.7(b) — stated as a test, not a conclusion

§4.7(b) forbids TDW from **allowing** Platform Data to be used to train or improve any AI model.
The compliance question is therefore not *does the provider train?* but **can TDW show that it
does not permit training?**

- For **Anthropic**, there is a published commitment to point at, plus two opt-in doors TDW must
  keep shut.
- For **DeepSeek**, this seat found **no commitment to point at**. Under a clause that turns on
  what TDW *allows*, **an absence of a commitment is not the same as an absence of risk** — and
  §4.7(b) survives termination, so the exposure does not end when a contract does.

**That asymmetry is the whole of this file's contribution.** It is not a finding that DeepSeek
trains on TDW's data. It is a finding that **the estate cannot presently demonstrate that it
does not**, which is what the clause requires.

**What Donna sends is a separate, unread question.** Donna is the internal operator agent on
DeepSeek, and harvest runs there. **Whether Donna's prompts contain WhatsApp Platform Data — the
content of vendor or couple messages — or only TDW's own platform records, this seat has not
read and will not assert.** That is F-41.22's arms reading, and it decides whether §4.7(b) bites
here at all.

---

## 4 · THE FOUNDER'S DECISIONS, NAMED NOT MADE

1. **Ask Anthropic** whether ZDR is available on TDW's tier, and specifically **whether explicit
   prompt caching overrides it** for Victor's cached prefix.
2. **Ask DeepSeek**, in writing, whether API inputs are used to train or improve their models,
   and what the retention window is. **A written answer is the artifact §4.7(b) needs**, and it
   costs one email.
3. **Read the arms** (F-41.22) before either answer is acted on — if Donna never sees Platform
   Data, question 2 changes character entirely.
4. **Keep both Anthropic opt-in doors shut**: no feedback mechanism returning message content,
   no Development Partner Program.

**Nothing here recommends a provider change.** That would be a conclusion, and the chair ruled
derive, not conclude.

---

## 5 · RECORD LINE

```
B4·4 · model providers vs Meta §4.7(b)/§4.1(b) · read 2026-09-08
ANTHROPIC  trains on API inputs by default: NO (own support article 7996868)
           exceptions: explicit feedback; Development Partner Program — both opt-in, keep off
           retention: 30 days default (commercial)
           ZDR: yes, enterprise API, subject to approval
           ⚠ prompt caching MAY OVERRIDE ZDR — Victor uses a cached prefix. ASK.
DEEPSEEK   trains on API inputs by default: NOT ESTABLISHED
           own privacy policy names "foundation model training and optimization" as a purpose;
           open-platform developer traffic carved OUT of that policy without resolution;
           no affirmative no-training commitment found for API inputs
           retention: not established · ZDR: none found · residency: contested, not derived
OWED: written answers from both providers · F-41.22's arms reading · Meta Hosting Terms
DECLARED: this seat is made by Anthropic; both providers derived at their own pages,
          same standard, third-party sources marked and not relied on
```
