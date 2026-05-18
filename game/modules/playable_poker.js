import * as THREE from "three";

const PHASE = "PHASE-89-POKER-SIDEPOT-BETTING-POLISH-LOCK";
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["2", "3", "4", "5", "6", "7", "8", "9", "T", "J", "Q", "K", "A"];
const RANK_VALUE = Object.fromEntries(RANKS.map((rank, i) => [rank, i + 2]));
const PLAYER_SEAT_INDEX = 3;
const STARTING_STACK = 1000;
const SMALL_BLIND = 10;
const BIG_BLIND = 20;

function createDeck(){
  const deck = [];
  for (const suit of SUITS){
    for (const rank of RANKS) deck.push({ rank, suit, value: RANK_VALUE[rank], id: `${rank}${suit}` });
  }
  return deck;
}
function shuffle(deck){
  for (let i = deck.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}
function cardText(card){ return card ? card.id : "--"; }
function cardsText(cards, hidden = false){
  if (!cards?.length) return "--";
  if (hidden) return cards.map(()=>"??").join(" ");
  return cards.map(cardText).join(" ");
}
function comboScore(category, values){
  const padded = values.concat([0,0,0,0,0]).slice(0, 5);
  return category * 1e10 + padded[0] * 1e8 + padded[1] * 1e6 + padded[2] * 1e4 + padded[3] * 1e2 + padded[4];
}
function topValues(values, count, exclude = []){ return values.filter(v => !exclude.includes(v)).slice(0, count); }
function findStraight(values){
  const unique = Array.from(new Set(values)).sort((a,b)=>b-a);
  if (unique.includes(14)) unique.push(1);
  for (let i = 0; i <= unique.length - 5; i++){
    const window = unique.slice(i, i + 5);
    if (window[0] - window[4] === 4 && new Set(window).size === 5) return window[0];
  }
  return 0;
}
function evaluateFive(cards){
  const values = cards.map(c => c.value).sort((a,b)=>b-a);
  const counts = new Map();
  for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
  const grouped = Array.from(counts.entries()).sort((a,b)=> b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every(c => c.suit === cards[0].suit);
  const straightHigh = findStraight(values);
  if (flush && straightHigh) return { category: 8, values: [straightHigh], score: comboScore(8, [straightHigh]), label: "Straight Flush" };
  const quads = grouped.find(g => g[1] === 4);
  if (quads){
    const kicker = topValues(values, 1, [quads[0]])[0] || 0;
    return { category: 7, values: [quads[0], kicker], score: comboScore(7, [quads[0], kicker]), label: "Quads" };
  }
  const trips = grouped.filter(g => g[1] === 3).map(g => g[0]);
  const pairs = grouped.filter(g => g[1] === 2).map(g => g[0]);
  if (trips.length && pairs.length) return { category: 6, values: [trips[0], pairs[0]], score: comboScore(6, [trips[0], pairs[0]]), label: "Full House" };
  if (flush) return { category: 5, values, score: comboScore(5, values), label: "Flush" };
  if (straightHigh) return { category: 4, values: [straightHigh], score: comboScore(4, [straightHigh]), label: "Straight" };
  if (trips.length){
    const kickers = topValues(values, 2, [trips[0]]);
    return { category: 3, values: [trips[0], ...kickers], score: comboScore(3, [trips[0], ...kickers]), label: "Trips" };
  }
  if (pairs.length >= 2){
    const highPairs = pairs.slice(0, 2);
    const kicker = topValues(values, 1, highPairs)[0] || 0;
    return { category: 2, values: [...highPairs, kicker], score: comboScore(2, [...highPairs, kicker]), label: "Two Pair" };
  }
  if (pairs.length === 1){
    const kickers = topValues(values, 3, [pairs[0]]);
    return { category: 1, values: [pairs[0], ...kickers], score: comboScore(1, [pairs[0], ...kickers]), label: "Pair" };
  }
  return { category: 0, values, score: comboScore(0, values), label: "High Card" };
}
function combinations(cards, choose = 5){
  const out = [];
  const pick = [];
  const walk = (start) => {
    if (pick.length === choose){ out.push(pick.map(i => cards[i])); return; }
    for (let i = start; i < cards.length; i++){
      pick.push(i);
      walk(i + 1);
      pick.pop();
    }
  };
  walk(0);
  return out;
}
function evaluateBest(cards){
  if (!cards || cards.length < 5) return { category: 0, values: [], score: 0, label: "Waiting" };
  let best = null;
  for (const combo of combinations(cards, 5)){
    const evaled = evaluateFive(combo);
    if (!best || evaled.score > best.score) best = evaled;
  }
  return best || { category: 0, values: [], score: 0, label: "Waiting" };
}
function preflopStrength(cards){
  if (!cards || cards.length < 2) return 0.15;
  const [a,b] = cards;
  let s = (a.value + b.value) / 28;
  if (a.rank === b.rank) s += 0.35;
  if (a.suit === b.suit) s += 0.08;
  if (Math.abs(a.value - b.value) <= 2) s += 0.06;
  return Math.min(0.98, s);
}
function makeCanvasPanel(){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, toneMapped: false, side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2.15, 1.075), material);
  mesh.name = "SVR_PlayablePoker_TableStatus";
  mesh.position.set(0, 1.18, -0.88);
  mesh.rotation.x = -0.18;
  mesh.renderOrder = 42;
  return { canvas, ctx, texture, mesh };
}
function drawRoundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function clampNumber(value, min, max){ return Math.max(min, Math.min(max, Number.isFinite(value) ? Math.floor(value) : min)); }

export function createPlayablePoker({ scene, tableCenter = new THREE.Vector3(), seats = [], log = ()=>{}, onState = ()=>{} } = {}){
  const panel = makeCanvasPanel();
  scene.add(panel.mesh);
  const players = Array.from({ length: 6 }, (_, i) => ({
    seat: i,
    name: i === PLAYER_SEAT_INDEX ? "YOU" : ["NOVA", "CARLA", "MILO", "ACE", "RIVER", "ONYX"][i] || `BOT ${i + 1}`,
    isUser: i === PLAYER_SEAT_INDEX,
    stack: STARTING_STACK,
    bet: 0,
    totalBet: 0,
    folded: false,
    allIn: false,
    cards: [],
    acted: false,
    lastAction: ""
  }));
  let deck = [];
  let board = [];
  let pot = 0;
  let sidePots = [];
  let dealerButton = 0;
  let activeIndex = 0;
  let currentBet = 0;
  let minRaise = BIG_BLIND;
  let phase = "idle";
  let awaitingPlayer = false;
  let botTimer = 0;
  let handNumber = 0;
  let winnerText = "";
  let winnerDetails = "";
  let lastAction = "Ready — press H for next hand";
  let dirty = true;

  function orderedFrom(start){ return Array.from({ length: players.length }, (_, n) => (start + n) % players.length); }
  function liveBettingPlayers(){ return players.filter(p => !p.folded && !p.allIn && p.stack > 0 && p.cards.length); }
  function nextLiveIndex(from){
    for (let step = 1; step <= players.length; step++){
      const idx = (from + step) % players.length;
      const p = players[idx];
      if (!p.folded && !p.allIn && p.stack > 0 && p.cards.length) return idx;
    }
    return -1;
  }
  function contenders(){ return players.filter(p => !p.folded && p.cards.length); }
  function markDirty(){ dirty = true; onState(getState()); }
  function resetRoundBets(){
    for (const p of players){ p.bet = 0; p.acted = p.folded || p.allIn; }
    currentBet = 0;
    minRaise = BIG_BLIND;
  }
  function collect(player, amount){
    const pay = Math.min(Math.max(0, Math.floor(amount)), player.stack);
    player.stack -= pay;
    player.bet += pay;
    player.totalBet += pay;
    pot += pay;
    if (player.stack <= 0) player.allIn = true;
    return pay;
  }
  function postBlind(idx, amount, label){
    const p = players[idx];
    const paid = collect(p, amount);
    p.lastAction = `${label} ${paid}`;
    currentBet = Math.max(currentBet, p.bet);
  }
  function dealHoleCards(){
    const order = orderedFrom((dealerButton + 1) % players.length);
    for (let round = 0; round < 2; round++) for (const idx of order) players[idx].cards.push(deck.pop());
  }
  function beginHand(){
    handNumber += 1;
    deck = shuffle(createDeck());
    board = [];
    pot = 0;
    sidePots = [];
    currentBet = 0;
    minRaise = BIG_BLIND;
    winnerText = "";
    winnerDetails = "";
    phase = "preflop";
    dealerButton = (dealerButton + 1) % players.length;
    for (const p of players){
      if (p.stack <= 0) p.stack = STARTING_STACK;
      p.bet = 0; p.totalBet = 0; p.folded = false; p.allIn = false; p.cards = []; p.acted = false; p.lastAction = "";
    }
    dealHoleCards();
    const sb = (dealerButton + 1) % players.length;
    const bb = (dealerButton + 2) % players.length;
    postBlind(sb, SMALL_BLIND, "SB");
    postBlind(bb, BIG_BLIND, "BB");
    activeIndex = (bb + 1) % players.length;
    for (const p of players) p.acted = false;
    players[sb].acted = true;
    players[bb].acted = true;
    awaitingPlayer = players[activeIndex]?.isUser;
    botTimer = 0.55;
    lastAction = `Hand ${handNumber}: cards dealt left-to-right from dealer button`;
    markDirty();
  }
  function remainingUnfolded(){ return players.filter(p => !p.folded && p.cards.length); }
  function onlyOneLeft(){ return remainingUnfolded().length === 1; }
  function buildSidePots(){
    const levels = Array.from(new Set(players.map(p => p.totalBet).filter(v => v > 0))).sort((a,b)=>a-b);
    const pots = [];
    let prev = 0;
    for (const level of levels){
      const contributors = players.filter(p => p.totalBet >= level);
      const eligible = contributors.filter(p => !p.folded && p.cards.length);
      const amount = (level - prev) * contributors.length;
      if (amount > 0 && eligible.length) pots.push({ amount, eligible });
      prev = level;
    }
    return pots;
  }
  function addPayout(winners, amount){
    if (!winners.length || amount <= 0) return;
    const share = Math.floor(amount / winners.length);
    let remainder = amount - share * winners.length;
    for (const w of winners){
      w.stack += share + (remainder > 0 ? 1 : 0);
      if (remainder > 0) remainder -= 1;
    }
  }
  function payoutSingle(reason = "wins"){
    const winner = remainingUnfolded()[0];
    if (!winner) return;
    winner.stack += pot;
    winnerText = `${winner.name} ${reason} $${pot}`;
    winnerDetails = "All opponents folded";
    lastAction = winnerText;
    pot = 0;
    sidePots = [];
    phase = "showdown";
    awaitingPlayer = false;
    markDirty();
  }
  function roundComplete(){
    const active = liveBettingPlayers();
    if (active.length === 0) return true;
    return active.every(p => p.acted && p.bet === currentBet);
  }
  function firstPostflopActor(){
    const order = orderedFrom((dealerButton + 1) % players.length);
    return order.find(idx => !players[idx].folded && !players[idx].allIn && players[idx].stack > 0 && players[idx].cards.length) ?? -1;
  }
  function advanceStreet(){
    if (onlyOneLeft()) return payoutSingle("takes the pot");
    if (phase === "preflop"){
      board = [deck.pop(), deck.pop(), deck.pop()];
      phase = "flop";
    } else if (phase === "flop"){
      board.push(deck.pop());
      phase = "turn";
    } else if (phase === "turn"){
      board.push(deck.pop());
      phase = "river";
    } else if (phase === "river") return showdown();
    resetRoundBets();
    activeIndex = firstPostflopActor();
    if (activeIndex < 0) return showdown();
    awaitingPlayer = players[activeIndex]?.isUser;
    botTimer = 0.55;
    lastAction = `${phase.toUpperCase()} dealt`;
    markDirty();
  }
  function showdown(){
    const ranked = contenders().map(p => ({ player: p, hand: evaluateBest([...p.cards, ...board]) }));
    if (!ranked.length){ phase = "showdown"; markDirty(); return; }
    const byPlayer = new Map(ranked.map(r => [r.player, r.hand]));
    const pots = buildSidePots();
    const payouts = [];
    for (const sidePot of pots){
      let bestScore = -Infinity;
      for (const p of sidePot.eligible) bestScore = Math.max(bestScore, byPlayer.get(p)?.score ?? -Infinity);
      const winners = sidePot.eligible.filter(p => (byPlayer.get(p)?.score ?? -Infinity) === bestScore);
      addPayout(winners, sidePot.amount);
      const label = byPlayer.get(winners[0])?.label || "Hand";
      payouts.push(`${winners.map(w => w.name).join("/")} $${sidePot.amount} (${label})`);
    }
    const top = ranked.sort((a,b)=>b.hand.score-a.hand.score)[0];
    sidePots = pots.map(p => ({ amount: p.amount, eligible: p.eligible.map(e => e.name) }));
    winnerText = payouts[0] || `${top.player.name} wins — ${top.hand.label}`;
    winnerDetails = payouts.join(" • ") || `${top.player.name}: ${top.hand.label}`;
    lastAction = winnerText;
    pot = 0;
    phase = "showdown";
    awaitingPlayer = false;
    markDirty();
  }
  function getLegalState(player = players[PLAYER_SEAT_INDEX]){
    const inHand = !!player?.cards?.length && !player.folded && !player.allIn && phase !== "idle" && phase !== "showdown";
    const toCall = inHand ? Math.max(0, currentBet - player.bet) : 0;
    const canCheck = inHand && toCall === 0;
    const canCall = inHand && toCall > 0 && player.stack > 0;
    const minRaiseTo = Math.max(currentBet + minRaise, BIG_BLIND * 2);
    const maxRaiseTo = player ? player.bet + player.stack : 0;
    const canRaise = inHand && maxRaiseTo > Math.max(currentBet, minRaiseTo - 1) && player.stack > toCall;
    return { inHand, toCall, canFold: inHand, canCheck, canCall, canRaise, canAllIn: inHand && player.stack > 0, minRaiseTo, maxRaiseTo };
  }
  function setIllegal(player, label){
    if (player){ player.lastAction = `Blocked: ${label}`; }
    lastAction = `${player?.name || "Player"}: illegal action blocked (${label})`;
    markDirty();
    return false;
  }
  function actionFor(player, type, raiseMode = "min"){
    if (!player || phase === "showdown" || phase === "idle") return false;
    const legal = getLegalState(player);
    if (!legal.inHand) return setIllegal(player, "not active in hand");
    const toCall = legal.toCall;
    player.acted = true;
    if (type === "fold"){
      if (!legal.canFold) return setIllegal(player, "cannot fold");
      player.folded = true;
      player.lastAction = "Fold";
      lastAction = `${player.name}: fold`;
      if (onlyOneLeft()) payoutSingle("wins by fold");
    } else if (type === "allin"){
      if (!legal.canAllIn) return setIllegal(player, "cannot all-in");
      const beforeBet = player.bet;
      const paid = collect(player, player.stack);
      if (player.bet > currentBet){
        const actualRaise = player.bet - currentBet;
        currentBet = player.bet;
        if (actualRaise >= minRaise) minRaise = actualRaise;
        for (const p of players) if (p !== player && !p.folded && !p.allIn) p.acted = false;
      }
      player.lastAction = `All-In ${paid}`;
      lastAction = `${player.name}: all-in`;
      if (player.bet === beforeBet) player.allIn = true;
    } else if (type === "raise"){
      if (!legal.canRaise) return setIllegal(player, "cannot raise");
      let target = legal.minRaiseTo;
      if (raiseMode === "halfpot") target = Math.max(legal.minRaiseTo, currentBet + Math.ceil((pot + toCall) / 2));
      if (raiseMode === "pot") target = Math.max(legal.minRaiseTo, currentBet + pot + toCall);
      target = clampNumber(target, legal.minRaiseTo, legal.maxRaiseTo);
      const beforeBet = player.bet;
      const paid = collect(player, target - player.bet);
      if (player.bet > currentBet){
        const actualRaise = player.bet - currentBet;
        currentBet = player.bet;
        if (actualRaise >= minRaise) minRaise = actualRaise;
        for (const p of players) if (p !== player && !p.folded && !p.allIn) p.acted = false;
      }
      player.lastAction = player.allIn ? `Raise All-In ${paid}` : `Raise ${paid}`;
      lastAction = `${player.name}: raise to $${player.bet}`;
      if (player.bet === beforeBet) return setIllegal(player, "raise too small");
    } else {
      if (toCall > 0 && !legal.canCall) return setIllegal(player, "cannot call");
      if (toCall === 0 && !legal.canCheck) return setIllegal(player, "cannot check");
      const paid = collect(player, toCall);
      player.lastAction = toCall > 0 ? `Call ${paid}` : "Check";
      lastAction = `${player.name}: ${toCall > 0 ? "call" : "check"}`;
    }
    if (phase !== "showdown"){
      if (roundComplete()) advanceStreet();
      else {
        activeIndex = nextLiveIndex(activeIndex);
        awaitingPlayer = activeIndex >= 0 && players[activeIndex].isUser;
        botTimer = 0.55;
      }
    }
    markDirty();
    return true;
  }
  function userAction(type, raiseMode = "min"){
    if (!awaitingPlayer) return setIllegal(players[PLAYER_SEAT_INDEX], "not your turn");
    return actionFor(players[PLAYER_SEAT_INDEX], type, raiseMode);
  }
  function botAction(){
    const p = players[activeIndex];
    if (!p || p.isUser || p.folded || p.allIn) return;
    const legal = getLegalState(p);
    if (!legal.inHand) return;
    let strength = phase === "preflop" ? preflopStrength(p.cards) : (evaluateBest([...p.cards, ...board]).category / 8);
    strength += Math.random() * 0.16 - 0.08;
    if (legal.toCall > 0 && strength < 0.30 && legal.toCall > p.stack * 0.10) return actionFor(p, "fold");
    if (legal.canRaise && strength > 0.76 && Math.random() > 0.44) return actionFor(p, "raise", strength > 0.88 ? "halfpot" : "min");
    if (legal.canAllIn && strength > 0.93 && p.stack < pot * 0.45 && Math.random() > 0.55) return actionFor(p, "allin");
    return actionFor(p, "call");
  }
  function getState(){
    const user = players[PLAYER_SEAT_INDEX];
    const legal = getLegalState(user);
    const current = players[activeIndex];
    return {
      phase: PHASE,
      handNumber,
      street: phase,
      pot,
      sidePots,
      currentBet,
      minRaise,
      toCall: legal.toCall,
      legal,
      awaitingPlayer,
      activeName: current?.name || "--",
      playerStack: user.stack,
      playerBet: user.bet,
      playerCards: user.cards.map(cardText),
      board: board.map(cardText),
      winnerText,
      winnerDetails,
      lastAction,
      controls: "F Fold • C Check/Call • R Raise • A All-In • H Next"
    };
  }
  function drawPanel(){
    const { ctx, canvas, texture } = panel;
    const state = getState();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const bg = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
    bg.addColorStop(0, "rgba(3,5,12,0.92)");
    bg.addColorStop(1, "rgba(22,10,42,0.92)");
    ctx.fillStyle = bg;
    drawRoundRect(ctx, 18, 18, 988, 476, 34);
    ctx.fill();
    ctx.strokeStyle = state.awaitingPlayer ? "rgba(246,226,127,0.86)" : "rgba(178,132,255,0.78)";
    ctx.lineWidth = 6;
    drawRoundRect(ctx, 18, 18, 988, 476, 34);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 43px system-ui, Arial";
    ctx.fillText("SVR PLAYABLE POKER", 44, 70);
    ctx.fillStyle = "#7ff5c7";
    ctx.font = "bold 30px system-ui, Arial";
    ctx.fillText(`Pot $${state.pot}  •  ${state.street.toUpperCase()}  •  Active: ${state.activeName}`, 44, 118);
    ctx.fillStyle = "#e9e9ff";
    ctx.font = "bold 37px system-ui, Arial";
    ctx.fillText(`Board: ${cardsText(board)}`, 44, 178);
    ctx.fillText(`Your hand: ${cardsText(userCards())}`, 44, 232);
    ctx.fillStyle = state.awaitingPlayer ? "#f6e27f" : "#cfcfff";
    ctx.font = "bold 30px system-ui, Arial";
    ctx.fillText(state.awaitingPlayer ? `YOUR TURN — ${state.toCall > 0 ? `CALL $${state.toCall}` : "CHECK"}` : state.lastAction, 44, 292);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "24px system-ui, Arial";
    ctx.fillText(`Stack: $${state.playerStack} • Bet: $${state.playerBet} • Min Raise: $${state.legal.minRaiseTo}`, 44, 340);
    if (state.sidePots.length){
      ctx.fillStyle = "rgba(246,226,127,0.88)";
      ctx.font = "20px system-ui, Arial";
      ctx.fillText(`Side pots: ${state.sidePots.map(p => `$${p.amount}`).join(" / ")}`, 44, 372);
    }
    const rows = players.map(p => `${p.name}${p.seat === dealerButton ? " D" : ""}: $${p.stack} ${p.folded ? "FOLD" : p.lastAction || ""}`);
    ctx.fillStyle = "rgba(218,218,255,0.78)";
    ctx.font = "21px system-ui, Arial";
    rows.slice(0,3).forEach((row, i)=>ctx.fillText(row, 48, 410 + i * 26));
    rows.slice(3).forEach((row, i)=>ctx.fillText(row, 536, 410 + i * 26));
    if (winnerText){
      ctx.fillStyle = "#7ff5c7";
      ctx.font = "bold 25px system-ui, Arial";
      ctx.fillText(winnerText.slice(0, 58), 44, 486);
    }
    texture.needsUpdate = true;
    dirty = false;
  }
  function userCards(){ return players[PLAYER_SEAT_INDEX].cards; }
  function update(dt){
    panel.mesh.position.x = tableCenter.x || 0;
    if (phase !== "idle" && phase !== "showdown" && !awaitingPlayer){
      botTimer -= dt;
      if (botTimer <= 0) botAction();
    }
    if (dirty) drawPanel();
  }
  function nextHand(){ beginHand(); return true; }

  beginHand();
  drawPanel();
  log(`[${PHASE}] Side-pot and betting polish poker module loaded`);
  return {
    update,
    getState,
    start: nextHand,
    nextHand,
    fold: () => userAction("fold"),
    checkCall: () => userAction("call"),
    raise: () => userAction("raise", "min"),
    raiseHalfPot: () => userAction("raise", "halfpot"),
    raisePot: () => userAction("raise", "pot"),
    allIn: () => userAction("allin"),
    object: panel.mesh
  };
}
