import * as THREE from "three";
import { makeCanvasLabel, roundRect } from "./utils.js";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLOR = { S: "#101218", C: "#101218", H: "#c71f44", D: "#c71f44" };
const RANK_LABEL = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10", 9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2" };
const BOT_NAMES = ["BOT NOVA", "BOT VEGA", "BOT ORBIT", "YOU", "BOT ACE", "BOT LUX"];
const USER_INDEX = 3;
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

  const statusPanel = makeDynamicPanel(1400, 260, 3.2, 0.58);
  statusPanel.mesh.position.set(0, tableTopY + 1.22, -0.06);
  group.add(statusPanel.mesh);

  const potStack = new THREE.Group();
  group.add(potStack);

  buildSeatChips();

  let handNumber = 0;
  let nowS = 0;
  let queue = [];
  let stepIndex = 0;
  let current = null;
  let waitingForUser = null;

  function setGlobalPokerState(extra = {}){
    window.SVR_POKER_STATE = Object.assign({
      build: "PHASE-174-POKER-ACTION-LOCK",
      waiting: !!waitingForUser,
      handNumber,
      stage: current?.stage || "boot",
      pot: current?.pot || 0,
      userFolded: !!current?.userFolded
    }, extra);
  }

  function waitForUserAction(stage, callAmount = 0){
    if (current?.userFolded) return;
    current.stage = stage;
    current.actorIndex = USER_INDEX;
    waitingForUser = { stage, callAmount };
    applyActionHighlight(USER_INDEX);
    const label = callAmount > 0 ? `Call $${callAmount}, raise, all-in, or fold` : "Check, bet/raise, all-in, or fold";
    paintStatus(`YOUR TURN • ${stage.toUpperCase()}`, `${label} • pot $${current.pot}`, "rgba(126,240,208,0.98)");
    statusCb(`YOUR TURN • ${stage} • F fold • C call/check • R raise • A all-in`);
    setGlobalPokerState({ userDecision: label });
  }

  function resolveUserAction(action){
    if (action === "next") { waitingForUser = null; planHand(); return; }
    if (!waitingForUser || !current) return;
    const act = String(action || "").toLowerCase();
    let amount = 0;
    let label = "checks";
    if (act === "fold") { current.userFolded = true; label = "folds"; }
    else if (act === "raise") { amount = Math.max(80, waitingForUser.callAmount + 80); label = `raises $${amount}`; }
    else if (act === "allin" || act === "all-in") { amount = 500; label = `goes all-in $${amount}`; }
    else if (act === "call") { amount = waitingForUser.callAmount; label = amount > 0 ? `calls $${amount}` : "checks"; }
    else if (act === "check") { amount = 0; label = waitingForUser.callAmount > 0 ? "calls" : "checks"; if (waitingForUser.callAmount > 0) amount = waitingForUser.callAmount; }
    current.pot += amount;
    current.userContribution = (current.userContribution || 0) + amount;
    refreshPotStack();
    paintStatus(`YOU ${label}`, `${waitingForUser.stage} • pot $${current.pot}`, act === "fold" ? "rgba(255,120,120,0.98)" : "rgba(244,210,105,0.98)");
    statusCb(`YOU ${label} • pot $${current.pot}`);
    log("Player action", { hand: handNumber, action: act, amount, stage: waitingForUser.stage, pot: current.pot });
    waitingForUser = null;
    setGlobalPokerState({ lastUserAction: act });
  }

  window.addEventListener("svr_poker_action", (event)=> resolveUserAction(event.detail?.action));
  window.SVR_POKER_ACTION = resolveUserAction;

  function makeDynamicPanel(width, height, worldW, worldH) {
    const { canvas, ctx, texture } = makeCanvasLabel({
      width,
      height,
      draw(drawCtx, w, h) {
        drawCtx.clearRect(0, 0, w, h);
      },
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
    ctx.fillStyle = "rgba(0,0,0,0.48)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 42);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 8;
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 42);
    ctx.stroke();
    ctx.fillStyle = "#f5f0ff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 84px system-ui";
    ctx.fillText(title, canvas.width / 2, 92);
    ctx.fillStyle = "rgba(236,232,255,0.92)";
    ctx.font = "42px system-ui";
    ctx.fillText(subtitle, canvas.width / 2, 176);
    texture.needsUpdate = true;
  }

  function getCardTexture(card) {
    const key = card ? `${card.rank}${card.suit}` : "back";
    if (textureCache.has(key)) return textureCache.get(key);
    const { texture } = makeCanvasLabel({
      width: 512,
      height: 768,
      draw(ctx, w, h) {
        ctx.clearRect(0, 0, w, h);
        ctx.fillStyle = "#ffffff";
        roundRect(ctx, 12, 12, w - 24, h - 24, 38);
        ctx.fill();
        ctx.strokeStyle = "#d6d9e7";
        ctx.lineWidth = 8;
        roundRect(ctx, 12, 12, w - 24, h - 24, 38);
        ctx.stroke();
        if (!card) {
          ctx.fillStyle = "#160d28";
          roundRect(ctx, 38, 38, w - 76, h - 76, 30);
          ctx.fill();
          ctx.strokeStyle = "rgba(180,140,255,0.85)";
          ctx.lineWidth = 10;
          roundRect(ctx, 54, 54, w - 108, h - 108, 22);
          ctx.stroke();
          ctx.fillStyle = "rgba(239,233,255,0.95)";
          ctx.font = "bold 86px system-ui";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("SVR", w / 2, h / 2 - 30);
          ctx.font = "bold 44px system-ui";
          ctx.fillText("ALL IN", w / 2, h / 2 + 44);
          return;
        }
        const color = SUIT_COLOR[card.suit];
        const rank = RANK_LABEL[card.rank];
        const suit = SUIT_SYMBOL[card.suit];
        ctx.fillStyle = color;
        ctx.font = "bold 108px Georgia, serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";
        ctx.fillText(rank, 44, 28);
        ctx.font = "bold 86px Georgia, serif";
        ctx.fillText(suit, 48, 138);
        ctx.textAlign = "right";
        ctx.textBaseline = "bottom";
        ctx.fillText(rank, w - 44, h - 136);
        ctx.font = "bold 86px Georgia, serif";
        ctx.fillText(suit, w - 48, h - 28);
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = "bold 220px Georgia, serif";
        ctx.globalAlpha = 0.92;
        ctx.fillText(suit, w / 2, h / 2 + 18);
        ctx.globalAlpha = 1;
      },
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    textureCache.set(key, texture);
    return texture;
  }

  function createCardMesh(card, scale = 1) {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.24 * scale, 0.34 * scale),
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
    animations.push({
      mesh,
      fromPos: dealerOrigin.clone(),
      toPos: target.position.clone(),
      start: nowS,
      end: nowS + delay,
      scale,
    });
    return mesh;
  }

  function addBurnCard(index, delay = 0.38) {
    return addCard(null, burnAnchors[index], delay, 0.74);
  }

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
      const base = new THREE.Vector3(player.anchor.seat.x, tableTopY + 0.02, player.anchor.seat.z)
        .addScaledVector(inward, 0.72)
        .addScaledVector(tangent, -0.22);
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

  function createDeck() {
    const deck = [];
    for (const suit of SUITS) for (let rank = 2; rank <= 14; rank += 1) deck.push({ rank, suit });
    return deck;
  }
  function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }
  function compareArrays(a, b) {
    const len = Math.max(a.length, b.length);
    for (let i = 0; i < len; i += 1) {
      const av = a[i] ?? -1;
      const bv = b[i] ?? -1;
      if (av !== bv) return av - bv;
    }
    return 0;
  }
  function evaluate5(cards) {
    const ranks = cards.map((c) => c.rank).sort((a, b) => b - a);
    const counts = new Map();
    ranks.forEach((r) => counts.set(r, (counts.get(r) || 0) + 1));
    const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
    const flush = cards.every((c) => c.suit === cards[0].suit);
    const uniqueRanks = [...new Set(ranks)].sort((a, b) => b - a);
    let straightHigh = 0;
    if (uniqueRanks.length >= 5) {
      for (let i = 0; i <= uniqueRanks.length - 5; i += 1) {
        const slice = uniqueRanks.slice(i, i + 5);
        if (slice[0] - slice[4] === 4) { straightHigh = slice[0]; break; }
      }
      if (!straightHigh && uniqueRanks.includes(14) && uniqueRanks.includes(5) && uniqueRanks.includes(4) && uniqueRanks.includes(3) && uniqueRanks.includes(2)) straightHigh = 5;
    }
    if (straightHigh && flush) return { score: [8, straightHigh], name: straightHigh === 14 ? "Royal Flush" : "Straight Flush" };
    if (byCount[0][1] === 4) {
      const kicker = byCount.find((e) => e[1] === 1)[0];
      return { score: [7, byCount[0][0], kicker], name: "Four of a Kind" };
    }
    if (byCount[0][1] === 3 && byCount[1]?.[1] === 2) return { score: [6, byCount[0][0], byCount[1][0]], name: "Full House" };
    if (flush) return { score: [5, ...ranks], name: "Flush" };
    if (straightHigh) return { score: [4, straightHigh], name: "Straight" };
    if (byCount[0][1] === 3) {
      const kickers = byCount.filter((e) => e[1] === 1).map((e) => e[0]).sort((a, b) => b - a);
      return { score: [3, byCount[0][0], ...kickers], name: "Three of a Kind" };
    }
    if (byCount[0][1] === 2 && byCount[1]?.[1] === 2) {
      const pairRanks = byCount.filter((e) => e[1] === 2).map((e) => e[0]).sort((a, b) => b - a);
      const kicker = byCount.find((e) => e[1] === 1)[0];
      return { score: [2, pairRanks[0], pairRanks[1], kicker], name: "Two Pair" };
    }
    if (byCount[0][1] === 2) {
      const kickers = byCount.filter((e) => e[1] === 1).map((e) => e[0]).sort((a, b) => b - a);
      return { score: [1, byCount[0][0], ...kickers], name: "Pair" };
    }
    return { score: [0, ...ranks], name: "High Card" };
  }
  function evaluate7(cards) {
    let best = null;
    for (let a = 0; a < cards.length - 4; a += 1) {
      for (let b = a + 1; b < cards.length - 3; b += 1) {
        for (let c = b + 1; c < cards.length - 2; c += 1) {
          for (let d = c + 1; d < cards.length - 1; d += 1) {
            for (let e = d + 1; e < cards.length; e += 1) {
              const result = evaluate5([cards[a], cards[b], cards[c], cards[d], cards[e]]);
              if (!best || compareArrays(result.score, best.score) > 0) best = result;
            }
          }
        }
      }
    }
    return best;
  }
  function formatCards(cards) {
    return cards.map((card) => `${RANK_LABEL[card.rank]}${SUIT_SYMBOL[card.suit]}`).join(" ");
  }
  function handStrengthToBet(result, street = "preflop") {
    const level = result.score[0];
    if (street === "preflop") return level >= 2 ? 80 : level >= 1 ? 50 : 35;
    if (street === "flop") return level >= 3 ? 120 : level >= 1 ? 60 : 40;
    if (street === "turn") return level >= 4 ? 160 : level >= 2 ? 80 : 45;
    return level >= 5 ? 220 : level >= 2 ? 90 : 55;
  }

  function clearPotStack() { while (potStack.children.length) potStack.remove(potStack.children[0]); }
  function refreshPotStack() {
    clearPotStack();
    if (!current) return;
    const chipCount = Math.max(1, Math.min(30, Math.round(current.pot / 20)));
    const palette = [0x7d4dff, 0x2bd4ff, 0xf2d269, 0xff6fb1];
    for (let i = 0; i < chipCount; i += 1) {
      const chip = new THREE.Mesh(
        new THREE.CylinderGeometry(0.066, 0.066, 0.016, 24),
        new THREE.MeshStandardMaterial({ color: palette[i % palette.length], roughness: 0.34, metalness: 0.14, emissive: palette[i % palette.length], emissiveIntensity: 0.32 })
      );
      const layer = Math.floor(i / 7);
      const offset = i % 7;
      chip.rotation.x = Math.PI / 2;
      chip.position.set((offset - 3) * 0.028, tableTopY + 0.026 + layer * 0.018, 0.16 + Math.sin(i * 1.7) * 0.012);
      chip.userData.baseY = chip.position.y;
      potStack.add(chip);
    }
  }

  function resetRingHighlights() {
    chairRings.forEach((ring, i) => {
      if (!ringBase[i]) return;
      ring.material.color.copy(ringBase[i].color);
      ring.material.opacity = ringBase[i].opacity;
      ring.scale.setScalar(ringBase[i].scale);
    });
  }
  function applyWinnerHighlight(index) {
    chairRings.forEach((ring, i) => {
      if (i === index) {
        ring.material.color.set(0xf2d269);
        ring.material.opacity = 0.96;
        ring.scale.setScalar(1.06);
      }
    });
  }
  function applyActionHighlight(index) {
    chairRings.forEach((ring, i) => {
      if (i === index) {
        ring.material.color.set(0x8ce5ff);
        ring.material.opacity = 0.90;
        ring.scale.setScalar(1.03);
      } else if (ringBase[i]) {
        ring.material.color.copy(ringBase[i].color);
        ring.material.opacity = ringBase[i].opacity;
        ring.scale.setScalar(ringBase[i].scale);
      }
    });
  }

  function schedule(at, fn) { queue.push({ at, fn }); }

  function planHand() {
    handNumber += 1;
    clearCards();
    clearPotStack();
    resetRingHighlights();

    const dealerIndex = (handNumber - 1) % players.length;
    const sbIndex = (dealerIndex + 1) % players.length;
    const bbIndex = (dealerIndex + 2) % players.length;
    const deck = shuffle(createDeck());
    const handPlayers = players.map((p) => ({ anchor: p.anchor, cards: [deck.shift(), deck.shift()] }));
    const board = [deck.shift(), deck.shift(), deck.shift(), deck.shift(), deck.shift()];
    const results = handPlayers.map((player) => ({ player, result: evaluate7([...player.cards, ...board]) }));
    results.sort((a, b) => compareArrays(b.result.score, a.result.score));
    const winner = results[0];
    const runnerUp = results[1];
    const preflopAggressor = winner.player.anchor.index;
    const flopAggressor = runnerUp.player.anchor.index;
    const turnAggressor = winner.player.anchor.index;
    const riverAggressor = winner.player.anchor.index;
    current = { handPlayers, board, winner, results, handNumber, dealerIndex, sbIndex, bbIndex, actorIndex: null, pot: 0, stage: "shuffle", userFolded: false, userContribution: 0 };
    refreshPotStack();
    queue = [];
    let t = nowS + 0.85;

    schedule(t, () => {
      current.stage = "blinds";
      current.pot = 30;
      refreshPotStack();
      paintStatus(`Hand ${handNumber} • dealer ${BOT_NAMES[dealerIndex]}`, `SB ${BOT_NAMES[sbIndex]} • BB ${BOT_NAMES[bbIndex]} • pot $${current.pot}`);
      statusCb(`HAND ${handNumber} • blinds live • pot $${current.pot}`);
      applyActionHighlight(bbIndex);
    });

    for (let round = 0; round < 2; round += 1) {
      for (let i = 0; i < handPlayers.length; i += 1) {
        t += 0.42;
        schedule(t, () => {
          const player = handPlayers[i];
          const card = player.cards[round];
          addCard(card, player.anchor.cards[round], 0.46, 1.0);
          current.stage = "deal";
          current.actorIndex = player.anchor.index;
          applyActionHighlight(player.anchor.index);
          paintStatus(`Dealing ${player.anchor.name}`, `${formatCards(player.cards.slice(0, round + 1))} • pot $${current.pot}`);
        });
      }
    }

    t += 0.70;
    schedule(t, () => waitForUserAction("preflop", 20));

    t += 0.95;
    schedule(t, () => {
      const actor = preflopAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || winner.result;
      const amount = handStrengthToBet(result, "preflop");
      current.actorIndex = actor; current.stage = "preflop"; current.pot += amount; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${result.score[0] >= 2 ? "raises" : "calls"}`, `Preflop • pot $${current.pot}`);
    });

    t += 0.52;
    schedule(t, () => { addBurnCard(0, 0.34); paintStatus("Burn", `Before flop • pot $${current.pot}`); });
    t += 0.53;
    schedule(t, () => {
      current.stage = "flop";
      for (let i = 0; i < 3; i += 1) addCard(board[i], boardAnchors[i], 0.52, 1.18);
      current.pot += 90; refreshPotStack(); applyActionHighlight(flopAggressor);
      paintStatus(`Flop • ${formatCards(board.slice(0, 3))}`, `pot $${current.pot}`);
    });
    t += 0.55;
    schedule(t, () => waitForUserAction("flop", 0));
    t += 1.2;
    schedule(t, () => {
      const actor = flopAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || runnerUp.result;
      const amount = handStrengthToBet(result, "flop");
      const isBet = result.score[0] >= 1;
      current.actorIndex = actor; current.stage = "flop-action"; current.pot += isBet ? amount : 0; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${isBet ? "bets" : "checks"}`, `Flop • pot $${current.pot}`);
    });
    t += 0.58;
    schedule(t, () => { addBurnCard(1, 0.34); paintStatus("Burn", `Before turn • pot $${current.pot}`); });
    t += 0.67;
    schedule(t, () => {
      current.stage = "turn";
      addCard(board[3], boardAnchors[3], 0.52, 1.18);
      current.pot += 60; refreshPotStack(); applyActionHighlight(turnAggressor);
      paintStatus(`Turn • ${formatCards(board.slice(0, 4))}`, `pot $${current.pot}`);
    });
    t += 0.55;
    schedule(t, () => waitForUserAction("turn", 0));
    t += 1.2;
    schedule(t, () => {
      const actor = turnAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || winner.result;
      const amount = handStrengthToBet(result, "turn");
      const isBet = result.score[0] >= 2;
      current.actorIndex = actor; current.stage = "turn-action"; current.pot += isBet ? amount : 0; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${isBet ? "bets" : "checks"}`, `Turn • pot $${current.pot}`);
    });
    t += 0.58;
    schedule(t, () => { addBurnCard(2, 0.34); paintStatus("Burn", `Before river • pot $${current.pot}`); });
    t += 0.67;
    schedule(t, () => {
      current.stage = "river";
      addCard(board[4], boardAnchors[4], 0.52, 1.18);
      current.pot += 60; refreshPotStack(); applyActionHighlight(riverAggressor);
      paintStatus(`River • ${formatCards(board)}`, `pot $${current.pot}`);
    });
    t += 0.55;
    schedule(t, () => waitForUserAction("river", 0));
    t += 1.2;
    schedule(t, () => {
      const actor = riverAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || winner.result;
      const amount = handStrengthToBet(result, "river");
      const isBet = result.score[0] >= 2;
      current.actorIndex = actor; current.stage = "river-action"; current.pot += isBet ? amount : 0; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${isBet ? "shoves" : "checks"}`, `River • pot $${current.pot}`);
    });
    t += 1.55;
    schedule(t, () => {
      current.stage = "showdown";
      const finalWinner = current.userFolded ? (current.results.find((r)=>r.player.anchor.index !== USER_INDEX) || winner) : winner;
      current.actorIndex = finalWinner.player.anchor.index;
      applyWinnerHighlight(finalWinner.player.anchor.index);
      refreshPotStack();
      const winnerCards = formatCards(finalWinner.player.cards);
      const boardText = formatCards(board);
      paintStatus(`${finalWinner.player.anchor.name} wins • ${finalWinner.result.name}`, `Pot $${current.pot} • Hole ${winnerCards} • Board ${boardText}`, "rgba(244,210,105,0.98)");
      statusCb(`HAND ${handNumber} • ${finalWinner.player.anchor.name} wins • ${finalWinner.result.name} • pot $${current.pot}`);
      window.dispatchEvent(new CustomEvent("svr_hand_complete", { detail: { hand: handNumber, winner: finalWinner.player.anchor.name, handName: finalWinner.result.name, board: boardText, pot: current.pot } }));
      log("Poker showdown", { hand: handNumber, dealer: BOT_NAMES[dealerIndex], sb: BOT_NAMES[sbIndex], bb: BOT_NAMES[bbIndex], winner: finalWinner.player.anchor.name, handName: finalWinner.result.name, board: boardText, pot: current.pot });
    });
    t += 4.3;
    schedule(t, () => { planHand(); });
    stepIndex = 0;
    paintStatus(`Shuffling live deck`, `Hand ${handNumber} • real 52-card flow`);
  }

  function orientCardToCamera(mesh) {
    const cam = scene.userData?._camera;
    if (!cam) return;
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
  function updateCardsHover() {
    cardObjects.forEach((mesh, i) => {
      if (animations.find((anim) => anim.mesh === mesh)) return;
      if (mesh.userData.baseY === undefined) mesh.userData.baseY = mesh.position.y;
      mesh.position.y = mesh.userData.baseY + Math.sin(nowS * 2.1 + i * 0.4) * 0.018;
      orientCardToCamera(mesh);
    });
  }
  function updatePotStack() {
    potStack.children.forEach((chip, i) => {
      chip.position.y = chip.userData.baseY + Math.sin(nowS * 2.8 + i * 0.4) * 0.002;
      chip.rotation.z = Math.sin(nowS * 1.1 + i * 0.18) * 0.04;
    });
  }
  function updateSeatChips() {
    players.forEach((player, idx)=>{
      player.chips.forEach((stack, s)=>{
        stack.position.y = stack.userData.baseY + Math.sin(nowS * 1.6 + idx * 0.5 + s * 0.7) * 0.005;
      });
    });
  }
  function updateStatusFacing() {
    const cam = scene.userData?._camera;
    if (!cam) return;
    const ry = Math.atan2(cam.position.x - statusPanel.mesh.position.x, cam.position.z - statusPanel.mesh.position.z);
    statusPanel.mesh.rotation.set(0, ry, 0);
  }

  function update(now) {
    nowS = now;
    if (!current) planHand();
    if (waitingForUser) { setGlobalPokerState(); updateAnimations(); updateCardsHover(); updatePotStack(); updateSeatChips(); updateStatusFacing(); return; }
    while (queue[stepIndex] && nowS >= queue[stepIndex].at) {
      const ref = queue;
      queue[stepIndex].fn();
      if (queue !== ref) break;
      stepIndex += 1;
    }
    updateAnimations();
    updateCardsHover();
    updatePotStack();
    updateSeatChips();
    updateStatusFacing();
  }

  return { update, forceNextHand(){ planHand(); } };
}
