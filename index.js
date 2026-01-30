// /index.js — PERMANENT ENTRY (LOUD)
import { Spine } from './spine.js';

const diag = document.getElementById('diag');
const say = (m) => {
  console.log(m);
  if (diag) diag.textContent += `\n${m}`;
};

say('[index] module loaded ✅');

window.addEventListener('error', (e) => {
  say(`[window.error] ${e.message}`);
});
window.addEventListener('unhandledrejection', (e) => {
  say(`[unhandledrejection] ${String(e.reason || e)}`);
});

try {
  Spine.start({ say });
  say('[index] Spine.start() called ✅');
} catch (err) {
  say(`[index] Spine.start() crashed ❌ ${err?.message || err}`);
}
