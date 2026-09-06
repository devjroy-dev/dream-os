# G13_R5_VETO — THE UTILITY LEAD ALERT (F-40.176, R-40.72 amended)

**NOTHING HERE IS FILED OR SHIPPED.** These are bodies for the founder's veto. On a `yes`, the chosen body is submitted to Meta as `tdw_lead_alert_utility`, and `TEMPLATE_KEY` in `src/lib/vendor/weddingLeadAlert.js` re-points to it **on approval and not before**.

---

## WHY THIS EXISTS — the walk's own evidence

Two alerts went out. Dev Roy's arrived. **Swati's was dropped by Meta with `131049`** — the marketing throttle, which silently declines a MARKETING template to a user who has not engaged recently.

Dev Roy had messaged the number that day. Swati had not.

**That is the shape of the failure and why it cannot stand:** the throttle hits hardest exactly the vendors who most need the alert — the quiet ones, who are not already in a thread with us. A notification system that reaches only the people already paying attention is not a notification system.

`lead_alert_basic` is MARKETING **by category**, and no wording changes that. The fix is a Utility template, which is what a lead alert actually is: a transactional notice about something that just happened on the vendor's own account.

## THE RULE EVERY BODY BELOW OBEYS

The estate's own filing rule, which `demo_lead_alert`'s header records: variables numbered **1..n with no gaps**, the body **neither begins nor ends with a variable**, **no two variables adjacent**, **single line, no `\n`**. A draft that breaks it is filed against our own rule and wastes a review cycle.

---

## ROW 1 — THE BODY. Choose (a), (b), or (c).

**(a) — three variables, drop-in re-point** *(recommended)*

> Hi {{1}}, a couple just enquired about your work for their {{2}} wedding through your page on The Dream Wedding. Open your Leads to see it: {{3}} — reply here if you need a hand.

Same three variables in the same order as `lead_alert_basic` (`vendor_name`, `month`, `leads_link`), so the re-point is **one line** — `TEMPLATE_KEY` and nothing else. `monthPhrase(null)` still yields *upcoming*, so a blank month reads "their upcoming wedding".

**(b) — two variables, leanest Utility claim**

> Hi {{1}}, you have a new enquiry waiting from your wedding page on The Dream Wedding. Open your Leads to see it: {{2}} — reply here if you need a hand.

Drops the month. Makes the smallest possible claim, which is the shape Utility review treats most kindly. **Costs more than one line to adopt**: `variables` shrinks to two and the `vars:` array at the call site must lose `monthPhrase(weddingDate)`. Honest about that rather than pretending both are equal.

**(c) — the chair's phrasing, filled out to the rule**

> Hi {{1}}, there is a new enquiry from your wedding page on The Dream Wedding. Open your Leads room to see it: {{2}} — reply here if you need a hand.

The relay's own words. Two variables, same adoption cost as (b).

## ROW 2 — THE NAME

`tdw_lead_alert_utility` — parallel to `tdw_lead_alert_basic`, and says what distinguishes it.

## ROW 3 — THE LINE AND CATEGORY

**vendor** line, category **UTILITY**. The line is unchanged; only the category moves, and the category is the entire point.

---

## WHAT STAYS TRUE WHATEVER IS CHOSEN

- **Identity-free.** Not one variable carries the guest. She is a stranger to every vendor on a roll except the owner, and that is a property of the design rather than of the wording.
- **`lead_alert_basic` stays live until Meta approves.** The throttle is named in the handover so the gap is known rather than discovered. A vendor missing an alert still has her **lead**, which is written first and is never capped.
- **`lead_alerts` rows are written either way** (0141, F-40.177) — `template_key` is stored per row, **not inferred from the source**, so rows written before and after the re-point stay truthful about what was actually sent.

## THE ONE THING I WOULD FLAG

Meta decides category at review and **can re-classify a submission it judges promotional**. If it comes back MARKETING, the throttle comes back with it and this cure has not landed — so the walk that closes F-40.176 is **not** the approval mail, it is a real alert arriving at a vendor who has not messaged us in a fortnight. Worth naming now so nobody reads an approval as the finish.


---

# THE BACKFILL — F-40.179's rows already written

**Founder-run, in the Supabase editor, AFTER 0141 and the ZIP.** One statement per paste (R-40.31).

**SQL-PROVENANCE (R-40.27).** Writes `public.leads` only. Columns `:675`; constraints `:1666-1672` — `leads_pkey` and `leads_wedding_date_precision_check`. **Neither constrains `phone`**, so no row can violate anything. `wedding_id` is witnessed by `0133:74-75`, not by the snapshot.

**⚠ THE DEDUPE KEY IS THE THING BEING REWRITTEN.** `createLead` dedupes on `(vendor_id, phone)`. Normalising an existing row changes that key, so a guest who enquired twice under two shapes could collapse into a collision. **Read block 1 before running block 2.**

## Block 1 of 2 — READ ONLY. What would change, and whether anything collides.

```sql
-- Every wedding-page lead whose phone is not E.164, and whether normalising it
-- would collide with a row that vendor already holds.
with bare as (
  select l.id, l.vendor_id, l.phone,
         case when l.phone ~ '^[0-9]{10}$' then '+91' || l.phone
              when l.phone ~ '^[0-9]{11,}$' then '+' || l.phone
              else l.phone end as would_become
    from public.leads l
   where l.source in ('wedding_guest', 'wedding_team')
     and l.phone is not null
     and l.phone !~ '^\+'
     and l.deleted_at is null
)
select b.id, b.vendor_id, b.phone, b.would_become,
       exists (select 1 from public.leads o
                where o.vendor_id = b.vendor_id
                  and o.phone = b.would_become
                  and o.id <> b.id
                  and o.deleted_at is null) as would_collide
  from bare b
 order by would_collide desc, b.vendor_id;
```

**If `would_collide` is true on any row, STOP and paste it.** That row is one human already present twice, and merging two leads is a decision, not a cure.

## Block 2 of 2 — the write. Run only if every `would_collide` is false.

```sql
update public.leads
   set phone = case when phone ~ '^[0-9]{10}$' then '+91' || phone
                    else '+' || phone end
 where source in ('wedding_guest', 'wedding_team')
   and phone is not null
   and phone !~ '^\+'
   and deleted_at is null
returning id, vendor_id, phone;
```

`returning` is the point: a blind `update` that reports no rows is F-06.143's own disease, and this file will not ship one. The rows it prints are the rows it changed.
