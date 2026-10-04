#!/usr/bin/env bash
# scripts/lib/b207r_0193_rehearse.sh · CE-47 · WEB-4 · cut 12 · the rehearsal of 0193 on a THROWAWAY Postgres (never production).
# Two databases from the founder's live reads: LIVE (the live shape with its 22 links) and FILES (the same shape without the
# links, with 0044's discover_heroes and 0002's pending_actions put back). 0193 must change nothing on LIVE (catalogue,
# object ids, rows) and must bring FILES to LIVE's catalogue. Mutations show the guards are what make it a no-op.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55481; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "cd /tmp && $*"; else bash -c "$*"; fi; }
Q() { printf '%s\n' "$2" > "$D/q.sql"; chmod 644 "$D/q.sql"; as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d $1 -f $D/q.sql" 2>&1; }
apply() { cp "$2" "$D/a.sql"; chmod 644 "$D/a.sql"; as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d $1 -f $D/a.sql" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [${3:0:300}]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
L="$ROOT/scripts/lib"; M="$ROOT/db/migrations/0193_live_links_declared.sql"
NINE="'contracts','payment_schedules','tds_ledger','team_members','team_messages','team_payments','team_tasks','discover_heroes','pending_actions'"
EIGHT="contracts payment_schedules tds_ledger team_members team_messages team_payments team_tasks discover_heroes"
CON="SELECT string_agg(conrelid::regclass::text || '|' || conname || '|' || pg_get_constraintdef(oid), E'\n' ORDER BY conrelid::regclass::text, conname) FROM pg_constraint WHERE contype = 'f' AND conrelid::regclass::text IN ($NINE);"
CONOID="SELECT string_agg(conname || '#' || oid, ',' ORDER BY conname) FROM pg_constraint WHERE connamespace = 'public'::regnamespace;"
COLSET="SELECT string_agg(table_name || '|' || column_name || '|' || data_type || '|' || is_nullable || '|' || coalesce(column_default, ''), E'\n' ORDER BY table_name, column_name) FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ($NINE);"
COLPOS="SELECT string_agg(table_name || '|' || ordinal_position || '|' || column_name, ',' ORDER BY table_name, ordinal_position) FROM information_schema.columns WHERE table_schema = 'public' AND table_name IN ($NINE);"
DEFOID="SELECT string_agg(adrelid::regclass::text || '.' || adnum || '#' || oid, ',' ORDER BY adrelid::regclass::text, adnum) FROM pg_attrdef;"
PA="SELECT to_regclass('public.pending_actions') IS NULL;"
DATA=""; for t in $EIGHT; do DATA="$DATA SELECT '$t:' || count(*) || ':' || md5(coalesce(string_agg(x::text, ',' ORDER BY x::text), '')) FROM public.$t x UNION ALL"; done
DATA="SELECT string_agg(s, ',' ORDER BY s) FROM (${DATA% UNION ALL}) z(s);"
COUNTS=""; for t in $EIGHT; do COUNTS="$COUNTS SELECT '$t:' || count(*) FROM public.$t UNION ALL"; done
COUNTS="SELECT string_agg(s, ',' ORDER BY s) FROM (${COUNTS% UNION ALL}) z(s);"
snap() { for q in "$CON" "$CONOID" "$COLPOS" "$COLSET" "$DEFOID" "$PA" "$DATA"; do Q "$1" "$q"; echo '##'; done; }
for db in live files; do as_pg "$PG_BIN/createdb -h /tmp -p $PORT $db"; done

echo "§r1  LIVE: the live shape, its 22 links, planted rows"
out=$(apply live "$L/b207r_0193_live_shape.sql" && apply live "$L/b207r_0193_live_links.sql" && apply live "$L/b207r_0193_rows.sql"); ok $? "r1.1 the live copy builds from the founder's reads" "$out"
r=$(Q live "SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND conrelid::regclass::text IN ($NINE);"); [ "$r" = 22 ]; ok $? "r1.2 it carries exactly the 22 links, and pending_actions is absent" "$r"
BEFORE=$(snap live)
out=$(apply live "$M"); ok $? "r1.3 0193 applies on the live copy, one transaction" "$out"
AFTER=$(snap live)
[ "$BEFORE" = "$AFTER" ]; ok $? "r1.4 A NO-OP LIVE: links, constraint object ids, column order and defaults (default object ids too), pending_actions absent, every row (count and hash per table): all identical" "$(diff <(echo "$BEFORE") <(echo "$AFTER") | head -5)"
out=$(apply live "$M"); AGAIN=$(snap live); [ "$BEFORE" = "$AGAIN" ]; ok $? "r1.5 0193 a second time: still identical (idempotent)" "$out"

echo "§r2  FILES: the same shape without the links, with 0044's discover_heroes and 0002's pending_actions"
out=$(apply files "$L/b207r_0193_live_shape.sql" && apply files "$L/b207r_0193_rows.sql" && apply files "$L/b207r_0193_files_extras.sql"); ok $? "r2.1 the files' database builds" "$out"
FC0=$(Q files "$COUNTS")
r=$(Q files "SELECT count(*) FROM pg_constraint WHERE contype = 'f' AND conrelid::regclass::text IN ($NINE);"); [ "$r" = 3 ]; ok $? "r2.2 before: none of the 22; the three the files declare (discover_heroes, pending_actions x2)" "$r"
out=$(apply files "$M"); ok $? "r2.3 0193 applies on the files' database" "$out"
[ "$(Q files "$CON")" = "$(Q live "$CON")" ]; ok $? "r2.4 after: its links EQUAL the live catalogue's, name for name, definition for definition" "$(diff <(Q files "$CON") <(Q live "$CON") | head -4)"
[ "$(Q files "$COLSET")" = "$(Q live "$COLSET")" ]; ok $? "r2.5 after: the nine tables' columns (type, nullability, default) EQUAL live's; pending_actions gone" "$(diff <(Q files "$COLSET") <(Q live "$COLSET") | head -12 | tr "\n" " ")"
[ "$(Q files "$COUNTS")" = "$FC0" ]; ok $? "r2.6 after: every table keeps its rows (counts per table)" "$FC0"
FA=$(snap files); out=$(apply files "$M"); [ "$FA" = "$(snap files)" ]; ok $? "r2.7 0193 a second time on the files' database: identical" "$out"

echo "§r3  mutations: the guards are what keep live untouched"
sed 's/       AND NOT EXISTS (SELECT 1 FROM pg_constraint c WHERE c.conname = l.con AND c.conrelid = to_regclass(.public.. || l.tbl)) THEN/       THEN/' "$M" > "$D/m1.sql"
grep -q "AND NOT EXISTS" "$D/m1.sql"; [ $? != 0 ]; g=$?
out=$(apply live "$D/m1.sql"); e=$?; [ $g = 0 ] && [ $e != 0 ] && echo "$out" | grep -q "already exists"; ok $? "r3.1 the name guard removed: on live it refuses (the link already exists), so the guard is what makes it a no-op" "$out"
sed 's/IS DISTINCT FROM .uuid_generate_v4().*THEN/IS NOT NULL THEN/' "$M" > "$D/m2.sql"
D0=$(Q live "$DEFOID"); out=$(apply live "$D/m2.sql"); D1=$(Q live "$DEFOID"); [ "$D0" != "$D1" ]; ok $? "r3.2 the default guard removed: live's default object is replaced (r1.4 would redden), so the guard keeps it untouched" "$out"

echo; echo "b207r: $pass passed, $fail failed"; [ "$fail" = 0 ]
