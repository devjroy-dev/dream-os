#!/usr/bin/env bash
# scripts/lib/b197r_0188_rehearse.sh · CE-47 · WEB-4 · cut 4 · the rehearsal of 0188 on a THROWAWAY Postgres (never production).
# Reuses b160r's plant; applies 0179, 0187 and 0188 as the non-superuser editor (SEC-1 §13). Prints one line per check;
# the exit code is the verdict. Leaves nothing running (trap). Lives in scripts/lib/ so the floor never collects it.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55452; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
apply() { as_pg "cat '$1' | $PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -U $2 -d plant" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
out=$(apply "$ROOT/scripts/lib/b160r_0187_plant.sql" postgres); ok $? "the plant (b160r's)" "$out"
out=$(apply "$ROOT/db/migrations/0179_vendor_sites.sql" editor); ok $? "0179 as the editor" "$out"
out=$(apply "$ROOT/db/migrations/0187_site_content_model.sql" editor); ok $? "0187 as the editor" "$out"
S="SET ROLE service_role;"; V="'11111111-1111-1111-1111-111111111111'"
r=$(Q "$S INSERT INTO public.vendor_looks (id, vendor_id, title, slug) VALUES ('55555555-5555-5555-5555-555555555555', $V, 'L', 'l'); INSERT INTO public.vendor_look_photos (id, look_id, vendor_id, image_url) VALUES ('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', $V, 'https://x/y.jpg') RETURNING approval_state;"); [ "$r" = "pending" ]; ok $? "a look photo exists before 0188" "$r"
out=$(apply "$ROOT/db/migrations/0188_look_photo_review.sql" editor); ok $? "0188 applies as the editor, one transaction" "$out"
out=$(apply "$ROOT/db/migrations/0188_look_photo_review.sql" editor); [ $? != 0 ]; ok $? "0188 a second time refuses whole" "$out"
r=$(Q "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='vendor_look_photos' AND column_name IN ('rejection_reason','reviewed_at');"); [ "$r" = "2" ]; ok $? "the two columns are there" "$r"
r=$(Q "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name='vendor_look_photos';"); [ "$r" = "19" ]; ok $? "vendor_look_photos has 19 columns (17 of 0187 + 2)" "$r"
r=$(Q "$S SELECT rejection_reason IS NULL AND reviewed_at IS NULL FROM public.vendor_look_photos;"); [ "$r" = "t" ]; ok $? "the existing row keeps nulls (no data touched)" "$r"
r=$(Q "$S UPDATE public.vendor_look_photos SET approval_state='rejected', rejection_reason=repeat('a',200), reviewed_at=now() RETURNING char_length(rejection_reason);"); [ "$r" = "200" ]; ok $? "a 200-character reason saves (service_role writes the new columns)" "$r"
r=$(Q "$S UPDATE public.vendor_look_photos SET rejection_reason=repeat('a',201);"); echo "$r" | grep -q "check constraint"; ok $? "CHECK: 201 refuses" "$r"
r=$(Q "$S UPDATE public.vendor_look_photos SET rejection_reason='';"); echo "$r" | grep -q "check constraint"; ok $? "CHECK: an empty reason refuses (null means none)" "$r"
r=$(Q "SET ROLE anon; SELECT rejection_reason FROM public.vendor_look_photos;"); echo "$r" | grep -q "permission denied"; ok $? "anon is still refused" "$r"
echo; echo "b197r: $pass passed, $fail failed"; [ "$fail" = 0 ]
