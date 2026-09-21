'use strict';
// src/lib/vendor/doorLines.js  THE DOOR'S FOUNDER BYTES. ONE HOME. CE-44 LC-Victor P5.
//
// EVERY STRING A VENDOR READS FROM THE WORKING DOOR LIVES HERE AND NOWHERE ELSE. The bytes are the
// founder's: B1 to B13 ruled verbatim at R-44.21 (f), 2026-09-20 ("ill go with your ruling on all
// except no. 3"); D1 his from the CE-43 veto record (TDW_CE43_LC2_P3_HANDOVER.md:173), homeless in
// code until now; B14 his at R-44.22 (a) (F-44.58); B1 and B2 end "Reply YES or NO." by his word at R-44.24; the leftover line and its twelve examples R-44.18's, the first reworded by his
// yes at R-44.21 (e) (F-44.54). D3 to D8 and F29 are NOT here: they keep their one home in
// lifecycleHands.js LINES and the door reads them from there. B16 to B21 (P6a-1, the lead half) his at
// R-44.34 ("yes to all", 21 September 2026), carried verbatim from TDW_CE44_LCV6_SEAT_CLOSE.md §4.
// B15's key is owed by the last packet and stays free. B22 to B29 arrive with P6a-2.
//
// HASH-CARRIED, AS victorLines.js IS (CE-207): each template is frozen as bytes; LINE_HASHES pins the
// sha256 of each as a literal; assertLineHashes() runs AT LOAD, so a process that requires this file
// with an edited byte dies at boot rather than speaking an unvetoed sentence; b90 pins the literals.
// An edit that is not also a veto is caught twice, by two mechanisms different in kind.
//
// A TEMPLATE IS RENDERED, NEVER RE-WORDED. {slots} are filled by render(); nothing else is added.
// Byte 13's no-client form is DERIVED here by dropping " for {client}", exactly as the WhatsApp
// lane's conditional has always rendered it (b80 V1_NOCLIENT), so both lanes speak one sentence.
//
// THE LEFTOVER LINE AND ITS TWELVE EXAMPLES ARE CARRIED, PINNED AND UNUSED (R-44.21 (a), the chair's
// amendment): they switch on the day the chain leaves the working rooms, not before.
//
// TOTAL: render() and every line builder below never throw; a slot that cannot be filled yields null
// and the caller speaks nothing from it (the door then stands aside to the chain).

const crypto = require('crypto');

const LINES = Object.freeze({
  // the payment confirmation question (staged; she said a payment arrived)
  B1: "Mark this payment? {client} · {which payment} · Rs {amount} · {date}. Reply YES or NO.",
  // the booking confirmation question (staged; she said a booking is confirmed or an advance came)
  B2: "Confirm this booking? {client} · {package} · Rs {total}. Reply YES or NO.",
  // her no to a staged money act
  B3: "Okay. Nothing was changed.",
  // a booking on a name with no lead (F-44.5)
  B4: "Could not confirm the booking. No lead called {name}. Add the lead first.",
  // a booking whose lead has no live package
  B5: "Could not confirm the booking. {client} has no package yet. Attach a package first.",
  // an advance or payment with no date said
  B6: "When did the payment come in?",
  // a date the door cannot read
  B7: "I could not read that date. Say it like 5 December.",
  // two clients share the name she used (F-44.9, F-44.16)
  B8: "Two clients are called {name}: {name} ({date}) · {name} ({date}). Say which one.",
  // an invoice SERVED (F-44.49)
  B9: "Invoice {number} for {client} is already made. Find it in the invoices list.",
  // more than one live invoice on her client
  B10: "{client} has {n} invoices: {numbers}. Which one?",
  // an invoice asked for a client with no fee
  B11: "Could not make the invoice. {client} has no fee yet.",
  // a second money act in one message
  B12: "One payment at a time. Tell me the next one after this.",
  // an invoice MINTED; V1, the ONE invoice sentence on BOTH lanes (F-44.48, F-43.34)
  B13: "Invoice {number} for {client} is ready. Find it in the invoices list.",
  // a bare yes or no answering the door's OWN question after it lapsed (F-44.58; R-44.22 (a), his, verbatim)
  B14: "That request timed out. Nothing was changed. Say it again.",
  // P6a-1 · a lead filed by the door, no date (R-44.34)
  B16: "Lead added: {client}.",
  // a lead filed by the door with its wedding date
  B17: "Lead added: {client} · {date}.",
  // a lead act with no name
  B18: "Who is the lead? Say the name.",
  // createLead answered deduped: the number is on a lead already ({client} from the RETURNED row)
  B19: "That number is already on {client}. Nothing new was added.",
  // createLead refused, or the write failed
  B20: "Could not add the lead.",
  // a wedding date in the past, or outside this year through five years on (F-44.66)
  B21: "That wedding date cannot be right. Say it like 5 December 2027.",
  // a booking made (vetoed CE-43, TDW_CE43_LC2_P3_HANDOVER.md:173; homeless until P5)
  D1: "Booked: {client}. Client, event and invoice {number} are ready.",
  // R-44.18; CARRIED UNUSED until the chain leaves the working rooms (R-44.21 (a))
  LEFTOVER: "I didn't catch a task in that. You can say things like:",
});

// Withdrawn, not to reappear (F-44.54, R-44.21 (e)): the first example's old wording,
// "The Sharma wedding is confirmed for 5 December, fee 60,000". It named a fee the door never writes.
const EXAMPLES = Object.freeze([
  "The Sharma booking is confirmed",
  "The advance came in today for the Kapoor booking",
  "Am I free on 14 February?",
  "Block 20 March, personal",
  "Move the Verma shoot to 22 November",
  "Raise the invoice for the Bose wedding",
  "Who are my new leads?",
  "What's due this week?",
  "Add a new lead, haldi shoot on 3 January",
  "Send a message to my client asking for the advance",
  "Add Priya to the team for the 5 December wedding",
  "Assign Harsh to the 14 February shoot",
]);

const LINE_HASHES = Object.freeze({
  B1: '1fb5297d3c1193543d8385e514fe42b1856be16deb6cabf2e83cf036169ed4ba',
  B2: 'cd29bd0dfbde4e0dba9cf4df73e12bc7b69880aea0337562e77d96228e8259eb',
  B3: 'a6a5c9b1c22d6a82413e6bb856363e8a98e902a4b092368a16ef21bb6b30066d',
  B4: '2dff7d6656c93fa39dd45da087484bb39ef3751b00a0c2e1ca7d4b3503068684',
  B5: 'c628ff61df8eec8e034ec24ac22d2e6b54e060eeb460260d32a6f2d9fa84d190',
  B6: '728d219fdb8a4ce07778dcf346665975d7ab651f7501efa6ff3f8a7144eb3029',
  B7: '44b5c385d187f3cc29ce05c210a524a8be162ab127f2bf97cbe22bc90dd8e331',
  B8: 'ecf5d241deae90b77bc9d840928aacc2a1fc781f3fd2b6ea9cb2a25db7675166',
  B9: '3253966dab22fb365c4f8ed5e0676c1c6196f6df7e3f47a122d1e32d00a0faa2',
  B10: 'c82103b3177a6a44cafcf364be426df89901ab0407fd3776092a84b3afcad81d',
  B11: '90f1edf7055b45d6c898df911ba442b70b47119f2523a5c8b7bfdd8dd00cb8ed',
  B12: '7723dc04452784fe3c6e7b1e9d145fa1323048aaa39da70a9d52aeae2c22ee09',
  B13: '45f9284524fc2546d8ca5a34ae51d036efc1a887f2104a35a473e283dda9658c',
  B14: '68dbaf45c2129785ac3e0644f30973d1ee8a8d3838313a6069b3417b8a4b2249',
  B16: 'a7fe91f49891ed319667b750d32ddcd55dabda117f328f7f0712f685c20b3830',
  B17: 'b332f4de8e4698181a5d67735814f183a25319abdfa568c3e56b4040f24e8927',
  B18: 'f6d70e738f124ab29e818590116913b8cb744e777f722c7157e70dbe0ca366a0',
  B19: 'ec10d50e073b11a83206a1c89c276be61f0e476bee762671d383820d74ecfaf8',
  B20: 'fcfa046d1cf3e8191d12637a6d707078d093df2c5d191b499a6491877d925653',
  B21: 'ceb7ebc7a3efd2b7d2ff2250c3fff652146624c6bdb7065f28cfe255c52ba9ed',
  D1: '1a7d3901e2d0a7a72709b471bcd010931aff7ddd002ed34b9c001b463df3e8ee',
  LEFTOVER: '05f4c9a3b74e98344db56fe642a0774eae8bddb61ff5f672699eaa33fea087ae',
});
const EXAMPLE_HASHES = Object.freeze([
  'fe08c1ab037beded35919903f7a9aeefa944240cedde53e164513644003f57ff',
  'd525b7f89d5d1b4c76f02e4878652d7fe53284ae92b103ef14e5a070a2baa5eb',
  '8cefbe51632b13e644e41aacdd59b311f0909b0809007fc4ee62ff61c183fbde',
  '4789c77785b5fe48dc4b4efad0885ea33adf526922adb564a76c369c948d5e7d',
  '9769184556f8244197b9c491977173803690b85275669948364be0b3cf71826e',
  '95484ebfab2b87e567e91c51558dd0bc8cba9b473e04bc74e70fd90d29172674',
  'c746f06d03a6aaac00051e7fd6d11a658df7db5a3382d065a3a1f727719509c2',
  'd532658665d5d7be41f604be8da738b2359173c25470ba85d11de2487e7bd20b',
  'f692843a93232f8deb147fd5de077ead7783f2e527c864da3606fe99e8f1b6b2',
  '0e95fefd5f54766a5f0f4c410538f68c9621aa1f76194f40bb74cbef1bd08015',
  '0b76fda7b9ada4e47434912e18b6ae2fc483a228cf2e31affb7d73ee6b7898ac',
  'c059eed101aae8544acb5abffe88e2cfd1c3cb079227b1bf017bab49c8fbd1ae',
]);

function sha256(s) { return crypto.createHash('sha256').update(String(s), 'utf8').digest('hex'); }

function assertLineHashes() {
  const drift = [];
  for (const k of Object.keys(LINES)) if (LINE_HASHES[k] !== sha256(LINES[k])) drift.push(k);
  if (Object.keys(LINE_HASHES).length !== Object.keys(LINES).length) drift.push('key set');
  EXAMPLES.forEach((e, i) => { if (EXAMPLE_HASHES[i] !== sha256(e)) drift.push(`EXAMPLE ${i + 1}`); });
  if (EXAMPLE_HASHES.length !== EXAMPLES.length) drift.push('example count');
  if (drift.length) throw new Error('doorLines.js: APPROVED COPY DRIFT (R-44.21, hash-carried). An edit to a founder byte is a FRESH VETO: ' + drift.join(', '));
  return true;
}
assertLineHashes();

// One slot value as text, or null when it is not a usable string or number.
function slot(v) {
  try {
    if (typeof v === 'number' && Number.isFinite(v)) return String(v);
    if (typeof v === 'string' && v.trim()) return v.trim();
    return null;
  } catch (_e) { return null; }
}

// render(key, values): the template with every {slot} filled. TOTAL: an unknown key, a missing or
// unusable value, or anything thrown yields null. Values are never re-worded, only placed.
function render(key, values) {
  try {
    if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(LINES, key)) return null;
    const vals = (values && typeof values === 'object') ? values : {};
    let missing = false;
    const out = LINES[key].replace(/\{([a-z ]+)\}/g, (_m, name) => {
      const s = slot(vals[name]);
      if (s === null) { missing = true; return ''; }
      return s;
    });
    return missing ? null : out;
  } catch (_e) { return null; }
}

// Byte 13, both lanes: the invoice sentence. No client: " for {client}" is dropped, as V1 always did.
function invoiceReady(number, client) {
  try {
    const n = slot(number);
    if (n === null) return null;
    const c = slot(client);
    if (c === null) return LINES.B13.replace(' for {client}', '').replace('{number}', n);
    return render('B13', { number: n, client: c });
  } catch (_e) { return null; }
}

// Byte 8 has repeated slots, so it is rendered by position: the name she used, then exactly TWO
// candidates, each a name and a full-month date. Anything else is null (the door stands aside).
function twoClients(name, candidates) {
  try {
    const n = slot(name);
    if (n === null || !Array.isArray(candidates) || candidates.length !== 2) return null;
    const parts = candidates.map((x) => [slot(x && x.name), slot(x && x.date)]);
    if (parts.some(([a, b]) => a === null || b === null)) return null;
    const fill = [n, parts[0][0], parts[0][1], parts[1][0], parts[1][1]];
    let i = 0;
    return LINES.B8.replace(/\{(name|date)\}/g, () => fill[i++]);
  } catch (_e) { return null; }
}

// Byte 10's {numbers}: joined with " · ", the founder's own separator (D3, D6 after c-44.5).
function invoiceNumbers(client, numbers) {
  try {
    if (!Array.isArray(numbers) || numbers.length < 2) return null;
    const list = numbers.map(slot);
    if (list.some((x) => x === null)) return null;
    return render('B10', { client, n: list.length, numbers: list.join(' · ') });
  } catch (_e) { return null; }
}

// The keys the door may name for a line it spoke, beside the lifecycle bytes it reads from LINES.
const DOOR_KEYS = Object.freeze(Object.keys(LINES).filter((k) => k !== 'LEFTOVER'));

module.exports = { LINES, EXAMPLES, LINE_HASHES, EXAMPLE_HASHES, DOOR_KEYS, sha256, assertLineHashes, render, invoiceReady, twoClients, invoiceNumbers };
