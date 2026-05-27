import * as THREE from "three";
import { makeCanvasLabel, roundRect } from "./utils.js";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLOR = { S: "#101218", C: "#101218", H: "#c71f44", D: "#c71f44" };
const RANK_LABEL = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10", 9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2" };
const BOT_NAMES = ["BOT NOVA", "BOT VEGA", "BOT ORBIT", "YOU", "BOT ACE", "BOT LUX"];
const PLAYER_INDEX = 3;
const START_STACK = 1500;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;
const DEAL_DIRECTION = "LEFT_TO_RIGHT_FROM_DEALER_BUTTON";
const TABLE_LEFT_TO_RIGHT_ORDER = [0, 2, 1, 3, 4, 5];
const CHIP_PALETTES = [
  [0x7d4dff,0x2bd4ff,0xf2d269],
  [0xff6fb1,0x2bd4ff,0xf2d269],
  [0x7d4dff,0x55ffb3,0xf2d269],
  [0xf2d269,0x2bd4ff,0xff6fb1],
  [0xff9457,0x2bd4ff,0x7d4dff],
  [0x55ffb3,0xff6fb1,0xf2d269]
];

export function createPokerDemo({ scene, seats = [], chairRings = [], tableTopY = 0.90, statusCb = () => {}, log = console.log }) {
  const group = new THREE.Group();
  scene.add(group);

  const dealerOrigin = new THREE.Vector3(0.0, tableTopY + 0.36, -0.96);
  const textureCache = new Map();
  const cardObjects = [];
  const animations = [];
  const ringBase = chairRings.map((ring) => ({
    color: ring.material.color.clone(),
    opacity: ring.material.opacity,
    scale: ring.scale.x,
  }));

  const players = seats.map((seat, i)=>{
    const inward = new THREE.Vector3(-seat.x, 0, -seat.z).normalize();
    const tangent = new THREE.Vector3(-inward.z, 0, inward.x).normalize();
    const center = new THREE.Vector3(seat.x, tableTopY + 0.70, seat.z).addScaledVector(inward, 0.92);
    return {
      index: i,
      name: BOT_NAMES[i] || `P${i+1}`,
      stack: START_STACK,
      committed: 0,
      folded: false,
      lastAction: "",
      anchor: {
        index: i,
        seat,
        name: BOT_NAMES[i] || `P${i+1}`,
        radial: new THREE.Vector3(seat.x, 0, seat.z).normalize(),
        cards: [
          { position: center.clone().addScaledVector(tangent, -0.16), rotationY: 0 },
          { position: center.clone().addScaledVector(tangent, 0.16), rotationY: 0 },
        ]
      },
      chips: [],
      cards: []
    };
  });

  const boardAnchors = [-0.64, -0.32, 0, 0.32, 0.64].map((x) => ({
    position: new THREE.Vector3(x, tableTopY + 0.96, -0.02),
    rotationY: 0,
  }));
  const burnAnchors = [-0.46, -0.34, -0.22].map((x) => ({
    position: new THREE.Vector3(x, tableTopY + 0.72, -0.46),
    rotationY: 0,
  }));

  const statusPanel = makeDynamicPanel(1500, 300, 3.4, 0.66);
  statusPanel.mesh.position.set(0, tableTopY + 1.24, -0.06);
  group.add(statusPanel.mesh);

  const actionPanel = makeDynamicPanel(1420, 180, 3.0, 0.38);
  actionPanel.mesh.position.set(0, tableTopY + 1.18, 0.58);
  group.add(actionPanel.mesh);

  const potStack = new THREE.Group();
  group.add(potStack);

  buildSeatChips();

  let handNumber = 0;
  let nowS = 0;
  let queue = [];
  let stepIndex = 0;
  let current = null;
  let waitingForUser = null;
  let actionText = "Keys: F Fold • C Check/Call • R Raise • A All-In • H Next Hand";
  let lastActionAt = 0;

  function makeDynamicPanel(width, height, worldW, worldH) {
    const { canvas, ctx, texture } = makeCanvasLabel({
      width,
      height,
      draw(drawCtx, w, h) { drawCtx.clearRect(0, 0, w, h); },
    });
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(worldW, worldH),
      new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide })
    );
    return { mesh, canvas, ctx, texture };
  }

  function paintStatus(title, subtitle, accent = "rgba(126,240,208,0.95)") {
    const { ctx, canvas, texture } = statusPanel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 42); ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 42); ctx.stroke();
    ctx.fillStyle = "#f5f0ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 78px system-ui";
    ctx.fillText(title, canvas.width / 2, 88);
    ctx.fillStyle = "rgba(236,232,255,0.92)";
    ctx.font = "40px system-ui";
    ctx.fillText(subtitle, canvas.width / 2, 172);
    ctx.fillStyle = "rgba(126,240,208,0.88)";
    ctx.font = "bold 28px system-ui";
    ctx.fillText(actionText, canvas.width / 2, 236);
    texture.needsUpdate = true;
    paintActionPanel();
  }

  function paintActionPanel(){
    const { ctx, canvas, texture } = actionPanel;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle = waitingForUser ? "rgba(13,8,26,0.68)" : "rgba(0,0,0,0.28)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 30); ctx.fill();
    ctx.strokeStyle = waitingForUser ? "rgba(244,210,105,0.9)" : "rgba(180,140,255,0.35)";
    ctx.lineWidth = 5;
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 30); ctx.stroke();
    const options = [
      ["F", "FOLD"], ["C", waitingForUser?.callAmount ? `CALL $${waitingForUser.callAmount}` : "CHECK"], ["R", `RAISE $${waitingForUser?.raiseAmount || 100}`], ["A", "ALL-IN"], ["H", "NEXT HAND"]
    ];
    ctx.font = "bold 42px system-ui";
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    options.forEach(([key,label], i)=>{
      const x = 70 + i * 258;
      const w = i === 4 ? 250 : 220;
      ctx.fillStyle = waitingForUser || key === "H" ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.045)";
      ctx.strokeStyle = waitingForUser || key === "H" ? "rgba(126,240,208,0.55)" : "rgba(255,255,255,0.12)";
      ctx.lineWidth = 4;
      roundRect(ctx, x, 54, w, 78, 18); ctx.fill(); ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.fillText(`${key}: ${label}`, x + w/2, 94);
    });
    texture.needsUpdate = true;
  }

  function getCardTexture(card) {
    const key = card ? `${card.rank}${card.suit}` : "back";
    if (textureCache.has(key)) return textureCache.get(key);
    const { texture } = makeCanvasLabel({
      width: 512, height: 768,
      draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, 12, 12, w - 24, h - 24, 38); ctx.fill();
        ctx.strokeStyle = "#d6d9e7"; ctx.lineWidth = 8;
        roundRect(ctx, 12, 12, w - 24, h - 24, 38); ctx.stroke();
        if (!card) {
          ctx.fillStyle = "#160d28";
          roundRect(ctx, 38, 38, w - 76, h - 76, 30); ctx.fill();
          ctx.strokeStyle = "rgba(180,140,255,0.85)"; ctx.lineWidth = 10;
          roundRect(ctx, 54, 54, w - 108, h - 108, 22); ctx.stroke();
          ctx.fillStyle = "rgba(239,233,255,0.95)";
          ctx.font = "bold 86px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
          ctx.fillText("SVR", w / 2, h / 2 - 30);
          ctx.font = "bold 44px system-ui"; ctx.fillText("ALL IN", w / 2, h / 2 + 44);
          return;
        }
        const color = SUIT_COLOR[card.suit];
        const rank = RANK_LABEL[card.rank];
        const suit = SUIT_SYMBOL[card.suit];
        ctx.fillStyle = color;
        ctx.font = "bold 132px Georgia, serif";
        ctx.textAlign = "left"; ctx.textBaseline = "top";
        ctx.fillText(rank, 40, 22);
        ctx.font = "bold 104px Georgia, serif";
        ctx.fillText(suit, 46, 160);
        ctx.textAlign = "right"; ctx.textBaseline = "bottom";
        ctx.fillText(rank, w - 40, h - 158);
        ctx.font = "bold 104px Georgia, serif";
        ctx.fillText(suit, w - 46, h - 24);
        ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.font = "bold 244px Georgia, serif";
        ctx.globalAlpha = 0.92; ctx.fillText(suit, w / 2, h / 2 + 20); ctx.globalAlpha = 1;
      },
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
  }

  function createCardMesh(card, scale = 1) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.28 * scale, 0.39 * scale),
      new THREE.MeshStandardMaterial({ map: getCardTexture(card), transparent: false, roughness: 0.80, metalness: 0.02, emissive: 0x130814, emissiveIntensity: 0.06, side: THREE.DoubleSide, depthWrite: true })
    );
    mesh.userData.card = card;
    mesh.position.copy(dealerOrigin);
    return mesh;
  }

  function addCard(card, target, delay = 0.42, scale = 1) {
    const mesh = createCardMesh(card, scale);
    mesh.position.copy(dealerOrigin);
    group.add(mesh);
    cardObjects.push(mesh);
    animations.push({ mesh, fromPos: dealerOrigin.clone(), toPos: target.position.clone(), start: nowS, end: nowS + delay, scale });
    return mesh;
  }
  function addBurnCard(index, delay = 0.38) { return addCard(null, burnAnchors[index], delay, 0.78); }
  function clearCards() {
    while (cardObjects.length) {
      const mesh = cardObjects.pop();
      mesh.parent?.remove(mesh);
    }
    animations.length = 0;
  }

  function buildSeatChips() {
    players.forEach((player, idx) => {
      const inward = new THREE.Vector3(-player.anchor.seat.x, 0, -player.anchor.seat.z).normalize();
      const tangent = new THREE.Vector3(-inward.z, 0, inward.x).normalize();
      const base = new THREE.Vector3(player.anchor.seat.x, tableTopY + 0.02, player.anchor.seat.z).addScaledVector(inward, 0.72).addScaledVector(tangent, -0.22);
      const palette = CHIP_PALETTES[idx % CHIP_PALETTES.length];
      for (let stack = 0; stack < 3; stack += 1) {
        const root = new THREE.Group();
        const color = palette[stack % palette.length];
        for (let i = 0; i < 6 + stack * 2; i += 1) {
          const chip = new THREE.Mesh(
            new THREE.CylinderGeometry(0.08, 0.08, 0.016, 22),
            new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.16, emissive: color, emissiveIntensity: 0.22 })
          );
          chip.rotation.x = Math.PI * 0.5;
          chip.position.y = i * 0.017;
          root.add(chip);
        }
        root.position.copy(base).addScaledVector(tangent, stack * 0.18).addScaledVector(inward, (stack % 2) * 0.06);
        root.userData.baseY = root.position.y;
        group.add(root);
        player.chips.push(root);
      }
    });
  }

  function createDeck() { const deck = []; for (const suit of SUITS) for (let rank = 2; rank <= 14; rank += 1) deck.push({ rank, suit }); return deck; }
  function shuffle(deck) { for (let i = deck.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]]; } return deck; }
  function compareArrays(a, b) { const len = Math.max(a.length, b.length); for (let i = 0; i < len; i += 1) { const av = a[i] ?? -1; const bv = b[i] ?? -1; if (av !== bv) return av - bv; } return 0; }
  function evaluate5(cards) {
    const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
    const counts = new Map(); ranks.forEach((r) => counts.set(r, (counts.get(r) || 0) + 1));
    const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every((c) => c.suit === cards[0].suit);
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
    let straightHigh = 0;
    for (let i = 0; i <= uniqueRanks.length - 5; i += 1) { const slice = uniqueRanks.slice(i, i + 5); if (slice[0] - slice[4] === 4) { straightHigh = slice[0]; break; } }
    if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(5) && uniqueRanks.includes(4) && uniqueRanks.includes(3) && uniqueRanks.includes(2)) straightHigh = 5;
    if (straightHigh && flush) return { score: [8, straightHigh], name: straightHigh === 14 ? "Royal Flush" : "Straight Flush" };
    if (byCount[0][1] === 4) return { score: [7, byCount[0][0], byCount.find((e) => e[1] === 1)?.[0] || 0], name: "Four of a Kind" };
    if (byCount[0][1] === 3 && byCount[1]?.[1] >= 2) return { score: [6, byCount[0][0], byCount[1][0]], name: "Full House" };
    if (flush) return { score: [5, ...ranks], name: "Flush" };
    if (straightHigh) return { score: [4, straightHigh], name: "Straight" };
    if (byCount[0][1] === 3) return { score: [3, byCount[0][0], ...byCount.filter((e) => e[1] === 1).map((e) => e[0]).sort((a, b) => b - a)], name: "Three of a Kind" };
    if (byCount[0][1] === 2 && byCount[1]?.[1] === 2) {
      const pairRanks = byCount.filter((e) => e[1] === 2).map((e) => e[0]).sort((a, b) => b - a);
      return { score: [2, pairRanks[0], pairRanks[1], byCount.find((e) => e[1] === 1)?.[0] || 0], name: "Two Pair" };
    }
    if (byCount[0][1] === 2) return { score: [1, byCount[0][0], ...byCount.filter((e) => e[1] === 1).map((e) => e[0]).sort((a, b) => b - a)], name: "Pair" };
    return { score: [0, ...ranks], name: "High Card" };
  }
  function evaluate7(cards) {
    let best = null;
    for (let a = 0; a < cards.length - 4; a += 1) for (let b = a + 1; b < cards.length - 3; b += 1) for (let c = b + 1; c < cards.length - 2; c += 1) for (let d = c + 1; d < cards.length - 1; d += 1) for (let e = d + 1; e < cards.length; e += 1) {
      const result = evaluate5([cards[a], cards[b], cards[c], cards[d], cards[e]]);
      if (!best || compareArrays(result.score, best.score) > 0) best = result;
    }
    return best;
  }
  function formatCards(cards) { return cards.map((card) => `${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}`).join(" "); }
  function getDealOrder(dealerIndex){
    const base = TABLE_LEFT_TO_RIGHT_ORDER.filter((idx)=>idx < players.length);
    const startAt = Math.max(0, base.indexOf(dealerIndex));
    return [...base.slice(startAt + 1), ...base.slice(0, startAt + 1)];
  }
  function activePlayers(){ return current?.handPlayers?.filter((p)=>!p.player.folded) || []; }
  function postBet(player, amount){
    const bet = Math.max(0, Math.min(amount, player.stack));
    player.stack -= bet; player.committed += bet;
    if (current) current.pot += bet;
    return bet;
  }
  function botDecision(player, street, toCall = 0){
    const result = current.results.find((r)=>r.player === current.handPlayers[player.index])?.result;
    const level = result?.score?.[0] || 0;
    const strengthBias = level >= 3 ? 1 : level >= 1 ? 0.55 : 0.18;
    const pressure = toCall > 90 ? 0.2 : toCall > 40 ? 0.35 : 0.55;
    if (toCall > 0 && strengthBias + pressure < 0.7) return { type: "fold", amount: 0 };
    if (level >= 4 && player.stack > toCall + 120) return { type: "raise", amount: toCall + 120 };
    if (level >= 2 && player.stack > toCall + 70 && street !== "river") return { type: "raise", amount: toCall + 70 };
    if (toCall > 0) return { type: "call", amount: toCall };
    if (level >= 2 && player.stack > 60) return { type: "bet", amount: 60 };
    return { type: "check", amount: 0 };
  }

  function clearPotStack() { while (potStack.children.length) potStack.remove(potStack.children[0]); }
  function refreshPotStack() {
    clearPotStack(); if (!current) return;
    const chipCount = Math.max(1, Math.min(42, Math.round(current.pot / 18)));
    const palette = [0x7d4dff, 0x2bd4ff, 0xf2d269, 0xff6fb1, 0x55ffb3];
    for (let i = 0; i < chipCount; i += 1) {
      const chip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.066, 0.066, 0.016, 24),
        new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.34, metalness: 0.14, emissive: palette[i % palette.length], emissiveIntensity: 0.32 })
      );
      const layer = Math.floor(i / 8);
      const offset = i % 8;
      chip.rotation.x = Math.PI / 2;
      chip.position.set((offset - 3.5) * 0.030, tableTopY + 0.026 + layer * 0.018, 0.16 + Math.sin(i * 1.7) * 0.015);
      chip.userData.baseY = chip.position.y;
      potStack.add(chip);
    }
  }
  function resetRingHighlights() { chairRings.forEach((ring, i) => { if (!ringBase[i]) return; ring.material.color.copy(ringBase[i].color); ring.material.opacity = ringBase[i].opacity; ring.scale.setScalar(ringBase[i].scale); }); }
  function applyWinnerHighlight(index) { chairRings.forEach((ring, i) => { if (i === index) { ring.material.color.set(0xf2d269); ring.material.opacity = 0.96; ring.scale.setScalar(1.06); } }); }
  function applyActionHighlight(index) { chairRings.forEach((ring, i) => { if (i === index) { ring.material.color.set(i === PLAYER_INDEX ? 0xf2d269 : 0x8ce5ff); ring.material.opacity = 0.92; ring.scale.setScalar(1.04); } else if (ringBase[i]) { ring.material.color.copy(ringBase[i].color); ring.material.opacity = ringBase[i].opacity; ring.scale.setScalar(ringBase[i].scale); } }); }
  function schedule(at, fn) { queue.push({ at, fn }); }

  function resetPlayersForHand(){
    players.forEach((p)=>{ p.committed = 0; p.folded = false; p.lastAction = ""; if (p.stack <= 0) p.stack = START_STACK; });
  }
  function revealPlayerCards(){
    const hp = current?.handPlayers?.find((p)=>p.player.index === PLAYER_INDEX);
    if (!hp) return "";
    return formatCards(hp.cards);
  }
  function setWaitingForUser({ street, toCall = 0, raiseAmount = 100, after }){
    waitingForUser = { street, callAmount: toCall, raiseAmount, after };
    current.stage = "player-turn";
    current.actorIndex = PLAYER_INDEX;
    applyActionHighlight(PLAYER_INDEX);
    actionText = `YOUR TURN • ${toCall ? `C Call $${toCall}` : "C Check"} • R Raise $${raiseAmount} • F Fold • A All-In`;
    paintStatus("YOUR TURN", `${revealPlayerCards()} • Pot $${current.pot} • Stack $${players[PLAYER_INDEX].stack}`, "rgba(244,210,105,0.98)");
    statusCb(`YOUR TURN • pot $${current.pot} • stack $${players[PLAYER_INDEX].stack}`);
  }
  function resolvePlayerAction(action){
    if (!waitingForUser || !current) return false;
    const player = players[PLAYER_INDEX];
    const wait = waitingForUser;
    let label = "checks";
    let amount = 0;
    if (action === "fold") { player.folded = true; label = "folds"; }
    else if (action === "allin") { amount = postBet(player, player.stack); label = `all-in $${amount}`; }
    else if (action === "raise") { amount = postBet(player, wait.callAmount + wait.raiseAmount); label = `raises $${amount}`; }
    else if (action === "call" || action === "check") { amount = postBet(player, wait.callAmount); label = wait.callAmount ? `calls $${amount}` : "checks"; }
    else return false;
    player.lastAction = label;
    waitingForUser = null;
    actionText = `YOU ${label} • Pot $${current.pot}`;
    refreshPotStack(); applyActionHighlight(PLAYER_INDEX);
    paintStatus(`YOU ${label}`, `${revealPlayerCards()} • pot $${current.pot}`, "rgba(244,210,105,0.98)");
    statusCb(`YOU ${label} • pot $${current.pot}`);
    lastActionAt = nowS;
    if (typeof wait.after === "function") wait.after();
    return true;
  }

  function botAction(index, street, toCall = 0){
    const player = players[index]; if (!player || player.folded) return;
    const decision = botDecision(player, street, toCall);
    let label = decision.type;
    if (decision.type === "fold") player.folded = true;
    else if (decision.amount > 0) { const paid = postBet(player, decision.amount); label = `${decision.type}s $${paid}`; }
    player.lastAction = label;
    refreshPotStack(); applyActionHighlight(index);
    paintStatus(`${player.name} ${label}`, `${street} • pot $${current.pot}`);
  }

  function finishShowdown(){
    const alive = activePlayers();
    let winnerRec = null;
    if (alive.length === 1) {
      winnerRec = current.results.find((r)=>r.player.player === alive[0]) || current.results.find((r)=>r.player.player.index === alive[0].index);
    }
    const ranked = current.results.filter((r)=>!r.player.player.folded).sort((a,b)=>compareArrays(b.result.score,a.result.score));
    const winner = winnerRec || ranked[0] || current.results[0];
    const winnerPlayer = players[winner.player.player.index];
    winnerPlayer.stack += current.pot;
    current.stage = "showdown"; current.actorIndex = winnerPlayer.index;
    applyWinnerHighlight(winnerPlayer.index); refreshPotStack();
    const winnerCards = formatCards(winner.player.cards);
    const boardText = formatCards(current.board);
    actionText = `Winner paid • ${winnerPlayer.name} stack $${winnerPlayer.stack} • H Next Hand`;
    paintStatus(`${winnerPlayer.name} wins • ${winner.result.name}`, `Pot $${current.pot} • Hole ${winnerCards} • Board ${boardText}`, "rgba(244,210,105,0.98)");
    statusCb(`HAND ${handNumber} • ${winnerPlayer.name} wins • ${winner.result.name} • pot $${current.pot}`);
    log("Poker showdown", { hand: handNumber, winner: winnerPlayer.name, handName: winner.result.name, board: boardText, pot: current.pot, stacks: players.map(p=>({ name:p.name, stack:p.stack })) });
    current.pot = 0;
  }

  function planHand() {
    handNumber += 1;
    cardObjects.splice(0).forEach((mesh)=>mesh.parent?.remove(mesh));
    animations.length = 0;
    clearPotStack(); resetRingHighlights(); resetPlayersForHand(); waitingForUser = null;

    const dealerIndex = (handNumber - 1) % players.length;
    const sbIndex = (dealerIndex + 1) % players.length;
    const bbIndex = (dealerIndex + 2) % players.length;
    const deck = shuffle(createDeck());
    const handPlayers = players.map((p) => ({ player: p, anchor: p.anchor, cards: [deck.shift(), deck.shift()] }));
    const board = [deck.shift(), deck.shift(), deck.shift(), deck.shift(), deck.shift()];
    const results = handPlayers.map((player) => ({ player, result: evaluate7([...player.cards, ...board]) })).sort((a, b) => compareArrays(b.result.score, a.result.score));
    current = { handPlayers, board, results, handNumber, dealerIndex, sbIndex, bbIndex, actorIndex: null, pot: 0, stage: "shuffle" };
    postBet(players[sbIndex], SMALL_BLIND); postBet(players[bbIndex], BIG_BLIND); refreshPotStack();
    queue = []; stepIndex = 0;
    let t = nowS + 0.65;

    schedule(t, () => {
      current.stage = "blinds";
      actionText = `Dealer ${BOT_NAMES[dealerIndex]} • SB $${SMALL_BLIND} • BB $${BIG_BLIND}`;
      paintStatus(`Hand ${handNumber} • blinds posted`, `Dealer ${BOT_NAMES[dealerIndex]} • pot $${current.pot}`);
      statusCb(`HAND ${handNumber} • blinds live • pot $${current.pot}`);
      applyActionHighlight(bbIndex);
    });

    const dealOrder = getDealOrder(dealerIndex);
    for (let round = 0; round < 2; round += 1) {
      for (const seatOrderIndex of dealOrder) {
        t += 0.34;
        schedule(t, () => {
          const player = handPlayers[seatOrderIndex];
          const card = player.cards[round];
          addCard(card, player.anchor.cards[round], 0.40, seatOrderIndex === PLAYER_INDEX ? 1.12 : 1.0).userData.isPokerCard = true;
          current.stage = "deal"; current.actorIndex = player.anchor.index;
          applyActionHighlight(player.anchor.index);
          const visible = player.anchor.index === PLAYER_INDEX ? formatCards(player.cards.slice(0, round + 1)) : "card dealt";
          paintStatus(`Dealing ${player.anchor.name}`, `${visible} • left-to-right from dealer button • pot $${current.pot}`);
        });
      }
    }

    t += 0.76;
    schedule(t, () => setWaitingForUser({ street: "preflop", toCall: BIG_BLIND, raiseAmount: 80, after: ()=>{
      const start = Math.max(nowS + 0.45, lastActionAt + 0.45);
      let localT = start;
      [0,1,2,4,5].forEach((idx)=>{ localT += 0.52; schedule(localT, ()=>botAction(idx, "preflop", idx === bbIndex ? 0 : 20)); });
      localT += 0.58; schedule(localT, ()=>{ addBurnCard(0,0.32).userData.isPokerCard = true; paintStatus("Burn", `Before flop • pot $${current.pot}`); });
      localT += 0.58; schedule(localT, ()=>{ current.stage = "flop"; for(let i=0;i<3;i++) addCard(board[i], boardAnchors[i], 0.48, 1.25).userData.isPokerCard = true; paintStatus(`Flop • ${formatCards(board.slice(0,3))}`, `pot $${current.pot}`); });
      localT += 0.85; schedule(localT, ()=>setWaitingForUser({ street:"flop", toCall:0, raiseAmount:100, after: ()=>{
        let t2 = nowS + 0.45; [0,1,2,4,5].forEach((idx)=>{ t2 += 0.48; schedule(t2, ()=>botAction(idx, "flop", 0)); });
        t2 += 0.5; schedule(t2, ()=>{ addBurnCard(1,0.32).userData.isPokerCard = true; paintStatus("Burn", `Before turn • pot $${current.pot}`); });
        t2 += 0.55; schedule(t2, ()=>{ current.stage = "turn"; addCard(board[3], boardAnchors[3], 0.48, 1.25).userData.isPokerCard = true; paintStatus(`Turn • ${formatCards(board.slice(0,4))}`, `pot $${current.pot}`); });
        t2 += 0.85; schedule(t2, ()=>setWaitingForUser({ street:"turn", toCall:0, raiseAmount:140, after: ()=>{
          let t3 = nowS + 0.45; [0,1,2,4,5].forEach((idx)=>{ t3 += 0.48; schedule(t3, ()=>botAction(idx, "turn", 0)); });
          t3 += 0.5; schedule(t3, ()=>{ addBurnCard(2,0.32).userData.isPokerCard = true; paintStatus("Burn", `Before river • pot $${current.pot}`); });
          t3 += 0.55; schedule(t3, ()=>{ current.stage = "river"; addCard(board[4], boardAnchors[4], 0.48, 1.25).userData.isPokerCard = true; paintStatus(`River • ${formatCards(board)}`, `pot $${current.pot}`); });
          t3 += 0.85; schedule(t3, ()=>setWaitingForUser({ street:"river", toCall:0, raiseAmount:180, after: ()=>{
            let t4 = nowS + 0.45; [0,1,2,4,5].forEach((idx)=>{ t4 += 0.48; schedule(t4, ()=>botAction(idx, "river", 0)); });
            t4 += 1.0; schedule(t4, finishShowdown);
            t4 += 6.0; schedule(t4, planHand);
          }}));
        }}));
      }}));
    }}));

    actionText = `Shuffling • ${DEAL_DIRECTION}`;
    paintStatus(`Shuffling live deck`, `Hand ${handNumber} • Player stack $${players[PLAYER_INDEX].stack}`);
  }

  function orientCardToCamera(mesh) {
    const cam = scene.userData?._camera; if (!cam) return;
    const ry = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z);
    mesh.rotation.set(0, ry, 0);
  }
  function updateAnimations() {
    for (let i = animations.length - 1; i >= 0; i -= 1) {
      const anim = animations[i];
      const span = Math.max(0.0001, anim.end - anim.start);
      const t = THREE.MathUtils.clamp((nowS - anim.start) / span, 0, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      anim.mesh.position.lerpVectors(anim.fromPos, anim.toPos, eased);
      anim.mesh.position.y += Math.sin(eased * Math.PI) * 0.22;
      orientCardToCamera(anim.mesh);
      if (t >= 1) animations.splice(i, 1);
    }
  }
  function updateCardsHover() { cardObjects.forEach((mesh, i) => { if (animations.find((anim) => anim.mesh === mesh)) return; if (mesh.userData.baseY === undefined) mesh.userData.baseY = mesh.position.y; mesh.position.y = mesh.userData.baseY + Math.sin(nowS * 2.1 + i * 0.4) * 0.018; orientCardToCamera(mesh); }); }
  function updatePotStack() { potStack.children.forEach((chip, i) => { chip.position.y = chip.userData.baseY + Math.sin(nowS * 2.8 + i * 0.4) * 0.002; chip.rotation.z = Math.sin(nowS * 1.1 + i * 0.18) * 0.04; }); }
  function updateSeatChips() { players.forEach((player, idx)=>{ player.chips.forEach((stack, s)=>{ stack.position.y = stack.userData.baseY + Math.sin(nowS * 1.6 + idx * 0.5 + s * 0.7) * 0.005; }); }); }
  function updateStatusFacing() { const cam = scene.userData?._camera; if (!cam) return; [statusPanel.mesh, actionPanel.mesh].forEach((mesh)=>{ const ry = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z); mesh.rotation.set(0, ry, 0); }); }

  function playerAction(action){
    if (action === "next") { planHand(); return true; }
    if (!waitingForUser) { actionText = "No player decision pending • H starts next hand"; paintStatus("Poker controls ready", `Current stage: ${current?.stage || "loading"}`); return false; }
    if (action === "check") action = waitingForUser.callAmount ? "call" : "check";
    return resolvePlayerAction(action);
  }
  function update(now) {
    nowS = now;
    if (!current) planHand();
    while (!waitingForUser && queue[stepIndex] && nowS >= queue[stepIndex].at) {
      const ref = queue; queue[stepIndex].fn(); if (queue !== ref) break; stepIndex += 1;
    }
    updateAnimations(); updateCardsHover(); updatePotStack(); updateSeatChips(); updateStatusFacing();
  }
  function getState(){
    return { handNumber, stage: current?.stage || "loading", waitingForUser: !!waitingForUser, pot: current?.pot || 0, playerStack: players[PLAYER_INDEX]?.stack || 0, playerCards: current ? revealPlayerCards() : "", actionText };
  }

  const api = { update, forceNextHand(){ planHand(); }, playerAction, getState };
  if (typeof window !== "undefined") {
    window.SVR_POKER_CONTROL = api;
    window.addEventListener("keydown", (e)=>{
      if (e.repeat) return;
      if (e.code === "KeyF") playerAction("fold");
      if (e.code === "KeyC") playerAction("check");
      if (e.code === "KeyR") playerAction("raise");
      if (e.code === "KeyA") playerAction("allin");
      if (e.code === "KeyH") playerAction("next");
    });
  }
  paintActionPanel();
  return api;
}
