import * as THREE from "three";
import { makeCanvasLabel, roundRect } from "./utils.js";

const SUITS = ["S", "H", "D", "C"];
const SUIT_SYMBOL = { S: "♠", H: "♥", D: "♦", C: "♣" };
const SUIT_COLOR = { S: "#101218", C: "#101218", H: "#c71f44", D: "#c71f44" };
const RANK_LABEL = { 14: "A", 13: "K", 12: "Q", 11: "J", 10: "10", 9: "9", 8: "8", 7: "7", 6: "6", 5: "5", 4: "4", 3: "3", 2: "2" };
const BOT_NAMES = ["BOT NOVA", "BOT VEGA", "BOT ORBIT", "YOU", "BOT ACE", "BOT LUX"];
const PLAYER_INDEX = 3;
const TURN_SECONDS = 20;
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

  const proofPanel = makeDynamicPanel(1400, 310, 3.0, 0.66);
  proofPanel.mesh.position.set(0, tableTopY + 1.02, 0.64);
  group.add(proofPanel.mesh);

  const historyPanel = makeDynamicPanel(1400, 230, 2.95, 0.48);
  historyPanel.mesh.position.set(0, tableTopY + 0.84, 0.96);
  group.add(historyPanel.mesh);

  const potStack = new THREE.Group();
  group.add(potStack);

  buildSeatChips();
  paintProofPanel(null);
  paintHistoryPanel();

  let handNumber = 0;
  let nowS = 0;
  let queue = [];
  let stepIndex = 0;
  let current = null;
  let playerStacks = players.map(() => 1000);
  const handHistory = [];
  const MAX_HISTORY = 6;

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


  function paintProofPanel(proof = null) {
    const { ctx, canvas, texture } = proofPanel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(7,5,14,0.58)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 36);
    ctx.fill();
    ctx.strokeStyle = proof ? "rgba(244,210,105,0.90)" : "rgba(126,240,208,0.28)";
    ctx.lineWidth = 6;
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 36);
    ctx.stroke();
    ctx.fillStyle = proof ? "#f2d269" : "rgba(236,232,255,0.75)";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 48px system-ui";
    ctx.fillText(proof ? "WINNER PROOF" : "SHOWDOWN PROOF READY", 56, 48);
    ctx.fillStyle = "rgba(245,240,255,0.95)";
    ctx.font = "36px system-ui";
    const lines = proof ? [
      `${proof.winner} wins $${proof.payout} with ${proof.handName}`,
      `Best five: ${proof.bestFive}`,
      `Why: ${proof.reason}`,
      `Board: ${proof.board}`
    ] : [
      "Showdown will highlight the exact winning cards.",
      "Hand history will record winner, hand type, payout, and board.",
      "Use H / Next Hand to advance after review."
    ];
    lines.forEach((line, i) => ctx.fillText(line, 56, 116 + i * 45));
    texture.needsUpdate = true;
  }

  function paintHistoryPanel() {
    const { ctx, canvas, texture } = historyPanel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.46)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 32);
    ctx.fill();
    ctx.strokeStyle = "rgba(185,90,255,0.58)";
    ctx.lineWidth = 5;
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 32);
    ctx.stroke();
    ctx.fillStyle = "#f5f0ff";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    ctx.font = "bold 36px system-ui";
    ctx.fillText("HAND HISTORY", 54, 38);
    ctx.font = "29px system-ui";
    ctx.fillStyle = "rgba(236,232,255,0.92)";
    const rows = handHistory.slice(-4).reverse();
    if (!rows.length) {
      ctx.fillText("No completed hands yet.", 54, 92);
    } else {
      rows.forEach((row, i) => {
        ctx.fillText(`#${row.hand} ${row.winner} • ${row.handName} • +$${row.payout}`, 54, 86 + i * 33);
      });
    }
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
    clearWinningHighlights();
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
              const bestCards = [cards[a], cards[b], cards[c], cards[d], cards[e]];
              const result = evaluate5(bestCards);
              if (!best || compareArrays(result.score, best.score) > 0) {
                best = { ...result, cards: bestCards.slice() };
              }
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
  function cardKey(card) {
    return card ? `${card.rank}${card.suit}` : "";
  }
  function describeScore(result) {
    const score = result?.score || [];
    const name = result?.name || "High Card";
    const primary = RANK_LABEL[score[1]] || score[1] || "";
    const secondary = RANK_LABEL[score[2]] || score[2] || "";
    if (name === "Pair") return `Pair of ${primary}s with kickers`;
    if (name === "Two Pair") return `Two pair, ${primary}s and ${secondary}s`;
    if (name === "Three of a Kind") return `Trips ${primary}s`;
    if (name === "Straight") return `${primary}-high straight`;
    if (name === "Flush") return `${primary}-high flush`;
    if (name === "Full House") return `${primary}s full of ${secondary}s`;
    if (name === "Four of a Kind") return `Quad ${primary}s`;
    if (name === "Straight Flush") return `${primary}-high straight flush`;
    if (name === "Royal Flush") return "Ace-high royal flush";
    return `${primary || "high"} high`;
  }
  function clearWinningHighlights() {
    cardObjects.forEach((mesh) => {
      mesh.scale.set(1, 1, 1);
      if (mesh.material) {
        mesh.material.emissive?.set?.(0x130814);
        mesh.material.emissiveIntensity = 0.06;
      }
      mesh.userData.winningCard = false;
    });
  }
  function highlightWinningCards(cards) {
    const keys = new Set((cards || []).map(cardKey));
    cardObjects.forEach((mesh) => {
      const isWinner = keys.has(cardKey(mesh.userData.card));
      if (!isWinner) return;
      mesh.scale.set(1.18, 1.18, 1.18);
      mesh.userData.winningCard = true;
      if (mesh.material) {
        mesh.material.emissive?.set?.(0xf2d269);
        mesh.material.emissiveIntensity = 0.34;
      }
    });
  }
  function handStrengthToBet(result, street = "preflop", pot = 0) {
    const level = result?.score?.[0] || 0;
    const potBased = Math.max(35, Math.round((pot || 80) * 0.42));
    if (street === "preflop") return level >= 2 ? 100 : level >= 1 ? 70 : 40;
    if (street === "flop") return level >= 3 ? Math.max(130, potBased) : level >= 1 ? Math.max(75, Math.round(potBased * 0.85)) : 45;
    if (street === "turn") return level >= 4 ? Math.max(170, potBased) : level >= 2 ? Math.max(95, Math.round(potBased * 0.90)) : 55;
    return level >= 5 ? Math.max(230, potBased) : level >= 2 ? Math.max(115, Math.round(potBased * 0.95)) : 65;
  }

  function resetStacksIfNeeded() {
    if (!playerStacks.length || playerStacks.some((stack) => stack <= 0)) playerStacks = players.map(() => 1000);
  }

  function resetStreetBets(street) {
    if (!current) return;
    current.street = street;
    current.stage = `${street}-betting`;
    current.streetBets = players.map(() => 0);
    current.currentBet = 0;
    current.lastRaiseBy = null;
    current.lastBotBet = 0;
    current.callAmount = 0;
    current.legalActions = [];
  }

  function activeCount() {
    if (!current) return 0;
    return players.filter((_, i) => !current.folded?.[i] && (playerStacks[i] || 0) >= 0).length;
  }

  function pushActionLog(text) {
    if (!current) return;
    current.actionLog = current.actionLog || [];
    current.actionLog.push(text);
    if (current.actionLog.length > 8) current.actionLog.shift();
  }

  function commitBet(index, requestedAmount) {
    if (!current) return 0;
    const safeIndex = Math.max(0, Math.min(playerStacks.length - 1, index));
    const amount = Math.max(0, Math.floor(Number(requestedAmount) || 0));
    const paid = Math.min(amount, Math.max(0, playerStacks[safeIndex] || 0));
    playerStacks[safeIndex] = Math.max(0, (playerStacks[safeIndex] || 0) - paid);
    current.pot += paid;
    current.streetBets[safeIndex] = (current.streetBets[safeIndex] || 0) + paid;
    if ((playerStacks[safeIndex] || 0) <= 0) current.allIn[safeIndex] = true;
    return paid;
  }

  function awardPot(index) {
    if (!current) return 0;
    const paid = Math.max(0, current.pot || 0);
    playerStacks[index] = (playerStacks[index] || 0) + paid;
    current.lastPayout = paid;
    current.pot = 0;
    return paid;
  }

  function legalActionsFor(callAmount) {
    return callAmount > 0 ? ["fold", "call", "raise", "allin"] : ["fold", "check", "raise", "allin"];
  }

  function playerActionLabel(action, callAmount, paid = 0) {
    if (action === "check") return "checks";
    if (action === "call") return `calls $${Math.max(0, callAmount || paid)}`;
    if (action === "raise") return `raises to $${current?.streetBets?.[PLAYER_INDEX] || paid}`;
    if (action === "allin") return "moves all-in";
    return "folds";
  }

  function tableOrderFrom(startIndex) {
    return Array.from({ length: players.length }, (_, offset) => (startIndex + offset) % players.length);
  }

  function cardsVisibleForStreet(street) {
    if (street === "preflop") return [];
    if (street === "flop") return current.board.slice(0, 3);
    if (street === "turn") return current.board.slice(0, 4);
    return current.board.slice(0, 5);
  }

  function getPlayerResultAtStreet(index, street) {
    const hp = current.handPlayers[index];
    const visible = cardsVisibleForStreet(street);
    if (!hp) return { score: [0], name: "Unknown" };
    if (visible.length >= 3) return evaluate7([...hp.cards, ...visible]);
    return null;
  }

  function estimatePreflopStrength(cards) {
    if (!cards || cards.length < 2) return 0.20;
    const [a, b] = cards;
    const high = Math.max(a.rank, b.rank);
    const low = Math.min(a.rank, b.rank);
    const pair = a.rank === b.rank;
    const suited = a.suit === b.suit;
    const connected = Math.abs(a.rank - b.rank) <= 1;
    let strength = (high - 2) / 18 + (low - 2) / 30;
    if (pair) strength += 0.38 + (high >= 10 ? 0.12 : 0.0);
    if (suited) strength += 0.08;
    if (connected) strength += 0.06;
    if (high === 14) strength += 0.08;
    return THREE.MathUtils.clamp(strength, 0.05, 0.96);
  }

  function estimateStreetStrength(index, street) {
    const hp = current.handPlayers[index];
    if (!hp) return 0.25;
    if (street === "preflop") return estimatePreflopStrength(hp.cards);
    const result = getPlayerResultAtStreet(index, street);
    const level = result?.score?.[0] || 0;
    const kicker = (result?.score?.[1] || 0) / 14;
    const visible = cardsVisibleForStreet(street);
    const suitedCount = Math.max(...SUITS.map((s) => [...hp.cards, ...visible].filter((c) => c.suit === s).length));
    const drawBonus = suitedCount === 4 ? 0.10 : 0;
    return THREE.MathUtils.clamp((level / 8) + 0.18 + kicker * 0.18 + drawBonus, 0.05, 0.98);
  }

  function decideBotAction(index, street, closing = false) {
    const callAmount = Math.max(0, (current.currentBet || 0) - (current.streetBets[index] || 0));
    const stack = playerStacks[index] || 0;
    const strength = estimateStreetStrength(index, street);
    const pressure = stack > 0 ? callAmount / Math.max(stack, 1) : 1;
    const result = getPlayerResultAtStreet(index, street) || current.results.find((r) => r.player.anchor.index === index)?.result;
    const canRaise = !closing && stack > callAmount + 50 && activeCount() > 1;
    const bluff = Math.random() < (street === "preflop" ? 0.08 : 0.06);

    if (callAmount > 0) {
      if (strength < 0.30 && pressure > 0.09 && !bluff) return { action: "fold", amount: 0, strength, result };
      if (canRaise && (strength > 0.76 || bluff) && Math.random() < (strength > 0.80 ? 0.55 : 0.24)) {
        const raiseSize = handStrengthToBet(result || { score: [0] }, street, current.pot);
        return { action: "raise", amount: callAmount + raiseSize, strength, result };
      }
      return { action: "call", amount: callAmount, strength, result };
    }

    if (canRaise && (strength > 0.63 || bluff) && Math.random() < (strength > 0.74 ? 0.58 : 0.30)) {
      const betSize = handStrengthToBet(result || { score: [0] }, street, current.pot);
      return { action: "bet", amount: betSize, strength, result };
    }
    return { action: "check", amount: 0, strength, result };
  }

  function executeBotDecision(index, street, closing = false) {
    if (!current || current.folded[index] || current.allIn[index]) return;
    const decision = decideBotAction(index, street, closing);
    const name = BOT_NAMES[index] || `P${index + 1}`;
    let paid = 0;
    let label = "checks";

    if (decision.action === "fold") {
      current.folded[index] = true;
      label = "folds";
    } else if (decision.action === "call") {
      paid = commitBet(index, decision.amount);
      label = `calls $${paid}`;
    } else if (decision.action === "bet") {
      paid = commitBet(index, decision.amount);
      current.currentBet = Math.max(current.currentBet || 0, current.streetBets[index] || 0);
      current.lastRaiseBy = index;
      current.lastBotBet = paid;
      label = `bets $${paid}`;
    } else if (decision.action === "raise") {
      paid = commitBet(index, decision.amount);
      current.currentBet = Math.max(current.currentBet || 0, current.streetBets[index] || 0);
      current.lastRaiseBy = index;
      current.lastBotBet = paid;
      label = `raises to $${current.streetBets[index]}`;
    }

    current.actorIndex = index;
    current.stage = `${street}-${decision.action}`;
    current.lastBotAction = { index, name, action: decision.action, paid, strength: decision.strength, street };
    refreshPotStack();
    applyActionHighlight(index);
    const handName = decision.result?.name || (street === "preflop" ? "preflop read" : "table read");
    pushActionLog(`${name} ${label}`);
    paintStatus(`${name} ${label}`, `${capitalize(street)} • ${handName} • pot $${current.pot} • target $${current.currentBet || 0}`);
    statusCb(`${capitalize(street)} • ${name} ${label} • pot $${current.pot}`);
  }

  function capitalize(text) { return String(text || '').slice(0, 1).toUpperCase() + String(text || '').slice(1); }

  function paintPlayerPrompt(force = false) {
    if (!current?.waitingForPlayer) return;
    const elapsed = Math.max(0, nowS - (current.turnStartedAt || nowS));
    const remaining = Math.max(0, Math.ceil(TURN_SECONDS - elapsed));
    if (!force && current.lastPromptSecond === remaining) return;
    current.lastPromptSecond = remaining;
    const callAmount = current.callAmount || 0;
    const stack = playerStacks[PLAYER_INDEX] || 0;
    const legal = current.legalActions || legalActionsFor(callAmount);
    const actionText = callAmount > 0 ? `Fold / Call $${callAmount} / Raise / All-In` : "Fold / Check / Raise / All-In";
    const actionTail = current.actionLog?.length ? ` • Last: ${current.actionLog[current.actionLog.length - 1]}` : "";
    paintStatus(`YOUR TURN • ${remaining}s`, `${current.turnStreet || "Action"} • ${actionText} • pot $${current.pot} • stack $${stack}${actionTail}`, "rgba(140,229,255,0.98)");
    statusCb(`YOUR TURN • ${remaining}s • legal: ${legal.join("/")} • call $${callAmount} • pot $${current.pot} • stack $${stack}`);
  }

  function promptPlayerDecision(street, callAmount = null) {
    if (!current || current.folded[PLAYER_INDEX] || current.allIn[PLAYER_INDEX]) return;
    const required = callAmount === null ? Math.max(0, (current.currentBet || 0) - (current.streetBets[PLAYER_INDEX] || 0)) : callAmount;
    current.waitingForPlayer = true;
    current.turnStreet = street;
    current.callAmount = Math.max(0, required);
    current.legalActions = legalActionsFor(current.callAmount);
    current.turnStartedAt = nowS;
    current.lastPromptSecond = null;
    current.actorIndex = PLAYER_INDEX;
    current.stage = `${String(street).toLowerCase().replace(/[^a-z0-9]+/g, "-")}-player-turn`;
    applyActionHighlight(PLAYER_INDEX);
    paintPlayerPrompt(true);
  }

  function resumeAfterPlayerAction() {
    if (!current) return;
    current.waitingForPlayer = false;
    current.lastPromptSecond = null;
    const next = queue[stepIndex];
    if (next) {
      const shift = (nowS + 0.72) - next.at;
      for (let i = stepIndex; i < queue.length; i += 1) queue[i].at += shift;
    }
  }

  function closeBettingRound(street) {
    if (!current) return;
    current.stage = `${street}-closing`;
    const unmatchedBots = tableOrderFrom((current.dealerIndex + 1) % players.length)
      .filter((idx) => idx !== PLAYER_INDEX && !current.folded[idx] && !current.allIn[idx] && (current.streetBets[idx] || 0) < (current.currentBet || 0));
    unmatchedBots.forEach((idx) => executeBotDecision(idx, street, true));
    const playerNeedsResponse = !current.folded[PLAYER_INDEX] && !current.allIn[PLAYER_INDEX] && ((current.streetBets[PLAYER_INDEX] || 0) < (current.currentBet || 0));
    if (playerNeedsResponse) {
      promptPlayerDecision(`${capitalize(street)} Response`, Math.max(0, (current.currentBet || 0) - (current.streetBets[PLAYER_INDEX] || 0)));
      return;
    }
    resetRingHighlights();
    paintStatus(`${capitalize(street)} betting closed`, `Pot $${current.pot} • target $${current.currentBet || 0}`);
    statusCb(`${capitalize(street)} betting closed • pot $${current.pot}`);
  }

  function scheduleBettingRound(startAt, street, firstIndex) {
    let t = startAt;
    resetStreetBets(street);
    const order = tableOrderFrom(firstIndex);
    schedule(t, () => {
      resetStreetBets(street);
      paintStatus(`${capitalize(street)} betting round`, `Action starts with ${BOT_NAMES[firstIndex]} • pot $${current.pot}`);
      statusCb(`${capitalize(street)} betting round starts`);
    });
    for (const idx of order) {
      t += 0.78;
      schedule(t, () => {
        if (!current || current.folded[idx] || current.allIn[idx] || activeCount() <= 1) return;
        if (idx === PLAYER_INDEX) promptPlayerDecision(capitalize(street), null);
        else executeBotDecision(idx, street, false);
      });
    }
    t += 0.90;
    schedule(t, () => closeBettingRound(street));
    return t;
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
    paintProofPanel(null);
    paintHistoryPanel();
    resetStacksIfNeeded();

    const dealerIndex = (handNumber - 1) % players.length;
    const sbIndex = (dealerIndex + 1) % players.length;
    const bbIndex = (dealerIndex + 2) % players.length;
    const deck = shuffle(createDeck());
    const handPlayers = players.map((p) => ({ anchor: p.anchor, cards: [deck.shift(), deck.shift()] }));
    const board = [deck.shift(), deck.shift(), deck.shift(), deck.shift(), deck.shift()];
    const results = handPlayers.map((player) => ({ player, result: evaluate7([...player.cards, ...board]) }));
    results.sort((a, b) => compareArrays(b.result.score, a.result.score));
    current = {
      handPlayers,
      board,
      results,
      handNumber,
      dealerIndex,
      sbIndex,
      bbIndex,
      actorIndex: null,
      pot: 0,
      stage: "shuffle",
      street: "preflop",
      waitingForPlayer: false,
      userFolded: false,
      folded: players.map(() => false),
      allIn: players.map(() => false),
      streetBets: players.map(() => 0),
      currentBet: 0,
      legalActions: [],
      callAmount: 0,
      lastPayout: 0,
      lastBotBet: 0,
      actionLog: []
    };
    refreshPotStack();
    queue = [];
    let t = nowS + 0.85;

    schedule(t, () => {
      resetStreetBets("preflop");
      current.stage = "blinds";
      const sbPaid = commitBet(sbIndex, 10);
      const bbPaid = commitBet(bbIndex, 20);
      current.currentBet = Math.max(current.streetBets[sbIndex], current.streetBets[bbIndex]);
      current.lastRaiseBy = bbIndex;
      pushActionLog(`${BOT_NAMES[sbIndex]} posts SB $${sbPaid}`);
      pushActionLog(`${BOT_NAMES[bbIndex]} posts BB $${bbPaid}`);
      refreshPotStack();
      paintStatus(`Hand ${handNumber} • dealer ${BOT_NAMES[dealerIndex]}`, `SB ${BOT_NAMES[sbIndex]} $${sbPaid} • BB ${BOT_NAMES[bbIndex]} $${bbPaid} • pot $${current.pot}`);
      statusCb(`HAND ${handNumber} • blinds live • pot $${current.pot}`);
      applyActionHighlight(bbIndex);
    });

    const dealOrder = tableOrderFrom((dealerIndex + 1) % players.length);
    for (let round = 0; round < 2; round += 1) {
      for (const idx of dealOrder) {
        t += 0.42;
        schedule(t, () => {
          const player = handPlayers[idx];
          const card = player.cards[round];
          addCard(card, player.anchor.cards[round], 0.46, 1.0);
          current.stage = "deal";
          current.actorIndex = player.anchor.index;
          applyActionHighlight(player.anchor.index);
          paintStatus(`Dealing ${player.anchor.name}`, `Left-to-right from dealer button • card ${round + 1} • pot $${current.pot}`);
        });
      }
    }

    t += 0.80;
    t = scheduleBettingRound(t, "preflop", (bbIndex + 1) % players.length);

    t += 0.78;
    schedule(t, () => { addBurnCard(0, 0.34); paintStatus("Burn", `Before flop • pot $${current.pot}`); });
    t += 0.53;
    schedule(t, () => {
      current.stage = "flop";
      for (let i = 0; i < 3; i += 1) addCard(board[i], boardAnchors[i], 0.52, 1.18);
      refreshPotStack();
      paintStatus(`Flop • ${formatCards(board.slice(0, 3))}`, `pot $${current.pot}`);
    });
    t += 0.92;
    t = scheduleBettingRound(t, "flop", (dealerIndex + 1) % players.length);

    t += 0.78;
    schedule(t, () => { addBurnCard(1, 0.34); paintStatus("Burn", `Before turn • pot $${current.pot}`); });
    t += 0.67;
    schedule(t, () => {
      current.stage = "turn";
      addCard(board[3], boardAnchors[3], 0.52, 1.18);
      refreshPotStack();
      paintStatus(`Turn • ${formatCards(board.slice(0, 4))}`, `pot $${current.pot}`);
    });
    t += 0.92;
    t = scheduleBettingRound(t, "turn", (dealerIndex + 1) % players.length);

    t += 0.78;
    schedule(t, () => { addBurnCard(2, 0.34); paintStatus("Burn", `Before river • pot $${current.pot}`); });
    t += 0.67;
    schedule(t, () => {
      current.stage = "river";
      addCard(board[4], boardAnchors[4], 0.52, 1.18);
      refreshPotStack();
      paintStatus(`River • ${formatCards(board)}`, `pot $${current.pot}`);
    });
    t += 0.92;
    t = scheduleBettingRound(t, "river", (dealerIndex + 1) % players.length);

    t += 1.30;
    schedule(t, () => {
      current.stage = "showdown";
      const liveResults = current.results.filter((r) => !current.folded[r.player.anchor.index]);
      const liveWinner = liveResults[0] || current.results.find((r) => r.player.anchor.index !== PLAYER_INDEX) || current.results[0];
      current.winner = liveWinner;
      current.actorIndex = liveWinner.player.anchor.index;
      current.userFolded = !!current.folded[PLAYER_INDEX];
      applyWinnerHighlight(liveWinner.player.anchor.index);
      clearWinningHighlights();
      highlightWinningCards(liveWinner.result.cards || []);
      const payout = awardPot(liveWinner.player.anchor.index);
      refreshPotStack();
      const winnerCards = formatCards(liveWinner.player.cards);
      const boardText = formatCards(board);
      const bestFive = formatCards(liveWinner.result.cards || []);
      const proof = {
        hand: handNumber,
        winner: liveWinner.player.anchor.name,
        handName: liveWinner.result.name,
        payout,
        bestFive,
        holeCards: winnerCards,
        board: boardText,
        reason: describeScore(liveWinner.result),
        actions: current.actionLog?.slice() || []
      };
      current.winnerProof = proof;
      handHistory.push(proof);
      while (handHistory.length > MAX_HISTORY) handHistory.shift();
      paintProofPanel(proof);
      paintHistoryPanel();
      paintStatus(`${liveWinner.player.anchor.name} wins • ${liveWinner.result.name}`, `Payout $${payout} • Best five ${bestFive} • Board ${boardText}`, "rgba(244,210,105,0.98)");
      statusCb(`HAND ${handNumber} • ${liveWinner.player.anchor.name} wins • ${liveWinner.result.name} • best ${bestFive} • payout $${payout}`);
      log("Poker showdown proof", { hand: handNumber, dealer: BOT_NAMES[dealerIndex], sb: BOT_NAMES[sbIndex], bb: BOT_NAMES[bbIndex], winner: liveWinner.player.anchor.name, handName: liveWinner.result.name, bestFive, board: boardText, payout, stacks: playerStacks.slice(), actions: current.actionLog?.slice() });
    });
    t += 4.3;
    schedule(t, () => { planHand(); });
    stepIndex = 0;
    paintStatus(`Shuffling live deck`, `Hand ${handNumber} • bot AI betting rounds enabled`);
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
      const lift = mesh.userData.winningCard ? 0.055 : 0;
      mesh.position.y = mesh.userData.baseY + lift + Math.sin(nowS * 2.1 + i * 0.4) * 0.018;
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
    [statusPanel.mesh, proofPanel.mesh, historyPanel.mesh].forEach((mesh) => {
      const ry = Math.atan2(cam.position.x - mesh.position.x, cam.position.z - mesh.position.z);
      mesh.rotation.set(0, ry, 0);
    });
  }

  function update(now) {
    nowS = now;
    if (!current) planHand();
    while (!current?.waitingForPlayer && queue[stepIndex] && nowS >= queue[stepIndex].at) {
      const ref = queue;
      queue[stepIndex].fn();
      if (queue !== ref) break;
      stepIndex += 1;
      if (current?.waitingForPlayer) break;
    }
    if (current?.waitingForPlayer) {
      paintPlayerPrompt(false);
      const elapsed = Math.max(0, nowS - (current.turnStartedAt || nowS));
      if (elapsed >= TURN_SECONDS) {
        const autoAction = current.legalActions?.includes("check") ? "check" : "fold";
        playerAction(autoAction, true);
      }
    }
    updateAnimations();
    updateCardsHover();
    updatePotStack();
    updateSeatChips();
    updateStatusFacing();
  }

  function playerAction(action, auto = false) {
    if (!current) planHand();
    const normalized = String(action || '').toLowerCase();
    if (normalized === 'next') { planHand(); return true; }

    const labels = {
      fold: 'folds',
      check: 'checks',
      call: 'calls',
      raise: 'raises',
      allin: 'moves all-in'
    };
    if (!labels[normalized]) return false;

    if (!current.waitingForPlayer) {
      paintStatus('WAIT FOR YOUR TURN', `Current stage: ${current.stage || 'dealing'} • pot $${current.pot}`, 'rgba(255,210,105,0.92)');
      statusCb(`WAIT FOR YOUR TURN • ${normalized.toUpperCase()} ignored • stage ${current.stage}`);
      return false;
    }

    const legal = current.legalActions || [];
    if (!legal.includes(normalized)) {
      paintStatus('ACTION NOT LEGAL', `Legal now: ${legal.join(' / ').toUpperCase()} • pot $${current.pot}`, 'rgba(255,160,160,0.94)');
      statusCb(`ACTION NOT LEGAL • choose ${legal.join('/')}`);
      return false;
    }

    const callAmount = current.callAmount || 0;
    let paid = 0;
    if (normalized === 'call') paid = commitBet(PLAYER_INDEX, callAmount);
    if (normalized === 'raise') paid = commitBet(PLAYER_INDEX, Math.max(150, callAmount + 100));
    if (normalized === 'allin') paid = commitBet(PLAYER_INDEX, playerStacks[PLAYER_INDEX] || 0);
    if (normalized === 'fold') {
      current.userFolded = true;
      current.folded[PLAYER_INDEX] = true;
    }
    if ((normalized === 'raise' || normalized === 'allin') && (current.streetBets[PLAYER_INDEX] || 0) > (current.currentBet || 0)) {
      current.currentBet = current.streetBets[PLAYER_INDEX];
      current.lastRaiseBy = PLAYER_INDEX;
    }

    current.actorIndex = PLAYER_INDEX;
    current.stage = `player-${normalized}`;
    current.lastPlayerAction = { action: normalized, paid, auto: !!auto, at: nowS, street: current.street, target: current.currentBet };
    refreshPotStack();
    applyActionHighlight(PLAYER_INDEX);
    const actionPhrase = playerActionLabel(normalized, callAmount, paid);
    const prefix = auto ? 'AUTO ' : '';
    const paidText = paid ? `+$${paid} • ` : '';
    pushActionLog(`YOU ${actionPhrase}`);
    paintStatus(`${prefix}YOU ${actionPhrase}`, `${paidText}pot $${current.pot} • target $${current.currentBet || 0} • stack $${playerStacks[PLAYER_INDEX] || 0}`, normalized === 'fold' ? 'rgba(255,160,160,0.94)' : 'rgba(140,229,255,0.96)');
    statusCb(`${prefix}PLAYER ACTION • YOU ${actionPhrase} • ${paidText}pot $${current.pot}`);
    log('Player turn action', { action: normalized, paid, auto: !!auto, pot: current.pot, stack: playerStacks[PLAYER_INDEX], hand: handNumber, stage: current.stage, target: current.currentBet });
    resumeAfterPlayerAction();
    return true;
  }

  function getState() {
    return current ? {
      handNumber: current.handNumber,
      stage: current.stage,
      pot: current.pot,
      actorIndex: current.actorIndex,
      waitingForPlayer: !!current.waitingForPlayer,
      legalActions: current.legalActions || [],
      callAmount: current.callAmount || 0,
      currentBet: current.currentBet || 0,
      playerStreetBet: current.streetBets?.[PLAYER_INDEX] || 0,
      playerStack: playerStacks[PLAYER_INDEX] || 0,
      stacks: playerStacks.slice(),
      activePlayers: activeCount(),
      userFolded: !!current.userFolded,
      lastBotAction: current.lastBotAction || null,
      lastPlayerAction: current.lastPlayerAction || null,
      actionLog: current.actionLog?.slice() || [],
      winner: current.winner?.player?.anchor?.name || null,
      winnerHand: current.winner?.result?.name || null,
      winnerProof: current.winnerProof || null,
      handHistory: handHistory.slice(),
      lastPayout: current.lastPayout || 0
    } : null;
  }

  return { update, forceNextHand(){ planHand(); }, playerAction, getState };
}
