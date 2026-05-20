// lib/mocks/vendor.ts
// Dense mock data for visual stress-testing: 15+ rows per slice.
// Returned by lib/api/vendor.ts when NEXT_PUBLIC_USE_MOCKS=true.
// All shapes match API_CONTRACTS.md exactly.

import type {
  MeResponse, VendorContextResponse,
  LeadsResponse, ClientsResponse, InvoicesResponse,
  ExpensesResponse, EventsResponse,
} from '../types/vendor';

export function getMockMe(): MeResponse {
  return {
    ok: true,
    vendor: {
      id: '2eb5d3fb-31eb-4b26-859a-cf10ae477d53',
      name: 'Dev Jroy',
      business_name: 'Frost Studio',
      category: 'photography',
      city: 'Delhi',
      handle: 'DEV550',
      upi_id: 'dev@okhdfc',
      gstin: null,
      open_to_travel: true,
      tier: 'signature',
      founding_cohort: true,
      aesthetic_tags: ['moody', 'editorial', 'film'],
      rate_min: 80000,
      rate_max: 300000,
      discover_preview: false,
    },
  };
}

export function getMockContext(): VendorContextResponse {
  return {
    ok: true,
    vendor: { name: 'Dev', category: 'photography', city: 'Delhi', handle: 'DEV550' },
    pending_invoices: [
      { client_name: 'Priya Sharma', amount_owed: 80000, due_date: '2026-05-25', overdue: false },
      { client_name: 'Rohit & Anjali', amount_owed: 120000, due_date: '2026-05-20', overdue: true },
      { client_name: 'Meera Kapoor', amount_owed: 45000, due_date: '2026-06-01', overdue: false },
    ],
    upcoming_events: [
      { title: 'Priya pre-wedding shoot', kind: 'shoot', event_date: '2026-05-22', event_time: '06:30' },
      { title: 'Call with Rohit re: album', kind: 'call', event_date: '2026-05-21', event_time: '11:00' },
      { title: 'Meera trial', kind: 'trial', event_date: '2026-05-23', event_time: null },
    ],
    new_leads: [
      { name: 'Kavya & Arjun', wedding_date: '2026-12-14', budget_total: 200000 },
      { name: 'Simran', wedding_date: '2026-11-30', budget_total: 150000 },
    ],
    recent_notes: [
      { content: 'Priya prefers candid style, no posed shots' },
      { content: 'Rohit paid advance via UPI on May 18' },
    ],
  };
}

export function getMockLeads(): LeadsResponse {
  const leads = [
    { id: 'lead-01', name: 'Kavya & Arjun', wedding_date: '2026-12-14', wedding_city: 'Jaipur', budget_total: 200000, state: 'new', source: 'instagram', referrer: null, raw_message: 'Hi, I saw your work on Instagram...', created_at: '2026-05-19T10:00:00Z' },
    { id: 'lead-02', name: 'Simran Oberoi', wedding_date: '2026-11-30', wedding_city: 'Delhi', budget_total: 150000, state: 'new', source: 'referral', referrer: 'Meera Kapoor', raw_message: 'Meera recommended you highly...', created_at: '2026-05-18T14:00:00Z' },
    { id: 'lead-03', name: 'Rahul Mehta', wedding_date: '2027-02-08', wedding_city: 'Mumbai', budget_total: 350000, state: 'contacted', source: 'whatsapp', referrer: null, raw_message: 'Looking for a photographer for February wedding...', created_at: '2026-05-17T09:00:00Z' },
    { id: 'lead-04', name: 'Ananya & Dev', wedding_date: '2026-10-20', wedding_city: 'Goa', budget_total: 280000, state: 'quoted', source: 'instagram', referrer: null, raw_message: 'Destination wedding in Goa...', created_at: '2026-05-16T11:00:00Z' },
    { id: 'lead-05', name: 'Preethi Nair', wedding_date: '2026-09-15', wedding_city: 'Bangalore', budget_total: 120000, state: 'new', source: 'referral', referrer: 'Anjali', raw_message: 'Anjali gave me your number...', created_at: '2026-05-15T08:00:00Z' },
    { id: 'lead-06', name: 'Karan & Tanya', wedding_date: '2027-01-12', wedding_city: 'Udaipur', budget_total: 500000, state: 'booked', source: 'discover', referrer: null, raw_message: 'Found you on The Dream Wedding...', created_at: '2026-05-14T13:00:00Z' },
    { id: 'lead-07', name: 'Isha Patel', wedding_date: '2026-08-22', wedding_city: 'Ahmedabad', budget_total: 90000, state: 'lost', source: 'whatsapp', referrer: null, raw_message: 'Budget too high for us...', created_at: '2026-05-12T10:00:00Z' },
    { id: 'lead-08', name: 'Aditya & Riya', wedding_date: '2026-12-25', wedding_city: 'Delhi', budget_total: 220000, state: 'contacted', source: 'instagram', referrer: null, raw_message: 'Christmas wedding!', created_at: '2026-05-11T16:00:00Z' },
    { id: 'lead-09', name: 'Nisha Sharma', wedding_date: '2027-03-05', wedding_city: 'Lucknow', budget_total: 110000, state: 'new', source: 'referral', referrer: 'Priya', raw_message: 'Priya said you were amazing...', created_at: '2026-05-10T09:30:00Z' },
    { id: 'lead-10', name: 'Vikram & Pooja', wedding_date: '2026-11-08', wedding_city: 'Chandigarh', budget_total: 175000, state: 'quoted', source: 'whatsapp', referrer: null, raw_message: 'November wedding, 150-200k budget', created_at: '2026-05-09T12:00:00Z' },
    { id: 'lead-11', name: 'Deepika Reddy', wedding_date: '2026-07-14', wedding_city: 'Hyderabad', budget_total: 95000, state: 'new', source: 'instagram', referrer: null, raw_message: 'July wedding, outdoor venue', created_at: '2026-05-08T15:00:00Z' },
    { id: 'lead-12', name: 'Sanjay & Sunita', wedding_date: '2027-02-20', wedding_city: 'Pune', budget_total: 260000, state: 'contacted', source: 'referral', referrer: 'Karan', raw_message: 'February destination wedding near Pune', created_at: '2026-05-07T10:00:00Z' },
    { id: 'lead-13', name: 'Aditi Khanna', wedding_date: '2026-10-05', wedding_city: 'Amritsar', budget_total: 140000, state: 'new', source: 'whatsapp', referrer: null, raw_message: 'October wedding in Golden City', created_at: '2026-05-06T08:00:00Z' },
    { id: 'lead-14', name: 'Rohan & Priya', wedding_date: '2026-12-31', wedding_city: 'Delhi', budget_total: 400000, state: 'quoted', source: 'discover', referrer: null, raw_message: 'NYE wedding, big celebration', created_at: '2026-05-05T14:00:00Z' },
    { id: 'lead-15', name: 'Mansi Gupta', wedding_date: '2027-04-18', wedding_city: 'Jaisalmer', budget_total: 320000, state: 'new', source: 'instagram', referrer: null, raw_message: 'Desert wedding in Jaisalmer next April', created_at: '2026-05-04T11:00:00Z' },
    { id: 'lead-16', name: 'Tarun & Neha', wedding_date: '2026-09-28', wedding_city: 'Rishikesh', budget_total: 180000, state: 'booked', source: 'referral', referrer: 'Isha', raw_message: 'Mountain wedding in September', created_at: '2026-05-03T09:00:00Z' },
  ];
  return { ok: true, leads, total: leads.length };
}

export function getMockClients(): ClientsResponse {
  const clients = [
    { id: 'client-01', name: 'Priya Sharma', phone: '+919876543210', email: 'priya@gmail.com', notes: 'Prefers candid style. Dec 2026 wedding.', created_at: '2026-04-01T10:00:00Z' },
    { id: 'client-02', name: 'Rohit & Anjali', phone: '+919876543211', email: null, notes: 'Full day coverage. May 20 deadline for balance.', created_at: '2026-03-15T10:00:00Z' },
    { id: 'client-03', name: 'Meera Kapoor', phone: '+919876543212', email: 'meera@outlook.com', notes: null, created_at: '2026-03-01T10:00:00Z' },
    { id: 'client-04', name: 'Karan & Tanya', phone: '+919876543213', email: 'karan@karan.com', notes: 'Udaipur destination. Full package booked.', created_at: '2026-02-20T10:00:00Z' },
    { id: 'client-05', name: 'Tarun & Neha', phone: '+919876543214', email: null, notes: 'Rishikesh mountain wedding. Outdoor ceremony.', created_at: '2026-02-10T10:00:00Z' },
    { id: 'client-06', name: 'Aisha Mirza', phone: '+919876543215', email: 'aisha@mirza.com', notes: 'Editorial style. Second shoot pending invoice.', created_at: '2026-01-25T10:00:00Z' },
    { id: 'client-07', name: 'Vishal & Divya', phone: '+919876543216', email: null, notes: 'Referred by Priya. Family portrait shoot added.', created_at: '2026-01-10T10:00:00Z' },
    { id: 'client-08', name: 'Sunita Rao', phone: '+919876543217', email: 'sunita@rao.in', notes: null, created_at: '2025-12-20T10:00:00Z' },
    { id: 'client-09', name: 'Nikhil Bhatia', phone: '+919876543218', email: null, notes: 'Corporate event + wedding combo', created_at: '2025-12-05T10:00:00Z' },
    { id: 'client-10', name: 'Leena & Arun', phone: '+919876543219', email: 'leena@gmail.com', notes: 'Anniversary shoot + upcoming wedding coverage', created_at: '2025-11-15T10:00:00Z' },
    { id: 'client-11', name: 'Sonal Joshi', phone: '+919876543220', email: null, notes: 'Pre-wedding only. Budget conscious.', created_at: '2025-11-01T10:00:00Z' },
    { id: 'client-12', name: 'Arjun Kapoor', phone: '+919876543221', email: 'arjun@kapoor.com', notes: 'High-profile. Strict NDA. No social posting.', created_at: '2025-10-20T10:00:00Z' },
    { id: 'client-13', name: 'Ritu & Sahil', phone: '+919876543222', email: null, notes: 'Destination Goa. Delivered. Happy client.', created_at: '2025-10-01T10:00:00Z' },
    { id: 'client-14', name: 'Palak Verma', phone: '+919876543223', email: 'palak@verma.in', notes: 'Maternity shoot turned into wedding booking', created_at: '2025-09-15T10:00:00Z' },
    { id: 'client-15', name: 'Deepak & Sonal', phone: '+919876543224', email: null, notes: null, created_at: '2025-09-01T10:00:00Z' },
    { id: 'client-16', name: 'Gauri Nanda', phone: '+919876543225', email: 'gauri@nanda.com', notes: 'Celebrity adjacent. Needs low-key approach.', created_at: '2025-08-10T10:00:00Z' },
  ];
  return { ok: true, clients, total: clients.length };
}

export function getMockInvoices(): InvoicesResponse {
  const invoices = [
    { id: 'inv-01', invoice_number: 'TDW/DEV550/01', client_name: 'Priya Sharma', amount_total: 120000, amount_paid: 40000, amount_owed: 80000, state: 'advance_paid', due_date: '2026-05-25', created_at: '2026-04-01T10:00:00Z' },
    { id: 'inv-02', invoice_number: 'TDW/DEV550/02', client_name: 'Rohit & Anjali', amount_total: 180000, amount_paid: 60000, amount_owed: 120000, state: 'advance_paid', due_date: '2026-05-20', created_at: '2026-03-15T10:00:00Z' },
    { id: 'inv-03', invoice_number: 'TDW/DEV550/03', client_name: 'Meera Kapoor', amount_total: 90000, amount_paid: 45000, amount_owed: 45000, state: 'advance_paid', due_date: '2026-06-01', created_at: '2026-03-01T10:00:00Z' },
    { id: 'inv-04', invoice_number: 'TDW/DEV550/04', client_name: 'Karan & Tanya', amount_total: 350000, amount_paid: 350000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2026-02-20T10:00:00Z' },
    { id: 'inv-05', invoice_number: 'TDW/DEV550/05', client_name: 'Tarun & Neha', amount_total: 150000, amount_paid: 0, amount_owed: 150000, state: 'unpaid', due_date: '2026-06-15', created_at: '2026-02-10T10:00:00Z' },
    { id: 'inv-06', invoice_number: 'TDW/DEV550/06', client_name: 'Aisha Mirza', amount_total: 80000, amount_paid: 0, amount_owed: 80000, state: 'unpaid', due_date: '2026-05-18', created_at: '2026-01-25T10:00:00Z' },
    { id: 'inv-07', invoice_number: 'TDW/DEV550/07', client_name: 'Vishal & Divya', amount_total: 120000, amount_paid: 120000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2026-01-10T10:00:00Z' },
    { id: 'inv-08', invoice_number: 'TDW/DEV550/08', client_name: 'Sunita Rao', amount_total: 65000, amount_paid: 65000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2025-12-20T10:00:00Z' },
    { id: 'inv-09', invoice_number: 'TDW/DEV550/09', client_name: 'Nikhil Bhatia', amount_total: 200000, amount_paid: 80000, amount_owed: 120000, state: 'advance_paid', due_date: '2026-07-01', created_at: '2025-12-05T10:00:00Z' },
    { id: 'inv-10', invoice_number: 'TDW/DEV550/10', client_name: 'Leena & Arun', amount_total: 95000, amount_paid: 95000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2025-11-15T10:00:00Z' },
    { id: 'inv-11', invoice_number: 'TDW/DEV550/11', client_name: 'Sonal Joshi', amount_total: 45000, amount_paid: 45000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2025-11-01T10:00:00Z' },
    { id: 'inv-12', invoice_number: 'TDW/DEV550/12', client_name: 'Arjun Kapoor', amount_total: 500000, amount_paid: 250000, amount_owed: 250000, state: 'advance_paid', due_date: '2026-08-15', created_at: '2025-10-20T10:00:00Z' },
    { id: 'inv-13', invoice_number: 'TDW/DEV550/13', client_name: 'Ritu & Sahil', amount_total: 180000, amount_paid: 180000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2025-10-01T10:00:00Z' },
    { id: 'inv-14', invoice_number: 'TDW/DEV550/14', client_name: 'Palak Verma', amount_total: 110000, amount_paid: 40000, amount_owed: 70000, state: 'advance_paid', due_date: '2026-09-01', created_at: '2025-09-15T10:00:00Z' },
    { id: 'inv-15', invoice_number: 'TDW/DEV550/15', client_name: 'Deepak & Sonal', amount_total: 75000, amount_paid: 0, amount_owed: 75000, state: 'unpaid', due_date: '2026-05-30', created_at: '2025-09-01T10:00:00Z' },
    { id: 'inv-16', invoice_number: 'TDW/DEV550/16', client_name: 'Gauri Nanda', amount_total: 220000, amount_paid: 220000, amount_owed: 0, state: 'paid', due_date: null, created_at: '2025-08-10T10:00:00Z' },
  ];
  const outstanding = invoices.filter(i => i.state !== 'paid').reduce((s, i) => s + i.amount_owed, 0);
  const collected = invoices.filter(i => i.state === 'paid').reduce((s, i) => s + i.amount_total, 0);
  return { ok: true, invoices, summary: { total_outstanding: outstanding, total_collected: collected }, total: invoices.length };
}

export function getMockExpenses(): ExpensesResponse {
  const expenses = [
    { id: 'exp-01', description: 'Travel to Jaipur for recce', amount: 4500, category: 'travel', expense_date: '2026-05-15', client_name: 'Karan & Tanya', created_at: '2026-05-15T10:00:00Z' },
    { id: 'exp-02', description: 'New prime lens — 85mm f1.4', amount: 62000, category: 'equipment', expense_date: '2026-05-10', client_name: null, created_at: '2026-05-10T10:00:00Z' },
    { id: 'exp-03', description: 'Second shooter Meena for Rohit wedding', amount: 8000, category: 'assistant', expense_date: '2026-05-08', client_name: 'Rohit & Anjali', created_at: '2026-05-08T10:00:00Z' },
    { id: 'exp-04', description: 'Canva Pro annual', amount: 4000, category: 'software', expense_date: '2026-05-01', client_name: null, created_at: '2026-05-01T10:00:00Z' },
    { id: 'exp-05', description: 'Print album — Priya wedding', amount: 7500, category: 'printing', expense_date: '2026-04-28', client_name: 'Priya Sharma', created_at: '2026-04-28T10:00:00Z' },
    { id: 'exp-06', description: 'Cab to venue and back', amount: 1200, category: 'travel', expense_date: '2026-04-22', client_name: 'Meera Kapoor', created_at: '2026-04-22T10:00:00Z' },
    { id: 'exp-07', description: 'External SSD 2TB', amount: 9800, category: 'equipment', expense_date: '2026-04-15', client_name: null, created_at: '2026-04-15T10:00:00Z' },
    { id: 'exp-08', description: 'Instagram ads for portfolio', amount: 5000, category: 'marketing', expense_date: '2026-04-10', client_name: null, created_at: '2026-04-10T10:00:00Z' },
    { id: 'exp-09', description: 'Lunch with videographer re: collab', amount: 2400, category: 'food', expense_date: '2026-04-05', client_name: null, created_at: '2026-04-05T10:00:00Z' },
    { id: 'exp-10', description: 'Flash repair', amount: 3500, category: 'equipment', expense_date: '2026-03-30', client_name: null, created_at: '2026-03-30T10:00:00Z' },
    { id: 'exp-11', description: 'Train to Mumbai for site visit', amount: 2800, category: 'travel', expense_date: '2026-03-25', client_name: 'Rahul Mehta', created_at: '2026-03-25T10:00:00Z' },
    { id: 'exp-12', description: 'Lightroom subscription', amount: 1800, category: 'software', expense_date: '2026-03-20', client_name: null, created_at: '2026-03-20T10:00:00Z' },
    { id: 'exp-13', description: 'Printed stationery for client packages', amount: 3200, category: 'printing', expense_date: '2026-03-15', client_name: null, created_at: '2026-03-15T10:00:00Z' },
    { id: 'exp-14', description: 'Gopro for underwater shoot', amount: 28000, category: 'equipment', expense_date: '2026-03-10', client_name: 'Tarun & Neha', created_at: '2026-03-10T10:00:00Z' },
    { id: 'exp-15', description: 'Studio rental for portraits', amount: 6000, category: 'studio', expense_date: '2026-03-05', client_name: 'Aisha Mirza', created_at: '2026-03-05T10:00:00Z' },
    { id: 'exp-16', description: 'Commission to referrer', amount: 5000, category: 'commission', expense_date: '2026-03-01', client_name: null, created_at: '2026-03-01T10:00:00Z' },
  ];
  const total_spent = expenses.reduce((s, e) => s + e.amount, 0);
  return { ok: true, expenses, total_spent, total: expenses.length };
}

export function getMockEvents(): EventsResponse {
  const events = [
    { id: 'evt-01', title: 'Priya pre-wedding shoot', kind: 'shoot', event_date: '2026-05-22', event_time: '06:30', state: 'upcoming', lead_id: 'lead-01', notes: 'Location: Lodhi Garden. Carry wide + 85mm.' },
    { id: 'evt-02', title: 'Call with Rohit re: album', kind: 'call', event_date: '2026-05-21', event_time: '11:00', state: 'upcoming', lead_id: null, notes: 'Discuss album layout preferences.' },
    { id: 'evt-03', title: 'Meera trial session', kind: 'trial', event_date: '2026-05-23', event_time: null, state: 'upcoming', lead_id: null, notes: 'Studio trial. Check lighting setup.' },
    { id: 'evt-04', title: 'Karan & Tanya wedding', kind: 'ceremony', event_date: '2027-01-12', event_time: '07:00', state: 'upcoming', lead_id: 'lead-06', notes: 'Udaipur. 2-day coverage. Requires travel.' },
    { id: 'evt-05', title: 'Recce at Leela Ambience', kind: 'recce', event_date: '2026-05-28', event_time: '14:00', state: 'upcoming', lead_id: 'lead-04', notes: 'Check lighting at reception hall.' },
    { id: 'evt-06', title: 'Edit Anjali Rohit shoot', kind: 'task', event_date: '2026-05-26', event_time: null, state: 'upcoming', lead_id: null, notes: 'Deliver edited selects by May 30.' },
    { id: 'evt-07', title: 'Tarun Neha wedding shoot', kind: 'shoot', event_date: '2026-09-28', event_time: '05:30', state: 'upcoming', lead_id: 'lead-16', notes: 'Rishikesh riverside ceremony.' },
    { id: 'evt-08', title: 'Follow up Simran re: quote', kind: 'call', event_date: '2026-05-24', event_time: '10:00', state: 'upcoming', lead_id: 'lead-02', notes: null },
    { id: 'evt-09', title: 'Gear servicing — Nikon', kind: 'task', event_date: '2026-05-27', event_time: null, state: 'upcoming', lead_id: null, notes: 'Drop off at service centre by 10am.' },
    { id: 'evt-10', title: 'Meeting with florist Anjali', kind: 'meeting', event_date: '2026-05-29', event_time: '15:00', state: 'upcoming', lead_id: 'lead-04', notes: 'Discuss coordination for Goa wedding.' },
    { id: 'evt-11', title: 'Arjun Kapoor shoot', kind: 'shoot', event_date: '2026-08-22', event_time: '06:00', state: 'upcoming', lead_id: null, notes: 'NDA signed. No posting without clearance.' },
    { id: 'evt-12', title: 'Portfolio update session', kind: 'task', event_date: '2026-06-05', event_time: null, state: 'upcoming', lead_id: null, notes: 'Select 20 new images for website.' },
    { id: 'evt-13', title: 'Kavya Arjun venue visit', kind: 'recce', event_date: '2026-06-10', event_time: '11:00', state: 'upcoming', lead_id: 'lead-01', notes: 'Jaipur heritage hotel.' },
    { id: 'evt-14', title: 'Palak Verma wedding', kind: 'ceremony', event_date: '2026-09-15', event_time: '08:00', state: 'upcoming', lead_id: 'lead-05', notes: 'Bangalore. Full day.' },
    { id: 'evt-15', title: 'Submit album to Vishal Divya', kind: 'task', event_date: '2026-05-31', event_time: null, state: 'upcoming', lead_id: null, notes: 'Final album PDF — email and Dropbox link.' },
    { id: 'evt-16', title: 'Call Mansi Gupta re: Jaisalmer', kind: 'call', event_date: '2026-06-02', event_time: '16:00', state: 'upcoming', lead_id: 'lead-15', notes: 'Discuss desert venue logistics.' },
    { id: 'evt-17', title: 'Rohit Anjali wedding ceremony', kind: 'ceremony', event_date: '2026-07-15', event_time: '06:30', state: 'upcoming', lead_id: null, notes: 'Delhi farmhouse. Two shooters.' },
    { id: 'evt-18', title: 'Deepak Sonal engagement shoot', kind: 'shoot', event_date: '2026-06-20', event_time: '17:00', state: 'upcoming', lead_id: null, notes: 'Sunset golden hour. Humayun Tomb.' },
  ];
  return { ok: true, events, total: events.length };
}

// ════════════════════════════════════════════════════════════════════
// Block 1b — sentinel write mocks (one factory per slice)
// Enough for Block 1c UI dev without a live backend.
// ════════════════════════════════════════════════════════════════════

import type {
  CreateLeadRequest, CreateClientRequest,
  CreateInvoiceRequest, CreateExpenseRequest, CreateEventRequest,
  Lead, Client, Invoice, Expense, VendorEvent,
} from '../types/vendor';

// ── In-memory stores (reset on page reload — intentional for mock mode) ───
let _leads: Lead[]        = [];
let _clients: Client[]    = [];
let _invoices: Invoice[]  = [];
let _expenses: Expense[]  = [];
let _events: VendorEvent[] = [];

// ── Lead factory ──────────────────────────────────────────────────────────
export function makeMockLead(body: CreateLeadRequest): Lead {
  const lead: Lead = {
    id:           'mock-lead-' + Date.now(),
    name:         body.name,
    wedding_date: body.wedding_date ?? null,
    wedding_city: body.wedding_city ?? null,
    budget_total: body.budget_max ?? body.budget_min ?? null,
    state:        'new',
    source:       body.source ?? null,
    referrer:     body.referrer_name ?? null,
    raw_message:  body.raw_message ?? null,
    created_at:   new Date().toISOString(),
  };
  _leads = [lead, ..._leads];
  return lead;
}

// ── Client factory ────────────────────────────────────────────────────────
export function makeMockClient(body: CreateClientRequest): Client {
  const client: Client = {
    id:         'mock-client-' + Date.now(),
    name:       body.name,
    phone:      body.phone ?? null,
    email:      body.email ?? null,
    notes:      body.notes ?? null,
    created_at: new Date().toISOString(),
  };
  _clients = [client, ..._clients];
  return client;
}

// ── Invoice factory ───────────────────────────────────────────────────────
let _invoiceCounter = 17; // continues after mock seed data (16 rows)
export function makeMockInvoice(body: CreateInvoiceRequest): Invoice {
  const n       = _invoiceCounter++;
  const invoice: Invoice = {
    id:             'mock-inv-' + Date.now(),
    invoice_number: 'TDW/DEV550/' + String(n).padStart(2, '0'),
    client_name:    body.client_name ?? 'Mock Client',
    amount_total:   body.amount_total,
    amount_paid:    body.amount_advance ?? 0,
    amount_owed:    body.amount_total - (body.amount_advance ?? 0),
    state:          (body.amount_advance ?? 0) > 0 ? 'advance_paid' : 'unpaid',
    due_date:       body.due_date ?? null,
    created_at:     new Date().toISOString(),
  };
  _invoices = [invoice, ..._invoices];
  return invoice;
}

// ── Expense factory ───────────────────────────────────────────────────────
export function makeMockExpense(body: CreateExpenseRequest): Expense {
  const expense: Expense = {
    id:           'mock-exp-' + Date.now(),
    description:  body.description ?? null,
    amount:       body.amount,
    category:     body.category ?? null,
    expense_date: body.expense_date ?? new Date().toISOString().split('T')[0],
    client_name:  body.client_name ?? null,
    created_at:   new Date().toISOString(),
  };
  _expenses = [expense, ..._expenses];
  return expense;
}

// ── Event factory ─────────────────────────────────────────────────────────
export function makeMockEvent(body: CreateEventRequest): VendorEvent {
  const event: VendorEvent = {
    id:         'mock-evt-' + Date.now(),
    title:      body.title,
    kind:       body.kind ?? 'other',
    event_date: body.event_date,
    event_time: body.event_time ?? null,
    state:      'upcoming',
    lead_id:    body.linked_lead_id ?? null,
    notes:      body.notes ?? null,
  };
  _events = [event, ..._events];
  return event;
}
