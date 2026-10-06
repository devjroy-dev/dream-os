// src/lib/papers/csv.js · CE-47 · PRO · P1 · CSV that Excel opens cleanly: a UTF-8 mark, CRLF lines, every cell quoted
// when it holds a comma, quote or line break. A cell starting with = + - @ is prefixed with ' so a spreadsheet never
// runs it as a formula (a client name is typed by people outside TDW).
const cell = (v) => { let s = v === null || v === undefined ? '' : String(v); if (/^[=+\-@]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = "'" + s; return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };
const toCsv = (header, rows) => '\uFEFF' + [header, ...rows].map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
module.exports = { toCsv, cell };
