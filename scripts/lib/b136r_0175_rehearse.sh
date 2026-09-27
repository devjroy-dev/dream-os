#!/usr/bin/env bash
# scripts/lib/b136r_0175_rehearse.sh · CE-46 · IGD-2 · cut 2b · A-45.8's rehearsal of 0175 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it: it is the
# seat's rehearsal, recorded on the card, not a founder rung. Prints one line per check; the exit code is the verdict.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chown postgres "$D" 2>/dev/null; PORT=55441; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/scripts/lib/b136r_0175_plant.sql" >/dev/null 2>&1; ok $? "the plant is built (roles, conversations with 0173's columns, the privileges as witnessed)" "plant"
r=$(Q "SELECT count(*) FROM information_schema.columns WHERE table_name='conversations' AND column_name='ig_stopped_at';"); [ "$r" = "0" ]; ok $? "control: before 0175 the column is absent" "$r"
for run in 1 2; do
  out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0175_ig_dm_stop.sql" 2>&1); ok $? "0175 applies (run $run; the second run is a no-op)" "$out"
done
r=$(Q "SELECT data_type||':'||is_nullable FROM information_schema.columns WHERE table_name='conversations' AND column_name='ig_stopped_at';"); [ "$r" = "timestamp with time zone:YES" ]; ok $? "ig_stopped_at is a nullable timestamptz" "$r"
r=$(Q "SELECT count(*) FROM public.conversations WHERE ig_stopped_at IS NOT NULL;"); [ "$r" = "0" ]; ok $? "every existing row reads NULL (answered as usual)" "$r"
W="id='33333333-3333-3333-3333-333333333333'"
r=$(Q "SET ROLE service_role; UPDATE public.conversations SET ig_stopped_at=now() WHERE $W RETURNING (ig_stopped_at IS NOT NULL);"); [ "$r" = "t" ]; ok $? "service_role writes it (STOP)" "$r"
r=$(Q "SET ROLE service_role; SELECT (ig_stopped_at IS NOT NULL) FROM public.conversations WHERE $W;"); [ "$r" = "t" ]; ok $? "service_role reads it" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.conversations SET ig_stopped_at=NULL WHERE $W RETURNING (ig_stopped_at IS NULL);"); [ "$r" = "t" ]; ok $? "service_role clears it (START)" "$r"
r=$(Q "SELECT relrowsecurity FROM pg_class WHERE relname='conversations';"); [ "$r" = "t" ]; ok $? "RLS still enabled on conversations (untouched)" "$r"
for role in anon authenticated; do
  r=$(Q "SET ROLE $role; SELECT ig_stopped_at FROM public.conversations LIMIT 1;"); echo "$r" | grep -q "permission denied"; ok $? "$role is still refused (0170 holds)" "$r"
done
echo; echo "b136r: $pass passed, $fail failed"; [ "$fail" = 0 ]
