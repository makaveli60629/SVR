import "./private_scene_runtime_phase158.js";

const PHASE = "PHASE-160-SCORPION-CARD-FLOW-WINNER-BANNER-LOCK";
const params = new URLSearchParams(location.search);
const sceneKey = (params.get("scene") || "private").toLowerCase();

window.SVR_PHASE160_SCORPION_CARD_FLOW = {
  phase: PHASE,
  scene: sceneKey,
  scope: "Scorpion private room card flow, winner banner, and pot visual effects",
  officialLogo: "../logo.png",
  noMusic: true,
  noWatch: true,
  activeOnlyInScorpion: true,
  lockedRules: {
    readableCards: true,
    leftToRightDealing: true,
    actionTimerSeconds: 20,
    autoCheckWhenFree: true,
    autoFoldWhenFacingBet: true,
    autoStagedCallAmount: true,
    winnerBanner: true,
    potVacuumVisual: true,
    onePrivateTable: true
  },
  nextBuild: "PHASE-161-SCORPION-TABLE-CARD-MESHES-ACTION-BUTTONS"
};

const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
const titleEl = document.getElementById("title");
function setStatus(t){ if(statusEl) statusEl.textContent = t; }
function setMode(t){ if(modeEl) modeEl.textContent = t; }
if(titleEl) titleEl.textContent = "PHASE-160";

const css = document.createElement("style");
css.textContent = "#svrPhase160Panel{position:fixed;right:12px;bottom:12px;z-index:150;width:min(500px,calc(100vw - 24px));padding:12px;border:1px solid rgba(255,85,114,.95);border-radius:18px;background:rgba(0,0,0,.88);color:#fff;font:900 12px/1.35 system-ui;box-shadow:0 16px 44px rgba(0,0,0,.65);pointer-events:none}.svr160-row{display:flex;justify-content:space-between;gap:10px;margin:3px 0;color:#ffd7df}.svr160-cards{display:flex;gap:8px;flex-wrap:wrap;margin:8px 0}.svr160-card{width:54px;height:76px;border-radius:8px;background:#fff;color:#111;display:grid;place-items:center;font-size:26px;font-weight:1000;box-shadow:0 6px 18px rgba(0,0,0,.55);border:2px solid #f6e27f}.svr160-red{color:#c80030}.svr160-board .svr160-card{width:48px;height:68px;font-size:22px}.svr160-banner{margin:8px 0;padding:10px;border:1px solid #f6e27f;border-radius:12px;background:linear-gradient(90deg,rgba(255,85,114,.25),rgba(180,140,255,.25));color:#f6e27f;text-align:center;font-size:16px}.svr160-pot{height:10px;border-radius:99px;background:rgba(255,255,255,.12);overflow:hidden;margin:8px 0}.svr160-pot>i{display:block;height:100%;width:var(--w,20%);background:linear-gradient(90deg,#ff5572,#f6e27f,#b48cff);transition:width .45s ease}.svr160-chipline{height:28px;position:relative;margin-top:7px;border-top:1px solid rgba(255,255,255,.12)}.svr160-chip{position:absolute;top:6px;width:16px;height:16px;border-radius:50%;background:#f6e27f;box-shadow:0 0 12px #f6e27f;transition:left .55s ease}.svr160-muted{color:#b8a8d8}.svr160-actions{display:flex;gap:6px;flex-wrap:wrap;margin-top:8px}.svr160-action{border:1px solid rgba(180,140,255,.8);border-radius:999px;padding:5px 8px;color:#e6d7ff;background:rgba(180,140,255,.12)}";
document.head.appendChild(css);

const panel = document.createElement("div");
panel.id = "svrPhase160Panel";
document.body.appendChild(panel);

const deck = ["AS","KS","QH","JD","10C","9S","8H","7D","6C","5S","4H","3D","2C","AH","KD","QC","JS","10H","9D","8C","7S"];
let deckIndex = 0, street = "PREFLOP", timer = 20, pot = 0, playerStack = 500, botStack = 500;
let community = [], hero = [], bot = [], banner = "SCORPION READY", action = "WAITING", anim = 0;
let lastTick = performance.now(), handNumber = 0;

function red(card){ return /H|D/.test(card); }
function cardHtml(card){ return `<span class="svr160-card ${red(card)?"svr160-red":""}">${card}</span>`; }
function draw(){ const c = deck[deckIndex % deck.length]; deckIndex += 1; return c; }
function startHand(){
  handNumber += 1; street = "PREFLOP"; timer = 20; pot = 30; community = [];
  hero = [draw(), draw()]; bot = [draw(), draw()];
  banner = `HAND ${handNumber} - LEFT TO RIGHT DEAL`;
  action = "Auto-staged call ready - check if free"; anim = 15;
  window.SVR_PHASE160_LAST_HAND = { at:new Date().toISOString(), handNumber, street, hero:[...hero], bot:[...bot], community:[...community], pot };
}
function nextStreet(){
  timer = 20; anim = Math.min(95, anim + 20);
  if(street === "PREFLOP"){ street = "FLOP"; community = [draw(), draw(), draw()]; pot += 35; banner = "FLOP DEALT - AUTO CHECK WHEN FREE"; action = "Player can check/call - raise adds extra only"; }
  else if(street === "FLOP"){ street = "TURN"; community.push(draw()); pot += 25; banner = "TURN DEALT - ACTION TIMER RESET"; action = "Call amount auto-staged"; }
  else if(street === "TURN"){ street = "RIVER"; community.push(draw()); pot += 25; banner = "RIVER DEALT - FINAL ACTION"; action = "Auto-fold only if facing bet and timer expires"; }
  else { showdown(); return; }
  window.SVR_PHASE160_LAST_HAND = { at:new Date().toISOString(), handNumber, street, hero:[...hero], bot:[...bot], community:[...community], pot, action };
}
function showdown(){
  street = "SHOWDOWN"; timer = 0;
  const winner = (handNumber % 2 === 1) ? "PLAYER" : "BOT NOVA";
  if(winner === "PLAYER") playerStack += pot; else botStack += pot;
  banner = `WINNER: ${winner} - ${pot} POT`;
  action = "Winning hand display + pot vacuum visual";
  anim = winner === "PLAYER" ? 100 : 5;
  window.SVR_PHASE160_LAST_WINNER = { at:new Date().toISOString(), handNumber, winner, pot, hero:[...hero], bot:[...bot], community:[...community], display:"Winner banner and pot vacuum visual active" };
  setTimeout(startHand, 3600);
}
function render(){
  if(sceneKey !== "scorpion"){
    panel.innerHTML = `<div class="svr160-banner">PHASE 160</div><div>${sceneKey.toUpperCase()} room preserved.</div><div class="svr160-muted">Scorpion gameplay visuals are active only in the Scorpion private room.</div>`;
    return;
  }
  const board = community.length ? community.map(cardHtml).join("") : `<span class="svr160-muted">No board yet</span>`;
  panel.innerHTML = `<div class="svr160-banner">${banner}</div><div class="svr160-row"><b>Street</b><span>${street}</span></div><div class="svr160-row"><b>Action timer</b><span>${timer}s</span></div><div class="svr160-row"><b>Pot</b><span>${pot}</span></div><div class="svr160-pot" style="--w:${Math.min(100,pot/2)}%"><i></i></div><div class="svr160-row"><b>Player stack</b><span>${playerStack}</span></div><div class="svr160-cards">${hero.map(cardHtml).join("")}</div><div class="svr160-row"><b>Board</b><span>${community.length}/5</span></div><div class="svr160-cards svr160-board">${board}</div><div class="svr160-row"><b>Bot stack</b><span>${botStack}</span></div><div class="svr160-muted">Bot cards hidden until showdown: ${street === "SHOWDOWN" ? bot.map(cardHtml).join(" ") : "-- --"}</div><div class="svr160-actions"><span class="svr160-action">AUTO CHECK</span><span class="svr160-action">AUTO FOLD IF FACING BET</span><span class="svr160-action">CALL AUTO-STAGED</span><span class="svr160-action">RAISE EXTRA ONLY</span></div><div class="svr160-chipline"><span class="svr160-chip" style="left:${anim}%"></span></div><div class="svr160-muted">${action}</div>`;
}
function tick(){
  const now = performance.now();
  if(sceneKey === "scorpion" && street !== "SHOWDOWN" && now - lastTick > 1000){
    lastTick = now; timer -= 1;
    if(timer <= 0){ action = street === "PREFLOP" ? "Timeout rule: auto-check if free / auto-fold if facing bet" : "Timeout rule: auto-check when legal"; nextStreet(); }
  }
  render(); requestAnimationFrame(tick);
}
setTimeout(()=>{
  if(sceneKey === "scorpion") { setStatus("Phase 160 Scorpion card flow online"); setMode("Winner banner + pot visual"); startHand(); }
  else { setStatus("Phase 160 room preserved"); setMode("Scorpion visuals inactive here"); }
  tick();
}, 800);
