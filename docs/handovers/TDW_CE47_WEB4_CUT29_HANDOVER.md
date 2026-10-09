# TDW · CE-47 · WEB-4 · CUT 29 HANDOVER · the schema register PAIR regen of 8 October 2026 (dream-os)

Cut at dream-os `5058d8c` (server train 15 landed), 8 October 2026, for server train 16, AFTER PRO P3 (whose 0210 this
cut records). No migration of mine. Rung: b300 (the
chair's number). The register rungs and ten other benches are amended by label. src changes in one file only
(leadSerializer.js, three census entries, the chair's ruling).

## 1 The bytes
The founder ran db/queries/public_schema_dump.sql and the three sections of public_constraints_dump.sql on the live
database on 8 October 2026 at 20:05 IST, with the row limit off. The database stood at ladder 0220, with 0203.

| File | Rows | Guard | sha256 |
|---|---|---|---|
| cols.csv | 157 tables, 1,839 columns | 157 = 157 | cbe1c3d5… |
| s1.csv (checks, unique, primary keys) | 616 | 616 = 616 | 4ff8a0b1… |
| s2.csv (foreign keys) | 251 | 251 = 251 | 776b5ca1… |
| s3.csv (indexes) | 503 | 503 = 503 | ea9e99f7… |

They are kept in the repo at docs/db/snapshots/2026-10-08/, so that anyone can re-run the regen, and b300 does.

## 2 The regen, through the real pipe
```
node db/queries/format_public_schema.js docs/db/snapshots/2026-10-08/cols.csv docs/db/PUBLIC_SCHEMA.md 2026-10-08 0220 5058d8c
node db/queries/append_constraints_to_public_schema.js docs/db/snapshots/2026-10-08/s1.csv s2.csv s3.csv 2026-10-08 0220 5058d8c
```
- Every guard passes. A second run gives the same bytes.
- Ladder tip 0220, as ruled. 0220 (vendor_first_builds, 7 columns) is applied and is in the bytes.
- The regen starts from 5058d8c's document, which was taken at 0168 (17 September, 101 tables). It went 45
  migrations stale, counted with PRO's 0210 in the ladder. It now carries 157 tables.
- Its three hand-written staleness notes (0169/0170, 0171, 0180, 0182) are gone, because the document now carries
  those columns.

## 3 The register is paid
All sixteen records are removed, as ruled ("removed at the next PAIR regen"): 0183, 0204, 0196, 0200, 0208, 0209, 0205,
0195, 0197, 0198, 0211, 0218, 0201, 0202, 0219 and 0203.
- Every table, column and constraint they name is in the new bytes. This was checked record by record before removal.
- Functions and triggers (0201, 0202, 0211's pro_gear_accept and 0203) are never in the snapshot, by design.
- The records' words stay in git at 5058d8c.

## 3b One record stands after the regen: 0210 (PRO P3), the chair's word of 8 October
PRO P3 brings 0210 (pro_brands_trends). It lands below tip 0220, and the founder's CSVs do not carry it.
- The bytes: 0210_pro_brands_trends.sql, sha256 2615ae76…96c4 (from PRO P3 SRV 23ce2f00…), equal to the chair's, read
  whole.
- What it does: it creates `pro_brands`, `pro_pitches`, `pro_kits` and `pro_trend_briefs`, each with RLS on and the
  four service_role grants in the transaction. It creates `pro_pitch_record` (invoker rights; EXECUTE to service_role
  alone). It alters no existing table.
- stale_for names the four tables. State: OWED until the next PAIR regen.
- The register holds exactly this one record, and the document's header lists it.
- 0210's file rides PRO P3's package, not this one. The document was generated with 0210 beside it, so on 5058d8c
  ALONE b15 and b300 2.1, 2.2, 5.2 and 5.3 are red (the record names 0210 before its file is there). On the combined
  tree (PRO P3, then this cut) all are green. Train 16 runs PRO P3 first.

## 4 The leads census (b36, the chair's ruling of 8 October 2026)
The snapshot showed leg A three `leads` columns the 0168 snapshot could not see: counterparty_ig_id (0173), consent_at
and consent_text_version. They are added to LEADS_COLUMN_CENSUS in src/lib/vendor/leadSerializer.js as PRESENT IN THE
SCHEMA, ON NO WIRE, as for binder_id (F-43.73). WITHHELD_FIELDS is unchanged ({phone, email}). The comment names the
ruling. Nothing else in that file changes.

## 5 Proven
- **b300:** 22 passed, 0 failed on the combined tree.
  - §1: the four CSVs carry the chair's shas.
  - §2: the pipe, re-run in a scratch tree from 5058d8c's document, gives the committed document byte for byte.
  - §3: the sixteen paid records are gone (the sixteen 5058d8c held), and exactly one stands, 0210.
  - §6: 0210's record and what it says, with two mutations (a table left out of stale_for; the record removed).
  - §4: the header states what was run.
  - §5: four mutations, each of which reddens its cell: one table dropped from cols.csv (the formatter refuses); one
    foreign key dropped from s2.csv (the appender refuses); a paid record left in the register; a hand-edit.
- **Amended by label to the PAYMENT:**
  - b266, b267, b268 and b269: each cell that held a record now holds its payment (the record gone, the snapshot
    carrying what it named, its words in git at 5058d8c). Each mutation puts the record back, or takes a named table
    out of the snapshot.
  - b263 5.1, b261 6.3 and 6.4, and b230 1.6.
- **Amended by label to the new truth:**
  - b124 5.1, b141 7.1 and b150 1.11: the staleness notes are retired, and the snapshot carries 0171's, 0180's and
    0182's columns.
  - b07_f0789 §1.3 and §1.5: conversations has 15 columns, and `channel` is real since 0173. The canary is now a column
    that does not exist.
- **Fixed by the census:** b36 is 95/95.
- **Differential, base 5058d8c against the cut:** the 72 benches that read the register or the document, plus b36, b37,
  b39, b51 and b300. See the card for the exits.

## 6 The R-47.2 count query, corrected (the chair's note)
My (b) query printed no row for vendor_look_photos, which has no live rows, because GROUP BY prints nothing for an
empty set. Its own guard then read the missing row as a cap. The corrected query takes its two rows from a VALUES list
and counts through a LEFT JOIN, so it always returns two rows. It is in the relay of 8 October (R-47.2 (d), item 10).

## 7 R-47.1
| Old | New |
|---|---|
| (none) | No line that a vendor, partner, visitor or admin reads changes in this cut. The schema document is read by builders, not by any screen. |

The founder's lines: the review-request message stays word for word, by his decision of 8 October. Nothing else.

## 8 Walk card
There is nothing for the founder to walk. The proof is b300, which re-runs the regen from his bytes.
