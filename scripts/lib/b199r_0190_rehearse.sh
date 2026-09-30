#!/usr/bin/env bash
# scripts/lib/b199r_0190_rehearse.sh · CE-47 · WEB-4 · cut 6 · the rehearsal of 0190 on a THROWAWAY Postgres (never production).
# b160r's plant; 0179, 0187, 0188, 0189, 0190 as the non-superuser editor; site_publish_draft driven as service_role.
# Proves a page keeps its row (and a section tied to it stays tied) across a Publish. Leaves nothing running (trap).
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55457; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "cd /tmp && $*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
QF() { printf '%s\n' "$1" > "$D/q.sql"; chmod 644 "$D/q.sql"; as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $D/q.sql" 2>&1; }
apply() { as_pg "cat '$1' | $PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -U $2 -d plant" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
out=$(apply "$ROOT/scripts/lib/b160r_0187_plant.sql" postgres); ok $? "the plant (b160r's)" "$out"
for m in 0179_vendor_sites 0187_site_content_model 0188_look_photo_review 0189_site_drafts; do out=$(apply "$ROOT/db/migrations/$m.sql" editor); ok $? "$m as the editor" "$out"; done
out=$(apply "$ROOT/db/migrations/0190_site_publish_pages_in_place.sql" editor); ok $? "0190 applies as the editor" "$out"
V="11111111-1111-1111-1111-111111111111"; S="SET ROLE service_role;"
QF "$S INSERT INTO public.vendor_site_pages (id, vendor_id, slug, title, position) VALUES ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '$V', 'our-story', 'Our Story', 0), ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '$V', 'old', 'Old', 1); INSERT INTO public.vendor_site_sections (vendor_id, page_id, key, shown) VALUES ('$V', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'custom-intro', true);" >/dev/null
r=$(QF "$S INSERT INTO public.vendor_site_drafts (vendor_id, settings, pages) VALUES ('$V', '{}', '[{\"slug\":\"new-one\",\"title\":\"New One\"},{\"slug\":\"our-story\",\"title\":\"Our Story, Again\",\"shown\":false}]') RETURNING vendor_id;"); [ "$r" = "$V" ]; ok $? "a draft whose pages rename one, add one and drop one" "$r"
r=$(Q "$S SELECT site_publish_draft('$V') IS NOT NULL;"); [ "$r" = "t" ]; ok $? "publish returns its time" "$r"
r=$(Q "$S SELECT id || '|' || title || '|' || position || '|' || shown FROM public.vendor_site_pages WHERE vendor_id = '$V' AND slug = 'our-story' AND deleted_at IS NULL;"); [ "$r" = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa|Our Story, Again|1|false" ]; ok $? "the kept page keeps its row (same id), with the draft's title, place and shown" "$r"
r=$(Q "$S SELECT count(*) FROM public.vendor_site_sections s JOIN public.vendor_site_pages p ON p.id = s.page_id AND p.deleted_at IS NULL WHERE s.vendor_id = '$V' AND s.key = 'custom-intro';"); [ "$r" = "1" ]; ok $? "the section tied to it is still tied to a live page (not orphaned)" "$r"
r=$(Q "$S SELECT (deleted_at IS NOT NULL) FROM public.vendor_site_pages WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';"); [ "$r" = "t" ]; ok $? "the page absent from the draft is soft-deleted" "$r"
r=$(Q "$S SELECT title || '|' || position FROM public.vendor_site_pages WHERE vendor_id = '$V' AND slug = 'new-one' AND deleted_at IS NULL;"); [ "$r" = "New One|0" ]; ok $? "the new slug is inserted in its place" "$r"
r=$(Q "$S SELECT count(*) FROM public.vendor_site_pages WHERE vendor_id = '$V';"); [ "$r" = "3" ]; ok $? "three rows in all: nothing re-inserted" "$r"
QF "$S INSERT INTO public.vendor_site_drafts (vendor_id, settings, pages) VALUES ('$V', '{}', '[{\"slug\":\"our-story\",\"title\":\"Once More\"}]');" >/dev/null
Q "$S SELECT site_publish_draft('$V');" >/dev/null
r=$(Q "$S SELECT id FROM public.vendor_site_pages WHERE vendor_id = '$V' AND slug = 'our-story' AND deleted_at IS NULL;"); [ "$r" = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" ]; ok $? "a second Publish: the same row again" "$r"
r=$(Q "SET ROLE anon; SELECT public.site_publish_draft('$V');"); echo "$r" | grep -q "permission denied"; ok $? "anon still cannot publish (grants restated)" "$r"
echo; echo "b199r: $pass passed, $fail failed"; [ "$fail" = 0 ]
