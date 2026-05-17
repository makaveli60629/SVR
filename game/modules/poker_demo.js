import * as THREE from "three";
import { makeCanvasLabel, roundRect } from "./utils.js";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLOR = { S: "#101218", C: "#101218", H: "#c71f44", D: "#c71f44" };
const RANK_LABEL = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10", 9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2" };
const BOT_NAMES = ["BOT NOVA", "BOT VEGA", "BOT ORBIT", "YOU", "BOT ACE", "BOT LUX"];
const CHIP_PALETTES = [
  [0x7d4dff,0x2bd4ff,0xf2d269],
  [0xff6fb1,0x2bd4ff,0xf2d269],
  [0x7d4dff,0x55ffb3,0xf2d269],
  [0xf2d269,0x2bd4ff,0xff6fb1],
  [0xff9457,0x2bd4ff,0x7d4dff],
  [0x55ffb3,0xff6fb1,0xf2d269]
];

const USER_INDEX = 3;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const STARTING_STACK = 1000;
const ACTION_TIMEOUT_SECONDS = 12;

export function createPokerDemo({ scene, seats = [], chairRings = [], tableTopY = 0.90, statusCb = () => {}, log = console.log }) {
  const group = new THREE.Group();
  scene.add(group);

  const dealerOrigin = new THREE.Vector3(0.0, tableTopY + 0.36, -0.96);
  const textureCache = new Map();
  const cardObjects = [];
  const animations = [];
  const floatingPopups = [];
  const ringBase = chairRings.map((ring) => ({ color: ring.material.color.clone(), opacity: ring.material.opacity, scale: ring.scale.x }));

  const players = seats.map((seat, i)=>{
    const inward = new THREE.Vector3(-seat.x, 0, -seat.z).normalize();
    const tangent = new THREE.Vector3(-inward.z, 0, inward.x).normalize();
    const center = new THREE.Vector3(seat.x, tableTopY + 0.70, seat.z).addScaledVector(inward, 0.92);
    return {
      index: i,
      name: BOT_NAMES[i] || `P${i+1}`,
      stack: STARTING_STACK,
      contributed: 0,
      roundBet: 0,
      folded: false,
      allIn: false,
      acted: false,
      cards: [],
      cardMeshes: [],
      chips: [],
      anchor: {
        index: i,
        seat,
        name: BOT_NAMES[i] || `P${i+1}`,
        radial: new THREE.Vector3(seat.x, 0, seat.z).normalize(),
        cards: [
          { position: center.clone().addScaledVector(tangent, -0.16), rotationY: 0 },
          { position: center.clone().addScaledVector(tangent, 0.16), rotationY: 0 },
        ]
      }
    };
  });

  const boardAnchors = [-0.64, -0.32, 0, 0.32, 0.64].map((x) => ({ position: new THREE.Vector3(x, tableTopY + 0.96, -0.02), rotationY: 0 }));
  const burnAnchors = [-0.46, -0.34, -0.22].map((x) => ({ position: new THREE.Vector3(x, tableTopY + 0.72, -0.46), rotationY: 0 }));

  const statusPanel = makeDynamicPanel(1540, 300, 3.55, 0.68);
  statusPanel.mesh.position.set(0, tableTopY + 1.24, -0.06);
  group.add(statusPanel.mesh);

  const potStack = new THREE.Group();
  group.add(potStack);

  const actionHintPanel = makeDynamicPanel(1320, 210, 3.0, 0.46);
  actionHintPanel.mesh.position.set(0, tableTopY + 0.58, 0.62);
  actionHintPanel.mesh.visible = false;
  group.add(actionHintPanel.mesh);

  buildSeatChips();
  paintActionHint("");

  let handNumber = 0;
  let dealerIndex = -1;
  let nowS = 0;
  let queue = [];
  let stepIndex = 0;
  let current = null;
  let awaitingUser = false;
  let userDeadline = 0;
  let playerPeek = false;

  window.SVR_POKER_ACTION = (action, amount)=>handlePlayerAction(action, amount);
  window.addEventListener("keydown", (e)=>{
    if (e.repeat) return;
    if (e.code === "KeyF") handlePlayerAction("fold");
    if (e.code === "KeyC") handlePlayerAction("call");
    if (e.code === "KeyR") handlePlayerAction("raise");
    if (e.code === "KeyA") handlePlayerAction("allin");
    if (e.code === "KeyP") togglePeek();
    if (e.code === "KeyH") planHand(true);
  });

  function makeDynamicPanel(width, height, worldW, worldH) {
    const { canvas, ctx, texture } = makeCanvasLabel({ width, height, draw(drawCtx, w, h) { drawCtx.clearRect(0, 0, w, h); } });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(worldW, worldH), new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide }));
    return { mesh, canvas, ctx, texture };
  }

  function paintStatus(title, subtitle, accent = "rgba(126,240,208,0.95)", thirdLine = "") {
    const { ctx, canvas, texture } = statusPanel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 42); ctx.fill();
    ctx.strokeStyle = accent; ctx.lineWidth = 8; roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 42); ctx.stroke();
    ctx.fillStyle = "#f5f0ff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 78px system-ui"; ctx.fillText(title, canvas.width / 2, 86);
    ctx.fillStyle = "rgba(236,232,255,0.94)"; ctx.font = "38px system-ui"; ctx.fillText(subtitle, canvas.width / 2, 164);
    if (thirdLine){ ctx.fillStyle = "rgba(157,245,255,0.90)"; ctx.font = "31px system-ui"; ctx.fillText(thirdLine, canvas.width / 2, 226); }
    texture.needsUpdate = true;
  }

  function paintActionHint(text) {
    const { ctx, canvas, texture, mesh } = actionHintPanel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!text) { texture.needsUpdate = true; mesh.visible = false; return; }
    mesh.visible = true;
    ctx.fillStyle = "rgba(0,0,0,0.58)"; roundRect(ctx, 16, 16, canvas.width - 32, canvas.height - 32, 36); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.82)"; ctx.lineWidth = 8; roundRect(ctx, 16, 16, canvas.width - 32, canvas.height - 32, 36); ctx.stroke();
    ctx.fillStyle = "#ffffff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.font = "bold 44px system-ui"; ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    texture.needsUpdate = true;
  }

  function createFloatingText(title, subtitle, seconds = 10) {
    const panel = makeDynamicPanel(1600, 430, 3.8, 1.02);
    const { ctx, canvas, texture, mesh } = panel;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = "rgba(5,0,12,0.70)"; roundRect(ctx, 20, 20, canvas.width-40, canvas.height-40, 54); ctx.fill();
    ctx.strokeStyle = "rgba(244,210,105,0.98)"; ctx.lineWidth = 10; roundRect(ctx, 20, 20, canvas.width-40, canvas.height-40, 54); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4d269"; ctx.font = "bold 94px system-ui"; ctx.fillText(title, canvas.width/2, 132);
    ctx.fillStyle = "rgba(255,255,255,0.94)"; ctx.font = "bold 48px system-ui"; ctx.fillText(subtitle, canvas.width/2, 250);
    ctx.fillStyle = "rgba(160,240,255,0.86)"; ctx.font = "32px system-ui"; ctx.fillText("Result display auto-clears in 10 seconds", canvas.width/2, 340);
    texture.needsUpdate = true;
    mesh.position.set(0, tableTopY + 1.86, -0.18);
    group.add(mesh);
    floatingPopups.push({ mesh, born: nowS, until: nowS + seconds });
  }

  function getCardTexture(card) {
    const key = card ? `${card.rank}${card.suit}` : "back";
    if (textureCache.has(key)) return textureCache.get(key);
    const { texture } = makeCanvasLabel({ width: 512, height: 768, draw(ctx, w, h) {
      ctx.clearRect(0, 0, w, h); ctx.fillStyle = "#ffffff"; roundRect(ctx, 12, 12, w - 24, h - 24, 38); ctx.fill();
      ctx.strokeStyle = "#d6d9e7"; ctx.lineWidth = 8; roundRect(ctx, 12, 12, w - 24, h - 24, 38); ctx.stroke();
      if (!card) { ctx.fillStyle = "#160d28"; roundRect(ctx, 38, 38, w - 76, h - 76, 30); ctx.fill(); ctx.strokeStyle = "rgba(180,140,255,0.85)"; ctx.lineWidth = 10; roundRect(ctx, 54, 54, w - 108, h - 108, 22); ctx.stroke(); ctx.fillStyle = "rgba(239,233,255,0.95)"; ctx.font = "bold 86px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("SVR", w / 2, h / 2 - 30); ctx.font = "bold 44px system-ui"; ctx.fillText("ALL IN", w / 2, h / 2 + 44); return; }
      const color = SUIT_COLOR[card.suit], rank = RANK_LABEL[card.rank], suit = SUIT_SYMBOL[card.suit];
      ctx.fillStyle = color; ctx.font = "bold 108px Georgia, serif"; ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(rank, 44, 28); ctx.font = "bold 86px Georgia, serif"; ctx.fillText(suit, 48, 138);
      ctx.textAlign = "right"; ctx.textBaseline = "bottom"; ctx.fillText(rank, w - 44, h - 136); ctx.font = "bold 86px Georgia, serif"; ctx.fillText(suit, w - 48, h - 28);
      ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.font = "bold 220px Georgia, serif"; ctx.globalAlpha = 0.92; ctx.fillText(suit, w / 2, h / 2 + 18); ctx.globalAlpha = 1;
    }});
    texture.colorSpace = THREE.SRGBColorSpace; textureCache.set(key, texture); return texture;
  }

  function createCardMesh(realCard, faceDown = false, scale = 1) {
    const material = new THREE.MeshStandardMaterial({ map: getCardTexture(faceDown ? null : realCard), transparent: false, roughness: 0.80, metalness: 0.02, emissive: 0x130814, emissiveIntensity: 0.06, side: THREE.DoubleSide, depthWrite: true });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.24 * scale, 0.34 * scale, 10, 4), material);
    mesh.userData.card = realCard; mesh.userData.faceDown = faceDown; mesh.userData.baseScale = scale; mesh.position.copy(dealerOrigin); return mesh;
  }

  function setCardFace(mesh, reveal) {
    mesh.userData.faceDown = !reveal;
    mesh.material.map = getCardTexture(reveal ? mesh.userData.card : null);
    mesh.material.needsUpdate = true;
  }

  function addCard(card, target, delay = 0.42, scale = 1, faceDown = false) {
    const mesh = createCardMesh(card, faceDown, scale); mesh.position.copy(dealerOrigin); group.add(mesh); cardObjects.push(mesh);
    animations.push({ mesh, fromPos: dealerOrigin.clone(), toPos: target.position.clone(), start: nowS, end: nowS + delay, scale });
    return mesh;
  }
  function addBurnCard(index, delay = 0.34) { return addCard(null, burnAnchors[index], delay, 0.74, true); }
  function clearCards() { while (cardObjects.length) { const mesh = cardObjects.pop(); mesh.parent?.remove(mesh); } animations.length = 0; }

  function buildSeatChips() {
    players.forEach((player, idx) => {
      const inward = new THREE.Vector3(-player.anchor.seat.x, 0, -player.anchor.seat.z).normalize();
      const tangent = new THREE.Vector3(-inward.z, 0, inward.x).normalize();
      const base = new THREE.Vector3(player.anchor.seat.x, tableTopY + 0.02, player.anchor.seat.z).addScaledVector(inward, 0.72).addScaledVector(tangent, -0.22);
      const palette = CHIP_PALETTES[idx % CHIP_PALETTES.length];
      for (let stack = 0; stack < 3; stack += 1) {
        const root = new THREE.Group(); const color = palette[stack % palette.length];
        for (let i = 0; i < 6 + stack * 2; i += 1) {
          const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.016, 22), new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.16, emissive: color, emissiveIntensity: 0.22 }));
          chip.rotation.x = Math.PI * 0.5; chip.position.y = i * 0.017; root.add(chip);
        }
        root.position.copy(base).addScaledVector(tangent, stack * 0.18).addScaledVector(inward, (stack % 2) * 0.06); root.userData.baseY = root.position.y; group.add(root); player.chips.push(root);
      }
    });
  }

  function createDeck() { const deck = []; for (const suit of SUITS) for (let rank = 2; rank <= 14; rank += 1) deck.push({ rank, suit }); return deck; }
  function shuffle(deck) { for (let i = deck.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } return deck; }
  function compareArrays(a, b) { const len = Math.max(a.length, b.length); for (let i = 0; i < len; i += 1) { const av = a[i] ?? -1, bv = b[i] ?? -1; if (av !== bv) return av - bv; } return 0; }

  function evaluate5(cards) {
    const ranks = cards.map((c) => c.rank).sort((a, b) => b - a); const counts = new Map(); ranks.forEach((r) => counts.set(r, (counts.get(r) || 0) + 1));
    const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]); const flush = cards.every((c) => c.suit === cards[0].suit);
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a); let straightHigh = 0;
    for (let i = 0; i <= uniqueRanks.length - 5; i += 1) { const slice = uniqueRanks.slice(i, i + 5); if (slice[0] - slice[4] === 4) { straightHigh = slice[0]; break; } }
    if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(5) && uniqueRanks.includes(4) && uniqueRanks.includes(3) && uniqueRanks.includes(2)) straightHigh = 5;
    if (straightHigh && flush) return { score: [8, straightHigh], name: straightHigh === 14 ? "Royal Flush" : "Straight Flush", cards };
    if (byCount[0][1] === 4) return { score: [7, byCount[0][0], byCount.find((e) => e[1] === 1)[0]], name: "Four of a Kind", cards };
    if (byCount[0][1] === 3 && byCount[1]?.[1] >= 2) return { score: [6, byCount[0][0], byCount[1][0]], name: "Full House", cards };
    if (flush) return { score: [5, ...ranks], name: "Flush", cards };
    if (straightHigh) return { score: [4, straightHigh], name: "Straight", cards };
    if (byCount[0][1] === 3) return { score: [3, byCount[0][0], ...byCount.filter((e)=>e[1]===1).map((e)=>e[0]).sort((a,b)=>b-a)], name: "Three of a Kind", cards };
    if (byCount[0][1] === 2 && byCount[1]?.[1] === 2) { const pairRanks = byCount.filter((e)=>e[1]===2).map((e)=>e[0]).sort((a,b)=>b-a); return { score: [2, pairRanks[0], pairRanks[1], byCount.find((e)=>e[1]===1)[0]], name: "Two Pair", cards }; }
    if (byCount[0][1] === 2) return { score: [1, byCount[0][0], ...byCount.filter((e)=>e[1]===1).map((e)=>e[0]).sort((a,b)=>b-a)], name: "One Pair", cards };
    return { score: [0, ...ranks], name: "High Card", cards };
  }
  function evaluate7(cards) { let best = null; for (let a=0;a<cards.length-4;a++) for (let b=a+1;b<cards.length-3;b++) for (let c=b+1;c<cards.length-2;c++) for (let d=c+1;d<cards.length-1;d++) for (let e=d+1;e<cards.length;e++){ const result = evaluate5([cards[a],cards[b],cards[c],cards[d],cards[e]]); if (!best || compareArrays(result.score, best.score) > 0) best = result; } return best; }
  function formatCards(cards) { return cards.map((card) => `${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}`).join(" "); }
  function ringOrderFrom(startIndex) { return Array.from({length: players.length}, (_, n)=>(startIndex + n) % players.length); }
  function activePlayers() { return players.filter((p)=>!p.folded); }
  function contendersForPot(pot) { return players.filter((p)=>!p.folded && p.contributed >= pot.threshold); }

  function clearPotStack() { while (potStack.children.length) potStack.remove(potStack.children[0]); }
  function refreshPotStack() {
    clearPotStack(); if (!current) return;
    const pots = current.sidePots?.length ? current.sidePots : [{ amount: current.pot || 0, threshold: 0 }];
    const palette = [0x7d4dff, 0x2bd4ff, 0xf2d269, 0xff6fb1, 0x55ffb3];
    pots.forEach((pot, potIndex)=>{
      const chipCount = Math.max(1, Math.min(18, Math.round((pot.amount || 1) / 28)));
      for (let i = 0; i < chipCount; i += 1) {
        const chip = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.014, 22), new THREE.MeshStandardMaterial({ color: palette[(i+potIndex) % palette.length], roughness: 0.34, metalness: 0.14, emissive: palette[(i+potIndex)%palette.length], emissiveIntensity: 0.30 }));
        const layer = Math.floor(i / 6), offset = i % 6; chip.rotation.x = Math.PI / 2;
        chip.position.set((potIndex - 1) * 0.22 + (offset - 2.5) * 0.026, tableTopY + 0.026 + layer * 0.017, 0.16 + potIndex * 0.13);
        chip.userData.baseY = chip.position.y; potStack.add(chip);
      }
    });
  }

  function calculateSidePots() {
    const levels = [...new Set(players.map((p)=>p.contributed).filter((v)=>v>0))].sort((a,b)=>a-b); let last = 0; const pots = [];
    for (const level of levels) { const involved = players.filter((p)=>p.contributed >= level); const amount = (level - last) * involved.length; if (amount > 0) pots.push({ threshold: level, amount }); last = level; }
    current.sidePots = pots; current.pot = pots.reduce((s,p)=>s+p.amount,0); refreshPotStack();
  }

  function resetRingHighlights() { chairRings.forEach((ring, i) => { if (!ringBase[i]) return; ring.material.color.copy(ringBase[i].color); ring.material.opacity = ringBase[i].opacity; ring.scale.setScalar(ringBase[i].scale); }); }
  function applyWinnerHighlight(index) { chairRings.forEach((ring, i) => { if (i === index) { ring.material.color.set(0xf2d269); ring.material.opacity = 0.96; ring.scale.setScalar(1.06); } }); }
  function applyActionHighlight(index) { chairRings.forEach((ring, i) => { if (i === index) { ring.material.color.set(0x8ce5ff); ring.material.opacity = 0.90; ring.scale.setScalar(1.03); } else if (ringBase[i]) { ring.material.color.copy(ringBase[i].color); ring.material.opacity = ringBase[i].opacity; ring.scale.setScalar(ringBase[i].scale); } }); }

  function pulseHaptics(ms = 32, strength = 0.22) {
    try { for (const gp of navigator.getGamepads?.() || []) { const actuator = gp?.vibrationActuator; if (actuator?.playEffect) actuator.playEffect("dual-rumble", { duration: ms, strongMagnitude: strength, weakMagnitude: strength }); } } catch {}
  }

  function schedule(at, fn) { queue.push({ at, fn }); queue.sort((a,b)=>a.at-b.at); }
  function postBlind(player, amount) { const pay = Math.min(player.stack, amount); player.stack -= pay; player.contributed += pay; player.roundBet += pay; if (player.stack <= 0) player.allIn = true; calculateSidePots(); }

  function resetHandPlayers() {
    for (const p of players) { if (p.stack <= 0) p.stack = STARTING_STACK; p.contributed = 0; p.roundBet = 0; p.folded = false; p.allIn = false; p.acted = false; p.cards = []; p.cardMeshes = []; }
  }

  function planHand(force = false) {
    handNumber += 1; dealerIndex = (dealerIndex + 1 + players.length) % players.length; clearCards(); clearPotStack(); resetRingHighlights(); resetHandPlayers(); awaitingUser = false; playerPeek = false; paintActionHint("");
    const sbIndex = (dealerIndex + 1) % players.length; const bbIndex = (dealerIndex + 2) % players.length; const deck = shuffle(createDeck());
    current = { deck, board: [], burn: [], handNumber, dealerIndex, sbIndex, bbIndex, stage: "shuffle", street: "preflop", toCall: BIG_BLIND, minRaise: BIG_BLIND, actionOrder: [], actionCursor: 0, sidePots: [], pot: 0 };
    queue = []; stepIndex = 0;
    let t = nowS + (force ? 0.12 : 0.75);
    schedule(t, ()=>{ current.stage="blinds"; postBlind(players[sbIndex], SMALL_BLIND); postBlind(players[bbIndex], BIG_BLIND); paintStatus(`Hand ${handNumber} • button ${players[dealerIndex].name}`, `SB ${players[sbIndex].name} $${SMALL_BLIND} • BB ${players[bbIndex].name} $${BIG_BLIND} • pot $${current.pot}`, "rgba(126,240,208,0.95)", "Dealer button advances clockwise one seat every hand"); applyActionHighlight(bbIndex); });
    const dealOrder = ringOrderFrom(sbIndex);
    for (let round = 0; round < 2; round += 1) {
      for (const idx of dealOrder) {
        t += 0.42; schedule(t, ()=>{ const p = players[idx]; const card = deck.shift(); p.cards.push(card); const faceDown = idx !== USER_INDEX || !playerPeek; const mesh = addCard(card, p.anchor.cards[round], 0.46, 1.0, faceDown); p.cardMeshes.push(mesh); current.stage = "deal"; applyActionHighlight(idx); paintStatus(`Dealing clockwise • ${p.name}`, `Card ${round+1}/2 • starts left of button • pot $${current.pot}`); pulseHaptics(18, 0.08); });
      }
    }
    t += 0.75; schedule(t, ()=>beginBettingRound("preflop", (bbIndex + 1) % players.length));
    paintStatus("Shuffling live 52-card deck", `Hand ${handNumber} • Texas Hold'em engine armed`, "rgba(126,240,208,0.95)", "Keys: F fold • C check/call • R raise • A all-in • P peek • H next hand");
  }

  function beginBettingRound(street, firstIndex) {
    current.street = street; current.stage = `${street}-betting`; current.actionOrder = ringOrderFrom(firstIndex); current.actionCursor = 0; players.forEach((p)=>{ p.roundBet = street === "preflop" ? p.roundBet : 0; p.acted = false; });
    if (street !== "preflop") { current.toCall = 0; current.minRaise = BIG_BLIND; }
    paintStatus(`${street.toUpperCase()} betting`, `Pot $${current.pot} • strict check/call/raise validation`, "rgba(126,240,208,0.95)", "Raises must meet or exceed the previous raise size");
    schedule(nowS + 0.25, nextAction);
  }

  function isRoundComplete() {
    const live = players.filter((p)=>!p.folded && !p.allIn); if (activePlayers().length <= 1) return true; if (live.length === 0) return true;
    return live.every((p)=>p.acted && p.roundBet === current.toCall);
  }

  function nextAction() {
    if (!current) return; calculateSidePots(); if (activePlayers().length <= 1) return showdown(true); if (isRoundComplete()) return finishStreet();
    for (let tries = 0; tries < players.length; tries += 1) {
      const idx = current.actionOrder[current.actionCursor % current.actionOrder.length]; current.actionCursor += 1; const p = players[idx];
      if (p.folded || p.allIn) continue; if (p.acted && p.roundBet === current.toCall) continue;
      current.actorIndex = idx; applyActionHighlight(idx); const callAmt = Math.max(0, current.toCall - p.roundBet);
      if (idx === USER_INDEX) { awaitingUser = true; userDeadline = nowS + ACTION_TIMEOUT_SECONDS; paintActionHint(`YOUR TURN • ${callAmt ? `CALL $${callAmt}` : "CHECK"} • F Fold • C ${callAmt ? "Call" : "Check"} • R Raise • A All-In • P Peek`); paintStatus("Your action", `Stack $${p.stack} • to call $${callAmt} • pot $${current.pot}`, "rgba(255,255,255,0.96)", "White watch button/menu can route future poker controls here"); pulseHaptics(70,0.18); return; }
      schedule(nowS + 0.85, ()=>performBotAction(idx)); return;
    }
    finishStreet();
  }

  function legalRaiseTotal(player, requestedRaise = 60) {
    const callAmt = Math.max(0, current.toCall - player.roundBet); const minExtra = Math.max(current.minRaise, BIG_BLIND); return Math.min(player.stack, callAmt + Math.max(minExtra, requestedRaise));
  }

  function performBotAction(idx) {
    const p = players[idx]; if (!p || p.folded || p.allIn) return nextAction();
    const visibleBoard = current.board; let strength = { score: [0, 14], name: "High Card" };
    if (visibleBoard.length >= 3) strength = evaluate7([...p.cards, ...visibleBoard]); else strength = evaluate5(p.cards.concat([{rank:2,suit:"S"},{rank:3,suit:"H"},{rank:4,suit:"D"}]).slice(0,5));
    const level = strength.score[0]; const callAmt = Math.max(0, current.toCall - p.roundBet); let action = "check"; let amount = 0;
    if (callAmt > 0) { if (level === 0 && callAmt > 90 && Math.random() < 0.45) action = "fold"; else if (level >= 2 && p.stack > callAmt + current.minRaise && Math.random() < 0.38) { action = "raise"; amount = legalRaiseTotal(p, level >= 4 ? 140 : 70); } else { action = "call"; amount = callAmt; } }
    else { if (level >= 2 && p.stack > BIG_BLIND && Math.random() < 0.42) { action = "bet"; amount = Math.min(p.stack, level >= 4 ? 140 : 60); } else action = "check"; }
    performAction(idx, action, amount);
  }

  function handlePlayerAction(action, amount) { if (!awaitingUser || !current) return false; const p = players[USER_INDEX]; const callAmt = Math.max(0, current.toCall - p.roundBet); let normalized = action;
    if (action === "call" && callAmt === 0) normalized = "check"; if (action === "raise") amount = legalRaiseTotal(p, 80); if (action === "allin") amount = p.stack;
    return performAction(USER_INDEX, normalized, amount || callAmt);
  }

  function performAction(idx, action, amount = 0) {
    const p = players[idx]; if (!p || p.folded || p.allIn) return false; const callAmt = Math.max(0, current.toCall - p.roundBet); let label = action.toUpperCase();
    if (action === "check" && callAmt > 0) { paintStatus("Illegal check blocked", `A bet is live. ${p.name} must call, raise, or fold.`); return false; }
    if (action === "fold") { p.folded = true; p.acted = true; }
    else if (action === "check") { p.acted = true; }
    else if (action === "call") { const pay = Math.min(p.stack, callAmt); p.stack -= pay; p.roundBet += pay; p.contributed += pay; if (p.stack <= 0) p.allIn = true; p.acted = true; label = pay >= callAmt ? `CALL $${pay}` : `ALL-IN CALL $${pay}`; }
    else if (action === "bet" || action === "raise") { const pay = Math.min(p.stack, amount); const newRoundBet = p.roundBet + pay; const raiseSize = newRoundBet - current.toCall; if (current.toCall > 0 && raiseSize < current.minRaise && pay < p.stack + pay) { paintStatus("Illegal raise blocked", `Minimum raise is $${current.minRaise}.`); return false; } p.stack -= pay; p.roundBet = newRoundBet; p.contributed += pay; if (p.stack <= 0) p.allIn = true; if (newRoundBet > current.toCall) { current.minRaise = Math.max(BIG_BLIND, raiseSize); current.toCall = newRoundBet; players.forEach((x)=>{ if (!x.folded && !x.allIn && x.index !== idx) x.acted = false; }); } p.acted = true; label = `${action === "bet" ? "BET" : "RAISE"} $${pay}`; }
    else if (action === "allin") { const pay = p.stack; p.stack = 0; p.roundBet += pay; p.contributed += pay; p.allIn = true; if (p.roundBet > current.toCall) { const raiseSize = p.roundBet - current.toCall; current.minRaise = Math.max(BIG_BLIND, raiseSize); current.toCall = p.roundBet; players.forEach((x)=>{ if (!x.folded && !x.allIn && x.index !== idx) x.acted = false; }); } p.acted = true; label = `ALL-IN $${pay}`; }
    awaitingUser = false; paintActionHint(""); calculateSidePots(); applyActionHighlight(idx); paintStatus(`${p.name} ${label}`, `Stack $${p.stack} • pot $${current.pot} • ${current.street.toUpperCase()}`); statusCb(`${p.name} ${label} • pot $${current.pot}`); pulseHaptics(36,0.12); schedule(nowS + 0.42, nextAction); return true;
  }

  function finishStreet() {
    if (activePlayers().length <= 1) return showdown(true);
    if (current.street === "preflop") return dealFlop(); if (current.street === "flop") return dealTurn(); if (current.street === "turn") return dealRiver(); return showdown(false);
  }
  function dealFlop() { let t=nowS+0.45; schedule(t, ()=>{ current.burn.push(current.deck.shift()); addBurnCard(0); paintStatus("Burn", `Before flop • pot $${current.pot}`); }); t+=0.58; schedule(t, ()=>{ current.street="flop"; current.board.push(current.deck.shift(), current.deck.shift(), current.deck.shift()); for (let i=0;i<3;i++) addCard(current.board[i], boardAnchors[i], 0.52, 1.18, false); paintStatus(`Flop • ${formatCards(current.board)}`, `Pot $${current.pot}`); }); t+=0.95; schedule(t, ()=>beginBettingRound("flop", (current.dealerIndex+1)%players.length)); }
  function dealTurn() { let t=nowS+0.45; schedule(t, ()=>{ current.burn.push(current.deck.shift()); addBurnCard(1); paintStatus("Burn", `Before turn • pot $${current.pot}`); }); t+=0.58; schedule(t, ()=>{ current.street="turn"; current.board.push(current.deck.shift()); addCard(current.board[3], boardAnchors[3], 0.52, 1.18, false); paintStatus(`Turn • ${formatCards(current.board)}`, `Pot $${current.pot}`); }); t+=0.95; schedule(t, ()=>beginBettingRound("turn", (current.dealerIndex+1)%players.length)); }
  function dealRiver() { let t=nowS+0.45; schedule(t, ()=>{ current.burn.push(current.deck.shift()); addBurnCard(2); paintStatus("Burn", `Before river • pot $${current.pot}`); }); t+=0.58; schedule(t, ()=>{ current.street="river"; current.board.push(current.deck.shift()); addCard(current.board[4], boardAnchors[4], 0.52, 1.18, false); paintStatus(`River • ${formatCards(current.board)}`, `Pot $${current.pot}`); }); t+=0.95; schedule(t, ()=>beginBettingRound("river", (current.dealerIndex+1)%players.length)); }

  function showdown(wonByFold = false) {
    awaitingUser = false; paintActionHint(""); players.forEach((p)=>p.cardMeshes.forEach((m)=>setCardFace(m, true))); calculateSidePots();
    const active = activePlayers(); let winnersSummary = [];
    if (wonByFold && active.length === 1) { const winner = active[0]; winner.stack += current.pot; winnersSummary = [{ player:winner, result:{ name:"Foldout Win", cards:winner.cards, score:[-1]}, amount:current.pot }]; applyWinnerHighlight(winner.index); }
    else {
      const evaluations = players.filter((p)=>!p.folded).map((p)=>({ player:p, result:evaluate7([...p.cards, ...current.board]) }));
      for (const pot of current.sidePots) { const eligible = evaluations.filter((e)=>contendersForPot(pot).includes(e.player)); eligible.sort((a,b)=>compareArrays(b.result.score, a.result.score)); const best = eligible[0]; const tied = eligible.filter((e)=>compareArrays(e.result.score,best.result.score)===0); const share = Math.floor(pot.amount / tied.length); tied.forEach((e)=>{ e.player.stack += share; winnersSummary.push({ player:e.player, result:e.result, amount:share }); applyWinnerHighlight(e.player.index); }); }
    }
    const lead = winnersSummary[0]; const winnerNames = [...new Set(winnersSummary.map((w)=>w.player.name))].join(" / "); const bestHand = lead?.result?.name || "Winner"; const bestCards = lead?.result?.cards ? formatCards(lead.result.cards) : "";
    paintStatus(`${winnerNames} wins`, `${bestHand} • paid $${winnersSummary.reduce((s,w)=>s+w.amount,0)}`, "rgba(244,210,105,0.98)", bestCards);
    createFloatingText(`${winnerNames} WINS`, `${bestHand} • ${bestCards} • Pot $${current.pot}`, 10);
    statusCb(`HAND ${handNumber} • ${winnerNames} wins • ${bestHand} • pot $${current.pot}`); log("Poker showdown", { hand: handNumber, winners: winnersSummary.map((w)=>({name:w.player.name, amount:w.amount, hand:w.result.name})), board: formatCards(current.board), pots: current.sidePots });
    schedule(nowS + 10.2, ()=>planHand());
  }

  function togglePeek() { playerPeek = !playerPeek; const p = players[USER_INDEX]; p.cardMeshes.forEach((m, i)=>{ setCardFace(m, playerPeek); m.userData.peekTilt = playerPeek ? (i === 0 ? -0.22 : 0.22) : 0; }); pulseHaptics(45,0.16); if (p.cards.length) paintStatus(playerPeek ? "Private card peek" : "Cards tucked down", playerPeek ? `Your hole cards: ${formatCards(p.cards)}` : "Hole cards hidden again", "rgba(255,255,255,0.96)", "Tactile peek is mapped to P now; VR corner-grab can hook here next."); }

  function orientCardToCamera(mesh) { const cam = scene.userData?._camera; if (!cam) return; const ry = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z); mesh.rotation.set(0, ry + (mesh.userData.peekTilt || 0), mesh.userData.peekTilt ? 0.12 : 0); }
  function updateAnimations() { for (let i = animations.length - 1; i >= 0; i -= 1) { const anim = animations[i]; const span = Math.max(0.0001, anim.end - anim.start); const t = THREE.MathUtils.clamp((nowS - anim.start) / span, 0, 1); const eased = 1 - Math.pow(1 - t, 3); anim.mesh.position.lerpVectors(anim.fromPos, anim.toPos, eased); anim.mesh.position.y += Math.sin(eased * Math.PI) * 0.22; orientCardToCamera(anim.mesh); if (t >= 1) animations.splice(i, 1); } }
  function updateCardsHover() { cardObjects.forEach((mesh, i) => { if (animations.find((anim) => anim.mesh === mesh)) return; if (mesh.userData.baseY === undefined) mesh.userData.baseY = mesh.position.y; const peekLift = mesh.userData.peekTilt ? 0.055 : 0; mesh.position.y = mesh.userData.baseY + peekLift + Math.sin(nowS * 2.1 + i * 0.4) * 0.018; orientCardToCamera(mesh); }); }
  function updatePotStack() { potStack.children.forEach((chip, i) => { chip.position.y = chip.userData.baseY + Math.sin(nowS * 2.8 + i * 0.4) * 0.002; chip.rotation.z = Math.sin(nowS * 1.1 + i * 0.18) * 0.04; }); }
  function updateSeatChips() { players.forEach((player, idx)=>{ player.chips.forEach((stack, s)=>{ stack.position.y = stack.userData.baseY + Math.sin(nowS * 1.6 + idx * 0.5 + s * 0.7) * 0.005; }); }); }
  function updateStatusFacing() { const cam = scene.userData?._camera; if (!cam) return; [statusPanel.mesh, actionHintPanel.mesh, ...floatingPopups.map(p=>p.mesh)].forEach((mesh)=>{ const ry = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z); mesh.rotation.set(0, ry, 0); }); }
  function updatePopups() { for (let i=floatingPopups.length-1;i>=0;i--){ const p=floatingPopups[i]; if (nowS >= p.until) { p.mesh.parent?.remove(p.mesh); floatingPopups.splice(i,1); } else { p.mesh.position.y = tableTopY + 1.86 + Math.sin(nowS*1.4+i)*0.02; } } }

  function update(now) { nowS = now; if (!current) planHand(); if (awaitingUser && nowS >= userDeadline) { const p=players[USER_INDEX]; const callAmt=Math.max(0,current.toCall-p.roundBet); handlePlayerAction(callAmt>0?"call":"call"); }
    while (queue[stepIndex] && nowS >= queue[stepIndex].at) { const ref = queue; queue[stepIndex].fn(); if (queue !== ref) break; stepIndex += 1; }
    updateAnimations(); updateCardsHover(); updatePotStack(); updateSeatChips(); updatePopups(); updateStatusFacing(); }

  return { update, forceNextHand(){ planHand(true); }, playerAction: handlePlayerAction };
}
