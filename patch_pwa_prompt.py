with open('src/agent/pwaSystemPrompt.js', 'r') as f:
    content = f.read()

# Find the static prompt constant and append the new tools section
old_ending = "module.exports = { PWA_STATIC_SYSTEM_PROMPT, buildPWADynamicContext };"

new_tools_note = """
// ── Block 1a tool addendum ────────────────────────────────────────────────────
// Appended to PWA_STATIC_SYSTEM_PROMPT to inform the model of new tools.
// Do not restructure the prompt — append only.

const PWA_BLOCK_1A_TOOLS = `

NEW TOOLS (Block 1a):
- update_lead: edit lead fields (name, date, budget, city, notes). Not for state changes.
- lose_lead: mark lead lost with a reason. Prefer this over update_lead_state when a reason is present.
- update_client: edit client fields (name, phone, email, notes).
- delete_client: soft-delete a client from the roster.
- update_invoice: edit invoice fields. Locked after any payment — suggest cancel + re-issue if locked.
- update_expense: edit expense amount, category, description, date.
- update_event: edit event title, date, time, kind, notes. Not for state changes.
- delete_event: soft-delete an event created in error. Different from cancelling.
- block_date: mark a date unavailable on the vendor calendar.
- unblock_date: remove a blocked date. Accepts block_id or date.
- list_availability: list all blocked dates.

Use these tools the same way as existing tools — call the tool, wait for success, then reply. Never confirm a mutation without the tool returning ok.`;

"""

content = content.replace(
    old_ending,
    new_tools_note + old_ending
)

# Also append to PWA_STATIC_SYSTEM_PROMPT export
content = content.replace(
    "module.exports = { PWA_STATIC_SYSTEM_PROMPT, buildPWADynamicContext };",
    "const PWA_FULL_STATIC_PROMPT = PWA_STATIC_SYSTEM_PROMPT + PWA_BLOCK_1A_TOOLS;\n\nmodule.exports = { PWA_STATIC_SYSTEM_PROMPT: PWA_FULL_STATIC_PROMPT, buildPWADynamicContext };"
)

with open('src/agent/pwaSystemPrompt.js', 'w') as f:
    f.write(content)

print('Patched: src/agent/pwaSystemPrompt.js')
