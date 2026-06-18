#!/usr/bin/env python3
# Piece 0.2 — dream-os — send-otp self-mints (dreamai-style easy account creation).
#
# THE PROBLEM:
#   send-otp (vendor AND couple) 404s "No account found ... check your invite"
#   when the phone has no users row. That invite-era gate lives INSIDE the OTP
#   layer, so open signup can't get a code for a new phone.
#
# THE FIX:
#   Replace the 404 block with a SELF-MINT: if no users row -> create it;
#   if no role row -> create it (onboarding_state:'new'); then send OTP.
#   Keep the WRONG-ROLE guard (a real other-role account still gets told).
#   One endpoint owns creation now: give a phone -> get a code.
#
#   /register becomes redundant (left dormant; the front-end stops calling it
#   in the paired dreamos-pwa Piece 0.2).
#
# Anchor-guarded + idempotent. SKIPs cleanly if an anchor isn't found.

import os, sys
ROOT = os.getcwd()

def expect():
    if not os.path.isdir(os.path.join(ROOT, "src", "api")):
        print("ERROR: run from dream-os repo root. Aborting."); sys.exit(1)

# The shared OLD gate, parameterised per role.
def old_block(role_table, other_role_label):
    return (
        "  const { data: userRow } = await supabase\n"
        "    .from('users').select('id').eq('phone', cleanPhone).maybeSingle();\n"
        "  if (!userRow) {\n"
        "    return res.status(404).json({\n"
        "      error:  'No account found for this number. Please check your invite.',\n"
        "      reason: 'phone_not_found',\n"
        "    });\n"
        "  }\n"
        "\n"
        f"  const {{ data: {role_table}Row }} = await supabase\n"
        f"    .from('{role_table}s').select('id').eq('user_id', userRow.id).maybeSingle();\n"
        f"  if (!{role_table}Row) {{\n"
        "    return res.status(403).json({\n"
        f"      error:  'This number is registered as a {other_role_label} account, not a {'Maker' if role_table=='vendor' else 'Dreamer'}.',\n"
        "      reason: 'wrong_role',\n"
        "    });\n"
        "  }\n"
    )

def new_block(role_table, other_table, other_role_label, role_word):
    # role_table: 'vendor'|'couple' ; table name is role_table+'s'
    table = role_table + "s"
    other = other_table  # 'couples' | 'vendors'
    return (
        "  // Open signup: self-mint the account if this phone is new.\n"
        "  let { data: userRow } = await supabase\n"
        "    .from('users').select('id, name').eq('phone', cleanPhone).maybeSingle();\n"
        "\n"
        "  if (userRow) {\n"
        "    // Existing user — guard against the OTHER role owning this phone.\n"
        f"    const {{ data: otherRow }} = await supabase\n"
        f"      .from('{other}').select('id').eq('user_id', userRow.id).maybeSingle();\n"
        f"    const {{ data: thisRow }} = await supabase\n"
        f"      .from('{table}').select('id').eq('user_id', userRow.id).maybeSingle();\n"
        "    if (otherRow && !thisRow) {\n"
        "      return res.status(403).json({\n"
        f"        error:  'This number is registered as a {other_role_label} account.',\n"
        "        reason: 'wrong_role',\n"
        "      });\n"
        "    }\n"
        "    if (!thisRow) {\n"
        f"      const {{ error: roleErr }} = await supabase.from('{table}')\n"
        "        .insert({ user_id: userRow.id, onboarding_state: 'new' });\n"
        "      if (roleErr) {\n"
        f"        console.error('[{role_table}:send-otp] {table} insert error:', roleErr.message);\n"
        "        return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
        "      }\n"
        "    }\n"
        "  } else {\n"
        "    // Fresh phone — create users + role row.\n"
        "    const { data: newUser, error: userErr } = await supabase\n"
        "      .from('users').insert({ phone: cleanPhone }).select('id').single();\n"
        "    if (userErr) {\n"
        f"      console.error('[{role_table}:send-otp] users insert error:', userErr.message);\n"
        "      return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
        "    }\n"
        "    userRow = newUser;\n"
        f"    const {{ error: roleErr }} = await supabase.from('{table}')\n"
        "      .insert({ user_id: userRow.id, onboarding_state: 'new' });\n"
        "    if (roleErr) {\n"
        "      await supabase.from('users').delete().eq('id', userRow.id);\n"
        f"      console.error('[{role_table}:send-otp] {table} insert error:', roleErr.message);\n"
        "      return res.status(500).json({ error: 'Something went wrong. Please try again.' });\n"
        "    }\n"
        "  }\n"
    )

def patch(path, role_table, other_table, other_role_label):
    full = os.path.join(ROOT, path)
    if not os.path.isfile(full):
        print(f"SKIP: {path} not found."); return
    with open(full, "r", encoding="utf-8") as f:
        src = f.read()
    nb = new_block(role_table, other_table, other_role_label, role_table)
    marker = "// Open signup: self-mint the account if this phone is new."
    if marker in src:
        print(f"SKIP: {path} already self-minting."); return
    ob = old_block(role_table, other_role_label)
    if ob not in src:
        print(f"SKIP: gate anchor not found in {path} — patch send-otp by hand (replace the 404 phone_not_found block with a self-mint).")
        return
    src = src.replace(ob, nb, 1)
    with open(full, "w", encoding="utf-8") as f:
        f.write(src)
    print(f"OK: {path} send-otp now self-mints ({role_table}).")

def main():
    expect()
    # vendor: other role is couples / "Dreamer"
    patch(os.path.join("src","api","vendor","auth.js"), "vendor", "couples", "Dreamer")
    # couple: other role is vendors / "Maker"
    patch(os.path.join("src","api","couple","auth.js"), "couple", "vendors", "Maker")
    print("\nPiece 0.2 (dream-os) written. send-otp owns account creation now; /register is dormant.")

if __name__ == "__main__":
    main()
