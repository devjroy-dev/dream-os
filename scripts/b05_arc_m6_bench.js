// scripts/b05_arc_m6_bench.js — TDW_05 COUPLE-LANE ARC, MOVEMENT M6 (the last).
'use strict';
process.env.SUPABASE_URL ||= 'https://bench.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY ||= 'bench-key';
const assert=require('assert'), fs=require('fs'), path=require('path');
const ROOT=path.resolve(__dirname,'..'), P=(r)=>path.join(ROOT,r);
const read=(r)=>fs.readFileSync(P(r),'utf8');
const code=(r)=>read(r).split('\n').filter(l=>!l.trim().startsWith('//')).join('\n');
let pass=0,fail=0;
const t=(n,f)=>{try{f();console.log(`  ok   ${n}`);pass++;}catch(e){console.log(`  FAIL ${n}\n       ${e.message}`);fail++;}};
const ta=async(n,f)=>{try{await f();console.log(`  ok   ${n}`);pass++;}catch(e){console.log(`  FAIL ${n}\n       ${e.message}`);fail++;}};
const H=(s)=>console.log(`\n${s}`);
const W=require(P('src/lib/coupleEventWrite.js'));
const COUPLE_FILES=['src/agent/brideEngine.js','src/api/couple/events.js'];

(async()=>{
H('§1 — C9(a): THE COUPLE PLANE HAS ONE WRITER');
t('§1.1 *** SOLE-WRITER, ASSERTED STRUCTURALLY *** (C1 §3.4 pattern)', () => {
  const strays=[];
  for (const f of COUPLE_FILES) {
    const L=code(f).split('\n');
    L.forEach((l,i)=>{ if(/\.from\('events'\)/.test(l)){
      const near=L.slice(i,i+3).join(' ');
      if(/\.insert\(|\.update\(|\.delete\(/.test(near)) strays.push(`${f}:${i+1}`);
    }});
  }
  assert.deepStrictEqual(strays,[], 'an events WRITE lives outside the home — next block inherits the law or this fires');
});
t('§1.2 the READS stay where they live — sole-WRITER, never sole reader', () => {
  for (const f of COUPLE_FILES)
    assert.ok(/\.from\('events'\)/.test(code(f)), `${f}: the select was moved too — the law was widened by analogy`);
  assert.ok(/SOLE \*\*WRITER\*\*, never sole reader/.test(read('src/lib/coupleEventWrite.js')),
    'the edge must be stated in the home, or the next reader widens it');
});
t('§1.3 the home HARD-GATES on coupleId, mirroring eventWrite:462', () => {
  assert.ok(/if \(!vendorId\) return \{ ok: false, error: 'vendorId is required\.' \};/.test(read('src/lib/vendor/eventWrite.js')),
    'the vendor gate this mirrors must still exist');
  assert.ok(/coupleId is required\./.test(read('src/lib/coupleEventWrite.js')));
});
await ta('§1.4 no coupleId -> refused, and NOTHING reaches the table', async () => {
  let touched=false;
  const sb={ from:()=>{ touched=true; throw new Error('reached the table'); } };
  for (const fn of [W.insertCoupleEvent, W.updateCoupleEvent, W.deleteCoupleEvent]) {
    const r=await fn(sb,{coupleId:null,eventId:'e',updates:{},row:{},select:'id'});
    assert.strictEqual(r.error.message,'coupleId is required.');
  }
  assert.strictEqual(touched,false,'the gate let a write through to the table');
});
await ta('§1.5 update/delete re-assert couple_id on the WHERE — never trust the id alone', async () => {
  const seen=[];
  const b={ update:()=>b, delete:()=>b, insert:()=>b, select:()=>b,
            eq:(k,v)=>{seen.push([k,v]);return b;}, single:()=>Promise.resolve({data:{},error:null}) };
  await W.updateCoupleEvent({from:()=>b},{coupleId:'c1',eventId:'e1',updates:{},select:'id'});
  await W.deleteCoupleEvent({from:()=>b},{coupleId:'c1',eventId:'e1',select:'id'});
  const pairs=seen.map(x=>x[0]);
  assert.ok(pairs.filter(k=>k==='couple_id').length===2,
    'one couple could edit another couple\'s row');
});
t('§1.6 eventWrite.js is 0-LINE — the vendor home was not widened', () => {
  const {execSync}=require('child_process');
  assert.strictEqual(execSync('git diff --name-only a80dac8 -- src/lib/vendor/eventWrite.js',{cwd:ROOT}).toString().trim(),'');
});
t('§1.7 occupancy is DEFERRED-NAMED in the home\'s own header', () => {
  const h=read('src/lib/coupleEventWrite.js');
  assert.ok(/DEFERRED-NAMED, NOT FORGOTTEN/.test(h));
  assert.ok(/vendor-SUPPLY semantics/.test(h) && /no ruling\s*\n?\/\/ exists for/.test(h.replace(/\r/g,'')));
});

H('§2 — F-05.51: FOUR DOORS, NOT ONE');
t('§2.1 *** every couple inbound insert routes through inboundRow ***', () => {
  const L=code('src/lib/vendorInbound.js').split('\n');
  const bare=[];
  L.forEach((l,i)=>{ if(/sent_by: 'couple',/.test(l)){
    let s=i; while(!/\.insert\(/.test(L[s])) s--;
    if(!/inboundRow\(/.test(L[s])) bare.push(i+1);
  }});
  assert.deepStrictEqual(bare,[],'a couple door still writes a sid-less row');
});
t('§2.2 the SET is four — a fifth door added later inherits the law or this fires', () => {
  const n=(code('src/lib/vendorInbound.js').match(/sent_by: 'couple',/g)||[]).length;
  assert.strictEqual(n,4,`the couple-door census moved to ${n} — re-derive before trusting §2.1`);
});
await ta('§2.3 REDELIVERY: every door hands the wamid to the row-builder, both passes', async () => {
  // WHAT A DESK CAN AND CANNOT PROVE, stated rather than faked: the DB's unique
  // index does the REJECTING and a bench has no index; and inboundRow withholds
  // message_sid until its runtime capability probe has seen the column (P1b's
  // graceful degrade), which never runs here. So this cell proves the property
  // that was ACTUALLY missing and that the estate controls in code: every couple
  // door HANDS the wamid to the row-builder, on the first pass and on the pass
  // after a restart. Before M6 they handed it nothing, on every pass.
  const core = require(P('src/lib/webhookCore.js'));
  const L = code('src/lib/vendorInbound.js').split('\n');
  let doors = 0;
  L.forEach((l, i) => { if (/sent_by: 'couple',/.test(l)) {
    let e = i; while (!/^\s*\}, /.test(L[e])) e++;
    assert.ok(/internalReplay \? null : messageSid/.test(L[e]),
      `a couple door builds its row with no wamid to hand: line ${e + 1}`);
    doors++;
  }});
  assert.strictEqual(doors, 4, 'the door census moved');
  // And the builder's own contract, both passes across a simulated restart.
  const mk = () => core.inboundRow({ conversation_id: 'c1', direction: 'inbound', body: 'hi' }, 'wamid.SAME');
  const a = mk(); core._resetSidLru(); const b = mk();
  assert.deepStrictEqual(a, b, 'the builder is not restart-stable');
});

H('§3 — F-05.49: THE HONEST CHANNEL');
t('§3.1 the web-delivered summary is stamped web, and the value is DERIVED', () => {
  const b=code('src/agent/brideEngine.js');
  const i=b.indexOf("body:            summary,");
  assert.ok(i>0);
  assert.ok(/channel: *'web',/.test(b.slice(i-300,i)), 'the pre-insert still claims whatsapp');
  const all=(code('src/api/couple/chat.js')+code('src/agent/brideEngine.js')).match(/channel: *'([a-z]+)'/g)||[];
  assert.ok(all.some(x=>/'web'/.test(x)), "'web' must be the estate's own value, not a minted one");
});

H('§4 — REJECT LOUDLY (synthetic; NO LIVE SUBJECT — M3 cured the only deviant)');
await ta('§4.1 the wrong plane THROWS, and the throw says what it caught', async () => {
  const {resolveAgentForVendor}=require(P('src/api/middleware/agentBridge.js'));
  const sb={ from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{auth_user_id:'AUTH-REAL'}})})})}),
             schema:()=>({from:()=>{throw new Error('reached engine');}}) };
  await assert.rejects(()=>resolveAgentForVendor(sb,{id:'v1',user_id:'USERS-ID'},'USERS-ID'),
    (e)=>/WRONG IDENTITY PLANE/.test(e.message) && /F-05\.47/.test(e.message) && /resolveAuthUserId/.test(e.message));
});
await ta('§4.2 the RIGHT plane passes the fence untouched', async () => {
  const {resolveAgentForVendor}=require(P('src/api/middleware/agentBridge.js'));
  const sb={ from:()=>({select:()=>({eq:()=>({maybeSingle:async()=>({data:{auth_user_id:'AUTH-REAL'}})})})}),
             schema:()=>({from:()=>{throw new Error('REACHED-ENGINE');}}) };
  await assert.rejects(()=>resolveAgentForVendor(sb,{id:'v1',user_id:'USERS-ID'},'AUTH-REAL'),
    (e)=>/REACHED-ENGINE/.test(e.message), 'a correct caller must get PAST the fence');
});

H('§5 — THE FOUNDER\'S BYTES');
t('§5.1 the holding line is his paste, byte-exact, and labeled at site', () => {
  const s=read('src/lib/prospectCopy.js');
  assert.ok(s.includes('Good to hear from you — thanks for reaching out! Tell me a bit about your business whenever you like.'));
  assert.ok(!/come back to you properly/.test(s),'the promise with no machinery survived');
  assert.ok(/promise-with-no-machinery|NOTHING BUILT TO COME BACK/.test(s),'the label must name the class');
});

H('§6 — NON-VACUOUS: RED AT THE UNCURED TREE');
if(!process.env.M6_BENCH_CHILD){
  const {execFileSync}=require('child_process');
  const M=[
    {cell:'§1.1',why:'a write escapes the home — the seven become six',file:'src/agent/brideEngine.js',
     from:'  const { data, error } = await deleteCoupleEvent(supabase, {\n    coupleId: couple.id, eventId: event_id,',
     to:"  const { data, error } = await supabase.from('events').delete().eq('id', event_id).eq('couple_id', couple.id).select('id').single(); const _u = ({"},
    {cell:'§1.4',why:'the gate goes optional — a writer whose ownership check is optional is a suggestion',
     file:'src/lib/coupleEventWrite.js', from:'  if (!coupleId) return', to:'  if (false) return'},
    {cell:'§2.1',why:'one couple door reverts to a sid-less row — RF-1 blind on that door',
     file:'src/lib/vendorInbound.js', from:'.insert(webhookCore.inboundRow({', to:'.insert(({'},
    {cell:'§3.1',why:"the mislabel returns — a web summary stamped whatsapp",
     file:'src/agent/brideEngine.js', from:"                channel:         'web',", to:"                channel:         'whatsapp',"},
    {cell:'§4.1',why:'the fence goes silent — the next deviant caller becomes unfindable',
     file:'src/api/middleware/agentBridge.js', from:'    if (expected && authUserId !== expected) {', to:'    if (false) {'},
  ];
  for(const m of M){
    const abs=P(m.file), orig=fs.readFileSync(abs,'utf8');
    try{
      if(!orig.includes(m.from)){console.log(`  FAIL ${m.cell} MUTATION anchor stale in ${m.file}`);fail++;continue;}
      fs.writeFileSync(abs,orig.replace(m.from,m.to));
      let red=false,out='';
      try{execFileSync(process.execPath,[P('scripts/b05_arc_m6_bench.js')],{env:{...process.env,M6_BENCH_CHILD:'1'},encoding:'utf8',stdio:'pipe'});}
      catch(e){red=true;out=String(e.stdout||'');}
      if(!red){console.log(`  FAIL ${m.cell} MUTATION stayed GREEN — ${m.why}`);fail++;}
      else if(!out.includes(`FAIL ${m.cell}`)){console.log(`  FAIL ${m.cell} red on the wrong cell — ${m.why}`);fail++;}
      else{console.log(`  ok   ${m.cell} RED at the uncured tree — ${m.why}`);pass++;}
    } finally{ fs.writeFileSync(abs,orig); }
  }
  t('§6.0 every mutated file restored BYTE-IDENTICAL',()=>{ for(const m of M) assert.ok(fs.readFileSync(P(m.file),'utf8').includes(m.from),m.file); });
}
console.log(`\n════════  ${pass} passed, ${fail} failed  ════════`);
if(fail===0) console.log('GREEN — the couple plane has one writer, four doors carry their wamid, and the fence speaks.');
process.exit(fail===0?0:1);
})();
