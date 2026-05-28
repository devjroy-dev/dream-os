'use client';

// sanctuary/page.tsx — V5 BLOOM ARCHITECTURE
// Every slice opens IN THIS PAGE. No router.push. No history stack.
// She taps a slice → it blooms up from position → fills screen.
// She swipes down or taps ← → contracts back to Sanctuary.
// Same URL. Same component. Sanctuary is always underneath.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useFrostMode } from '../../../layout';
import { EASE, FROST_COPY, daysUntil } from '../../../../../lib/frost/tokens';
import { Send } from 'lucide-react';
import { streamBrideChat } from '../../../../../lib/frost-api/couple';
import { fetchCircle, inviteCircleMember, fetchMemberFeed, timeAgo, formatActivityLine, fetchEvents, fetchReceipts, deleteReceipt, fetchBookings, createBooking, updateBooking, deleteBooking, recordPayment, fetchProfile, type CircleData, type CircleActivity, type CircleMember, type CoupleEvent, type CoupleReceipt, type CoupleBooking, type CoupleProfile } from '../../../../../lib/frost/journey';
import { fetchMuseSaves, deleteMuseSave, uploadMuseImage, createMuseSaveFromUrl, fetchSaveActivity, saveVendorToMuse } from '../../../../../lib/frost-api/muse';
import { fetchDiscoverFeed, makeEnquireLink } from '../../../../../lib/frost-api/discover';
import type { DiscoverVendor } from '../../../../../lib/types/discover';
import type { MuseSave, MuseActivity } from '../../../../../lib/types/discover';

// ── Types ─────────────────────────────────────────────────────────────────────
type RoomKey = 'dream'|'circle'|'muse'|'discover'|'people'|'pages'|'moments'|'events'|'meridian'|'expenses'|'vendors'|'settings'|null;

interface UIMsg {
  id: string; role:'user'|'assistant'; content:string; pending?:boolean; error?:boolean;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DEMO_WEDDING    = new Date('2026-11-19T00:00:00+05:30');
const DEMO_ENGAGEMENT = new Date('2026-04-11T00:00:00+05:30');

function getWeddingDate():Date{ try{const r=localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');if(r){const s=JSON.parse(r);if(s?.wedding_date)return new Date(s.wedding_date);}}catch{}return DEMO_WEDDING; }
function getEngagementDate():Date{ try{const r=localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');if(r){const s=JSON.parse(r);if(s?.engagement_date)return new Date(s.engagement_date);}}catch{}return DEMO_ENGAGEMENT; }
function getBrideName():string{ try{const r=localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');if(r){const s=JSON.parse(r);const n=(s?.user_name||s?.bride_name||s?.name||'').trim().split(' ')[0];if(n)return n;}}catch{}return 'Priya'; }
function daysSince(d:Date):number{const t=new Date();t.setHours(0,0,0,0);const e=new Date(d);e.setHours(0,0,0,0);return Math.max(0,Math.round((t.getTime()-e.getTime())/86400000));}
function arcProgress(d:number):number{return Math.max(0,Math.min(1,1-d/365));}
function arcPoint(t:number){const p0={x:18,y:92},p1={x:160,y:4},p2={x:302,y:92};const u=1-t;return{x:u*u*p0.x+2*u*t*p1.x+t*t*p2.x,y:u*u*p0.y+2*u*t*p1.y+t*t*p2.y};}
function arcPathTo(t:number):string{if(t<=0)return'M 18 92';const p0={x:18,y:92},p1={x:160,y:4},p2={x:302,y:92};const q0={x:p0.x+(p1.x-p0.x)*t,y:p0.y+(p1.y-p0.y)*t};const q1={x:p1.x+(p2.x-p1.x)*t,y:p1.y+(p2.y-p1.y)*t};const ep={x:q0.x+(q1.x-q0.x)*t,y:q0.y+(q1.y-q0.y)*t};return`M 18 92 Q ${q0.x.toFixed(1)} ${q0.y.toFixed(1)} ${ep.x.toFixed(1)} ${ep.y.toFixed(1)}`;}
const ONES=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine','Ten','Eleven','Twelve','Thirteen','Fourteen','Fifteen','Sixteen','Seventeen','Eighteen','Nineteen'];
const TENS=['','','Twenty','Thirty','Forty','Fifty','Sixty','Seventy','Eighty','Ninety'];
function toW(n:number):string{if(n<20)return ONES[n]||String(n);const t=Math.floor(n/10),o=n%10;if(!o)return TENS[t];return`${TENS[t]}-${ONES[o].toLowerCase()}`;}
function bigW(n:number):string{if(n<100)return toW(n);const h=Math.floor(n/100),r=n%100;return ONES[h]+' hundred'+(r?' and '+toW(r).toLowerCase():'');}
function dW(n:number):string{if(n<100)return toW(n);if(n<1000)return bigW(n);return String(n);}
function prose(d:number):string{if(d===0)return'Today.';const w=dW(d);return`${w.charAt(0).toUpperCase()+w.slice(1)} mornings between I will and I do.`;}
function romanDate():string{const n=new Date(),R=['','i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii'];return`${String(n.getDate()).padStart(2,'0')} · ${R[n.getMonth()+1]} · ${String(n.getFullYear()).slice(-2)}`;}
function getDailyPoetry():string{const pool=FROST_COPY.idlePool;const d=Math.floor((Date.now()-new Date(new Date().getFullYear(),0,0).getTime())/86400000);return pool[d%pool.length];}
function uid(){return Math.random().toString(36).slice(2);}

// ── CSS ───────────────────────────────────────────────────────────────────────
const CSS=`
@keyframes gnB{0%,100%{transform:translateX(-50%) scale(1);}50%{transform:translateX(-50%) scale(1.006);}}
@keyframes numB{0%,100%{transform:scale(1);}50%{transform:scale(1.003);}}
@keyframes dC{0%,37%,100%{opacity:.42;}18%{opacity:1;}}
@keyframes dH{0%,37%,100%{opacity:.15;}18%{opacity:.58;}}
@keyframes dO{0%,37%,100%{opacity:.05;}18%{opacity:.22;}}
@keyframes cF{0%{opacity:.7}15%{opacity:1}28%{opacity:.85}45%{opacity:1}60%{opacity:.88}75%{opacity:1}88%{opacity:.72}100%{opacity:.7}}
@keyframes sIn{from{opacity:0;transform:translateY(3px);}to{opacity:1;transform:translateY(0);}}
@keyframes bloomIn{from{opacity:0;transform:translateY(100%);}to{opacity:1;transform:translateY(0);}}
@keyframes bloomOut{from{opacity:1;transform:translateY(0);}to{opacity:0;transform:translateY(100%);}}
@keyframes dpulse{0%,80%,100%{opacity:.35}40%{opacity:1}}
@keyframes dcursor{0%,100%{opacity:1}50%{opacity:0}}
.gn-a{animation:gnB 9s ease-in-out infinite;}
.num-a{animation:numB 7s ease-in-out infinite;}
.dc-a{animation:dC 4s ease-in-out infinite;}
.dh-a{animation:dH 4s ease-in-out infinite;}
.do-a{animation:dO 4s ease-in-out infinite;}
.cf-a{animation:cF 5s ease-in-out infinite;}
.si-a{animation:sIn 220ms cubic-bezier(0.22,1,0.36,1) forwards;}
.bloom-enter{animation:bloomIn 380ms cubic-bezier(0.22,1,0.36,1) forwards;}
.bloom-exit{animation:bloomOut 300ms cubic-bezier(0.4,0,1,1) forwards;}
.d-cursor{animation:dcursor 1s ease-in-out infinite;}
.no-scroll::-webkit-scrollbar{display:none;}
.no-scroll{-ms-overflow-style:none;scrollbar-width:none;}
`;

// SLICES are now dynamic — hints updated from live data on mount.
// Base definitions — hints overridden by useSanctuaryHints() state.
const BASE_SLICES=[
  {key:'dream'   as RoomKey, label:'Dream Ai',     candle:false, premium:false},
  {key:'circle'  as RoomKey, label:'Circle',       candle:true,  premium:false},
  {key:'muse'    as RoomKey, label:'Muse',         candle:false, premium:false},
  {key:'discover'as RoomKey, label:'Discover',     candle:false, premium:false},
  {key:'people'  as RoomKey, label:'My People',    candle:false, premium:false},
  {key:'pages'   as RoomKey, label:'Pages',        candle:false, premium:false},
  {key:'moments' as RoomKey, label:'Moments',      candle:false, premium:false},
  {key:'events'  as RoomKey, label:'The Journey',  candle:false, premium:false},
  {key:'expenses'as RoomKey, label:'Expenses',     candle:false, premium:false},
  {key:'vendors' as RoomKey, label:'Vendors',      candle:false, premium:false},
  {key:'meridian'as RoomKey, label:'Meridian',     candle:false, premium:true},
];
// WhatsApp DreamAI link — opens WA with prefilled Hi
const DREAMAI_WA_NUMBER = '14787788550';
const DREAMAI_WA_LINK   = `https://wa.me/${DREAMAI_WA_NUMBER}?text=Hi`;

const DREAM_PROMPTS=[
  'How many days until my wedding?',
  "What's on my calendar this week?",
  "Who's in my Circle?",
  'What have I saved to Muse?',
  'How much have I spent so far?',
];

// ── Root component ────────────────────────────────────────────────────────────





// ── EXPENSES ROOM ──────────────────────────────────────────────────────────────
// Three slices: My Expenses (manual) | Vendors (bookings+pay) | Receipts (images)
// Full CRUD — mirrors the original journey/expenses/page.tsx exactly.

type ExpenseSlice = 'my'|'vendor'|'receipts';

interface ExpensesRoomProps { dark:boolean; accent:string; signal:string; }

function ExpensesRoom({ dark, accent }: ExpensesRoomProps) {
  const bg      = dark
    ? 'radial-gradient(ellipse 80% 45% at 80% 0%,rgba(196,133,106,.12) 0%,transparent 52%),linear-gradient(160deg,#1A0A0E 0%,#120608 40%,#0C0404 100%)'
    : 'radial-gradient(ellipse 80% 45% at 20% 0%,rgba(42,95,130,.16) 0%,transparent 52%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 40%,#D8DEEC 100%)';
  const ink     = dark ? '#F5E5DC'                : '#0C1830';
  const inkSoft = dark ? 'rgba(245,229,220,.72)'  : 'rgba(12,24,48,.72)';
  const inkMute = dark ? 'rgba(196,133,106,.50)'  : 'rgba(42,80,130,.55)';
  const line    = dark ? 'rgba(196,133,106,.12)'  : 'rgba(42,95,130,.14)';
  const cardBg  = dark ? 'rgba(196,133,106,.05)'  : 'rgba(42,95,130,.05)';
  const cardBdr = dark ? 'rgba(196,133,106,.12)'  : 'rgba(42,95,130,.12)';
  const paper   = dark ? '#1A0A0E'                : '#EEF0F6';
  const brass   = '#C9A84C';
  const ac      = dark ? '#C4856A'                : '#2A5F82';

  const [slice,     setSlice]     = React.useState<ExpenseSlice>('my');
  const [receipts,  setReceipts]  = React.useState<CoupleReceipt[]>([]);
  const [bookings,  setBookings]  = React.useState<CoupleBooking[]>([]);
  const [loading,   setLoading]   = React.useState(true);
  const [toast,     setToast]     = React.useState('');
  const [fullImg,   setFullImg]   = React.useState<string|null>(null);
  const [showAdd,   setShowAdd]   = React.useState(false);
  const [confirmId, setConfirmId] = React.useState<string|null>(null);
  const [payBooking,setPayBooking]= React.useState<CoupleBooking|null>(null);
  const [newVendor, setNewVendor] = React.useState('');
  const [newAmount, setNewAmount] = React.useState('');
  const [newDate,   setNewDate]   = React.useState('');
  const [newDesc,   setNewDesc]   = React.useState('');
  const [payAmount, setPayAmount] = React.useState('');
  const [payDate,   setPayDate]   = React.useState('');
  const [saving,    setSaving]    = React.useState(false);

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),2500); };

  React.useEffect(()=>{
    Promise.all([fetchReceipts(),fetchBookings()]).then(([r,b])=>{
      setReceipts(r); setBookings(b); setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const fmtRs = (n:number) => n>=100000?`₹${(n/100000).toFixed(n%100000===0?0:1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`;
  function fmtDate(d:string|null|undefined):string {
    if(!d) return '';
    const dt=new Date(d+'T00:00:00');
    if(isNaN(dt.getTime())) return d;
    return dt.toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'});
  }

  const totalCommitted  = bookings.reduce((s,b)=>s+(b.amount_total||0),0);
  const totalPaid       = bookings.reduce((s,b)=>s+(b.amount_paid||0),0);
  const totalBalance    = totalCommitted-totalPaid;
  const myExpenses      = receipts.filter(r=>!r.image_url);
  const imageReceipts   = receipts.filter(r=>!!r.image_url);
  const totalMySpend    = myExpenses.reduce((s,r)=>s+(r.amount||0),0);

  const handleAddExpense = async () => {
    if(!newVendor.trim()||!newAmount) return;
    setSaving(true);
    try {
      const token    = typeof window!=='undefined'?localStorage.getItem('access_token'):null;
      const raw      = typeof window!=='undefined'?(localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session')):null;
      const coupleId = raw?JSON.parse(raw)?.id:null;
      if(token&&coupleId){
        const res = await fetch(`https://dream-os-production.up.railway.app/api/v2/couple/expenses/${coupleId}`,{
          method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({vendor_name:newVendor.trim(),amount:parseInt(newAmount.replace(/,/g,''),10),receipt_date:newDate||new Date().toISOString().slice(0,10),description:newDesc.trim()||null}),
        });
        const data=await res.json();
        if(data.ok&&data.expense) setReceipts(prev=>[data.expense,...prev]);
      }
      setShowAdd(false);setNewVendor('');setNewAmount('');setNewDate('');setNewDesc('');
      showToast('Expense added.');
    } catch { showToast('Could not add. Try again.'); }
    setSaving(false);
  };

  const handleDeleteReceipt = async (id:string) => {
    setReceipts(prev=>prev.filter(r=>r.id!==id));
    setConfirmId(null);
    await deleteReceipt(id);
    showToast('Removed.');
  };

  const handlePayment = async () => {
    if(!payBooking||!payAmount) return;
    const amt=parseInt(payAmount.replace(/,/g,''),10);
    if(isNaN(amt)||amt<=0){showToast('Enter a valid amount.');return;}
    setSaving(true);
    try {
      const updated=await recordPayment(payBooking.id,amt,payDate||undefined);
      setBookings(prev=>prev.map(b=>b.id===updated.id?updated:b));
      setPayBooking(null);setPayAmount('');setPayDate('');
      showToast('Payment recorded.');
    } catch { showToast('Could not record.'); }
    setSaving(false);
  };

  const inpStyle:React.CSSProperties = {width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.06)',border:`0.5px solid ${line}`,borderRadius:8,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:ink,outline:'none',boxSizing:'border-box',userSelect:'text'};
  const SliceBtn = ({id,label}:{id:ExpenseSlice;label:string}) => (
    <button onClick={()=>setSlice(id)} style={{flex:1,padding:'9px 0',borderRadius:8,border:`0.5px solid ${slice===id?ac:line}`,background:slice===id?`${ac}14`:'transparent',fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.14em',textTransform:'uppercase' as any,color:slice===id?ac:inkMute,cursor:'pointer'}}>
      {label}
    </button>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:bg,overflow:'hidden'}}>
      {toast&&<div style={{position:'fixed',top:'calc(env(safe-area-inset-top,0px) + 16px)',left:'50%',transform:'translateX(-50%)',background:ink,color:paper,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'8px 18px',borderRadius:20,zIndex:400,pointerEvents:'none',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* Full-screen receipt image viewer */}
      {fullImg&&<div onClick={()=>setFullImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.92)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <img src={fullImg} alt="Receipt" style={{maxWidth:'94vw',maxHeight:'88vh',objectFit:'contain',borderRadius:8}}/>
        <button onClick={()=>setFullImg(null)} style={{position:'absolute',top:24,right:24,background:'rgba(255,255,255,.12)',border:'none',borderRadius:20,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(245,240,232,.8)',fontSize:18}}>✕</button>
      </div>}

      {/* Snapshot */}
      <div style={{padding:'16px 20px 10px',borderBottom:`0.5px solid ${line}`,flexShrink:0}}>
        {slice==='my'&&<div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:34,color:ac,lineHeight:1,fontFeatureSettings:'"opsz" 144'}}>{loading?'…':fmtRs(totalMySpend)}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute}}>total spent</div>
        </div>}
        {slice==='vendor'&&<div style={{display:'flex',gap:24}}>
          <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,marginBottom:3}}>Committed</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:22,color:ac}}>{fmtRs(totalCommitted)}</div></div>
          <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,marginBottom:3}}>Paid</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:22,color:'#6B9E8F'}}>{fmtRs(totalPaid)}</div></div>
          <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,marginBottom:3}}>Balance</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:22,color:ink}}>{fmtRs(totalBalance)}</div></div>
        </div>}
        {slice==='receipts'&&<div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <div style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontSize:34,color:ac,lineHeight:1,fontFeatureSettings:'"opsz" 144'}}>{imageReceipts.length}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute}}>receipt image{imageReceipts.length!==1?'s':''}</div>
        </div>}
      </div>

      {/* Slice tabs */}
      <div style={{display:'flex',gap:8,padding:'10px 16px',borderBottom:`0.5px solid ${line}`,flexShrink:0}}>
        <SliceBtn id="my"       label="My expenses"/>
        <SliceBtn id="vendor"   label="Vendors"/>
        <SliceBtn id="receipts" label="Receipts"/>
      </div>

      {/* Content */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>
        {loading&&<div style={{padding:32,textAlign:'center' as any,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:inkMute}}>loading…</div>}

        {/* MY EXPENSES */}
        {!loading&&slice==='my'&&<>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 20px 8px'}}>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:18,color:ink,fontFeatureSettings:'"opsz" 9'}}>What I've spent.</div>
            <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:100,border:`0.5px solid ${ac}44`,background:'transparent',fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.14em',textTransform:'uppercase' as any,color:ac,cursor:'pointer'}}>+ Add</button>
          </div>
          {myExpenses.length===0&&<div style={{padding:'48px 24px',textAlign:'center' as any,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>No expenses yet. Tap Add to log one.</div>}
          {myExpenses.map(r=>(
            <div key={r.id} onClick={()=>setConfirmId(r.id)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom:`0.5px solid ${line}`,cursor:'pointer'}}>
              <div style={{width:40,height:40,borderRadius:8,background:cardBg,border:`0.5px solid ${cardBdr}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:inkMute}}>EXP</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:ink,fontFeatureSettings:'"opsz" 9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.vendor_name||r.description||'Expense'}</div>
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.12em',textTransform:'uppercase' as any,color:inkMute,marginTop:2}}>{fmtDate(r.receipt_date||r.created_at)}</div>
              </div>
              {r.amount&&<div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:16,color:ac,flexShrink:0}}>{fmtRs(r.amount)}</div>}
            </div>
          ))}
        </>}

        {/* VENDOR EXPENSES */}
        {!loading&&slice==='vendor'&&<>
          <div style={{padding:'14px 20px 8px',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:18,color:ink,fontFeatureSettings:'"opsz" 9'}}>My team.</div>
          {bookings.length===0&&<div style={{padding:'48px 24px',textAlign:'center' as any,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>No bookings yet. Add vendors in the Vendors tab.</div>}
          {bookings.map(b=>{
            const balance=(b.amount_total||0)-(b.amount_paid||0);
            return(
              <div key={b.id} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom:`0.5px solid ${line}`}}>
                <div style={{width:36,height:36,borderRadius:18,border:`0.5px solid ${line}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:inkMute}}>{(b.category?.[0]||b.vendor_name?.[0]||'·').toUpperCase()}</div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:ink,fontFeatureSettings:'"opsz" 9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.vendor_name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.1em',color:inkMute,marginTop:2}}>
                    {b.category}{b.amount_paid>0?` · paid ${fmtRs(b.amount_paid)}`:''}
                    {balance>0?` · bal ${fmtRs(balance)}`:''}
                  </div>
                </div>
                <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:4,flexShrink:0}}>
                  {b.amount_total&&<div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:15,color:ink}}>{fmtRs(b.amount_total)}</div>}
                  <button onClick={()=>{setPayBooking(b);setPayAmount('');setPayDate('');}} style={{padding:'4px 10px',borderRadius:100,border:`0.5px solid ${ac}44`,background:'transparent',fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.12em',textTransform:'uppercase' as any,color:ac,cursor:'pointer'}}>Pay</button>
                </div>
              </div>
            );
          })}
        </>}

        {/* RECEIPTS */}
        {!loading&&slice==='receipts'&&<>
          <div style={{padding:'14px 20px 4px',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:18,color:ink,fontFeatureSettings:'"opsz" 9'}}>Receipt vault.</div>
          <div style={{padding:'0 20px 12px',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:12,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>Forward receipt images to Dream Ai on WhatsApp — they land here automatically.</div>
          {imageReceipts.length===0&&<div style={{padding:'48px 24px',textAlign:'center' as any,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>No receipts yet.</div>}
          {imageReceipts.map(r=>(
            <div key={r.id} style={{display:'flex',alignItems:'flex-start',gap:14,padding:'12px 20px',borderBottom:`0.5px solid ${line}`}}>
              <div onClick={()=>r.image_url&&setFullImg(r.image_url)} style={{width:56,height:72,borderRadius:8,overflow:'hidden',flexShrink:0,background:cardBg,border:`0.5px solid ${cardBdr}`,display:'flex',alignItems:'center',justifyContent:'center',cursor:r.image_url?'zoom-in':'default'}}>
                {r.image_url?<img src={r.image_url} alt="Receipt" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:inkMute}}>REC</span>}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:ink,fontFeatureSettings:'"opsz" 9'}}>{r.vendor_name||r.description||'Receipt'}</div>
                {r.description&&r.vendor_name&&<div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:12,color:inkSoft,marginTop:2,lineHeight:1.4,fontFeatureSettings:'"opsz" 9'}}>{r.description}</div>}
                <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.12em',textTransform:'uppercase' as any,color:inkMute,marginTop:4}}>{fmtDate(r.receipt_date||r.created_at)}</div>
                {(r.tags||[]).length>0&&<div style={{display:'flex',gap:4,flexWrap:'wrap' as any,marginTop:6}}>{(r.tags||[]).slice(0,3).map((tag:string)=><span key={tag} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.1em',color:ac,padding:'2px 6px',border:`0.5px solid ${ac}33`,borderRadius:100}}>{tag}</span>)}</div>}
              </div>
              <div style={{display:'flex',flexDirection:'column',alignItems:'flex-end',gap:6,flexShrink:0}}>
                {r.amount&&<div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:15,color:ac}}>{fmtRs(r.amount)}</div>}
                <button onClick={()=>setConfirmId(r.id)} style={{background:'none',border:'none',cursor:'pointer',color:inkMute,fontSize:16,padding:4}}>✕</button>
              </div>
            </div>
          ))}
        </>}
        <div style={{height:40}}/>
      </div>

      {/* Add Expense sheet */}
      {showAdd&&<>
        <div onClick={()=>setShowAdd(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:201,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`,maxHeight:'85vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:22,color:ink,fontFeatureSettings:'"opsz" 9'}}>Add an expense</div>
            <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:inkMute,fontSize:20}}>✕</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Where / who</div>
              <input value={newVendor} onChange={e=>setNewVendor(e.target.value)} placeholder="Sabya showroom, Carma…" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Amount (₹)</div>
              <input value={newAmount} onChange={e=>setNewAmount(e.target.value)} placeholder="15000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Date (optional)</div>
              <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)} style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Notes (optional)</div>
              <input value={newDesc} onChange={e=>setNewDesc(e.target.value)} placeholder="Trial deposit, transport…" style={inpStyle}/></div>
            <button onClick={handleAddExpense} disabled={saving||!newVendor.trim()||!newAmount}
              style={{marginTop:4,padding:'14px 0',background:ac,border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',textTransform:'uppercase' as any,color:dark?'#1A0810':'#FFFFFF',cursor:'pointer',opacity:(saving||!newVendor.trim()||!newAmount)?.5:1}}>
              {saving?'Adding…':'Add expense'}
            </button>
          </div>
        </div>
      </>}

      {/* Confirm delete */}
      {confirmId&&<>
        <div onClick={()=>setConfirmId(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:201,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`}}>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:20,color:ink,marginBottom:8,fontFeatureSettings:'"opsz" 9'}}>Remove this?</div>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,marginBottom:24,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>It will be removed from your list.</div>
          <div style={{display:'flex',gap:10}}>
            <button onClick={()=>handleDeleteReceipt(confirmId)} style={{flex:1,padding:14,background:'rgba(184,69,62,.15)',border:'0.5px solid rgba(184,69,62,.4)',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'#B8453E',cursor:'pointer'}}>Remove</button>
            <button onClick={()=>setConfirmId(null)} style={{flex:1,padding:14,background:'rgba(255,255,255,.06)',border:`0.5px solid ${line}`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,cursor:'pointer'}}>Keep</button>
          </div>
        </div>
      </>}

      {/* Pay vendor sheet */}
      {payBooking&&<>
        <div onClick={()=>setPayBooking(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:201,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:20,color:ink,fontFeatureSettings:'"opsz" 9'}}>Record payment</div>
            <button onClick={()=>setPayBooking(null)} style={{background:'none',border:'none',cursor:'pointer',color:inkMute,fontSize:20}}>✕</button>
          </div>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,marginBottom:20,fontFeatureSettings:'"opsz" 9'}}>{payBooking.vendor_name} · paid so far: {fmtRs(payBooking.amount_paid)}</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Amount (₹)</div>
              <input value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="50000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Date (optional)</div>
              <input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)} style={inpStyle}/></div>
            <button onClick={handlePayment} disabled={saving||!payAmount}
              style={{padding:'14px 0',background:ac,border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',textTransform:'uppercase' as any,color:dark?'#1A0810':'#FFFFFF',cursor:'pointer',opacity:(saving||!payAmount)?.5:1}}>
              {saving?'Recording…':'Record payment'}
            </button>
          </div>
        </div>
      </>}
    </div>
  );
}

// ── VENDORS ROOM ──────────────────────────────────────────────────────────────
// Full CRUD: Add · Edit · Pay · Delete — mirrors journey/vendors/page.tsx exactly.

const VENDOR_CATEGORIES = ['photographer','videographer','mua','designer','venue','caterer','decor','florist','music','planner','other'] as const;
type VendorCategory = typeof VENDOR_CATEGORIES[number];
const PIPELINE_STATES = [{key:'paid',label:'PAID'},{key:'advance_paid',label:'ADVANCE PAID'},{key:'booked',label:'BOOKED'}];

interface VendorsRoomProps { dark:boolean; accent:string; }

function VendorsRoom({ dark, accent }: VendorsRoomProps) {
  const bg      = dark
    ? 'radial-gradient(ellipse 80% 45% at 80% 0%,rgba(196,133,106,.12) 0%,transparent 52%),linear-gradient(160deg,#1A0A0E 0%,#120608 40%,#0C0404 100%)'
    : 'radial-gradient(ellipse 80% 45% at 20% 0%,rgba(42,95,130,.16) 0%,transparent 52%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 40%,#D8DEEC 100%)';
  const ink     = dark ? '#F5E5DC'                : '#0C1830';
  const inkSoft = dark ? 'rgba(245,229,220,.72)'  : 'rgba(12,24,48,.72)';
  const inkMute = dark ? 'rgba(196,133,106,.50)'  : 'rgba(42,80,130,.55)';
  const line    = dark ? 'rgba(196,133,106,.12)'  : 'rgba(42,95,130,.14)';
  const paper   = dark ? '#1A0A0E'                : '#EEF0F6';
  const ac      = dark ? '#C4856A'                : '#2A5F82';

  const [bookings, setBookings] = React.useState<CoupleBooking[]>([]);
  const [loading,  setLoading]  = React.useState(true);
  const [toast,    setToast]    = React.useState('');
  const [showAdd,  setShowAdd]  = React.useState(false);
  const [action,   setAction]   = React.useState<CoupleBooking|null>(null);
  const [showEdit, setShowEdit] = React.useState(false);
  const [showPay,  setShowPay]  = React.useState(false);
  const [saving,   setSaving]   = React.useState(false);

  const [newName,  setNewName]  = React.useState('');
  const [newCat,   setNewCat]   = React.useState<VendorCategory>('photographer');
  const [newTotal, setNewTotal] = React.useState('');
  const [newAdv,   setNewAdv]   = React.useState('');
  const [newDue,   setNewDue]   = React.useState('');
  const [newNotes, setNewNotes] = React.useState('');

  const [editName,  setEditName]  = React.useState('');
  const [editCat,   setEditCat]   = React.useState<VendorCategory>('photographer');
  const [editTotal, setEditTotal] = React.useState('');
  const [editAdv,   setEditAdv]   = React.useState('');
  const [editDue,   setEditDue]   = React.useState('');
  const [editNotes, setEditNotes] = React.useState('');
  const [payAmount, setPayAmount] = React.useState('');
  const [payDate,   setPayDate]   = React.useState('');

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),2500); };

  React.useEffect(()=>{
    fetchBookings().then(b=>{ setBookings(b); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  const fmtRs = (n:number) => n>=100000?`₹${(n/100000).toFixed(n%100000===0?0:1)}L`:n>=1000?`₹${(n/1000).toFixed(0)}K`:`₹${n}`;

  const openEdit = (b:CoupleBooking) => {
    setEditName(b.vendor_name); setEditCat(b.category as VendorCategory);
    setEditTotal(b.amount_total?String(b.amount_total):'');
    setEditAdv(b.amount_advance?String(b.amount_advance):'');
    setEditDue(b.balance_due_date||''); setEditNotes(b.notes||'');
    setAction(b); setShowEdit(true);
  };

  const handleAdd = async () => {
    if(!newName.trim()) return;
    setSaving(true);
    try {
      const body:any={vendor_name:newName.trim(),category:newCat};
      if(newTotal) body.amount_total=parseInt(newTotal.replace(/,/g,''),10);
      if(newAdv)   body.amount_advance=parseInt(newAdv.replace(/,/g,''),10);
      if(newDue)   body.balance_due_date=newDue;
      if(newNotes.trim()) body.notes=newNotes.trim();
      const b=await createBooking(body);
      setBookings(prev=>[b,...prev]);
      setShowAdd(false);setNewName('');setNewCat('photographer');setNewTotal('');setNewAdv('');setNewDue('');setNewNotes('');
      showToast('Booking added.');
    } catch { showToast('Could not add. Try again.'); }
    setSaving(false);
  };

  const handleEdit = async () => {
    if(!action||!editName.trim()) return;
    setSaving(true);
    try {
      const patch:any={vendor_name:editName.trim(),category:editCat};
      patch.amount_total=editTotal?parseInt(editTotal.replace(/,/g,''),10):null;
      patch.amount_advance=editAdv?parseInt(editAdv.replace(/,/g,''),10):null;
      patch.balance_due_date=editDue||null;
      patch.notes=editNotes.trim()||null;
      const updated=await updateBooking(action.id,patch);
      setBookings(prev=>prev.map(b=>b.id===updated.id?updated:b));
      setShowEdit(false);setAction(null);
      showToast('Updated.');
    } catch { showToast('Could not update.'); }
    setSaving(false);
  };

  const handlePayment = async () => {
    if(!action||!payAmount) return;
    const amt=parseInt(payAmount.replace(/,/g,''),10);
    if(isNaN(amt)||amt<=0){showToast('Enter a valid amount.');return;}
    setSaving(true);
    try {
      const updated=await recordPayment(action.id,amt,payDate||undefined);
      setBookings(prev=>prev.map(b=>b.id===updated.id?updated:b));
      setShowPay(false);setAction(null);setPayAmount('');setPayDate('');
      showToast('Payment recorded.');
    } catch { showToast('Could not record payment.'); }
    setSaving(false);
  };

  const handleDelete = async (b:CoupleBooking) => {
    setAction(null);
    setBookings(prev=>prev.filter(x=>x.id!==b.id));
    await deleteBooking(b.id);
    showToast('Removed.');
  };

  const totalCommitted = bookings.reduce((s,b)=>s+(b.amount_total||0),0);
  const totalPaid      = bookings.reduce((s,b)=>s+(b.amount_paid||0),0);
  const groups = PIPELINE_STATES.map(p=>({label:p.label,items:bookings.filter(b=>b.state===p.key)})).filter(g=>g.items.length>0);

  const inpStyle:React.CSSProperties = {width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.06)',border:`0.5px solid ${line}`,borderRadius:8,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:ink,outline:'none',boxSizing:'border-box',userSelect:'text'};

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:bg,overflow:'hidden'}}>
      {toast&&<div style={{position:'fixed',top:'calc(env(safe-area-inset-top,0px) + 16px)',left:'50%',transform:'translateX(-50%)',background:ink,color:paper,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'8px 18px',borderRadius:20,zIndex:400,pointerEvents:'none',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* Header */}
      <div style={{padding:'16px 20px 12px',borderBottom:`0.5px solid ${line}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,marginBottom:4}}>My team</div>
          {bookings.length>0&&<div style={{display:'flex',gap:20}}>
            <div><span style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:20,color:ac}}>{fmtRs(totalCommitted)}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,color:inkMute,letterSpacing:'.1em',marginLeft:4}}>committed</span></div>
            <div><span style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:20,color:'#6B9E8F'}}>{fmtRs(totalPaid)}</span><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,color:inkMute,letterSpacing:'.1em',marginLeft:4}}>paid</span></div>
          </div>}
        </div>
        <button onClick={()=>setShowAdd(true)} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:100,border:`0.5px solid ${ac}44`,background:'transparent',fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.14em',textTransform:'uppercase' as any,color:ac,cursor:'pointer'}}>+ Add</button>
      </div>

      {/* List */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>
        {loading&&<div style={{padding:32,textAlign:'center' as any,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:inkMute}}>loading…</div>}
        {!loading&&bookings.length===0&&<div style={{padding:'64px 24px',textAlign:'center' as any,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>No one yet. Add your first booking.</div>}
        {groups.map(g=>(
          <div key={g.label}>
            <div style={{padding:'14px 20px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.3em',textTransform:'uppercase' as any,color:inkMute}}>{g.label}</div>
            {g.items.map(b=>{
              const balance=(b.amount_total||0)-(b.amount_paid||0);
              const meta=[b.category,b.amount_total?fmtRs(b.amount_total):null,b.balance_due_date?`Due ${new Date(b.balance_due_date).toLocaleDateString('en-IN',{month:'short',day:'numeric'})}`:null].filter(Boolean).join(' · ');
              return(
                <div key={b.id} onClick={()=>setAction(b)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 20px',borderBottom:`0.5px solid ${line}`,cursor:'pointer'}}>
                  <div style={{width:36,height:36,borderRadius:18,border:`0.5px solid ${line}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:inkMute}}>{(b.category?.[0]||b.vendor_name?.[0]||'·').toUpperCase()}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:ink,fontFeatureSettings:'"opsz" 9',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{b.vendor_name}</div>
                    {meta&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.1em',color:inkMute,marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{meta}</div>}
                  </div>
                  {b.amount_total&&b.amount_paid<b.amount_total&&<div style={{textAlign:'right' as any,flexShrink:0}}>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,color:inkMute}}>Bal</div>
                    <div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:15,color:ink}}>{fmtRs(balance)}</div>
                  </div>}
                </div>
              );
            })}
          </div>
        ))}
        <div style={{height:40}}/>
      </div>

      {/* Add sheet */}
      {showAdd&&<>
        <div onClick={()=>setShowAdd(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:201,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`,maxHeight:'90vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:22,color:ink,fontFeatureSettings:'"opsz" 9'}}>Add a booking</div>
            <button onClick={()=>setShowAdd(false)} style={{background:'none',border:'none',cursor:'pointer',color:inkMute,fontSize:20}}>✕</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Vendor name</div><input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Aanya Studio" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Category</div>
              <select value={newCat} onChange={e=>setNewCat(e.target.value as VendorCategory)} style={{...inpStyle,appearance:'none' as any,WebkitAppearance:'none' as any}}>
                {VENDOR_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Total amount (₹, optional)</div><input value={newTotal} onChange={e=>setNewTotal(e.target.value)} placeholder="450000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Advance agreed (₹, optional)</div><input value={newAdv} onChange={e=>setNewAdv(e.target.value)} placeholder="50000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Balance due date (optional)</div><input type="date" value={newDue} onChange={e=>setNewDue(e.target.value)} style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Notes (optional)</div><input value={newNotes} onChange={e=>setNewNotes(e.target.value)} placeholder="What's included, terms…" style={inpStyle}/></div>
            <button onClick={handleAdd} disabled={saving||!newName.trim()} style={{padding:'14px 0',background:ac,border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',textTransform:'uppercase' as any,color:dark?'#1A0810':'#FFFFFF',cursor:'pointer',opacity:(saving||!newName.trim())?.5:1}}>
              {saving?'Adding…':'Add booking'}
            </button>
          </div>
        </div>
      </>}

      {/* Action sheet */}
      {action&&!showEdit&&!showPay&&<>
        <div onClick={()=>setAction(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:200}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:201,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`}}>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:20,color:ink,marginBottom:2,fontFeatureSettings:'"opsz" 9'}}>{action.vendor_name}</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.14em',color:inkMute,textTransform:'uppercase' as any,marginBottom:16}}>{action.category} · {action.state.replace(/_/g,' ')}</div>
          {action.amount_total&&<div style={{display:'flex',gap:24,marginBottom:20}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:inkMute,letterSpacing:'.14em'}}>TOTAL</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:18,color:ink}}>{fmtRs(action.amount_total)}</div></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:inkMute,letterSpacing:'.14em'}}>PAID</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:18,color:'#6B9E8F'}}>{fmtRs(action.amount_paid)}</div></div>
            {action.amount_paid<(action.amount_total||0)&&<div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:inkMute,letterSpacing:'.14em'}}>BALANCE</div><div style={{fontFamily:"'Fraunces',serif",fontWeight:400,fontSize:18,color:ink}}>{fmtRs((action.amount_total||0)-action.amount_paid)}</div></div>}
          </div>}
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            <button onClick={()=>{setShowPay(true);setPayAmount('');setPayDate('');}} style={{padding:14,background:`${ac}18`,border:`0.5px solid ${ac}44`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:ac,cursor:'pointer'}}>Record a payment</button>
            <button onClick={()=>openEdit(action)} style={{padding:14,background:'rgba(255,255,255,.04)',border:`0.5px solid ${line}`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:ink,cursor:'pointer'}}>Edit</button>
            <button onClick={()=>handleDelete(action)} style={{padding:14,background:'rgba(184,69,62,.12)',border:'0.5px solid rgba(184,69,62,.3)',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'#B8453E',cursor:'pointer'}}>Remove</button>
            <button onClick={()=>setAction(null)} style={{padding:14,background:'rgba(255,255,255,.02)',border:`0.5px solid ${line}`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,cursor:'pointer'}}>Cancel</button>
          </div>
        </div>
      </>}

      {/* Edit sheet */}
      {showEdit&&action&&<>
        <div onClick={()=>{setShowEdit(false);setAction(null);}} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:202}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:203,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`,maxHeight:'90vh',overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:22,color:ink,fontFeatureSettings:'"opsz" 9'}}>Edit booking</div>
            <button onClick={()=>{setShowEdit(false);setAction(null);}} style={{background:'none',border:'none',cursor:'pointer',color:inkMute,fontSize:20}}>✕</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Vendor name</div><input value={editName} onChange={e=>setEditName(e.target.value)} style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Category</div>
              <select value={editCat} onChange={e=>setEditCat(e.target.value as VendorCategory)} style={{...inpStyle,appearance:'none' as any,WebkitAppearance:'none' as any}}>
                {VENDOR_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
              </select></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Total (₹)</div><input value={editTotal} onChange={e=>setEditTotal(e.target.value)} placeholder="450000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Advance (₹)</div><input value={editAdv} onChange={e=>setEditAdv(e.target.value)} placeholder="50000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Balance due date</div><input type="date" value={editDue} onChange={e=>setEditDue(e.target.value)} style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Notes</div><input value={editNotes} onChange={e=>setEditNotes(e.target.value)} style={inpStyle}/></div>
            <button onClick={handleEdit} disabled={saving||!editName.trim()} style={{padding:'14px 0',background:ac,border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',textTransform:'uppercase' as any,color:dark?'#1A0810':'#FFFFFF',cursor:'pointer',opacity:(saving||!editName.trim())?.5:1}}>
              {saving?'Saving…':'Save changes'}
            </button>
          </div>
        </div>
      </>}

      {/* Payment sheet */}
      {showPay&&action&&<>
        <div onClick={()=>setShowPay(false)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.55)',zIndex:202}}/>
        <div style={{position:'fixed',bottom:0,left:0,right:0,zIndex:203,background:paper,borderRadius:'20px 20px 0 0',padding:`24px 24px calc(24px + env(safe-area-inset-bottom,0px))`}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:20,color:ink,fontFeatureSettings:'"opsz" 9'}}>Record payment</div>
            <button onClick={()=>setShowPay(false)} style={{background:'none',border:'none',cursor:'pointer',color:inkMute,fontSize:20}}>✕</button>
          </div>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,marginBottom:20,fontFeatureSettings:'"opsz" 9'}}>{action.vendor_name} · paid so far: {fmtRs(action.amount_paid)}</div>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Amount paid (₹)</div><input value={payAmount} onChange={e=>setPayAmount(e.target.value)} placeholder="50000" inputMode="numeric" style={inpStyle}/></div>
            <div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:6}}>Payment date (optional)</div><input type="date" value={payDate} onChange={e=>setPayDate(e.target.value)} style={inpStyle}/></div>
            <button onClick={handlePayment} disabled={saving||!payAmount} style={{padding:'14px 0',background:ac,border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',textTransform:'uppercase' as any,color:dark?'#1A0810':'#FFFFFF',cursor:'pointer',opacity:(saving||!payAmount)?.5:1}}>
              {saving?'Recording…':'Record payment'}
            </button>
          </div>
        </div>
      </>}
    </div>
  );
}

// ── SETTINGS ROOM ──────────────────────────────────────────────────────────────
// Profile info + mode toggle + WA DreamAI shortcut. Sanctuary bg.

interface SettingsRoomProps { dark:boolean; accent:string; signal:string; setHomeMode:(m:any)=>void; }

function SettingsRoom({ dark, accent, signal, setHomeMode }: SettingsRoomProps) {
  const bg      = dark
    ? 'radial-gradient(ellipse 80% 45% at 80% 0%,rgba(196,133,106,.12) 0%,transparent 52%),linear-gradient(160deg,#1A0A0E 0%,#120608 40%,#0C0404 100%)'
    : 'radial-gradient(ellipse 80% 45% at 20% 0%,rgba(42,95,130,.16) 0%,transparent 52%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 40%,#D8DEEC 100%)';
  const ink     = dark ? '#F5E5DC'                : '#0C1830';
  const inkSoft = dark ? 'rgba(245,229,220,.72)'  : 'rgba(12,24,48,.72)';
  const inkMute = dark ? 'rgba(196,133,106,.50)'  : 'rgba(42,80,130,.55)';
  const line    = dark ? 'rgba(196,133,106,.14)'  : 'rgba(42,95,130,.14)';
  const rowBg   = dark ? 'rgba(196,133,106,.05)'  : 'rgba(42,95,130,.05)';
  const rowBdr  = dark ? 'rgba(196,133,106,.12)'  : 'rgba(42,95,130,.12)';
  const ac      = dark ? '#C4856A'                : '#2A5F82';
  const sig     = dark ? '#6B9E8F'                : '#8B6E52';

  const [profile, setProfile] = React.useState<CoupleProfile|null>(null);

  React.useEffect(()=>{
    fetchProfile().then(p=>setProfile(p)).catch(()=>{});
  },[]);

  function fmtWeddingDate(iso:string|null):string {
    if(!iso) return '—';
    return new Date(iso+'T00:00:00').toLocaleDateString('en-IN',{day:'numeric',month:'long',year:'numeric'});
  }

  const Row = ({label,value,onTap,isLink,arrow}:{label:string;value?:string;onTap?:()=>void;isLink?:boolean;arrow?:boolean}) => (
    <div onClick={onTap} style={{padding:'14px 20px',borderBottom:`0.5px solid ${line}`,display:'flex',alignItems:'center',cursor:onTap?'pointer':'default',WebkitTapHighlightColor:'transparent',background:onTap?undefined:rowBg}}>
      <div style={{flex:1}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:3}}>{label}</div>
        {value&&<div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:isLink?ac:ink,fontFeatureSettings:'"opsz" 9'}}>{value}</div>}
      </div>
      {arrow&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:inkMute}}>›</span>}
    </div>
  );

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:bg,overflow:'hidden'}}>
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>

        {/* Profile section */}
        <div style={{padding:'20px 20px 10px'}}>
          <div style={{fontFamily:"'Italianno',cursive",fontSize:38,color:ac,lineHeight:1,marginBottom:4}}>
            {profile?.bride_name||'Your'} & {profile?.partner_name||'Partner'}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute}}>{profile?.wedding_city||'Your city'}</div>
        </div>

        <div style={{height:.5,background:line,margin:'0 20px'}}/>

        {/* Info rows */}
        <Row label="Wedding date" value={fmtWeddingDate(profile?.wedding_date||null)}/>
        {profile?.budget_total&&<Row label="Total budget" value={profile.budget_total>=100000?`₹${(profile.budget_total/100000).toFixed(0)}L`:`₹${profile.budget_total}`}/>}

        {/* Mode toggle */}
        <div style={{padding:'10px 0 4px',marginTop:8}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:inkMute,padding:'0 20px 8px'}}>Appearance</div>
          <div style={{display:'flex',margin:'0 16px',borderRadius:8,overflow:'hidden',border:`0.5px solid ${line}`}}>
            {(['E1A','E3'] as const).map(mode=>{
              const active = (mode==='E1A'&&dark)||(mode==='E3'&&!dark);
              const label  = mode==='E1A'?'Wine Night':'Sky & Ivory';
              return (
                <div key={mode} onClick={()=>{
                  setHomeMode(mode);
                  // Mark as manually set — disables auto time-based switching
                  try{localStorage.setItem('@frost.home_mode_manual','1');}catch{}
                }}
                  style={{flex:1,padding:'12px 8px',textAlign:'center' as any,cursor:'pointer',
                    background:active?ac:'transparent',
                    fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.16em',
                    textTransform:'uppercase' as any,
                    color:active?(dark?'#1A0810':'#FFFFFF'):inkMute,
                    transition:'all 220ms ease',WebkitTapHighlightColor:'transparent'}}>
                  {label}
                </div>
              );
            })}
          </div>
        </div>

        {/* DreamAI on WhatsApp */}
        <div style={{padding:'10px 0 4px',marginTop:8}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:inkMute,padding:'0 20px 8px'}}>DreamAi</div>
          <a href={DREAMAI_WA_LINK} target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',padding:'14px 20px',margin:'0 16px',borderRadius:8,
              background:dark?'rgba(196,133,106,.07)':'rgba(42,95,130,.07)',
              border:`0.5px solid ${dark?'rgba(196,133,106,.18)':'rgba(42,95,130,.18)'}`,
              textDecoration:'none',cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:16,color:ink,fontFeatureSettings:'"opsz" 9',marginBottom:3}}>Open on WhatsApp</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.16em',textTransform:'uppercase' as any,color:inkMute}}>Chat with Dream Ai anywhere</div>
            </div>
            <div style={{width:36,height:36,borderRadius:'50%',background:ac,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" fill="currentColor"/>
              </svg>
            </div>
          </a>
        </div>

        {/* Sign out */}
        <div style={{padding:'24px 16px 0'}}>
          <div onClick={()=>{
            try{
              ['access_token','refresh_token','couple_session','couple_web_session',
               'couple_last_path','couple_app_mode']
               .forEach(k=>localStorage.removeItem(k));
            }catch{}
            window.location.replace('/');
          }} style={{padding:'14px',borderRadius:8,border:`0.5px solid rgba(184,69,62,.25)`,background:'rgba(184,69,62,.06)',textAlign:'center' as any,cursor:'pointer',
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(184,69,62,.8)',
            WebkitTapHighlightColor:'transparent'}}>
            Sign out
          </div>
        </div>

        <div style={{height:40}}/>
      </div>
    </div>
  );
}


// ── PEOPLE ROOM ────────────────────────────────────────────────────────────────
// List view → tap member → inline detail view with their activity feed.
// No router.push — pure state machine inside the bloom.

interface PeopleRoomProps { dark:boolean; accent:string; signal:string; }

function PeopleRoom({ dark, accent, signal }: PeopleRoomProps) {
  const bg      = dark
    ? 'radial-gradient(ellipse 80% 45% at 80% 0%,rgba(196,133,106,.12) 0%,transparent 52%),linear-gradient(160deg,#1A0A0E 0%,#120608 40%,#0C0404 100%)'
    : 'radial-gradient(ellipse 80% 45% at 20% 0%,rgba(42,95,130,.16) 0%,transparent 52%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 40%,#D8DEEC 100%)';
  const ink     = dark ? '#F5E5DC'               : '#0C1830';
  const inkSoft = dark ? 'rgba(245,229,220,.72)' : 'rgba(12,24,48,.72)';
  const inkMute = dark ? 'rgba(196,133,106,.50)' : 'rgba(42,80,130,.55)';
  const line    = dark ? 'rgba(196,133,106,.14)' : 'rgba(42,95,130,.14)';
  const cardBg  = dark ? 'rgba(196,133,106,.06)' : 'rgba(42,95,130,.06)';
  const cardBdr = dark ? 'rgba(196,133,106,.14)' : 'rgba(42,95,130,.14)';
  const ac      = dark ? '#C4856A'               : '#2A5F82';

  const [members,      setMembers]      = React.useState<CircleMember[]>([]);
  const [pending,      setPending]      = React.useState<any[]>([]);
  const [loading,      setLoading]      = React.useState(true);
  const [selected,     setSelected]     = React.useState<CircleMember|null>(null);
  const [memberFeed,   setMemberFeed]   = React.useState<CircleActivity[]>([]);
  const [feedLoading,  setFeedLoading]  = React.useState(false);

  React.useEffect(()=>{
    fetchCircle().then(c=>{
      setMembers(c.members);
      setPending(c.pending_invites);
      setLoading(false);
    }).catch(()=>setLoading(false));
  },[]);

  const openMember = (m: CircleMember) => {
    setSelected(m);
    setMemberFeed([]);
    setFeedLoading(true);
    fetchMemberFeed(m.id).then(d=>{
      setMemberFeed(d?.activity||[]);
      setFeedLoading(false);
    }).catch(()=>setFeedLoading(false));
  };

  const roleLabel = (r:string) => r.replace(/_/g,' ');

  // ── MEMBER DETAIL VIEW ──────────────────────────────────────────────────
  if(selected) {
    const phone = (selected as any).invitee_phone || null;
    return (
      <div style={{flex:1,display:'flex',flexDirection:'column',background:bg,overflow:'hidden'}}>
        {/* Detail top bar */}
        <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${line}`,display:'flex',alignItems:'center',gap:14,flexShrink:0}}>
          <button onClick={()=>setSelected(null)} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,color:inkMute,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:0}}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Back
          </button>
          <div style={{flex:1,textAlign:'center' as any,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:16,color:ac,fontFeatureSettings:'"opsz" 9'}}>{selected.invitee_name}</div>
          <div style={{width:48}}/>
        </div>

        <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>
          {/* Member header */}
          <div style={{padding:'20px 20px 16px',borderBottom:`0.5px solid ${line}`,display:'flex',alignItems:'center',gap:16}}>
            <div style={{width:56,height:56,borderRadius:28,background:`${ac}18`,border:`2px solid ${ac}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:26,color:ac}}>{(selected.invitee_name[0]||'·').toUpperCase()}</span>
            </div>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:20,color:ink,fontFeatureSettings:'"opsz" 9',marginBottom:3}}>{selected.invitee_name}</div>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute}}>
                {roleLabel(selected.role)}
                {selected.last_active&&<span style={{color:signal}}> · {timeAgo(selected.last_active)}</span>}
              </div>
            </div>
            {/* Contact buttons */}
            {phone&&<div style={{display:'flex',gap:8,flexShrink:0}}>
              <a href={`https://wa.me/${phone.replace(/\+/g,'')}`} target="_blank" rel="noopener noreferrer"
                style={{width:36,height:36,borderRadius:18,background:'rgba(37,211,102,.10)',border:'0.5px solid rgba(37,211,102,.25)',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" fill="#25D366"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.528 5.845L0 24l6.335-1.652A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.273-1.535l-.378-.224-3.927 1.025 1.046-3.82-.247-.393A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" fill="#25D366"/></svg>
              </a>
              <a href={`tel:${phone}`}
                style={{width:36,height:36,borderRadius:18,background:`${ac}12`,border:`0.5px solid ${ac}33`,display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1C9.61 22 2 14.39 2 5a1 1 0 011-1H6.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" stroke={ac} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </a>
            </div>}
          </div>

          {/* Activity feed */}
          <div style={{padding:'16px 20px'}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.28em',textTransform:'uppercase' as any,color:inkMute,marginBottom:16}}>What they've shared</div>
            {feedLoading&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute}}>loading…</div>}
            {!feedLoading&&memberFeed.length===0&&<div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>Nothing shared yet.</div>}
            {memberFeed.map(a=>{
              if(a.activity_type==='save_added'&&a.image_url) return(
                <div key={a.id} style={{marginBottom:20}}>
                  <div style={{borderRadius:8,overflow:'hidden',marginBottom:8,background:cardBg}}>
                    <img src={a.image_url} alt={a.caption||'Save'} style={{width:'100%',display:'block',objectFit:'cover',maxHeight:280}} loading="lazy"/>
                  </div>
                  {a.caption&&<div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:ink,lineHeight:1.5,marginBottom:4,fontFeatureSettings:'"opsz" 9'}}>"{a.caption}"</div>}
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.14em',textTransform:'uppercase' as any,color:inkMute}}>{timeAgo(a.created_at)}</div>
                </div>
              );
              if(a.activity_type==='comment'&&a.content) return(
                <div key={a.id} style={{marginBottom:14,paddingLeft:12,borderLeft:`2px solid ${ac}`}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:ink,lineHeight:1.6,marginBottom:3,fontFeatureSettings:'"opsz" 9'}}>"{a.content}"</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.14em',textTransform:'uppercase' as any,color:inkMute}}>{timeAgo(a.created_at)}</div>
                </div>
              );
              return(
                <div key={a.id} style={{display:'flex',gap:10,marginBottom:10,alignItems:'flex-start'}}>
                  <div style={{width:5,height:5,borderRadius:3,background:inkMute,marginTop:5,flexShrink:0}}/>
                  <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>{a.activity_type.replace(/_/g,' ')} · <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.12em'}}>{timeAgo(a.created_at)}</span></div>
                </div>
              );
            })}
          </div>
          <div style={{height:40}}/>
        </div>
      </div>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────────
  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:bg,overflow:'hidden'}}>
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>
        <div style={{padding:'20px 20px 8px'}}>
          <div style={{fontFamily:"'Italianno',cursive",fontSize:38,color:ac,lineHeight:1,marginBottom:4}}>Your circle.</div>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>The people sharing this journey with you.</div>
        </div>

        {loading&&<div style={{padding:32,textAlign:'center' as any,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:inkMute}}>loading…</div>}
        {!loading&&members.length===0&&pending.length===0&&(
          <div style={{padding:'64px 24px',textAlign:'center' as any,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>No one yet. Invite someone from Circle.</div>
        )}

        {members.length>0&&(
          <div style={{padding:'16px 20px 8px'}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.3em',textTransform:'uppercase' as any,color:inkMute,marginBottom:12}}>Active</div>
            {members.map(m=>{
              const phone=(m as any).invitee_phone||null;
              return(
                <div key={m.id} onClick={()=>openMember(m)} style={{display:'flex',alignItems:'center',gap:14,padding:'12px 14px',marginBottom:8,borderRadius:10,background:cardBg,border:`0.5px solid ${cardBdr}`,cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>
                  <div style={{width:44,height:44,borderRadius:22,background:`${ac}18`,border:`1.5px solid ${ac}55`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <span style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:20,color:ac}}>{(m.invitee_name[0]||'·').toUpperCase()}</span>
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:16,color:ink,fontFeatureSettings:'"opsz" 9',marginBottom:2}}>{m.invitee_name}</div>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.14em',textTransform:'uppercase' as any,color:inkMute}}>
                      {roleLabel(m.role)}{m.last_active&&<span style={{color:signal}}> · {timeAgo(m.last_active)}</span>}
                    </div>
                  </div>
                  <div style={{display:'flex',gap:8,flexShrink:0}} onClick={e=>e.stopPropagation()}>
                    {phone&&<>
                      <a href={`https://wa.me/${phone.replace(/\+/g,'')}`} target="_blank" rel="noopener noreferrer"
                        style={{width:34,height:34,borderRadius:17,background:'rgba(37,211,102,.10)',border:'0.5px solid rgba(37,211,102,.25)',display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}>
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413z" fill="#25D366"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.554 4.118 1.528 5.845L0 24l6.335-1.652A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.273-1.535l-.378-.224-3.927 1.025 1.046-3.82-.247-.393A9.818 9.818 0 012.182 12C2.182 6.57 6.57 2.182 12 2.182S21.818 6.57 21.818 12 17.43 21.818 12 21.818z" fill="#25D366"/></svg>
                      </a>
                      <a href={`tel:${phone}`}
                        style={{width:34,height:34,borderRadius:17,background:`${ac}12`,border:`0.5px solid ${ac}33`,display:'flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1v3.5a1 1 0 01-1 1C9.61 22 2 14.39 2 5a1 1 0 011-1H6.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.21 2.2z" stroke={ac} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </a>
                    </>}
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke={inkMute} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {pending.length>0&&(
          <div style={{padding:'8px 20px 16px'}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.3em',textTransform:'uppercase' as any,color:inkMute,marginBottom:12}}>Invited · waiting to join</div>
            {pending.map(p=>(
              <div key={p.id} style={{display:'flex',alignItems:'center',gap:14,padding:'10px 0',borderBottom:`0.5px solid ${line}`,opacity:.6}}>
                <div style={{width:44,height:44,borderRadius:22,border:`0.5px dashed ${line}`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:inkMute}}>?</div>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:inkSoft,fontFeatureSettings:'"opsz" 9'}}>{p.invitee_name}</div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.14em',textTransform:'uppercase' as any,color:inkMute,marginTop:2}}>{roleLabel(p.role)} · pending</div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div style={{height:40}}/>
      </div>
    </div>
  );
}

// ── DISCOVER ROOM ──────────────────────────────────────────────────────────────
// Full-bleed cinematic feed.
// Swipe left  = next vendor
// Swipe right = prev vendor
// Single tap  = cycle photos of same vendor (dots at bottom)
// Double-tap  = save to Muse ♥
// Peek nav    = long glowing line at bottom → tap → vendor panel slides up
//               Panel: name, enquire (silent WA), lock date (beta), circle share

const DISC_CATEGORIES = ['Venues','Photographers','Makeup Artists','Designers','Jewellery','Choreographers','Content Creators','DJ & Music','Event Managers','Bridal Wellness'];
const DISC_CITIES     = ['Delhi NCR','Mumbai','Bangalore','Chennai','Hyderabad','Kolkata','Jaipur','Pune','Udaipur','Goa'];
const DISC_VIBES      = ['Candid','Traditional','Luxury','Cinematic','Boho','Festive','Minimalist','Royal','Destination','Contemporary'];
const DISC_BUDGETS    = [{label:'Under Rs 1L',value:'100000'},{label:'Rs 1L – 3L',value:'300000'},{label:'Rs 3L – 5L',value:'500000'},{label:'Rs 5L – 10L',value:'1000000'},{label:'Rs 10L+',value:''}];

const DISC_SWIPE_THRESH = 42;
const DISC_TAP_MOVE     = 10;
const DISC_TAP_TIME     = 240;
const DISC_DTAP_MS      = 270;

interface DiscFilterState { category:string|null; city:string|null; vibes:string[]; budget:string|null; }

function discHaptic(ms:number){ if(typeof navigator!=='undefined'&&'vibrate' in navigator){ try{navigator.vibrate(ms);}catch{} } }

function spawnDiscHeart(accent:string){
  if(typeof document==='undefined') return;
  const el=document.createElement('div');
  el.style.cssText=`position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(0);font-size:88px;z-index:9999;pointer-events:none;animation:discHeartPop 700ms cubic-bezier(0.22,1,0.36,1) forwards;color:${accent};`;
  el.textContent='♥'; document.body.appendChild(el); setTimeout(()=>el.remove(),700); discHaptic(14);
}

function spawnDiscToast(msg:string){
  if(typeof document==='undefined') return;
  const ex=document.getElementById('disc-toast'); if(ex) ex.remove();
  const el=document.createElement('div'); el.id='disc-toast';
  el.style.cssText=`position:fixed;top:calc(env(safe-area-inset-top,0px) + 52px);left:50%;transform:translateX(-50%);background:rgba(8,6,8,0.88);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);border:0.5px solid rgba(255,255,255,0.14);color:rgba(248,247,245,0.9);font-family:'JetBrains Mono',monospace;font-size:9px;letter-spacing:0.18em;text-transform:uppercase;padding:8px 18px;border-radius:20px;z-index:9998;pointer-events:none;white-space:nowrap;`;
  el.textContent=msg; document.body.appendChild(el);
  setTimeout(()=>{el.style.opacity='0';el.style.transition='opacity 300ms';},1800);
  setTimeout(()=>el.remove(),2200);
}

// ── Filter sheet ──────────────────────────────────────────────────────────────
function DiscFilterSheet({visible,onClose,filters,accent,dark,onApply}:{
  visible:boolean; onClose:()=>void; filters:DiscFilterState;
  accent:string; dark:boolean; onApply:(f:DiscFilterState)=>void;
}) {
  const [local,setLocal] = React.useState<DiscFilterState>(filters);
  React.useEffect(()=>{ if(visible) setLocal(filters); },[visible,filters]);
  if(!visible) return null;

  const p = (active:boolean):React.CSSProperties => ({
    padding:'7px 14px', borderRadius:100,
    border:active?`0.5px solid ${accent}`:'0.5px solid rgba(255,255,255,.18)',
    background:active?`${accent}28`:'rgba(255,255,255,.07)',
    fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:'.14em',
    color:active?accent:'rgba(248,247,245,.65)',
    cursor:'pointer', whiteSpace:'nowrap' as any, touchAction:'manipulation' as any,
  });

  const [openSection,setOpenSection] = React.useState<string|null>(null);
  const toggle = (s:string) => setOpenSection(o=>o===s?null:s);

  const Section = ({id,label,hasVal,children}:{id:string;label:string;hasVal:boolean;children:React.ReactNode}) => (
    <div style={{borderBottom:'0.5px solid rgba(255,255,255,.08)'}}>
      <button onClick={()=>toggle(id)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 24px',background:'none',border:'none',cursor:'pointer',touchAction:'manipulation' as any}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.22em',textTransform:'uppercase' as any,color:hasVal?accent:'rgba(248,247,245,.45)'}}>{label}{hasVal?' ·':''}</span>
        <span style={{color:'rgba(248,247,245,.35)',fontSize:14,transform:openSection===id?'rotate(90deg)':'rotate(0deg)',transition:'transform 200ms ease',display:'inline-block'}}>›</span>
      </button>
      {openSection===id&&<div style={{padding:'0 24px 20px'}}>{children}</div>}
    </div>
  );

  return (
    <div style={{position:'absolute',inset:0,zIndex:200}} onClick={onClose}>
      <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.3)',pointerEvents:'none'}}/>
      <div style={{position:'absolute',bottom:0,left:0,right:0,background:'rgba(8,6,8,.82)',backdropFilter:'blur(28px) saturate(1.8)',WebkitBackdropFilter:'blur(28px) saturate(1.8)',borderTop:'0.5px solid rgba(255,255,255,.1)',borderRadius:'20px 20px 0 0',paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 24px)',maxHeight:'85vh',overflowY:'auto'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'center',padding:'12px 0 4px'}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,.2)'}}/></div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 24px 4px'}}>
          <span style={{fontFamily:"'Italianno',cursive",fontSize:28,color:'#F8F7F5',lineHeight:1}}>Discover</span>
          <button onClick={onClose} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(248,247,245,.4)',padding:4,fontSize:18}}>✕</button>
        </div>
        <Section id="cat" label="Category" hasVal={!!local.category}>
          <div style={{display:'flex',flexWrap:'wrap' as any,gap:8}}>
            {DISC_CATEGORIES.map(c=><button key={c} style={p(local.category===c)} onClick={()=>setLocal(f=>({...f,category:f.category===c?null:c}))}>{c}</button>)}
          </div>
        </Section>
        <Section id="city" label="City" hasVal={!!local.city}>
          <div style={{display:'flex',flexWrap:'wrap' as any,gap:8}}>
            {DISC_CITIES.map(c=><button key={c} style={p(local.city===c)} onClick={()=>setLocal(f=>({...f,city:f.city===c?null:c}))}>{c}</button>)}
          </div>
        </Section>
        <Section id="vibe" label="Vibe" hasVal={local.vibes.length>0}>
          <div style={{display:'flex',flexWrap:'wrap' as any,gap:8}}>
            {DISC_VIBES.map(v=><button key={v} style={p(local.vibes.includes(v))} onClick={()=>setLocal(f=>({...f,vibes:f.vibes.includes(v)?f.vibes.filter(x=>x!==v):[...f.vibes,v]}))}>{v}</button>)}
          </div>
        </Section>
        <Section id="budget" label="Budget" hasVal={!!local.budget}>
          <div style={{display:'flex',flexWrap:'wrap' as any,gap:8}}>
            {DISC_BUDGETS.map(b=><button key={b.label} style={p(local.budget===b.value)} onClick={()=>setLocal(f=>({...f,budget:f.budget===b.value?null:b.value}))}>{b.label}</button>)}
          </div>
        </Section>
        <div style={{display:'flex',gap:12,padding:'24px 24px 0'}}>
          <button onClick={()=>{const e:DiscFilterState={category:null,city:null,vibes:[],budget:null};setLocal(e);onApply(e);onClose();}} style={{flex:1,padding:'13px 0',background:'transparent',border:'0.5px solid rgba(255,255,255,.2)',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.45)',cursor:'pointer'}}>Clear</button>
          <button onClick={()=>{onApply(local);onClose();}} style={{flex:2,padding:'13px 0',background:accent,border:'none',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,color:dark?'#1A0810':'#FFFFFF',cursor:'pointer'}}>Apply</button>
        </div>
      </div>
    </div>
  );
}

// ── Vendor panel (slides up from peek nav tap) ────────────────────────────────
function DiscVendorPanel({vendor,visible,onClose,accent,onEnquire,onCircleShare}:{
  vendor:DiscoverVendor; visible:boolean; onClose:()=>void;
  accent:string; onEnquire:()=>void; onCircleShare:()=>void;
}) {
  const dragY   = React.useRef(0);
  const [delta, setDelta] = React.useState(0);
  const dragging = React.useRef(false);

  return (
    <div style={{
      position:'absolute',bottom:0,left:0,right:0,zIndex:60,
      transform:visible?`translateY(${delta}px)`:'translateY(100%)',
      transition:dragging.current?'none':'transform 340ms cubic-bezier(0.22,1,0.36,1)',
      opacity:visible?Math.max(.3,1-delta/200):0,
      background:'rgba(8,6,8,.88)',backdropFilter:'blur(32px) saturate(1.8)',WebkitBackdropFilter:'blur(32px) saturate(1.8)',
      borderTop:'0.5px solid rgba(255,255,255,.10)',borderRadius:'20px 20px 0 0',
      paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 28px)',
    }}
      onTouchStart={e=>{dragY.current=e.touches[0].clientY;dragging.current=true;setDelta(0);}}
      onTouchMove={e=>{const d=e.touches[0].clientY-dragY.current;if(d>0)setDelta(d);}}
      onTouchEnd={()=>{dragging.current=false;if(delta>80){setDelta(0);onClose();}else setDelta(0);}}
    >
      {/* Drag handle */}
      <div style={{display:'flex',justifyContent:'center',padding:'14px 0 18px'}}>
        <div style={{width:40,height:4,borderRadius:2,background:'rgba(255,255,255,.18)'}}/>
      </div>

      <div style={{padding:'0 24px'}}>
        {/* Category + city */}
        <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.22em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.45)',margin:'0 0 6px'}}>
          {vendor.category}&nbsp;·&nbsp;{vendor.city}
        </p>

        {/* Vendor name */}
        <h2 style={{fontFamily:"'Fraunces',serif",fontSize:28,fontWeight:300,fontStyle:'italic',color:'#F8F7F5',margin:'0 0 6px',lineHeight:1.1,fontFeatureSettings:'"opsz" 9'}}>
          {vendor.name}
        </h2>

        {/* Price */}
        {vendor.starting_price&&(
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:'rgba(248,247,245,.45)',letterSpacing:'.12em',margin:'0 0 6px'}}>
            {vendor.starting_price>=100000?`Rs ${(vendor.starting_price/100000).toFixed(vendor.starting_price%100000===0?0:1)}L onwards`:`Rs ${(vendor.starting_price/1000).toFixed(0)}K onwards`}
          </p>
        )}

        {/* Vibe tags */}
        {vendor.vibe_tags&&vendor.vibe_tags.length>0&&(
          <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:'rgba(248,247,245,.35)',letterSpacing:'.1em',margin:'0 0 24px'}}>
            {vendor.vibe_tags.join(' · ')}
          </p>
        )}

        {/* Action buttons */}
        <div style={{display:'flex',flexDirection:'column',gap:10}}>

          {/* Enquire — silent WA */}
          <button onClick={onEnquire}
            style={{width:'100%',padding:'15px 0',background:'rgba(248,247,245,.92)',border:'none',borderRadius:10,
              fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase' as any,
              color:'#0C0A09',cursor:'pointer'}}>
            Enquire
          </button>

          <div style={{display:'flex',gap:10}}>
            {/* Lock date — beta */}
            <button disabled
              style={{flex:1,padding:'13px 0',background:'rgba(255,255,255,.05)',
                border:'0.5px solid rgba(255,255,255,.12)',borderRadius:10,
                fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.16em',
                textTransform:'uppercase' as any,color:'rgba(248,247,245,.28)',cursor:'not-allowed',
                display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              Lock date
              <span style={{fontSize:6,letterSpacing:'.16em',color:'rgba(201,168,76,.55)',
                border:'0.5px solid rgba(201,168,76,.3)',borderRadius:4,padding:'1px 5px'}}>
                BETA
              </span>
            </button>

            {/* Circle share */}
            <button onClick={onCircleShare}
              style={{flex:1,padding:'13px 0',background:'rgba(255,255,255,.06)',
                border:'0.5px solid rgba(255,255,255,.14)',borderRadius:10,
                fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.16em',
                textTransform:'uppercase' as any,color:'rgba(248,247,245,.60)',cursor:'pointer'}}>
              Share to Circle
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Image dots ────────────────────────────────────────────────────────────────
function DiscImageDots({total,current,accent}:{total:number;current:number;accent:string}) {
  if(total<=1) return null;
  return (
    <div style={{position:'absolute',bottom:'calc(env(safe-area-inset-bottom,0px) + 56px)',left:'50%',transform:'translateX(-50%)',display:'flex',gap:6,zIndex:24,pointerEvents:'none'}}>
      {Array.from({length:Math.min(total,7)}).map((_,i)=>(
        <div key={i} style={{width:i===current?18:5,height:5,borderRadius:3,
          background:i===current?accent:'rgba(255,255,255,.32)',
          transition:'all 220ms cubic-bezier(0.22,1,0.36,1)',
          boxShadow:i===current?`0 0 8px ${accent}88`:'none'}}/>
      ))}
    </div>
  );
}

// ── Peek nav — glowing horizontal line ───────────────────────────────────────
function DiscPeekNav({onTap,accent,panelOpen,hasActiveFilters,onFilterTap,isBlind,onBlindTap}:{
  onTap:()=>void; accent:string; panelOpen:boolean;
  hasActiveFilters:boolean; onFilterTap:()=>void;
  isBlind:boolean; onBlindTap:()=>void;
}) {
  return (
    <div style={{
      position:'absolute',bottom:0,left:0,right:0,zIndex:50,
      paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 10px)',
      paddingTop:10,
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'10px 18px calc(env(safe-area-inset-bottom,0px) + 10px)',
      pointerEvents:'none',
    }}>
      {/* Blind pill */}
      <button
        onClick={e=>{e.stopPropagation();onBlindTap();}}
        onTouchStart={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}
        style={{
          pointerEvents:'all',
          height:28,padding:'0 12px',borderRadius:100,
          border:`0.5px solid ${isBlind?accent:'rgba(255,255,255,.22)'}`,
          background:isBlind?`${accent}22`:'rgba(8,6,8,.55)',
          backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
          fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',
          textTransform:'uppercase' as any,
          color:isBlind?accent:'rgba(248,247,245,.65)',
          cursor:'pointer',touchAction:'manipulation' as any,
        }}>
        Blind
      </button>

      {/* Peek nav line — centre */}
      <button
        onClick={e=>{e.stopPropagation();onTap();}}
        onTouchStart={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}
        style={{
          pointerEvents:'all',
          flex:1,margin:'0 14px',
          height:28,
          background:'none',border:'none',cursor:'pointer',
          display:'flex',alignItems:'center',justifyContent:'center',
          touchAction:'manipulation' as any,
        }}>
        <style>{`
          @keyframes peekPulse {
            0%,100% { opacity:0.55; box-shadow:0 0 6px ${accent}44; }
            50%      { opacity:1;    box-shadow:0 0 16px ${accent}88; }
          }
        `}</style>
        <div style={{
          width:'100%',height:3,borderRadius:2,
          background:panelOpen?accent:`linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`,
          animation:panelOpen?'none':'peekPulse 2.8s ease-in-out infinite',
          transition:'background 300ms ease',
        }}/>
      </button>

      {/* Filter pill */}
      <button
        onClick={e=>{e.stopPropagation();onFilterTap();}}
        onTouchStart={e=>e.stopPropagation()} onTouchEnd={e=>e.stopPropagation()}
        style={{
          pointerEvents:'all',
          width:34,height:28,borderRadius:100,
          border:`0.5px solid ${hasActiveFilters?accent:'rgba(255,255,255,.22)'}`,
          background:hasActiveFilters?`${accent}22`:'rgba(8,6,8,.55)',
          backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',
          display:'flex',alignItems:'center',justifyContent:'center',
          cursor:'pointer',touchAction:'manipulation' as any,
        }}>
        <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
          <path d="M2 4h12M4 8h8M6 12h4" stroke={hasActiveFilters?accent:'rgba(255,255,255,.8)'} strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

interface DiscoverRoomProps { dark:boolean; accent:string; signal:string; }

function DiscoverRoom({ dark, accent }: DiscoverRoomProps) {
  const [vendors,    setVendors]    = React.useState<DiscoverVendor[]>([]);
  const [vIdx,       setVIdx]       = React.useState(0);
  const [imgIdx,     setImgIdx]     = React.useState(0);
  const [panelOpen,  setPanelOpen]  = React.useState(false);
  const [dissolve,   setDissolve]   = React.useState(0);
  const [isBlind,    setIsBlind]    = React.useState(false);
  const [loading,    setLoading]    = React.useState(true);
  const [page,       setPage]       = React.useState(0);
  const [hasMore,    setHasMore]    = React.useState(true);
  const [showFilter, setShowFilter] = React.useState(false);
  const [filters,    setFilters]    = React.useState<DiscFilterState>({category:null,city:null,vibes:[],budget:null});
  const [enquiring,  setEnquiring]  = React.useState(false);

  const touchStart  = React.useRef<{x:number;y:number;t:number}|null>(null);
  const tapTimer    = React.useRef<ReturnType<typeof setTimeout>|null>(null);
  const lastTap     = React.useRef(0);
  const tapCount    = React.useRef(0);

  const hasActiveFilters = !!(filters.category||filters.city||filters.vibes.length||filters.budget);

  React.useEffect(()=>{
    setLoading(true);
    fetchDiscoverFeed({page:0,category:filters.category??undefined,city:filters.city??undefined,budget:filters.budget??undefined,vibes:filters.vibes.length?filters.vibes.join(','):undefined})
      .then(({vendors:v,has_more})=>{setVendors(v);setHasMore(has_more);setVIdx(0);setImgIdx(0);setPage(0);})
      .catch(()=>{}).finally(()=>setLoading(false));
  },[filters]);

  // Paginate
  React.useEffect(()=>{
    if(!hasMore||!vendors.length||vIdx<vendors.length-3) return;
    const next=page+1;
    fetchDiscoverFeed({page:next,category:filters.category??undefined,city:filters.city??undefined,budget:filters.budget??undefined,vibes:filters.vibes.length?filters.vibes.join(','):undefined})
      .then(({vendors:more,has_more})=>{if(more.length){setVendors(p=>[...p,...more]);setPage(next);setHasMore(has_more);}else setHasMore(false);})
      .catch(()=>{});
  },[vIdx,vendors.length,hasMore,page,filters]);

  const vendor = vendors[vIdx];
  const photos = vendor?.photos||[];

  // Preload next images
  React.useEffect(()=>{
    if(!vendor) return;
    const toLoad:string[]=[];
    for(let i=imgIdx+1;i<Math.min(photos.length,imgIdx+3);i++) toLoad.push(photos[i]);
    if(vendors[vIdx+1]?.photos[0]) toLoad.push(vendors[vIdx+1].photos[0]);
    toLoad.forEach(s=>{const img=new Image();img.src=s;});
  },[vIdx,imgIdx,vendor,vendors,photos]);

  const goNextV=React.useCallback(()=>{
    if(vIdx>=vendors.length-1)return;
    setVIdx(i=>i+1);setImgIdx(0);setPanelOpen(false);setDissolve(k=>k+1);discHaptic(5);
  },[vIdx,vendors.length]);

  const goPrevV=React.useCallback(()=>{
    if(vIdx<=0)return;
    setVIdx(i=>i-1);setImgIdx(0);setPanelOpen(false);setDissolve(k=>k+1);discHaptic(5);
  },[vIdx]);

  const cyclePhoto=React.useCallback(()=>{
    if(!photos.length) return;
    setImgIdx(i=>(i+1)%photos.length);
    setDissolve(k=>k+1);discHaptic(4);
  },[photos.length]);

  const handleDoubleTap=React.useCallback(()=>{
    if(!vendor)return;
    spawnDiscHeart(accent);
    saveVendorToMuse(vendor.id,photos[imgIdx]||null).then(r=>spawnDiscToast(r.ok?'Saved to Muse ♥':'Already in Muse'));
  },[vendor,photos,imgIdx,accent]);

  // Blind mode: cycle through all vendor photos anonymously
  const [blindItems, setBlindItems] = React.useState<{vId:string;img:string}[]>([]);
  const [blindIdx,   setBlindIdx]   = React.useState(0);
  React.useEffect(()=>{
    const q:{vId:string;img:string}[]=[];
    vendors.forEach(v=>{
      if(!v.photos.length) q.push({vId:v.id,img:''});
      else v.photos.forEach(p=>q.push({vId:v.id,img:p}));
    });
    setBlindItems(q);
    setBlindIdx(0);
  },[vendors]);

  const onTouchStart=(e:React.TouchEvent<HTMLDivElement>)=>{
    const t=e.touches[0];
    touchStart.current={x:t.clientX,y:t.clientY,t:Date.now()};
  };

  const onTouchEnd=(e:React.TouchEvent<HTMLDivElement>)=>{
    if(!touchStart.current)return;
    const s=touchStart.current; touchStart.current=null;
    const end=e.changedTouches[0];
    const dx=end.clientX-s.x, dy=end.clientY-s.y, dt=Date.now()-s.t;
    const ax=Math.abs(dx), ay=Math.abs(dy);

    // Tap detection
    if(ax<DISC_TAP_MOVE&&ay<DISC_TAP_MOVE&&dt<DISC_TAP_TIME){
      const now=Date.now(),since=now-lastTap.current;
      if(since<DISC_DTAP_MS&&tapCount.current>=1){
        if(tapTimer.current)clearTimeout(tapTimer.current);
        tapCount.current=0;
        if(isBlind){
          const item=blindItems[blindIdx];
          if(item){spawnDiscHeart(accent);saveVendorToMuse(item.vId,item.img||null).then(r=>spawnDiscToast(r.ok?'Saved to Muse ♥':'Already in Muse'));}
        } else {
          handleDoubleTap();
        }
      } else {
        tapCount.current=1;lastTap.current=now;
        tapTimer.current=setTimeout(()=>{
          if(tapCount.current===1){
            if(isBlind){
              // single tap in blind = next photo
              setBlindIdx(i=>Math.min(i+1,blindItems.length-1));
              setDissolve(k=>k+1);discHaptic(5);
            } else {
              // single tap in normal = cycle photo
              cyclePhoto();
            }
          }
          tapCount.current=0;
        },DISC_DTAP_MS);
      }
      return;
    }

    const vel=Math.max(ax,ay)/Math.max(dt,1);
    if(Math.max(ax,ay)<=DISC_SWIPE_THRESH&&vel<=0.3)return;

    // Swipe left = next vendor, swipe right = prev vendor
    // Only horizontal swipes navigate vendors
    if(ax>ay){
      if(isBlind){
        if(dx<-DISC_SWIPE_THRESH){setBlindIdx(i=>Math.min(i+1,blindItems.length-1));setDissolve(k=>k+1);discHaptic(5);}
        else if(dx>DISC_SWIPE_THRESH){setBlindIdx(i=>Math.max(i-1,0));setDissolve(k=>k+1);discHaptic(5);}
      } else {
        if(dx<-DISC_SWIPE_THRESH) goNextV();
        else if(dx>DISC_SWIPE_THRESH) goPrevV();
      }
    }
  };

  const handleEnquire=React.useCallback(async ()=>{
    if(!vendor||enquiring)return;
    setEnquiring(true);
    setPanelOpen(false);
    try {
      const API='https://dream-os-production.up.railway.app';
      const raw=typeof window!=='undefined'?(localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session')):null;
      const session=raw?JSON.parse(raw):null;
      await fetch(`${API}/api/v2/discover/enquire`,{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          vendor_id:vendor.id,
          bride_name:session?.bride_name||session?.name||undefined,
        }),
      });
      spawnDiscToast('Enquiry sent ✦');
    } catch {
      spawnDiscToast('Could not send. Try again.');
    }
    setEnquiring(false);
  },[vendor,enquiring]);

  const handleCircleShare=React.useCallback(()=>{
    if(!vendor)return;
    setPanelOpen(false);
    saveVendorToMuse(vendor.id,photos[imgIdx]||null)
      .then(r=>spawnDiscToast(r.ok?'Shared to Circle ✦':'Already saved'));
  },[vendor,photos,imgIdx]);

  const photo = isBlind?(blindItems[blindIdx]?.img||''):photos[imgIdx];

  if(loading) return (
    <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',background:'#080608'}}>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.2em',textTransform:'uppercase' as any,color:'rgba(245,240,232,.3)'}}>Loading…</span>
    </div>
  );

  if(!vendor&&!isBlind) return (
    <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'#080608',gap:12}}>
      <span style={{fontFamily:"'Italianno',cursive",fontSize:42,color:accent,lineHeight:1}}>All seen.</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.2em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.3)'}}>Check back soon</span>
    </div>
  );

  return (
    <div style={{flex:1,position:'relative',background:'#080608',overflow:'hidden',touchAction:'none',userSelect:'none',WebkitUserSelect:'none' as any}}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      <style>{`
        @keyframes discHeartPop{0%{opacity:0;transform:translate(-50%,-50%) scale(.3)}45%{opacity:1;transform:translate(-50%,-50%) scale(1.15)}70%{transform:translate(-50%,-50%) scale(.95)}100%{opacity:0;transform:translate(-50%,-50%) scale(1)}}
        @keyframes discDissolve{from{opacity:0}to{opacity:1}}
      `}</style>

      {/* Photo */}
      <div key={dissolve} style={{position:'absolute',inset:0,zIndex:1,animation:'discDissolve 240ms cubic-bezier(0.22,1,0.36,1)'}}>
        {photo
          ? <img src={photo} alt="" draggable={false} style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
          : <div style={{position:'absolute',inset:0,background:'#1a1714',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:14,color:'rgba(248,247,245,.2)'}}>No photo yet</span></div>
        }
        {/* Vignette */}
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,.2) 0%,transparent 20%,transparent 55%,rgba(0,0,0,.65) 100%)',pointerEvents:'none'}}/>
      </div>

      {/* Blind overlay — category only */}
      {isBlind&&vendor&&(
        <div style={{position:'absolute',inset:0,zIndex:5,pointerEvents:'none',display:'flex',alignItems:'center',justifyContent:'center'}}>
          <div style={{background:'rgba(8,6,8,.45)',backdropFilter:'blur(2px)',WebkitBackdropFilter:'blur(2px)',borderRadius:8,padding:'8px 18px'}}>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.28em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.7)'}}>
              {blindItems[blindIdx]?(vendors.find(v=>v.id===blindItems[blindIdx].vId)?.category||'vendor'):'–'}
            </span>
          </div>
        </div>
      )}

      {/* Vendor name bar at bottom (non-blind, panel closed) */}
      {!isBlind&&!panelOpen&&vendor&&(
        <div style={{position:'absolute',bottom:'calc(env(safe-area-inset-bottom,0px) + 58px)',left:0,right:0,padding:'0 20px',zIndex:10,pointerEvents:'none',display:'flex',flexDirection:'column',gap:3}}>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.5)'}}>{vendor.category} · {vendor.city}</div>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:22,color:'rgba(248,247,245,.92)',lineHeight:1.1,fontFeatureSettings:'"opsz" 9'}}>{vendor.name}</div>
        </div>
      )}

      {/* Image dots — above peek nav */}
      {!isBlind&&<DiscImageDots total={photos.length} current={imgIdx} accent={accent}/>}

      {/* Peek nav */}
      <DiscPeekNav
        onTap={()=>setPanelOpen(o=>!o)}
        accent={accent}
        panelOpen={panelOpen}
        hasActiveFilters={hasActiveFilters}
        onFilterTap={()=>setShowFilter(true)}
        isBlind={isBlind}
        onBlindTap={()=>{setIsBlind(b=>!b);setBlindIdx(0);setDissolve(k=>k+1);}}
      />

      {/* Vendor panel */}
      {!isBlind&&vendor&&(
        <DiscVendorPanel
          vendor={vendor}
          visible={panelOpen}
          onClose={()=>setPanelOpen(false)}
          accent={accent}
          onEnquire={handleEnquire}
          onCircleShare={handleCircleShare}
        />
      )}

      {/* Filter sheet */}
      {showFilter&&(
        <DiscFilterSheet visible={showFilter} onClose={()=>setShowFilter(false)} filters={filters} accent={accent} dark={dark}
          onApply={f=>{setFilters(f);setShowFilter(false);}}/>
      )}
    </div>
  );
}

// ── MUSE ROOM ─────────────────────────────────────────────────────────────────
// Always dark #080608 — photo gallery, both modes.
// Pills and filters use Wine Night / Sky Ivory DNA (terracotta / slate blue).
// Ported from the existing 544-line muse/page.tsx — same logic, bloom shell.

type MuseCeremony = 'all'|'haldi'|'mehendi'|'sangeet'|'reception'|'wedding';
type MuseSourceFilter = 'all'|'bride'|'circle_member';

const MUSE_CEREMONY_FILTERS: {label:string;value:MuseCeremony}[] = [
  {label:'All',value:'all'},{label:'Haldi',value:'haldi'},
  {label:'Mehendi',value:'mehendi'},{label:'Sangeet',value:'sangeet'},
  {label:'Reception',value:'reception'},{label:'Wedding',value:'wedding'},
];
const MUSE_SOURCE_FILTERS: {label:string;value:MuseSourceFilter}[] = [
  {label:'All',value:'all'},{label:'Mine',value:'bride'},{label:'Circle',value:'circle_member'},
];

const MUSE_TAGS_LIST: [string,string][] = [
  ['moody','Moody'],['editorial','Editorial'],['cinematic','Cinematic'],
  ['film','Film'],['candid','Candid'],['intimate','Intimate'],
  ['grand','Grand'],['ott','OTT'],['destination','Destination'],
  ['pastel','Pastel'],['minimal','Minimal'],['festive','Festive'],
  ['vibrant','Vibrant'],['warm','Warm'],['rustic','Rustic'],
];

function MuseOverlay({save,activity,onClose,onRemove,accent,dark}:{
  save:MuseSave; activity:MuseActivity[]; onClose:()=>void;
  onRemove:(id:string)=>void; accent:string; dark:boolean;
}) {
  const [expanded,   setExpanded]   = React.useState(false);
  const [vendorOpen, setVendorOpen] = React.useState(false);
  const [copyToast,  setCopyToast]  = React.useState(false);
  const isVendor = save.source_type==='vendor';
  const pillActiveTxt = dark ? '#1A0810' : '#FFFFFF';

  const handleEnquire = () => { if(save.enquire_link) window.open(save.enquire_link,'_blank'); };
  const handleShare = async () => {
    if(!save.enquire_link) return;
    if(navigator.share){ try{ await navigator.share({title:`${save.vendor_name||'Vendor'} — The Dream Wedding`,url:save.enquire_link}); }catch{} }
    else { try{ await navigator.clipboard.writeText(save.enquire_link);setCopyToast(true);setTimeout(()=>setCopyToast(false),2000); }catch{} }
  };

  return (
    <div style={{position:'absolute',inset:0,zIndex:150,background:'#080608',display:'flex',flexDirection:'column'}}>
      <div style={{flex:1,position:'relative'}} onClick={()=>isVendor&&setVendorOpen(v=>!v)}>
        {save.image_url
          ? <img src={save.image_url} alt="" style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',pointerEvents:'none'}}/>
          : <div style={{position:'absolute',inset:0,background:'#1a1714',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:14,color:'rgba(248,247,245,.2)'}}>No image</span></div>
        }
        <div style={{position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(0,0,0,.3) 0%,transparent 30%,transparent 60%,rgba(0,0,0,.6) 100%)',pointerEvents:'none'}}/>
        <button onClick={e=>{e.stopPropagation();onClose();}} style={{position:'absolute',top:'calc(env(safe-area-inset-top,0px) + 14px)',left:16,zIndex:155,width:36,height:36,borderRadius:'50%',background:'rgba(0,0,0,.35)',backdropFilter:'blur(12px)',WebkitBackdropFilter:'blur(12px)',border:'0.5px solid rgba(255,255,255,.2)',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(255,255,255,.9)'}}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        {isVendor&&!vendorOpen&&<div style={{position:'absolute',bottom:80,left:0,right:0,display:'flex',justifyContent:'center',pointerEvents:'none'}}><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(255,255,255,.45)'}}>Tap to see vendor</span></div>}
        {copyToast&&<div style={{position:'absolute',top:'calc(env(safe-area-inset-top,0px) + 60px)',left:'50%',transform:'translateX(-50%)',background:'rgba(12,10,9,.8)',backdropFilter:'blur(12px)',borderRadius:20,padding:'6px 16px',fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.15em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.9)',whiteSpace:'nowrap'}}>Link copied</div>}
      </div>
      {isVendor&&(
        <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:160,transform:vendorOpen?'translateY(0)':'translateY(100%)',transition:'transform 340ms cubic-bezier(0.22,1,0.36,1)',background:'rgba(8,6,8,.92)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderTop:'0.5px solid rgba(255,255,255,.08)',borderRadius:'20px 20px 0 0',paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 24px)'}}>
          <div style={{display:'flex',justifyContent:'center',padding:'12px 0 16px'}}><div style={{width:36,height:4,borderRadius:2,background:'rgba(255,255,255,.2)'}}/></div>
          <div style={{padding:'0 24px'}}>
            <p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.22em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.5)',margin:'0 0 8px'}}>{save.vendor_category}&nbsp;·&nbsp;{save.vendor_city}</p>
            <h2 style={{fontFamily:"'Fraunces',serif",fontSize:26,fontWeight:300,color:'#F8F7F5',margin:'0 0 4px',lineHeight:1.1}}>{save.vendor_name}</h2>
            {save.vendor_starting_price&&<p style={{fontFamily:"'Fraunces',serif",fontSize:13,fontWeight:300,color:'rgba(248,247,245,.5)',margin:'0 0 8px'}}>{save.vendor_starting_price>=100000?`Rs ${(save.vendor_starting_price/100000).toFixed(save.vendor_starting_price%100000===0?0:1)}L onwards`:`Rs ${(save.vendor_starting_price/1000).toFixed(0)}K onwards`}</p>}
            {save.vendor_vibe_tags.length>0&&<p style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:'rgba(248,247,245,.45)',letterSpacing:'.12em',margin:'0 0 20px'}}>{save.vendor_vibe_tags.join(' · ')}</p>}
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={handleEnquire} style={{width:'100%',padding:'14px 0',background:'rgba(248,247,245,.9)',border:'none',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase' as any,color:'#111',cursor:'pointer'}}>Enquire ↗</button>
              <div style={{display:'flex',gap:8}}>
                <button onClick={handleShare} style={{flex:1,padding:'12px 0',background:'rgba(255,255,255,.12)',border:'0.5px solid rgba(255,255,255,.18)',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.7)',cursor:'pointer'}}>Share ↗</button>
                <button onClick={()=>onRemove(save.id)} style={{flex:1,padding:'12px 0',background:'rgba(184,69,62,.15)',border:'0.5px solid rgba(184,69,62,.3)',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(220,100,90,.9)',cursor:'pointer'}}>Remove</button>
              </div>
            </div>
          </div>
        </div>
      )}
      {!isVendor&&(
        <div style={{background:'rgba(8,6,8,.85)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderTop:'0.5px solid rgba(255,255,255,.08)',padding:'16px 20px calc(env(safe-area-inset-bottom,0px) + 16px)'}}>
          <div style={{display:'flex',gap:8}}>
            <button onClick={handleShare} style={{flex:1,padding:'12px 0',background:'rgba(255,255,255,.12)',border:'0.5px solid rgba(255,255,255,.18)',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.7)',cursor:'pointer'}}>Share ↗</button>
            <button onClick={()=>onRemove(save.id)} style={{flex:1,padding:'12px 0',background:'rgba(184,69,62,.15)',border:'0.5px solid rgba(184,69,62,.3)',borderRadius:10,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(220,100,90,.9)',cursor:'pointer'}}>Remove</button>
          </div>
        </div>
      )}
      {activity.length>0&&(
        <div onClick={()=>setExpanded(e=>!e)} style={{background:'rgba(8,6,8,.85)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',borderTop:'0.5px solid rgba(255,255,255,.08)',padding:expanded?'20px 20px calc(env(safe-area-inset-bottom,0px) + 20px)':'14px 20px calc(env(safe-area-inset-bottom,0px) + 14px)',cursor:'pointer',transition:'padding 240ms ease'}}>
          {!expanded
            ? <div style={{display:'flex',alignItems:'center',gap:8}}><div style={{width:4,height:4,borderRadius:'50%',background:accent}}/><span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.6)'}}>{activity.length} circle interaction{activity.length!==1?'s':''} · tap to see</span></div>
            : <div style={{display:'flex',flexDirection:'column',gap:12}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:'rgba(248,247,245,.4)',marginBottom:4}}>Circle Activity</span>
                {activity.map(a=>(<div key={a.id}><span style={{fontFamily:"'Fraunces',serif",fontSize:12,fontWeight:400,color:'rgba(248,247,245,.8)'}}>{a.member_name}</span><span style={{fontFamily:"'Fraunces',serif",fontSize:12,fontWeight:300,color:'rgba(248,247,245,.5)'}}>{a.activity_type==='comment'&&a.content?`: "${a.content}"`:` ${a.activity_type.replace(/_/g,' ')}`}</span></div>))}
              </div>
          }
        </div>
      )}
    </div>
  );
}

interface MuseRoomProps { dark:boolean; accent:string; }

function MuseRoom({ dark, accent }: MuseRoomProps) {
  // Pills use mode DNA — terracotta (WN) / slate blue (SI)
  const pillActive    = accent;
  const pillActiveTxt = dark ? '#1A0810' : '#FFFFFF';
  const pillIdle      = dark ? 'rgba(196,133,106,.10)' : 'rgba(42,95,130,.10)';
  const pillIdleTxt   = dark ? 'rgba(196,133,106,.75)' : 'rgba(42,95,130,.80)';
  const pillIdleBdr   = dark ? 'rgba(196,133,106,.22)' : 'rgba(42,95,130,.25)';
  const divider       = dark ? 'rgba(196,133,106,.18)' : 'rgba(42,95,130,.18)';

  const [ceremonyFilter, setCeremonyFilter] = React.useState<MuseCeremony>('all');
  const [sourceFilter,   setSourceFilter]   = React.useState<MuseSourceFilter>('all');
  const [saves,          setSaves]          = React.useState<MuseSave[]>([]);
  const [total,          setTotal]          = React.useState(0);
  const [loading,        setLoading]        = React.useState(true);
  const [selectedSave,   setSelectedSave]   = React.useState<MuseSave|null>(null);
  const [saveActivity,   setSaveActivity]   = React.useState<MuseActivity[]>([]);
  const [addSheet,       setAddSheet]       = React.useState(false);
  const [saving,         setSaving]         = React.useState(false);
  const [urlInput,       setUrlInput]       = React.useState('');
  const [addToast,       setAddToast]       = React.useState('');
  const [showTagOverlay, setShowTagOverlay] = React.useState(false);
  const [selectedTags,   setSelectedTags]   = React.useState<string[]>([]);
  const [savingTags,     setSavingTags]     = React.useState(false);
  const [tagsSaved,      setTagsSaved]      = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState<{current:number;total:number}|null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(()=>{
    const token=typeof window!=='undefined'?localStorage.getItem('access_token'):null;
    if(token){ fetch('https://dream-os-production.up.railway.app/api/v2/couple/taste/profile',{headers:{'Authorization':`Bearer ${token}`}}).then(r=>r.json()).then(d=>{if(!d.taste_quiz_done)setShowTagOverlay(true);}).catch(()=>{}); }
  },[]);

  React.useEffect(()=>{
    setLoading(true);
    fetchMuseSaves({saved_by:sourceFilter}).then(({saves:s,total:t})=>{setSaves(s);setTotal(t);}).catch(()=>{}).finally(()=>setLoading(false));
  },[sourceFilter]);

  const filtered = ceremonyFilter==='all'?saves:saves.filter(s=>s.aesthetic_tags.includes(ceremonyFilter));

  const openSave = async (save:MuseSave) => {
    setSelectedSave(save); setSaveActivity([]);
    if(save.circle_comment_count>0){ const res=await fetchSaveActivity(save.id); if(res)setSaveActivity(res.activity); }
  };

  const handleRemove = async (saveId:string) => {
    const ok=await deleteMuseSave(saveId);
    if(ok){ setSaves(prev=>prev.filter(s=>s.id!==saveId)); setSelectedSave(null); setSaveActivity([]); }
  };

  const handleAddFromUrl = async () => {
    if(!urlInput.trim()||saving) return;
    setSaving(true);
    const res=await createMuseSaveFromUrl(urlInput.trim());
    setSaving(false); setUrlInput(''); setAddSheet(false);
    setAddToast(res.ok?'Saved to Muse':'Could not save that link');
    setTimeout(()=>setAddToast(''),2400);
    fetchMuseSaves({saved_by:sourceFilter}).then(({saves:s,total:tt})=>{setSaves(s);setTotal(tt);});
  };

  const handleFilesSelected = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const files=(Array.from(e.target.files||[]) as File[]).filter(f=>f.type.startsWith('image/'));
    if(!files.length) return;
    setAddSheet(false); setSaving(true);
    let ok=0,fail=0;
    for(let i=0;i<files.length;i++){
      setUploadProgress({current:i+1,total:files.length});
      try{ const r=await uploadMuseImage(files[i]); if(r.ok)ok++; else fail++; }catch{ fail++; }
    }
    setUploadProgress(null); setSaving(false);
    if(fileInputRef.current) fileInputRef.current.value='';
    setAddToast(fail===0?(ok===1?'Saved to Muse':`Saved ${ok} to Muse`):ok===0?'Could not save any images':`Saved ${ok}, ${fail} failed`);
    setTimeout(()=>setAddToast(''),2800);
    fetchMuseSaves({saved_by:sourceFilter}).then(({saves:s,total:tt})=>{setSaves(s);setTotal(tt);});
  };

  const toggleTag=(tag:string)=>setSelectedTags(prev=>prev.includes(tag)?prev.filter(x=>x!==tag):[...prev,tag]);

  const saveTags=async()=>{
    if(!selectedTags.length) return; setSavingTags(true);
    try{ const token=typeof window!=='undefined'?localStorage.getItem('access_token'):null; if(token){ await fetch('https://dream-os-production.up.railway.app/api/v2/couple/taste',{method:'POST',headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},body:JSON.stringify({tags:selectedTags})}); } setTagsSaved(true); setTimeout(()=>setShowTagOverlay(false),3000); }catch{}
    setSavingTags(false);
  };

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:'#080608',position:'relative',overflow:'hidden'}}>

      {/* Taste quiz overlay */}
      {showTagOverlay&&(
        <>
          <div style={{position:'absolute',inset:0,background:'rgba(0,0,0,.85)',backdropFilter:'blur(8px)',WebkitBackdropFilter:'blur(8px)',zIndex:200}}/>
          <div style={{position:'absolute',inset:0,zIndex:201,display:'flex',flexDirection:'column',padding:'48px 24px calc(env(safe-area-inset-bottom,0px) + 24px)',overflowY:'auto'}}>
            {tagsSaved
              ? <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',textAlign:'center'}}><div style={{fontFamily:"'Italianno',cursive",fontSize:44,color:'rgba(245,240,232,.95)',marginBottom:12,lineHeight:1}}>Give us 5 minutes.</div><div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:'rgba(245,240,232,.55)',lineHeight:1.7,maxWidth:280,fontFeatureSettings:'"opsz" 9'}}>We're curating your Surprise Me with images that match your aesthetic. Come back soon.</div></div>
              : <>
                  <div style={{marginBottom:24}}><div style={{fontFamily:"'Italianno',cursive",fontSize:40,color:'rgba(245,240,232,.95)',lineHeight:1,marginBottom:10}}>What moves you?</div><div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:'rgba(245,240,232,.5)',lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>Pick everything that feels like you. We'll curate your Surprise Me.</div></div>
                  <div style={{display:'flex',flexWrap:'wrap' as any,gap:10,marginBottom:24}}>
                    {MUSE_TAGS_LIST.map(([value,label])=>{const sel=selectedTags.includes(value);return <button key={value} onClick={()=>toggleTag(value)} style={{padding:'10px 18px',borderRadius:100,border:`1px solid ${sel?accent:'rgba(255,255,255,.2)'}`,background:sel?`${accent}22`:'rgba(255,255,255,.05)',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:14,color:sel?accent:'rgba(245,240,232,.7)',cursor:'pointer',fontFeatureSettings:'"opsz" 9'}}>{label}</button>;})}
                  </div>
                  <div style={{display:'flex',gap:12}}>
                    <button onClick={()=>setShowTagOverlay(false)} style={{flex:1,padding:'13px 0',background:'rgba(255,255,255,.06)',border:'0.5px solid rgba(255,255,255,.15)',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.2em',textTransform:'uppercase' as any,color:'rgba(245,240,232,.4)',cursor:'pointer'}}>Skip</button>
                    <button onClick={saveTags} disabled={savingTags||!selectedTags.length} style={{flex:2,padding:'13px 0',background:selectedTags.length?accent:'rgba(255,255,255,.08)',border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.2em',textTransform:'uppercase' as any,color:selectedTags.length?pillActiveTxt:'rgba(245,240,232,.25)',cursor:selectedTags.length?'pointer':'default',opacity:savingTags?.6:1}}>{savingTags?'Saving…':`Save${selectedTags.length>0?` (${selectedTags.length})`:''}`}</button>
                  </div>
                </>
            }
          </div>
        </>
      )}

      {/* Full-bleed overlay */}
      {selectedSave&&<MuseOverlay save={selectedSave} activity={saveActivity} accent={accent} dark={dark} onClose={()=>{setSelectedSave(null);setSaveActivity([]);}} onRemove={handleRemove}/>}

      {/* Header */}
      <div style={{padding:'18px 20px 10px',flexShrink:0,display:'flex',alignItems:'flex-start',justifyContent:'space-between'}}>
        <div>
          <div style={{fontFamily:"'Italianno',cursive",fontSize:38,color:'#F0EDE8',lineHeight:1,marginBottom:3}}>Muse</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:dark?'rgba(196,133,106,.55)':'rgba(42,95,130,.65)'}}>{loading?'loading…':`${total} saved`}</div>
        </div>
        {/* Surprise Me pill */}
        <a href="/frost/canvas/surprise"
          style={{display:'flex',alignItems:'center',gap:5,height:28,padding:'0 12px 0 10px',borderRadius:100,
            background:`${accent}1A`,border:`0.5px solid ${accent}55`,
            cursor:'pointer',touchAction:'manipulation',textDecoration:'none',flexShrink:0,marginTop:4}}>
          <span style={{fontSize:9,color:accent,lineHeight:1}}>✦</span>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:accent,whiteSpace:'nowrap'}}>Surprise Me</span>
        </a>
      </div>

      {/* Pills — Source | Ceremony — all using mode DNA */}
      <div className="no-scroll" style={{display:'flex',gap:7,padding:'0 20px 10px',overflowX:'auto',flexShrink:0,WebkitOverflowScrolling:'touch' as any}}>
        {MUSE_SOURCE_FILTERS.map(f=>{const active=sourceFilter===f.value;return <button key={f.value} onClick={()=>setSourceFilter(f.value)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'7px 14px',borderRadius:100,flexShrink:0,background:active?pillActive:pillIdle,color:active?pillActiveTxt:pillIdleTxt,border:`0.5px solid ${active?'transparent':pillIdleBdr}`,cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>{f.label}</button>;})}
        <div style={{width:.5,background:divider,alignSelf:'center',flexShrink:0,margin:'0 3px',height:16}}/>
        {MUSE_CEREMONY_FILTERS.map(f=>{const active=ceremonyFilter===f.value;return <button key={f.value} onClick={()=>setCeremonyFilter(f.value)} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'7px 14px',borderRadius:100,flexShrink:0,background:active?pillActive:pillIdle,color:active?pillActiveTxt:pillIdleTxt,border:`0.5px solid ${active?'transparent':pillIdleBdr}`,cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>{f.label}</button>;})}
      </div>

      {/* Masonry grid */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,padding:'0 12px 24px'}}>
        {!loading&&filtered.length===0&&<div style={{textAlign:'center' as any,padding:'64px 0',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:18,color:'rgba(240,237,232,.3)',fontFeatureSettings:'"opsz" 9'}}>No saves here yet.</div>}
        <div style={{columns:'2 auto',columnGap:8}}>
          {filtered.map(save=>(
            <div key={save.id} onClick={()=>openSave(save)} style={{position:'relative',marginBottom:8,borderRadius:8,overflow:'hidden',breakInside:'avoid',cursor:'pointer',background:'#1a1714'}}>
              {save.image_url
                ? <img src={save.image_url} alt={save.vendor_name||'muse'} style={{width:'100%',display:'block',objectFit:'cover'}} loading="lazy"/>
                : <div style={{width:'100%',aspectRatio:'3/4',display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:11,color:'rgba(248,247,245,.2)'}}>{save.vendor_name||'—'}</span></div>
              }
              {save.vendor_name&&<div style={{position:'absolute',bottom:6,left:6,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.14em',textTransform:'uppercase' as any,background:'rgba(8,6,8,.6)',color:'rgba(245,240,232,.9)',padding:'3px 7px',borderRadius:100,backdropFilter:'blur(4px)'}}>{save.vendor_name}</div>}
              {save.circle_comment_count>0&&<div style={{position:'absolute',top:6,right:6,background:`${accent}DD`,borderRadius:100,padding:'2px 6px',fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:pillActiveTxt,letterSpacing:'.1em'}}>{save.circle_comment_count}</div>}
              {save.saved_by_role==='circle_member'&&<div style={{position:'absolute',top:6,left:6,background:'rgba(8,6,8,.55)',backdropFilter:'blur(4px)',borderRadius:100,padding:'3px 7px',fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:'rgba(248,247,245,.7)',letterSpacing:'.12em',textTransform:'uppercase' as any}}>Circle</div>}
            </div>
          ))}
        </div>
      </div>

      {/* FAB */}
      <button onClick={()=>setAddSheet(true)} style={{position:'absolute',bottom:'calc(env(safe-area-inset-bottom,0px) + 24px)',right:24,zIndex:50,width:52,height:52,borderRadius:26,background:accent,border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',boxShadow:'0 4px 24px rgba(0,0,0,.45)',touchAction:'manipulation'}}>
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 4v12M4 10h12" stroke={pillActiveTxt} strokeWidth="1.8" strokeLinecap="round"/></svg>
      </button>

      {/* Add sheet */}
      {addSheet&&(
        <>
          <div onClick={()=>setAddSheet(false)} style={{position:'absolute',inset:0,background:'rgba(0,0,0,.6)',zIndex:300}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,zIndex:301,background:'#141010',borderRadius:'20px 20px 0 0',border:`0.5px solid ${divider}`,padding:'28px 24px calc(28px + env(safe-area-inset-bottom))'}}>
            <div style={{fontFamily:"'Italianno',cursive",fontSize:36,color:'#F0EDE8',marginBottom:4}}>Add to Muse</div>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:'rgba(240,237,232,.5)',marginBottom:24,fontFeatureSettings:'"opsz" 9'}}>Upload from your phone or paste a link.</div>
            <button onClick={()=>fileInputRef.current?.click()} disabled={saving} style={{width:'100%',padding:14,background:accent,border:'none',borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase' as any,color:pillActiveTxt,cursor:'pointer',opacity:saving?.5:1,marginBottom:14}}>Upload from phone</button>
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:14,color:'rgba(240,237,232,.3)',fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.22em',textTransform:'uppercase' as any}}><div style={{flex:1,height:.5,background:divider}}/><span>or</span><div style={{flex:1,height:.5,background:divider}}/></div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:dark?'rgba(196,133,106,.55)':'rgba(42,95,130,.55)',marginBottom:8}}>Paste a link</div>
            <input value={urlInput} onChange={e=>setUrlInput(e.target.value)} placeholder="https://i.pinimg.com/…" style={{width:'100%',padding:'12px 14px',background:'rgba(255,255,255,.05)',border:`0.5px solid ${divider}`,borderRadius:8,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:14,color:'#F0EDE8',outline:'none',boxSizing:'border-box' as any,marginBottom:12,fontFeatureSettings:'"opsz" 9',userSelect:'text'}}/>
            <button onClick={handleAddFromUrl} disabled={!urlInput.trim()||saving} style={{width:'100%',padding:12,background:'transparent',border:`0.5px solid ${divider}`,borderRadius:8,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase' as any,color:'rgba(240,237,232,.7)',cursor:'pointer',opacity:(!urlInput.trim()||saving)?.5:1}}>{saving?'Saving…':'Save link'}</button>
          </div>
        </>
      )}

      <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleFilesSelected} style={{display:'none'}}/>
      {uploadProgress&&<div style={{position:'absolute',top:24,left:'50%',transform:'translateX(-50%)',background:'rgba(240,237,232,.95)',color:'#080608',fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'10px 20px',borderRadius:20,zIndex:400,pointerEvents:'none',whiteSpace:'nowrap'}}>Uploading {uploadProgress.current} of {uploadProgress.total}…</div>}
      {addToast&&<div style={{position:'absolute',top:24,left:'50%',transform:'translateX(-50%)',background:'rgba(240,237,232,.95)',color:'#080608',fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'8px 18px',borderRadius:20,zIndex:400,pointerEvents:'none',whiteSpace:'nowrap'}}>{addToast}</div>}
    </div>
  );
}

// ── EVENTS ROOM — ornament on a string ────────────────────────────────────────
// Vertical line. Date bubble. Beautiful moments hanging off it.
// Same layout as the original events page the bride loved.

interface EventsRoomProps {
  dark:boolean; accent:string; signal:string;
  roomInk:string; roomInkSoft:string; roomInkMute:string; roomLine:string;
}

function EventsRoom({ dark, accent, roomInk, roomInkSoft, roomInkMute }: EventsRoomProps) {
  const [events,  setEvents]  = React.useState<CoupleEvent[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [selected, setSelected] = React.useState<CoupleEvent|null>(null);

  // Gradient — same family as the rest of the mode
  // Events inherits exact same gradient as Sanctuary — same DNA, same house
  const evBg = dark
    ? 'radial-gradient(ellipse 110% 55% at 50% -5%,rgba(196,133,106,.18) 0%,transparent 52%),radial-gradient(ellipse 70% 60% at 90% 110%,rgba(40,5,12,.80) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 5% 100%,rgba(60,8,20,.70) 0%,transparent 50%),linear-gradient(180deg,#1A0A0E 0%,#0E0506 40%,#080204 70%,#0C0408 100%)'
    : 'radial-gradient(ellipse 110% 50% at 60% -5%,rgba(74,122,155,.24) 0%,transparent 55%),radial-gradient(ellipse 70% 50% at 10% 110%,rgba(42,95,130,.16) 0%,transparent 55%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 30%,#D8DEEC 60%,#CDD4E8 100%)';

  const pgInk     = dark ? '#F5E5DC' : '#0C1830';
  const pgInkSoft = dark ? 'rgba(245,229,220,.70)' : 'rgba(12,24,48,.65)';
  const pgInkMute = dark ? 'rgba(196,133,106,.50)' : 'rgba(42,80,130,.52)';
  const pgLine    = dark ? 'rgba(196,133,106,.14)' : 'rgba(42,80,130,.18)';
  const pgAccent  = dark ? '#C4856A' : '#2A5F82';
  const pgBubbleBg= dark ? 'rgba(196,133,106,.10)' : 'rgba(42,95,130,.10)';
  const pgBubbleBdr=dark ? 'rgba(196,133,106,.35)' : 'rgba(42,95,130,.35)';

  React.useEffect(()=>{
    fetchEvents('upcoming')
      .then(e=>{ setEvents(e); setLoading(false); })
      .catch(()=>setLoading(false));
  },[]);

  function fmtDate(d:string):{month:string;day:string} {
    const dt = new Date(d+'T00:00:00');
    if(isNaN(dt.getTime())) return {month:'',day:'—'};
    return {
      month: dt.toLocaleDateString('en-IN',{month:'short'}).toUpperCase(),
      day:   String(dt.getDate()),
    };
  }

  function fmtTime(t:string|null):string {
    if(!t) return '';
    const [h,m]=t.split(':').map(Number);
    return `${h%12||12}:${String(m).padStart(2,'0')} ${h>=12?'pm':'am'}`;
  }

  function daysUntilEvent(d:string):string {
    const today=new Date();today.setHours(0,0,0,0);
    const ev=new Date(d+'T00:00:00');ev.setHours(0,0,0,0);
    const diff=Math.round((ev.getTime()-today.getTime())/86400000);
    if(diff===0) return 'Today';
    if(diff===1) return 'Tomorrow';
    if(diff<0)   return `${Math.abs(diff)}d ago`;
    return `in ${diff} days`;
  }

  // Soonest upcoming event gets accent highlight
  const now=new Date();now.setHours(0,0,0,0);
  const soonestIdx=events.findIndex(ev=>{
    const d=new Date(ev.event_date+'T00:00:00');d.setHours(0,0,0,0);
    return d.getTime()>=now.getTime();
  });

  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',background:evBg}}>

      {/* Header */}
      <div style={{padding:'20px 24px 12px',borderBottom:`0.5px solid ${pgLine}`,flexShrink:0}}>
        <div style={{fontFamily:"'Italianno',cursive",fontSize:42,color:pgAccent,lineHeight:1}}>
          The days.
        </div>
        <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:pgInkSoft,marginTop:4,fontFeatureSettings:'"opsz" 9'}}>
          {events.length>0 ? `${events.length} beautiful moment${events.length!==1?'s':''} ahead.` : 'Your days will appear here.'}
        </div>
      </div>

      {/* Timeline scroll */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,padding:'24px 24px 48px',position:'relative'}}>

        {loading&&(
          <div style={{textAlign:'center' as any,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:pgInkMute,paddingTop:32}}>loading…</div>
        )}

        {!loading&&events.length===0&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12,paddingTop:64}}>
            <div style={{fontFamily:"'Italianno',cursive",fontSize:42,color:pgAccent,lineHeight:1,textAlign:'center' as any}}>Nothing<br/>yet.</div>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:pgInkSoft,textAlign:'center' as any,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>
              Tell Dream Ai about an event<br/>and it will appear here.
            </div>
          </div>
        )}

        {!loading&&events.length>0&&(
          <div style={{position:'relative'}}>
            {/* THE VERTICAL LINE — the string that holds the ornaments */}
            <div style={{
              position:'absolute',
              left:22,
              top:22,
              bottom:22,
              width:'0.5px',
              background:`linear-gradient(180deg, ${pgAccent}00 0%, ${pgAccent}60 8%, ${pgAccent}60 92%, ${pgAccent}00 100%)`,
            }}/>

            {/* Events — ornaments on the string */}
            {events.map((ev,i)=>{
              const {month,day}=fmtDate(ev.event_date);
              const timeStr=fmtTime(ev.event_time);
              const highlight=i===soonestIdx;
              const until=daysUntilEvent(ev.event_date);

              return(
                <div key={ev.id}
                  onClick={()=>setSelected(selected?.id===ev.id?null:ev)}
                  style={{display:'flex',alignItems:'flex-start',gap:16,marginBottom:28,cursor:'pointer',WebkitTapHighlightColor:'transparent'}}>

                  {/* Date bubble — the ornament head */}
                  <div style={{
                    width:44,height:44,borderRadius:'50%',flexShrink:0,
                    background: highlight ? pgAccent : pgBubbleBg,
                    border:`${highlight?1.5:.5}px solid ${highlight?pgAccent:pgBubbleBdr}`,
                    display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',
                    zIndex:1,position:'relative',
                    boxShadow: highlight ? `0 0 16px ${pgAccent}40` : 'none',
                    transition:'all 200ms ease',
                  }}>
                    <div style={{
                      fontFamily:"'JetBrains Mono',monospace",
                      fontSize:7,letterSpacing:'.1em',
                      color: highlight ? (dark?'#1A0810':'#FFFFFF') : pgInkMute,
                      lineHeight:1.1,
                    }}>{month}</div>
                    <div style={{
                      fontFamily:"'Fraunces',serif",fontWeight:700,fontStyle:'normal',
                      fontSize:17,
                      color: highlight ? (dark?'#1A0810':'#FFFFFF') : pgInk,
                      lineHeight:1.1,
                      fontFeatureSettings:'"opsz" 144',
                    }}>{day}</div>
                  </div>

                  {/* Event content */}
                  <div style={{flex:1,paddingTop:6,minWidth:0}}>
                    {/* Title */}
                    <div style={{
                      fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,
                      fontSize:18,lineHeight:1.2,
                      color: highlight ? pgAccent : pgInk,
                      fontFeatureSettings:'"opsz" 9',
                      marginBottom:4,
                    }}>{ev.title}</div>

                    {/* Meta row */}
                    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' as any}}>
                      {timeStr&&(
                        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.12em',color:pgInkMute}}>{timeStr}</span>
                      )}
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.12em',textTransform:'uppercase' as any,color:pgInkMute}}>{ev.kind}</span>
                      {/* Countdown — accent color for soonest */}
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.1em',color:highlight?pgAccent:pgInkMute,marginLeft:'auto'}}>
                        {until}
                      </span>
                    </div>

                    {/* Notes — expand on tap */}
                    {selected?.id===ev.id&&ev.notes&&(
                      <div style={{
                        fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,
                        fontSize:13,color:pgInkSoft,lineHeight:1.6,
                        fontFeatureSettings:'"opsz" 9',
                        marginTop:8,
                        padding:'10px 12px',
                        borderLeft:`1.5px solid ${pgAccent}50`,
                        borderRadius:'0 4px 4px 0',
                        background: dark ? 'rgba(196,133,106,.05)' : 'rgba(42,95,130,.05)',
                      }}>
                        {ev.notes}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


// ── CIRCLE ROOM ───────────────────────────────────────────────────────────────
interface CircleRoomProps {
  dark:boolean; accent:string; signal:string;
  roomInk:string; roomInkSoft:string; roomInkMute:string; roomLine:string;
}

const ROLE_LABELS: Record<string,string> = {
  partner:'Partner · Fiancé',
  family:'Family',
  inner_circle:'Inner Circle',
};

function CircleRoom({ dark, accent, signal, roomInk, roomInkSoft, roomInkMute, roomLine }: CircleRoomProps) {
  const [data,        setData]        = React.useState<CircleData|null>(null);
  const [loading,     setLoading]     = React.useState(true);
  const [view,        setView]        = React.useState<'feed'|'invite'>('feed');
  const [inviteName,  setInviteName]  = React.useState('');
  const [inviteRole,  setInviteRole]  = React.useState('family');
  const [inviting,    setInviting]    = React.useState(false);
  const [waLink,      setWaLink]      = React.useState<string|null>(null);

  const circleBg = dark
    ? 'radial-gradient(ellipse 110% 55% at 50% -5%,rgba(196,133,106,.18) 0%,transparent 52%),radial-gradient(ellipse 70% 60% at 90% 110%,rgba(40,5,12,.80) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 5% 100%,rgba(60,8,20,.70) 0%,transparent 50%),linear-gradient(180deg,#1A0A0E 0%,#0E0506 40%,#080204 70%,#0C0408 100%)'
    : 'radial-gradient(ellipse 110% 50% at 60% -5%,rgba(74,122,155,.24) 0%,transparent 55%),radial-gradient(ellipse 70% 50% at 10% 110%,rgba(42,95,130,.16) 0%,transparent 55%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 30%,#D8DEEC 60%,#CDD4E8 100%)';

  const pgInk     = dark ? '#F5E5DC' : '#0C1830';
  const pgInkSoft = dark ? 'rgba(245,229,220,.72)' : 'rgba(12,24,48,.68)';
  const pgInkMute = dark ? 'rgba(196,133,106,.48)' : 'rgba(42,80,130,.52)';
  const pgLine    = dark ? 'rgba(196,133,106,.12)' : 'rgba(42,80,130,.16)';
  const pgAccent  = dark ? '#C4856A' : '#2A5F82';
  const candleBg  = dark ? 'rgba(196,133,106,.08)' : 'rgba(42,95,130,.06)';
  const candleBdr = dark ? 'rgba(196,133,106,.18)' : 'rgba(42,95,130,.16)';

  React.useEffect(()=>{
    fetchCircle().then(d=>{ setData(d); setLoading(false); }).catch(()=>setLoading(false));
  },[]);

  const doInvite = async () => {
    if(!inviteName.trim()||inviting) return;
    setInviting(true);
    try {
      const r = await inviteCircleMember({invitee_name:inviteName.trim(),role:inviteRole});
      setWaLink(r.wa_me_link);
    } catch(e){ console.error(e); }
    finally{ setInviting(false); }
  };

  const members  = data?.members         || [];
  const activity = data?.activity        || [];
  const pending  = data?.pending_invites || [];

  // ── INVITE VIEW ──
  if(view==='invite') return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:circleBg}}>
      <div style={{padding:'24px 24px 16px',borderBottom:`0.5px solid ${pgLine}`,flexShrink:0}}>
        <div style={{fontFamily:"'Italianno',cursive",fontSize:42,color:pgAccent,lineHeight:1,marginBottom:6}}>Invite to Circle</div>
        <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:pgInkSoft,fontFeatureSettings:'"opsz" 9'}}>Up to 3 people. They can add to your Muse board.</div>
      </div>

      {waLink ? (
        <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:32,gap:20}}>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:18,color:pgInk,textAlign:'center' as any,lineHeight:1.5,fontFeatureSettings:'"opsz" 9'}}>
            Invite link ready.<br/>Send it on WhatsApp.
          </div>
          <a href={waLink} target="_blank" rel="noopener noreferrer"
            style={{display:'flex',alignItems:'center',justifyContent:'center',
              padding:'12px 28px',borderRadius:4,
              background:pgAccent,color:dark?'#1A0810':'#FFFFFF',
              fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',
              textTransform:'uppercase' as any,textDecoration:'none',cursor:'pointer'}}>
            Open WhatsApp →
          </a>
          <button onClick={()=>{setWaLink(null);setInviteName('');setView('feed');}}
            style={{background:'none',border:'none',cursor:'pointer',
              fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',
              textTransform:'uppercase' as any,color:pgInkMute,padding:0}}>
            Back to Circle
          </button>
        </div>
      ) : (
        <div style={{flex:1,padding:'24px',display:'flex',flexDirection:'column',gap:20}}>
          {/* Name input */}
          <div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:pgInkMute,marginBottom:8}}>Their name</div>
            <input value={inviteName} onChange={e=>setInviteName(e.target.value)}
              placeholder="e.g. Mom, Priya, Anjali"
              style={{width:'100%',background:'transparent',border:`0.5px solid ${pgLine}`,borderRadius:4,
                padding:'12px 14px',color:pgInk,
                fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:16,
                fontFeatureSettings:'"opsz" 9',outline:'none',
                boxSizing:'border-box' as any}}/>
          </div>
          {/* Role selector */}
          <div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:pgInkMute,marginBottom:8}}>Relationship</div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {['partner','family','inner_circle'].map(r=>(
                <div key={r} onClick={()=>setInviteRole(r)}
                  style={{padding:'10px 14px',borderRadius:4,border:`0.5px solid ${inviteRole===r?pgAccent:pgLine}`,cursor:'pointer',
                    background:inviteRole===r?(dark?'rgba(196,133,106,.08)':'rgba(42,95,130,.06)'):'transparent',
                    fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:15,
                    color:inviteRole===r?pgAccent:pgInkSoft,fontFeatureSettings:'"opsz" 9'}}>
                  {ROLE_LABELS[r]}
                </div>
              ))}
            </div>
          </div>
          {/* Send button */}
          <button onClick={doInvite} disabled={!inviteName.trim()||inviting}
            style={{padding:'13px',borderRadius:4,border:'none',cursor:inviteName.trim()&&!inviting?'pointer':'default',
              background:inviteName.trim()&&!inviting?pgAccent:'rgba(128,128,128,.15)',
              color:inviteName.trim()&&!inviting?(dark?'#1A0810':'#FFFFFF'):pgInkMute,
              fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',
              textTransform:'uppercase' as any,transition:'all 200ms ease'}}>
            {inviting?'Generating link…':'Generate invite link'}
          </button>
        </div>
      )}
    </div>
  );

  // ── FEED VIEW ──
  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',background:circleBg}}>

      {/* Members row */}
      <div style={{padding:'16px 20px',borderBottom:`0.5px solid ${pgLine}`,flexShrink:0}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:pgInkMute,marginBottom:12}}>Your Circle</div>
        <div style={{display:'flex',gap:14,alignItems:'center',flexWrap:'wrap' as any}}>
          {loading?(
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:pgInkMute,letterSpacing:'.18em'}}>loading…</div>
          ):members.length===0&&pending.length===0?(
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:14,color:pgInkSoft,fontFeatureSettings:'"opsz" 9'}}>No one yet. Invite someone.</div>
          ):(
            <>
              {members.map(m=>(
                <div key={m.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  {/* Avatar circle */}
                  <div style={{width:44,height:44,borderRadius:'50%',
                    background:dark?'rgba(196,133,106,.15)':'rgba(42,95,130,.12)',
                    border:`1.5px solid ${pgAccent}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:"'Fraunces',serif",fontStyle:'italic',fontSize:18,color:pgAccent}}>
                    {(m.invitee_name||'?')[0]}
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6,letterSpacing:'.14em',textTransform:'uppercase' as any,color:pgInkMute,textAlign:'center' as any}}>
                    {m.invitee_name?.split(' ')[0]}
                  </div>
                  {/* Active candle dot */}
                  {m.status==='active'&&(
                    <div className="cf-a" style={{width:4,height:4,borderRadius:'50%',background:signal,boxShadow:`0 0 5px ${signal}`}}/>
                  )}
                </div>
              ))}
              {/* Pending invites */}
              {pending.map(p=>(
                <div key={p.id} style={{display:'flex',flexDirection:'column',alignItems:'center',gap:6}}>
                  <div style={{width:44,height:44,borderRadius:'50%',
                    border:`1.5px dashed ${pgLine}`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:pgInkMute}}>
                    ?
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6,letterSpacing:'.12em',textTransform:'uppercase' as any,color:pgInkMute,textAlign:'center' as any}}>
                    {p.invitee_name?.split(' ')[0]}
                  </div>
                  <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:5.5,color:pgInkMute,letterSpacing:'.1em',textTransform:'uppercase' as any}}>pending</div>
                </div>
              ))}
            </>
          )}
          {/* Add button */}
          {members.length < 3 && (
            <div onClick={()=>setView('invite')} style={{width:44,height:44,borderRadius:'50%',
              border:`1px dashed ${pgLine}`,
              display:'flex',alignItems:'center',justifyContent:'center',
              cursor:'pointer',WebkitTapHighlightColor:'transparent',color:pgInkMute,fontSize:20,fontWeight:200}}>
              +
            </div>
          )}
        </div>
      </div>

      {/* Activity feed */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>
        {loading?(
          <div style={{padding:32,textAlign:'center' as any,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:pgInkMute}}>loading…</div>
        ):activity.length===0?(
          <div style={{padding:'48px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <div style={{fontFamily:"'Italianno',cursive",fontSize:38,color:pgAccent,lineHeight:1,textAlign:'center' as any}}>Quiet here<br/>for now.</div>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:pgInkSoft,textAlign:'center' as any,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>When your Circle saves something<br/>or sends a message, it appears here.</div>
          </div>
        ):(
          <div>
            {activity.map(a=>(
              <div key={a.id} style={{padding:'14px 20px',borderBottom:`0.5px solid ${pgLine}`,display:'flex',gap:12,alignItems:'flex-start'}}>
                {/* Activity dot */}
                <div style={{width:7,height:7,borderRadius:'50%',background:pgAccent,flexShrink:0,marginTop:5,opacity:.7}}/>
                <div style={{flex:1}}>
                  {/* Save with image */}
                  {a.activity_type==='save_added'&&a.image_url&&(
                    <div style={{width:'100%',height:120,borderRadius:6,overflow:'hidden',marginBottom:8,background:dark?'rgba(196,133,106,.06)':'rgba(42,95,130,.06)'}}>
                      <img src={a.image_url} alt="" style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} loading="lazy"/>
                    </div>
                  )}
                  <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:pgInk,lineHeight:1.55,fontFeatureSettings:'"opsz" 9',marginBottom:4}}>
                    {a.content || formatActivityLine(a)}
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:6}}>
                    {/* Candle dot for recent activity */}
                    {Date.now()-new Date(a.created_at).getTime()<600000&&(
                      <span className="cf-a" style={{width:4,height:4,borderRadius:'50%',background:signal,boxShadow:`0 0 4px ${signal}`,flexShrink:0}}/>
                    )}
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.14em',textTransform:'uppercase' as any,color:pgInkMute}}>
                      {a.member_name||'You'} · {timeAgo(a.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Circle compose — minimal, sends to group thread */}
      <div style={{flexShrink:0,background:dark?'rgba(12,4,5,.88)':'rgba(230,232,240,.88)',
        backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',
        borderTop:`0.5px solid ${pgLine}`,
        padding:`10px 16px calc(10px + env(safe-area-inset-bottom,0px))`}}>
        <CircleCompose dark={dark} accent={pgAccent} line={pgLine} ink={pgInk} signal={signal}
          onSent={(msg)=>{
            // Optimistically append to activity feed
            const newItem={id:uid(),activity_type:'message',member_name:'You',actor_role:'bride',content:msg,created_at:new Date().toISOString(),image_url:null,caption:null,aesthetic_tags:null,save_number:null,source_type:null};
            setData(prev=>prev?{...prev,activity:[newItem,...(prev.activity||[])]}:prev);
          }}/>
      </div>
    </div>
  );
}

// ── CIRCLE COMPOSE ─────────────────────────────────────────────────────────────
interface CircleComposeProps {dark:boolean;accent:string;line:string;ink:string;signal:string;onSent:(msg:string)=>void;}
function CircleCompose({dark,accent,line,ink,onSent}:CircleComposeProps){
  const [text,   setText]   = React.useState('');
  const [sending,setSending]= React.useState(false);
  const API = process.env.NEXT_PUBLIC_API_BASE||'https://dream-os-production.up.railway.app';

  const send = async () => {
    if(!text.trim()||sending) return;
    const msg = text.trim();
    setText('');
    setSending(true);
    try {
      const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
      const s = raw ? JSON.parse(raw) : null;
      const coupleId = s?.coupleId||s?.id;
      if(coupleId) {
        await fetch(`${API}/api/v2/frost/circle/messages`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({userId:coupleId,thread_id:`circle_group`,body:msg,sender_name:'Bride'}),
        });
      }
      onSent(msg);
    } catch {}
    setSending(false);
  };

  const inputBg  = dark?'rgba(196,133,106,.05)':'rgba(42,95,130,.05)';
  const inputBdr = dark?'rgba(196,133,106,.18)':'rgba(42,95,130,.18)';

  return(
    <div style={{display:'flex',gap:8,alignItems:'center',background:inputBg,border:`0.5px solid ${inputBdr}`,borderRadius:20,padding:'7px 8px 7px 14px'}}>
      <input value={text} onChange={e=>setText(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();send();}}}
        placeholder="Say something to your circle…"
        disabled={sending}
        style={{flex:1,background:'transparent',border:'none',outline:'none',
          fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,
          color:ink,fontFeatureSettings:'"opsz" 9',userSelect:'text',WebkitUserSelect:'text'}}/>
      <button onClick={send} disabled={!text.trim()||sending}
        style={{width:30,height:30,borderRadius:'50%',background:text.trim()&&!sending?accent:'rgba(128,128,128,.12)',
          color:text.trim()&&!sending?(dark?'#1A0810':'#FFFFFF'):'rgba(128,128,128,.4)',
          border:'none',display:'flex',alignItems:'center',justifyContent:'center',cursor:text.trim()&&!sending?'pointer':'default',flexShrink:0}}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>
    </div>
  );
}

// ── MOOD DATA ─────────────────────────────────────────────────────────────────
const MOODS = [
  { key:'hopeful',         label:'Hopeful',        color:'#D4956A' },
  { key:'heavy',           label:'Heavy',           color:'#6B7FA8' },
  { key:'tender',          label:'Tender',          color:'#D4848A' },
  { key:'tired',           label:'Tired',           color:'#8A9DB5' },
  { key:'angry',           label:'Angry',           color:'#C45A4A' },
  { key:'still',           label:'Still',           color:'#E8E0D0' },
  { key:'missing-someone', label:'Missing Someone', color:'#9B8DC4' },
  { key:'proud',           label:'Proud',           color:'#C4A83A' },
  { key:'doubting',        label:'Doubting',        color:'#7A8A8A' },
  { key:'peaceful',        label:'Peaceful',        color:'#5A9E7A' },
  { key:'overwhelmed',     label:'Overwhelmed',     color:'#C4784A' },
  { key:'in-between',      label:'Inbetween',       color:'#B8B0C0' },
];

interface PageEntry { id:string; entry_date:string; mood:string; mood_color:string; body:string; created_at:string; }

interface PagesRoomProps {
  dark:boolean; accent:string; signal:string;
  roomInk:string; roomInkSoft:string; roomInkMute:string; roomLine:string;
}

type PagesView = 'list' | 'picker' | 'writing';

function PagesRoom({ dark, accent, signal, roomInk, roomInkSoft, roomInkMute, roomLine }: PagesRoomProps) {
  const [view,         setView]         = React.useState<PagesView>('list');
  const [entries,      setEntries]      = React.useState<PageEntry[]>([]);
  const [loading,      setLoading]      = React.useState(true);
  const [selectedMood, setSelectedMood] = React.useState<typeof MOODS[0]|null>(null);
  const [body,         setBody]         = React.useState('');
  const [saving,       setSaving]       = React.useState(false);
  const textRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(()=>{
    const load = async () => {
      try {
        const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
        if(!raw) return;
        const s = JSON.parse(raw);
        const coupleId = s?.coupleId||s?.id;
        // Token: check standalone key first (real brides), fall back to session object (demo)
        const token = localStorage.getItem('access_token')||s?.token||s?.access_token;
        if(!coupleId||!token) return;
        const API = process.env.NEXT_PUBLIC_API_BASE||'https://dream-os-production.up.railway.app';
        const res = await fetch(`${API}/api/v2/couple/pages/${coupleId}?limit=50`,{headers:{Authorization:`Bearer ${token}`}});
        if(!res.ok) return;
        const data = await res.json();
        setEntries(data.entries||[]);
      } catch(e){ console.error(e); }
      finally{ setLoading(false); }
    };
    load();
  },[]);

  React.useEffect(()=>{
    if(!textRef.current) return;
    textRef.current.style.height='auto';
    textRef.current.style.height=textRef.current.scrollHeight+'px';
  },[body]);

  const saveEntry = async () => {
    if(!selectedMood||!body.trim()||saving) return;
    setSaving(true);
    try {
      const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
      if(!raw) return;
      const s = JSON.parse(raw);
      const token = localStorage.getItem('access_token')||s?.token||s?.access_token;
      if(!token) return;
      const API = process.env.NEXT_PUBLIC_API_BASE||'https://dream-os-production.up.railway.app';
      const res = await fetch(`${API}/api/v2/couple/pages`,{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},
        body:JSON.stringify({mood:selectedMood.key,mood_color:selectedMood.color,body:body.trim()}),
      });
      if(!res.ok) throw new Error('save failed');
      const data = await res.json();
      setEntries(prev=>[data.entry,...prev]);
      setView('list');
      setSelectedMood(null);
      setBody('');
    } catch(e){ console.error(e); }
    finally{ setSaving(false); }
  };

  // Background — light mode gets the blue-grey gradient, dark gets wine-black
  const pageBg = dark
    ? 'radial-gradient(ellipse 110% 55% at 50% -5%,rgba(196,133,106,.16) 0%,transparent 52%),radial-gradient(ellipse 70% 60% at 90% 110%,rgba(40,5,12,.80) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 5% 100%,rgba(60,8,20,.70) 0%,transparent 50%),linear-gradient(180deg,#1A0A0E 0%,#0E0506 40%,#080204 70%,#0C0408 100%)'
    : 'radial-gradient(ellipse 110% 50% at 60% -5%,rgba(74,122,155,.24) 0%,transparent 55%),radial-gradient(ellipse 70% 50% at 10% 110%,rgba(42,95,130,.16) 0%,transparent 55%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 30%,#D8DEEC 60%,#CDD4E8 100%)';

  // Ink in light mode — deep navy on the blue-grey surface
  const pgInk     = dark ? '#F5E5DC' : '#0C1830';
  const pgInkSoft = dark ? 'rgba(245,229,220,.70)' : 'rgba(12,24,48,.65)';
  const pgInkMute = dark ? 'rgba(196,133,106,.45)' : 'rgba(42,80,130,.50)';
  const pgLine    = dark ? 'rgba(196,133,106,.14)' : 'rgba(42,80,130,.18)';
  const pgAccent  = dark ? '#C4856A' : '#2A5F82';

  // ── LIST VIEW ──
  if(view==='list') return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',background:pageBg}}>
      {/* Poetry line */}
      <div style={{padding:'20px 24px 14px',borderBottom:`0.5px solid ${pgLine}`,flexShrink:0}}>
        <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:pgAccent,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>
          "Everything you love about flowers is also true of weddings."
        </div>
      </div>
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any}}>
        {loading?(
          <div style={{padding:32,textAlign:'center',fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.28em',textTransform:'uppercase' as any,color:pgInkMute}}>loading…</div>
        ):entries.length===0?(
          <div style={{padding:'64px 24px',display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
            <div style={{fontFamily:"'Italianno',cursive",fontSize:42,color:pgAccent,lineHeight:1}}>Today</div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.28em',textTransform:'uppercase' as any,color:pgInkMute,textAlign:'center' as any}}>Tap below to begin today's page</div>
          </div>
        ):(
          <div>
            {entries.map((entry)=>{
              const mood = MOODS.find(m=>m.key===entry.mood);
              const d = new Date(entry.created_at);
              const dateStr = d.toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'});
              return(
                <div key={entry.id} style={{padding:'16px 24px',borderBottom:`0.5px solid ${pgLine}`,display:'flex',gap:0}}>
                  {/* Journal margin rule — mood color */}
                  <div style={{width:1.5,background:`${mood?.color||entry.mood_color}`,opacity:.6,flexShrink:0,marginRight:16,borderRadius:1}}/>
                  <div style={{flex:1,display:'flex',flexDirection:'column',gap:6}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <span style={{width:6,height:6,borderRadius:'50%',background:mood?.color||entry.mood_color,flexShrink:0}}/>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.2em',textTransform:'uppercase' as any,color:pgInkMute}}>{mood?.label||entry.mood}</span>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,color:pgInkMute,marginLeft:'auto'}}>{dateStr}</span>
                    </div>
                    <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,color:pgInk,lineHeight:1.65,fontFeatureSettings:'"opsz" 9'}}>
                      {entry.body}
                    </div>
                  </div>
                </div>
              );
            })}
            <div style={{padding:'24px',textAlign:'center' as any}}>
              <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:pgInkMute,fontFeatureSettings:'"opsz" 9'}}>another page?</div>
            </div>
          </div>
        )}
      </div>
      {/* CTA */}
      <div onClick={()=>setView('picker')} style={{flexShrink:0,borderTop:`0.5px solid ${pgLine}`,padding:'16px 24px',cursor:'pointer',WebkitTapHighlightColor:'transparent',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{fontFamily:"'Italianno',cursive",fontSize:30,color:pgAccent,lineHeight:1}}>How are you feeling?</div>
      </div>
    </div>
  );

  // ── MOOD PICKER VIEW ──
  // Exact reference: "How are you feeling?" large Italianno at top, date, then 12 dots centered
  if(view==='picker') return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',background:pageBg}}>
      {/* Centered content — vertically centered in available space */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,
        display:'flex',flexDirection:'column',justifyContent:'center',padding:'32px 24px'}}>
        {/* "How are you feeling?" — Italianno, large, exactly as reference */}
        <div style={{marginBottom:6}}>
          <div style={{fontFamily:"'Italianno',cursive",fontSize:44,color:pgInk,lineHeight:1,marginBottom:6}}>
            How are you feeling?
          </div>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:pgInkSoft,fontFeatureSettings:'"opsz" 9'}}>
            {new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}
          </div>
        </div>

        {/* 12 dots — 4 col grid, centered, medium size matching reference */}
        <div style={{marginTop:36,display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'28px 8px',justifyItems:'center'}}>
          {MOODS.map(mood=>(
            <div key={mood.key} onClick={()=>{setSelectedMood(mood);setView('writing');}}
              style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,cursor:'pointer',WebkitTapHighlightColor:'transparent',width:'100%'}}>
              {/* Dot — 40px matching reference screenshot size */}
              <div style={{
                width:40,height:40,borderRadius:'50%',
                background:mood.color,
                flexShrink:0,
              }}/>
              <div style={{
                fontFamily:"'JetBrains Mono',monospace",
                fontSize:6.5,letterSpacing:'.14em',
                textTransform:'uppercase' as any,
                color:pgInkMute,
                textAlign:'center' as any,
                lineHeight:1.3,
              }}>
                {mood.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ── WRITING VIEW ──
  // Exact reference: top bar DISCARD · ● MOOD · SAVE, date, left journal rule, large text
  return (
    <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',background:pageBg}}>
      {/* Top action bar — exactly as reference */}
      <div style={{padding:'14px 20px',borderBottom:`0.5px solid ${pgLine}`,display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
        <button onClick={()=>{setSelectedMood(null);setView('picker');}}
          style={{background:'none',border:'none',cursor:'pointer',padding:0,
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.2em',
            textTransform:'uppercase' as any,color:pgInkMute,display:'flex',alignItems:'center',gap:5}}>
          ← Discard
        </button>
        {/* Center mood indicator */}
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <span style={{width:7,height:7,borderRadius:'50%',background:selectedMood?.color,flexShrink:0}}/>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.2em',textTransform:'uppercase' as any,color:selectedMood?.color}}>{selectedMood?.label}</span>
        </div>
        <button onClick={saveEntry} disabled={!body.trim()||saving}
          style={{background:'none',border:'none',cursor:body.trim()&&!saving?'pointer':'default',padding:0,
            fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.2em',
            textTransform:'uppercase' as any,
            color:body.trim()&&!saving?pgAccent:pgInkMute}}>
          Save →
        </button>
      </div>

      {/* Date line */}
      <div style={{padding:'16px 24px 8px',flexShrink:0}}>
        <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:pgInkSoft,fontFeatureSettings:'"opsz" 9'}}>
          {new Date().toLocaleDateString('en-IN',{weekday:'long',day:undefined as any,month:'long',year:'numeric'})}
        </div>
      </div>

      {/* Journal area — left rule + writing surface */}
      <div style={{flex:1,display:'flex',overflowY:'auto'}} className="no-scroll">
        {/* Left journal rule — thin vertical line, mood color */}
        <div style={{
          width:1,
          background:selectedMood?.color||pgAccent,
          opacity:.55,
          flexShrink:0,
          marginLeft:24,
          marginTop:4,
          marginBottom:24,
          borderRadius:1,
        }}/>
        {/* Writing surface */}
        <div style={{flex:1,padding:'4px 20px 48px 14px'}}>
          <textarea
            ref={textRef}
            value={body}
            onChange={e=>setBody(e.target.value)}
            placeholder="Write here…"
            autoFocus
            style={{
              width:'100%',
              minHeight:300,
              background:'transparent',
              border:'none',outline:'none',
              color:pgInk,
              fontFamily:"'Fraunces',serif",
              fontStyle:'italic',fontWeight:300,
              fontSize:18,lineHeight:1.8,
              resize:'none',
              fontFeatureSettings:'"opsz" 9',
              userSelect:'text',WebkitUserSelect:'text' as any,
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ── MOMENTS ROOM ──────────────────────────────────────────────────────────────
// Ornament string — photo thumbnails hanging off a vertical line.
// Left: thumbnail (56×56, tappable → full bleed).
// Right: date + day count + caption.
// Full-bleed on tap. Circle badge when contributed by a member.
// Caption: auto-generated by Vision→Haiku on WhatsApp forwards.

interface MomentPhoto { id:string; save_number:number; image_url:string; caption?:string|null; saved_by_role:string; created_at:string; }

interface MomentsRoomProps { dark:boolean; accent:string; }

function MomentsRoom({ dark, accent }: MomentsRoomProps) {
  const [moments,   setMoments]   = React.useState<MomentPhoto[]>([]);
  const [loading,   setLoading]   = React.useState(true);
  const [fullImg,   setFullImg]   = React.useState<string|null>(null);
  const [uploading, setUploading] = React.useState(false);
  const [toast,     setToast]     = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);
  const API = process.env.NEXT_PUBLIC_API_BASE||'https://dream-os-production.up.railway.app';

  const showToast = (msg:string) => { setToast(msg); setTimeout(()=>setToast(''),2500); };

  // Get days at the time a moment was created
  function daysAtCapture(iso:string, weddingIso:string|null):string|null {
    if(!weddingIso) return null;
    const wedding = new Date(weddingIso).getTime();
    const saved   = new Date(iso).getTime();
    const diff    = Math.round((wedding - saved) / 86400000);
    if(diff < 0)  return 'After the wedding';
    if(diff === 0) return 'Wedding day';
    return `Day ${diff}`;
  }

  const weddingIso = React.useMemo(()=>{
    try {
      const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
      if(raw) { const s=JSON.parse(raw); return s?.wedding_date||null; }
    } catch {} return null;
  },[]);

  React.useEffect(()=>{
    const load = async () => {
      try {
        const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
        if(!raw){setLoading(false);return;}
        const s = JSON.parse(raw);
        const coupleId = s?.coupleId||s?.id;
        const token = localStorage.getItem('access_token')||s?.token||s?.access_token;
        if(!coupleId||!token){setLoading(false);return;}
        const res = await fetch(`${API}/api/v2/couple/moments/${coupleId}`,{headers:{Authorization:`Bearer ${token}`}});
        if(!res.ok){setLoading(false);return;}
        const data = await res.json();
        setMoments(data.moments||[]);
      } catch(e){ console.error(e); }
      finally{ setLoading(false); }
    };
    load();
  },[]);

  const handleFiles = async (e:React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files||[]).filter((f:File)=>f.type.startsWith('image/')) as File[];
    if(!files.length) return;
    setUploading(true);
    const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
    if(!raw){showToast('Please log in to add moments.');setUploading(false);return;}
    const s = JSON.parse(raw);
    const token = localStorage.getItem('access_token')||s?.token||s?.access_token;
    if(!token){showToast('Session expired.');setUploading(false);return;}
    let added = 0;
    for(const file of files){
      try {
        const b64 = await new Promise<string>((res,rej)=>{
          const r=new FileReader(); r.onload=()=>res((r.result as string).split(',')[1]); r.onerror=rej; r.readAsDataURL(file);
        });
        const resp = await fetch(`${API}/api/v2/couple/muse/upload`,{
          method:'POST',
          headers:{'Authorization':`Bearer ${token}`,'Content-Type':'application/json'},
          body:JSON.stringify({image_base64:b64,mime_type:file.type,surface:'moments'}),
        });
        const data = await resp.json();
        if(data.ok&&data.save){ setMoments(prev=>[data.save,...prev]); added++; }
      } catch{}
    }
    if(fileRef.current) fileRef.current.value='';
    setUploading(false);
    showToast(added===0?'Could not add. Try again.':added===1?'Moment saved.':`${added} moments saved.`);
  };

  function fmtDate(iso:string):string {
    return new Date(iso).toLocaleDateString('en-IN',{day:'numeric',month:'short'});
  }

  const ink     = '#F0EDE8';
  const inkMute = 'rgba(240,237,232,.35)';
  const line    = 'rgba(240,237,232,.08)';
  const accent2 = '#C4856A';

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:'#080608',position:'relative',overflow:'hidden'}}>
      {toast&&<div style={{position:'fixed',top:'calc(env(safe-area-inset-top,0px)+16px)',left:'50%',transform:'translateX(-50%)',background:'rgba(240,237,232,.95)',color:'#080608',fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.18em',textTransform:'uppercase' as any,padding:'8px 18px',borderRadius:20,zIndex:400,pointerEvents:'none',whiteSpace:'nowrap'}}>{toast}</div>}

      {/* Full-screen viewer */}
      {fullImg&&<div onClick={()=>setFullImg(null)} style={{position:'fixed',inset:0,background:'rgba(0,0,0,.96)',zIndex:500,display:'flex',alignItems:'center',justifyContent:'center'}}>
        <img src={fullImg} alt="" style={{maxWidth:'96vw',maxHeight:'92vh',objectFit:'contain',borderRadius:4}}/>
        <button onClick={()=>setFullImg(null)} style={{position:'absolute',top:24,right:20,background:'rgba(240,237,232,.12)',border:'none',borderRadius:20,width:36,height:36,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',color:'rgba(240,237,232,.8)',fontSize:18}}>✕</button>
      </div>}

      {/* Header */}
      <div style={{padding:'20px 18px 12px',flexShrink:0,display:'flex',alignItems:'flex-end',justifyContent:'space-between',borderBottom:`0.5px solid ${line}`}}>
        <div>
          <div style={{fontFamily:"'Italianno',cursive",fontSize:36,color:ink,lineHeight:1,marginBottom:2}}>Moments</div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute}}>{loading?'loading…':`${moments.length} saved`}</div>
        </div>
        <button onClick={()=>fileRef.current?.click()} disabled={uploading}
          style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:100,
            border:`0.5px solid ${accent2}44`,background:`${accent2}12`,
            fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,letterSpacing:'.18em',
            textTransform:'uppercase' as any,color:accent2,cursor:'pointer',opacity:uploading?.5:1}}>
          {uploading?'Adding…':'+ Add'}
        </button>
      </div>

      {/* Ornament string */}
      <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,padding:'20px 0 16px',position:'relative'}}>

        {/* The string */}
        {moments.length>0&&<div style={{position:'absolute',left:82,top:20,bottom:40,width:.5,
          background:`linear-gradient(180deg,transparent 0%,${accent2}55 4%,${accent2}55 96%,transparent 100%)`,
          pointerEvents:'none',zIndex:1}}/>}

        {loading&&<div style={{padding:48,textAlign:'center' as any,fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.22em',textTransform:'uppercase' as any,color:inkMute}}>loading…</div>}

        {!loading&&moments.length===0&&(
          <div style={{padding:'48px 28px',display:'flex',flexDirection:'column',alignItems:'center',gap:16,textAlign:'center' as any}}>
            <div style={{fontFamily:"'Italianno',cursive",fontSize:40,color:accent2,lineHeight:1}}>Nothing yet.</div>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:'rgba(240,237,232,.5)',lineHeight:1.7,maxWidth:280,fontFeatureSettings:'"opsz" 9'}}>
              Your first photo becomes Day One. The brunch with the girls, the trial day, the shopping chaos — they all live here.
            </div>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginTop:4}}>WhatsApp moments — coming soon</div>
            <button onClick={()=>fileRef.current?.click()}
              style={{marginTop:8,padding:'12px 28px',borderRadius:100,background:accent2,border:'none',
                fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.22em',
                textTransform:'uppercase' as any,color:'#0C0A09',cursor:'pointer'}}>
              Add from camera roll
            </button>
          </div>
        )}

        {moments.map((m,i)=>{
          const isFirst = i===0;
          const dayLabel = daysAtCapture(m.created_at, weddingIso);
          return (
            <div key={m.id} style={{display:'flex',alignItems:'flex-start',marginBottom:22,position:'relative',zIndex:2}}>
              {/* Thumbnail — left of string */}
              <div style={{width:82,flexShrink:0,display:'flex',justifyContent:'flex-end',paddingRight:16}}>
                <div onClick={()=>setFullImg(m.image_url)}
                  style={{width:54,height:54,borderRadius:8,overflow:'hidden',cursor:'zoom-in',
                    border:`.5px solid ${isFirst?accent2:'rgba(240,237,232,.08)'}`,
                    boxShadow:isFirst?`0 0 12px ${accent2}44`:'none',
                    background:'#1a1714',flexShrink:0}}>
                  <img src={m.image_url} alt={m.caption||''} style={{width:'100%',height:'100%',objectFit:'cover',display:'block'}} loading="lazy"/>
                </div>
                {/* Connector to string */}
                <div style={{position:'absolute',left:82,top:27,width:14,height:.5,background:`${accent2}55`}}/>
              </div>

              {/* Dot on string */}
              <div style={{position:'absolute',left:82,top:27,width:7,height:7,borderRadius:'50%',
                background:isFirst?accent2:'#080608',
                border:`0.5px solid ${isFirst?accent2:accent2+'55'}`,
                boxShadow:isFirst?`0 0 8px ${accent2}66`:'none',
                transform:'translateX(-3.5px)',zIndex:3}}/>

              {/* Meta — right of string */}
              <div style={{flex:1,paddingLeft:18,paddingTop:2}}>
                <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.16em',textTransform:'uppercase' as any,color:isFirst?accent2:inkMute}}>
                    {fmtDate(m.created_at)}{dayLabel?` · ${dayLabel}`:''}
                  </span>
                  {m.saved_by_role==='circle_member'&&(
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:5.5,letterSpacing:'.12em',textTransform:'uppercase' as any,color:accent2,border:`0.5px solid ${accent2}44`,borderRadius:3,padding:'1px 5px'}}>Circle</span>
                  )}
                </div>
                {m.caption&&<div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:12,color:'rgba(240,237,232,.6)',lineHeight:1.55,fontFeatureSettings:'"opsz" 9'}}>{m.caption}</div>}
              </div>
            </div>
          );
        })}

        {!loading&&moments.length>0&&(
          <div style={{padding:'8px 18px 8px 100px',textAlign:'left' as any}}>
            <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute}}>WhatsApp moments — coming soon</div>
          </div>
        )}

        {/* Bottom vignette */}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:60,background:'linear-gradient(transparent,rgba(8,6,8,.8))',pointerEvents:'none'}}/>
        <div style={{height:20}}/>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{display:'none'}}/>
    </div>
  );
}


// ── MERIDIAN CONCIERGE BUTTON ────────────────────────────────────────────────
// Throbbing heartbeat line — same pulse as Discover peek nav.
// Taps → fires POST /couple/concierge/request → admin gets WA notification.
// All brides, no gate.

interface MeridianConciergeBtnProps { accent:string; dark:boolean; }

function MeridianConciergeBtn({ accent, dark }: MeridianConciergeBtnProps) {
  const [state, setState] = React.useState<'idle'|'sending'|'sent'|'error'>('idle');
  const API = process.env.NEXT_PUBLIC_API_BASE||'https://dream-os-production.up.railway.app';

  const request = async () => {
    if(state==='sending'||state==='sent') return;
    setState('sending');
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`${API}/api/v2/couple/concierge/request`,{
        method:'POST',
        headers:{'Authorization':`Bearer ${token||''}`,'Content-Type':'application/json'},
        body:'{}',
      });
      const data = await res.json();
      if(data.ok) {
        setState('sent');
      } else {
        setState('error');
        setTimeout(()=>setState('idle'), 3000);
      }
    } catch {
      setState('error');
      setTimeout(()=>setState('idle'), 3000);
    }
  };

  const ink     = '#F0EDE8';
  const inkMute = 'rgba(240,237,232,.35)';
  const line    = 'rgba(240,237,232,.08)';

  return (
    <div style={{padding:'0 20px 4px'}}>
      <style>{`
        @keyframes concPulse {
          0%,100% { opacity:0.5; box-shadow:0 0 6px ${accent}44; }
          50%      { opacity:1;   box-shadow:0 0 18px ${accent}88; }
        }
      `}</style>

      {state==='sent' ? (
        <div style={{padding:'16px 20px',borderRadius:10,background:`${accent}10`,border:`0.5px solid ${accent}33`,textAlign:'center' as any}}>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:ink,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>
            Our concierge will reach you at the earliest.
          </div>
        </div>
      ) : (
        <div onClick={request} style={{cursor:'pointer',WebkitTapHighlightColor:'transparent',padding:'14px 0',display:'flex',flexDirection:'column',alignItems:'center',gap:10}}>
          {/* Heartbeat line */}
          <div style={{
            width:'72%',height:3,borderRadius:2,
            background:`linear-gradient(90deg, transparent 0%, ${accent} 20%, ${accent} 80%, transparent 100%)`,
            animation:state==='sending'?'none':'concPulse 2.8s ease-in-out infinite',
            opacity:state==='sending'?.4:1,
            transition:'opacity 200ms ease',
          }}/>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7.5,letterSpacing:'.22em',textTransform:'uppercase' as any,color:state==='error'?'rgba(220,80,70,.8)':accent}}>
            {state==='sending'?'Reaching out…':state==='error'?'Try again':'Ask a Personal Concierge'}
          </div>
        </div>
      )}
    </div>
  );
}

// ── MERIDIAN ROOM ─────────────────────────────────────────────────────────────
// Personal concierge — skin, mind, body, decisions.
// Always dark. Separate from DreamAi — different context, different persona.
// V1: AI only (Haiku). V2: AI + human escalation (Platinum tier).

interface MeridianMsg { id:string; role:'user'|'assistant'; content:string; pending?:boolean; error?:boolean; }

// Editorial cards — static content keyed to days remaining
function getMeridianCards(days:number|null): {title:string;body:string;tag:string}[] {
  if(days===null||days>180) return [
    { title:'The 180-day window.',       tag:'skin',  body:'This is the time to audit. See your dermatologist. Start with basics — SPF, Vitamin C, retinol at night. The work you do now shows on your wedding day.' },
    { title:'Ubtan. Every week.',        tag:'ritual',body:'Rice flour, turmeric, raw milk. Apply and leave for 20 minutes. Your skin has time to adapt and reward you. Make it a ritual, not a task.' },
    { title:'Water before everything.', tag:'body',  body:'Three litres a day. Not juice. Not chai. Water. The simplest thing nobody does consistently. Start now when the stakes are low.' },
  ];
  if(days>90) return [
    { title:'The glow is built now.',   tag:'skin',  body:'If you have not started hair oiling, start this week. Coconut or Bhringraj, overnight, twice a week. The difference by the wedding day is real.' },
    { title:'Skin cycle locked.',       tag:'skin',  body:'Stop experimenting with new products. You should know what works for your skin by now. Maintain, don’t explore.' },
    { title:'The sleep question.',      tag:'mind',  body:'Seven hours is not negotiable. Cortisol from poor sleep undoes every facial. Your skin repairs at night. Protect that window.' },
  ];
  if(days>60) return [
    { title:'No new treatments.',       tag:'skin',  body:'This is not the time for a new peel or a new serum. What you have been doing is working. Protect the progress.' },
    { title:'Trial week ritual.',       tag:'ritual',body:'The week before your mehendi trial — no facials, no threading, nothing that causes redness. Let your skin rest and show up calm.' },
    { title:'Breathe before deciding.', tag:'mind',  body:'Every decision feels enormous right now. Most are not. When you feel overwhelmed, give it 24 hours before acting.' },
  ];
  if(days>30) return [
    { title:'Final stretch.',           tag:'skin',  body:'Hydration, sleep, and your existing routine. That is the entire protocol. Nothing new touches your face this month.' },
    { title:'The anxiety is normal.',   tag:'mind',  body:'Every bride feels it. The chaos is not a sign things are going wrong. It is the sign that something beautiful is coming.' },
    { title:'Eat properly.',            tag:'body',  body:'Not a diet. Not a restriction. Eat for energy — protein, good fats, vegetables. You need strength for the days ahead.' },
  ];
  return [
    { title:'You are almost there.',    tag:'mind',  body:'This week — sleep. Hydrate. Do not start anything new. Let the people who love you carry things. Your job is to arrive glowing.' },
    { title:'The morning ritual.',      tag:'skin',  body:'Gentle cleanser, Vitamin C, SPF. That is it. No masks, no peels, no experiments. Simple, consistent, protected.' },
    { title:'One thing at a time.',     tag:'mind',  body:'Whatever feels urgent right now — give it one decision at a time. You have handled everything so far. You will handle this too.' },
  ];
}

interface MeridianRoomProps { dark:boolean; accent:string; }

function MeridianRoom({ accent, dark }: MeridianRoomProps) {
  const [msgs,    setMsgs]    = React.useState<MeridianMsg[]>([]);
  const [input,   setInput]   = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [days,    setDays]    = React.useState<number|null>(null);
  const scrollRef  = React.useRef<HTMLDivElement>(null);
  const textRef    = React.useRef<HTMLTextAreaElement>(null);
  const cancelRef  = React.useRef<(()=>void)|null>(null);

  const API = process.env.NEXT_PUBLIC_API_BASE||'https://dream-os-production.up.railway.app';
  const cards = getMeridianCards(days);

  React.useEffect(()=>{
    try {
      const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
      if(raw){const s=JSON.parse(raw);if(s?.wedding_date){const d=Math.max(0,Math.round((new Date(s.wedding_date).getTime()-Date.now())/86400000));setDays(d);}}
    } catch{}
  },[]);

  React.useEffect(()=>{ if(scrollRef.current) scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[msgs]);
  React.useEffect(()=>{ if(!textRef.current)return;textRef.current.style.height='auto';textRef.current.style.height=Math.min(textRef.current.scrollHeight,100)+'px'; },[input]);
  React.useEffect(()=>()=>{cancelRef.current?.();},[]);

  function uid(){return Math.random().toString(36).slice(2);}

  const send = React.useCallback((text:string)=>{
    const msg = text.trim();
    if(!msg||loading)return;
    setInput('');
    const userMsg:MeridianMsg = {id:uid(),role:'user',content:msg};
    setMsgs(prev=>[...prev,userMsg]);
    setLoading(true);
    const aiId = uid();
    setMsgs(prev=>[...prev,{id:aiId,role:'assistant',content:'',pending:true}]);

    const raw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
    const token = localStorage.getItem('access_token')||(raw?JSON.parse(raw)?.access_token:null);

    const ctrl = new AbortController();
    cancelRef.current = ()=>ctrl.abort();

    fetch(`${API}/api/v2/couple/meridian/chat`,{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token||''}`},
      body:JSON.stringify({message:msg}),
      signal:ctrl.signal,
    }).then(res=>{
      if(!res.body)throw new Error('no body');
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      const pump = async () => {
        while(true){
          const {done,value} = await reader.read();
          if(done)break;
          buf += decoder.decode(value,{stream:true});
          const lines = buf.split('\n');
          buf = lines.pop()||'';
          for(const line of lines){
            if(!line.startsWith('data:'))continue;
            const raw2 = line.slice(5).trim();
            if(raw2==='[DONE]')break;
            try{
              const ev = JSON.parse(raw2);
              if(ev.type==='text_delta'){
                setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,content:m.content+ev.text,pending:false}:m));
              } else if(ev.type==='done'||ev.type==='error'){
                if(ev.type==='error') setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,content:ev.text||'Something went wrong.',error:true,pending:false}:m));
              }
            }catch{}
          }
        }
      };
      return pump();
    }).catch(err=>{
      if(err.name!=='AbortError') setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,content:'Something went wrong. Try again.',error:true,pending:false}:m));
    }).finally(()=>{
      setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,pending:false}:m));
      setLoading(false);
      cancelRef.current=null;
    });
  },[loading,API]);

  const ink      = '#F0EDE8';
  const inkSoft  = 'rgba(240,237,232,.70)';
  const inkMute  = 'rgba(240,237,232,.35)';
  const line     = 'rgba(240,237,232,.08)';
  const cardBg   = 'rgba(240,237,232,.04)';
  const cardBdr  = 'rgba(240,237,232,.10)';
  const inputBg  = 'rgba(240,237,232,.05)';
  const inputBdr = 'rgba(240,237,232,.16)';
  const compBg   = 'rgba(8,6,8,.90)';
  const aiBubble = 'rgba(240,237,232,.05)';
  const aiBubBdr = 'rgba(240,237,232,.10)';

  const tagColors:{[k:string]:string} = {skin:'#C4856A',ritual:'#C9A84C',body:'#6B9E8F',mind:'#8B7EC4'};

  return (
    <div style={{flex:1,display:'flex',flexDirection:'column',background:'linear-gradient(180deg,#0E0608 0%,#080608 100%)',overflow:'hidden'}}>

      {/* Editorial cards */}
      {msgs.length===0&&(
        <>
          {/* Header */}
          <div style={{padding:'20px 20px 14px',borderBottom:`0.5px solid ${line}`,flexShrink:0}}>
            <div style={{fontFamily:"'Italianno',cursive",fontSize:38,color:ink,lineHeight:1,marginBottom:4}}>Meridian</div>
            <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>
              Your personal concierge. Skin, mind, body, decisions.
            </div>
            {days!==null&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',textTransform:'uppercase' as any,color:accent,marginTop:6}}>
              {days} days to go
            </div>}
          </div>

          {/* Scrollable cards */}
          <div className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,padding:'16px 0'}}>
            {cards.map((card,i)=>(
              <div key={i} style={{margin:'0 16px 12px',padding:'16px 18px',borderRadius:10,background:cardBg,border:`0.5px solid ${cardBdr}`}}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.18em',textTransform:'uppercase' as any,color:tagColors[card.tag]||accent,border:`0.5px solid ${(tagColors[card.tag]||accent)}44`,borderRadius:4,padding:'2px 7px'}}>
                    {card.tag}
                  </span>
                </div>
                <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:17,color:ink,lineHeight:1.2,marginBottom:8,fontFeatureSettings:'"opsz" 9'}}>{card.title}</div>
                <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,color:inkSoft,lineHeight:1.7,fontFeatureSettings:'"opsz" 9'}}>{card.body}</div>
              </div>
            ))}

            {/* Prompt to start */}
            <div style={{padding:'20px 20px 8px',textAlign:'center' as any}}>
              <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:inkMute,lineHeight:1.6,fontFeatureSettings:'"opsz" 9'}}>
                Tell me what’s on your mind.
              </div>
            </div>

            {/* Concierge heartbeat button */}
            <MeridianConciergeBtn accent={accent} dark={dark}/>

            <div style={{height:80}}/>
          </div>
        </>
      )}

      {/* Chat history */}
      {msgs.length>0&&(
        <div ref={scrollRef} className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,padding:'16px 16px 8px'}}>
          {msgs.map(m=>(
            <div key={m.id} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start',marginBottom:10}}>
              {m.role==='user'?(
                <div style={{maxWidth:'82%',background:accent,color:'#0C0A09',padding:'10px 14px',borderRadius:'20px 20px 4px 20px',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,lineHeight:1.55,fontFeatureSettings:'"opsz" 9',userSelect:'text' as any}}>
                  {m.content}
                </div>
              ):m.pending&&m.content===''?(
                <div style={{background:aiBubble,border:`0.5px solid ${aiBubBdr}`,padding:'10px 16px',borderRadius:'20px 20px 20px 4px',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)'}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase' as any,color:accent,animation:'dpulse 1.4s infinite ease-in-out'}}>✦</span>
                </div>
              ):(
                <div style={{maxWidth:'90%',background:aiBubble,border:`0.5px solid ${aiBubBdr}`,padding:'12px 16px',borderRadius:'20px 20px 20px 4px',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,lineHeight:1.65,color:m.error?'#C4534A':ink,whiteSpace:'pre-wrap',fontFeatureSettings:'"opsz" 9',userSelect:'text' as any}}>
                  {m.content}
                  {m.pending&&<span style={{opacity:.5,color:accent}}>▌</span>}
                </div>
              )}
            </div>
          ))}
          <div style={{height:10}}/>
        </div>
      )}

      {/* Compose */}
      <div style={{background:compBg,backdropFilter:'blur(22px) saturate(1.1)',WebkitBackdropFilter:'blur(22px) saturate(1.1)',borderTop:`0.5px solid ${line}`,padding:`12px 16px calc(12px + env(safe-area-inset-bottom,0px))`,flexShrink:0}}>
        <div style={{display:'flex',gap:10,alignItems:'flex-end',background:inputBg,border:`0.5px solid ${inputBdr}`,borderRadius:20,padding:'8px 10px 8px 16px'}}>
          <textarea ref={textRef} value={input} onChange={e=>setInput(e.target.value)}
            onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();send(input);}}}
            placeholder="Tell me what's troubling you, or what you need…"
            disabled={loading} rows={1}
            style={{flex:1,background:'transparent',border:'none',outline:'none',color:ink,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,resize:'none',maxHeight:100,lineHeight:1.5,fontFeatureSettings:'"opsz" 9',userSelect:'text',WebkitUserSelect:'text' as any}}/>
          <button onClick={()=>send(input)} disabled={loading||!input.trim()}
            style={{background:input.trim()&&!loading?accent:'rgba(240,237,232,.08)',color:input.trim()&&!loading?'#0C0A09':'rgba(240,237,232,.3)',border:'none',borderRadius:'50%',width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:input.trim()&&!loading?'pointer':'default',transition:'background 200ms ease',flexShrink:0}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13M22 2L15 22l-4-9-9-4 20-7z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </button>
        </div>
        {msgs.length>0&&<div style={{textAlign:'center' as any,marginTop:6}}>
          <button onClick={()=>{cancelRef.current?.();setMsgs([]);setLoading(false);}} style={{background:'none',border:'none',cursor:'pointer',fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.18em',textTransform:'uppercase' as any,color:inkMute,padding:0}}>
            Clear
          </button>
        </div>}
      </div>
    </div>
  );
}


// ── Root component ────────────────────────────────────────────────────────────


export default function SanctuaryPage() {
  const { homeMode, setHomeMode } = useFrostMode();
  const dark = homeMode === 'E1A';

  // Sanctuary data
  const [days,       setDays]       = useState(176);
  const [progress,   setProgress]   = useState(.38);
  const [name,       setName]       = useState('Priya');
  const [proseLine,  setProseLine]  = useState('');
  const [poetry,     setPoetry]     = useState('');
  const [sinceYes,   setSinceYes]   = useState(47);
  // Live hints from backend — fetched on mount
  const [circleHint,  setCircleHint]  = useState('quiet');
  const [museHint,    setMuseHint]    = useState('');
  const [peopleHint,  setPeopleHint]  = useState('');
  const [pagesHint,   setPagesHint]   = useState('a page is waiting');
  const [eventsHint,  setEventsHint]  = useState('Your timeline');
  const [expensesHint,setExpensesHint]= useState('');
  const [vendorsHint, setVendorsHint] = useState('');
  const [weekday,    setWeekday]    = useState('Wednesday morning');
  const [dateStamp,  setDateStamp]  = useState('');

  // Bloom state
  const [activeRoom, setActiveRoom]   = useState<RoomKey>(null);
  const [blooming,   setBlooming]     = useState(false);
  const [closing,    setClosing]      = useState(false);
  const touchStartY = useRef(0);
  const bloomRef    = useRef<HTMLDivElement>(null);

  // Block pull-to-refresh inside bloom rooms ONLY when:
  // 1. A room is open AND
  // 2. The touch target is not inside a scrollable child that has scroll room
  // This allows Muse/Dream/Circle content to scroll normally.
  useEffect(()=>{
    const el = bloomRef.current;
    if(!el || !activeRoom) return;
    let startY = 0;
    const onStart = (e: TouchEvent) => { startY = e.touches[0].clientY; };
    const onMove = (e: TouchEvent) => {
      const dy = e.touches[0].clientY - startY;
      // Find the closest scrollable ancestor of the touch target
      let node = e.target as HTMLElement | null;
      while(node && node !== el) {
        const style = window.getComputedStyle(node);
        const overflow = style.overflowY;
        const canScroll = overflow === 'auto' || overflow === 'scroll';
        if(canScroll) {
          // If pulling down and already at top — block (no-op for PTR)
          if(dy > 0 && node.scrollTop <= 0) { e.preventDefault(); return; }
          // If pulling up and already at bottom — let it pass
          if(dy < 0 && node.scrollTop + node.clientHeight >= node.scrollHeight - 1) { return; }
          // Otherwise the child has scroll room — let it scroll
          return;
        }
        node = node.parentElement;
      }
      // No scrollable child found — block PTR when pulling down
      if(dy > 0) e.preventDefault();
    };
    el.addEventListener('touchstart', onStart, { passive: true });
    el.addEventListener('touchmove',  onMove,  { passive: false });
    return () => {
      el.removeEventListener('touchstart', onStart);
      el.removeEventListener('touchmove',  onMove);
    };
  }, [activeRoom]);

  // Dream Ai state
  const [msgs,    setMsgs]    = useState<UIMsg[]>([]);
  const [input,   setInput]   = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef  = useRef<HTMLDivElement>(null);
  const textRef    = useRef<HTMLTextAreaElement>(null);
  const cancelRef  = useRef<(()=>void)|null>(null);

  useEffect(()=>{
    // ── Auth guard — if no session, go to landing ──────────────────────────
    const token = localStorage.getItem('access_token');
    const session = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
    if(!token && !session){ window.location.replace('/'); return; }

    // ── Onboarding guard — if onboarding not complete, go to onboarding ───
    // Check via API so we always have fresh state, not just cached session.
    // Non-fatal: if fetch fails, proceed to Sanctuary normally.
    const isDemo = (() => { try { const s = JSON.parse(localStorage.getItem('couple_session')||'{}'); return !!s?.demo; } catch { return false; } })();
    if(token && !isDemo) {
      fetch('https://dream-os-production.up.railway.app/api/v2/couple/me',{
        headers:{'Authorization':`Bearer ${token}`},
      })
      .then(r=>r.json())
      .then(d=>{
        const state = d?.couple?.onboarding_state;
        if(state && state!=='complete'){
          window.location.replace('/frost/canvas/onboarding');
        }
      })
      .catch(()=>{/* non-fatal */});
    }

    if(!document.getElementById('sv5')){const s=document.createElement('style');s.id='sv5';s.textContent=CSS;document.head.appendChild(s);}
    const w=getWeddingDate(),e=getEngagementDate(),d=daysUntil(w);
    setDays(d);setProgress(arcProgress(d));setName(getBrideName());
    setProseLine(prose(d));setPoetry(getDailyPoetry());setSinceYes(daysSince(e));
    const now=new Date();
    setWeekday(now.toLocaleDateString('en-IN',{weekday:'long'})+' morning');
    const DOM=['','First','Second','Third','Fourth','Fifth','Sixth','Seventh','Eighth','Ninth','Tenth','Eleventh','Twelfth','Thirteenth','Fourteenth','Fifteenth','Sixteenth','Seventeenth','Eighteenth','Nineteenth','Twentieth','Twenty-First','Twenty-Second','Twenty-Third','Twenty-Fourth','Twenty-Fifth','Twenty-Sixth','Twenty-Seventh','Twenty-Eighth','Twenty-Ninth','Thirtieth','Thirty-First'];
    setDateStamp(`${DOM[now.getDate()]||now.getDate()} of ${now.toLocaleDateString('en-IN',{month:'long'})} · ${now.getFullYear()}`);

    // ── Auto dark/light by time of day ────────────────────────────────────
    // Only applies if bride has never manually set a preference.
    // '@frost.home_mode_manual' flag = she chose herself → respect forever.
    try {
      const manuallySet = localStorage.getItem('@frost.home_mode_manual');
      if(!manuallySet) {
        const h = now.getHours();
        const shouldBeDark = h < 7 || h >= 19; // before 7am or after 7pm
        setHomeMode(shouldBeDark ? 'E1A' : 'E3');
      }
    } catch {}

    // ── Live hints fetch ──────────────────────────────────────────────────
    const hintsRaw = localStorage.getItem('couple_session')||localStorage.getItem('couple_web_session');
    const hintsToken = localStorage.getItem('access_token');
    const hintsSession = hintsRaw ? JSON.parse(hintsRaw) : null;
    const coupleId = hintsSession?.coupleId||hintsSession?.id;
    const API = 'https://dream-os-production.up.railway.app';
    if(coupleId && hintsToken) {
      // Circle + people hints
      fetch(`${API}/api/v2/couple/circle/${coupleId}`,{headers:{Authorization:`Bearer ${hintsToken}`}})
        .then(r=>r.json()).then(d=>{
          const members = d?.members||[];
          const pending = d?.pending_invites||[];
          const activity = d?.activity||[];
          // Circle hint — last activity
          if(activity.length>0){
            const last = activity[0];
            const name = last.member_name||'Someone';
            const ago = last.created_at ? timeAgoShort(last.created_at) : '';
            const type = last.activity_type==='save_added'?'added a save':last.activity_type==='comment'?'left a comment':'was active';
            setCircleHint(`${name} ${type}${ago?' · '+ago:''}`);
          } else {
            setCircleHint('quiet');
          }
          // People hint
          const activeCount = members.filter((m:any)=>m.status==='active').length;
          const pendingCount = pending.length;
          if(activeCount>0||pendingCount>0){
            const parts=[];
            if(activeCount>0) parts.push(`${activeCount} active`);
            if(pendingCount>0) parts.push(`${pendingCount} invited`);
            setPeopleHint(parts.join(' · '));
          }
        }).catch(()=>{});

      // Muse hint
      fetch(`${API}/api/v2/couple/muse/${coupleId}?limit=1`,{headers:{Authorization:`Bearer ${hintsToken}`}})
        .then(r=>r.json()).then(d=>{
          const total = d?.total||0;
          if(total>0) setMuseHint(`${total} saved`);
        }).catch(()=>{});

      // Pages hint
      fetch(`${API}/api/v2/couple/pages/${coupleId}/preview`,{headers:{Authorization:`Bearer ${hintsToken}`}})
        .then(r=>r.json()).then(d=>{
          if(d?.preview) setPagesHint(d.preview + '…');
          else setPagesHint('a page is waiting');
        }).catch(()=>{});

      // Events hint
      fetch(`${API}/api/v2/couple/events/${coupleId}?state=upcoming`,{headers:{Authorization:`Bearer ${hintsToken}`}})
        .then(r=>r.json()).then(d=>{
          const evs = d?.events||[];
          if(evs.length>0) setEventsHint(`${evs.length} day${evs.length!==1?'s':''} ahead`);
          else setEventsHint('Your timeline');
        }).catch(()=>{});

      // Expenses hint
      fetch(`${API}/api/v2/couple/bookings/${coupleId}`,{headers:{Authorization:`Bearer ${hintsToken}`}})
        .then(r=>r.json()).then(d=>{
          const books = d?.bookings||[];
          const paid = books.reduce((s:number,b:any)=>s+(b.amount_paid||0),0);
          if(paid>0){
            const fmt = paid>=100000?`Rs ${(paid/100000).toFixed(1)}L`:paid>=1000?`Rs ${Math.round(paid/1000)}K`:`Rs ${paid}`;
            setExpensesHint(`${fmt} logged`);
          }
        }).catch(()=>{});

      // Vendors hint
      fetch(`${API}/api/v2/couple/bookings/${coupleId}`,{headers:{Authorization:`Bearer ${hintsToken}`}})
        .then(r=>r.json()).then(d=>{
          const books = d?.bookings||[];
          if(books.length>0) setVendorsHint(`${books.length} confirmed`);
        }).catch(()=>{});
    }
  },[]);

function timeAgoShort(iso:string):string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff/60000);
  if(m<1)  return 'just now';
  if(m<60) return `${m}m ago`;
  const h = Math.floor(m/60);
  if(h<24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

  // Scroll dream to bottom
  useEffect(()=>{ if(scrollRef.current)scrollRef.current.scrollTop=scrollRef.current.scrollHeight; },[msgs]);
  useEffect(()=>{ if(!textRef.current)return;textRef.current.style.height='auto';textRef.current.style.height=Math.min(textRef.current.scrollHeight,120)+'px'; },[input]);
  useEffect(()=>()=>{cancelRef.current?.();},[]);

  // ── Bloom open / close ────────────────────────────────────────────────────
  const openRoom = useCallback((key:RoomKey)=>{
    setActiveRoom(key);
    setBlooming(true);
    setClosing(false);
  },[]);

  const closeRoom = useCallback(()=>{
    setClosing(true);
    setTimeout(()=>{
      setActiveRoom(null);
      setBlooming(false);
      setClosing(false);
    },300);
  },[]);

  // ── Back button trap (Android + iOS PWA) ─────────────────────────────────
  // Strategy: push a sentinel history entry on mount.
  // When popstate fires (back button): push another sentinel (stay on page)
  // AND close any open room. Two back presses = room closes then nothing.
  // The user can only leave via the task switcher — never via back.
  const activeRoomRef = React.useRef<RoomKey>(null);
  useEffect(()=>{ activeRoomRef.current = activeRoom; },[activeRoom]);

  useEffect(()=>{
    // Push TWO sentinels on mount — need to pop both before leaving
    // Using location.hash approach: browser stays on same URL, popstate fires reliably
    const url = window.location.pathname + window.location.search;
    window.history.pushState({tdw:'s',n:1}, '', url);
    window.history.pushState({tdw:'s',n:2}, '', url);

    const onPop = (e: PopStateEvent) => {
      // Always push a fresh sentinel to trap the back press
      window.history.pushState({tdw:'s',n:Date.now()}, '', url);
      // Close room if open
      if(activeRoomRef.current !== null){
        setClosing(true);
        setTimeout(()=>{ setActiveRoom(null); setBlooming(false); setClosing(false); },300);
      }
    };

    window.addEventListener('popstate', onPop);
    return ()=>{ window.removeEventListener('popstate', onPop); };
  },[]);

  // Swipe down to close
  const touchStartX = useRef(0);
  const onTouchStart = useCallback((e:React.TouchEvent)=>{
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
  },[]);
  const onTouchEnd = useCallback((e:React.TouchEvent)=>{
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    const dx = Math.abs(e.changedTouches[0].clientX - touchStartX.current);
    // Only close if: clearly vertical (not horizontal), dragged down 120px+,
    // AND started in the top 100px pull-zone OR from a non-scrollable surface
    if(dy > 120 && dx < 60) {
      // Check if the touch started inside a scrollable child that had scroll room
      const target = e.target as HTMLElement;
      let node: HTMLElement | null = target;
      let inScrollable = false;
      const bloom = bloomRef.current;
      while(node && bloom && node !== bloom) {
        const s = window.getComputedStyle(node);
        if(s.overflowY === 'auto' || s.overflowY === 'scroll') {
          if(node.scrollTop > 4) { inScrollable = true; break; }
        }
        node = node.parentElement;
      }
      if(!inScrollable) closeRoom();
    }
  },[closeRoom]);

  // ── Dream Ai send ─────────────────────────────────────────────────────────
  const sendDream = useCallback((text:string)=>{
    const msg=text.trim();
    if(!msg||loading)return;
    setInput('');
    setMsgs(prev=>[...prev,{id:uid(),role:'user',content:msg}]);
    setLoading(true);
    const aiId=uid();
    setMsgs(prev=>[...prev,{id:aiId,role:'assistant',content:'',pending:true}]);
    const cancel=streamBrideChat(msg,
      (delta)=>setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,content:m.content+delta,pending:false}:m)),
      ()=>{setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,pending:false}:m));setLoading(false);cancelRef.current=null;},
      (err)=>{console.error(err);setMsgs(prev=>prev.map(m=>m.id===aiId?{...m,content:'Something went wrong. Try again.',error:true,pending:false}:m));setLoading(false);cancelRef.current=null;}
    );
    cancelRef.current=cancel;
  },[loading]);

  // ── Tokens ────────────────────────────────────────────────────────────────
  const bg = dark
    ? `radial-gradient(ellipse 110% 60% at 50% -8%,rgba(196,133,106,.18) 0%,transparent 58%),radial-gradient(ellipse 70% 50% at 85% 108%,rgba(55,10,20,.55) 0%,transparent 55%),linear-gradient(180deg,#14080C 0%,#100608 55%,#0C0405 100%)`
    : `radial-gradient(ellipse 110% 60% at 50% -8%,rgba(168,196,216,.32) 0%,transparent 58%),radial-gradient(ellipse 70% 50% at 85% 108%,rgba(170,160,145,.14) 0%,transparent 55%),linear-gradient(180deg,#F0EEE8 0%,#E8E5DE 55%,#DDD9D0 100%)`;

  const accent    = dark ? '#C4856A' : '#2A5F82';
  const signal    = dark ? '#6B9E8F' : '#8B6E52';
  const ink       = dark ? '#F5E5DC' : '#0A1628';
  const inkSoft   = dark ? 'rgba(245,229,220,.85)' : 'rgba(10,22,40,1.0)';
  const inkMute   = dark ? 'rgba(196,133,106,.42)'  : 'rgba(10,22,40,.60)';
  const line      = dark ? 'rgba(196,133,106,.10)'  : 'rgba(42,95,130,.14)';
  const lineStr   = dark ? 'rgba(196,133,106,.18)'  : 'rgba(42,95,130,.22)';
  const pillBg    = dark ? 'rgba(20,8,12,.55)'      : 'rgba(240,238,232,.75)';
  const pillBdr   = dark ? 'rgba(196,133,106,.30)'  : 'rgba(42,95,130,.35)';
  const pillTxt   = dark ? 'rgba(245,229,220,.85)'  : 'rgba(10,22,40,.85)';
  const topBandBg = dark ? 'rgba(20,8,12,.62)'      : 'rgba(240,238,232,.68)';
  // Bottom dark panel — covers slice zone, makes text legible
  // Comes higher now so Dream Ai row is always in the dark zone
  const botPanelBg= dark ? 'rgba(12,4,5,.50)'       : 'rgba(8,6,10,.82)';
  const sliceTxt  = dark ? '#F5E5DC'                 : '#FFFFFF';
  const hintTxt   = dark ? 'rgba(196,133,106,.55)'  : 'rgba(255,255,255,.55)';
  const ghostColor= dark ? '#3A0C18'                 : '#7AAAC8';
  const ghostOp   = dark ? 0.92                      : 0.70;

  // Room backgrounds — match the mode. Same house, different rooms.
  // Exception: Discover + Muse + Moments = always dark (photo galleries)
  const isPhotoRoom = activeRoom==='discover'||activeRoom==='muse'||activeRoom==='moments';

  const roomTopBg = isPhotoRoom
    ? 'rgba(8,6,10,.92)'
    : dark ? 'rgba(18,6,10,.88)' : 'rgba(238,240,246,.88)';

  const roomBg = isPhotoRoom
    ? 'linear-gradient(180deg,#080608 0%,#040406 100%)'
    : dark
      ? 'radial-gradient(ellipse 110% 55% at 50% -5%,rgba(196,133,106,.18) 0%,transparent 52%),radial-gradient(ellipse 70% 60% at 90% 110%,rgba(40,5,12,.80) 0%,transparent 55%),radial-gradient(ellipse 50% 40% at 5% 100%,rgba(60,8,20,.70) 0%,transparent 50%),linear-gradient(180deg,#1A0A0E 0%,#0E0506 40%,#080204 70%,#0C0408 100%)'
      : 'radial-gradient(ellipse 110% 50% at 60% -5%,rgba(74,122,155,.24) 0%,transparent 55%),radial-gradient(ellipse 70% 50% at 10% 110%,rgba(42,95,130,.16) 0%,transparent 55%),linear-gradient(160deg,#EEF0F6 0%,#E4E8F2 30%,#D8DEEC 60%,#CDD4E8 100%)'; // slate-tinted bone frosted

  const roomInk     = isPhotoRoom ? '#F0EDE8' : (dark ? '#F5E5DC' : '#0D1E35');
  const roomInkSoft = isPhotoRoom ? 'rgba(240,237,232,.70)' : (dark ? 'rgba(245,229,220,.78)' : 'rgba(13,30,53,.80)');
  const roomInkMute = isPhotoRoom ? 'rgba(200,180,160,.40)' : (dark ? 'rgba(196,133,106,.48)' : 'rgba(42,95,130,.55)');
  const roomLine    = isPhotoRoom ? 'rgba(196,133,106,.16)' : (dark ? 'rgba(196,133,106,.14)' : 'rgba(42,95,130,.16)');
  const aiBubbleBg  = dark ? 'rgba(196,133,106,.08)'  : 'rgba(42,95,130,.06)';
  const aiBubbleBdr = dark ? 'rgba(196,133,106,.18)'  : 'rgba(42,95,130,.16)';
  const composeBg   = dark ? 'rgba(12,4,5,.90)'       : 'rgba(240,238,232,.90)';
  const inputBg     = dark ? 'rgba(196,133,106,.06)'  : 'rgba(42,95,130,.05)';
  const inputBdr    = dark ? 'rgba(196,133,106,.22)'  : 'rgba(42,95,130,.20)';
  const chipBg      = dark ? 'rgba(196,133,106,.06)'  : 'rgba(42,95,130,.05)';
  const chipBdr     = dark ? 'rgba(196,133,106,.20)'  : 'rgba(42,95,130,.18)';

  const dot = arcPoint(progress);

  // ── SANCTUARY ─────────────────────────────────────────────────────────────
  return (
    <div style={{position:'fixed',inset:0,background:bg,display:'flex',flexDirection:'column',overflow:'hidden',userSelect:'none',WebkitUserSelect:'none' as any}}>

      {/* Grain */}
      <div style={{position:'absolute',inset:0,pointerEvents:'none',zIndex:0,backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,backgroundSize:'160px',opacity:dark?.45:.22}}/>

      {/* Ghost numeral */}
      <div className="gn-a" style={{position:'absolute',top:'115px',left:'50%',fontFamily:"'Fraunces',serif",fontWeight:700,fontStyle:'normal',fontSize:'320px',lineHeight:1,letterSpacing:'-.06em',whiteSpace:'nowrap',color:ghostColor,opacity:ghostOp,filter:'blur(8px)',fontFeatureSettings:'"opsz" 144',pointerEvents:'none',zIndex:3,transition:`top 480ms ${EASE}, font-size 480ms ${EASE}`,WebkitMaskImage:'linear-gradient(180deg,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 70%,rgba(0,0,0,0.3) 88%,rgba(0,0,0,0) 100%)',maskImage:'linear-gradient(180deg,rgba(0,0,0,1) 0%,rgba(0,0,0,1) 70%,rgba(0,0,0,0.3) 88%,rgba(0,0,0,0) 100%)'}}>
        {days}
      </div>

      {/* Upper frost band */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:120,background:topBandBg,backdropFilter:'blur(22px) saturate(1.1)',WebkitBackdropFilter:'blur(22px) saturate(1.1)',WebkitMaskImage:'linear-gradient(180deg,#000 55%,transparent 100%)',maskImage:'linear-gradient(180deg,#000 55%,transparent 100%)',pointerEvents:'none',zIndex:2}}/>

      {/* Bottom dark panel — raised higher so ALL slices are in dark zone */}
      <div style={{position:'absolute',top:'38%',left:0,right:0,bottom:0,background:botPanelBg,backdropFilter:'blur(20px) saturate(1.2)',WebkitBackdropFilter:'blur(20px) saturate(1.2)',WebkitMaskImage:'linear-gradient(180deg,transparent 0%,rgba(0,0,0,.7) 10%,#000 20%)',maskImage:'linear-gradient(180deg,transparent 0%,rgba(0,0,0,.7) 10%,#000 20%)',pointerEvents:'none',zIndex:4,transition:`top 480ms ${EASE}`}}/>

      {/* Arc */}
      <div style={{position:'absolute',top:0,left:0,right:0,height:108,zIndex:6,pointerEvents:'none'}}>
        <svg viewBox="0 0 320 108" preserveAspectRatio="none" style={{width:'100%',height:'100%',overflow:'visible'}}>
          <path d="M 18 92 Q 160 4 302 92" stroke={dark?'rgba(196,133,106,.14)':'rgba(42,95,130,.20)'} strokeWidth="1" fill="none"/>
          <path d={arcPathTo(progress)} stroke={accent} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          <circle cx={dot.x} cy={dot.y} r="18" fill="none" stroke={accent} strokeWidth=".5" className="do-a"/>
          <circle cx={dot.x} cy={dot.y} r="10" fill="none" stroke={accent} strokeWidth=".8" className="dh-a"/>
          <circle cx={dot.x} cy={dot.y} r="4.5" fill={accent} className="dc-a"/>
          {/* I WILL — left endpoint label, sits below arc line */}
          <text x="18" y="107" textAnchor="start"
            fontFamily="'JetBrains Mono',monospace" fontSize="7.5" letterSpacing="2.5"
            fill={dark?'rgba(196,133,106,.45)':'rgba(42,80,130,.50)'}>I WILL</text>
          {/* I DO — right endpoint label, sits below arc line */}
          <text x="302" y="107" textAnchor="end"
            fontFamily="'JetBrains Mono',monospace" fontSize="7.5" letterSpacing="2.5"
            fill={dark?'rgba(196,133,106,.45)':'rgba(42,80,130,.50)'}>I DO</text>
        </svg>
      </div>

      {/* I WILL / I DO — rendered inside SVG below */}

      {/* Date stamp — floats top-right above the arc */}
      <div style={{position:'absolute',top:`calc(env(safe-area-inset-top,0px) + 8px)`,right:18,zIndex:9,pointerEvents:'none'}}>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.2em',color:inkMute}}>{romanDate()}</span>
      </div>

      {/* Hero — top padding clears the arc (108px) + safe area */}
      <div style={{position:'relative',zIndex:5,padding:`calc(env(safe-area-inset-top,0px) + 112px) 18px 6px`,flexShrink:0}}>
        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,letterSpacing:'.28em',textTransform:'uppercase' as any,color:inkMute,marginBottom:10,display:'flex',alignItems:'center',gap:8}}>{weekday}<span style={{flex:1,maxWidth:44,height:.5,background:line}}/></div>
        <div style={{fontFamily:"'Italianno',cursive",fontSize:42,lineHeight:.9,letterSpacing:'-.01em',color:ink,marginBottom:8}}>
          Hello, <span style={{color:accent}}>{name}</span>.
        </div>
        <div style={{width:40,height:1,background:`linear-gradient(90deg,${accent},transparent)`,marginBottom:10}}/>
        <div style={{display:'flex',alignItems:'baseline',gap:8}}>
          <div className="num-a" style={{fontFamily:"'Fraunces',serif",fontWeight:700,fontStyle:'normal',fontSize:48,lineHeight:.88,letterSpacing:'-.04em',color:accent,fontFeatureSettings:'"opsz" 144'}}>{days}</div>
          <div style={{fontFamily:"'Jost',sans-serif",fontWeight:200,fontSize:8,letterSpacing:'.28em',textTransform:'uppercase' as any,color:accent,opacity:.6}}>mornings to I do</div>
        </div>
        <>
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:13,lineHeight:1.55,color:inkSoft,marginTop:10,marginBottom:6,fontFeatureSettings:'"opsz" 9'}}>
            {proseLine.split(/(I will|I do)/g).map((p,i)=>p==='I will'||p==='I do'?<span key={i} style={{color:accent,fontWeight:400}}>{p}</span>:<span key={i}>{p}</span>)}
          </div>
          <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.2em',textTransform:'uppercase' as any,color:inkMute,marginBottom:3}}>{dateStamp}</div>
          {sinceYes>0&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:6.5,letterSpacing:'.16em',textTransform:'uppercase' as any,color:signal}}>↑ {sinceYes} days since you said yes</div>}
          <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:11,lineHeight:1.5,marginTop:6,color:inkMute,fontFeatureSettings:'"opsz" 9'}}>"{poetry}"</div>
        </>
      </div>

      {/* Slices — dynamic hints */}
      {(()=>{
        const hintMap:{[k:string]:string}={
          dream:'Tell me anything.',
          circle:circleHint,
          muse:museHint||'Your board',
          discover:'Your curated world',
          people:peopleHint||'Your circle',
          pages:pagesHint,
          moments:'Your story, in photos',
          events:eventsHint,
          expenses:expensesHint||'Track your spend',
          vendors:vendorsHint||'Your team',
          meridian:'Skin · mind · body',
        };
        return(
        <div style={{position:'relative',zIndex:5,flex:1,display:'flex',flexDirection:'column',borderTop:`.5px solid ${lineStr}`,overflow:'hidden',minHeight:0}}>
          {BASE_SLICES.map((slice,idx)=>(
            <div key={slice.key} onClick={()=>openRoom(slice.key)} className="si-a"
              style={{flex:1,minHeight:0,display:'flex',alignItems:'center',padding:'0 18px',gap:7,borderBottom:`.5px solid ${line}`,cursor:'pointer',WebkitTapHighlightColor:'transparent',background:'transparent',animationDelay:`${idx*16}ms`}}>
              <span style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:17,lineHeight:1,flexShrink:0,color:sliceTxt,fontFeatureSettings:'"opsz" 9'}}>{slice.label}</span>
              {slice.candle&&<span className="cf-a" style={{width:5,height:5,borderRadius:'50%',background:signal,boxShadow:`0 0 7px ${signal}`,flexShrink:0}}/>}
              <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.1em',textTransform:'uppercase' as any,color:hintTxt,marginLeft:'auto',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis',maxWidth:160}}>{hintMap[slice.key as string]||''}</span>
              {(slice.key==='discover'||slice.key==='meridian')&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:hintTxt,flexShrink:0}}>→</span>}
            </div>
          ))}
        </div>
        );
      })()}

      {/* DreamAi on WhatsApp — persistent bottom link, always visible */}
      <div style={{position:'relative',zIndex:5,flexShrink:0,borderTop:`.5px solid ${lineStr}`,paddingBottom:'calc(env(safe-area-inset-bottom,0px) + 4px)'}}>
        <a href={DREAMAI_WA_LINK} target="_blank" rel="noopener noreferrer"
          style={{display:'flex',alignItems:'center',justifyContent:'center',padding:'10px 18px',textDecoration:'none',WebkitTapHighlightColor:'transparent'}}>
          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:dark?'rgba(196,133,106,.55)':'rgba(10,22,40,.45)'}}>
            ↗ DreamAi on <span style={{color:accent}}>WhatsApp</span>
          </span>
        </a>
      </div>

      {/* ════════════════════════════════════════════════════════
          BLOOM LAYER — renders ON TOP of Sanctuary
          Every room blooms up from the bottom, covering Sanctuary.
          Swipe down or tap ← to close.
          ════════════════════════════════════════════════════════ */}
      {activeRoom && (
        <div
          className={closing ? 'bloom-exit' : 'bloom-enter'}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
          ref={bloomRef}
          style={{position:'absolute',inset:0,zIndex:100,display:'flex',flexDirection:'column',background:roomBg,overflow:'hidden'}}
        >
          {/* Room top bar */}
          <div style={{position:'relative',zIndex:10,background:roomTopBg,backdropFilter:'blur(22px) saturate(1.1)',WebkitBackdropFilter:'blur(22px) saturate(1.1)',borderBottom:`0.5px solid ${roomLine}`,paddingTop:'calc(env(safe-area-inset-top,0px) + 12px)',paddingBottom:12,paddingLeft:18,paddingRight:18,display:'flex',alignItems:'center',flexShrink:0}}>
            <button onClick={closeRoom} style={{background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:6,padding:0,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.22em',textTransform:'uppercase' as any,color:roomInkMute}}>
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Sanctuary
            </button>
            <div style={{flex:1,textAlign:'center',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:17,color:accent,fontFeatureSettings:'"opsz" 9'}}>
              {(()=>{
                const labels:{[k:string]:string}={expenses:'Expenses',vendors:'Vendors',settings:'Settings'};
                if(activeRoom&&labels[activeRoom]) return labels[activeRoom];
                return BASE_SLICES.find(s=>s.key===activeRoom)?.label||'';
              })()}
            </div>
            {activeRoom==='dream'&&<button onClick={()=>{cancelRef.current?.();setMsgs([]);setLoading(false);}} style={{background:'none',border:'none',cursor:'pointer',padding:0,fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.18em',textTransform:'uppercase' as any,color:roomInkMute}}>Clear</button>}
            {activeRoom!=='dream'&&<div style={{width:40}}/>}
          </div>

          {/* Room content */}
          <div style={{flex:1,overflow:'hidden',display:'flex',flexDirection:'column',position:'relative'}}>
            {/* Bottom vignette — cinematic framing both modes */}
            {activeRoom!=='discover'&&activeRoom!=='muse'&&activeRoom!=='moments'&&(
              <div style={{position:'absolute',bottom:0,left:0,right:0,height:80,
                background:dark
                  ?'linear-gradient(transparent,rgba(12,4,5,.65))'
                  :'linear-gradient(transparent,rgba(8,10,18,.45))',
                pointerEvents:'none',zIndex:5}}/>
            )}

            {/* ── DREAM AI ── */}
            {activeRoom==='dream'&&<>
              <div ref={scrollRef} className="no-scroll" style={{flex:1,overflowY:'auto',WebkitOverflowScrolling:'touch' as any,padding:'20px 18px'}}>
                {msgs.length===0?(
                  <div style={{display:'flex',flexDirection:'column',gap:24,paddingTop:8}}>
                    <div>
                      <div style={{fontFamily:"'Italianno',cursive",fontSize:48,lineHeight:.95,color:roomInk,marginBottom:8}}>Tell me what's<br/>on your mind.</div>
                      <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:roomInkSoft,lineHeight:1.65,fontFeatureSettings:'"opsz" 9'}}>I know your timeline, vendors,<br/>Muse board, and Circle.</div>
                    </div>
                    <div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:'.28em',textTransform:'uppercase' as any,color:roomInkMute,marginBottom:12}}>Try asking</div>
                      <div style={{display:'flex',flexDirection:'column',gap:8}}>
                        {DREAM_PROMPTS.map(p=>(
                          <button key={p} onClick={()=>sendDream(p)} style={{textAlign:'left',background:chipBg,border:`0.5px solid ${chipBdr}`,borderRadius:8,padding:'12px 14px',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:roomInk,cursor:'pointer',fontFeatureSettings:'"opsz" 9'}}>"{p}"</button>
                        ))}
                      </div>
                    </div>
                  </div>
                ):(
                  <div style={{display:'flex',flexDirection:'column',gap:12}}>
                    {msgs.map(m=>(
                      <div key={m.id} style={{display:'flex',justifyContent:m.role==='user'?'flex-end':'flex-start'}}>
                        {m.role==='user'?(
                          <div style={{maxWidth:'82%',background:accent,color:dark?'#1A0810':'#FFFFFF',padding:'10px 14px',borderRadius:'20px 20px 4px 20px',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,lineHeight:1.55,fontFeatureSettings:'"opsz" 9',userSelect:'text' as any}}>{m.content}</div>
                        ):m.pending&&m.content===''?(
                          <div style={{background:aiBubbleBg,border:`0.5px solid ${aiBubbleBdr}`,padding:'10px 16px',borderRadius:'20px 20px 20px 4px',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)'}}>
                            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:'.22em',textTransform:'uppercase' as any,color:accent,animation:'dpulse 1.4s infinite ease-in-out'}}>✦ thinking</span>
                            <style>{`@keyframes dpulse{0%,80%,100%{opacity:.35}40%{opacity:1}}`}</style>
                          </div>
                        ):(
                          <div style={{maxWidth:'90%',background:aiBubbleBg,border:`0.5px solid ${aiBubbleBdr}`,padding:'12px 16px',borderRadius:'20px 20px 20px 4px',backdropFilter:'blur(10px)',WebkitBackdropFilter:'blur(10px)',fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,lineHeight:1.65,color:m.error?'#C4534A':roomInk,whiteSpace:'pre-wrap',fontFeatureSettings:'"opsz" 9',userSelect:'text' as any}}>
                            {m.content}
                            {m.pending&&<span className="d-cursor" style={{opacity:.5,color:accent}}>▌</span>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Compose */}
              <div style={{background:composeBg,backdropFilter:'blur(22px) saturate(1.1)',WebkitBackdropFilter:'blur(22px) saturate(1.1)',borderTop:`0.5px solid ${roomLine}`,padding:`12px 18px calc(12px + env(safe-area-inset-bottom,0px))`,flexShrink:0}}>
                <div style={{display:'flex',gap:10,alignItems:'flex-end',background:inputBg,border:`0.5px solid ${inputBdr}`,borderRadius:20,padding:'8px 10px 8px 16px'}}>
                  <textarea ref={textRef} value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendDream(input);}}} placeholder="Tell DreamAi anything…" disabled={loading} rows={1}
                    style={{flex:1,background:'transparent',border:'none',outline:'none',color:roomInk,fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:15,resize:'none',maxHeight:120,lineHeight:1.5,fontFeatureSettings:'"opsz" 9',userSelect:'text',WebkitUserSelect:'text' as any}}/>
                  <button onClick={()=>sendDream(input)} disabled={loading||!input.trim()}
                    style={{background:input.trim()&&!loading?accent:'rgba(128,128,128,.12)',color:input.trim()&&!loading?(dark?'#1A0810':'#FFFFFF'):roomInkMute,border:'none',borderRadius:'50%',width:34,height:34,display:'flex',alignItems:'center',justifyContent:'center',cursor:input.trim()&&!loading?'pointer':'default',transition:`background 200ms ${EASE}`,flexShrink:0}}>
                    <Send size={14} strokeWidth={1.5}/>
                  </button>
                </div>
              </div>
            </>}

            {/* ── EVENTS — timeline grouped by date ── */}
            {activeRoom==='events'&&(
              <EventsRoom
                dark={dark} accent={accent} signal={signal}
                roomInk={roomInk} roomInkSoft={roomInkSoft} roomInkMute={roomInkMute} roomLine={roomLine}
              />
            )}

            {/* ── DISCOVER — cinematic full-bleed feed ── */}
            {activeRoom==='discover'&&(
              <DiscoverRoom dark={dark} accent={accent} signal={signal}/>
            )}

            {/* ── MUSE — masonry board, always dark ── */}
            {activeRoom==='muse'&&(
              <MuseRoom dark={dark} accent={accent}/>
            )}

            {/* ── CIRCLE — activity feed + invite ── */}
            {activeRoom==='circle'&&(
              <CircleRoom
                dark={dark} accent={accent} signal={signal}
                roomInk={roomInk} roomInkSoft={roomInkSoft} roomInkMute={roomInkMute} roomLine={roomLine}
              />
            )}

            {/* ── PAGES — diary with feeling picker ── */}
            {activeRoom==='pages'&&(
              <PagesRoom
                dark={dark} accent={accent} signal={signal}
                roomInk={roomInk} roomInkSoft={roomInkSoft} roomInkMute={roomInkMute} roomLine={roomLine}
              />
            )}

            {/* ── PEOPLE ── */}
            {activeRoom==='people'&&(
              <PeopleRoom dark={dark} accent={accent} signal={signal}/>
            )}

            {/* ── EXPENSES ── */}
            {activeRoom==='expenses'&&(
              <ExpensesRoom dark={dark} accent={accent} signal={signal}/>
            )}

            {/* ── VENDORS ── */}
            {activeRoom==='vendors'&&(
              <VendorsRoom dark={dark} accent={accent}/>
            )}

            {/* ── SETTINGS ── */}
            {activeRoom==='settings'&&(
              <SettingsRoom dark={dark} accent={accent} signal={signal} setHomeMode={setHomeMode}/>
            )}

            {/* ── MOMENTS — personal photo diary ── */}
            {activeRoom==='moments'&&(
              <MomentsRoom dark={dark} accent={accent}/>
            )}

            {/* ── MERIDIAN — personal concierge ── */}
            {activeRoom==='meridian'&&(
              <MeridianRoom dark={dark} accent={accent}/>
            )}

            {/* ── EXPENSES — already built ── */}
            {activeRoom==='expenses'&&(
              <ExpensesRoom dark={dark} accent={accent} signal={signal}/>
            )}

            {/* ── VENDORS — already built ── */}
            {activeRoom==='vendors'&&(
              <VendorsRoom dark={dark} accent={accent}/>
            )}

            {/* ── SETTINGS — already built ── */}
            {activeRoom==='settings'&&(
              <SettingsRoom dark={dark} accent={accent} signal={signal} setHomeMode={(m)=>{setHomeMode(m);try{localStorage.setItem('@frost.home_mode_manual','1');}catch{}}}/>
            )}

            {/* ── OTHER ROOMS — coming soon ── */}
            {activeRoom!==null&&!['dream','pages','circle','events','muse','discover','expenses','vendors','settings','people','moments','meridian'].includes(activeRoom)&&(
              <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:16,padding:32}}>
                <div style={{fontFamily:"'Italianno',cursive",fontSize:52,color:accent,lineHeight:1}}>
                  {BASE_SLICES.find(s=>s.key===activeRoom)?.label||activeRoom}
                </div>
                <div style={{fontFamily:"'Fraunces',serif",fontStyle:'italic',fontWeight:300,fontSize:14,color:roomInkSoft,textAlign:'center',lineHeight:1.65,fontFeatureSettings:'"opsz" 9'}}>
                  Coming soon.<br/>Swipe down to return.
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
