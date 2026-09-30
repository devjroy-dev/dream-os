#!/usr/bin/env bash
# scripts/lib/b198r_0189_rehearse.sh · CE-47 · WEB-4 · cut 5 · the rehearsal of 0189 on a THROWAWAY Postgres (never production).
# b160r's plant; 0179, 0187, 0188, 0189 applied as the non-superuser editor; site_publish_draft driven as service_role.
# One line per check; the exit code is the verdict. Leaves nothing running (trap). In scripts/lib/ so the floor never collects it.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55454; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
# QF: SQL through a file, for statements whose JSON would not survive the shell's quoting
QF() { printf '%s\n' "$1" > "$D/q.sql"; chmod 644 "$D/q.sql"; as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $D/q.sql" 2>&1; }
apply() { as_pg "cat '$1' | $PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -U $2 -d plant" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
out=$(apply "$ROOT/scripts/lib/b160r_0187_plant.sql" postgres); ok $? "the plant (b160r's)" "$out"
for m in 0179_vendor_sites 0187_site_content_model 0188_look_photo_review; do out=$(apply "$ROOT/db/migrations/$m.sql" editor); ok $? "$m as the editor" "$out"; done
out=$(apply "$ROOT/db/migrations/0189_site_drafts.sql" editor); ok $? "0189 applies as the editor, one transaction" "$out"
out=$(apply "$ROOT/db/migrations/0189_site_drafts.sql" editor); [ $? != 0 ]; ok $? "0189 a second time refuses whole" "$out"
S="SET ROLE service_role;"; V="'11111111-1111-1111-1111-111111111111'"
r=$(Q "$S SELECT public.site_publish_draft($V) IS NULL;"); [ "$r" = "t" ]; ok $? "no draft: publish returns null and writes nothing" "$r"
Q "$S INSERT INTO public.vendor_site_pages (vendor_id, slug, title) VALUES ($V, 'old', 'Old');" >/dev/null
Q "$S INSERT INTO public.vendor_site_sections (vendor_id, key, shown, position) VALUES ($V, 'band', true, 10);" >/dev/null
r=$(QF "SET ROLE service_role; INSERT INTO public.vendor_site_drafts (vendor_id, settings, sections, pages) VALUES ('11111111-1111-1111-1111-111111111111', '{\"style\":\"heritage\",\"styles_picked\":[\"heritage\",\"noir\"],\"copy\":{\"intro\":\"Hi\"},\"credit_shown\":false}', '[{\"key\":\"band\",\"shown\":false,\"position\":20,\"body\":{\"button\":\"See\"}},{\"key\":\"faq\",\"shown\":true,\"position\":90}]', '[{\"slug\":\"our-story\",\"title\":\"Our Story\"}]') RETURNING vendor_id;"); [ "$r" = "11111111-1111-1111-1111-111111111111" ]; ok $? "service_role writes a draft" "$r"
r=$(Q "$S SELECT site_publish_draft($V) IS NOT NULL;"); [ "$r" = "t" ]; ok $? "publish returns its time" "$r"
r=$(Q "$S SELECT style || '|' || array_to_string(styles_picked, ',') || '|' || (copy->>'intro') || '|' || credit_shown || '|' || (published_at IS NOT NULL) FROM public.vendor_sites WHERE vendor_id = $V;"); [ "$r" = "heritage|heritage,noir|Hi|false|true" ]; ok $? "the live row takes the draft's settings and published_at" "$r"
r=$(Q "$S SELECT string_agg(key || ':' || shown || ':' || position, ',' ORDER BY key) FROM public.vendor_site_sections WHERE vendor_id = $V AND deleted_at IS NULL;"); [ "$r" = "band:false:20,faq:true:90" ]; ok $? "sections: the band updated in place, the questions section added" "$r"
r=$(Q "$S SELECT (SELECT body->>'button' FROM public.vendor_site_sections WHERE vendor_id = $V AND key = 'band') || '|' || (SELECT count(*) FROM public.vendor_site_sections WHERE vendor_id = $V AND key = 'band');"); [ "$r" = "See|1" ]; ok $? "one band row, with its body" "$r"
r=$(Q "$S SELECT string_agg(slug, ',') FROM public.vendor_site_pages WHERE vendor_id = $V AND deleted_at IS NULL;"); [ "$r" = "our-story" ]; ok $? "pages: the draft's replace the old (old soft-deleted)" "$r"
r=$(Q "$S SELECT count(*) FROM public.vendor_site_drafts WHERE vendor_id = $V;"); [ "$r" = "0" ]; ok $? "the draft is gone" "$r"
QF "SET ROLE service_role; INSERT INTO public.vendor_site_drafts (vendor_id, settings) VALUES ('11111111-1111-1111-1111-111111111111', '{\"style\":\"disco\"}');" >/dev/null
r=$(Q "$S SELECT site_publish_draft($V);"); echo "$r" | grep -q "check constraint"; ok $? "a draft the live row refuses fails whole (the CHECK on style)" "$r"
r=$(Q "$S SELECT (SELECT style FROM public.vendor_sites WHERE vendor_id = $V) || '|' || (SELECT count(*) FROM public.vendor_site_drafts WHERE vendor_id = $V);"); [ "$r" = "heritage|1" ]; ok $? "...and nothing moved: the live row as it was, the draft kept (one transaction)" "$r"
r=$(Q "SET ROLE anon; SELECT count(*) FROM public.vendor_site_drafts;"); echo "$r" | grep -q "permission denied"; ok $? "anon cannot read drafts" "$r"
r=$(Q "SET ROLE anon; SELECT public.site_publish_draft($V);"); echo "$r" | grep -q "permission denied"; ok $? "anon cannot publish" "$r"
r=$(Q "SET ROLE authenticated; SELECT public.site_publish_draft($V);"); echo "$r" | grep -q "permission denied"; ok $? "authenticated cannot publish" "$r"
r=$(Q "SELECT relrowsecurity FROM pg_class WHERE oid = 'public.vendor_site_drafts'::regclass;"); [ "$r" = "t" ]; ok $? "RLS on the drafts table" "$r"
echo; echo "b198r: $pass passed, $fail failed"; [ "$fail" = 0 ]
