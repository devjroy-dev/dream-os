# CE-42 · SEAT D2 · D5c (dream-os) — a vendor is not a couple

**Cut at** `7615cf3624fb5e9f5163c6ff5bbc140aca609ec7` — re-pinned twice from `f3e9ff0`, first past the Victor micro (F-42.21/.22) and then past 4a packet 3a. No migration. `b20_a2` **193/193** (base 184, which is what 3a's own handover reads at this tip).

**Re-pin, derived not assumed.** All four manifest paths are blob-identical across every tip in the chain, and so are the five files this bench reads that are **not** in the manifest — `src/api/couple/core.js` (the mount F-42.55's cell asserts), `src/lib/coupleIdentity.js`, `src/api/public/enquiry.js`, and migrations `0148` and `0151`.

**⚠ THE MOUNT LINE 3a MOVED IS `src/api/vendor/core.js`, NOT `src/api/couple/core.js`.** Two files, one basename, different lanes — and the relay that reached this seat named only "core.js". The couple router is untouched, which is the one that matters here: F-42.55's cell asserts the public door sits under `requireCoupleAuth` by reading that file. Derived, because a basename is not an address.

**What shipped:** F-42.73. A number already bound to a vendor is refused at the couple intake with its own code — *"This number belongs to a vendor (@DEV440). A vendor cannot file a couple's request."* — the handle read from the row, never typed. It refuses **before** the write, so no request and no items. `409` on both create doors: a conflict with a record that exists, not a malformed body, and distinguishable from R-42.7's blank-city `400` on the same door — which is exactly what the founder's console could not tell apart.

**Why it is asked and not inferred:** `ensureCoupleRow` already refuses this and the catch could have matched on its message, but a refusal built by string-matching another module's error text goes silent the day that text is reworded. `vendorForPhone` is the estate's own question and it answers with the row, which is where the handle comes from. It runs only when `findCoupleIdByLastTen` has already come back empty, so it costs one query on the path that was about to write anyway and none on the common path.

**`COUPLE_FAILED` keeps its sentence** and is now what it always claimed to be — a transient failure worth retrying. The one case that could never be retried has its own code and its own words. The founder pressed *File* three times against *"try again"*; both halves of that sentence were false.

**One sealed cell amended by label:** §7d pinned the create door's status ternary as the spelling `? 500 : 400`, and F-42.73 makes it three-way without touching the meaning. It now reads the door's own expression and asserts its **final** alternative, so a fourth branch tomorrow leaves it green and a changed default reds it. **Not proven:** the full floor — it exceeds the seat container's wall, so the floor line rides the verify block (R-38.19); dirt declared at `scripts/floor-manifest-ce42-d5c.txt`.
