#!/usr/bin/env python3
"""
PATCH 1 — 8.3 Fix 3 — Bride onboarding Discover line.

Appends a paragraph to LOCKED.complete in src/agent/brideOnboarding.js
nudging the bride to thedreamwedding.in.

Spec: TDW_MASTER_STRATEGY.md section 8.3 Fix 3.
Founder copy locked. Currency Rs (no ₹).

Validation:
  - Run `node --check src/agent/brideOnboarding.js` after applying.
  - Run this script — exits 0 on success, non-zero on any unexpected state.
"""

import sys
from pathlib import Path

FILE = Path("src/agent/brideOnboarding.js")

OLD = (
    "  complete: (name) =>\n"
    "    `So ${name || 'there'}, you're all set. I'm not just here to remind you of things, "
    "I'm here to help you decide whatever you need to for the wedding. Starting from your outfit "
    "to what songs to play for your special dance performance (I really hope you are doing one)."
    "\\n\\nLet's start with you telling me what all vendors you've already booked, or do you want "
    "to do that later?`"
)

NEW = (
    "  complete: (name) =>\n"
    "    `So ${name || 'there'}, you're all set. I'm not just here to remind you of things, "
    "I'm here to help you decide whatever you need to for the wedding. Starting from your outfit "
    "to what songs to play for your special dance performance (I really hope you are doing one)."
    "\\n\\nAnd to have the best possible experience at the TDW, check out thedreamwedding.in. "
    "It's already waiting for you to sign in."
    "\\n\\nLet's start with you telling me what all vendors you've already booked, or do you want "
    "to do that later?`"
)

def main() -> int:
    if not FILE.exists():
        print(f"ERROR: {FILE} not found. Run from dream-os repo root.", file=sys.stderr)
        return 1

    text = FILE.read_text()

    if NEW.strip() in text:
        print("ALREADY APPLIED — new string already present. Nothing to do.")
        return 0

    occurrences = text.count(OLD)
    if occurrences == 0:
        print("ERROR: Could not find target string. File may have drifted from expected state.", file=sys.stderr)
        return 2
    if occurrences > 1:
        print(f"ERROR: Found {occurrences} matches; expected exactly 1. Aborting.", file=sys.stderr)
        return 3

    new_text = text.replace(OLD, NEW, 1)
    FILE.write_text(new_text)
    print(f"OK — patched {FILE}.")
    print("Next: node --check src/agent/brideOnboarding.js")
    return 0

if __name__ == "__main__":
    sys.exit(main())
