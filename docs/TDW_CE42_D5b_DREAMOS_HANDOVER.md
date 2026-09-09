# CE-42 · SEAT D2 · D5b (dream-os) — R-42.7, the intake door

**Cut at** `d6cd660dbaa18b678e673f53cbedd8e19f51d2c7` — re-pinned from `b3b5995` after 4a's door rider. No migration. `b20_a2` **184/184** (base 180, which is what the rider's own handover reads at this tip).

**Re-pin, derived not assumed:** both manifest blobs are byte-identical across `b3b5995` and `d6cd660`, and so are the three files D5's gate lives in that this bench reads. The rider moved `donna.ts`, `introduce.ts`, `vendorInbound.js`, `introductionSeat.js` and three benches — none of them here. The whole-file copy reverts nothing.

**What shipped:** one guard on `POST /api/v2/admin/assistance` — a request with no city is refused *"Add a city to file the request."* (400, `REFUSE.NO_CITY`), before the writer is called, so no row and no items are written. `.trim()`, the same spelling the forward gate reads by.

**Why a door byte at all, when the ruling said the form:** the queue's submit guard ships in the pwa half and is a courtesy that saves a round trip. It is not the rule. A guard that lives only in a form is one a curl walks past, and all five cityless rows on file — every one `origin=admin`, four forwarded and one open — came through this door.

**Both gates stand (chair's ruling (a)):** this one stops new blank rows; D5's forward-time gate stops the five that already exist from reaching an outsider with the template's `India` in place of a city. The two refusals are deliberately **different sentences** for different acts, and a bench cell reds if they ever collapse into one.

**Not proven:** the full floor — it exceeds the seat container's per-command wall, so the floor line rides the verify block (R-38.19); dirt declared at `scripts/floor-manifest-ce42-d5b.txt`. **Next:** `/plan` — the sheet extraction, `lib/auth/otpSignup.ts`, the layout branch, the sitemap.
