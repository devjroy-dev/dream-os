#!/bin/bash
# scripts/lib/ptn_a2_1c_pg_proof.sh · CE-47 · PTN-A2-1c · 0219 ON REAL POSTGRES.
# Not a bench (scripts/lib is never collected by the floor) and never run on the founder's machine: it needs Postgres
# binaries and a scratch folder outside /root, and refuses (exit 3) without them. Its output is in the handover.
# The tables 0219 touches are cut from their own migrations' bytes, never retyped: capabilities (0149), partner_sends
# (0218); partner_orgs and collab_posts are stand-ins with an id. The roles anon, authenticated and service_role are
# made here as Supabase has them (service_role with BYPASSRLS, as on Supabase). Cells:
#   1 0219 applies, and a second run is harmless;  2 RLS on, the four grants to service_role;
#   3 the two columns on partner_orgs, and the three template rows born 'pending', auto_on false;
#   4 a log line refuses UPDATE; a deleted send takes its lines with it;
#   5 partner_send_revive is refused to anon and authenticated, open to service_role;
#   6 TWO PRESSES AT ONCE through partner_send_revive: one queued row, ONE log line, the other press gets nothing;
#   7 a row that is not failed: the function moves nothing and writes no line.
set -u
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
[ -n "$PGBIN" ] && [ -x "$PGBIN/initdb" ] || { echo "ptn_a2_1c_pg_proof: REFUSED, no Postgres binaries here"; exit 3; }
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
W=${PG_PROOF_DIR:-/var/tmp/pg_proof_a21c}; rm -rf "$W"; mkdir -p "$W" || { echo "ptn_a2_1c_pg_proof: REFUSED, no scratch folder"; exit 3; }
PORT=55433; RUNAS=""; [ "$(id -u)" = 0 ] && { id postgres >/dev/null 2>&1 || { echo "REFUSED: root and no postgres user"; exit 3; }; chown -R postgres "$W"; RUNAS="runuser -u postgres --"; }
$RUNAS "$PGBIN/initdb" -D "$W/data" -A trust -U postgres >/dev/null || exit 3
$RUNAS "$PGBIN/pg_ctl" -D "$W/data" -o "-p $PORT -k $W" -l "$W/log" -w start >/dev/null || exit 3
trap '$RUNAS "$PGBIN/pg_ctl" -D "$W/data" -m fast -w stop >/dev/null 2>&1' EXIT
P() { $RUNAS psql -h "$W" -p $PORT -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
Q() { P -t -A -c "$1" 2>&1; }
pass=0; fail=0; cell() { if [ "$2" = "yes" ]; then pass=$((pass+1)); echo "  PASS  $1"; else fail=$((fail+1)); echo "  FAIL  $1  [$3]"; fi; }
CAPS=$(awk 'tolower($0) ~ /^create table if not exists public.capabilities/{f=1} f{print} f&&/^\);/{exit}' "$ROOT/db/migrations/0149_capabilities.sql")
SENDS=$(awk '/^CREATE TABLE IF NOT EXISTS public.partner_sends \(/{f=1} f{print} f&&/^\);/{exit}' "$ROOT/db/migrations/0218_partner_calls.sql")
[ -n "$CAPS" ] && [ -n "$SENDS" ] || { echo "REFUSED: a source table was not found in its migration"; exit 3; }
P -c "CREATE ROLE anon NOLOGIN; CREATE ROLE authenticated NOLOGIN; CREATE ROLE service_role NOLOGIN BYPASSRLS; CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE TABLE public.partner_orgs (id uuid PRIMARY KEY); CREATE TABLE public.collab_posts (id uuid PRIMARY KEY);" || exit 1
printf '%s\n' "$CAPS" | P -f - || exit 1
printf '%s\n' "$SENDS" | P -f - || exit 1
P -c "GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role; GRANT ALL ON public.partner_sends, public.partner_orgs, public.capabilities TO service_role;" || exit 1

M="$ROOT/db/migrations/0219_partner_send_log.sql"   # fed on stdin: the postgres user cannot read the tree
R1=$(P -f - < "$M" 2>&1; echo "rc=$?"); R2=$(P -f - < "$M" 2>&1; echo "rc=$?")
cell "1 0219 applies, and a second run is harmless" "$([ "${R1##*rc=}" = 0 ] && [ "${R2##*rc=}" = 0 ] && echo yes)" "$R1 | $R2"
RLS=$(Q "SELECT relrowsecurity FROM pg_class WHERE relname = 'partner_send_log'")
G=$(Q "SELECT count(*) FROM information_schema.role_table_grants WHERE table_name = 'partner_send_log' AND grantee = 'service_role' AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE')")
cell "2 RLS on, service_role holds SELECT, INSERT, UPDATE, DELETE" "$([ "$RLS" = t ] && [ "$G" = 4 ] && echo yes)" "rls=$RLS grants=$G"
C=$(Q "SELECT count(*) FROM information_schema.columns WHERE table_name = 'partner_orgs' AND column_name IN ('whatsapp_opt_at','whatsapp_opt_words')")
T=$(Q "SELECT string_agg(key || ':' || status || ':' || auto_on, ' ' ORDER BY key) FROM public.capabilities WHERE key LIKE 'template.tdw_%'")
cell "3 two columns on partner_orgs; three template rows pending, auto_on false" "$([ "$C" = 2 ] && [ "$T" = 'template.tdw_collab_request_sent:pending:false template.tdw_partner_call:pending:false template.tdw_partner_picked:pending:false' ] && echo yes)" "cols=$C rows=$T"
mk() { Q "INSERT INTO partner_orgs VALUES (gen_random_uuid()) ON CONFLICT DO NOTHING; INSERT INTO collab_posts VALUES (gen_random_uuid());
  INSERT INTO partner_sends (partner_id, post_id, state, attempts, why, token_hash) SELECT (SELECT id FROM partner_orgs LIMIT 1), (SELECT id FROM collab_posts ORDER BY ctid DESC LIMIT 1), '$1', 3,
  'resend 403: The domain is not verified.', encode(gen_random_bytes(32), 'hex') RETURNING id" | grep -E '^[0-9a-f-]{36}$'; }
S1=$(mk sent)
Q "INSERT INTO partner_send_log (send_id, kind, state, channel, attempts, why) VALUES ('$S1', 'drain', 'sent', 'email', 1, NULL)" >/dev/null
U=$(Q "UPDATE partner_send_log SET why = 'changed' WHERE send_id = '$S1'")
Q "DELETE FROM partner_sends WHERE id = '$S1'" >/dev/null; LEFT=$(Q "SELECT count(*) FROM partner_send_log WHERE send_id = '$S1'")
cell "4 a log line refuses UPDATE; a deleted send takes its lines" "$(echo "$U" | grep -q 'append-only' && [ "$LEFT" = 0 ] && echo yes)" "update=$U left=$LEFT"
S2=$(mk failed)
A1=$(P -t -A -c "SET ROLE anon; SELECT public.partner_send_revive('$S2', 'x', 'y');" 2>&1); A2=$(P -t -A -c "SET ROLE authenticated; SELECT public.partner_send_revive('$S2', 'x', 'y');" 2>&1)
ST=$(Q "SELECT state FROM partner_sends WHERE id = '$S2'")
cell "5 the revive is refused to anon and authenticated (nothing moved)" "$(echo "$A1" | grep -q 'permission denied' && echo "$A2" | grep -q 'permission denied' && [ "$ST" = failed ] && echo yes)" "$A1 | $A2 | $ST"
CALL="SET ROLE service_role; SELECT public.partner_send_revive('$S2', '%s', 'Tried again by %s');"
( P -t -A -c "BEGIN; $(printf "$CALL" A A) SELECT pg_sleep(2); COMMIT;" > "$W/a.out" 2>&1 ) &
sleep 0.5
T0=$(date +%s%N); P -t -A -c "$(printf "$CALL" B B)" > "$W/b.out" 2>&1; T1=$(date +%s%N); WAITED=$(( (T1 - T0) / 1000000 )); wait
GA=$(grep -c "^$S2$" "$W/a.out"); GB=$(grep -c "^$S2$" "$W/b.out")
ROW=$(Q "SELECT state || ' ' || attempts FROM partner_sends WHERE id = '$S2'"); LINES=$(Q "SELECT count(*) || ' ' || string_agg(kind || '/' || by_whom || '/' || why, ';') FROM partner_send_log WHERE send_id = '$S2'")
echo "  session A got '$S2' $GA time(s); session B got it $GB time(s) after waiting $WAITED ms; row: $ROW; log: $LINES"
cell "6 two presses at once: one queued row, ONE log line, the other press nothing" "$([ "$GA" = 1 ] && [ "$GB" = 0 ] && [ "$WAITED" -ge 1000 ] && [ "$ROW" = 'queued 0' ] && [ "$LINES" = '1 retried/A/Tried again by A' ] && echo yes)" "A=$GA B=$GB waited=$WAITED row=$ROW log=$LINES"
S3=$(mk queued)
N=$(P -t -A -c "SET ROLE service_role; SELECT count(*) FROM (SELECT public.partner_send_revive('$S3', 'C', 'n')) x WHERE x.partner_send_revive IS NOT NULL;" 2>&1 | tail -1)
L3=$(Q "SELECT count(*) FROM partner_send_log WHERE send_id = '$S3'"); ST3=$(Q "SELECT state FROM partner_sends WHERE id = '$S3'")
cell "7 a row that is not failed: nothing moves, no line" "$([ "$N" = 0 ] && [ "$L3" = 0 ] && [ "$ST3" = queued ] && echo yes)" "n=$N lines=$L3 state=$ST3"
echo; echo "ptn_a2_1c_pg_proof: $pass passed, $fail failed"; [ "$fail" = 0 ]
