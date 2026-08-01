# QA RIG — OpenWA staging harness (D-4)

> ## ⛔ NEVER A PRODUCTION NUMBER. NEVER A PRODUCTION CODE PATH.
>
> This rig exists so bench-driven scenarios can be walked against a WhatsApp
> session **that is not the estate's.** Three rules, and they are not negotiable:
>
> 1. **The SIM in this rig is a burner.** Never the vendor line, never the bride
>    line, never the marketing line, never the OTP line. If a number in this file
>    ever matches one in Railway's environment, the rig is misconfigured and must
>    be stopped before it is used.
> 2. **Zero production code touches OpenWA.** Nothing under `src/` imports it,
>    references it, or branches on it. The estate's one outbound path is `sendWa`
>    against Meta Cloud API (spec §3), and this rig does not add a second. It
>    drives the estate from *outside*, the way a person with a phone does.
> 3. **This document is the whole artifact.** D-4 is docs-only. If a future
>    sitting finds itself editing `src/` to make this rig work, that is a STOP and
>    a report, never an edit.

---

## What this is for

The estate's benches prove wiring, bytes and absences. They cannot prove that a
message *arrives*, that a template renders as approved, or that a two-turn
exchange holds its thread — those are transport truths, and until now the only
witness for them has been the founder's own phone. That makes every conversational
regression a thing we discover by walking, one lane at a time, by hand.

This rig gives those truths a second witness that is not the founder's thumb. It
does **not** replace the walk: a rig can prove a template rendered; only a person
can say whether the sentence sounded like Victor.

---

## Shape

```
┌─────────────┐    webhook     ┌──────────────────┐    HTTP     ┌───────────┐
│  burner SIM │ ─────────────► │  staging dream-os│ ──────────► │  Supabase │
│  (OpenWA)   │ ◄───────────── │  (Railway PR env)│ ◄────────── │  (staging)│
└─────────────┘   sendWa/Meta  └──────────────────┘             └───────────┘
       ▲
       │ MCP
┌──────┴───────┐
│ bench driver │  golden scenarios: send a line, await a reply, assert the shape
└──────────────┘
```

**The SIM is a real WhatsApp account on a burner number.** OpenWA drives a
browser session against it. The rig sends *inbound* messages the way a vendor
would, and reads what the staging estate sends back.

---

## docker-compose

```yaml
# docker-compose.qa.yml — STAGING ONLY. Never deployed, never in the app image.
services:
  openwa:
    image: openwa/wa-automate:latest
    container_name: tdw-qa-openwa
    restart: unless-stopped
    environment:
      # The burner's own number, E.164, no plus. Set in .env.qa, never committed.
      - QA_SIM_NUMBER=${QA_SIM_NUMBER:?refusing to start without an explicit burner number}
    volumes:
      - ./.qa-session:/session      # the auth session; gitignored, never shared
    ports:
      - "127.0.0.1:8002:8002"       # LOOPBACK ONLY — the rig is never reachable off-host
    command: >
      --session-data-path /session
      --api-host 0.0.0.0
      --port 8002
```

`.qa-session/` and `.env.qa` go in `.gitignore`. A committed session file is a
live WhatsApp login in a public repository.

---

## Session setup

1. `docker compose -f docker-compose.qa.yml up`
2. Scan the QR from the burner handset. Once.
3. `curl -s localhost:8002/getConnectionState` → expect `CONNECTED`.
4. Record the burner number in `.env.qa`. **Read it back and compare it against
   Railway's `VENDOR_PHONE_NUMBER_ID`, `BRIDE_PHONE_NUMBER_ID` and
   `MARKETING_WHATSAPP_NUMBER` before the first send.** If any matches, stop.

Sessions expire. A rig that has quietly logged out will fail every scenario in
the same way a broken estate would, so **step 3 is a precondition of every run,
not a setup step** — an unchecked session turns a green suite into a false red
and a red suite into an unread one.

---

## Webhook → staging

Point the staging service's inbound at the rig, never the reverse:

```
QA_INBOUND_URL=https://<staging-service>.up.railway.app/api/v2/wa/inbound
```

The rig POSTs a Meta-shaped inbound envelope so the staging estate cannot tell
the rig from the real transport. **That is the point** — a harness that takes a
special code path proves the special code path.

---

## MCP config

```json
{
  "mcpServers": {
    "tdw-qa-openwa": {
      "command": "node",
      "args": ["scripts/qa/openwa-mcp.mjs"],
      "env": {
        "OPENWA_URL": "http://127.0.0.1:8002",
        "QA_STAGING_BASE": "https://<staging-service>.up.railway.app"
      }
    }
  }
}
```

The driver is **not written by this sitting** — D-4 is docs-only, and a script
committed here would be production code touching OpenWA in everything but name.
The shape it must satisfy is specified below so the sitting that writes it has a
contract rather than an invitation.

---

## Golden scenarios

Each is: an inbound line, an expected reply *shape*, and a named thing it proves.
Shapes, never bytes — asserting exact copy here would fork the founder's veto into
a second home and freeze strings that only he may freeze.

| # | Inbound | Expects | Proves |
|---|---|---|---|
| G-1 | `hi` from an unknown number | the vendor onboarding opener | cold inbound reaches the vendor lane |
| G-2 | `hi` from a known vendor | Victor's returning greeting, no re-onboard | identity resolution across turns |
| G-3 | a portfolio photo | an acknowledgement naming what arrived | media inbound survives the transport |
| G-4 | `TDW-<routing_handle>` | the enquiry thread opening on the right vendor | the routing token resolves — **the F-07.58 family's transport half** |
| G-5 | a two-turn exchange | the second reply holding the first's context | the thread does not reset between turns |
| G-6 | a line to a *paused* vendor's handle | no send at all | the pause is honoured at the transport edge |

**G-4 is the one worth the rig on its own.** The estate can prove by bench that
the link is built from `routing_handle`. Only something holding a phone can prove
that tapping it lands on the right vendor.

---

## What this rig cannot prove

Stated so nobody reads a green suite wider than it is:

- **Not that the copy is right.** It asserts shapes. Whether Victor sounds like
  Victor is the founder's ear and the copy veto's business.
- **Not delivery to a real vendor.** A burner receiving a message proves the
  estate sent one; it says nothing about a template's delivery pacing to a real
  handset (F-05.19's territory).
- **Not production.** Staging has staging data. A scenario green here and red on
  the founder's phone means the difference is in the data or the environment, and
  the rig has done its job by narrowing the question.
- **Not template approval.** Meta approves templates against the production WABA;
  this rig runs somewhere else by design.

---

## Standing rules

- Run it against staging. If the target base is ever a production URL, stop.
- Re-verify the connection state before every suite. See the setup note above.
- The burner is a burner. It never enters `demo_vendors`, `vendors`, or `users`
  on a production plane.
- If a scenario needs a production number to be meaningful, **that scenario does
  not belong in this rig** — it belongs on the founder's walk card, named as a
  step only his device can witness.
