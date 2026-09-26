#!/usr/bin/env bash
# scripts/lib/b119r_0173_rehearse.sh · CE-45 · IGD-1 · cut 2a · A-45.8's rehearsal of 0173 on a THROWAWAY Postgres (never production).
# Needs initdb/pg_ctl/psql (PG_BIN, default /usr/lib/postgresql/16/bin). Lives in scripts/lib/ so the floor never collects it: it is the
# seat's rehearsal, recorded on the card, not a founder rung. Prints one line per check; the exit code is the verdict.
set -u
PG_BIN="${PG_BIN:-/usr/lib/postgresql/16/bin}"; ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
D="$(mktemp -d)"; chown postgres "$D" 2>/dev/null; PORT=55439; fail=0; pass=0
as_pg() { if [ "$(id -u)" = 0 ]; then su postgres -s /bin/bash -c "$*"; else bash -c "$*"; fi; }
Q() { as_pg "$PG_BIN/psql -X -q -t -A -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -c \"$1\"" 2>&1; }
ok() { if [ "$1" = 0 ]; then pass=$((pass+1)); echo "  PASS  $2"; else fail=$((fail+1)); echo "  FAIL  $2  [$3]"; fi; }
cleanup() { as_pg "$PG_BIN/pg_ctl -D $D -m immediate stop" >/dev/null 2>&1; rm -rf "$D"; }
trap cleanup EXIT
as_pg "$PG_BIN/initdb -D $D -A trust -U postgres" >/dev/null 2>&1 || { echo "  FAIL  initdb"; exit 1; }
as_pg "$PG_BIN/pg_ctl -D $D -o '-p $PORT -k /tmp -c listen_addresses=' -l $D/log start -w" >/dev/null 2>&1 || { echo "  FAIL  start"; exit 1; }
as_pg "$PG_BIN/createdb -h /tmp -p $PORT plant"
as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/scripts/lib/b119r_0173_plant.sql" >/dev/null 2>&1; ok $? "the plant is built (roles, three tables, the witnessed privileges)" plant
for run in 1 2; do
  out=$(as_pg "$PG_BIN/psql -X -q -v ON_ERROR_STOP=1 -h /tmp -p $PORT -d plant -f $ROOT/db/migrations/0173_ig_dm.sql" 2>&1); ok $? "0173 applies (run $run; the second run is a no-op)" "$out"
done
r=$(Q "SET ROLE service_role; SELECT channel FROM public.conversations WHERE vendor_id='11111111-1111-1111-1111-111111111111' LIMIT 1;"); [ "$r" = "whatsapp" ]; ok $? "service_role reads conversations.channel beside an old column; the existing row reads whatsapp" "$r"
r=$(Q "SET ROLE service_role; BEGIN; INSERT INTO public.conversations (vendor_id, kind, channel, counterparty_ig_id) VALUES ('11111111-1111-1111-1111-111111111111','couple_thread','instagram','IGSID1') RETURNING channel||':'||counterparty_ig_id; ROLLBACK;"); echo "$r" | grep -q "instagram:IGSID1"; ok $? "service_role inserts an Instagram couple_thread and reads it back (RETURNING), rolled back" "$r"
r=$(Q "SET ROLE service_role; BEGIN; INSERT INTO public.leads (vendor_id, counterparty_ig_id, source) VALUES ('11111111-1111-1111-1111-111111111111','IGSID1','instagram') RETURNING counterparty_ig_id||':'||coalesce(phone,'no-phone'); ROLLBACK;"); echo "$r" | grep -q "IGSID1:no-phone"; ok $? "service_role inserts a lead with no phone and an Instagram sender id, rolled back" "$r"
r=$(Q "SET ROLE service_role; SELECT reply_quiet_minutes FROM public.vendors WHERE id='11111111-1111-1111-1111-111111111111' LIMIT 1;"); [ "$r" = "120" ]; ok $? "service_role reads vendors.reply_quiet_minutes; the default is 120" "$r"
r=$(Q "SET ROLE service_role; BEGIN; UPDATE public.vendors SET reply_quiet_minutes=240 WHERE id='11111111-1111-1111-1111-111111111111' RETURNING reply_quiet_minutes; ROLLBACK;"); echo "$r" | grep -q "^240"; ok $? "service_role updates the quiet time to 240, rolled back" "$r"
r=$(Q "SET ROLE service_role; UPDATE public.vendors SET reply_quiet_minutes=90;"); echo "$r" | grep -q "vendors_reply_quiet_minutes_check"; ok $? "a quiet time of 90 is refused by its CHECK" "$r"
r=$(Q "SET ROLE service_role; INSERT INTO public.conversations (vendor_id, kind, channel) VALUES ('11111111-1111-1111-1111-111111111111','couple_thread','sms');"); echo "$r" | grep -q "conversations_channel_check"; ok $? "a channel of sms is refused by its CHECK" "$r"
r=$(Q "SET ROLE service_role; BEGIN; INSERT INTO public.conversations (vendor_id, kind, channel, counterparty_ig_id) VALUES ('11111111-1111-1111-1111-111111111111','couple_thread','instagram','IGSID2'),('11111111-1111-1111-1111-111111111111','couple_thread','instagram','IGSID2'); ROLLBACK;"); echo "$r" | grep -q "conversations_vendor_ig_thread_uidx"; ok $? "a second Instagram thread for the same vendor and sender is refused" "$r"
r=$(Q "SET ROLE service_role; BEGIN; INSERT INTO public.leads (vendor_id, counterparty_ig_id) VALUES ('11111111-1111-1111-1111-111111111111','IGSID3'),('11111111-1111-1111-1111-111111111111','IGSID3'); ROLLBACK;"); echo "$r" | grep -q "leads_vendor_ig_uidx"; ok $? "a second lead for the same vendor and Instagram sender is refused" "$r"
for role in anon authenticated; do
  r=$(Q "SET ROLE $role; SELECT channel FROM public.conversations LIMIT 1;"); echo "$r" | grep -q "permission denied"; ok $? "$role is still refused on conversations (0170 holds)" "$r"
  r=$(Q "SET ROLE $role; SELECT reply_quiet_minutes FROM public.vendors LIMIT 1;"); echo "$r" | grep -q "permission denied"; ok $? "$role is still refused on vendors (0170 holds)" "$r"
done
echo; echo "b119r: $pass passed, $fail failed"; [ "$fail" = 0 ]
