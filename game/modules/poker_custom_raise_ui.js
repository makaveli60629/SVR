// PHASE-116-CUSTOM-RAISE-INPUT-LOCK
// Game-side only. Adds compact custom raise input for the playable poker engine.

const PHASE = "PHASE-116-CUSTOM-RAISE-INPUT-LOCK";
let root, input, btn, note;

function isPreview(){ const p = new URLSearchParams(location.search); return document.body.classList.contains('preview-mode') || p.has('preview') || p.get('cam') === 'director'; }
function poker(){ return window.SVR_PLAYABLE_POKER || null; }
function state(){ return poker()?.getState?.() || null; }
function canRaise(s){ return !!s?.awaitingPlayer && !!s?.legal?.canRaise; }
function check(s, value){
  const legal = s?.legal || {};
  const amount = Number(value);
  if (!canRaise(s)) return { ok:false, text:s?.awaitingPlayer ? 'Raise locked' : 'Not your turn' };
  if (!Number.isFinite(amount)) return { ok:false, text:'Enter amount' };
  if (amount < legal.minRaiseTo) return { ok:false, text:'Minimum raise is $' + legal.minRaiseTo };
  if (amount > legal.maxRaiseTo) return { ok:false, text:'Maximum raise is $' + legal.maxRaiseTo };
  return { ok:true, text:'Raise to $' + Math.floor(amount) };
}
function style(){
  if (document.getElementById('svr-custom-raise-style')) return;
  const s = document.createElement('style');
  s.id = 'svr-custom-raise-style';
  s.textContent = '#svrCustomRaise{position:fixed;right:12px;bottom:250px;z-index:39;width:min(330px,calc(100vw - 24px));border:1px solid rgba(246,226,127,.42);border-radius:16px;background:rgba(5,8,16,.9);color:#f6f3ff;padding:10px;box-shadow:0 16px 44px rgba(0,0,0,.46);font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;pointer-events:auto}#svrCustomRaise.svr-hidden{display:none!important}#svrCustomRaise .title{font-size:12px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;color:#f6e27f;margin-bottom:7px}#svrCustomRaise .row{display:flex;gap:7px}#svrCustomRaise input{flex:1;min-width:0;border:1px solid rgba(180,140,255,.42);border-radius:12px;background:rgba(255,255,255,.08);color:#fff;padding:9px 10px;font-weight:900;font-size:15px}#svrCustomRaise button{border:1px solid rgba(127,245,199,.48);border-radius:12px;background:rgba(127,245,199,.10);color:#eafff4;padding:9px 11px;font-weight:900;cursor:pointer}#svrCustomRaise button:disabled{opacity:.4;cursor:not-allowed}#svrCustomRaise .note{margin-top:7px;font-size:12px;color:rgba(246,243,255,.72)}#svrCustomRaise .good{color:#7ff5c7}#svrCustomRaise .bad{color:#ffb8c2}body.preview-mode #svrCustomRaise{display:none!important}';
  document.head.appendChild(s);
}
function make(){
  if (root || isPreview()) return;
  style();
  root = document.createElement('section');
  root.id = 'svrCustomRaise';
  root.innerHTML = '<div class="title">Custom Raise</div><div class="row"><input id="svrCustomRaiseInput" type="number" min="0" step="10" inputmode="numeric"><button id="svrCustomRaiseBtn">Raise</button></div><div class="note" id="svrCustomRaiseNote">Waiting...</div>';
  document.body.appendChild(root);
  input = root.querySelector('#svrCustomRaiseInput');
  btn = root.querySelector('#svrCustomRaiseBtn');
  note = root.querySelector('#svrCustomRaiseNote');
  btn.addEventListener('click', function(e){
    e.preventDefault(); e.stopPropagation();
    const s = state();
    const c = check(s, input.value);
    if (!c.ok){
      try { window.SVR_PHASE95_POKER_FEEDBACK_FX?.showToast?.({ title:'Raise Blocked', body:c.text, sub:'Custom raise', kind:'warn', ms:1800 }); } catch {}
      return;
    }
    const p = poker();
    const ok = p?.raiseTo?.(Number(input.value)) || p?.raiseCustom?.(Number(input.value));
    if (!ok) try { window.SVR_PHASE95_POKER_FEEDBACK_FX?.showToast?.({ title:'Raise Blocked', body:'Poker engine rejected amount', sub:'Custom raise', kind:'warn', ms:1800 }); } catch {}
  });
}
function render(){
  if (!root) make();
  if (!root) return;
  const s = state();
  const legal = s?.legal || {};
  root.classList.toggle('svr-hidden', !s || s.street === 'showdown' || s.street === 'idle');
  if (!input.value && legal.minRaiseTo) input.value = legal.minRaiseTo;
  input.min = legal.minRaiseTo || 0;
  input.max = legal.maxRaiseTo || 0;
  const c = check(s, input.value || legal.minRaiseTo);
  btn.disabled = !c.ok;
  note.textContent = c.text + ' | Range $' + (legal.minRaiseTo || '--') + '-$' + (legal.maxRaiseTo || '--');
  note.className = 'note ' + (c.ok ? 'good' : 'bad');
}
function boot(){
  make();
  window.SVR_PHASE116_CUSTOM_RAISE_UI = { phase: PHASE, render };
  setInterval(render, 220);
  setTimeout(render, 400);
}
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once:true }); else boot();
