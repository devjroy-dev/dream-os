-- db/seed/demo_vendor_seed.sql
-- Run ONCE to seed the shared demo vendor UUID with aspirational data.
-- This UUID is used for DreamAi context in all vendor demos.
--
-- DEMO VENDOR UUID: bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb (existing test vendor)
-- All demo DreamAi sessions point to this vendor's data.
-- The vendor app reads this data when tdw_vendor_demo_session is set.
--
-- Run from Supabase SQL editor.
-- Safe to re-run (uses INSERT ... ON CONFLICT DO NOTHING).

-- ── Aspirational Leads (20 leads — mix of states) ─────────────────────────
INSERT INTO leads (vendor_id, name, phone, wedding_date, wedding_city, budget_max, state, source, referrer_name, raw_message, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Ananya Sharma', NULL, NOW() + INTERVAL '8 months', 'Delhi', 250000, 'new', 'discover', NULL, 'Loved your work on TDW! Looking for bridal services for Nov wedding.', NOW() - INTERVAL '1 day'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Priya & Rohit', NULL, NOW() + INTERVAL '10 months', 'Gurgaon', 180000, 'new', 'instagram', NULL, 'Your portfolio is stunning. Can you share your packages?', NOW() - INTERVAL '2 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Meera Kapoor', NULL, NOW() + INTERVAL '6 months', 'Mumbai', 350000, 'quoted', 'referral', 'Divya Sharma', 'Divya recommended you highly. Need services for my September wedding.', NOW() - INTERVAL '4 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Kavya Nair', NULL, NOW() + INTERVAL '5 months', 'Bangalore', 120000, 'contacted', 'whatsapp', NULL, 'Hi! Saw your work. Available for August wedding in Bangalore?', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Simran Oberoi', NULL, NOW() + INTERVAL '12 months', 'Chandigarh', 200000, 'new', 'discover', NULL, 'Planning early! Looking to book for next December.', NOW() - INTERVAL '6 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Riya & Dev', NULL, NOW() + INTERVAL '7 months', 'Jaipur', 450000, 'booked', 'referral', 'Meera Kapoor', 'Palace wedding in Jaipur. Need full services.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Tanya Malhotra', NULL, NOW() + INTERVAL '4 months', 'Delhi', 150000, 'contacted', 'instagram', NULL, 'Your reels are beautiful. Can we schedule a call?', NOW() - INTERVAL '12 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Pooja Mehta', NULL, NOW() + INTERVAL '9 months', 'Pune', 280000, 'quoted', 'discover', NULL, 'Interested in your prestige package. Please send details.', NOW() - INTERVAL '14 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Aditi Khanna', NULL, NOW() + INTERVAL '3 months', 'Noida', 90000, 'new', 'whatsapp', NULL, 'Quick wedding, 3 months away. Available?', NOW() - INTERVAL '15 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Nisha & Arjun', NULL, NOW() + INTERVAL '11 months', 'Udaipur', 600000, 'contacted', 'referral', 'Riya Dev', 'Destination wedding in Udaipur. Very specific aesthetic.', NOW() - INTERVAL '18 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Deepika Reddy', NULL, NOW() + INTERVAL '6 months', 'Hyderabad', 200000, 'quoted', 'instagram', NULL, 'South Indian bridal look. Do you have experience?', NOW() - INTERVAL '20 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Sunita & Vikram', NULL, NOW() + INTERVAL '8 months', 'Amritsar', 175000, 'new', 'discover', NULL, 'Punjabi wedding. Looking for traditional + modern mix.', NOW() - INTERVAL '22 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Isha Patel', NULL, NOW() + INTERVAL '5 months', 'Ahmedabad', 130000, 'lost', 'whatsapp', NULL, 'Found someone local. Thank you anyway!', NOW() - INTERVAL '25 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Preethi Iyer', NULL, NOW() + INTERVAL '14 months', 'Chennai', 220000, 'new', 'referral', 'Kavya Nair', 'Planning 14 months ahead. Want to lock in the best.', NOW() - INTERVAL '28 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Mansi Gupta', NULL, NOW() + INTERVAL '7 months', 'Jaisalmer', 380000, 'booked', 'discover', NULL, 'Desert wedding! Very excited to work with you.', NOW() - INTERVAL '30 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Radhika Chopra', NULL, NOW() + INTERVAL '4 months', 'Delhi', 160000, 'contacted', 'instagram', NULL, 'Seen your work for 2 years. Finally getting married!', NOW() - INTERVAL '35 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Anjali Singh', NULL, NOW() + INTERVAL '6 months', 'Lucknow', 110000, 'new', 'whatsapp', NULL, 'Budget is tight but love your work. Any packages?', NOW() - INTERVAL '38 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Swara & Karan', NULL, NOW() + INTERVAL '9 months', 'Kolkata', 300000, 'quoted', 'discover', NULL, 'Bengali wedding + reception. Need two looks.', NOW() - INTERVAL '40 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Divya Menon', NULL, NOW() + INTERVAL '5 months', 'Kochi', 180000, 'contacted', 'referral', 'Preethi Iyer', 'Kerala wedding. Need someone who understands our style.', NOW() - INTERVAL '45 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Neha & Tarun', NULL, NOW() + INTERVAL '3 months', 'Rishikesh', 250000, 'booked', 'discover', NULL, 'Mountain wedding! So excited. Deposit sent.', NOW() - INTERVAL '50 days')
ON CONFLICT DO NOTHING;

-- ── Clients (10 past clients — delivered) ─────────────────────────────────
INSERT INTO clients (vendor_id, name, phone, notes, source, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Ritika Sharma', NULL, 'Nov 2025 wedding, Delhi. Bridal + 3 family members. Client was thrilled.', 'lead_promotion', NOW() - INTERVAL '90 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Aisha Khan', NULL, 'Oct 2025 wedding, Mumbai. Minimalist bridal look. Excellent feedback.', 'lead_promotion', NOW() - INTERVAL '120 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Pooja Singhania', NULL, 'Sep 2025 Udaipur destination wedding. 4-day event coverage.', 'lead_promotion', NOW() - INTERVAL '150 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Gayatri Rao', NULL, 'Aug 2025, Hyderabad. South Indian bridal. Client referred 2 new bookings.', 'lead_promotion', NOW() - INTERVAL '180 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Simran Bedi', NULL, 'Jul 2025, Chandigarh. Big fat Punjabi wedding. 200+ guests.', 'lead_promotion', NOW() - INTERVAL '210 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Tara Mehra', NULL, 'Jun 2025, Jaipur palace. Heritage venue, editorial look. Featured in magazine.', 'referral', NOW() - INTERVAL '240 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Ananya Pillai', NULL, 'May 2025, Kochi. Kerala traditional + fusion reception look.', 'lead_promotion', NOW() - INTERVAL '270 days'),
  ('2eb5d3fb-31eb-4b26-859a-cf10ae547d53', 'Nikita Gupta', NULL, 'Apr 2025, Delhi. Celebrity attendees. High pressure, flawless execution.', 'referral', NOW() - INTERVAL '300 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Priya Joshi', NULL, 'Mar 2025, Pune. Intimate 50-guest wedding. Very personal experience.', 'lead_promotion', NOW() - INTERVAL '330 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Deepa Krishnan', NULL, 'Feb 2025, Bangalore. Tech founder wedding. Minimalist luxury brief.', 'discover', NOW() - INTERVAL '360 days')
ON CONFLICT DO NOTHING;

-- ── Invoices (12 invoices — mix of states) ────────────────────────────────
INSERT INTO invoices (vendor_id, invoice_number, client_name, amount_total, amount_paid, amount_owed, state, due_date, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/001', 'Riya & Dev', 450000, 135000, 315000, 'advance_paid', NOW() + INTERVAL '6 months', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/002', 'Mansi Gupta', 380000, 114000, 266000, 'advance_paid', NOW() + INTERVAL '6 months', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/003', 'Neha & Tarun', 250000, 75000, 175000, 'advance_paid', NOW() + INTERVAL '2 months', NOW() - INTERVAL '15 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/004', 'Meera Kapoor', 350000, 0, 350000, 'unpaid', NOW() + INTERVAL '5 months', NOW() - INTERVAL '3 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/005', 'Pooja Mehta', 280000, 0, 280000, 'unpaid', NOW() + INTERVAL '8 months', NOW() - INTERVAL '7 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/006', 'Nisha & Arjun', 600000, 0, 600000, 'unpaid', NOW() + INTERVAL '10 months', NOW() - INTERVAL '2 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/007', 'Ritika Sharma', 320000, 320000, 0, 'paid', NOW() - INTERVAL '30 days', NOW() - INTERVAL '95 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/008', 'Aisha Khan', 280000, 280000, 0, 'paid', NOW() - INTERVAL '60 days', NOW() - INTERVAL '125 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/009', 'Pooja Singhania', 450000, 450000, 0, 'paid', NOW() - INTERVAL '90 days', NOW() - INTERVAL '155 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/010', 'Gayatri Rao', 200000, 200000, 0, 'paid', NOW() - INTERVAL '120 days', NOW() - INTERVAL '185 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/011', 'Tara Mehra', 380000, 380000, 0, 'paid', NOW() - INTERVAL '180 days', NOW() - INTERVAL '245 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'TDW/DEMO/012', 'Swara & Karan', 300000, 0, 300000, 'unpaid', NOW() + INTERVAL '8 months', NOW() - INTERVAL '8 days')
ON CONFLICT DO NOTHING;

-- ── Events (10 upcoming events) ───────────────────────────────────────────
INSERT INTO events (vendor_id, title, event_date, event_time, kind, state, notes, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Tanya Malhotra — Bridal Trial', NOW() + INTERVAL '5 days', '11:00', 'meeting', 'upcoming', 'Studio appointment. She wants soft glam. Send mood board before.', NOW() - INTERVAL '2 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Kavya Nair — Pre-Wedding Shoot', NOW() + INTERVAL '12 days', '06:30', 'shoot', 'upcoming', 'Lodhi Garden. Golden hour. Airbrush + HD setup.', NOW() - INTERVAL '3 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Radhika Chopra — Mehendi Day', NOW() + INTERVAL '18 days', '09:00', 'shoot', 'upcoming', 'Home, Vasant Vihar. Yellow + floral theme. 4 family members too.', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Aditi Khanna — Wedding Day', NOW() + INTERVAL '25 days', '05:00', 'shoot', 'upcoming', 'ITC Maurya. Early start. Full bridal + reception look. Long day.', NOW() - INTERVAL '8 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Deepika Reddy — Video Call Consult', NOW() + INTERVAL '3 days', '15:00', 'call', 'upcoming', 'She wants to discuss South Indian bridal inspiration. Share portfolio beforehand.', NOW() - INTERVAL '1 day'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Meera Kapoor — Contract Review Call', NOW() + INTERVAL '7 days', '12:00', 'call', 'upcoming', 'Go over package details. She has questions about travel charges.', NOW() - INTERVAL '4 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Nisha & Arjun — Site Visit Udaipur', NOW() + INTERVAL '35 days', '10:00', 'recce', 'upcoming', 'City Palace. Check lighting at different times. Bring assistant.', NOW() - INTERVAL '6 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Riya & Dev — Jaipur Wedding Day 1', NOW() + INTERVAL '42 days', '07:00', 'shoot', 'upcoming', 'Rambagh Palace. Mehendi + Haldi. Heritage setting.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Riya & Dev — Jaipur Wedding Day 2', NOW() + INTERVAL '43 days', '05:30', 'shoot', 'upcoming', 'Main wedding ceremony + reception. 3 looks for bride.', NOW() - INTERVAL '10 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Mansi Gupta — Jaisalmer Pre-Wedding', NOW() + INTERVAL '55 days', '17:00', 'shoot', 'upcoming', 'Sam Sand Dunes. Sunset shoot. Camel caravan setup.', NOW() - INTERVAL '12 days')
ON CONFLICT DO NOTHING;

-- ── Expenses (8 expenses) ─────────────────────────────────────────────────
INSERT INTO expenses (vendor_id, description, category, amount, expense_date, client_name, created_at)
VALUES
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Flight — Jaipur for Riya & Dev wedding', 'travel', 8500, NOW() - INTERVAL '5 days', 'Riya & Dev', NOW() - INTERVAL '5 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Assistant — Kavya shoot', 'assistant', 5000, NOW() - INTERVAL '8 days', 'Kavya Nair', NOW() - INTERVAL '8 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Airbrush kit refill', 'equipment', 3200, NOW() - INTERVAL '12 days', NULL, NOW() - INTERVAL '12 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Hotel — Udaipur site visit', 'travel', 6500, NOW() - INTERVAL '18 days', 'Nisha & Arjun', NOW() - INTERVAL '18 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'HD makeup products restock', 'equipment', 12000, NOW() - INTERVAL '25 days', NULL, NOW() - INTERVAL '25 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Second artist — Pooja Singhania wedding', 'assistant', 15000, NOW() - INTERVAL '30 days', 'Pooja Singhania', NOW() - INTERVAL '30 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Cab — multiple shoots this month', 'travel', 4200, NOW() - INTERVAL '35 days', NULL, NOW() - INTERVAL '35 days'),
  ('bbbbbbbb-1111-1111-1111-bbbbbbbbbbbb', 'Studio props + accessories', 'equipment', 8800, NOW() - INTERVAL '45 days', NULL, NOW() - INTERVAL '45 days')
ON CONFLICT DO NOTHING;
