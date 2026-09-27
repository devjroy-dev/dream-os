#!/usr/bin/env bash
# scripts/lib/b136cr_0176_rehearse.sh · CE-46 · IGD-2 · cut 2c · A-45.8's rehearsal of 0176 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it.
# Prints one line per check; the exit code is the verdict.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chown postgres "$D" 2>/dev/null; PORT=55442; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/scripts/lib/b136cr_0176_plant.sql" >/dev/null 2>&1; ok $? "the plant is built (roles, vendor_ig_connections with 0174's columns, the privileges as witnessed)" "plant"
r=$(Q "SELECT count(*) FROM information_schema.columns WHERE table_name='vendor_ig_connections' AND column_name='ig_account_id';"); [ "$r" = "0" ]; ok $? "control: before 0176 the column is absent" "$r"
for run in 1 2; do
  out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0176_ig_account_id.sql" 2>&1); ok $? "0176 applies (run $run; the second run is a no-op)" "$out"
done
r=$(Q "SELECT data_type||':'||is_nullable FROM information_schema.columns WHERE table_name='vendor_ig_connections' AND column_name='ig_account_id';"); [ "$r" = "text:YES" ]; ok $? "ig_account_id is a nullable text" "$r"
r=$(Q "SELECT count(*) FROM public.vendor_ig_connections WHERE ig_account_id IS NOT NULL;"); [ "$r" = "0" ]; ok $? "the existing row reads NULL (until she connects again)" "$r"
W="vendor_id='23165e38-6510-4639-ab6a-9f35bab93742'"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_ig_connections SET ig_account_id='17841400000000000' WHERE $W RETURNING ig_account_id;"); [ "$r" = "17841400000000000" ]; ok $? "service_role writes it (the connect's setAccountId)" "$r"
r=$(Q "SET ROLE service_role; SELECT vendor_id FROM public.vendor_ig_connections WHERE ig_account_id='17841400000000000';"); [ "$r" = "23165e38-6510-4639-ab6a-9f35bab93742" ]; ok $? "service_role finds her by it (the webhook's findByIgUserId)" "$r"
r=$(Q "SELECT ig_user_id FROM public.vendor_ig_connections WHERE $W;"); [ "$r" = "28467548409515620" ]; ok $? "ig_user_id untouched beside it" "$r"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"INSERT INTO public.vendor_ig_connections (vendor_id, ig_user_id) VALUES ('44444444-4444-4444-4444-444444444444', 'OTHER_SCOPED'), ('55555555-5555-5555-5555-555555555555', NULL);\"" >/dev/null 2>&1; ok $? "two more vendors planted, both with a NULL account id (NULLs never collide)" "insert"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_ig_connections SET ig_account_id='17841400000000000' WHERE vendor_id='44444444-4444-4444-4444-444444444444';"); echo "$r" | grep -q "duplicate key value violates unique constraint \"vendor_ig_connections_ig_account_id_uidx\""; ok $? "a second vendor on the same Instagram account is REFUSED (the partial UNIQUE)" "$r"
r=$(Q "SELECT ig_account_id FROM public.vendor_ig_connections WHERE $W;"); [ "$r" = "17841400000000000" ]; ok $? "the first connection stands" "$r"
r=$(Q "SELECT count(*) FROM public.vendor_ig_connections WHERE ig_account_id IS NULL;"); [ "$r" = "2" ]; ok $? "the two NULL rows coexist" "$r"
r=$(Q "SELECT relrowsecurity FROM pg_class WHERE relname='vendor_ig_connections';"); [ "$r" = "t" ]; ok $? "RLS still enabled (untouched)" "$r"
for role in anon authenticated; do
  r=$(Q "SET ROLE $role; SELECT ig_account_id FROM public.vendor_ig_connections LIMIT 1;"); echo "$r" | grep -q "permission denied"; ok $? "$role is still refused (0170 holds)" "$r"
done
echo; echo "b136cr: $pass passed, $fail failed"; [ "$fail" = 0 ]
