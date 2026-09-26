#!/usr/bin/env bash
# scripts/lib/b119br_0174_rehearse.sh · CE-45 · IGD-1 · cut 2a-ii · A-45.8's rehearsal of 0174 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it: it is the
# seat's rehearsal, recorded on the card, not a founder rung. Prints one line per check; the exit code is the verdict.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chown postgres "$D" 2>/dev/null; PORT=55440; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/scripts/lib/b119br_0174_plant.sql" >/dev/null 2>&1; ok $? "the plant is built (roles, vendor_ig_connections, the privileges as held)" plant
for run in 1 2; do
  out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0174_ig_dm_switch.sql" 2>&1); ok $? "0174 applies (run $run; the second run is a no-op)" "$out"
done
W="vendor_id='11111111-1111-1111-1111-111111111111'"
r=$(Q "SET ROLE service_role; SELECT dm_state||':'||coalesce(messages_granted_at::text,'null') FROM public.vendor_ig_connections WHERE $W LIMIT 1;"); [ "$r" = "off:null" ]; ok $? "service_role reads the new columns beside an old one; the existing row reads off, not granted" "$r"
r=$(Q "SET ROLE service_role; BEGIN; UPDATE public.vendor_ig_connections SET dm_state='on', dm_consented_at=now(), dm_subscribed_at=now(), messages_granted_at=now() WHERE $W RETURNING dm_state; ROLLBACK;"); echo "$r" | grep -q "^on"; ok $? "service_role writes all four columns (RETURNING), rolled back" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_ig_connections SET dm_state='paused' WHERE $W;"); echo "$r" | grep -q "vendor_ig_connections_dm_state_check"; ok $? "a stored 'paused' is refused by its CHECK (paused is derived, never stored)" "$r"
r=$(Q "SET ROLE service_role; BEGIN; INSERT INTO public.vendor_ig_connections (vendor_id) VALUES ('22222222-2222-2222-2222-222222222222') RETURNING dm_state; ROLLBACK;"); echo "$r" | grep -q "^off"; ok $? "a new connection defaults to off" "$r"
for role in anon authenticated; do
  r=$(Q "SET ROLE $role; SELECT dm_state FROM public.vendor_ig_connections LIMIT 1;"); echo "$r" | grep -q "permission denied"; ok $? "$role is still refused (0170 holds)" "$r"
done
echo; echo "b119br: $pass passed, $fail failed"; [ "$fail" = 0 ]
