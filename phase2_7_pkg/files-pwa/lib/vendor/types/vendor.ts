// lib/types/vendor.ts
// TypeScript interfaces mirroring vendor contract request/response shapes.
// Every endpoint in lib/api/vendor.ts has a corresponding interface here.
// Contract drift = TypeScript compile error, not runtime bug.
// No `any`.

import type { LeadState, InvoiceState, EventKind, EventState, ExpenseCategory } from './common';

// ── Common ────────────────────────────────────────────────────────────────
export interface ApiOk { ok: true; }
export interface ApiErr { ok: false; error: string; }

// ── GET /api/v2/vendor/me ─────────────────────────────────────────────────
export interface MeResponse {
  ok: boolean;
  vendor: {
    id: string;
    name: string;
    business_name: string;
    category: string;
    city: string;
    handle: string;
    upi_id: string | null;
    gstin: string | null;
    open_to_travel: boolean;
    tier: 'trial' | 'essential' | 'signature' | 'prestige';
    founding_cohort: boolean;
    aesthetic_tags: string[] | null;
    rate_min: number | null;
    rate_max: number | null;
    discover_preview: boolean;
  };
}

// ── PATCH /api/v2/vendor/me ───────────────────────────────────────────────
export interface UpdateMeRequest {
  name?:             string;
  business_name?:    string;
  style_notes?:      string;
  city?:             string;
  open_to_travel?:   boolean;
  travel_notes?:     string;
  instagram_handle?: string;
  upi_id?:           string;
  gstin?:            string;
  briefing_enabled?: boolean;
  aesthetic_tags?:   string[];
  rate_min?:         number;
  rate_max?:         number;
}

export interface UpdateMeResponse {
  ok: true;
  vendor: {
    id:               string;
    name:             string | null;
    business_name:    string | null;
    city:             string | null;
    open_to_travel:   boolean;
    upi_id:           string | null;
    gstin:            string | null;
    aesthetic_tags:   string[];
    rate_min:         number | null;
    rate_max:         number | null;
    discover_preview: boolean;
  };
}

// ── PATCH /api/v2/vendor/me/routing-handle ────────────────────────────────
export interface UpdateRoutingHandleRequest {
  routing_handle: string;
}

export interface UpdateRoutingHandleResponse {
  ok: true;
  routing_handle: string;
  wa_link: string;
}

// ── PATCH /api/v2/vendor/me/invoice-prefix ────────────────────────────────
export interface UpdateInvoicePrefixRequest {
  prefix: string;
}

export interface UpdateInvoicePrefixResponse {
  ok: true;
  prefix: string;
  current_counter: number;
}

// ── GET /api/v2/vendor/context/:vendorId ──────────────────────────────────
export interface VendorContextResponse {
  ok: boolean;
  vendor: { name: string; category: string; city: string; handle: string; };
  pending_invoices: Array<{ client_name: string; amount_owed: number; due_date: string | null; overdue: boolean; }>;
  upcoming_events: Array<{ title: string; kind: string; event_date: string; event_time: string | null; }>;
  new_leads: Array<{ name: string | null; wedding_date: string | null; budget_total: number | null; }>;
  recent_notes: Array<{ content: string; }>;
}

// ── GET /api/v2/vendor/today/:vendorId ────────────────────────────────────
export interface TodayResponse {
  ok: boolean;
  vendor: { name: string; category: string; city: string; };
  needs_attention: {
    overdue_invoices: Array<{ id: string; client_name: string; amount_owed: number; due_date: string; }>;
    new_leads: Array<{ id: string; name: string; wedding_date: string | null; budget_total: number | null; created_at: string; }>;
    events_today: Array<{ id: string; title: string; kind: string; event_time: string | null; }>;
  };
  this_week: Array<{ id: string; title: string; kind: string; event_date: string; event_time: string | null; }>;
  money_snapshot: { total_outstanding: number; unpaid_count: number; advance_paid_count: number; };
  open_leads_count: number;
}

// ── GET /api/v2/vendor/leads/:vendorId ────────────────────────────────────
export interface LeadsResponse {
  ok: boolean;
  leads: Array<{
    id: string; name: string | null; wedding_date: string | null;
    wedding_city: string | null; budget_total: number | null;
    state: string; source: string | null; referrer: string | null;
    raw_message: string | null; created_at: string;
  }>;
  total: number;
}

export interface LeadStateResponse {
  ok: boolean;
  lead: { id: string; state: string; };
}

// ── POST /api/v2/vendor/leads ─────────────────────────────────────────────
export interface CreateLeadRequest {
  name:          string;
  phone?:        string;
  email?:        string;
  wedding_date?: string;
  wedding_city?: string;
  event_types?:  string[];
  budget_min?:   number;
  budget_max?:   number;
  source?:       string;
  referrer_name?: string;
  raw_message?:  string;
  notes?:        string;
}

export interface CreateLeadResponse {
  ok: true;
  data: Lead;
  deduped: boolean;
}

// ── PATCH /api/v2/vendor/leads/:leadId ───────────────────────────────────
// Block 1a — endpoint exists in spec; will be live after dream-os deploys.
export interface UpdateLeadRequest {
  name?:         string;
  phone?:        string;
  email?:        string;
  wedding_date?: string;
  wedding_city?: string;
  budget_min?:   number;
  budget_max?:   number;
  source?:       string;
  referrer_name?: string;
  raw_message?:  string;
  notes?:        string;
}

export interface UpdateLeadResponse {
  ok: true;
  lead: Lead;
}

// ── GET /api/v2/vendor/leads/:leadId/detail ──────────────────────────────

export interface ConversationMessage {
  direction:  'inbound' | 'outbound';
  body:       string;
  created_at: string;
  sent_by:    string;
}

export interface LeadDetailResponse {
  ok:             boolean;
  lead:           Lead;
  vendor_summary: string | null;
  conversation:   ConversationMessage[];
  invoices:       Invoice[];
  events:         VendorEvent[];
}

// ── GET /api/v2/vendor/clients/:vendorId ──────────────────────────────────
export interface ClientsResponse {
  ok: boolean;
  clients: Array<{ id: string; name: string; phone: string | null; email: string | null; notes: string | null; created_at: string; }>;
  total: number;
}

export interface ClientDetailResponse {
  ok: boolean;
  client: { id: string; name: string; phone: string | null; email: string | null; notes: string | null; };
  leads: Array<{ id: string; wedding_date: string | null; state: string; budget_total: number | null; }>;
  invoices: Array<{ id: string; amount_total: number; amount_paid: number; state: string; due_date: string | null; }>;
}

// ── POST /api/v2/vendor/clients ───────────────────────────────────────────
export interface CreateClientRequest {
  name:   string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CreateClientResponse {
  ok: true;
  client:   Client;
  deduped:  boolean;
  restored: boolean;
}

// ── PATCH /api/v2/vendor/clients/:clientId ────────────────────────────────
export interface UpdateClientRequest {
  name?:  string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface UpdateClientResponse {
  ok: true;
  client: Client;
}

// ── GET /api/v2/vendor/invoices/:vendorId ─────────────────────────────────
export interface InvoicesResponse {
  ok: boolean;
  invoices: Array<{
    id: string; invoice_number: string; client_name: string;
    amount_total: number; amount_paid: number; amount_owed: number;
    state: string; due_date: string | null; created_at: string;
  }>;
  summary: { total_outstanding: number; total_collected: number; };
  total: number;
}

// ── POST /api/v2/vendor/invoices ─────────────────────────────────────────
export interface CreateInvoiceRequest {
  client_name?:    string;
  client_phone?:   string;
  client_id?:      string;
  lead_id?:        string;
  description?:    string;
  amount_total:    number;
  amount_advance?: number;
  due_date?:       string;
  notes?:          string;
}

export interface CreateInvoiceResponse {
  ok: true;
  invoice:     Invoice;
  pdf_pending: true;
}

// ── PATCH /api/v2/vendor/invoices/:invoiceId ──────────────────────────────
export interface UpdateInvoiceRequest {
  client_name?:    string;
  client_phone?:   string;
  description?:    string;
  amount_total?:   number;
  amount_advance?: number;
  due_date?:       string;
  notes?:          string;
}

export interface UpdateInvoiceResponse {
  ok: true;
  invoice: Invoice;
}

// ── POST /api/v2/vendor/invoices/:invoiceId/payments ──────────────────────
export interface RecordPaymentRequest {
  amount: number;
  note?:  string;
}

export interface RecordPaymentResponse {
  ok: true;
  invoice:          Invoice | null;
  payment_recorded: number;
  new_state:        InvoiceState;
}

// ── GET /api/v2/vendor/invoices/:invoiceId/pdf ────────────────────────────
export interface InvoicePdfResponse {
  ok: true;
  pdf_url:    string;
  expires_in: number;
}

// ── GET /api/v2/vendor/expenses/:vendorId ─────────────────────────────────
export interface ExpensesResponse {
  ok: boolean;
  expenses: Array<{
    id: string; description: string | null; amount: number;
    category: string | null; expense_date: string | null;
    client_name: string | null; created_at: string;
  }>;
  total_spent: number;
  total: number;
}

// ── POST /api/v2/vendor/expenses ─────────────────────────────────────────
export interface CreateExpenseRequest {
  amount:          number;
  category?:       ExpenseCategory;
  description?:    string;
  expense_date?:   string;
  client_name?:    string;
  linked_lead_id?: string;
  notes?:          string;
}

export interface CreateExpenseResponse {
  ok: true;
  expense: Expense;
}

// ── PATCH /api/v2/vendor/expenses/:expenseId ──────────────────────────────
export interface UpdateExpenseRequest {
  amount?:       number;
  category?:     ExpenseCategory;
  description?:  string;
  expense_date?: string;
  client_name?:  string;
  notes?:        string;
}

export interface UpdateExpenseResponse {
  ok: true;
  expense: Expense;
}

// ── GET /api/v2/vendor/events/:vendorId ───────────────────────────────────
export interface EventsResponse {
  ok: boolean;
  events: Array<{
    id: string; title: string; kind: string; event_date: string;
    event_time: string | null; state: string; lead_id: string | null; notes: string | null;
  }>;
  total: number;
}

// ── POST /api/v2/vendor/events ───────────────────────────────────────────
export interface CreateEventRequest {
  title:           string;
  event_date:      string;
  event_time?:     string;
  kind?:           EventKind;
  linked_lead_id?: string;
  notes?:          string;
}

export interface CreateEventResponse {
  ok: true;
  event: VendorEvent;
}

// ── PATCH /api/v2/vendor/events/:eventId ──────────────────────────────────
export interface UpdateEventRequest {
  title?:          string;
  event_date?:     string;
  event_time?:     string;
  kind?:           EventKind;
  linked_lead_id?: string;
  notes?:          string;
}

export interface UpdateEventResponse {
  ok: true;
  event: VendorEvent;
}

// ── GET /api/v2/vendor/availability/:vendorId ─────────────────────────────
export interface AvailabilityBlock {
  id:           string;
  blocked_date: string;
  reason:       string | null;
  created_at:   string;
}

export interface AvailabilityResponse {
  ok: true;
  blocks: AvailabilityBlock[];
  total:  number;
}

// ── POST /api/v2/vendor/availability ─────────────────────────────────────
export interface BlockDateRequest {
  blocked_date: string;
  reason?:      string;
}

export interface BlockDateResponse {
  ok: true;
  block: AvailabilityBlock;
}

// ── GET /api/v2/hot-dates ─────────────────────────────────────────────────
export interface HotDate {
  date:   string;
  note:   string | null;
  region: string | null;
}

export interface HotDatesResponse {
  ok: true;
  dates: HotDate[];
  total: number;
}

// ── Session type ─────────────────────────────────────────────────────────
export interface VendorSession {
  id:            string;
  user_id:       string;
  name:          string | null;
  phone:         string | null;
  tier:          string;
  access_token:  string;
  refresh_token: string;
}

// ── Context sub-types (used by briefing.ts) ───────────────────────────────
export interface PendingInvoice {
  client_name: string;
  amount_owed: number;
  due_date:    string | null;
  overdue:     boolean;
}

export interface UpcomingEvent {
  title:      string;
  kind:       string;
  event_date: string;
  event_time: string | null;
}

// ── Row types (used by hooks/useVendorData, calendar, list pages) ─────────
export interface Client {
  id:         string;
  name:       string;
  phone:      string | null;
  email:      string | null;
  notes:      string | null;
  created_at: string;
}

export interface Lead {
  id:                      string;
  name:                    string | null;
  phone:                   string | null;
  wedding_date:            string | null;
  wedding_date_precision?: 'day' | 'month' | 'year' | null;
  wedding_city:            string | null;
  budget_total:            number | null;
  state:                   string;
  source:                  string | null;
  referrer:                string | null;
  raw_message:             string | null;
  created_at:              string;
}

export interface Invoice {
  id:             string;
  invoice_number: string;
  client_name:    string;
  client_phone?:  string;
  amount_total:   number;
  amount_paid:    number;
  amount_owed:    number;
  state:          string;
  due_date:       string | null;
  created_at:     string;
}

export interface Expense {
  id:           string;
  description:  string | null;
  amount:       number;
  category:     string | null;
  expense_date: string | null;
  client_name:  string | null;
  created_at:   string;
}

export interface VendorEvent {
  id:         string;
  title:      string;
  kind:       string;
  event_date: string;
  event_time: string | null;
  state:      string;
  lead_id:    string | null;
  notes:      string | null;
}

// ── POST /api/v2/vendor/chat ──────────────────────────────────────────────
export interface ContactCard {
  name:   string;
  phone:  string;
  draft?: string;
  link?:  string;
}

export interface ClarifyPayload {
  question: string;
  options:  string[];
}

export interface ChatResponse {
  ok:       boolean;
  reply:    string;
  tool_calls: string[];
  contact?:  ContactCard;
  clarify?:  ClarifyPayload;
  refresh?:  boolean;
  error?:    string;
}

// ── Auth endpoints ────────────────────────────────────────────────────────
export interface SendOtpResponse    { ok: boolean; error?: string; }
export interface VerifyOtpResponse  { ok: boolean; access_token?: string; refresh_token?: string; vendor_id?: string; user_id?: string; pin_set?: boolean; error?: string; }
export interface PinStatusResponse  { ok: boolean; has_pin: boolean; }
export interface PinLoginResponse   { ok: boolean; access_token?: string; vendor_id?: string; name?: string; error?: string; }

// ── Block 5 — Discover / Portfolio / Couture / Featured ───────────────────────

export interface PortfolioImage {
  id:             string;
  image_url:      string;
  caption:        string | null;
  aesthetic_tags: string[];
  is_hero:        boolean;
  in_carousel:    boolean;
  approval_state: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  created_at:     string;
}

export interface PortfolioListResponse {
  ok: boolean;
  images: PortfolioImage[];
  total: number;
}

export interface UploadUrlResponse {
  ok: boolean;
  upload_url: string;
  params: {
    api_key: string;
    timestamp: number;
    signature: string;
    folder: string;
    public_id: string;
  };
}

export interface DiscoverStatus {
  ok: boolean;
  discover_request_state: string;
  discover_eligible: boolean;
  portfolio_summary: { total: number; approved: number; pending: number; rejected: number };
  saves_count?: number;
  current_request: { id: string; state: string; decided_at: string | null } | null;
  last_decision_reason: string | null;
}

export interface CoutureSlot {
  id: string;
  slot_at: string;
  duration_minutes: number;
  fee_inr: number;
  state: 'open' | 'booked' | 'blocked';
}

export interface CoutureAppointment {
  id: string;
  appointment_at: string;
  duration_minutes: number;
  fee_inr: number;
  state: string;
  paid_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface FeaturedSubmission {
  id: string;
  slot_kind: string;
  caption: string | null;
  proposed_start_date: string | null;
  proposed_end_date: string | null;
  fee_inr: number;
  state: string;
  scheduled_start: string | null;
  scheduled_end: string | null;
  rejection_reason: string | null;
  created_at: string;
}


// ── Studio Suite (Block 6) ────────────────────────────────────────────────

export interface TeamMember {
  id:             string;
  vendor_id:      string;
  name:           string;
  role:           string | null;
  phone:          string | null;
  daily_rate_inr: number | null;
  notes:          string | null;
  active:         boolean;
  deleted_at:     string | null;
  created_at:     string;
  updated_at:     string;
}

export interface TeamTask {
  id:                    string;
  vendor_id:             string;
  assigned_to_member_id: string | null;
  linked_event_id:       string | null;
  title:                 string;
  description:           string | null;
  due_date:              string | null;
  priority:              'low' | 'normal' | 'high' | 'urgent';
  state:                 'open' | 'in_progress' | 'done' | 'cancelled';
  completed_at:          string | null;
  deleted_at:            string | null;
  created_at:            string;
  updated_at:            string;
  team_members?:         { id: string; name: string; role: string | null } | null;
}

export interface TeamMessage {
  id:              string;
  vendor_id:       string;
  body:            string;
  pinned:          boolean;
  sent_to_count:   number | null;
  linked_event_id: string | null;
  created_at:      string;
}

export interface TeamPayment {
  id:              string;
  vendor_id:       string;
  team_member_id:  string;
  linked_event_id: string | null;
  linked_task_id:  string | null;
  description:     string | null;
  amount_inr:      number;
  state:           'owed' | 'paid' | 'cancelled';
  paid_at:         string | null;
  paid_via:        string | null;
  notes:           string | null;
  created_at:      string;
  updated_at:      string;
  team_members?:   { name: string } | null;
}

export interface TeamPaymentBalance {
  team_member_id: string;
  name:           string;
  owed_inr:       number;
  paid_inr:       number;
}

export interface StudioBriefing {
  today:                string;
  today_events:         Array<{ id: string; title: string; event_time: string | null; state: string; team_assigned: Array<{ id: string; name: string }> }>;
  open_tasks:           TeamTask[];
  overdue_tasks:        TeamTask[];
  pinned_messages:      TeamMessage[];
  this_week_calendar:   Array<{ id: string; title: string; event_date: string; event_time: string | null; state: string }>;
  team_owed_total_inr:  number;
  team_owed_per_member: Array<{ team_member_id: string; name: string; owed_inr: number }>;
}

// ── Block 7: Schedules / Contracts / TDS ─────────────────────────────────

export interface ScheduleMilestone {
  id:              string;
  invoice_id:      string;
  vendor_id:       string;
  milestone_label: string;
  pct:             number;
  amount_due:      number;
  due_date:        string | null;
  state:           'pending' | 'paid' | 'waived';
  paid_at:         string | null;
  paid_amount:     number | null;
  ordinal:         number;
  created_at:      string;
  updated_at:      string;
}

export interface Contract {
  id:           string;
  vendor_id:    string;
  client_id:    string | null;
  lead_id:      string | null;
  invoice_id:   string | null;
  title:        string;
  storage_path: string | null;
  file_size:    number | null;
  mime_type:    string;
  notes:        string | null;
  state:        'draft' | 'sent' | 'signed' | 'cancelled';
  sent_at:      string | null;
  signed_at:    string | null;
  created_at:   string;
  updated_at:   string;
}

export interface TdsEntry {
  id:             string;
  vendor_id:      string;
  invoice_id:     string | null;
  client_id:      string | null;
  client_name:    string;
  client_pan:     string | null;
  client_tan:     string | null;
  gross_amount:   number;
  tds_rate:       number;
  tds_amount:     number;
  net_received:   number;
  section:        string | null;
  deduction_date: string;
  financial_year: string;
  certificate_no: string | null;
  notes:          string | null;
  created_at:     string;
  updated_at:     string;
}

export interface TdsSummary {
  ok:             boolean;
  financial_year: string;
  total_gross:    number;
  total_tds:      number;
  total_net:      number;
  entry_count:    number;
  by_section:     Array<{ section: string; gross: number; tds: number; count: number }>;
}
