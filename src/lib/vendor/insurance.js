// src/lib/vendor/insurance.js — TDW · CE-47 · INS-A · THE INSURANCE ROOM'S RULES, ONE HOME.
//
// The founder's rulings (CE-47, 4 October 2026): TDW educates, links, stores and shows. It never compares quotes,
// never recommends an insurer or a policy, never takes money from an insurer, and TDW registers as no broker.
// Kinds of cover, never products. "Where to buy" is A to Z with no price and no ranking; the two brokers are labelled
// "comparison site". The public mark reads "Insured" and its tap text is ruled (b, 4 October): "Policy uploaded by
// <studio name>, valid until <date>. Details confirmed by <studio name>; TDW has not verified the policy."
//
// Everything here is pure (no database, no clock read): the routes, the sweep and the public door call it with
// today's IST day, so every rule is benchable against fixture days.
'use strict';

const { formatDateLong, formatRs } = require('../format');
// r3 · F-from the floor (bOB 6.1): the trades are the CANONICAL eleven, imported from their one home, never a private
// copy; a trade she sends is read through the one alias table (categoryFraming.normaliseCategory: mehendi → other,
// catering → venue_catering, photo → photography). Checked at load below, as CLB did for social.js.
const { VENDOR_CATEGORIES } = require('../../agent/categories');
const { normaliseCategory } = require('./categoryFraming');

// ── THE KINDS OF COVER (draft table ruled "the words stand", 4 October). `trades` are canonical vendor categories the kind
// fits; `when` names the answers (I2) that bring it in for any trade. Each example is a real wedding situation.
const KINDS = [
  { key: 'equipment', title: 'Kit and equipment cover',
    example: 'A kit bag left in a hotel lobby goes missing on the morning of a wedding. This pays to replace what was in it.',
    trades: ['photography', 'makeup', 'hairstylist', 'performer', 'decor', 'content_creator'], when: { gearOver: 50000 } },
  { key: 'public_liability', title: 'Public liability',
    example: 'A light stand tips over at the venue and hurts a guest. This pays the claim made against the business.',
    trades: ['decor', 'venue_catering', 'performer'], when: { venues: true } },
  { key: 'professional_indemnity', title: 'Professional indemnity',
    example: 'A client says a missed booking spoiled the day and asks for money back. This pays the legal costs and the claim.',
    trades: ['planning', 'photography', 'designer'], when: { holdsMoney: true } },
  { key: 'goods_in_transit', title: 'Goods in transit',
    example: 'An outfit or a load of decor is damaged in the van on the way to the venue. This pays for what was damaged.',
    trades: ['decor', 'designer', 'jewellery'], when: {} },
  { key: 'shop_and_stock', title: 'Shop and stock',
    example: 'A fire in the studio destroys stock a month before the season. This pays for the stock and the fittings.',
    trades: ['designer', 'jewellery'], when: {} },
  { key: 'jewellers_block', title: "Jeweller's block",
    example: 'Pieces sent out on approval for a fitting are stolen. This pays for the pieces.',
    trades: ['jewellery'], when: {} },
  { key: 'personal_accident', title: 'Personal accident for you and your crew',
    example: 'An assistant slips on wet stairs between two functions. This pays for treatment and time off work.',
    trades: [], when: { eventsOver: 20 } },
  { key: 'event_cancellation', title: 'Event cancellation',
    example: 'Rain or a strike cancels an outdoor function. This pays the costs already spent.',
    trades: ['planning'], when: {} },
];
const KIND_KEYS = KINDS.map((k) => k.key).concat('other');
for (const k of KINDS) for (const t of k.trades) {
  if (!VENDOR_CATEGORIES.includes(t)) throw new Error(`insurance: kind ${k.key} names "${t}", which is not one of the canonical categories`);
}
const kindTitle = (key) => (KINDS.find((k) => k.key === key) || { title: 'Other cover' }).title;

/**
 * The kinds that fit her answers (I2 → I3). Trade match OR an answer rule brings a kind in; order is the table's.
 * answers: { trade, gearValue (rupees), eventsPerYear, worksAtVenues (bool), holdsClientMoney (bool) }.
 */
function kindsFor(answers = {}) {
  const trade = answers.trade ? normaliseCategory(String(answers.trade)) : '';
  const gear = Number(answers.gearValue) || 0; const events = Number(answers.eventsPerYear) || 0;
  return KINDS.filter((k) => k.trades.includes(trade)
    || (k.when.gearOver != null && gear > k.when.gearOver)
    || (k.when.venues && answers.worksAtVenues === true)
    || (k.when.holdsMoney && answers.holdsClientMoney === true)
    || (k.when.eventsOver != null && events > k.when.eventsOver))
    .map(({ key, title, example }) => ({ key, title, example }));
}

// ── WHERE TO BUY (ruled 3 and a, 4 October): A to Z, Acko added, the two brokers labelled "comparison site".
// `mode` is the "Buy here" door the founder's letters may open (ruling 1): an entry becomes { mode: 'journey', ... }
// and the room opens it in a sheet; nothing else moves. Each address is the company's own home page; the founder's
// walk checks each one opens (the container cannot reach them).
const DESTINATIONS = [
  { name: 'Acko', kind: 'insurer', url: 'https://www.acko.com', mode: 'link' },
  { name: 'Bajaj General', kind: 'insurer', url: 'https://www.bajajgeneralinsurance.com', mode: 'link' },
  { name: 'Digit', kind: 'insurer', url: 'https://www.godigit.com', mode: 'link' },
  { name: 'HDFC ERGO', kind: 'insurer', url: 'https://www.hdfcergo.com', mode: 'link' },
  { name: 'ICICI Lombard', kind: 'insurer', url: 'https://www.icicilombard.com', mode: 'link' },
  { name: 'IFFCO-Tokio', kind: 'insurer', url: 'https://www.iffcotokio.co.in', mode: 'link' },
  { name: 'InsuranceDekho', kind: 'comparison', url: 'https://www.insurancedekho.com', mode: 'link' },
  { name: 'National Insurance', kind: 'insurer', url: 'https://nationalinsurance.nic.co.in', mode: 'link' },
  { name: 'New India Assurance', kind: 'insurer', url: 'https://www.newindia.co.in', mode: 'link' },
  { name: 'Oriental Insurance', kind: 'insurer', url: 'https://orientalinsurance.org.in', mode: 'link' },
  { name: 'Policybazaar', kind: 'comparison', url: 'https://www.policybazaar.com', mode: 'link' },
  { name: 'SBI General', kind: 'insurer', url: 'https://www.sbigeneral.in', mode: 'link' },
  { name: 'Tata AIG', kind: 'insurer', url: 'https://www.tataaig.com', mode: 'link' },
  { name: 'United India', kind: 'insurer', url: 'https://uiic.co.in', mode: 'link' },
];
const LABEL = { insurer: 'Insurer', comparison: 'Comparison site' };

// ── r2 · THE FOUNDER'S PRINCIPLE (CE-47, 6 October): a connection finishes the job and says plainly what it is.
// "Where to buy" became "Get a quote" (ruling a): each entry carries the cover brief (below) and its fee line (ruling b).
// Step 2, "Buy here" inside TDW, is NOT built until a partner agreement settles the IRDAI question.
const feeLine = (name) => `This opens ${name}'s own website. ${name} sets its own price and may charge its own fees. TDW takes nothing.`;
const NOT_CHECKED = 'Details confirmed by you. Not checked by TDW.';

/** The list as the room draws it: one A-to-Z list, each with its label and fee line. Sorted here, so a new entry cannot break order. */
function destinations() {
  return DESTINATIONS.slice().sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }))
    .map((d) => ({ name: d.name, label: LABEL[d.kind], url: d.url, mode: d.mode, fee_line: feeLine(d.name) }));
}
const destinationByName = (name) => DESTINATIONS.find((d) => d.name === name) || null;

/**
 * THE COVER BRIEF (ruling a): her own enquiry, put together from her answers and from what only TDW knows, which she
 * sends herself. Each figure says where it came from: counted by TDW, from her own calendar, or as she states it.
 * Nothing in it goes from TDW to an insurer. Pure; the door reads the counts and passes them in.
 */
function coverBrief({ studioName, trade, city, weddingsCounted, bookedDays, answers = {}, kindKeys = [] }) {
  const yn = (v) => (v === true ? 'Yes' : v === false ? 'No' : null);
  const kinds = kindKeys.filter((k) => KIND_KEYS.includes(k) && k !== 'other').map(kindTitle);
  const lines = [
    `Cover enquiry from ${String(studioName || '').trim() || 'a wedding studio'}${trade ? `, ${trade}` : ''}${city ? `, ${city}` : ''}.`,
    `Weddings delivered through The Dream Wedding: ${Number(weddingsCounted) || 0} (counted by The Dream Wedding).`,
    `Wedding days booked in the next 12 months: ${Number(bookedDays) || 0} (from the studio's own calendar on The Dream Wedding).`,
  ];
  const gear = Number(answers.gearValue);
  if (Number.isInteger(gear) && gear > 0) lines.push(`Value of kit and equipment: Rs ${formatRs(gear)} (as stated by the studio).`);
  if (yn(answers.worksAtVenues)) lines.push(`Works at venues: ${yn(answers.worksAtVenues)} (as stated by the studio).`);
  if (yn(answers.holdsClientMoney)) lines.push(`Holds client money before the event: ${yn(answers.holdsClientMoney)} (as stated by the studio).`);
  if (kinds.length) lines.push(`Kinds of cover to quote for: ${kinds.join(', ')}.`);
  lines.push('Please send a quote by reply.');
  return lines.join('\n');
}

// ── A POLICY'S STATE ON A GIVEN IST DAY. In date until the end of its last day; "renew soon" from 30 days out.
const daysBetween = (fromKey, toKey) => Math.round((Date.parse(toKey + 'T00:00:00Z') - Date.parse(fromKey + 'T00:00:00Z')) / 86400000);
function policyState(endsOn, todayKey) {
  const left = daysBetween(todayKey, endsOn);
  if (left < 0) return { key: 'ended', label: 'Ended', left };
  if (left <= 30) return { key: 'renew_soon', label: 'Renew soon', left };
  return { key: 'in_date', label: 'In date', left };
}
const counts = (p) => p && !p.deleted_at && !!p.confirmed_at;

/**
 * THE PUBLIC MARK (ruled 2 and b). Shown only when her switch is on AND a confirmed, undeleted policy ends today or
 * later. The date shown is the latest such end. Returns null otherwise: absence is the answer, never a greyed mark.
 */
function insuredMark({ showMark, policies, studioName, todayKey }) {
  if (!showMark) return null;
  const live = (policies || []).filter((p) => counts(p) && daysBetween(todayKey, p.ends_on) >= 0);
  if (!live.length) return null;
  const until = live.map((p) => p.ends_on).sort().pop();
  const name = String(studioName || '').trim() || 'the studio';
  const date = formatDateLong(until);
  return { label: 'Insured', until, text: `Policy uploaded by ${name}, valid until ${date}. Details confirmed by ${name}; TDW has not verified the policy.` };
}

/** Which reminder (30 or 7) is due today for a policy, or null. Each sends once; a missed day sends late, never twice. */
function reminderDue(p, todayKey) {
  if (!counts(p)) return null;
  const left = daysBetween(todayKey, p.ends_on);
  if (left < 0) return null;
  if (left <= 7) return p.reminded_7_on ? null : 7;
  if (left <= 30) return p.reminded_30_on ? null : 30;
  return null;
}
/** The words, counted from today (a late sweep says the true number of days, never the stamp's). */
function reminderText(p, todayKey) {
  const left = daysBetween(todayKey, p.ends_on);
  const when = left === 0 ? 'today' : left === 1 ? 'tomorrow' : `in ${left} days`;
  return `Your ${kindTitle(p.kind).toLowerCase()} with ${p.insurer} ends on ${formatDateLong(p.ends_on)}, ${when}. Open Insurance in Business Solutions to add the renewed policy.`;
}

module.exports = { KINDS, KIND_KEYS, kindTitle, kindsFor, DESTINATIONS, destinations, destinationByName, feeLine, NOT_CHECKED, coverBrief, policyState, insuredMark, reminderDue, reminderText, daysBetween };
