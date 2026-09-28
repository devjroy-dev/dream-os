#!/usr/bin/env bash
# scripts/lib/b148r_0179_rehearse.sh · CE-46 · WEB-1 · cut 4 · A-45.8's rehearsal of 0179 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it: it is
# the seat's rehearsal, recorded on the card, not a founder rung. Prints one line per check; the exit code is the verdict.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chown postgres "$D" 2>/dev/null; PORT=55448; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/scripts/lib/b148r_0179_plant.sql" >/dev/null 2>&1; ok $? "the plant is built (roles, vendors, the default ACL as witnessed)" "plant"
r=$(Q "SELECT count(*) FROM information_schema.tables WHERE table_name='vendor_sites';"); [ "$r" = "0" ]; ok $? "control: before 0179 the tables are absent" "$r"
out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0179_vendor_sites.sql" 2>&1); ok $? "0179 applies" "$out"
out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0179_vendor_sites.sql" 2>&1); [ $? != 0 ]; ok $? "0179 a second time refuses (the table exists; nothing is re-created or dropped)" "$out"
for t in vendor_sites vendor_stories vendor_testimonials; do
  r=$(Q "SELECT relrowsecurity FROM pg_class WHERE relname='$t';"); [ "$r" = "t" ]; ok $? "RLS is enabled on $t (SEC-1)" "$r"
  r=$(Q "SELECT count(*) FROM pg_policies WHERE tablename='$t';"); [ "$r" = "0" ]; ok $? "no policy on $t" "$r"
done
V="'11111111-1111-1111-1111-111111111111'"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_sites (vendor_id, look) VALUES ($V, 'bloom') RETURNING credit_shown;"); [ "$r" = "t" ]; ok $? "service_role inserts a site row; the credit is shown by default" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_sites (vendor_id) VALUES ($V);"); echo "$r" | grep -q "duplicate key"; ok $? "UNIQUE vendor_id: one site row per vendor" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_sites SET look='neon' WHERE vendor_id=$V;"); echo "$r" | grep -q "check constraint"; ok $? "CHECK look: one of quiet, bloom, atelier, or none" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendor_sites SET look=NULL WHERE vendor_id=$V RETURNING coalesce(look,'none');"); [ "$r" = "none" ]; ok $? "service_role updates; no look is allowed (her trade decides)" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_stories (vendor_id, title, slug) VALUES ($V, 'Riya and Kabir', 'riya-and-kabir') RETURNING slug;"); [ "$r" = "riya-and-kabir" ]; ok $? "a story inserts" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_stories (vendor_id, title, slug) VALUES ($V, 'x', 'riya-and-kabir');"); echo "$r" | grep -q "duplicate key"; ok $? "UNIQUE (vendor_id, slug)" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_stories (vendor_id, title, slug) VALUES ($V, 'x', 'Bad Slug');"); echo "$r" | grep -q "check constraint"; ok $? "CHECK slug shape" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_testimonials (vendor_id, author, body) VALUES ($V, 'Riya', 'Lovely');"); echo "$r" | grep -q "null value"; ok $? "a testimonial without its consent time refuses" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_testimonials (vendor_id, author, body, consented_at) VALUES ($V, 'Riya', 'Lovely', now()) RETURNING author;"); [ "$r" = "Riya" ]; ok $? "a consented testimonial inserts" "$r"
r=$(Q "SET ROLE service_role; DELETE FROM public.vendor_testimonials RETURNING 1;"); [ "$r" = "1" ]; ok $? "service_role deletes" "$r"
for role in anon authenticated; do
  for t in vendor_sites vendor_stories vendor_testimonials; do
    r=$(Q "SET ROLE $role; SELECT count(*) FROM public.$t;"); echo "$r" | grep -q "permission denied"; ok $? "$role is refused on $t" "$r"
  done
done
echo; echo "b148r: $pass passed, $fail failed"; [ "$fail" = 0 ]
