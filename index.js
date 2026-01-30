import { Spine } from './spine.js';

function makeDiag() {
  const el = document.getElementById('diag');
  const write = (level, msg) => {
    const line = `[${level}] ${msg}`;
    if (el) el.textContent += `\n${line}`;
    console.log(line);
  };
  return {
    log: (m)=>write('log', m),
    warn: (m)=>write('warn', m),
    error: (m)=>write('error', m),
  };
}

const diag = makeDiag();

window.addEventListener('error', (e) => {
  diag.error(e?.message || 'window error');
});

window.addEventListener('unhandledrejection', (e) => {
  diag.error('unhandledrejection: ' + (e?.reason?.message || e?.reason || 'unknown'));
});

diag.log('index.js loaded ✅');
diag.log('starting spine…');

window.SCARLETT = Spine;

Spine.start({ diag }).catch(err => {
  diag.error('Spine.start failed: ' + (err?.message || err));
});
