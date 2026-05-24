import "./private_scene_runtime_phase158.js";

const PHASE = "PHASE-159-SCORPION-ROOM-GAMEPLAY-FIRST-LOCK";
const params = new URLSearchParams(location.search);
const sceneKey = (params.get("scene") || "private").toLowerCase();

window.SVR_PHASE159_SCORPION_GAMEPLAY = {
  phase: PHASE,
  scene: sceneKey,
  scope: "Scorpion private room gameplay first pass",
  officialLogo: "../logo.png",
  noMusic: true,
  noWatch: true,
  gameplay: sceneKey === "scorpion",
  lockedRules: {
    readableCards: true,
    leftToRightDealing: true,
    actionTimerSeconds: 20,
    autoCheckWhenFree: true,
    autoFoldWhenFacingBet: true,
    noManualChipGrabRequiredForCall: true,
    onePrivateTable: true
  },
  nextBuild: "PHASE-160-SCORPION-REAL-CARD-FLOW-AND-WINNER-BANNER"
};

const statusEl = document.getElementById("status");
const modeEl = document.getElementById("mode");
const titleEl = document.getElementById("title");
function setStatus(t){ if(statusEl) statusEl.textContent = t; }
function setMode(t){ if(modeEl) modeEl.textContent = t; }
if(titleEl) titleEl.textContent = "PHASE-159";

const panel = document.createElement("div");
panel.style.cssText = "position:fixed;right:12px;bottom:12px;z-index:140;width:min(420px,calc(100vw - 24px));padding:12px 14px;border:1px solid rgba(255,85,114,.95);border-radius:16px;background:rgba(0,0,0,.86);color:#fff;font:900 12px/1.38 system-ui;white-space:pre-wrap;pointer-events:none;box-shadow:0 14px 38px rgba(0,0,0,.6)";
document.body.appendChild(panel);

const cards = ["A♠","K♠","Q♥","J♦","10♣","9♠","8♥","7♦","6♣","5♠","4♥","3♦","2♣"];
let handIndex = 0;
let timer = 20;
let street = "PREFLOP";
let pot = 0;
let playerStack = 500;
let botStack = 500;
let lastAction = "READY";
let lastTick = performance.now();
let community = [];
let hero = [];
let bot = [];

function drawCard(){ const c = cards[handIndex % cards.length]; handIndex += 1; return c; }
function newHand(){
  timer = 20;
  street = "PREFLOP";
  pot = 30;
  hero = [drawCard(), drawCard()];
  bot = [drawCard(), drawCard()];
  community = [];
  lastAction = "NEW HAND • LEFT TO RIGHT DEAL";
  window.SVR_PHASE159_LAST_HAND = { at:new Date().toISOString(), hero:[...hero], bot:[...bot], community:[...community], pot, street };
}
function advanceStreet(){
  timer = 20;
  if(street === "PREFLOP") { street = "FLOP"; community = [drawCard(), drawCard(), drawCard()]; pot += 30; lastAction = "AUTO-CHECK WHEN FREE"; }
  else if(street === "FLOP") { street = "TURN"; community.push(drawCard()); pot += 20; lastAction = "CALL AUTO-STAGED"; }
  else if(street === "TURN") { street = "RIVER"; community.push(drawCard()); pot += 20; lastAction = "RAISE CONTROLS ONLY FOR EXTRA"; }
  else { showdown(); return; }
  window.SVR_PHASE159_LAST_HAND = { at:new Date().toISOString(), hero:[...hero], bot:[...bot], community:[...community], pot, street, lastAction };
}
function showdown(){
  const heroWin = (handIndex % 2) === 0;
  if(heroWin) playerStack += pot; else botStack += pot;
  lastAction = heroWin ? "WINNER: PLAYER • POT VACUUM READY" : "WINNER: BOT • POT VACUUM READY";
  street = "SHOWDOWN";
  window.SVR_PHASE159_LAST_WINNER = { at:new Date().toISOString(), winner: heroWin ? "PLAYER" : "BOT", pot, community:[...community], hero:[...hero], bot:[...bot] };
  setTimeout(newHand, 2500);
}
function render(){
  if(sceneKey !== "scorpion"){
    panel.textContent = `PHASE 159\n${sceneKey.toUpperCase()} room preserved.\nScorpion gameplay module is only active in the Scorpion private room.`;
    return;
  }
  panel.textContent = `PHASE 159 SCORPION GAMEPLAY\nStreet: ${street}  •  Timer: ${timer}s\nPot: ${pot}  •  Player: ${playerStack}  Bot: ${botStack}\nPlayer cards: ${hero.join("  ")}\nBoard: ${community.length ? community.join("  ") : "—"}\nAction: ${lastAction}\nRules: left-to-right deal • 20s timer • auto-check/free • auto-fold/facing bet`;
}
function loop(){
  const now = performance.now();
  if(sceneKey === "scorpion" && now - lastTick > 1000){
    lastTick = now;
    timer -= 1;
    if(timer <= 0){
      lastAction = street === "PREFLOP" ? "TIMEOUT: AUTO-CHECK/FOLD RULE" : "TIMEOUT: AUTO-CHECK";
      advanceStreet();
    }
  }
  render();
  requestAnimationFrame(loop);
}

setTimeout(()=>{
  if(sceneKey === "scorpion"){
    setStatus("Phase 159 Scorpion gameplay online");
    setMode("20s action timer active");
    newHand();
  } else {
    setStatus("Phase 159 private room preserved");
    setMode("Scorpion gameplay inactive here");
  }
  loop();
}, 800);
