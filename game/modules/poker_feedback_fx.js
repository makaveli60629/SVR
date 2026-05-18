// PHASE-95-POKER-FEEDBACK-FX-LOCK
// Game-side only. Adds lightweight poker feedback: turn toast, action toast,
// winner toast, and WebAudio cues after user interaction. No website/site edits.

const PHASE = "PHASE-95-POKER-FEEDBACK-FX-LOCK";
const UPDATE_MS = 180;

let audioCtx = null;
let audioUnlocked = false;
let root = null;
let stateEl = null;
let lastSig = "";
let lastTurn = false;
let lastWinner = "";
let lastAction = "";
let hideTimer = 0;

function injectStyle(){
  if (document.getElementById("svr-poker-feedback-style")) return;
  const style = document.createElement("style");
  style.id = "svr-poker-feedback-style";
  style.textContent = `
    #svrPokerFeedback {
      position: fixed;
      left: 50%;
      top: 82px;
      transform: translateX(-50%);
      z-index: 44;
      min-width: min(520px, calc(100vw - 24px));
      max-width: calc(100vw - 24px);
      border: 1px solid rgba(127,245,199,.48);
      border-radius: 18px;
      padding: 10px 14px;
      background: linear-gradient(135deg, rgba(4,8,16,.88), rgba(22,9,42,.90));
      color: #f6f3ff;
      box-shadow: 0 18px 46px rgba(0,0,0,.46), inset 0 0 18px rgba(127,245,199,.07);
      backdrop-filter: blur(9px);
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif;
      pointer-events: none;
      opacity: 0;
      transition: opacity .18s ease, transform .18s ease;
      contain: layout paint style;
      text-align: center;
    }
    #svrPokerFeedback.svr-show { opacity: 1; transform: translateX(-50%) translateY(0); }
    #svrPokerFeedback.svr-warn { border-color: rgba(246,226,127,.72); }
    #svrPokerFeedback.svr-win { border-color: rgba(127,245,199,.90); }
    #svrPokerFeedback .svr-feedback-title { font-weight: 900; font-size: 14px; letter-spacing: .10em; text-transform: uppercase; color: #7ff5c7; margin-bottom: 3px; }
    #svrPokerFeedback.svr-warn .svr-feedback-title { color: #f6e27f; }
    #svrPokerFeedback .svr-feedback-body { font-weight: 800; font-size: 17px; line-height: 1.24; }
    #svrPokerFeedback .svr-feedback-sub { font-size: 12px; color: rgba(246,243,255,.72); margin-top: 4px; }
    body.preview-mode #svrPokerFeedback { display: none !important; }
    body.svr-low-perf #svrPokerFeedback { backdrop-filter: none; box-shadow: 0 8px 20px rgba(0,0,0,.38); }
    @media (max-width: 640px){ #svrPokerFeedback { top: 74px; padding: 9px 10px; } #svrPokerFeedback .svr-feedback-body { font-size: 15px; } }
  `;
  document.head.appendChild(style);
}

function makeRoot(){
  injectStyle();
  const el = document.createElement("section");
  el.id = "svrPokerFeedback";
  el.setAttribute("aria-live", "polite");
  el.innerHTML = `
    <div class="svr-feedback-title">SVR Poker</div>
    <div class="svr-feedback-body" id="svrPokerFeedbackBody">Ready</div>
    <div class="svr-feedback-sub" id="svrPokerFeedbackSub">Phase 95 feedback enabled</div>
  `;
  document.body.appendChild(el);
  stateEl = {
    body: el.querySelector("#svrPokerFeedbackBody"),
    sub: el.querySelector("#svrPokerFeedbackSub"),
    title: el.querySelector(".svr-feedback-title")
  };
  return el;
}

function unlockAudio(){
  if (audioUnlocked) return;
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    audioCtx = audioCtx || new Ctx();
    audioCtx.resume?.();
    audioUnlocked = true;
  } catch {}
}

function beep(kind = "action"){
  if (!audioUnlocked || !audioCtx) return;
  try {
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    const freq = kind === "turn" ? 660 : kind === "win" ? 880 : kind === "warn" ? 220 : 440;
    osc.type = kind === "win" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(freq, now);
    if (kind === "win") osc.frequency.exponentialRampToValueAtTime(freq * 1.28, now + 0.16);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(kind === "win" ? 0.070 : 0.040, now + 0.018);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (kind === "win" ? 0.32 : 0.13));
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + (kind === "win" ? 0.35 : 0.16));
  } catch {}
}

function isPreview(){
  const params = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || params.has("preview") || params.get("cam") === "director";
}

function showToast({ title = "SVR Poker", body = "", sub = "", kind = "action", ms = 2200 }){
  if (!root || isPreview()) return;
  stateEl.title.textContent = title;
  stateEl.body.textContent = body;
  stateEl.sub.textContent = sub;
  root.classList.toggle("svr-warn", kind === "turn" || kind === "warn");
  root.classList.toggle("svr-win", kind === "win");
  root.classList.add("svr-show");
  clearTimeout(hideTimer);
  hideTimer = setTimeout(()=>root?.classList.remove("svr-show"), ms);
  beep(kind);
}

function stateSignature(state){
  if (!state) return "none";
  return [state.handNumber, state.street, state.pot, state.toCall, state.awaitingPlayer, state.activeName, state.winnerText, state.lastAction].join("|");
}

function processState(state){
  if (!state) return;
  const sig = stateSignature(state);
  if (sig === lastSig) return;
  lastSig = sig;

  if (state.awaitingPlayer && !lastTurn){
    showToast({
      title: "Your Turn",
      body: state.toCall > 0 ? `Call $${state.toCall}, raise, or fold` : "Check, raise, or fold",
      sub: `Street: ${String(state.street || "ready").toUpperCase()} • Pot $${state.pot || 0}`,
      kind: "turn",
      ms: 3600
    });
  }
  lastTurn = !!state.awaitingPlayer;

  if (state.winnerText && state.winnerText !== lastWinner){
    lastWinner = state.winnerText;
    showToast({
      title: "Winner",
      body: state.winnerText,
      sub: state.winnerDetails || state.lastAction || "Hand complete",
      kind: "win",
      ms: 5200
    });
    return;
  }

  if (state.lastAction && state.lastAction !== lastAction && !state.awaitingPlayer){
    lastAction = state.lastAction;
    const lower = String(state.lastAction).toLowerCase();
    if (lower.includes("illegal") || lower.includes("blocked")){
      showToast({ title: "Action Blocked", body: state.lastAction, sub: "Wait for a legal turn/action", kind: "warn", ms: 2600 });
    } else if (lower.includes(":")){
      showToast({ title: "Table Action", body: state.lastAction, sub: `Pot $${state.pot || 0}`, kind: "action", ms: 1500 });
    }
  }
}

function boot(){
  if (window.SVR_PHASE95_POKER_FEEDBACK_FX) return;
  root = makeRoot();
  document.addEventListener("pointerdown", unlockAudio, { passive: true });
  document.addEventListener("keydown", unlockAudio, { passive: true });
  window.SVR_PHASE95_POKER_FEEDBACK_FX = { phase: PHASE, showToast, audioUnlocked: () => audioUnlocked };
  let last = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (now - last < UPDATE_MS) return;
    last = now;
    const poker = window.SVR_PLAYABLE_POKER;
    processState(poker?.getState?.());
  };
  requestAnimationFrame(loop);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
