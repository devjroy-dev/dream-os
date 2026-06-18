#!/usr/bin/env python3
# DEV-ONLY — env-gated OTP bypass so you can log in while WhatsApp OTP delivery
# is parked. Adds, just before the bcrypt OTP compare in verify-otp (vendor +
# couple): if process.env.DEV_OTP is set AND the submitted code === DEV_OTP,
# accept it without checking the real hash. Everything downstream (session mint,
# PIN, role lookup) runs exactly as normal.
#
# SAFETY:
#   * Completely inert unless DEV_OTP is set in the Railway env. Unset => no bypass.
#   * Set DEV_OTP to something only you know (e.g. a long random string). Then on
#     the OTP screen, type that value as the "code" for your number.
#   * Remove by deleting the DEV_OTP env var — no redeploy of code needed.
#   * To rip it out entirely later, delete the marked block.
#
# Anchor-guarded + idempotent.

import os, sys
ROOT = os.getcwd()

def expect():
    if not os.path.isdir(os.path.join(ROOT, "src", "api")):
        print("ERROR: run from dream-os repo root. Aborting."); sys.exit(1)

# Anchor: the line right before the real compare, present in both files.
ANCHOR = "  const valid = await bcrypt.compare(cleanOtp, otpRow.otp_hash);"

BYPASS = (
    "  // --- DEV BYPASS (env-gated; inert unless DEV_OTP is set) ---\n"
    "  if (process.env.DEV_OTP && cleanOtp === process.env.DEV_OTP) {\n"
    "    console.log(`[verify-otp] DEV_OTP bypass used phone=${cleanPhone}`);\n"
    "    await supabase.from('otp_sessions').delete().eq('phone', cleanPhone);\n"
    "  } else {\n"
    "  // --- end dev bypass ---\n"
)

# We wrap the existing compare+invalid+delete in the else; close the brace after
# the existing `await ... delete(...).eq('phone', cleanPhone);` that follows the
# invalid check. To keep it simple and safe, we instead inject a guarded compare:
# replace the compare line with: const valid = DEV ? true : await bcrypt.compare(...)

GUARDED_COMPARE = (
    "  const _devOk = !!(process.env.DEV_OTP && cleanOtp === process.env.DEV_OTP);\n"
    "  if (_devOk) console.log(`[verify-otp] DEV_OTP bypass used phone=${cleanPhone}`);\n"
    "  const valid = _devOk || await bcrypt.compare(cleanOtp, otpRow.otp_hash);"
)

def patch(path):
    full = os.path.join(ROOT, path)
    if not os.path.isfile(full):
        print(f"SKIP: {path} not found."); return
    with open(full, "r", encoding="utf-8") as f:
        src = f.read()
    if "_devOk" in src:
        print(f"SKIP: {path} already has the dev bypass."); return
    if src.count(ANCHOR) != 1:
        print(f"SKIP: compare anchor not uniquely found in {path} ({src.count(ANCHOR)} matches) — add by hand.")
        return
    src = src.replace(ANCHOR, GUARDED_COMPARE, 1)
    with open(full, "w", encoding="utf-8") as f:
        f.write(src)
    print(f"OK: {path} verify-otp now honours DEV_OTP (when env set).")

def main():
    expect()
    patch(os.path.join("src","api","vendor","auth.js"))
    patch(os.path.join("src","api","couple","auth.js"))
    print("\nDEV bypass written. Set DEV_OTP in Railway env to a private value, then type it as the code.")
    print("Leave DEV_OTP UNSET in any real/public environment — the bypass is inert without it.")

if __name__ == "__main__":
    main()
