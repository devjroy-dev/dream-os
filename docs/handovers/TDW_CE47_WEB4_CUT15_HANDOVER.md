# TDW · CE-47 · WEB-4 · CUT 15 HANDOVER · the starter packages say no "bride" (dream-os)

Cut at dream-os `eb6b51c`, 4 October 2026. Rung **b260**. No migration, no SQL. (Cut 13 rides server train 1; this
cut touches none of its paths and re-stamps by cmp if the train lands first.)

## What changes, for NEW copies only
A new vendor's starter packages (db/seeds/package_seeds.json, copied by src/lib/vendor/packageSeeds.js) no longer say
"bride" or "bridal" (the founder's rule: the word in any form). The words, as the chair accepted them:
- makeup: "One function", "Every function, with a trial", "Wedding party makeup"; hairstylist the same, with
  "Wedding party hair"; jewellery "Wedding set made to order"; designer "Wedding outfits made to order, as one set";
- descriptions: "your wedding makeup", "a wedding set", "your wedding set";
- line items speak to "you" (People: "you", "you and up to 4 family members"; Trial: "1 trial for you"; Time:
  "... for you and ..."; Arrival: "before you must be ready"); the venue's room is "a getting-ready room".
HOW: the JSON is still a fresh parse of the founder's source document (db/seeds/package_seeds.source.txt, unchanged). The
parser (src/lib/vendor/packageSeedParse.js) gains one named step, RENAMED and newCopyWords/newCopyDetail, applied to the
name, description and line-item detail it writes. `source_name` keeps the source's words: the record of the founder's
document (the chair's option 1), never copied to a vendor and never shown, and the key DEFAULT_BY_SECTION reads, so each
craft's default package is unchanged.
EXISTING vendors' packages are theirs: ensureSeeded never re-seeds a vendor already seeded; no migration rewrites them.

## Proven
b260 14/0: no name, description or line-item word of any craft says bride, bridal, couple or groom (source_name
excluded, and the cell says why); source_name still the source's; a new vendor's copies carry the new names (makeup, hair,
jewellery, designer, the venue room; ensureSeeded driven); an existing vendor gets nothing inserted or updated; every field
but name, description and detail byte-equal to the base eb6b51c, and every changed field was one that said the word; two
mutations. Clean tip: red.
b81 56/0, four cells amended by label: 1.8 / 1.9 / 1.11 apply the parser's named step to the source before the verbatim
comparison (every other byte still held to the source); M9's target follows the new name line. 1.1 (the JSON equals a
fresh parse of the source) unchanged and green.
Differential over every reader of the seeds and the parser, and the source walkers (29 benches), engine built both sides:
exits identical; output moved only in b81's labelled cells.
