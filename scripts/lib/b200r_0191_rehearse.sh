#!/usr/bin/env bash
# scripts/lib/b200r_0191_rehearse.sh · CE-47 · WEB-4 · cut 7 · the rehearsal of 0191 on a THROWAWAY Postgres (never production).
# b160r's plant and b200r's (leads, conversations, capabilities as the schema gives them); 0191 as the non-superuser editor.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55459; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "cd /tmp && $*"; else bash -c "$*"; fi; }
QF() { printf '%s\n' "$1" > "$D/q.sql"; chmod 644 "$D/q.sql"; as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $D/q.sql" 2>&1; }
apply() { as_pg "cat '$1' | $PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -U $2 -d plant" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
out=$(apply "$ROOT/scripts/lib/b160r_0187_plant.sql" postgres); ok $? "b160r's plant" "$out"
out=$(apply "$ROOT/scripts/lib/b200r_0191_plant.sql" postgres); ok $? "b200r's plant (leads, conversations, capabilities)" "$out"
out=$(apply "$ROOT/db/migrations/0191_website_enquiry.sql" editor); ok $? "0191 applies as the editor, one transaction" "$out"
out=$(apply "$ROOT/db/migrations/0191_website_enquiry.sql" editor); [ $? != 0 ]; ok $? "0191 a second time refuses whole" "$out"
V="11111111-1111-1111-1111-111111111111"; S="SET ROLE service_role;"
r=$(QF "SELECT string_agg(key || '=' || status, ',' ORDER BY key) FROM public.capabilities;"); [ "$r" = "flag.website_chat=off,flag.website_eliza=off" ]; ok $? "the two switches are seeded off" "$r"
r=$(QF "$S INSERT INTO public.conversations (id, vendor_id, counterparty_phone, kind) VALUES ('22222222-2222-2222-2222-222222222222', '$V', '+919876543210', 'couple_thread'); INSERT INTO public.leads (vendor_id, phone, source, consent_at, consent_text_version) VALUES ('$V', '+919876543210', 'website', now(), 'enq-2026-09-30') RETURNING consent_text_version;"); [ "$r" = "enq-2026-09-30" ]; ok $? "a lead keeps its consent time and version" "$r"
r=$(QF "$S INSERT INTO public.leads (vendor_id, consent_text_version) VALUES ('$V', repeat('v', 33));"); echo "$r" | grep -q "check constraint"; ok $? "a version over 32 characters refuses" "$r"
r=$(QF "$S INSERT INTO public.website_chat_tokens (token_hash, vendor_id, phone, conversation_id, page_title) VALUES (repeat('a', 64), '$V', '+919876543210', '22222222-2222-2222-2222-222222222222', 'The Emerald Bride') RETURNING (expires_at - created_at = interval '24 hours');"); [ "$r" = "t" ]; ok $? "a token row: 24 hours by default" "$r"
r=$(QF "$S INSERT INTO public.website_chat_tokens (token_hash, vendor_id, phone, conversation_id) VALUES ('not-a-hash', '$V', '+919876543210', '22222222-2222-2222-2222-222222222222');"); echo "$r" | grep -q "check constraint"; ok $? "only a sha256 (64 hex) can be a token row's key" "$r"
r=$(QF "$S INSERT INTO public.website_chat_tokens (token_hash, vendor_id, phone, conversation_id) VALUES (repeat('b', 64), '$V', '9876543210', '22222222-2222-2222-2222-222222222222');"); echo "$r" | grep -q "check constraint"; ok $? "the phone must be +E.164" "$r"
r=$(QF "SET ROLE anon; SELECT count(*) FROM public.website_chat_tokens;"); echo "$r" | grep -q "permission denied"; ok $? "anon cannot read tokens" "$r"
r=$(QF "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.website_chat_tokens'::regclass;"); [ "$r" = "t" ]; ok $? "RLS on the token table" "$r"
echo; echo "b200r: $pass passed, $fail failed"; [ "$fail" = 0 ]
