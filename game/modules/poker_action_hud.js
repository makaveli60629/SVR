// PHASE-91-QUEST-PERFORMANCE-PASS-LOCK
// Game-side only. Keeps the desktop/Android poker HUD touch-friendly while
// throttling DOM updates so Quest/mobile/desktop previews do less layout work.

const PHASE = "PHASE-91-QUEST-PERFORMANCE-PASS-LOCK";
const HUD_UPDATE_MS = 250;

function isPreviewMode(){
  const params = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || params.has("preview") || params.get("cam") === "director";
}

function makeButton(label, title, action){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "svr-poker-hud-btn";
  btn.textContent = label;
  btn.title = title;
  btn.addEventListener("click", (event)=>{
    event.preventDefault();
    event.stopPropagation();
    try { action?.(); } catch (err) { console.warn("[SVR Poker HUD] action failed", label, err); }
  });
  return btn;
}

function injectStyles(){
  if (document.getElementById("svr-poker-hud-style")) return;
  const style = document.createElement("style");
  style.id = "svr-poker-hud-style";
  style.textContent = `
    #svrPokerHud { position: fixed; right: 12px; bottom: 70px; z-index: 38; width: min(470px, calc(100vw - 24px)); border: 1px solid rgba(180,140,255,.48); border-radius: 18px; padding: 10px; color: #f4f0ff; background: linear-gradient(135deg, rgba(5,8,16,.86), rgba(23,10,42,.88)); box-shadow: 0 18px 50px rgba(0,0,0,.50), inset 0 0 22px rgba(120,70,255,.08); backdrop-filter: blur(10px); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; pointer-events: auto; user-select: none; contain: layout paint style; }
    #svrPokerHud.svr-hidden { display: none !important; }
    #svrPokerHud .svr-poker-hud-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
    #svrPokerHud .svr-poker-hud-title { font-size: 13px; letter-spacing:.12em; text-transform: uppercase; color:#dcd2ff; font-weight:800; }
    #svrPokerHud .svr-poker-hud-badge { font-size: 11px; color:#7ff5c7; border:1px solid rgba(127,245,199,.35); border-radius:999px; padding:3px 8px; }
    #svrPokerHud .svr-poker-hud-state { font-size: 12px; line-height:1.35; color:rgba(245,242,255,.88); margin-bottom:9px; min-height: 52px; }
    #svrPokerHud .svr-poker-hud-turn { color:#f6e27f; font-weight:800; }
    #svrPokerHud .svr-poker-hud-actions { display:grid; grid-template-columns: repeat(5, 1fr); gap:7px; }
    #svrPokerHud .svr-poker-hud-btn { min-height: 38px; border: 1px solid rgba(180,140,255,.45); border-radius: 12px; background: rgba(255,255,255,.075); color: #fff; font-size: 12px; font-weight: 800; cursor: pointer; text-transform: uppercase; touch-action: manipulation; }
    #svrPokerHud .svr-poker-hud-btn:hover, #svrPokerHud .svr-poker-hud-btn:focus { background: rgba(180,140,255,.28); outline: none; border-color: rgba(246,226,127,.78); }
    #svrPokerHud .svr-poker-hud-small { font-size: 11px; color:rgba(245,242,255,.62); margin-top:8px; }
    body.svr-low-perf #svrPokerHud { backdrop-filter: none; box-shadow: 0 10px 24px rgba(0,0,0,.42); }
    @media (max-width: 640px){ #svrPokerHud { left: 8px; right: 8px; bottom: 64px; width: auto; } #svrPokerHud .svr-poker-hud-actions { grid-template-columns: repeat(3, 1fr); } }
  `;
  document.head.appendChild(style);
}

function getPoker(){ return window.SVR_PLAYABLE_POKER || null; }

function createHud(){
  injectStyles();
  const root = document.createElement("section");
  root.id = "svrPokerHud";
  root.setAttribute("aria-label", "SVR Poker action controls");
  root.innerHTML = `
    <div class="svr-poker-hud-top">
      <div class="svr-poker-hud-title">SVR Poker Controls</div>
      <div class="svr-poker-hud-badge">${PHASE.replace("PHASE-91-", "")}</div>
    </div>
    <div class="svr-poker-hud-state" id="svrPokerHudState">Waiting for poker engine…</div>
    <div class="svr-poker-hud-actions" id="svrPokerHudActions"></div>
    <div class="svr-poker-hud-small">Desktop keys: F Fold • C Check/Call • R Raise • A All-In • H Next</div>
  `;
  const actions = root.querySelector("#svrPokerHudActions");
  actions.append(
    makeButton("Fold", "Fold current hand", ()=>getPoker()?.fold?.()),
    makeButton("Check/Call", "Check or call", ()=>getPoker()?.checkCall?.()),
    makeButton("Raise", "Raise minimum", ()=>getPoker()?.raise?.()),
    makeButton("All-In", "Move full stack", ()=>getPoker()?.allIn?.()),
    makeButton("Next", "Start next hand", ()=>getPoker()?.nextHand?.())
  );
  document.body.appendChild(root);
  return root;
}

function formatCards(cards){ return Array.isArray(cards) && cards.length ? cards.join(" ") : "--"; }

function stateSignature(state){
  if (!state) return "none";
  return [state.handNumber, state.street, state.pot, state.toCall, state.awaitingPlayer, state.activeName, state.winnerText, state.lastAction, formatCards(state.board), formatCards(state.playerCards)].join("|");
}

function renderHud(root, state){
  const stateEl = root.querySelector("#svrPokerHudState");
  if (!stateEl || !state) return;
  const callText = state.toCall > 0 ? `Call $${state.toCall}` : "Check";
  stateEl.innerHTML = `
    <span class="${state.awaitingPlayer ? "svr-poker-hud-turn" : ""}">${state.awaitingPlayer ? "YOUR TURN" : `Active: ${state.activeName || "--"}`}</span>
    • ${String(state.street || "ready").toUpperCase()}
    • Pot $${state.pot || 0}
    • ${callText}<br>
    Board: ${formatCards(state.board)} • Hand: ${formatCards(state.playerCards)}<br>
    ${state.winnerText || state.lastAction || "Hand running"}
  `;
}

function updateHud(root, cache){
  if (!root) return;
  if (isPreviewMode()){
    root.classList.add("svr-hidden");
    return;
  }
  const poker = getPoker();
  const stateEl = root.querySelector("#svrPokerHudState");
  if (!poker?.getState){
    root.classList.remove("svr-hidden");
    if (stateEl && cache.lastSig !== "waiting") stateEl.textContent = "Waiting for playable poker engine…";
    cache.lastSig = "waiting";
    return;
  }
  root.classList.remove("svr-hidden");
  const state = poker.getState();
  const sig = stateSignature(state);
  if (sig === cache.lastSig) return;
  cache.lastSig = sig;
  renderHud(root, state);
}

function boot(){
  if (document.getElementById("svrPokerHud")) return;
  const root = createHud();
  const cache = { lastSig: "", lastAt: 0 };
  window.SVR_POKER_ACTION_HUD = { phase: PHASE, root, update: ()=>updateHud(root, cache) };
  const loop = (now) => {
    if (!cache.lastAt || now - cache.lastAt >= HUD_UPDATE_MS){
      cache.lastAt = now;
      updateHud(root, cache);
    }
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
