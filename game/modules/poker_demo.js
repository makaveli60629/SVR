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

  const historyPanel = makeDynamicPanel(1300, 560, 2.9, 1.18);
  historyPanel.mesh.position.set(0, tableTopY + 0.86, 1.08);
  group.add(historyPanel.mesh);

  const potStack = new THREE.Group();
  group.add(potStack);

  let handNumber = 0;
  let nowS = 0;
  let queue = [];
  let stepIndex = 0;
  let current = null;
  const playerStacks = players.map((_, i) => i === 3 ? 5000 : 4200 + i * 350);
  const handHistory = [];
  let lastWinnerSweep = null;
  let playerTurn = { active: false, expiresAt: 0, callAmount: 0, stage: '', pauseStartedAt: 0, lastSecond: -1 };
  const PLAYER_INDEX = 3;
  const actionLog = [];
  const legalState = { stage: 'idle', callAmount: 0, minRaise: 100, options: ['nextHand'], expiresAt: 0 };
  const decisionAid = { stage: 'idle', callAmount: 0, pot: 0, potOddsPct: 0, pressure: 'WAITING', hint: 'Waiting for action', updatedAt: 0 };
  const turnIndicator = { seatIndex: -1, actor: 'TABLE', stage: 'idle', action: 'waiting', remaining: 0, expiresAt: 0, updatedAt: 0 };
  const REBUY_FLOOR = 100;
  const REBUY_AMOUNT = 3000;
  const PLAYER_REBUY_AMOUNT = 5000;
  const rebuyLedger = [];

  function getContributionsLine() {
    if (!current?.contributions) return 'Contributions loading';
    return players.map((p, i) => `${p.anchor.name}: $${current.contributions[i] || 0}`).join('  •  ');
  }

  function getAllInNames() {
    if (!current?.allInPlayers) return [];
    return [...current.allInPlayers].map((i) => players[i]?.anchor?.name).filter(Boolean);
  }

  function getFoldedNames() {
    if (!current?.foldedPlayers) return [];
    return [...current.foldedPlayers].map((i) => players[i]?.anchor?.name).filter(Boolean);
  }

  function isFolded(index) {
    return !!current?.foldedPlayers?.has(index);
  }



  function getDealerBlindLine() {
    if (!current) return 'BUTTON: waiting • SB waiting • BB waiting';
    const dealer = players[current.dealerIndex]?.anchor?.name || 'TABLE';
    const sb = players[current.sbIndex]?.anchor?.name || 'SB';
    const bb = players[current.bbIndex]?.anchor?.name || 'BB';
    const nextButton = players[((current.dealerIndex || 0) + 1) % players.length]?.anchor?.name || 'TABLE';
    return `BUTTON: ${dealer} • SB: ${sb} • BB: ${bb} • NEXT: ${nextButton}`;
  }

  function getRebuyLine() {
    if (!rebuyLedger.length) return 'REBUY: none needed';
    const latest = rebuyLedger.slice(0, 3).map((r) => `${r.player} +$${r.added}`).join('  •  ');
    return `REBUY: ${latest}`;
  }

  function publishDealerButtonState(stage = '') {
    if (!current) return;
    const payload = {
      build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK',
      handNumber,
      stage: stage || current.stage || 'table',
      dealerIndex: current.dealerIndex,
      smallBlindIndex: current.sbIndex,
      bigBlindIndex: current.bbIndex,
      dealer: players[current.dealerIndex]?.anchor?.name || 'TABLE',
      smallBlind: players[current.sbIndex]?.anchor?.name || 'SB',
      bigBlind: players[current.bbIndex]?.anchor?.name || 'BB',
      nextDealerIndex: ((current.dealerIndex || 0) + 1) % players.length,
      line: getDealerBlindLine()
    };
    try { window.dispatchEvent(new CustomEvent('svr_poker_dealer_button_update', { detail: payload })); } catch (_) {}
  }

  function publishRebuyLedger(latest = [], reason = '') {
    if (!latest.length) return;
    const payload = {
      build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK',
      handNumber,
      reason: reason || 'table-continuity',
      latest,
      ledger: rebuyLedger.slice(0, 12),
      stacks: playerStacks.slice()
    };
    try { window.dispatchEvent(new CustomEvent('svr_poker_rebuy_update', { detail: payload })); } catch (_) {}
  }

  function ensurePlayableStacks(reason = 'new-hand') {
    const latest = [];
    players.forEach((player, index) => {
      const stack = Math.max(0, Math.round(playerStacks[index] || 0));
      if (stack > REBUY_FLOOR) return;
      const target = index === PLAYER_INDEX ? PLAYER_REBUY_AMOUNT : REBUY_AMOUNT;
      const added = Math.max(0, target - stack);
      if (added <= 0) return;
      playerStacks[index] = target;
      const entry = {
        hand: handNumber + 1,
        player: player.anchor.name,
        seatIndex: index,
        previousStack: stack,
        added,
        newStack: target,
        reason,
        at: new Date().toISOString()
      };
      latest.push(entry);
      rebuyLedger.unshift(entry);
    });
    if (rebuyLedger.length > 24) rebuyLedger.length = 24;
    if (latest.length) {
      paintHistory();
      publishRebuyLedger(latest, reason);
    }
    return latest;
  }

  function summarizeSidePots(sidePots = []) {
    if (!sidePots.length) return 'SIDE POTS: none';
    return sidePots.map((pot, i) => `P${i + 1} $${pot.amount} → ${pot.winners.join('/')}`).join('  •  ');
  }

  function resolveSidePots(results = [], contributions = [], totalPot = 0) {
    const normalized = players.map((_, i) => Math.max(0, Math.round(Number(contributions[i] || 0))));
    const folded = current?.foldedPlayers || new Set();
    const eligibleResults = results.filter((r) => !folded.has(r.player.anchor.index));
    const ranking = new Map((eligibleResults.length ? eligibleResults : results).map((r) => [r.player.anchor.index, r]));
    const levels = [...new Set(normalized.filter((v) => v > 0))].sort((a, b) => a - b);
    const sidePots = [];
    const payouts = players.map(() => 0);
    let previous = 0;

    for (const level of levels) {
      const contributors = normalized.map((v, i) => v >= level ? i : -1).filter((i) => i >= 0);
      const eligible = contributors.filter((i) => !folded.has(i));
      const amount = (level - previous) * contributors.length;
      previous = level;
      if (amount <= 0 || eligible.length === 0) continue;

      const ranked = eligible
        .map((seatIndex) => ranking.get(seatIndex))
        .filter(Boolean)
        .sort((a, b) => compareArrays(b.result.score, a.result.score));
      if (!ranked.length) continue;
      const top = ranked[0];
      const winners = ranked.filter((entry) => compareArrays(entry.result.score, top.result.score) === 0);
      const split = Math.floor(amount / winners.length);
      let remainder = amount - split * winners.length;
      winners.forEach((entry) => {
        const seatIndex = entry.player.anchor.index;
        payouts[seatIndex] += split + (remainder > 0 ? 1 : 0);
        if (remainder > 0) remainder -= 1;
      });
      sidePots.push({
        level,
        amount,
        eligible,
        contributors,
        foldedExcluded: [...folded],
        winners: winners.map((entry) => entry.player.anchor.name),
        winningHand: top.result.name,
        winningCards: formatCards(top.result.cards || [])
      });
    }

    const contributionTotal = normalized.reduce((sum, value) => sum + value, 0);
    const unassigned = Math.max(0, Math.round(Number(totalPot || 0)) - contributionTotal);
    if (unassigned > 0 && results[0]) {
      const seatIndex = results[0].player.anchor.index;
      payouts[seatIndex] += unassigned;
      sidePots.push({
        level: 'table-bonus',
        amount: unassigned,
        eligible: results.map((entry) => entry.player.anchor.index),
        winners: [results[0].player.anchor.name],
        winningHand: results[0].result.name,
        winningCards: formatCards(results[0].result.cards || []),
        note: 'unassigned table pot balance'
      });
    }

    const primaryWinnerIndex = payouts.reduce((best, value, index) => value > (payouts[best] || 0) ? index : best, results[0]?.player?.anchor?.index ?? 0);
    return {
      payouts,
      sidePots,
      contributionTotal,
      unassigned,
      totalPaid: payouts.reduce((sum, value) => sum + value, 0),
      primaryWinnerIndex
    };
  }

  function contributeToPot(index, requestedAmount = 0, stage = '', action = 'bet') {
    if (!Number.isFinite(index) || !players[index]) return 0;
    const request = Math.max(0, Math.round(Number(requestedAmount || 0)));
    const available = Math.max(0, Math.round(playerStacks[index] || 0));
    const paid = Math.min(request, available);
    if (paid <= 0) return 0;
    applyStackDelta(index, -paid);
    if (!current.contributions) current.contributions = players.map(() => 0);
    current.contributions[index] = Math.round((current.contributions[index] || 0) + paid);
    current.pot = Math.round((current.pot || 0) + paid);
    if (!current.allInPlayers) current.allInPlayers = new Set();
    if ((playerStacks[index] || 0) <= 0 || paid < request) {
      current.allInPlayers.add(index);
      try { window.dispatchEvent(new CustomEvent('svr_poker_allin_update', { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', handNumber, player: players[index].anchor.name, seatIndex: index, paid, requested: request, stage: stage || current.stage, pot: current.pot, stacks: playerStacks.slice(), contributions: current.contributions.slice(), allInPlayers: getAllInNames() } })); } catch (_) {}
    }
    refreshPotStack();
    return paid;
  }

  buildSeatChips();
  paintHistory();

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

  function paintHistory() {
    const { ctx, canvas, texture } = historyPanel;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "rgba(0,0,0,0.52)";
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 34);
    ctx.fill();
    ctx.strokeStyle = "rgba(242,210,105,0.72)";
    ctx.lineWidth = 5;
    roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 34);
    ctx.stroke();
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";

    ctx.fillStyle = "#f2d269";
    ctx.font = "bold 39px system-ui";
    ctx.fillText("HAND HISTORY / STACKS", 54, 54);
    ctx.fillStyle = "rgba(242,210,105,0.88)";
    ctx.font = "22px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(getDealerBlindLine().slice(0, 112), 54, 84);

    const turnActive = turnIndicator.seatIndex >= 0;
    const turnLine = turnActive
      ? `TURN: ${turnIndicator.actor} • ${turnIndicator.stage.toUpperCase()} • ${turnIndicator.action.toUpperCase()}${turnIndicator.remaining ? ' • ' + turnIndicator.remaining + 's' : ''}`
      : `TURN: ${turnIndicator.actor} • ${turnIndicator.stage.toUpperCase()} • ${turnIndicator.action.toUpperCase()}`;
    ctx.fillStyle = turnIndicator.actor === 'YOU' ? "#8ce5ff" : "#ffffff";
    ctx.font = "bold 29px system-ui";
    ctx.fillText(turnLine.slice(0, 94), 54, 112);

    ctx.fillStyle = "rgba(236,232,255,0.94)";
    ctx.font = "26px system-ui";
    const stackLine = players.map((p, i) => `${p.anchor.name}: $${playerStacks[i]}`).join("  •  ");
    ctx.fillText(stackLine.slice(0, 118), 54, 144);

    ctx.fillStyle = "rgba(140,229,255,0.84)";
    ctx.font = "21px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(getContributionsLine().slice(0, 124), 54, 174);

    const allInLine = getAllInNames().length ? `ALL-IN: ${getAllInNames().join(', ')}` : 'ALL-IN: none';
    ctx.fillStyle = getAllInNames().length ? "#ffb95f" : "rgba(236,232,255,0.52)";
    ctx.fillText(allInLine, 54, 202);

    const foldedLine = getFoldedNames().length ? `MUCKED/FOLDED: ${getFoldedNames().join(', ')}` : 'MUCKED/FOLDED: none';
    ctx.fillStyle = getFoldedNames().length ? "#ff7da0" : "rgba(236,232,255,0.52)";
    ctx.fillText(foldedLine, 54, 230);

    ctx.fillStyle = current?.sidePots?.length ? "#8ce5ff" : "rgba(236,232,255,0.52)";
    ctx.font = "21px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(current?.sidePots?.length ? summarizeSidePots(current.sidePots).slice(0, 116) : 'SIDE POTS: waiting for showdown', 54, 258);

    ctx.fillStyle = "#ffffff";
    ctx.font = "25px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    if (handHistory.length === 0) {
      ctx.fillStyle = "rgba(236,232,255,0.72)";
      ctx.fillText("No completed hands yet. Results will lock here after showdown.", 54, 292);
    } else {
      handHistory.slice(0, 2).forEach((h, i) => {
        ctx.fillStyle = i === 0 ? "#ffffff" : "rgba(236,232,255,0.82)";
        const cardsText = h.winningCards ? ` • WIN ${h.winningCards}` : '';
        ctx.fillText(`#${h.hand} ${h.winner} won $${h.pot} • ${h.handName}${cardsText}`.slice(0, 86), 54, 292 + i * 30);
      });
    }

    ctx.fillStyle = rebuyLedger.length ? "#55ffb3" : "rgba(236,232,255,0.52)";
    ctx.font = "21px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillText(getRebuyLine().slice(0, 110), 54, 332);

    ctx.fillStyle = "#8ce5ff";
    ctx.font = "bold 27px system-ui";
    ctx.fillText("LIVE ACTION LOG", 54, 360);
    ctx.font = "23px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    if (actionLog.length === 0) {
      ctx.fillStyle = "rgba(236,232,255,0.62)";
      ctx.fillText("Actions will appear here as bots and player act.", 54, 394);
    } else {
      actionLog.slice(0, 3).forEach((a, i) => {
        ctx.fillStyle = i === 0 ? "#ffffff" : "rgba(236,232,255,0.78)";
        ctx.fillText(`${a.actor}: ${a.action}${a.amount ? ' $' + a.amount : ''} • ${a.stage}`.slice(0, 88), 54, 392 + i * 28);
      });
    }

    ctx.fillStyle = "#f2d269";
    ctx.font = "bold 25px system-ui";
    ctx.fillText("LEGAL ACTIONS", 54, 468);
    ctx.font = "22px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    ctx.fillStyle = "rgba(236,232,255,0.86)";
    const legalLine = `${legalState.stage.toUpperCase()} • ${legalState.callAmount > 0 ? 'CALL $' + legalState.callAmount : 'CHECK FREE'} • MIN RAISE $${legalState.minRaise} • ${legalState.options.join('/')}`;
    ctx.fillText(legalLine.slice(0, 104), 54, 496);

    ctx.fillStyle = decisionAid.pressure === 'HIGH PRESSURE' ? '#ffb95f' : (decisionAid.pressure === 'FREE CHECK' ? '#55ffb3' : '#8ce5ff');
    ctx.font = '22px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace';
    ctx.fillText(formatDecisionAidLine().slice(0, 104), 54, 528);
    texture.needsUpdate = true;
  }

  function recordAction(actor, action, amount = 0, stage = '', automatic = false) {
    const clean = { actor: String(actor || 'TABLE'), action: String(action || 'acts').toUpperCase(), amount: Number(amount || 0), stage: String(stage || current?.stage || 'table'), automatic: !!automatic, hand: handNumber, at: new Date().toISOString() };
    actionLog.unshift(clean);
    if (actionLog.length > 12) actionLog.length = 12;
    paintHistory();
    try { window.dispatchEvent(new CustomEvent('svr_poker_action_log_update', { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', latest: clean, actions: actionLog.slice(0, 12), stacks: playerStacks.slice(), pot: current?.pot || 0 } })); } catch (_) {}
  }

  function recordHistory(entry) {
    handHistory.unshift(entry);
    if (handHistory.length > 8) handHistory.length = 8;
    paintHistory();
    try { window.dispatchEvent(new CustomEvent('svr_poker_history_update', { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', latest: entry, history: handHistory.slice(0, 8), stacks: playerStacks.slice() } })); } catch (_) {}
  }

  function applyStackDelta(index, amount) {
    if (!Number.isFinite(index) || !players[index]) return;
    playerStacks[index] = Math.max(0, Math.round((playerStacks[index] || 0) + amount));
    paintHistory();
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
              const combo = [cards[a], cards[b], cards[c], cards[d], cards[e]];
              const result = evaluate5(combo);
              if (!best || compareArrays(result.score, best.score) > 0) best = { ...result, cards: combo.slice() };
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


  function publishTurnIndicator(extra = {}) {
    const payload = {
      build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK',
      handNumber,
      seatIndex: turnIndicator.seatIndex,
      actor: turnIndicator.actor,
      stage: turnIndicator.stage,
      action: turnIndicator.action,
      remaining: turnIndicator.remaining,
      expiresAt: turnIndicator.expiresAt,
      pot: current?.pot || 0,
      stacks: playerStacks.slice(),
      legal: { ...legalState },
      ...extra
    };
    try { window.dispatchEvent(new CustomEvent('svr_poker_turn_indicator_update', { detail: payload })); } catch (_) {}
    try { window.dispatchEvent(new CustomEvent('svr_watch_turn_indicator_update', { detail: payload })); } catch (_) {}
  }

  function setTurnIndicator(seatIndex, stage = '', action = 'active', remaining = 0, expiresAt = 0) {
    const player = players[seatIndex];
    turnIndicator.seatIndex = Number.isFinite(seatIndex) ? seatIndex : -1;
    turnIndicator.actor = player?.anchor?.name || 'TABLE';
    turnIndicator.stage = String(stage || current?.stage || 'table');
    turnIndicator.action = String(action || 'active');
    turnIndicator.remaining = Math.max(0, Math.round(Number(remaining || 0)));
    turnIndicator.expiresAt = expiresAt || 0;
    turnIndicator.updatedAt = nowS;
    paintHistory();
    publishTurnIndicator();
  }

  function clearTurnIndicator(stage = '') {
    turnIndicator.seatIndex = -1;
    turnIndicator.actor = 'TABLE';
    turnIndicator.stage = String(stage || current?.stage || 'idle');
    turnIndicator.action = 'waiting';
    turnIndicator.remaining = 0;
    turnIndicator.expiresAt = 0;
    turnIndicator.updatedAt = nowS;
    paintHistory();
    publishTurnIndicator({ cleared: true });
  }


  function emitPokerEvent(name, payload = {}) {
    try { window.dispatchEvent(new CustomEvent(name, { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', handNumber, ...payload } })); } catch (_) {}
  }

  function shiftFutureQueue(delay) {
    if (!delay || delay <= 0) return;
    for (let i = stepIndex; i < queue.length; i += 1) queue[i].at += delay;
  }

  function computeLegalActions(callAmount = 0) {
    const options = ['fold'];
    if (callAmount > 0) options.push('call');
    else options.push('check');
    options.push('raise', 'allIn');
    return options;
  }

  function updateLegalState(stage, callAmount = 0, expiresAt = 0) {
    legalState.stage = String(stage || current?.stage || 'table');
    const available = playerStacks[PLAYER_INDEX] || 0;
    legalState.callAmount = Math.min(available, Math.max(0, Math.round(Number(callAmount || 0))));
    legalState.minRaise = Math.min(Math.max(0, available - legalState.callAmount), 100);
    legalState.options = computeLegalActions(legalState.callAmount);
    legalState.expiresAt = expiresAt || 0;
    computeDecisionAid(stage, legalState.callAmount);
    paintHistory();
    try { window.dispatchEvent(new CustomEvent('svr_poker_legal_actions_update', { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', handNumber, legal: { ...legalState }, decisionAid: { ...decisionAid }, pot: current?.pot || 0, stacks: playerStacks.slice() } })); } catch (_) {}
    publishDecisionAid();
    return legalState;
  }


  function computeDecisionAid(stage, callAmount = 0) {
    const call = Math.max(0, Math.round(Number(callAmount || 0)));
    const pot = Math.max(0, Math.round(Number(current?.pot || 0)));
    const denom = Math.max(1, pot + call);
    const potOddsPct = call > 0 ? Math.round((call / denom) * 100) : 0;
    let pressure = 'FREE CHECK';
    let hint = 'Check is free; raise only if you want pressure.';
    if (call > 0) {
      if (potOddsPct <= 14) { pressure = 'LOW PRESSURE'; hint = 'Small call compared to pot.'; }
      else if (potOddsPct <= 28) { pressure = 'MEDIUM PRESSURE'; hint = 'Moderate call; compare hand strength.'; }
      else { pressure = 'HIGH PRESSURE'; hint = 'Expensive call; fold or all-in pressure is live.'; }
    }
    decisionAid.stage = String(stage || current?.stage || 'table');
    decisionAid.callAmount = call;
    decisionAid.pot = pot;
    decisionAid.potOddsPct = potOddsPct;
    decisionAid.pressure = pressure;
    decisionAid.hint = hint;
    decisionAid.updatedAt = nowS;
    return { ...decisionAid };
  }

  function publishDecisionAid() {
    try {
      window.dispatchEvent(new CustomEvent('svr_poker_decision_aid_update', {
        detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', handNumber, decisionAid: { ...decisionAid }, legal: { ...legalState }, stacks: playerStacks.slice(), pot: current?.pot || 0 }
      }));
    } catch (_) {}
  }

  function formatDecisionAidLine() {
    const call = decisionAid.callAmount || 0;
    const odds = call > 0 ? `${decisionAid.potOddsPct}% pot odds` : '0% call cost';
    return `AID: ${decisionAid.pressure} • ${odds} • ${decisionAid.hint}`;
  }

  function formatLegalLine() {
    if (!legalState) return 'Legal actions loading';
    const primary = legalState.callAmount > 0 ? `Call $${legalState.callAmount} or fold` : 'Check free or raise';
    return `${primary} • Legal ${legalState.options.join('/')} • pot $${current?.pot || 0}`;
  }

  function normalizeLegalAction(action, callAmount = 0) {
    let normalized = String(action || '').trim();
    if (!normalized) normalized = callAmount > 0 ? 'call' : 'check';
    if (normalized === 'check' && callAmount > 0) normalized = 'call';
    if (normalized === 'call' && callAmount === 0) normalized = 'check';
    const legal = computeLegalActions(callAmount);
    if (!legal.includes(normalized)) {
      normalized = callAmount > 0 ? 'fold' : 'check';
    }
    return normalized;
  }

  function startPlayerTurn(stage, callAmount = 0) {
    playerTurn = { active: true, expiresAt: nowS + 20, callAmount: Math.max(0, Math.round(callAmount || 0)), stage, pauseStartedAt: nowS, lastSecond: -1 };
    current.actorIndex = PLAYER_INDEX;
    current.stage = `player-${stage}`;
    applyActionHighlight(PLAYER_INDEX);
    setTurnIndicator(PLAYER_INDEX, stage, 'awaiting action', 20, playerTurn.expiresAt);
    updateLegalState(stage, playerTurn.callAmount, playerTurn.expiresAt);
    recordAction('YOU', 'turn start', playerTurn.callAmount, stage);
    emitPokerEvent('svr_poker_player_action', { action: 'turn_start', stage, callAmount: playerTurn.callAmount, legal: { ...legalState }, decisionAid: { ...decisionAid }, expiresIn: 20 });
    paintStatus('YOUR TURN • 20 SEC', formatLegalLine(), 'rgba(126,240,208,0.98)');
  }

  function resolvePlayerTurn(action, automatic = false) {
    if (!current) return false;
    const wasActive = playerTurn.active;
    const callAmount = playerTurn.callAmount || 0;
    const stage = playerTurn.stage || current.stage || 'open';
    if (wasActive) {
      const delay = Math.max(0, nowS - playerTurn.pauseStartedAt);
      shiftFutureQueue(delay);
    }
    playerTurn.active = false;
    clearTurnIndicator(stage);
    current.actorIndex = PLAYER_INDEX;
    current.stage = automatic ? 'player-auto-action' : 'player-action';
    action = normalizeLegalAction(action, callAmount);
    updateLegalState(stage, callAmount, 0);
    let added = 0;
    let label = String(action || 'check').toUpperCase();
    if (action === 'fold') {
      if (!current.foldedPlayers) current.foldedPlayers = new Set();
      current.foldedPlayers.add(PLAYER_INDEX);
      added = 0;
      try { window.dispatchEvent(new CustomEvent('svr_poker_fold_eligibility_update', { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', handNumber, foldedPlayers: getFoldedNames(), seatIndex: PLAYER_INDEX, stage } })); } catch (_) {}
    }
    else if (action === 'call' || action === 'check') added = callAmount;
    else if (action === 'raise') added = callAmount + legalState.minRaise;
    else if (action === 'allIn') added = Math.max(500, callAmount + 500);
    if (action === 'allIn') added = playerStacks[PLAYER_INDEX] || 0;
    added = contributeToPot(PLAYER_INDEX, added, stage, action);
    refreshPotStack();
    applyActionHighlight(PLAYER_INDEX);
    if (action === 'check' && callAmount === 0) label = 'CHECK';
    if (action === 'call' && callAmount === 0) label = 'CHECK';
    const prefix = automatic ? 'AUTO ' : 'YOU ';
    const accent = action === 'fold' ? 'rgba(255,125,160,0.96)' : 'rgba(126,240,208,0.96)';
    paintStatus(`${prefix}${label}`, `${stage} • ${added ? '+$' + added + ' • ' : ''}pot $${current.pot}`, accent);
    statusCb(`${prefix}${label} • pot $${current.pot}`);
    recordAction('YOU', label, added, stage, automatic);
    emitPokerEvent('svr_poker_player_action', { action, automatic, stage, callAmount, added, pot: current.pot, legal: { ...legalState }, decisionAid: { ...decisionAid } });
    return true;
  }

  function updatePlayerTurnTimer() {
    if (!playerTurn.active) return false;
    const remaining = Math.max(0, Math.ceil(playerTurn.expiresAt - nowS));
    if (remaining !== playerTurn.lastSecond) {
      playerTurn.lastSecond = remaining;
      updateLegalState(playerTurn.stage, playerTurn.callAmount, playerTurn.expiresAt);
      setTurnIndicator(PLAYER_INDEX, playerTurn.stage, 'awaiting action', remaining, playerTurn.expiresAt);
      paintStatus(`YOUR TURN • ${remaining}s`, formatLegalLine(), remaining <= 5 ? 'rgba(255,185,95,0.98)' : 'rgba(126,240,208,0.98)');
    }
    if (remaining <= 0) {
      resolvePlayerTurn(playerTurn.callAmount > 0 ? 'fold' : 'check', true);
      return false;
    }
    return true;
  }

  function schedule(at, fn) { queue.push({ at, fn }); }

  function planHand() {
    handNumber += 1;
    clearCards();
    clearPotStack();
    resetRingHighlights();
    ensurePlayableStacks("new-hand");

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
    current = { handPlayers, board, winner, results, handNumber, dealerIndex, sbIndex, bbIndex, actorIndex: null, pot: 0, stage: "shuffle", contributions: players.map(() => 0), allInPlayers: new Set(), foldedPlayers: new Set(), sidePots: [] };
    publishDealerButtonState("shuffle");
    refreshPotStack();
    queue = [];
    let t = nowS + 0.85;

    schedule(t, () => {
      current.stage = "blinds";
      current.pot = 0;
      contributeToPot(sbIndex, 10, "blinds", "small blind");
      contributeToPot(bbIndex, 20, "blinds", "big blind");
      refreshPotStack();
      paintStatus(`Hand ${handNumber} • dealer ${BOT_NAMES[dealerIndex]}`, `SB ${BOT_NAMES[sbIndex]} • BB ${BOT_NAMES[bbIndex]} • pot $${current.pot}`);
      statusCb(`HAND ${handNumber} • blinds live • pot $${current.pot}`);
      applyActionHighlight(bbIndex);
      recordAction(BOT_NAMES[sbIndex], 'small blind', 10, 'blinds');
      recordAction(BOT_NAMES[bbIndex], 'big blind', 20, 'blinds');
      publishDealerButtonState("blinds");
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

    t += 0.95;
    schedule(t, () => {
      const actor = preflopAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || winner.result;
      const amount = handStrengthToBet(result, "preflop");
      const actionName = result.score[0] >= 2 ? 'raise' : 'call';
      current.actorIndex = actor;
      current.stage = "preflop";
      const paid = contributeToPot(actor, amount, "preflop", actionName);
      refreshPotStack();
      applyActionHighlight(actor);
      setTurnIndicator(actor, 'preflop', actionName, 0, 0);
      paintStatus(`${BOT_NAMES[actor]} ${actionName === 'raise' ? "raises" : "calls"}`, `Preflop • pot $${current.pot}`);
      recordAction(BOT_NAMES[actor], actionName, paid, 'preflop');
      emitPokerEvent('svr_poker_bot_action_safety', { actor: BOT_NAMES[actor], seatIndex: actor, action: actionName, requested: amount, paid, stage: 'preflop', pot: current.pot, stacks: playerStacks.slice() });
    });

    t += 0.52;
    schedule(t, () => { startPlayerTurn('preflop', 50); });
    t += 0.25;
    schedule(t, () => { addBurnCard(0, 0.34); paintStatus("Burn", `Before flop • pot $${current.pot}`); });
    t += 0.53;
    schedule(t, () => {
      current.stage = "flop";
      for (let i = 0; i < 3; i += 1) addCard(board[i], boardAnchors[i], 0.52, 1.18);
      current.pot += 90; refreshPotStack(); applyActionHighlight(flopAggressor);
      paintStatus(`Flop • ${formatCards(board.slice(0, 3))}`, `pot $${current.pot}`);
    });
    t += 1.2;
    schedule(t, () => {
      const actor = flopAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || runnerUp.result;
      const amount = handStrengthToBet(result, "flop");
      const isBet = result.score[0] >= 1;
      current.actorIndex = actor; current.stage = "flop-action"; setTurnIndicator(actor, 'flop', isBet ? 'bet' : 'check', 0, 0); const paid = isBet ? contributeToPot(actor, amount, "flop", isBet ? "bet" : "check") : 0; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${isBet ? "bets" : "checks"}`, `Flop • pot $${current.pot}`);
      recordAction(BOT_NAMES[actor], isBet ? 'bet' : 'check', paid, 'flop');
      emitPokerEvent('svr_poker_bot_action_safety', { actor: BOT_NAMES[actor], seatIndex: actor, action: isBet ? 'bet' : 'check', requested: amount, paid, stage: 'flop', pot: current.pot, stacks: playerStacks.slice() });
    });
    t += 0.58;
    schedule(t, () => { startPlayerTurn('flop', 0); });
    t += 0.25;
    schedule(t, () => { addBurnCard(1, 0.34); paintStatus("Burn", `Before turn • pot $${current.pot}`); });
    t += 0.67;
    schedule(t, () => {
      current.stage = "turn";
      addCard(board[3], boardAnchors[3], 0.52, 1.18);
      current.pot += 60; refreshPotStack(); applyActionHighlight(turnAggressor);
      paintStatus(`Turn • ${formatCards(board.slice(0, 4))}`, `pot $${current.pot}`);
    });
    t += 1.2;
    schedule(t, () => {
      const actor = turnAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || winner.result;
      const amount = handStrengthToBet(result, "turn");
      const isBet = result.score[0] >= 2;
      current.actorIndex = actor; current.stage = "turn-action"; setTurnIndicator(actor, 'turn', isBet ? 'bet' : 'check', 0, 0); const paid = isBet ? contributeToPot(actor, amount, "turn", isBet ? "bet" : "check") : 0; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${isBet ? "bets" : "checks"}`, `Turn • pot $${current.pot}`);
      recordAction(BOT_NAMES[actor], isBet ? 'bet' : 'check', paid, 'turn');
      emitPokerEvent('svr_poker_bot_action_safety', { actor: BOT_NAMES[actor], seatIndex: actor, action: isBet ? 'bet' : 'check', requested: amount, paid, stage: 'turn', pot: current.pot, stacks: playerStacks.slice() });
    });
    t += 0.58;
    schedule(t, () => { startPlayerTurn('turn', 0); });
    t += 0.25;
    schedule(t, () => { addBurnCard(2, 0.34); paintStatus("Burn", `Before river • pot $${current.pot}`); });
    t += 0.67;
    schedule(t, () => {
      current.stage = "river";
      addCard(board[4], boardAnchors[4], 0.52, 1.18);
      current.pot += 60; refreshPotStack(); applyActionHighlight(riverAggressor);
      paintStatus(`River • ${formatCards(board)}`, `pot $${current.pot}`);
    });
    t += 1.2;
    schedule(t, () => {
      const actor = riverAggressor;
      const result = current.results.find((r) => r.player.anchor.index === actor)?.result || winner.result;
      const amount = handStrengthToBet(result, "river");
      const isBet = result.score[0] >= 2;
      current.actorIndex = actor; current.stage = "river-action"; setTurnIndicator(actor, 'river', isBet ? 'shove' : 'check', 0, 0); const paid = isBet ? contributeToPot(actor, amount, "river", isBet ? "bet" : "check") : 0; refreshPotStack(); applyActionHighlight(actor);
      paintStatus(`${BOT_NAMES[actor]} ${isBet ? "shoves" : "checks"}`, `River • pot $${current.pot}`);
      recordAction(BOT_NAMES[actor], isBet ? 'shove' : 'check', paid, 'river');
      emitPokerEvent('svr_poker_bot_action_safety', { actor: BOT_NAMES[actor], seatIndex: actor, action: isBet ? 'shove' : 'check', requested: amount, paid, stage: 'river', pot: current.pot, stacks: playerStacks.slice() });
    });
    t += 0.64;
    schedule(t, () => { startPlayerTurn('river', 75); });
    t += 1.55;
    schedule(t, () => {
      current.stage = "showdown";
      current.actorIndex = winner.player.anchor.index;
      clearTurnIndicator('showdown');
      applyWinnerHighlight(winner.player.anchor.index);
      refreshPotStack();
      const winnerCards = formatCards(winner.player.cards);
      const winningCards = formatCards(winner.result.cards || []);
      const boardText = formatCards(board);
      const ranking = current.results.map((r, rankIndex) => ({
        rank: rankIndex + 1,
        player: r.player.anchor.name,
        handName: r.result.name,
        holeCards: formatCards(r.player.cards),
        bestFive: formatCards(r.result.cards || [])
      }));
      paintStatus(`${winner.player.anchor.name} wins • ${winner.result.name}`, `Pot $${current.pot} • Winning 5 ${winningCards} • Hole ${winnerCards}`, "rgba(244,210,105,0.98)");
      statusCb(`HAND ${handNumber} • ${winner.player.anchor.name} wins • ${winner.result.name} • winning 5 ${winningCards} • pot $${current.pot}`);
      const potResolution = resolveSidePots(current.results, current.contributions || [], current.pot);
      current.sidePots = potResolution.sidePots;
      potResolution.payouts.forEach((amount, seatIndex) => { if (amount > 0) applyStackDelta(seatIndex, amount); });
      const primaryWinnerIndex = potResolution.primaryWinnerIndex;
      const primaryWinner = players[primaryWinnerIndex]?.anchor?.name || winner.player.anchor.name;
      lastWinnerSweep = { startedAt: nowS, winnerIndex: primaryWinnerIndex, amount: potResolution.totalPaid };
      const sidePotText = summarizeSidePots(current.sidePots);
      paintStatus(`${primaryWinner} paid • ${winner.result.name}`, `Paid $${potResolution.totalPaid} • ${sidePotText}`.slice(0, 110), "rgba(244,210,105,0.98)");
      statusCb(`HAND ${handNumber} • ${primaryWinner} paid • side pots ${current.sidePots.length} • total paid $${potResolution.totalPaid}`);
      const handPayload = { hand: handNumber, dealer: BOT_NAMES[dealerIndex], sb: BOT_NAMES[sbIndex], bb: BOT_NAMES[bbIndex], winner: primaryWinner, handName: winner.result.name, board: boardText, pot: potResolution.totalPaid, winnerHoleCards: winnerCards, winningCards, ranking, contributions: current.contributions ? current.contributions.slice() : [], allInPlayers: getAllInNames(), foldedPlayers: getFoldedNames(), sidePots: current.sidePots, payouts: potResolution.payouts, stacks: playerStacks.slice(), dealerButton: getDealerBlindLine(), rebuys: rebuyLedger.slice(0, 8) };
      potResolution.payouts.forEach((amount, seatIndex) => { if (amount > 0) recordAction(players[seatIndex].anchor.name, 'side pot paid', amount, 'showdown'); });
      recordHistory(handPayload);
      emitPokerEvent('svr_poker_hand_result', handPayload);
      emitPokerEvent('svr_poker_showdown_reveal', handPayload);
      emitPokerEvent('svr_poker_side_pot_resolution', { sidePots: current.sidePots, payouts: potResolution.payouts, totalPaid: potResolution.totalPaid, contributions: current.contributions ? current.contributions.slice() : [], foldedPlayers: getFoldedNames() });
      emitPokerEvent('svr_poker_fold_eligibility_update', { foldedPlayers: getFoldedNames(), sidePots: current.sidePots, payouts: potResolution.payouts });
      log("Poker showdown", handPayload);
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
    let sweepTarget = null;
    if (lastWinnerSweep && nowS - lastWinnerSweep.startedAt < 2.2) {
      const seat = players[lastWinnerSweep.winnerIndex]?.anchor?.seat;
      if (seat) sweepTarget = new THREE.Vector3(seat.x * 0.42, tableTopY + 0.05, seat.z * 0.42);
    }
    potStack.children.forEach((chip, i) => {
      chip.position.y = chip.userData.baseY + Math.sin(nowS * 2.8 + i * 0.4) * 0.002;
      chip.rotation.z = Math.sin(nowS * 1.1 + i * 0.18) * 0.04;
      if (sweepTarget) {
        const span = THREE.MathUtils.clamp((nowS - lastWinnerSweep.startedAt) / 2.2, 0, 1);
        const eased = 1 - Math.pow(1 - span, 3);
        chip.position.x = THREE.MathUtils.lerp(chip.position.x, sweepTarget.x + (i % 6 - 2.5) * 0.018, eased * 0.10);
        chip.position.z = THREE.MathUtils.lerp(chip.position.z, sweepTarget.z + Math.sin(i) * 0.025, eased * 0.10);
      }
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
    const hry = Math.atan2(cam.position.x - historyPanel.mesh.position.x, cam.position.z - historyPanel.mesh.position.z);
    historyPanel.mesh.rotation.set(0, hry, 0);
  }

  function playerAction(action) {
    const normalized = action === 'nextHand' ? 'nextHand' : String(action || '').trim();
    if (normalized === 'nextHand') { playerTurn.active = false; planHand(); return true; }
    if (!current) planHand();
    if (playerTurn.active) {
      const actual = normalizeLegalAction(normalized, playerTurn.callAmount || 0);
      return resolvePlayerTurn(actual || 'check', false);
    }
    const label = normalized.replace(/([A-Z])/g, ' $1').trim().toUpperCase();
    current.actorIndex = PLAYER_INDEX;
    current.stage = 'player-free-action';
    applyActionHighlight(PLAYER_INDEX);
    setTurnIndicator(PLAYER_INDEX, current.stage, normalized || 'free action', 0, 0);
    let freeAdded = 0;
    if (normalized === 'fold') {
      if (!current.foldedPlayers) current.foldedPlayers = new Set();
      current.foldedPlayers.add(PLAYER_INDEX);
      try { window.dispatchEvent(new CustomEvent('svr_poker_fold_eligibility_update', { detail: { build: 'PHASE-219-AUTO-APPLY-VERIFY-LOCK', handNumber, foldedPlayers: getFoldedNames(), seatIndex: PLAYER_INDEX, stage: current.stage } })); } catch (_) {}
    }
    if (normalized === 'raise') freeAdded = 100;
    if (normalized === 'call') freeAdded = 50;
    if (normalized === 'allIn') freeAdded = 500;
    if (normalized === 'allIn') freeAdded = playerStacks[PLAYER_INDEX] || freeAdded;
    freeAdded = contributeToPot(PLAYER_INDEX, freeAdded, current.stage, normalized);
    refreshPotStack();
    const title = normalized === 'allIn' ? 'YOU ALL-IN' : `YOU ${label || 'ACT'}`;
    paintStatus(title, `Player action registered • pot $${current.pot}`, normalized === 'fold' ? 'rgba(255,125,160,0.96)' : 'rgba(126,240,208,0.95)');
    statusCb(`PLAYER ${label || 'ACTION'} • pot $${current.pot}`);
    recordAction('YOU', label || 'ACTION', freeAdded, current.stage);
    emitPokerEvent('svr_poker_player_action', { action: normalized, stage: current.stage, pot: current.pot, freeAction: true });
    return true;
  }


  function update(now) {
    nowS = now;
    if (!current) planHand();
    if (updatePlayerTurnTimer()) {
      updateAnimations();
      updateCardsHover();
      updatePotStack();
      updateSeatChips();
      updateStatusFacing();
      return;
    }
    while (queue[stepIndex] && nowS >= queue[stepIndex].at) {
      const ref = queue;
      try {
        queue[stepIndex].fn();
      } catch (err) {
        console.error('SVR poker scheduled step failed', err);
        recordAction('SYSTEM', 'step recovered', 0, current?.stage || 'runtime');
        emitPokerEvent('svr_poker_runtime_recovery', { message: String(err?.message || err), stage: current?.stage || 'runtime', stepIndex });
        paintStatus('Poker runtime recovered', String(err?.message || err).slice(0, 80), 'rgba(255,185,95,0.98)');
      }
      if (queue !== ref) break;
      stepIndex += 1;
    }
    updateAnimations();
    updateCardsHover();
    updatePotStack();
    updateSeatChips();
    updateStatusFacing();
  }

  return { update, forceNextHand(){ planHand(); }, playerAction, fold(){ return playerAction('fold'); }, call(){ return playerAction('call'); }, raise(){ return playerAction('raise'); }, allIn(){ return playerAction('allIn'); } };
}
