// src/agent/noticeHead.js · TDW · CE-47 · WEB-4 cut 7 · THE VENDOR NOTICE'S HEAD, ONE HOME FOR THE COUPLE LANE AND THE WEBSITE.
// Moved verbatim from src/agent/engine.js (CE-46 ELZ-3 cut 1, the founder's words of 29 September 2026; F-44.227 rule 3: every
// notice names its line), with one addition: LINE_WORD.website = 'your website' (WEB-7's contract, 1 October 2026). engine.js
// requires it, so the couple lane's notices are byte for byte as before; lib/website/enquiry.js files its notice through it.
'use strict';

const LINE_WORD = Object.freeze({ whatsapp_shared: "TDW's WhatsApp", instagram: 'Instagram', whatsapp_own: 'your own number', website: 'your website' });   // website: CE-47 WEB-4 cut 7 (WEB-7's contract)
// The founder's phone form: +91 and the ten digits, 5-5 (+91 96257 59924). Anything that is not an Indian mobile keeps its digits
// behind a plus, ungrouped.
function formatPhone(p) {
  const d = String(p || '').replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) return `+91 ${d.slice(2, 7)} ${d.slice(7)}`;
  if (d.length === 10) return `+91 ${d.slice(0, 5)} ${d.slice(5)}`;
  return d ? `+${d}` : '';
}
// Rows 1 to 3 and 5 (no name): "New enquiry on {line} from {phone}" (Instagram: no phone). Row 4 (a name): "New enquiry from {name} on {line}".
function enquiryHead(name, cp) {
  const line = LINE_WORD[cp.channel] || LINE_WORD.whatsapp_shared;
  const n = typeof name === 'string' ? name.trim() : '';
  if (n) return `New enquiry from ${n} on ${line}`;
  const ph = cp.channel === 'instagram' ? '' : formatPhone(cp.phone);
  return ph ? `New enquiry on ${line} from ${ph}` : `New enquiry on ${line}`;
}

module.exports = { LINE_WORD, formatPhone, enquiryHead };
