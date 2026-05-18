// PHASE-107-RAISE-SIZING-HUD-LOCK
// Game-side only. Upgrades desktop/Android poker HUD with legal-action disabled
// states and explicit Min / Half-Pot / Pot raise choices. Poker logic remains in
// playable_poker.js.

const PHASE = "PHASE-107-RAISE-SIZING-HUD-LOCK";
const HUD_UPDATE_MS = 180;

const ACTIONS = [
  { key: "fold", label: "Fold", title: "Fold current hand", call: p => p?.fold?.() },
  { key: "call", label: "Check/Call", title: "Check or call", call: p => p?.checkCall?.() },
  { key: "raise", label: "Min Raise", title: "Raise minimum", call: p => p?.raise?.() },
  { key: "halfpot", label: "Half Pot", title: "Raise half pot", call: p => p?.raiseHalfPot?.() || p?.raise?.() },
  { key: "pot", label: "Pot", title: "Raise pot", call: p => p?.raisePot?.() || p?.raise?.() },
  { key: "allin", label: "All-In", title: "Move full stack", call: p => p?.allIn?.() },
  { key: "next", label: "Next", title: "Start next hand", call: p => p?.nextHand?.() }
];

function isPreviewMode(){
  const params = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || params.has("preview") || params.get("cam") === "director";
}

function getPoker(){ return window.SVR_PLAYABLE_POKER || null; }
function formatCards(cards){ return Array.isArray(cards) && cards.length ? cards.join(" ") : "--"; }

function canUseAction(state, key){
  if (!state) return false;
  const legal = state.legal || {};
  const playerTurn = !!state.awaitingPlayer;
  const ended = state.street === "showdown" || !!state.winnerText || state.street === "idle";
  if (key === "next") return ended;
  if (!playerTurn) return false;
  if (key === "fold") return !!legal.canFold;
  if (key === "call") return !!(legal.canCheck || legal.canCall);
  if (key === "raise" || key === "halfpot" || key === "pot") return !!legal.canRaise;
  if (key === "allin") return !!legal.canAllIn;
  return false;
}

function actionLabel(state, key, fallback){
  const legal = state?.legal || {};
  if (key === "call") return state?.toCall > 0 ? `Call $${state.toCall}` : "Check";
  if (key === "raise") return legal.minRaiseTo ? `Min $${legal.minRaiseTo}` : "Min Raise";
  if (key === "halfpot") return "Half Pot";
  if (key === "pot") return "Pot";
  if (key === "next") return state?.street === "showdown" || state?.winnerText ? "Next Hand" : "Next";
  return fallback;
}

function makeButton(def){
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "svr-poker-hud-btn";
  btn.dataset.action = def.key;
  btn.textContent = def.label;
  btn.title = def.title;
  btn.addEventListener("click", (event)=>{
    event.preventDefault();
    event.stopPropagation();
    if (btn.disabled) {
      try {
        window.SVR_PHASE95_POKER_FEEDBACK_FX?.showToast?.({
          title: "Action Disabled",
          body: btn.dataset.disabledReason || "Wait for a legal action",
          sub: "SVR Poker HUD",
          kind: "warn",
          ms: 1800
        });
      } catch {}
      return;
    }
    try { def.call?.(getPoker()); } catch (err) { console.warn("[SVR Poker HUD] action failed", def.label, err); }
  });
  return btn;
}

function injectStyles(){
  if (document.getElementById("svr-poker-hud-style")) return;
  const style = document.createElement("style");
  style.id = "svr-poker-hud-style";
  style.textContent = `
    #svrPokerHud { position: fixed; right: 12px; bottom: 70px; z-index: 38; width: min(540px, calc(100vw - 24px)); border: 1px solid rgba(180,140,255,.48); border-radius: 18px; padding: 10px; color: #f4f0ff; background: linear-gradient(135deg, rgba(5,8,16,.86), rgba(23,10,42,.88)); box-shadow: 0 18px 50px rgba(0,0,0,.50), inset 0 0 22px rgba(120,70,255,.08); backdrop-filter: blur(10px); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; pointer-events: auto; user-select: none; contain: layout paint style; }
    #svrPokerHud.svr-hidden { display: none !important; }
    #svrPokerHud .svr-poker-hud-top { display:flex; align-items:center; justify-content:space-between; gap:10px; margin-bottom:8px; }
    #svrPokerHud .svr-poker-hud-title { font-size: 13px; letter-spacing:.12em; text-transform: uppercase; color:#dcd2ff; font-weight:800; }
    #svrPokerHud .svr-poker-hud-badge { font-size: 11px; color:#7ff5c7; border:1px solid rgba(127,245,199,.35); border-radius:999px; padding:3px 8px; }
    #svrPokerHud .svr-poker-hud-state { font-size: 12px; line-height:1.35; color:rgba(245,242,255,.88); margin-bottom:9px; min-height: 60px; }
    #svrPokerHud .svr-poker-hud-turn { color:#f6e27f; font-weight:900; }
    #svrPokerHud .svr-poker-hud-actions { display:grid; grid-template-columns: repeat(7, 1fr); gap:7px; }
    #svrPokerHud .svr-poker-hud-btn { min-height: 38px; border: 1px solid rgba(180,140,255,.45); border-radius: 12px; background: rgba(255,255,255,.075); color: #fff; font-size: 11px; font-weight: 900; cursor: pointer; text-transform: uppercase; touch-action: manipulation; }
    #svrPokerHud .svr-poker-hud-btn:hover, #svrPokerHud .svr-poker-hud-btn:focus { background: rgba(180,140,255,.28); outline: none; border-color: rgba(246,226,127,.78); }
    #svrPokerHud .svr-poker-hud-btn:disabled { cursor: not-allowed; opacity: .38; color: rgba(255,255,255,.60); border-color: rgba(255,255,255,.18); background: rgba(255,255,255,.035); }
    #svrPokerHud .svr-poker-hud-btn[data-action="next"] { border-color: rgba(127,245,199,.44); }
    #svrPokerHud .svr-poker-hud-small { font-size: 11px; color:rgba(245,242,255,.62); margin-top:8px; }
    body.svr-low-perf #svrPokerHud { backdrop-filter: none; box-shadow: 0 10px 24px rgba(0,0,0,.42); }
    @media (max-width: 760px){ #svrPokerHud { left: 8px; right: 8px; bottom: 64px; width: auto; } #svrPokerHud .svr-poker-hud-actions { grid-template-columns: repeat(4, 1fr); } }
    @media (max-width: 430px){ #svrPokerHud .svr-poker-hud-actions { grid-template-columns: repeat(3, 1fr); } }
  `;
  document.head.appendChild(style);
}

function createHud(){
  injectStyles();
  const root = document.createElement("section");
  root.id = "svrPokerHud";
  root.setAttribute("aria-label", "SVR Poker action controls");
  root.innerHTML = `
    <div class="svr-poker-hud-top">
      <div class="svr-poker-hud-title">SVR Poker Controls</div>
      <div class="svr-poker-hud-badge">${PHASE.replace("PHASE-107-", "")}</div>
    </div>
    <div class="svr-poker-hud-state" id="svrPokerHudState">Waiting for poker engine…</div>
    <div class="svr-poker-hud-actions" id="svrPokerHudActions"></div>
    <div class="svr-poker-hud-small">Disabled buttons mean the action is not legal right now. Keyboard: F Fold • C Check/Call • R Min Raise • A All-In • H Next</div>
  `;
  const actions = root.querySelector("#svrPokerHudActions");
  actions.append(...ACTIONS.map(makeButton));
  document.body.appendChild(root);
  return root;
}

function stateSignature(state){
  if (!state) return "none";
  const legal = state.legal || {};
  return [
    state.handNumber, state.street, state.pot, state.toCall, state.awaitingPlayer,
    state.activeName, state.winnerText, state.lastAction,
    legal.canFold, legal.canCheck, legal.canCall, legal.canRaise, legal.canAllIn, legal.minRaiseTo,
    formatCards(state.board), formatCards(state.playerCards)
  ].join("|");
}

function updateButtons(root, state){
  for (const def of ACTIONS){
    const btn = root.querySelector(`[data-action="${def.key}"]`);
    if (!btn) continue;
    const enabled = canUseAction(state, def.key);
    btn.disabled = !enabled;
    btn.textContent = actionLabel(state, def.key, def.label);
    btn.dataset.disabledReason = !state?.awaitingPlayer && def.key !== "next"
      ? "It is not your turn."
      : def.key === "next"
        ? "Finish the hand before starting the next one."
        : "That action is not legal right now.";
  }
}

function renderHud(root, state){
  const stateEl = root.querySelector("#svrPokerHudState");
  if (!stateEl || !state) return;
  const legal = state.legal || {};
  const callText = state.toCall > 0 ? `Call $${state.toCall}` : "Check";
  const raiseText = legal.canRaise ? `Min raise to $${legal.minRaiseTo || "--"}` : "Raise locked";
  stateEl.innerHTML = `
    <span class="${state.awaitingPlayer ? "svr-poker-hud-turn" : ""}">${state.awaitingPlayer ? "YOUR TURN" : `Active: ${state.activeName || "--"}`}</span>
    • ${String(state.street || "ready").toUpperCase()}
    • Pot $${state.pot || 0}
    • ${callText} • ${raiseText}<br>
    Board: ${formatCards(state.board)} • Hand: ${formatCards(state.playerCards)}<br>
    ${state.winnerText || state.lastAction || "Hand running"}
  `;
  updateButtons(root, state);
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
  window.SVR_PHASE107_RAISE_SIZING_HUD = window.SVR_POKER_ACTION_HUD;
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
