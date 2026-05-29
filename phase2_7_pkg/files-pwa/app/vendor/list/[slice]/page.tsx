'use client';
// /wedding/list/[slice] — Dynamic list page · Atelier rebuild
// Handles clients, leads, invoices, expenses, events. All hooks, API calls,
// helpers, and data mutations preserved verbatim from the previous version.
// What changed: visual chrome only — Cormorant rows, consistent state pills
// regardless of whether city/date are present, atelier sheets, atelier-fab.

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useVendorSession } from '@/hooks/vendor/useVendorSession';
import { useClientsData, useLeadsData, useInvoicesData, useExpensesData, useEventsData } from '@/hooks/vendor/useVendorData';
import type { ListSlice } from '@/hooks/vendor/useLastSlice';
import { Header } from '@/components/vendor/Header';
import type { Client, Lead, Invoice, Expense, VendorEvent } from '@/lib/vendor/types/vendor';
import { API_BASE, getAuthHeader } from '@/lib/vendor/api/_base';
import { AddSheet } from '@/components/vendor/AddSheet';
import { Toast } from '@/components/vendor/Toast';
import { useToast } from '@/hooks/vendor/useToast';
import type { ToastKind } from '@/hooks/vendor/useToast';
import { fetchLeadDetail, fetchSchedule, createSchedule, markMilestonePaid, fetchInvoicePdf } from '@/lib/vendor/api/vendor';
import type { ScheduleMilestone } from '@/lib/vendor/types/vendor';
import { ConversationThread } from '@/components/vendor/ConversationThread';
import type { ConversationMessage } from '@/lib/vendor/types/vendor';

const A = {
  ink:       'var(--atelier-ink)',
  inkSoft:   'var(--atelier-ink-soft)',
  inkMute:   'var(--atelier-ink-mute)',
  inkDim:    'var(--atelier-ink-dim)',
  brass:     'var(--atelier-accent-text)',
  brassWarm: 'var(--atelier-label)',
  brassLine: 'rgba(201,168,76,0.18)',
  green:     '#7FBE85',
  red:       '#E07B5C',
} as const;
const F = {
  display: 'var(--font-italiana), "GFS Didot", Georgia, serif',
  script:  'var(--font-cormorant), Georgia, serif',
  body:    'var(--font-dm-sans), system-ui, sans-serif',
  label:   'var(--font-jost), system-ui, sans-serif',
} as const;

const LABELS: Record<ListSlice, string> = { clients: 'Clients', leads: 'Leads', invoices: 'Invoices', events: 'Events', expenses: 'Expenses' };
const GLYPHS: Record<ListSlice, string> = { clients: 'C', leads: 'L', invoices: 'I', events: '◐', expenses: '×' };

// State pill color per state — used as colored border + colored text
function stateColor(slice: ListSlice, state: string | undefined): string {
  if (!state) return A.inkMute;
  const s = state.toLowerCase();
  if (slice === 'leads') {
    if (s === 'new') return A.brassWarm;
    if (s === 'contacted' || s === 'quoted') return A.brass;
    if (s === 'booked') return A.green;
    if (s === 'lost') return A.red;
  }
  if (slice === 'invoices') {
    if (s === 'paid') return A.green;
    if (s === 'unpaid') return A.brassWarm;
    if (s === 'overdue') return A.red;
    if (s === 'cancelled') return A.inkMute;
  }
  if (slice === 'events') {
    if (s === 'cancelled') return A.red;
    if (s === 'completed') return A.green;
    return A.brassWarm;
  }
  return A.brassWarm;
}

interface Row {
  id: string; primary: string; secondary?: string; meta?: string;
  badge?: string; badgeAlert?: boolean; phone?: string; client_phone?: string;
  aiPrimer: string; deletePrimer: string;
  detail: { label: string; value: string }[];
}

function fmtRs(n: number | null | undefined) { return n == null ? 'Rs —' : `Rs ${n.toLocaleString('en-IN')}`; }
function fmtDate(iso: string | null | undefined) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${parseInt(m[3])} ${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m[2])-1]} ${m[1]}`;
}
function fmtLeadDate(iso: string | null | undefined, precision?: 'day' | 'month' | 'year' | null) {
  if (!iso) return '—';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  const monthAbbr = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][parseInt(m[2])-1];
  if (precision === 'year') return m[1];
  if (precision === 'month') return `${monthAbbr} ${m[1]}`;
  return `${parseInt(m[3])} ${monthAbbr} ${m[1]}`;
}

// Title-case a value from the API — "new" → "New", "unpaid" → "Unpaid",
// "Delhi NCR" stays "Delhi NCR" (already correct), "—" stays "—".
function cap(s: string | null | undefined): string {
  if (!s || s === '—') return s ?? '—';
  return s.split(/[\s_-]+/).map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function toRows(slice: ListSlice, clients: Client[], leads: Lead[], invoices: Invoice[], expenses: Expense[], events: VendorEvent[]): Row[] {
  const today = new Date().toISOString().slice(0,10);
  if (slice === 'clients') return clients.map(c => ({ id: c.id, primary: c.name, secondary: c.phone ?? undefined, meta: c.email ?? undefined, phone: c.phone ?? undefined, aiPrimer: `What would you like to change about ${c.name}?`, deletePrimer: `Delete client ${c.name} (id: ${c.id}).`, detail: [{label:'Phone',value:c.phone??'—'},{label:'Email',value:c.email??'—'},{label:'Notes',value:c.notes??'—'},{label:'Added',value:fmtDate(c.created_at)}] }));
  if (slice === 'leads') return leads.map(l => ({ id: l.id, primary: l.name??'Unknown', secondary: l.wedding_city??undefined, meta: l.wedding_date?fmtLeadDate(l.wedding_date, l.wedding_date_precision):undefined, badge: l.state, badgeAlert: l.state==='lost', phone: l.phone??undefined, aiPrimer: `What would you like to change about the ${l.name??'unnamed'} lead?`, deletePrimer: `Delete the lead for ${l.name??'unknown'} (id: ${l.id}).`, detail: [{label:'State',value:l.state},{label:'Wedding date',value:fmtLeadDate(l.wedding_date, l.wedding_date_precision)},{label:'City',value:l.wedding_city??'—'},{label:'Budget',value:fmtRs(l.budget_total)},{label:'Source',value:l.source??'—'}] }));
  if (slice === 'invoices') return invoices.map(inv => ({ id: inv.id, primary: inv.client_name, secondary: inv.invoice_number, meta: inv.due_date?`due ${fmtDate(inv.due_date)}`:undefined, badge: inv.state, badgeAlert: inv.state==='unpaid'&&!!inv.due_date&&inv.due_date<today, client_phone: inv.client_phone??undefined, aiPrimer: `What would you like to change about invoice ${inv.invoice_number} for ${inv.client_name}?`, deletePrimer: `Delete invoice ${inv.invoice_number} for ${inv.client_name} — ${fmtRs(inv.amount_total)} (id: ${inv.id}).`, detail: [{label:'Invoice #',value:inv.invoice_number},{label:'Total',value:fmtRs(inv.amount_total)},{label:'Paid',value:fmtRs(inv.amount_paid)},{label:'Owed',value:fmtRs(inv.amount_owed)},{label:'State',value:inv.state},{label:'Due',value:fmtDate(inv.due_date)}] }));
  if (slice === 'expenses') return expenses.map(exp => ({ id: exp.id, primary: exp.description??'Expense', secondary: exp.category??undefined, meta: exp.expense_date?fmtDate(exp.expense_date):undefined, badge: fmtRs(exp.amount), aiPrimer: `What would you like to change about the expense "${exp.description??'this expense'}" — ${fmtRs(exp.amount)}?`, deletePrimer: `Delete expense "${exp.description??'this expense'}" — ${fmtRs(exp.amount)} (id: ${exp.id}).`, detail: [{label:'Amount',value:fmtRs(exp.amount)},{label:'Category',value:exp.category??'—'},{label:'Description',value:exp.description??'—'},{label:'Date',value:fmtDate(exp.expense_date)},{label:'Client',value:exp.client_name??'—'}] }));
  return events.map(ev => ({ id: ev.id, primary: ev.title, secondary: ev.kind, meta: fmtDate(ev.event_date)+(ev.event_time?` · ${ev.event_time.slice(0,5)}`:''), badge: ev.state, aiPrimer: `What would you like to change about the event "${ev.title}" on ${fmtDate(ev.event_date)}?`, deletePrimer: `Delete the event "${ev.title}" on ${fmtDate(ev.event_date)} (id: ${ev.id}).`, detail: [{label:'Kind',value:ev.kind},{label:'Date',value:fmtDate(ev.event_date)},{label:'Time',value:ev.event_time?ev.event_time.slice(0,5):'—'},{label:'State',value:ev.state},{label:'Notes',value:ev.notes??'—'}] }));
}


// WhatsApp icon — defined outside JSX to avoid path string parsing issues
const WaIcon = () => (
  <svg width="15" height="15" viewBox="0 0 15 15" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path fillRule="evenodd" clipRule="evenodd" d="M7.5 0C3.358 0 0 3.358 0 7.5c0 1.32.344 2.56.946 3.634L0 15l3.99-1.046A7.46 7.46 0 007.5 15C11.642 15 15 11.642 15 7.5S11.642 0 7.5 0zm0 13.75a6.21 6.21 0 01-3.17-.868l-.228-.135-2.357.557.584-2.296-.148-.235A6.21 6.21 0 011.25 7.5C1.25 4.048 4.048 1.25 7.5 1.25S13.75 4.048 13.75 7.5 10.952 13.75 7.5 13.75zM10.9 9.1c-.186-.093-1.1-.543-1.27-.604-.17-.062-.294-.093-.418.093-.124.186-.48.604-.588.728-.108.124-.217.14-.403.047-.186-.094-.786-.29-1.497-.924-.553-.494-.926-1.104-1.035-1.29-.108-.186-.011-.287.082-.38.084-.083.186-.217.279-.325.093-.108.124-.186.186-.31.062-.124.031-.233-.015-.326-.047-.093-.418-1.01-.573-1.382-.151-.364-.304-.315-.418-.321-.108-.006-.232-.007-.356-.007-.124 0-.326.047-.497.233-.17.186-.651.636-.651 1.551 0 .916.667 1.8.76 1.924.093.124 1.312 2.003 3.179 2.81.444.192.79.306.06.391.446.141.852.122.874.055.268-.053 1.1-.45.255-.886.155-.324.155-.81.108-.885.047-.062-.17-.124-.357-.217z"/>
  </svg>
);

export default function SlicePage() {
  const router = useRouter();
  const params = useParams<{ slice: string }>();
  const slice  = params?.slice as ListSlice;
  const { session, loading: sl } = useVendorSession();
  useEffect(() => { if (!sl && !session) router.replace('/'); }, [sl, session, router]);
  if (sl || !session) return <div style={{ flex: 1 }} aria-busy="true" />;
  if (!['clients','leads','invoices','events','expenses'].includes(slice))
    return <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ fontFamily: F.script, fontStyle: 'italic', color: A.inkMute }}>Unknown.</div>
    </div>;
  return <SliceScreen vendorId={session.id} slice={slice} />;
}

function SliceScreen({ vendorId, slice }: { vendorId: string; slice: ListSlice }) {
  const router = useRouter();
  const { session } = useVendorSession();
  const c  = useClientsData(slice==='clients'  ? vendorId : null);
  const l  = useLeadsData(slice==='leads'    ? vendorId : null);
  const i  = useInvoicesData(slice==='invoices' ? vendorId : null);
  const ex = useExpensesData(slice==='expenses' ? vendorId : null);
  const ev = useEventsData(slice==='events'   ? vendorId : null);

  const rawRows = useMemo(() => toRows(slice, c.data??[], l.data??[], i.data??[], ex.data??[], ev.data??[]),
    [slice, c.data, l.data, i.data, ex.data, ev.data]);

  const loading = c.loading||l.loading||i.loading||ex.loading||ev.loading;
  const error   = c.error||l.error||i.error||ex.error||ev.error;

  const [query, setQuery]     = useState('');
  const [sel, setSel]         = useState<Row|null>(null);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,    setDeleting]    = useState(false);
  const [deleteMsg,   setDeleteMsg]   = useState<string | null>(null);
  // Schedule state (invoice slice only)
  const [schedule,       setSchedule]       = useState<ScheduleMilestone[] | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleOpen,    setScheduleOpen]    = useState(false);
  const [milestones,      setMilestones]      = useState([{ label: 'Booking', pct: '30', due_date: '' }, { label: 'Shoot day', pct: '40', due_date: '' }, { label: 'Delivery', pct: '30', due_date: '' }]);
  const [scheduleSaving,  setScheduleSaving]  = useState(false);
  const [addOpen,     setAddOpen]     = useState(false);
  const [editRow,     setEditRow]     = useState<Record<string,unknown> | null>(null);
  const [editPrimer,  setEditPrimer]  = useState<string>('');
  const { toast, show: showToast }   = useToast();
  const [pdfBusy, setPdfBusy] = useState(false);
  const [leadDetail, setLeadDetail] = useState<{ vendor_summary: string | null; conversation: ConversationMessage[] } | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  async function doCreateSchedule() {
    if (!sel || scheduleSaving) return;
    const total = milestones.reduce((s, m) => s + Number(m.pct || 0), 0);
    if (Math.abs(total - 100) > 0.01) return;
    setScheduleSaving(true);
    const res = await createSchedule(sel.id, milestones.map(m => ({
      label: m.label, pct: Number(m.pct), due_date: m.due_date || undefined,
    })));
    if (!res.ok) showToast((res as { error?: string }).error ?? 'Failed to create schedule', 'error');
    else { setSchedule((res as { schedule: ScheduleMilestone[] }).schedule); setScheduleOpen(false); }
    setScheduleSaving(false);
  }

  // Fetch schedule when an invoice row is selected
  useEffect(() => {
    if (slice === 'invoices' && sel) {
      setSchedule(null); setScheduleLoading(true);
      fetchSchedule(sel.id).then(r => {
        if (r.ok) setSchedule((r as { schedule: ScheduleMilestone[] }).schedule);
        else setSchedule([]);
      }).catch(() => setSchedule([])).finally(() => setScheduleLoading(false));
    }
  }, [sel, slice]);

  async function downloadInvoicePdf() {
    if (!sel || pdfBusy) return;
    setPdfBusy(true);
    try {
      const res = await fetchInvoicePdf(sel.id);
      if (res.ok && (res as { pdf_url?: string }).pdf_url) {
        window.open((res as { pdf_url: string }).pdf_url, '_blank', 'noopener');
      } else {
        showToast((res as { error?: string }).error ?? 'PDF not ready yet — try again in a moment.', 'error');
      }
    } catch {
      showToast('Could not fetch the PDF. Try again.', 'error');
    }
    setPdfBusy(false);
  }

  const rows = useMemo(() => {
    if (!query.trim()) return rawRows;
    const q = query.trim().toLowerCase();
    return rawRows.filter(r => r.primary.toLowerCase().includes(q)||(r.secondary??'').toLowerCase().includes(q)||(r.meta??'').toLowerCase().includes(q));
  }, [rawRows, query]);

  // Fetch lead detail when a lead row is selected
  useEffect(() => {
    if (slice !== 'leads' || !sel) { setLeadDetail(null); return; }
    setLoadingDetail(true);
    fetchLeadDetail(sel.id).then(res => {
      if (res.ok) setLeadDetail({ vendor_summary: res.vendor_summary, conversation: res.conversation });
    }).catch(() => {}).finally(() => setLoadingDetail(false));
  }, [sel, slice]);

  function onEdit(row: Row) { setSel(null); router.push(`/wedding?aiPrimer=${encodeURIComponent(row.aiPrimer)}`); }
  function onEditHere(row: Row) {
    setSel(null);
    setEditPrimer(row.aiPrimer);
    let raw: Record<string,unknown> | null = null;
    if (slice === 'clients')  raw = ((c.data  ?? []).find(r => r.id === row.id) as unknown as Record<string,unknown>) ?? null;
    if (slice === 'leads')    raw = ((l.data  ?? []).find(r => r.id === row.id) as unknown as Record<string,unknown>) ?? null;
    if (slice === 'invoices') raw = ((i.data  ?? []).find(r => r.id === row.id) as unknown as Record<string,unknown>) ?? null;
    if (slice === 'expenses') raw = ((ex.data ?? []).find(r => r.id === row.id) as unknown as Record<string,unknown>) ?? null;
    if (slice === 'events')   raw = ((ev.data ?? []).find(r => r.id === row.id) as unknown as Record<string,unknown>) ?? null;
    if (!raw) raw = { id: row.id };
    setEditRow(raw);
    setAddOpen(true);
  }
  function onAdd() { setEditRow(null); setAddOpen(true); }

  async function confirmDelete() {
    if (!sel || deleting) return;
    setDeleting(true);
    try {
      let url = ''; let unsupported = false; let method = 'PATCH'; let body: string | undefined;
      if (slice === 'invoices') url = `${API_BASE}/api/v2/vendor/invoices/${sel.id}/cancel`;
      else if (slice === 'events')   url = `${API_BASE}/api/v2/vendor/events/${sel.id}/cancel`;
      else if (slice === 'leads')  { url = `${API_BASE}/api/v2/vendor/leads/${sel.id}/state`; body = JSON.stringify({ state: 'lost', reason: 'Removed from list' }); }
      else if (slice === 'clients')  { url = `${API_BASE}/api/v2/vendor/clients/${sel.id}`; method = 'DELETE'; }
      else if (slice === 'expenses') { url = `${API_BASE}/api/v2/vendor/expenses/${sel.id}`; method = 'DELETE'; }
      else unsupported = true;

      if (unsupported) { setDeleteMsg("Can't delete from here yet. Use the chat."); setDeleting(false); return; }

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json', ...getAuthHeader() }, body });
      const data = await res.json().catch(() => ({ ok: false, error: 'Server error.' }));
      if (!res.ok || !data.ok) setDeleteMsg(data.error ?? 'Something went wrong. Try again.');
      else { setDeleteMsg(data.message ?? 'Done.'); setTimeout(() => { setSel(null); setConfirmDel(false); setDeleteMsg(null); }, 1200); }
    } catch { setDeleteMsg('Network error. Try again.'); }
    finally { setDeleting(false); }
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, position: 'relative' }}>
      <Header vendorName={session?.name ?? null} />

      {/* Sub-header: back + brass label */}
      <div style={{ padding: '12px 22px 8px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '0.5px solid var(--atelier-card-border)' }}>
        <button type="button" onClick={() => router.back()} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: A.brassWarm, fontFamily: F.display, fontSize: 22, lineHeight: 1 }}>‹</button>
        <span style={{ fontFamily: F.label, fontWeight: 300, fontSize: 9, letterSpacing: '0.42em', textTransform: 'uppercase', color: A.brass }}>{LABELS[slice]}</span>
      </div>

      {/* Search */}
      <div style={{ padding: '12px 22px 6px' }}>
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', fontFamily: F.display, fontSize: 14, color: A.inkMute, lineHeight: 1, pointerEvents: 'none' }}>⌕</span>
          <input
            type="text"
            placeholder={`Search ${LABELS[slice].toLowerCase()}…`}
            value={query}
            onChange={e => setQuery(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px 10px 32px', boxSizing: 'border-box',
              background: 'var(--atelier-input-bg)',
              border: '0.5px solid var(--atelier-card-border)',
              borderRadius: 2,
              fontFamily: F.body, fontWeight: 300, fontSize: 13, color: A.ink,
              outline: 'none', caretColor: A.brass,
            }}
          />
        </div>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', paddingBottom: 110 }}>
        {!loading && !error && rows.length === 0 && (
          <div style={{
            padding: '40px 24px', textAlign: 'center',
            fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 16,
            color: A.inkMute, lineHeight: 1.5,
          }}>
            {query
              ? <>Nothing matching <span style={{ color: A.brassWarm }}>&ldquo;{query}&rdquo;</span></>
              : <>Nothing here yet.<br/><span style={{ color: A.brassWarm }}>Tap the + to add one.</span></>}
          </div>
        )}
        {rows.map(row => <ListRow key={row.id} row={row} slice={slice} onSelect={() => { setSel(row); setConfirmDel(false); }} />)}
      </div>

      {/* Brass-key FAB */}
      <button type="button" onClick={onAdd} aria-label={`Add ${LABELS[slice].toLowerCase()}`}
        className="atelier-fab"
        style={{
          position: 'fixed', bottom: 'calc(82px + env(safe-area-inset-bottom))', right: 20, zIndex: 30,
          width: 46, height: 46, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: F.body, fontSize: 22, fontWeight: 400, lineHeight: 1,
          cursor: 'pointer', border: '0.5px solid #E0BC6E',
        }}>+</button>

      <Toast toast={toast} />
      <AddSheet
        open={addOpen}
        slice={slice}
        onClose={() => { setAddOpen(false); setEditRow(null); setEditPrimer(''); }}
        onToast={(msg: string, kind?: ToastKind) => showToast(msg, kind)}
        existing={editRow}
        existingId={editRow?.id as string | undefined}
        editPrimer={editPrimer}
      />

      {/* Schedule builder sheet */}
      {scheduleOpen && sel && (
        <div style={{ position: 'fixed', inset: 0, background: 'var(--atelier-overlay)', zIndex: 60, display: 'flex', alignItems: 'flex-end' }}
          onClick={() => setScheduleOpen(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '100%',
            background: 'var(--atelier-sheet-bg)',
            backdropFilter: 'blur(40px) saturate(1.8)', WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            borderTop: '0.5px solid var(--atelier-sheet-border)',
            padding: '20px 24px calc(24px + env(safe-area-inset-bottom))',
            display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '85vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--atelier-label)' }} />
            </div>
            <div style={{ fontFamily: F.label, fontWeight: 300, fontSize: 9, letterSpacing: '0.42em', textTransform: 'uppercase', color: A.brass }}>Payment Schedule</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 22, color: 'var(--atelier-ink)', lineHeight: 1.15, marginBottom: 4 }}>Add Milestones</div>
            <div style={{ fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 13, color: A.inkMute, marginTop: -4, marginBottom: 4 }}>
              Must sum to 100%. Amounts computed from invoice total.
            </div>

            {milestones.map((ms, idx) => (
              <div key={idx} style={{
                padding: '12px 14px',
                background: 'var(--atelier-row-hover)',
                border: '0.5px solid var(--atelier-card-border)',
                borderRadius: 2,
                display: 'flex', flexDirection: 'column', gap: 8,
              }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    value={ms.label}
                    onChange={e => setMilestones(prev => prev.map((m, i) => i === idx ? { ...m, label: e.target.value } : m))}
                    placeholder="Booking"
                    style={{
                      flex: 2, padding: '8px 10px', boxSizing: 'border-box',
                      background: 'var(--atelier-input-bg)',
                      border: '0.5px solid var(--atelier-card-border)', borderRadius: 2,
                      fontFamily: F.body, fontWeight: 300, fontSize: 13, color: A.ink,
                      outline: 'none', caretColor: A.brass,
                    }}
                  />
                  <input
                    type="number"
                    value={ms.pct}
                    onChange={e => setMilestones(prev => prev.map((m, i) => i === idx ? { ...m, pct: e.target.value } : m))}
                    placeholder="%"
                    style={{
                      flex: 1, padding: '8px 10px', boxSizing: 'border-box',
                      background: 'var(--atelier-input-bg)',
                      border: '0.5px solid var(--atelier-card-border)', borderRadius: 2,
                      fontFamily: F.body, fontWeight: 300, fontSize: 13, color: A.ink,
                      outline: 'none', textAlign: 'right', caretColor: A.brass,
                    }}
                  />
                  <span style={{ fontFamily: F.label, fontSize: 10, color: A.inkMute, flexShrink: 0 }}>%</span>
                  {milestones.length > 2 && (
                    <button type="button" onClick={() => setMilestones(prev => prev.filter((_, i) => i !== idx))}
                      style={{ padding: '4px 6px', background: 'transparent', border: 'none', cursor: 'pointer', color: A.red, fontSize: 18, lineHeight: 1, flexShrink: 0 }}>×</button>
                  )}
                </div>
                <input
                  type="date"
                  value={ms.due_date}
                  onChange={e => setMilestones(prev => prev.map((m, i) => i === idx ? { ...m, due_date: e.target.value } : m))}
                  style={{
                    width: '100%', padding: '8px 10px', boxSizing: 'border-box',
                    background: 'var(--atelier-input-bg)',
                    border: '0.5px solid var(--atelier-card-border)', borderRadius: 2,
                    fontFamily: F.body, fontWeight: 300, fontSize: 12, color: A.inkSoft,
                    outline: 'none', colorScheme: 'dark', caretColor: A.brass,
                  }}
                />
              </div>
            ))}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
              <button type="button" onClick={() => setMilestones(prev => [...prev, { label: '', pct: '0', due_date: '' }])}
                style={{
                  padding: '6px 12px', background: 'transparent',
                  border: '0.5px solid var(--atelier-sheet-border)', borderRadius: 2, cursor: 'pointer',
                  fontFamily: F.label, fontWeight: 300, fontSize: 8, color: A.brassWarm,
                  letterSpacing: '0.28em', textTransform: 'uppercase',
                }}>+ Add Row</button>
              <span style={{
                fontFamily: F.label, fontWeight: 300, fontSize: 9,
                letterSpacing: '0.28em', textTransform: 'uppercase',
                color: Math.abs(milestones.reduce((s,m) => s + Number(m.pct||0), 0) - 100) < 0.01 ? A.green : A.red,
              }}>{milestones.reduce((s,m) => s + Number(m.pct||0), 0)}% of 100%</span>
            </div>

            {(() => {
              const total = milestones.reduce((s,m) => s + Number(m.pct||0), 0);
              const canSave = Math.abs(total - 100) < 0.01 && milestones.every(m => m.label.trim());
              return (
                <>
                  {!canSave && (
                    <div style={{ fontFamily: F.script, fontStyle: 'italic', fontSize: 12, color: A.red, marginTop: 2 }}>
                      {Math.abs(total - 100) > 0.01 ? `Percentages must sum to 100% (currently ${total}%)` : 'All milestones need a label'}
                    </div>
                  )}
                  <button type="button" onClick={doCreateSchedule} disabled={!canSave || scheduleSaving}
                    className={canSave && !scheduleSaving ? 'atelier-fab' : undefined}
                    style={{
                      padding: '14px 0', borderRadius: 2,
                      border: '0.5px solid #E0BC6E',
                      cursor: (canSave && !scheduleSaving) ? 'pointer' : 'default',
                      fontFamily: F.label, fontWeight: 400, fontSize: 10, color: '#1A120E',
                      letterSpacing: '0.42em', textTransform: 'uppercase',
                      background: !canSave || scheduleSaving ? 'rgba(201,168,76,0.18)' : undefined,
                      opacity: !canSave || scheduleSaving ? 0.6 : 1,
                      marginTop: 4,
                    }}>{scheduleSaving ? 'Saving…' : 'Create Schedule'}</button>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Detail bottom sheet */}
      <>
        {sel && <div onClick={() => { setSel(null); setConfirmDel(false); }} style={{ position: 'fixed', inset: 0, zIndex: 40, background: 'var(--atelier-overlay)' }} />}
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          background: 'var(--atelier-sheet-bg)',
          backdropFilter: 'blur(40px) saturate(1.8)', WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
          borderTop: '0.5px solid var(--atelier-sheet-border)',
          padding: `0 0 calc(20px + env(safe-area-inset-bottom))`,
          transform: sel ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 320ms cubic-bezier(0.22,1,0.36,1)',
          maxHeight: '88dvh', display: 'flex', flexDirection: 'column',
        }}>
          {/* Drag handle */}
          <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
            <div style={{ width: 36, height: 3, borderRadius: 2, background: 'var(--atelier-label)' }} />
          </div>
          {/* Calling-card header */}
          <div style={{ padding: '6px 24px 14px', borderBottom: '0.5px solid var(--atelier-card-border)' }}>
            <div style={{ fontFamily: F.label, fontWeight: 300, fontSize: 9, letterSpacing: '0.42em', textTransform: 'uppercase', color: A.brass, marginBottom: 4 }}>{LABELS[slice]}</div>
            <div style={{ fontFamily: F.display, fontWeight: 400, fontSize: 24, color: 'var(--atelier-ink)', letterSpacing: '0.005em', lineHeight: 1.15 }}>{sel?.primary ?? ''}</div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '12px 24px' }}>
            {(sel?.detail ?? []).map((f, ii) => (
              <div key={ii} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                padding: '10px 0', gap: 14,
                borderBottom: ii < (sel?.detail.length ?? 0) - 1 ? '0.5px solid var(--atelier-card-border)' : 'none',
              }}>
                <span style={{ fontFamily: F.label, fontWeight: 300, fontSize: 8, color: A.inkMute, letterSpacing: '0.32em', textTransform: 'uppercase', flexShrink: 0, paddingTop: 3 }}>{f.label}</span>
                <span style={{ fontFamily: F.script, fontWeight: 500, fontSize: 15, color: A.ink, letterSpacing: '0.005em', textAlign: 'right' }}>{cap(f.value)}</span>
              </div>
            ))}

            {/* Invoice payment schedule */}
            {slice === 'invoices' && sel && (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid var(--atelier-card-border)' }}>
                <button type="button" onClick={downloadInvoicePdf} disabled={pdfBusy}
                  className={!pdfBusy ? 'atelier-fab' : undefined}
                  style={{
                    width: '100%', marginBottom: 8, padding: '11px 14px',
                    background: pdfBusy ? 'rgba(201,168,76,0.18)' : undefined,
                    border: '0.5px solid #E0BC6E', borderRadius: 3,
                    cursor: pdfBusy ? 'default' : 'pointer', opacity: pdfBusy ? 0.6 : 1,
                    fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#1A120E',
                    letterSpacing: '0.28em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                  {pdfBusy ? 'Fetching…' : '↓ Download PDF'}
                </button>

                {/* Send on WhatsApp — only shown when client has a phone number.
                    Fetches the PDF URL, then opens wa.me pre-loaded with the
                    client's number and the PDF link in the draft message. */}
                {sel.client_phone && (
                  <button type="button"
                    onClick={async () => {
                      try {
                        const res = await fetchInvoicePdf(sel.id);
                        const pdfRes = res as { ok: boolean; pdf_url?: string; error?: string };
                        if (pdfRes.ok && pdfRes.pdf_url) {
                          const phone   = (sel.client_phone ?? '').replace(/\D/g, '');
                          const message = encodeURIComponent(`Hi ${sel.primary}, please find your booking confirmation for ${sel.secondary ?? 'your invoice'} here: ${pdfRes.pdf_url}`);
                          window.open(`https://wa.me/${phone}?text=${message}`, '_blank', 'noopener');
                        } else {
                          showToast(pdfRes.error ?? 'PDF not ready yet — record the advance first.', 'error');
                        }
                      } catch {
                        showToast('Could not fetch the PDF. Try again.', 'error');
                      }
                    }}
                    style={{
                      width: '100%', marginBottom: 16, padding: '11px 14px',
                      background: 'transparent',
                      border: '0.5px solid rgba(37,211,102,0.5)', borderRadius: 3,
                      cursor: 'pointer',
                      fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#25D366',
                      letterSpacing: '0.28em', textTransform: 'uppercase',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}>
                    ↗ Send on WhatsApp
                  </button>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <span style={{ fontFamily: F.label, fontWeight: 300, fontSize: 8, color: A.brass, letterSpacing: '0.42em', textTransform: 'uppercase' }}>Payment Schedule</span>
                  <span style={{ flex: 1, height: '0.5px', background: 'rgba(201,168,76,0.22)' }} />
                  {schedule && schedule.length === 0 && (
                    <button type="button" onClick={() => setScheduleOpen(true)} style={{
                      padding: '5px 10px', background: 'transparent',
                      border: '0.5px solid rgba(201,168,76,0.5)', borderRadius: 2, cursor: 'pointer',
                      fontFamily: F.label, fontWeight: 300, fontSize: 8, color: A.brassWarm,
                      letterSpacing: '0.28em', textTransform: 'uppercase',
                    }}>Add</button>
                  )}
                </div>
                {scheduleLoading && <div style={{ fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 13, color: A.inkMute }}>Fetching…</div>}
                {schedule && schedule.map(ms => (
                  <div key={ms.id} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0',
                    borderBottom: '0.5px solid rgba(201,168,76,0.10)',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: F.script, fontWeight: 500, fontSize: 15, color: A.ink }}>{ms.milestone_label}</div>
                      <div style={{ fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 12, color: A.inkMute, marginTop: 2 }}>
                        Rs {ms.amount_due.toLocaleString('en-IN')} · {ms.pct}%{ms.due_date ? ` · ${ms.due_date}` : ''}
                      </div>
                    </div>
                    <span style={{
                      fontFamily: F.label, fontWeight: 400, fontSize: 8,
                      color: ms.state === 'paid' ? A.green : ms.state === 'waived' ? A.inkMute : A.brassWarm,
                      letterSpacing: '0.28em', textTransform: 'uppercase',
                      border: `0.5px solid ${ms.state === 'paid' ? A.green : ms.state === 'waived' ? 'var(--atelier-ink-dim)' : 'rgba(224,188,110,0.5)'}`,
                      borderRadius: 2, padding: '3px 8px', flexShrink: 0,
                    }}>{ms.state}</span>
                    {ms.state === 'pending' && (
                      <button type="button" onClick={async () => {
                        setScheduleSaving(true);
                        const res = await markMilestonePaid(ms.id, ms.amount_due);
                        if (res.ok) setSchedule(prev => prev ? prev.map(m => m.id === ms.id ? (res as { milestone: ScheduleMilestone }).milestone : m) : prev);
                        setScheduleSaving(false);
                      }} disabled={scheduleSaving} className="atelier-fab" style={{
                        padding: '5px 10px', borderRadius: 2, cursor: 'pointer',
                        border: '0.5px solid #E0BC6E',
                        fontFamily: F.label, fontWeight: 400, fontSize: 8, color: '#1A120E',
                        letterSpacing: '0.28em', textTransform: 'uppercase', flexShrink: 0,
                      }}>Paid</button>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Lead vendor summary + conversation */}
            {slice === 'leads' && (leadDetail || loadingDetail) && (
              <div style={{ marginTop: 18, paddingTop: 18, borderTop: '0.5px solid var(--atelier-card-border)' }}>
                {loadingDetail && !leadDetail
                  ? <div style={{ fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 13, color: A.inkMute }}>Fetching…</div>
                  : leadDetail && <ConversationThread vendorSummary={leadDetail.vendor_summary} messages={leadDetail.conversation} />
                }
              </div>
            )}
          </div>

          {/* Footer actions */}
          <div style={{ padding: '12px 24px 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {/* WhatsApp + Call for leads with phone */}
            {slice === 'leads' && sel?.phone && !confirmDel && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                <a href={`https://wa.me/${sel.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 0',
                    background: 'rgba(127,190,133,0.08)',
                    border: '0.5px solid rgba(127,190,133,0.42)',
                    borderRadius: 2, textDecoration: 'none',
                  }}>
                  <WaIcon />
                  <span style={{ fontFamily: F.label, fontWeight: 300, fontSize: 9, color: A.green, letterSpacing: '0.32em', textTransform: 'uppercase' }}>WhatsApp</span>
                </a>
                <a href={`tel:${sel.phone}`}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '11px 0',
                    background: 'var(--atelier-input-bg)',
                    border: '0.5px solid var(--atelier-sheet-border)',
                    borderRadius: 2, textDecoration: 'none',
                  }}>
                  <span style={{ fontFamily: F.display, fontSize: 14, color: A.brassWarm, lineHeight: 1 }}>☎</span>
                  <span style={{ fontFamily: F.label, fontWeight: 300, fontSize: 9, color: A.brassWarm, letterSpacing: '0.32em', textTransform: 'uppercase' }}>Call</span>
                </a>
              </div>
            )}

            {!confirmDel ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="button" onClick={() => sel && onEditHere(sel)} className="atelier-fab" style={{
                  flex: 1, padding: '12px 16px', borderRadius: 2, cursor: 'pointer',
                  border: '0.5px solid #E0BC6E',
                  fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#1A120E',
                  letterSpacing: '0.32em', textTransform: 'uppercase',
                }}>Edit Here</button>
                <button type="button" onClick={() => sel && onEdit(sel)} style={{
                  flex: 1, padding: '12px 16px', background: 'transparent',
                  border: '0.5px solid var(--atelier-sheet-border)', borderRadius: 2, cursor: 'pointer',
                  fontFamily: F.label, fontWeight: 300, fontSize: 9, color: A.brassWarm,
                  letterSpacing: '0.32em', textTransform: 'uppercase',
                }}>Via Chat</button>
                <button type="button" onClick={() => { setConfirmDel(true); setDeleteMsg(null); }} style={{
                  flex: 1, padding: '12px 16px', background: 'transparent',
                  border: '0.5px solid rgba(224,123,92,0.4)', borderRadius: 2, cursor: 'pointer',
                  fontFamily: F.label, fontWeight: 300, fontSize: 9, color: A.red,
                  letterSpacing: '0.32em', textTransform: 'uppercase',
                }}>Delete</button>
              </div>
            ) : deleteMsg ? (
              <div style={{
                fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 14,
                color: deleteMsg.startsWith('Done') || deleteMsg.includes('cancelled') ? A.brassWarm : A.red,
                textAlign: 'center', lineHeight: 1.5, padding: '8px 0',
              }}>{deleteMsg}</div>
            ) : (
              <>
                <div style={{ fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 14, color: A.inkSoft, textAlign: 'center', lineHeight: 1.6 }}>
                  {slice === 'invoices' ? 'Cancel' : 'Remove'} <span style={{ color: 'var(--atelier-ink)', fontStyle: 'normal' }}>{sel?.primary}</span>?<br/>
                  <span style={{ fontSize: 12, color: A.inkMute }}>
                    {slice === 'invoices' ? 'Invoice will be marked cancelled.' :
                     slice === 'leads'    ? 'Lead will be marked as lost.' :
                     slice === 'events'   ? 'Event will be cancelled.' :
                     'This will be permanently deleted.'}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button type="button" onClick={() => setConfirmDel(false)} style={{
                    flex: 1, padding: '12px 16px', background: 'transparent',
                    border: '0.5px solid var(--atelier-sheet-border)', borderRadius: 2, cursor: 'pointer',
                    fontFamily: F.label, fontWeight: 300, fontSize: 9, color: A.brassWarm,
                    letterSpacing: '0.32em', textTransform: 'uppercase',
                  }}>Back</button>
                  <button type="button" onClick={confirmDelete} disabled={deleting} style={{
                    flex: 1, padding: '12px 16px',
                    background: deleting ? 'rgba(224,123,92,0.4)' : A.red,
                    border: 'none', borderRadius: 2,
                    cursor: deleting ? 'default' : 'pointer',
                    fontFamily: F.label, fontWeight: 400, fontSize: 9, color: '#1A120E',
                    letterSpacing: '0.32em', textTransform: 'uppercase',
                  }}>{deleting ? 'Working…' : 'Confirm'}</button>
                </div>
              </>
            )}
          </div>
        </div>
      </>
    </div>
  );
}

// ── Row · Atelier ────────────────────────────────────────────────
// CRITICAL: state pill always renders the SAME WAY regardless of whether
// city/date/phone fields are populated. Geometry is fixed: monogram glyph
// + name + italic Cormorant detail line + state pill on the right. When
// detail values are missing we render an em-dash placeholder so the
// pill never floats in empty space — same chrome anchors every row.
function ListRow({ row, slice, onSelect }: { row: Row; slice: ListSlice; onSelect: () => void }) {
  const A = {
    ink: 'var(--atelier-ink)', inkSoft: 'var(--atelier-ink-soft)', inkMute: 'var(--atelier-ink-mute)',
    brass: '#C9A84C', brassWarm: 'var(--atelier-label)', green: '#7FBE85', red: '#E07B5C',
  };

  // Build detail line — always has content, never blank
  const detailParts = [row.secondary, row.meta].filter(Boolean) as string[];
  const detailLine = detailParts.length > 0 ? detailParts.map(cap).join(' · ') : '—';

  const pillColor = stateColor(slice, row.badge);

  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      borderBottom: '0.5px solid var(--atelier-card-border)',
    }}>
      <button type="button" onClick={onSelect} style={{
        flex: 1, minWidth: 0,
        display: 'flex', alignItems: 'center', gap: 16,
        padding: '15px 16px 15px 22px',
        background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
      }}>
        {/* Monogram glyph — always present, anchors left edge */}
        <span style={{
          flexShrink: 0, width: 28, textAlign: 'center',
          fontFamily: F.display, fontWeight: 400, fontSize: 22,
          color: A.brassWarm, lineHeight: 1,
        }}>{GLYPHS[slice]}</span>

        {/* Name + detail line */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontFamily: F.script, fontWeight: 500, fontSize: 18,
            color: A.ink, letterSpacing: '0.005em', lineHeight: 1.15,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{row.primary}</div>
          <div style={{
            fontFamily: F.script, fontStyle: 'italic', fontWeight: 300, fontSize: 12,
            color: A.inkMute, letterSpacing: '0.01em', marginTop: 3,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>{detailLine}</div>
        </div>

        {/* State pill — same chrome regardless of detail-line content */}
        {row.badge && (
          <span style={{
            flexShrink: 0,
            fontFamily: F.label, fontWeight: 400, fontSize: 8,
            color: pillColor,
            letterSpacing: '0.32em', textTransform: 'uppercase',
            border: `0.5px solid ${pillColor}`,
            borderRadius: 2,
            padding: '4px 9px',
            minWidth: 56, textAlign: 'center',
          }}>{row.badge}</span>
        )}
      </button>

      {/* WhatsApp + Call buttons — clients only, when phone exists */}
      {slice === 'clients' && row.phone && (
        <div style={{ display: 'flex', gap: 6, paddingRight: 16, flexShrink: 0 }}>
          <a href={`https://wa.me/${row.phone.replace(/\D/g,'')}`} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            aria-label={`WhatsApp ${row.primary}`}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(127,190,133,0.10)',
              border: '0.5px solid rgba(127,190,133,0.42)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
              fontFamily: F.display, fontSize: 14, color: A.green, lineHeight: 1,
            }}><WaIcon /></a>
          <a href={`tel:${row.phone}`}
            onClick={e => e.stopPropagation()}
            aria-label={`Call ${row.primary}`}
            style={{
              width: 34, height: 34, borderRadius: '50%',
              background: 'var(--atelier-input-bg)',
              border: '0.5px solid var(--atelier-sheet-border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
              fontFamily: F.display, fontSize: 14, color: A.brassWarm, lineHeight: 1,
            }}>☎</a>
        </div>
      )}
    </div>
  );
}
