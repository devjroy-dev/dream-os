# P1 · the ear table · LC-Victor · CE-44

- dream-os tip: `72db66931b7338b83a2f2a6a47d29a3fc833a25a`
- generated (UTC): 2026-09-19T16:12:50.842Z
- seats: C1 deepseek/deepseek-v4-flash hears the vendor · C2 anthropic/claude-haiku-4-5-20251001 hears the vendor · C3 deepseek/deepseek-v4-flash hears Victor's stored relay (control)
- fixtures (from the corpus file): 9888294440 agent d02c7a9a-8622-4543-aa40-13d0911faf9b
- FINGERPRINT user_rows=308 with_relay=100 earliest_utc=2026-06-23T19:16:29.981839 latest_utc=2026-09-18T09:35:00.505712
- rows: 60 fixture (most recent first) + 7 card
- usage: C1 67 calls, 13703 in / 7749 out tokens · C2 67 calls, 65895 in / 8785 out tokens · C3 21 calls, 4620 in / 3225 out tokens

The `founder` column is empty: it is his, for what he meant.

| # | source | lane | sentence as sent | candidate | heard | route | act | client_as_spoken | amount_rupees | date | milestone | missing | advice_part | founder |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | fixture | web | yes, raise it and send me the pdf | C1 deepseek-v4-flash | (the sentence) | task | invoice |  |  |  |  | client, amount, milestone, date | false |  |
| 1 | fixture | web | yes, raise it and send me the pdf | C2 claude-haiku-4-5-20251001 | (the sentence) | task | invoice |  |  |  |  | invoice_reference, new_amount | false |  |
| 1 | fixture | web | yes, raise it and send me the pdf | C3 deepseek-v4-flash | Raise invoice for Swati Test: wedding 22 February 2027, fee Rs 80,000, full payment received. Once it's up, send the PDF to dev. | task | invoice | Swati Test | 80000 | 2027-02-22 |  |  | false |  |
| 2 | fixture | web | give swati test invoice | C1 deepseek-v4-flash | (the sentence) | task | invoice | swati |  |  |  |  | false |  |
| 2 | fixture | web | give swati test invoice | C2 claude-haiku-4-5-20251001 | (the sentence) | task | invoice | swati |  |  |  |  | false |  |
| 2 | fixture | web | give swati test invoice | C3 deepseek-v4-flash | Pull the Swati Test invoice — the full details: fee amount, due dates, payment status and invoice number. | neither | none |  |  |  |  |  | false |  |
| 3 | fixture | web | Add Meera as a confirmed client, fee 60,000 | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed | Meera | 60000 |  |  |  | false |  |
| 3 | fixture | web | Add Meera as a confirmed client, fee 60,000 | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed | Meera | 60000 |  |  |  | false |  |
| 3 | fixture | web | Add Meera as a confirmed client, fee 60,000 | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 4 | fixture | web | full | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  | vendor message content | false |  |
| 4 | fixture | web | full | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | message | false |  |
| 4 | fixture | web | full | C3 deepseek-v4-flash | Swati Test — log full payment: Rs 56,000 received 18 September 2026. This closes the invoice; fee is now paid in full (advance Rs 24,000 + remainder Rs 56,000 = Rs 80,000). ⏎ Swati Test — clear pending to nil. Invoice closed. ⏎ Swati Test — pending 0. Invoice closed. ⏎ Swati Test — Rs 0 pending. Invoice closed. | task | milestone_paid | Swati Test | 56000 | 2026-09-18 | remainder / full payment |  | false |  |
| 5 | fixture | web | Swati Test paid the remainder today | C1 deepseek-v4-flash | (the sentence) | task | milestone_paid | Swati Test | 0 |  | remainder |  | false |  |
| 5 | fixture | web | Swati Test paid the remainder today | C2 claude-haiku-4-5-20251001 | (the sentence) | task | milestone_paid | Swati Test |  |  |  |  | false |  |
| 5 | fixture | web | Swati Test paid the remainder today | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 6 | fixture | web | Swati Test paid the middle payment on 18 September | C1 deepseek-v4-flash | (the sentence) | task | milestone_paid | Swati Test |  | 2025-09-18 | middle payment |  | false |  |
| 6 | fixture | web | Swati Test paid the middle payment on 18 September | C2 claude-haiku-4-5-20251001 | (the sentence) | task | milestone_paid | Swati Test |  | 2024-09-18 | middle payment |  | false |  |
| 6 | fixture | web | Swati Test paid the middle payment on 18 September | C3 deepseek-v4-flash | Swati Test — log middle payment: Rs 26,667, received 18 September 2026. This is the 33.33% milestone payment on the Rs 80,000 fee for the wedding 22 February 2027. | task | milestone_paid | Swati Test | 26667 | 2026-09-18 | 33.33% milestone payment |  | false |  |
| 7 | fixture | web | "One note for you: the phone number flagged an older binder — a Verma reception from July where Swati was assigned crew. Different event, different Swati. I left that one alone — just confirm that's right." | C1 deepseek-v4-flash | (the sentence) | neither | note | Verma |  |  |  |  | true |  |
| 7 | fixture | web | "One note for you: the phone number flagged an older binder — a Verma reception from July where Swati was assigned crew. Different event, different Swati. I left that one alone — just confirm that's right." | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | note | Verma |  |  |  | date_of_verma_reception | true |  |
| 7 | fixture | web | "One note for you: the phone number flagged an older binder — a Verma reception from July where Swati was assigned crew. Different event, different Swati. I left that one alone — just confirm that's right." | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 8 | fixture | web | Swati Test, phone +918595356978. Wedding date 22 February 2027. Fee quoted Rs 80,000, package Photographs and film. The advance arrived today. | C1 deepseek-v4-flash | (the sentence) | task | advance_paid | Swati Test | 80000 | 2027-02-22 | advance |  | false |  |
| 8 | fixture | web | Swati Test, phone +918595356978. Wedding date 22 February 2027. Fee quoted Rs 80,000, package Photographs and film. The advance arrived today. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | advance_paid | Swati Test | 80000 | 2027-02-22 |  |  | false |  |
| 8 | fixture | web | Swati Test, phone +918595356978. Wedding date 22 February 2027. Fee quoted Rs 80,000, package Photographs and film. The advance arrived today. | C3 deepseek-v4-flash | Update Swati Test to confirmed booking: phone +918595356978, wedding 22 February 2027, fee Rs 80,000 (Photographs and film package). Raise invoice against this booking. Advance Rs 80,000 confirmed received today — log as paid against the invoice. | task | booking_confirmed | Swati Test | 80000 | 2027-02-22 |  |  | false |  |
| 9 | fixture | web | Confirm the booking for Swati Test with the advance received today. | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed | Swati Test |  |  |  |  | false |  |
| 9 | fixture | web | Confirm the booking for Swati Test with the advance received today. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed | Swati Test |  |  |  | advance_amount | false |  |
| 9 | fixture | web | Confirm the booking for Swati Test with the advance received today. | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 10 | fixture | web | Move Dholakia to 21 September 2026. | C1 deepseek-v4-flash | (the sentence) | task | edit_event | Dholakia |  | 2026-09-21 |  |  | false |  |
| 10 | fixture | web | Move Dholakia to 21 September 2026. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | edit_event | Dholakia |  | 2026-09-21 |  |  | false |  |
| 10 | fixture | web | Move Dholakia to 21 September 2026. | C3 deepseek-v4-flash | Move Dholakia wedding from 22 September to 21 September 2026. | task | edit_event | Dholakia |  | 2026-09-21 |  |  | false |  |
| 11 | fixture | whatsapp | Khanna wedding is confirmed for 5th December. Fee 60000. Follow up on 30 November. Raise the invoice | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed | Khanna | 60000 | 2025-12-05 |  |  | false |  |
| 11 | fixture | whatsapp | Khanna wedding is confirmed for 5th December. Fee 60000. Follow up on 30 November. Raise the invoice | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed | Khanna wedding | 60000 | 2024-12-05 |  |  | false |  |
| 11 | fixture | whatsapp | Khanna wedding is confirmed for 5th December. Fee 60000. Follow up on 30 November. Raise the invoice | C3 deepseek-v4-flash | Log Khanna wedding confirmed booking: 5 December 2026, fee Rs 60,000. Raise invoice against this. Follow-up reminder 30 November 2026. Once the invoice is in, tell me the number. | task | invoice | Khanna wedding | 60000 | 2026-12-05 |  |  | false |  |
| 12 | fixture | whatsapp | New. | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 12 | fixture | whatsapp | New. | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | message content | false |  |
| 12 | fixture | whatsapp | New. | C3 deepseek-v4-flash | Log new client: Tandon, wedding 14 November 2026, fee ₹40,000. Raise invoice for ₹40,000 against this wedding. Set follow-up 1 November. Confirmed booking. | task | booking_confirmed | Tandon | 40000 | 2026-11-14 |  |  | false |  |
| 13 | fixture | whatsapp | Tandon wedding is confirmed for 14 November 2026. Fee 40000, follow up on 1 November. Raise the invoice | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed | Tandon |  | 2026-11-14 |  |  | false |  |
| 13 | fixture | whatsapp | Tandon wedding is confirmed for 14 November 2026. Fee 40000, follow up on 1 November. Raise the invoice | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed | Tandon wedding | 40000 | 2026-11-14 |  |  | false |  |
| 13 | fixture | whatsapp | Tandon wedding is confirmed for 14 November 2026. Fee 40000, follow up on 1 November. Raise the invoice | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 14 | fixture | web | Move Dholakia to 22 September 2026. | C1 deepseek-v4-flash | (the sentence) | task | edit_event | Dholakia |  | 2026-09-22 |  |  | false |  |
| 14 | fixture | web | Move Dholakia to 22 September 2026. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | edit_event | Dholakia |  | 2026-09-22 |  |  | false |  |
| 14 | fixture | web | Move Dholakia to 22 September 2026. | C3 deepseek-v4-flash | Move Dholakia wedding from 21 September to 22 September 2026. | task | edit_event | Dholakia |  | 2026-09-22 |  |  | false |  |
| 15 | fixture | web | Just where it went | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 15 | fixture | web | Just where it went | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  |  |  | what item or payment, client name | false |  |
| 15 | fixture | web | Just where it went | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 16 | fixture | web | devjroy@gmail.com | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 16 | fixture | web | devjroy@gmail.com | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor message content | false |  |
| 16 | fixture | web | devjroy@gmail.com | C3 deepseek-v4-flash | Raise invoice for Dholakia: wedding shoot 21 September 2026, Rs 50,000, payment due 19 September 2026. Send to devjroy@gmail.com. | task | invoice | Dholakia | 50000 | 2026-09-21 |  |  | false |  |
| 17 | fixture | web | Give pdf | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 17 | fixture | web | Give pdf | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | complete vendor message | false |  |
| 17 | fixture | web | Give pdf | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 18 | fixture | web | Give it here | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 18 | fixture | web | Give it here | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor message | false |  |
| 18 | fixture | web | Give it here | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 19 | fixture | web | Create an invoice for dholakia | C1 deepseek-v4-flash | (the sentence) | task | invoice | dholakia |  |  |  |  | false |  |
| 19 | fixture | web | Create an invoice for dholakia | C2 claude-haiku-4-5-20251001 | (the sentence) | task | invoice | dholakia |  |  |  |  | false |  |
| 19 | fixture | web | Create an invoice for dholakia | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 20 | fixture | web | Log q new booking. Dholakia for 21st September | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed | Dholakia |  | 2025-09-21 |  | event_type, venue, package | false |  |
| 20 | fixture | web | Log q new booking. Dholakia for 21st September | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed | Dholakia |  | 2025-09-21 |  |  | false |  |
| 20 | fixture | web | Log q new booking. Dholakia for 21st September | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 21 | fixture | web | 50k, confirmed booking. No advance. Full payment on 19th September | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed |  | 50000 | 2024-09-19 |  | client, milestone | false |  |
| 21 | fixture | web | 50k, confirmed booking. No advance. Full payment on 19th September | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed |  | 50000 | 2024-09-19 | Full payment | client_name | false |  |
| 21 | fixture | web | 50k, confirmed booking. No advance. Full payment on 19th September | C3 deepseek-v4-flash | Log new booking: Dholakia wedding shoot, 21 September 2026, Rs 50,000 confirmed. Full payment due 19 September 2026 — no advance, single payment on date. Stage: confirmed booking. | task | booking_confirmed | Dholakia | 50000 | 2026-09-21 | Full payment |  | false |  |
| 22 | fixture | web | New event 21st September dholakia wedding shoot | C1 deepseek-v4-flash | (the sentence) | task | edit_event | dholakia |  | 2025-09-21 |  |  | false |  |
| 22 | fixture | web | New event 21st September dholakia wedding shoot | C2 claude-haiku-4-5-20251001 | (the sentence) | task | edit_event | dholakia |  | 2024-09-21 |  |  | false |  |
| 22 | fixture | web | New event 21st September dholakia wedding shoot | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 23 | fixture | web | Block 20th september. Personal. | C1 deepseek-v4-flash | (the sentence) | task | block_date |  |  | 2025-09-20 |  |  | false |  |
| 23 | fixture | web | Block 20th september. Personal. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | block_date | Personal |  | 2024-09-20 |  |  | false |  |
| 23 | fixture | web | Block 20th september. Personal. | C3 deepseek-v4-flash | Block 20 September 2026 as personal time — day is unavailable for bookings or client work. | task | block_date |  |  | 2026-09-20 |  |  | false |  |
| 24 | fixture | web | Am I free in 16th December | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 24 | fixture | web | Am I free in 16th December | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  | 2024-12-16 |  | year | false |  |
| 24 | fixture | web | Am I free in 16th December | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 25 | fixture | whatsapp | Ask operator to check | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 25 | fixture | whatsapp | Ask operator to check | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor message content | false |  |
| 25 | fixture | whatsapp | Ask operator to check | C3 deepseek-v4-flash | Check if there are any incoming messages or responses from clients — particularly from Priya Mehta at 8757788550 after the advance reminder just sent. Let me know what came in. | neither | none | Priya Mehta |  |  |  |  | false |  |
| 26 | fixture | whatsapp | Did any message come in? | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 26 | fixture | whatsapp | Did any message come in? | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | message_content | false |  |
| 26 | fixture | whatsapp | Did any message come in? | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 27 | fixture | whatsapp | TDW dev440 ok | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 27 | fixture | whatsapp | TDW dev440 ok | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 27 | fixture | whatsapp | TDW dev440 ok | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 28 | fixture | whatsapp | Did she say anything? | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 28 | fixture | whatsapp | Did she say anything? | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor message | false |  |
| 28 | fixture | whatsapp | Did she say anything? | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 29 | fixture | whatsapp | Send it | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 29 | fixture | whatsapp | Send it | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor message content | false |  |
| 29 | fixture | whatsapp | Send it | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 30 | fixture | whatsapp | Send a message to priya mehta asking her to pay the advance | C1 deepseek-v4-flash | (the sentence) | task | relay | priya mehta |  |  |  |  | false |  |
| 30 | fixture | whatsapp | Send a message to priya mehta asking her to pay the advance | C2 claude-haiku-4-5-20251001 | (the sentence) | task | relay | priya mehta |  |  |  |  | false |  |
| 30 | fixture | whatsapp | Send a message to priya mehta asking her to pay the advance | C3 deepseek-v4-flash | Send a message to Priya Mehta at 8757788550 asking her to pay the advance for her quoted booking (Rs 42,000). | task | advance_paid | Priya Mehta | 42000 |  | advance |  | false |  |
| 31 | fixture | whatsapp | Add 8757788550 as phone number of priya mehta | C1 deepseek-v4-flash | (the sentence) | neither | none | priya mehta |  |  |  |  | false |  |
| 31 | fixture | whatsapp | Add 8757788550 as phone number of priya mehta | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | contact_info_update_capability | false |  |
| 31 | fixture | whatsapp | Add 8757788550 as phone number of priya mehta | C3 deepseek-v4-flash | Log Priya Mehta's phone number as 8757788550. She's the quoted lead from 10 September, Rs 42,000. | task | note | Priya Mehta | 42000 | 2024-09-10 |  |  | false |  |
| 32 | fixture | whatsapp | List all phone n umbers | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 32 | fixture | whatsapp | List all phone n umbers | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  |  |  | phone numbers | false |  |
| 32 | fixture | whatsapp | List all phone n umbers | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 33 | fixture | whatsapp | Any lead with that number | C1 deepseek-v4-flash | (the sentence) | search | lead |  |  |  |  | phone number | false |  |
| 33 | fixture | whatsapp | Any lead with that number | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  |  |  | phone number | false |  |
| 33 | fixture | whatsapp | Any lead with that number | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 34 | fixture | whatsapp | 8757788550 | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 34 | fixture | whatsapp | 8757788550 | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | message_content | false |  |
| 34 | fixture | whatsapp | 8757788550 | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 35 | fixture | whatsapp | Who is 8757788550m | C1 deepseek-v4-flash | (the sentence) | search | find | 8757788550m |  |  |  |  | false |  |
| 35 | fixture | whatsapp | Who is 8757788550m | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find | 8757788550m |  |  |  |  | false |  |
| 35 | fixture | whatsapp | Who is 8757788550m | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 36 | fixture | whatsapp | Do we have her number on the record? | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | true |  |
| 36 | fixture | whatsapp | Do we have her number on the record? | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  |  |  | client_name, specific_contact_detail | false |  |
| 36 | fixture | whatsapp | Do we have her number on the record? | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 37 | fixture | whatsapp | What's the status with priya mehta | C1 deepseek-v4-flash | (the sentence) | neither | none | priya mehta |  |  |  |  | false |  |
| 37 | fixture | whatsapp | What's the status with priya mehta | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find | priya mehta |  |  |  |  | false |  |
| 37 | fixture | whatsapp | What's the status with priya mehta | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 38 | fixture | whatsapp | Which mode is this | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 38 | fixture | whatsapp | Which mode is this | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | mode_clarification | false |  |
| 38 | fixture | whatsapp | Which mode is this | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 39 | fixture | whatsapp | Anything on the 19th September? | C1 deepseek-v4-flash | (the sentence) | search | date |  |  | 2025-09-19 |  |  | false |  |
| 39 | fixture | whatsapp | Anything on the 19th September? | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  | 2024-09-19 |  |  | false |  |
| 39 | fixture | whatsapp | Anything on the 19th September? | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 40 | fixture | whatsapp | Priya sachdeva? | C1 deepseek-v4-flash | (the sentence) | neither | none | Priya sachdeva |  |  |  |  | false |  |
| 40 | fixture | whatsapp | Priya sachdeva? | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find | Priya sachdeva |  |  |  |  | false |  |
| 40 | fixture | whatsapp | Priya sachdeva? | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 41 | fixture | whatsapp | Who are my new leads | C1 deepseek-v4-flash | (the sentence) | search | lead |  |  |  |  |  | false |  |
| 41 | fixture | whatsapp | Who are my new leads | C2 claude-haiku-4-5-20251001 | (the sentence) | search | lead |  |  |  |  |  | false |  |
| 41 | fixture | whatsapp | Who are my new leads | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 42 | fixture | web | Ask operator to check again | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 42 | fixture | web | Ask operator to check again | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor message | false |  |
| 42 | fixture | web | Ask operator to check again | C3 deepseek-v4-flash | Confirm Anjali Rao's invoice details: shoot date, total amount, and stage. Owner is asking me to verify. | search | invoice | Anjali Rao |  |  |  | shoot date, total amount, stage | false |  |
| 43 | fixture | web | When is anjali rao event | C1 deepseek-v4-flash | (the sentence) | search | date | anjali rao |  |  |  |  | false |  |
| 43 | fixture | web | When is anjali rao event | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find | anjali rao |  |  |  |  | false |  |
| 43 | fixture | web | When is anjali rao event | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 44 | fixture | web | Show the invoice here | C1 deepseek-v4-flash | (the sentence) | task | invoice |  |  |  |  | client name, invoice details | false |  |
| 44 | fixture | web | Show the invoice here | C2 claude-haiku-4-5-20251001 | (the sentence) | search | invoice |  |  |  |  |  | false |  |
| 44 | fixture | web | Show the invoice here | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 45 | fixture | web | What about 30500 | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  | message content, client | false |  |
| 45 | fixture | web | What about 30500 | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  | 30500 |  |  | context, vendor_message | false |  |
| 45 | fixture | web | What about 30500 | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 46 | fixture | web | What's anjali raos invoice worth | C1 deepseek-v4-flash | (the sentence) | neither | none | anjali rao |  |  |  |  | false |  |
| 46 | fixture | web | What's anjali raos invoice worth | C2 claude-haiku-4-5-20251001 | (the sentence) | search | invoice | anjali rao |  |  |  |  | false |  |
| 46 | fixture | web | What's anjali raos invoice worth | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 47 | fixture | web | Refresh | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 47 | fixture | web | Refresh | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 47 | fixture | web | Refresh | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 48 | fixture | web | New one | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 48 | fixture | web | New one | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | vendor_message | false |  |
| 48 | fixture | web | New one | C3 deepseek-v4-flash | New invoice: Anjali Rao (the new lead we just logged), shoot 16 December 2026, total ₹30,000. Log it now. | task | invoice | Anjali Rao | 30000 | 2026-12-16 |  |  | false |  |
| 49 | fixture | web | Anjali rao | C1 deepseek-v4-flash | (the sentence) | neither | none | Anjali rao |  |  |  |  | false |  |
| 49 | fixture | web | Anjali rao | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none | Anjali rao |  |  |  |  | false |  |
| 49 | fixture | web | Anjali rao | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 50 | fixture | web | Create an invoice for 30k for anjali rao. Shoot on 16rh December | C1 deepseek-v4-flash | (the sentence) | task | invoice | anjali rao | 30000 | 2025-12-16 |  |  | false |  |
| 50 | fixture | web | Create an invoice for 30k for anjali rao. Shoot on 16rh December | C2 claude-haiku-4-5-20251001 | (the sentence) | task | invoice | anjali rao | 30000 | 2024-12-16 |  |  | false |  |
| 50 | fixture | web | Create an invoice for 30k for anjali rao. Shoot on 16rh December | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 51 | fixture | web | Different anjali rao | C1 deepseek-v4-flash | (the sentence) | neither | none | anjali rao |  |  |  |  | false |  |
| 51 | fixture | web | Different anjali rao | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find | Anjali Rao |  |  |  | which Anjali Rao, contact details, event details | false |  |
| 51 | fixture | web | Different anjali rao | C3 deepseek-v4-flash | Log a new lead: Anjali Rao. Different person from the Anjali on file from 10 September. New lead, stage new. | task | lead | Anjali Rao |  |  |  |  | false |  |
| 52 | fixture | web | Create a new lead anjali rao | C1 deepseek-v4-flash | (the sentence) | task | lead | anjali rao |  |  |  |  | false |  |
| 52 | fixture | web | Create a new lead anjali rao | C2 claude-haiku-4-5-20251001 | (the sentence) | task | lead | anjali rao |  |  |  |  | false |  |
| 52 | fixture | web | Create a new lead anjali rao | C3 deepseek-v4-flash | Log a new lead: Anjali Rao. No other details yet. | task | lead | Anjali Rao |  |  |  |  | false |  |
| 53 | fixture | web | There's priya nair | C1 deepseek-v4-flash | (the sentence) | neither | none | priya nair |  |  |  |  | false |  |
| 53 | fixture | web | There's priya nair | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none | priya nair |  |  |  |  | false |  |
| 53 | fixture | web | There's priya nair | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 54 | fixture | web | I can't even see the clients name, in leads or clients anywhere. | C1 deepseek-v4-flash | (the sentence) | search | find |  |  |  |  | client name | false |  |
| 54 | fixture | web | I can't even see the clients name, in leads or clients anywhere. | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  |  |  | client_name | false |  |
| 54 | fixture | web | I can't even see the clients name, in leads or clients anywhere. | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 55 | fixture | web | I can't find it. Confirm with operator it exists. | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 55 | fixture | web | I can't find it. Confirm with operator it exists. | C2 claude-haiku-4-5-20251001 | (the sentence) | search | find |  |  |  |  | what item/record to search for | false |  |
| 55 | fixture | web | I can't find it. Confirm with operator it exists. | C3 deepseek-v4-flash | Confirm: is the Priya Sachdeva invoice filed? Haldi shoot 5 October 2026, ₹80,000 total, ₹24,000 advance due 20 September. Owner is looking for it in the system. | task | invoice | Priya Sachdeva | 80000 | 2026-10-05 | advance | invoice number, invoice status in system | false |  |
| 56 | fixture | web | Where's the invoice | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 56 | fixture | web | Where's the invoice | C2 claude-haiku-4-5-20251001 | (the sentence) | search | invoice |  |  |  |  | client_name, event_date | false |  |
| 56 | fixture | web | Where's the invoice | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 57 | fixture | whatsapp | Show the invoice here | C1 deepseek-v4-flash | (the sentence) | task | find |  |  |  |  | client, invoice identifier | false |  |
| 57 | fixture | whatsapp | Show the invoice here | C2 claude-haiku-4-5-20251001 | (the sentence) | search | invoice |  |  |  |  | client_name, event_date | false |  |
| 57 | fixture | whatsapp | Show the invoice here | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 58 | fixture | whatsapp | 20th september. Advance to be paid by 20th september | C1 deepseek-v4-flash | (the sentence) | task | advance_paid |  |  | 2025-09-20 |  | client, amount | false |  |
| 58 | fixture | whatsapp | 20th september. Advance to be paid by 20th september | C2 claude-haiku-4-5-20251001 | (the sentence) | task | advance_paid |  |  | 2024-09-20 |  | amount_rupees | false |  |
| 58 | fixture | whatsapp | 20th september. Advance to be paid by 20th september | C3 deepseek-v4-flash | New invoice: Priya Sachdeva, haldi shoot 5 October 2026, total ₹80,000. Advance ₹24,000 due 20 September. Log it now. | task | invoice | Priya Sachdeva | 80000 | 2026-10-05 | advance |  | false |  |
| 59 | fixture | whatsapp | Create an invoice for priya sachdeva. Haldi shoot on 5th October. Total amount agreed rs 80000. Advance to be paid 30 percent by 10th September. | C1 deepseek-v4-flash | (the sentence) | task | invoice | priya sachdeva | 80000 | 2024-10-05 | advance |  | false |  |
| 59 | fixture | whatsapp | Create an invoice for priya sachdeva. Haldi shoot on 5th October. Total amount agreed rs 80000. Advance to be paid 30 percent by 10th September. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | invoice | priya sachdeva | 80000 | 2024-10-05 | Advance 30 percent by 10th September |  | false |  |
| 59 | fixture | whatsapp | Create an invoice for priya sachdeva. Haldi shoot on 5th October. Total amount agreed rs 80000. Advance to be paid 30 percent by 10th September. | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 60 | fixture | whatsapp | Draft a message to priya quoting 80k | C1 deepseek-v4-flash | (the sentence) | neither | none | priya | 80000 |  |  |  | false |  |
| 60 | fixture | whatsapp | Draft a message to priya quoting 80k | C2 claude-haiku-4-5-20251001 | (the sentence) | task | quote_send | priya | 80000 |  |  |  | false |  |
| 60 | fixture | whatsapp | Draft a message to priya quoting 80k | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 61 | card |  | Khanna paid the middle payment on 18 September. | C1 deepseek-v4-flash | (the sentence) | task | milestone_paid | Khanna |  | 2025-09-18 | middle payment |  | false |  |
| 61 | card |  | Khanna paid the middle payment on 18 September. | C2 claude-haiku-4-5-20251001 | (the sentence) | task | milestone_paid | Khanna | 0 | 2024-09-18 | middle payment | amount_rupees | false |  |
| 61 | card |  | Khanna paid the middle payment on 18 September. | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 62 | card |  | Swati Test paid the middle payment on 18 September | C1 deepseek-v4-flash | (the sentence) | task | milestone_paid | Swati Test |  | 2025-09-18 | middle payment |  | false |  |
| 62 | card |  | Swati Test paid the middle payment on 18 September | C2 claude-haiku-4-5-20251001 | (the sentence) | task | milestone_paid | Swati Test |  | 2024-09-18 | middle payment |  | false |  |
| 62 | card |  | Swati Test paid the middle payment on 18 September | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 63 | card |  | Swati Test paid the remainder today | C1 deepseek-v4-flash | (the sentence) | task | milestone_paid | Swati Test |  |  | remainder |  | false |  |
| 63 | card |  | Swati Test paid the remainder today | C2 claude-haiku-4-5-20251001 | (the sentence) | task | milestone_paid | Swati Test |  |  |  |  | false |  |
| 63 | card |  | Swati Test paid the remainder today | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 64 | card |  | full | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | false |  |
| 64 | card |  | full | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | complete_message | false |  |
| 64 | card |  | full | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 65 | card |  | Add Meera as a confirmed client, fee 60,000 | C1 deepseek-v4-flash | (the sentence) | task | booking_confirmed | Meera | 60000 |  |  |  | false |  |
| 65 | card |  | Add Meera as a confirmed client, fee 60,000 | C2 claude-haiku-4-5-20251001 | (the sentence) | task | booking_confirmed | Meera | 60000 |  |  |  | false |  |
| 65 | card |  | Add Meera as a confirmed client, fee 60,000 | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 66 | card |  | tell Priya we're free on the 22nd | C1 deepseek-v4-flash | (the sentence) | task | date | Priya |  | 2026-08-22 |  |  | false |  |
| 66 | card |  | tell Priya we're free on the 22nd | C2 claude-haiku-4-5-20251001 | (the sentence) | task | relay | Priya |  | 2024-01-22 |  | year - assumed current/next occurrence | false |  |
| 66 | card |  | tell Priya we're free on the 22nd | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
| 67 | card |  | how should i price my package. i want to increase | C1 deepseek-v4-flash | (the sentence) | neither | none |  |  |  |  |  | true |  |
| 67 | card |  | how should i price my package. i want to increase | C2 claude-haiku-4-5-20251001 | (the sentence) | neither | none |  |  |  |  | package details, current pricing, target increase amount or percentage | true |  |
| 67 | card |  | how should i price my package. i want to increase | C3 deepseek-v4-flash | (no relay stored for this turn) | NO_RELAY |  |  |  |  |  |  |  |  |
