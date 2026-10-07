#!/bin/bash
# scripts/lib/ptn_a2_1b_pg_proof.sh · CE-47 · PTN-A2-1b · THE REVIVE'S ONE GUARDED UPDATE, ON REAL POSTGRES.
# Not a bench (scripts/lib is never collected by the floor) and never run on the founder's machine: it needs Postgres
# binaries and a scratch folder, and it refuses (exit 3) without them. Run in the seat's container; its output is in the
# handover. partner_sends is created from 0218's own bytes (cut out of the migration file, not retyped), beside two stub
# tables for its foreign keys. Two sessions press "Try again" at once: session A holds its UPDATE open for two seconds,
# session B sends the SAME statement 0.5 s later, waits on A's row lock, re-reads the row after A commits, finds
# state <> 'failed', and updates nothing. The statement is the one queue.js sends through PostgREST:
#   UPDATE partner_sends SET state='queued', attempts=0, not_before=..., why=..., updated_at=... WHERE id=$1 AND state='failed' RETURNING id
set -u
PGBIN=$(ls -d /usr/lib/postgresql/*/bin 2>/dev/null | sort -V | tail -1)
[ -n "$PGBIN" ] && [ -x "$PGBIN/initdb" ] || { echo "ptn_a2_1b_pg_proof: REFUSED, no Postgres binaries here"; exit 3; }
ROOT=$(cd "$(dirname "$0")/../.." && pwd)
W=${PG_PROOF_DIR:-$HOME/pg_proof_a21b}; rm -rf "$W"; mkdir -p "$W" || { echo "ptn_a2_1b_pg_proof: REFUSED, no scratch folder"; exit 3; }
PORT=55432; RUNAS=""; [ "$(id -u)" = 0 ] && { id postgres >/dev/null 2>&1 || { echo "REFUSED: running as root and no postgres user"; exit 3; }; chown -R postgres "$W"; RUNAS="runuser -u postgres --"; }
$RUNAS "$PGBIN/initdb" -D "$W/data" -A trust -U postgres >/dev/null || exit 3
$RUNAS "$PGBIN/pg_ctl" -D "$W/data" -o "-p $PORT -k $W" -l "$W/log" -w start >/dev/null || exit 3
trap '$RUNAS "$PGBIN/pg_ctl" -D "$W/data" -m fast -w stop >/dev/null 2>&1' EXIT
P() { $RUNAS psql -h "$W" -p $PORT -U postgres -d postgres -X -q -v ON_ERROR_STOP=1 "$@"; }
TABLE=$(awk '/^CREATE TABLE IF NOT EXISTS public.partner_sends \(/{f=1} f{print} f&&/^\);/{exit}' "$ROOT/db/migrations/0218_partner_calls.sql")
[ -n "$TABLE" ] || { echo "REFUSED: partner_sends not found in 0218"; exit 3; }
P -c "CREATE EXTENSION IF NOT EXISTS pgcrypto; CREATE TABLE public.partner_orgs (id uuid PRIMARY KEY); CREATE TABLE public.collab_posts (id uuid PRIMARY KEY);" || exit 1
printf '%s\n' "$TABLE" | P -f - || exit 1
ID=$(P -t -A -c "INSERT INTO partner_orgs VALUES (gen_random_uuid()); INSERT INTO collab_posts VALUES (gen_random_uuid());
  INSERT INTO partner_sends (partner_id, post_id, state, attempts, why, token_hash) SELECT (SELECT id FROM partner_orgs), (SELECT id FROM collab_posts), 'failed', 3,
  'resend 403: The domain is not verified.', encode(gen_random_bytes(32), 'hex') RETURNING id;" | grep -E '^[0-9a-f-]{36}$')
STMT="UPDATE public.partner_sends SET state = 'queued', attempts = 0, not_before = now(), why = 'Tried again by %s', updated_at = now() WHERE id = '$ID' AND state = 'failed' RETURNING id;"
( P -t -A -c "BEGIN; $(printf "$STMT" A) SELECT pg_sleep(2); COMMIT;" > "$W/a.out" 2>&1 ) &
sleep 0.5
T0=$(date +%s%N); P -t -A -c "$(printf "$STMT" B)" > "$W/b.out" 2>&1; T1=$(date +%s%N); WAITED=$(( (T1 - T0) / 1000000 ))
wait
A=$(grep -c "^$ID$" "$W/a.out"); B=$(grep -c "^$ID$" "$W/b.out")
FINAL=$(P -t -A -c "SELECT state || ' ' || attempts || ' ' || why FROM partner_sends WHERE id = '$ID';")
echo "session A returned $A row(s); session B returned $B row(s) after waiting $WAITED ms on A's lock; the row now: $FINAL"
AGAIN=$(P -t -A -c "$(printf "$STMT" C)" | grep -c "^$ID$")
echo "a third press after both: $AGAIN row(s)"
[ "$A" = 1 ] && [ "$B" = 0 ] && [ "$WAITED" -ge 1000 ] && [ "$AGAIN" = 0 ] && echo "$FINAL" | grep -q "^queued 0 Tried again by A$" && { echo "PROVED: two presses at once make one queued row"; exit 0; }
echo "NOT PROVED"; exit 1
