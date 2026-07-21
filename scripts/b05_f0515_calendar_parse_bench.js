// scripts/b05_f0515_calendar_parse_bench.js
// TDW_05 — F-05.15 (CE-43) vendorCalendarImage PARSER cure bench.
//
// THE FINDING: Haiku FENCES + editorializes when it EXPLAINS (no-event images) and returns
// clean JSON when it EXTRACTS. The old anchored strip (^``` … ```$) only survived a fence
// with nothing outside it → fenced-with-prose responses threw → the vendor got the polite
// refusal instead of the honest empty-events line. Cure: fence/prose-tolerant extraction of
// the FIRST balanced JSON array/object. A clean [] is the honest no-events path, not an error.
//
// The three CE-43 specimens are the named tests verbatim; plus one malformed (no JSON at all)
// which must still hit the existing error path with UNCHANGED wording. Exercised through the
// REAL extractCalendarFromImage: a fake Anthropic client returns the specimen as Haiku's text;
// global.fetch is stubbed so the media downloader succeeds without a network. No creds.
//
// NON-VACUOUS / BOTH-WAYS: specimens 1 & 2 THROW at the uncured origin (old strip) and PARSE
// under the cure; specimen 3 is byte-identical both ways; specimen 4 throws both ways. The
// disclosed mutation transcript (revert the parse block in src → specimens 1 & 2 exit 1 →
// restore) rides the handover.
'use strict';
const assert = require('assert');
delete require.cache[require.resolve('../src/lib/vendorCalendarImage.js')];
const { extractCalendarFromImage } = require('../src/lib/vendorCalendarImage.js');

// ── stub the media downloader's network: any non-Twilio host → a plain GET returning a
//    tiny fake image. The parser cure is downstream of this; the bytes are irrelevant. ──
const realFetch = global.fetch;
global.fetch = async () => ({
  ok: true,
  status: 200,
  headers: { get: () => 'image/jpeg' },
  arrayBuffer: async () => Buffer.from([0x00, 0x01, 0x02]),
});

function fakeAnthropic(responseText) {
  return { messages: { create: async () => ({ content: [{ type: 'text', text: responseText }] }) } };
}

const IMG   = 'https://example.supabase.co/object/public/wa-media/x.jpg'; // non-Twilio → plain GET
const TODAY = '2026-07-21';

// ── the three CE-43 specimens, verbatim shapes ──────────────────────────────────────────────
const SPECIMEN_FENCED_EMPTY_TRAILING_PROSE =
  '```json\n[]\n```\n\nI couldn\'t find any calendar events in this image — it looks like a portrait, not a calendar.';

const SPECIMEN_FENCED_PROSE_BOTH_SIDES =
  'Here are the events I could read from your calendar:\n\n' +
  '```json\n' +
  '[{"title":"Shoot — Priya","event_date":"2026-12-14","event_time":"06:00","kind":"shoot","notes":"Lodhi Garden"}]\n' +
  '```\n\nLet me know if you\'d like me to add any of these.';

const SPECIMEN_CLEAN_PASSTHROUGH =
  '[{"title":"Call with editor","event_date":"2026-11-28","event_time":"15:00","kind":"call","notes":null}]';

const SPECIMEN_MALFORMED_NO_JSON =
  'I\'m sorry, I can\'t make out any calendar content in this image.';

let pass = 0, fail = 0;
async function t(name, fn) {
  try { await fn(); console.log(`  ok   ${name}`); pass++; }
  catch (e) { console.log(`  FAIL ${name}\n       ${e.message}`); fail++; }
}

(async () => {
  // 1. fenced-[]-with-trailing-prose → honest no-events ([]), NO throw.
  await t('specimen fenced-[]-with-trailing-prose -> proposals: [] (honest no-events, not an error)', async () => {
    const r = await extractCalendarFromImage({ image_url: IMG, anthropic: fakeAnthropic(SPECIMEN_FENCED_EMPTY_TRAILING_PROSE), istToday: TODAY });
    assert.deepStrictEqual(r.proposals, []);
    assert.strictEqual(r.rawResponse, SPECIMEN_FENCED_EMPTY_TRAILING_PROSE, 'rawResponse preserved verbatim');
  });

  // 2. fenced-with-prose-both-sides → the one event parsed + validated.
  await t('specimen fenced-with-prose-both-sides -> the 1 event parsed', async () => {
    const r = await extractCalendarFromImage({ image_url: IMG, anthropic: fakeAnthropic(SPECIMEN_FENCED_PROSE_BOTH_SIDES), istToday: TODAY });
    assert.deepStrictEqual(r.proposals, [
      { title: 'Shoot — Priya', event_date: '2026-12-14', event_time: '06:00', kind: 'shoot', notes: 'Lodhi Garden' },
    ]);
  });

  // 3. clean-JSON passthrough → byte-identical to pre-cure behavior (the real-calendar success path).
  await t('specimen clean-JSON passthrough -> parsed byte-identical (real-calendar path unchanged)', async () => {
    const r = await extractCalendarFromImage({ image_url: IMG, anthropic: fakeAnthropic(SPECIMEN_CLEAN_PASSTHROUGH), istToday: TODAY });
    assert.deepStrictEqual(r.proposals, [
      { title: 'Call with editor', event_date: '2026-11-28', event_time: '15:00', kind: 'call', notes: null },
    ]);
  });

  // 4. malformed (no JSON at all) → the existing error path, wording UNCHANGED.
  await t('specimen malformed (no JSON) -> throws existing "Haiku returned non-JSON" (wording unchanged)', async () => {
    await assert.rejects(
      () => extractCalendarFromImage({ image_url: IMG, anthropic: fakeAnthropic(SPECIMEN_MALFORMED_NO_JSON), istToday: TODAY }),
      (e) => e.message.startsWith('vendorCalendarImage: Haiku returned non-JSON:'),
    );
  });

  global.fetch = realFetch;
  console.log(`\nb05_f0515_calendar_parse_bench: ${pass} passed, ${fail} failed`);
  if (fail === 0) console.log('GREEN — fenced empty = honest no-events · fenced-with-prose parsed · clean passthrough byte-identical · malformed = existing error path unchanged. RED-at-uncured-origin on specimens 1 & 2 disclosed by mutation.');
  process.exit(fail === 0 ? 0 : 1);
})();
