const { runTurn } = require('./src/engine/dist/core/loop');
(async () => {
  const r = await runTurn({ agentId: '4b7c9ea1-245b-44ce-b9d2-fe92987239df', message: process.argv[2] });
  console.log('\n=== VICTOR ===\n' + r.reply);
  console.log('\n=== tools ===', JSON.stringify((r.tool_calls||[]).map(t=>t.name)));
})().catch(e => { console.error('crashed:', e.message); process.exit(1); });
