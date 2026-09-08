# FILING B4·5a — THE `donna_provider` ENGINE-TOOL ROW, AND A CORRECTION TO B4·5

**Derived at origin `fad5e68cbd4fd5e3dedbfb7d980b256b66b714fb`** by command, 2026-09-08.
**Seat:** CE-41 LE-B · due before R-41.66's bell, 2026-09-09 ~18:50 IST.
**Held in clone; the freeze holds — seat A cuts next on dream-os.**

---

## 1 · THE CORRECTION, FIRST — B4·5 §5 IS WRONG

**B4·5 §5 said:** the WhatsApp vendor lane has no `model.wa_vendor.*` entry, is therefore
"UNCONSTRAINED" per `modelRouter.js:92`, and is governed by the `LLM_PROVIDER` environment
variable.

**That is wrong. The WhatsApp vendor lane routes through `pwa_vendor`.**

Derived, three lines:

```
src/lib/vendorInbound.js:1668
    const llmWiring = await buildLlmForTurn({ supabase, vendor, agentId });

src/api/vendor-engine/chat.js:2801   (the function's own comment)
    "The PWA door passes { supabase, vendor, agentId }; the WA lane (index.js)
     passes the same shape."

src/api/vendor-engine/chat.js:2809
    const route = await resolveModel(supabase, 'pwa_vendor', routeTier);
```

`vendorInbound.js` is the Meta Cloud API inbound path — the WhatsApp vendor lane. It calls the
**same** `buildLlmForTurn`, which resolves on surface **`pwa_vendor`**, unconditionally. There is
no `wa_vendor` surface because **the WhatsApp vendor lane does not have its own route; it borrows
the PWA one.**

**How the error happened, named so it is not repeated.** B4·5 reasoned from the route table
outward — *there is no `wa_vendor` key, therefore that surface is unrouted*. The absent key was
read as an absent route. It was actually an absent *second* route: one table serves two surfaces.
**A missing entry in a lookup table is not evidence that nothing looks it up.** The cure was to
follow the caller, not the table, and I should have done that first.

**Consequence — and it is the opposite of what B4·5 implied.** The founder's reading that
`LLM_PROVIDER` and `BRIDE_LLM_PROVIDER` are **unset** does *not* leave the WhatsApp vendor lane
on an anthropic default by accident. It leaves it on **whatever the `model.pwa_vendor.*` seed
rows say** — which are set, and which the chair has relayed.

---

## 2 · THE ROW

**`donna_provider` = `deepseek` on the four `pwa_vendor` tiers** (chair's relay of the seed
rows). Wiring, `chat.js:2814-2826`:

```
if (route.donna_provider && route.donna_provider !== route.provider) {
  if (route.donna_provider === 'anthropic') { …no donna transport… }
  else {
    donnaWiring.donnaTransport = {
      provider: route.donna_provider,
      stream: (p) => llmStream(route.donna_provider, p),
      create: (p) => llmCreate(route.donna_provider, p),
    };
    donnaWiring.donnaModelOverride = route.donna_model;
  }
}
```

Carried into the engine at `chat.js:3125-3126` and `:3220`, consumed at
`src/engine/src/core/loop.ts:164-165`, and selected per segment at `loop.ts:728`:

```
const donnaTransportForSeg = args.donnaTransport ?? (providerDowngrade ? undefined : (transport ?? undefined));
```

| Lane | Surface key | Victor's hand | **Donna's hand** | Carries WhatsApp Platform Data? |
|---|---|---|---|---|
| PWA vendor chat | `pwa_vendor.<tier>` | seed: anthropic on `essential` | **DEEPSEEK** | NO — typed in TDW's web app |
| **WhatsApp vendor line** | **`pwa_vendor.<tier>`** (borrowed) | seed: anthropic on `essential` | **DEEPSEEK** | **YES — this is the Cloud API lane** |

**So DeepSeek sits on a limb of the lane that carries WhatsApp Platform Data.** Not the whole
turn — Victor's hand is anthropic under the seed — but Donna's segment rides `donnaTransport` to
`api.deepseek.com` on the same turn, from the same inbound WhatsApp message.

---

## 3 · THE LAST CELL — **DERIVED BY THE CHAIR, 2026-09-08. IT BITES.**

**Donna's DeepSeek segment does NOT receive the raw inbound WhatsApp body.** It receives
`msg` — Harvey's own plain-English instruction — plus her own prior session
(`src/engine/src/core/loop.ts:715-718`; `dearDonna.ts:18-21`). The instruction reads like
*"Log a new lead: Kabira Studios, product shoot, found us on Instagram…"*.

**But Harvey composes that instruction from the client's WhatsApp message** — her name, her
facts, what she asked for. **§4.7(b) names derived forms explicitly:** *"including any anonymous,
aggregate, or derived forms."*

**So the honest cell: on a WhatsApp turn, DeepSeek receives derived WhatsApp Platform Data
through Donna.** Not the raw body, and the distinction is real — but it is not the distinction
§4.7(b) draws.

**R-41.84 — THE ROWS STAY.** The founder holds DeepSeek on its current lanes pending a written
reply. **No Config row moved at the bell.** The cure sought is not a provider swap but the route
Meta wrote into its own text: **retain the AI Provider as a Third Party Service Provider under a
written no-other-purpose term** (WhatsApp Business Solution Terms, AI Providers bullet; Meta
Platform Terms §5.a.i). The DeepSeek email is the attempt to create that artefact.

**The rows below are therefore drafted and unfired.** They are what R-41.66 would have done and
what it will do if no written term arrives:

R-41.66's two rows, both Config-page edits, no code:

1. `model.wa_marketing.default` → `nudge_provider: anthropic`
2. `model.pwa_vendor.{essential,prestige,signature,trial}` → `donna_provider: anthropic`

**Cost:** Donna's segments move from DeepSeek-flash to Haiku **on both surfaces** — because
F-41.46 means the two surfaces cannot presently be routed apart. **Reversible for the PWA the day
F-41.46 lands, and reversible entirely the day DeepSeek writes back.**

### F-41.46 — the structural cause, chartered

The WhatsApp vendor lane has **no route of its own**; one table serves two surfaces, so the PWA
and WhatsApp **cannot be routed apart**. The cure is small and lives in dream-os: a
`model.wa_vendor.*` key resolved from `vendorInbound.js`, **falling back to `pwa_vendor` when
absent** so nothing changes until a row exists. Once it does, DeepSeek returns to the PWA surface
where no Platform Data flows, and only the WhatsApp limb stays on Haiku.

**This is why the §1 correction mattered.** Had the lane genuinely been unrouted and
env-governed, `LLM_PROVIDER` unset would have left it on anthropic and there would have been no
finding at all. The absent key was not an absent route — it was a shared one, and sharing is what
makes the fallback expensive.

## 3a · WHAT REMAINED UNDERIVED WHEN THIS SEAT FILED — kept for the record

**Whether Donna's segment prompt contains the vendor's message text.**

`loop.ts:728` selects the transport for a *segment*. What that segment's prompt is built from —
the inbound message, a tool result, a scratchpad, or the operator's own instruction — is inside
the engine's segment assembly, and **this seat has not read it and will not assert it.**

Two readings are possible and they give opposite answers:

- **If Donna's segment sees only tool results and platform records**, no Platform Data reaches
  DeepSeek and R-41.66's bell moves nothing on this lane.
- **If Donna's segment carries the turn's message content**, then WhatsApp Platform Data reaches
  a provider with no published no-training commitment, and R-41.66 bites here.

**This was the single load-bearing unknown when this seat filed; the chair closed it the same day**, and it is one function's
prompt assembly in `loop.ts`. It is a TypeScript engine file, it is on the tree, and it should be
read before 18:50 by whoever can spend the half hour — this seat included, if the chair wants it
before the incorporated documents.

**I am not guessing it.** B4·5 already carries one finding that came from reasoning about a
structure rather than following a caller, and §1 above is what that cost.

---

## 4 · THE OTHER SEED INVERSIONS — B4·5's table restated

The chair's relay against B4·5's code-derived table:

| Route | B4·5 said (code default) | Seed row (live) | Effect |
|---|---|---|---|
| `model.harvest.default` | **glm** | **deepseek** | **B4·5's "GLM lane" does not exist in production.** Harvest — PWA content, one call site — goes to DeepSeek. Still no Platform Data; the *provider* attribution was wrong. |
| `model.pwa_vendor.essential` | **deepseek** | **anthropic** | Victor's hand on both vendor surfaces is anthropic on that tier. Better than the code default implied. |
| `model.wa_marketing.default` nudge split | deepseek | deepseek | unchanged — still not derived whether the nudge prompt carries message content |
| `donna_provider`, four pwa tiers | (code shows per-route) | **deepseek** | §2 above |

**And so the chair's Z.ai/GLM read (F-41.34) may govern nothing.** If no seed row routes to
`glm`, `api.z.ai` receives no traffic at all. The read remains correct and worth having on file
— but it should not be recorded as covering a live lane until a `glm` route is confirmed live.

**`modelRouter.js:39` said this would happen.** Its own comment warns the seed row wins over the
code default. B4·5 quoted that warning and still shipped a code-derived table as the answer.
**The lesson is narrower than "read the database": a document that names its own unreliability
must not then be relied on.**

---

## 5 · RECORD LINE

```
B4·5a · donna_provider engine-tool row · derived at origin fad5e68, 2026-09-08
CORRECTION: B4·5 §5 wrong — the WhatsApp vendor lane routes through pwa_vendor
  (vendorInbound.js:1668 → buildLlmForTurn → chat.js:2809 resolveModel('pwa_vendor'))
  LLM_PROVIDER unset does NOT mean anthropic-by-default on that lane; the seed rows govern.
donna_provider = deepseek on four pwa tiers → DeepSeek rides a limb of the WhatsApp lane
  wiring: chat.js:2814-2826 → :3125/:3220 → loop.ts:164/728
NOT DERIVED, the last cell: whether Donna's segment prompt carries the message text.
  loop.ts segment assembly. Decides R-41.66 on this lane. ~30 minutes.
SEED INVERSIONS: harvest glm→deepseek (GLM lane may not exist live; F-41.34 may govern
  nothing) · pwa_vendor.essential deepseek→anthropic
```
