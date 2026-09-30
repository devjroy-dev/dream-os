#!/usr/bin/env bash
# scripts/lib/b160r_0187_rehearse.sh · CE-46 · WEB-4 · cut 2 · the rehearsal of 0179 then 0187 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it:
# it is the seat's rehearsal, recorded on the card, not a founder rung. Both migrations are applied as `editor`, a
# non-superuser (SEC-1 §13). Prints one line per check; the exit code is the verdict. Leaves nothing running (trap).
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chmod 755 "$D"; chown postgres "$D" 2>/dev/null; PORT=55449; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
QE() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -U editor -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
refuses() { echo "$1" | grep -q "$2"; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
apply() { as_pg "cat '$1' | $PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -U $2 -d plant" 2>&1; }

out=$(apply "$ROOT/scripts/lib/b160r_0187_plant.sql" postgres); ok $? "the plant is built (roles; vendors, vendor_packages, clients made by the non-superuser editor)" "$out"
r=$(Q "SELECT rolsuper FROM pg_roles WHERE rolname='editor';"); [ "$r" = "f" ]; ok $? "control: the editor is not a superuser" "$r"
out=$(apply "$ROOT/db/migrations/0179_vendor_sites.sql" editor); ok $? "0179 applies as the editor" "$out"
V="'11111111-1111-1111-1111-111111111111'"
r=$(Q "SET ROLE service_role; INSERT INTO public.vendor_sites (vendor_id, look) VALUES ($V, 'bloom') RETURNING look;"); [ "$r" = "bloom" ]; ok $? "a site row as WEB-1 writes it today, before 0187" "$r"
r=$(Q "SELECT count(*) FROM information_schema.tables WHERE table_name IN ('vendor_looks','vendor_site_sections','site_visits_daily');"); [ "$r" = "0" ]; ok $? "control: before 0187 its tables are absent" "$r"
out=$(apply "$ROOT/db/migrations/0187_site_content_model.sql" editor); ok $? "0187 applies as the editor, one transaction" "$out"
out=$(apply "$ROOT/db/migrations/0187_site_content_model.sql" editor); [ $? != 0 ]; ok $? "0187 a second time refuses whole (nothing re-created, nothing dropped)" "$out"
r2=$(Q "SELECT look, cardinality(styles_picked), copy::text, cover::text, credit_shown FROM public.vendor_sites WHERE vendor_id=$V;"); [ "$r2" = "bloom|0|{}|[]|t" ]; ok $? "the WEB-1 row survives: look kept, the new columns at their defaults" "$r2"
NEW="vendor_site_pages vendor_site_sections vendor_looks vendor_look_photos vendor_collections vendor_collection_looks vendor_site_faq vendor_testimonial_requests site_visits_daily look_hearts_daily site_visit_salt site_visit_seen"
for t in $NEW; do
  r=$(Q "SELECT relrowsecurity FROM pg_class WHERE relname='$t' AND relnamespace='public'::regnamespace;"); [ "$r" = "t" ]; ok $? "RLS on $t (SEC-1)" "$r"
done
r=$(Q "SELECT count(*) FROM pg_policies WHERE schemaname='public';"); [ "$r" = "0" ]; ok $? "no policy anywhere (service_role bypasses)" "$r"
for t in $NEW; do
  r=$(Q "SELECT string_agg(privilege_type, ',' ORDER BY privilege_type) FROM information_schema.role_table_grants WHERE grantee='service_role' AND table_name='$t' AND privilege_type IN ('SELECT','INSERT','UPDATE','DELETE');"); [ "$r" = "DELETE,INSERT,SELECT,UPDATE" ]; ok $? "A-45.8: service_role holds the four on $t" "$r"
done
for role in anon authenticated; do for t in $NEW; do
  r=$(Q "SET ROLE $role; SELECT count(*) FROM public.$t;"); refuses "$r" "permission denied"; ok $? "$role is refused on $t" "$r"
done; done

S="SET ROLE service_role;"
L="'44444444-4444-4444-4444-444444444444'"
r=$(Q "$S UPDATE public.vendor_sites SET style='noir', styles_picked='{noir,heritage}', font_pair='italiana_jost', motion='cinematic', monogram='SI', site_name='Studio Ivara' WHERE vendor_id=$V RETURNING style;"); [ "$r" = "noir" ]; ok $? "her choices save (style, picks, pair, motion, monogram, site name)" "$r"
r=$(Q "$S UPDATE public.vendor_sites SET style='neon' WHERE vendor_id=$V;"); refuses "$r" "check constraint"; ok $? "CHECK style: one of the six" "$r"
r=$(Q "$S UPDATE public.vendor_sites SET styles_picked='{noir,disco}' WHERE vendor_id=$V;"); refuses "$r" "check constraint"; ok $? "CHECK styles_picked: only the six" "$r"
r=$(Q "$S UPDATE public.vendor_sites SET font_pair='comic_sans' WHERE vendor_id=$V;"); refuses "$r" "check constraint"; ok $? "CHECK font_pair: one of the eight" "$r"
r=$(Q "$S UPDATE public.vendor_sites SET site_name=repeat('a',41) WHERE vendor_id=$V;"); refuses "$r" "check constraint"; ok $? "CHECK site_name: 40 (Q13); 41 refuses" "$r"
r=$(Q "$S UPDATE public.vendor_sites SET monogram='ABCD' WHERE vendor_id=$V;"); refuses "$r" "check constraint"; ok $? "CHECK monogram: up to 3" "$r"
r=$(Q "$S UPDATE public.vendor_sites SET cover='[{},{},{},{}]' WHERE vendor_id=$V;"); refuses "$r" "check constraint"; ok $? "CHECK cover: up to 3 slides" "$r"
r=$(Q "$S INSERT INTO public.vendor_looks (id, vendor_id, title, slug) VALUES ($L, $V, repeat('a',60), 'the-emerald-bride') RETURNING status;"); [ "$r" = "draft" ]; ok $? "a look at the 60-character title saves as a draft" "$r"
r=$(Q "$S INSERT INTO public.vendor_looks (vendor_id, title, slug) VALUES ($V, repeat('a',61), 'x');"); refuses "$r" "check constraint"; ok $? "CHECK look title: 61 refuses" "$r"
r=$(Q "$S INSERT INTO public.vendor_looks (vendor_id, title, slug) VALUES ($V, 'Again', 'the-emerald-bride');"); refuses "$r" "duplicate key"; ok $? "a slug is unique per vendor among live looks" "$r"
r=$(Q "$S UPDATE public.vendor_looks SET deleted_at=now() WHERE id=$L; INSERT INTO public.vendor_looks (vendor_id, title, slug) VALUES ($V, 'Again', 'the-emerald-bride') RETURNING slug;"); [ "$r" = "the-emerald-bride" ]; ok $? "a deleted look's slug can be used again" "$r"
r=$(Q "$S INSERT INTO public.vendor_looks (vendor_id, title, slug, status) VALUES ($V, 'Live', 'live', 'published');"); refuses "$r" "check constraint"; ok $? "CHECK a published look has its published time" "$r"
r=$(Q "$S INSERT INTO public.vendor_looks (vendor_id, title, slug, included) VALUES ($V, 'Inc', 'inc', (SELECT jsonb_agg(g) FROM generate_series(1,13) g));"); refuses "$r" "check constraint"; ok $? "CHECK what's included: up to 12 lines" "$r"
r=$(Q "$S INSERT INTO public.vendor_looks (vendor_id, title, slug, package_id, from_price_text, from_price_rupees) VALUES ($V, 'Priced', 'priced', '22222222-2222-2222-2222-222222222222', 'From Rs 55,000', 55000) RETURNING from_price_rupees;"); [ "$r" = "55000" ]; ok $? "a from price with its optional package link" "$r"
r=$(Q "$S INSERT INTO public.vendor_look_photos (look_id, vendor_id, image_url, focal_portrait_x) VALUES ($L, $V, 'https://res.cloudinary.com/x.jpg', 101);"); refuses "$r" "check constraint"; ok $? "CHECK focal point: 0 to 100" "$r"
r=$(Q "$S INSERT INTO public.vendor_look_photos (look_id, vendor_id, image_url) VALUES ($L, $V, 'http://x.jpg');"); refuses "$r" "check constraint"; ok $? "CHECK photo address: https only" "$r"
r=$(Q "$S INSERT INTO public.vendor_look_photos (look_id, vendor_id, image_url, caption) VALUES ($L, $V, 'https://res.cloudinary.com/x.jpg', 'The staircase') RETURNING approval_state || ',' || focal_landscape_y;"); [ "$r" = "pending,50.00" ]; ok $? "a photo starts pending approval, focal at the centre" "$r"
r=$(Q "$S INSERT INTO public.vendor_collections (vendor_id, name, slug) VALUES ($V, repeat('a',41), 'c');"); refuses "$r" "check constraint"; ok $? "CHECK collection name: 40" "$r"
r=$(Q "$S INSERT INTO public.vendor_site_faq (vendor_id, question, answer) VALUES ($V, repeat('q',121), 'a');"); refuses "$r" "check constraint"; ok $? "CHECK question: 120" "$r"
r=$(Q "$S INSERT INTO public.vendor_site_sections (vendor_id, key) VALUES ($V, 'popups');"); refuses "$r" "check constraint"; ok $? "CHECK section key: the ten or custom-*" "$r"
r=$(Q "$S INSERT INTO public.vendor_site_sections (vendor_id, key, heading) VALUES ($V, 'pricing', 'Rates') RETURNING key;"); [ "$r" = "pricing" ]; ok $? "a section's own heading saves" "$r"
r=$(Q "$S INSERT INTO public.vendor_site_sections (vendor_id, key) VALUES ($V, 'pricing');"); refuses "$r" "duplicate key"; ok $? "one row per section key on her home" "$r"
H="'$(printf %064d 0 | tr 0 a)'"
r=$(Q "$S INSERT INTO public.vendor_testimonial_requests (vendor_id, person_name, phone, token_hash, origin) VALUES ($V, 'Ananya', '+919999999999', $H, 'vendor') RETURNING (expires_at - created_at) > interval '29 days';"); [ "$r" = "t" ]; ok $? "a request lives 30 days by default (Q12)" "$r"
r=$(Q "$S UPDATE public.vendor_testimonial_requests SET used_at=now() WHERE token_hash=$H;"); refuses "$r" "check constraint"; ok $? "a used request cannot keep the phone (Q12)" "$r"
r=$(Q "$S UPDATE public.vendor_testimonial_requests SET used_at=now(), phone=NULL WHERE token_hash=$H RETURNING phone IS NULL;"); [ "$r" = "t" ]; ok $? "used, with the phone nulled in the same write" "$r"
r=$(Q "$S INSERT INTO public.vendor_testimonial_requests (vendor_id, person_name, token_hash, origin) VALUES ($V, 'x', 'not-a-hash', 'vendor');"); refuses "$r" "check constraint"; ok $? "CHECK token: only its sha256 is stored" "$r"
r=$(Q "$S INSERT INTO public.vendor_testimonials (vendor_id, author, consented_at) VALUES ($V, 'Ananya', now());"); refuses "$r" "check constraint"; ok $? "a testimonial has words or a video" "$r"
r=$(Q "$S INSERT INTO public.vendor_testimonials (vendor_id, author, body, consented_at) VALUES ($V, 'Ananya', 'Ten minutes.', now()) RETURNING state;"); [ "$r" = "pending" ]; ok $? "a testimonial arrives pending (nothing shows until she approves)" "$r"
r=$(Q "$S UPDATE public.vendor_testimonials SET state='approved' WHERE author='Ananya';"); refuses "$r" "check constraint"; ok $? "approved carries its time" "$r"
r=$(Q "$S INSERT INTO public.vendor_testimonials (vendor_id, author, video_url, video_duration_s, consented_at) VALUES ($V, 'Ira', 'https://res.cloudinary.com/v.mp4', 64, now()) RETURNING body IS NULL;"); [ "$r" = "t" ]; ok $? "a video testimonial needs no written words" "$r"
r=$(Q "$S INSERT INTO public.site_visits_daily (vendor_id, day, page, source, views) VALUES ($V, current_date, 'look', 'google', 1);"); refuses "$r" "check constraint"; ok $? "a look's count names the look" "$r"
r=$(Q "$S INSERT INTO public.site_visits_daily (vendor_id, day, page, source, views, uniques) VALUES ($V, current_date, 'home', 'instagram', 1, 1) RETURNING views;"); [ "$r" = "1" ]; ok $? "a daily count row" "$r"
r=$(Q "$S INSERT INTO public.site_visits_daily (vendor_id, day, page, source) VALUES ($V, current_date, 'home', 'instagram');"); refuses "$r" "duplicate key"; ok $? "one row per vendor, day, page, look and source" "$r"
r=$(Q "$S INSERT INTO public.site_visits_daily (vendor_id, day, page, source) VALUES ($V, current_date, 'home', 'tiktok');"); refuses "$r" "check constraint"; ok $? "CHECK source: the six classes" "$r"
r=$(Q "$S INSERT INTO public.site_visit_salt (day, salt) VALUES (current_date, '\\x00');"); refuses "$r" "check constraint"; ok $? "CHECK salt: 32 bytes" "$r"
r=$(Q "SELECT count(*) FROM information_schema.columns WHERE table_schema='public' AND table_name IN ('site_visits_daily','look_hearts_daily','site_visit_salt','site_visit_seen') AND (column_name ~ '(ip|addr|agent|cookie|token)');"); [ "$r" = "0" ]; ok $? "no visitor table has a column for an address, agent, cookie or token" "$r"
echo; echo "b160r: $pass passed, $fail failed"; [ "$fail" = 0 ]
