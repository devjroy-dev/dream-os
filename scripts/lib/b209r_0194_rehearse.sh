#!/usr/bin/env bash
# scripts/lib/b209r_0194_rehearse.sh · CE-47 · WEB-4 · cut 13 · 0194 rehearsed on a THROWAWAY Postgres (never production).
# Planted shapes in demo_vendors, demo_claim_requests and prospects. After 0194: exactly the ruled rows gain their code;
# every other row byte-equal; prospects untouched; the 4440 pair named (two rows, the same number), not merged;
# a second run changes nothing. A mutation that reaches prospects is caught.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55491; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "cd /tmp && $*"; else bash -c "$*"; fi; }
Q() { printf '%s\n' "$1" > "$D/q.sql"; chmod 644 "$D/q.sql"; as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d t -f $D/q.sql" 2>&1; }
apply() { cp "$1" "$D/a.sql"; chmod 644 "$D/a.sql"; as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d t -f $D/a.sql" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [${3:0:300}]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT t"
M="$ROOT/db/migrations/0194_demo_phones_with_code.sql"
Q "CREATE TABLE public.demo_vendors (ig_handle text PRIMARY KEY, whatsapp_phone text);
CREATE TABLE public.demo_claim_requests (ig_handle text PRIMARY KEY, phone text NOT NULL);
CREATE TABLE public.prospects (name text PRIMARY KEY, phone text NOT NULL);
INSERT INTO public.demo_vendors VALUES ('a_twelve_4440','919888294440'),('b_plus_4440','+919888294440'),('c_twelve','919811101064'),('d_twelve','919822203275'),
 ('e_null',NULL),('f_empty',''),('g_zero','09812345678'),('h_spaces','98123 45678'),('i_foreign','+14155550100'),('j_ten','9876543210'),('k_twelve_5','919512345678');
INSERT INTO public.demo_claim_requests VALUES ('claim_ten','9876501199'),('claim_plus','+919876501198'),('claim_other','5551234');
INSERT INTO public.prospects VALUES ('p1','919811113275'),('p2','919811114489'),('p3','12345');" >/dev/null
SNAP="SELECT string_agg(t || ':' || k || '=' || coalesce(v, '<null>'), ',' ORDER BY t, k) FROM (SELECT 'dv' t, ig_handle k, whatsapp_phone v FROM public.demo_vendors UNION ALL SELECT 'dc', ig_handle, phone FROM public.demo_claim_requests UNION ALL SELECT 'pr', name, phone FROM public.prospects) z;"
B=$(Q "$SNAP")
out=$(apply "$M"); ok $? "r1 0194 applies in one transaction" "$out"
A=$(Q "$SNAP")
WANT=$(echo "$B" | sed 's/dv:a_twelve_4440=919888294440/dv:a_twelve_4440=+919888294440/; s/dv:c_twelve=919811101064/dv:c_twelve=+919811101064/; s/dv:d_twelve=919822203275/dv:d_twelve=+919822203275/; s/dv:j_ten=9876543210/dv:j_ten=+919876543210/; s/dv:k_twelve_5=919512345678/dv:k_twelve_5=+919512345678/; s/dc:claim_ten=9876501199/dc:claim_ten=+919876501199/')
[ "$A" = "$WANT" ]; ok $? "r2 exactly the ruled shapes gained their code (ten digits 6-9: +91; 91 and ten: +); every other row byte-equal, nulls and empties too" "$(diff <(echo "$WANT" | tr ',' '\n') <(echo "$A" | tr ',' '\n'))"
[ "$(Q "SELECT string_agg(name || '=' || phone, ',' ORDER BY name) FROM public.prospects;")" = "p1=919811113275,p2=919811114489,p3=12345" ]; ok $? "r3 prospects untouched (Meta's form, the lane's key)"
[ "$(Q "SELECT count(*) FROM public.demo_vendors WHERE whatsapp_phone = '+919888294440';")" = 2 ]; ok $? "r4 the 4440 pair: two rows, now one number, named not merged (no row removed)"
[ "$(Q "SELECT (SELECT count(*) FROM public.demo_vendors) || ',' || (SELECT count(*) FROM public.demo_claim_requests);")" = "11,3" ]; ok $? "r5 row counts unchanged"
out=$(apply "$M"); [ "$(Q "$SNAP")" = "$A" ]; ok $? "r6 a second run changes nothing" "$out"
sed "s/^COMMIT;/UPDATE public.prospects SET phone = '+' || phone WHERE phone ~ '^91[6-9][0-9]{9}\$';\nCOMMIT;/" "$M" > "$D/m1.sql"
P0=$(Q "SELECT string_agg(phone, ',' ORDER BY name) FROM public.prospects;"); out=$(apply "$D/m1.sql"); P1=$(Q "SELECT string_agg(phone, ',' ORDER BY name) FROM public.prospects;")
[ "$P0" != "$P1" ]; ok $? "r7 mutation: a line that reaches prospects changes the lane's keys, and r3's check is what catches it" "$P1"
echo; echo "b209r: $pass passed, $fail failed"; [ "$fail" = 0 ]
