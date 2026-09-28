#!/usr/bin/env bash
# scripts/lib/b146r_0178_rehearse.sh · CE-46 · WEB-1 · cut 2 · A-45.8's rehearsal of 0178 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it: it is
# the seat's rehearsal, recorded on the card, not a founder rung. Prints one line per check; the exit code is the verdict.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chown postgres "$D" 2>/dev/null; PORT=55446; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/scripts/lib/b146r_0178_plant.sql" >/dev/null 2>&1; ok $? "the plant is built (roles, vendors, the default ACL as witnessed)" "plant"
r=$(Q "SELECT count(*) FROM information_schema.tables WHERE table_name='vendor_domains';"); [ "$r" = "0" ]; ok $? "control: before 0178 the table is absent" "$r"
out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0178_vendor_domains.sql" 2>&1); ok $? "0178 applies" "$out"
out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0178_vendor_domains.sql" 2>&1); [ $? != 0 ]; ok $? "0178 a second time refuses (the table exists; nothing is re-created or dropped)" "$out"
r=$(Q "SELECT relrowsecurity FROM pg_class WHERE relname='vendor_domains';"); [ "$r" = "t" ]; ok $? "RLS is enabled on vendor_domains (SEC-1)" "$r"
r=$(Q "SELECT count(*) FROM pg_policies WHERE tablename='vendor_domains';"); [ "$r" = "0" ]; ok $? "no policy is written (the estate's shape: service_role bypasses, everyone else reads nothing)" "$r"
V="'11111111-1111-1111-1111-111111111111'"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_domains (vendor_id, domain, cost_paise, price_paise) VALUES ($V, 'priya.in', 62500, 81200) RETURNING status;"); [ "$r" = "paying" ]; ok $? "service_role inserts; the default status is paying (the GRANT in 0178 is what allows this)" "$r"
r=$(Q "SET ROLE service_role; SELECT count(*) FROM public.vendor_domains;"); [ "$r" = "1" ]; ok $? "service_role reads" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_domains SET status='registering', paid_at=now() WHERE domain='priya.in' RETURNING status;"); [ "$r" = "registering" ]; ok $? "service_role updates the status" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_domains (vendor_id, domain, cost_paise, price_paise) VALUES ($V, 'priya.in', 62500, 81200);"); echo "$r" | grep -q "duplicate key"; ok $? "UNIQUE (domain): the same name twice refuses" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_domains (vendor_id, domain, cost_paise, price_paise) VALUES ($V, 'meher.in', 62500, 60000);"); echo "$r" | grep -q "check constraint"; ok $? "CHECK price_paise >= cost_paise: a sale under cost refuses" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_domains SET status='paid' WHERE domain='priya.in';"); echo "$r" | grep -q "check constraint"; ok $? "CHECK status: a word outside the vocabulary refuses" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_domains SET status='refund_due', refund_due_at=now() WHERE domain='priya.in' RETURNING status;"); [ "$r" = "refund_due" ]; ok $? "S8: refund_due is in the vocabulary, with its time" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_domains SET retries=-1 WHERE domain='priya.in';"); echo "$r" | grep -q "check constraint"; ok $? "CHECK retries >= 0" "$r"
r=$(Q "SET ROLE service_role; DELETE FROM public.vendor_domains WHERE domain='priya.in' RETURNING 1;"); [ "$r" = "1" ]; ok $? "service_role deletes" "$r"
for role in anon authenticated; do
  r=$(Q "SET ROLE $role; SELECT count(*) FROM public.vendor_domains;"); echo "$r" | grep -q "permission denied"; ok $? "$role is refused (nothing granted to it)" "$r"
done
echo; echo "b146r: $pass passed, $fail failed"; [ "$fail" = 0 ]
