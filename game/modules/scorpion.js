import * as THREE from "three";
import { bootPrivateScene } from "./private_scene_common.js";

const BUILD = "PHASE-178-SCORPION-PLAYABLE-POLISH-LOCK";
const SUITS = ["♠", "♥", "♦", "♣"];
const RANKS = ["A", "K", "Q", "J", "10", "9", "8", "7", "6", "5", "4", "3", "2"];
const RANK_VALUE = { A: 14, K: 13, Q: 12, J: 11, "10": 10, "9": 9, "8": 8, "7": 7, "6": 6, "5": 5, "4": 4, "3": 3, "2": 2 };

function canvasTexture(draw, w = 1024, h = 512) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const x = c.getContext("2d");
  draw(x, c);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

function labelTexture(title, sub = "", stroke = "#d3a13b", w = 1024, h = 256) {
  return canvasTexture((x, c) => {
    const g = x.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, "#05070d");
    g.addColorStop(1, "#120719");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = stroke;
    x.lineWidth = 10;
    x.strokeRect(18, 18, c.width - 36, c.height - 36);
    x.strokeStyle = "rgba(100,234,255,.55)";
    x.lineWidth = 4;
    x.strokeRect(42, 42, c.width - 84, c.height - 84);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillStyle = "#fff7e3";
    x.font = "900 62px system-ui,Arial";
    x.fillText(title, c.width / 2, c.height * 0.42);
    if (sub) {
      x.fillStyle = "#64eaff";
      x.font = "800 28px system-ui,Arial";
      x.fillText(sub, c.width / 2, c.height * 0.67);
    }
  }, w, h);
}

function wallTexture() {
  return canvasTexture((x, c) => {
    x.fillStyle = "#05070d";
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "rgba(211,161,59,.24)";
    x.lineWidth = 4;
    for (let y = 30; y < c.height; y += 56) { x.beginPath(); x.moveTo(0, y); x.lineTo(c.width, y); x.stroke(); }
    for (let i = 0; i < 42; i++) {
      x.strokeStyle = i % 2 ? "rgba(100,234,255,.12)" : "rgba(180,140,255,.11)";
      x.strokeRect(Math.random() * c.width, Math.random() * c.height, 36 + Math.random() * 140, 14 + Math.random() * 64);
    }
  }, 1024, 1024);
}

function floorTexture() {
  return canvasTexture((x, c) => {
    const g = x.createRadialGradient(c.width / 2, c.height / 2, 12, c.width / 2, c.height / 2, c.width * 0.72);
    g.addColorStop(0, "#111426");
    g.addColorStop(0.52, "#06070c");
    g.addColorStop(1, "#020305");
    x.fillStyle = g;
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = "rgba(100,234,255,.16)";
    x.lineWidth = 2;
    for (let i = 0; i <= c.width; i += 64) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, c.height); x.stroke(); x.beginPath(); x.moveTo(0, i); x.lineTo(c.width, i); x.stroke(); }
    x.strokeStyle = "rgba(211,161,59,.42)";
    x.lineWidth = 8;
    x.strokeRect(20, 20, c.width - 40, c.height - 40);
  }, 1024, 1024);
}

function cardTexture(card, hidden = false) {
  return canvasTexture((x, c) => {
    x.fillStyle = hidden ? "#111827" : "#fffaf0";
    x.fillRect(0, 0, c.width, c.height);
    x.strokeStyle = hidden ? "#d3a13b" : "#111827";
    x.lineWidth = 16;
    x.strokeRect(14, 14, c.width - 28, c.height - 28);
    x.textAlign = "center";
    x.textBaseline = "middle";
    if (hidden) {
      x.fillStyle = "#d3a13b";
      x.font = "900 98px Arial";
      x.fillText("SVR", c.width / 2, c.height / 2 - 20);
      x.fillStyle = "#64eaff";
      x.font = "800 42px Arial";
      x.fillText("POKER", c.width / 2, c.height / 2 + 64);
      return;
    }
    const red = /♥|♦/.test(card);
    x.fillStyle = red ? "#c91532" : "#111827";
    x.font = "900 92px Georgia,serif";
    x.textAlign = "left";
    x.textBaseline = "top";
    x.fillText(card, 38, 26);
    x.textAlign = "right";
    x.textBaseline = "bottom";
    x.fillText(card, c.width - 38, c.height - 26);
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.font = "900 180px Georgia,serif";
    x.fillText(card.replace(/[AKQJ0-9]/g, ""), c.width / 2, c.height / 2 + 12);
  }, 420, 600);
}

function makeDeck() {
  const d = [];
  for (const r of RANKS) for (const s of SUITS) d.push(`${r}${s}`);
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function rankOf(card) { return RANK_VALUE[String(card).replace(/[♠♥♦♣]/g, "")]; }
function suitOf(card) { return String(card).replace(/[A-Z0-9]/g, ""); }
function compareScore(a, b) { for (let i = 0; i < Math.max(a.length, b.length); i++) { const x = a[i] ?? -1, y = b[i] ?? -1; if (x !== y) return x - y; } return 0; }
function evaluate(cards) {
  const ranks = cards.map(rankOf).sort((a, b) => b - a);
  const counts = new Map();
  ranks.forEach(r => counts.set(r, (counts.get(r) || 0) + 1));
  const byCount = [...counts.entries()].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const suits = new Map();
  cards.forEach(c => { const s = suitOf(c); suits.set(s, [...(suits.get(s) || []), rankOf(c)]); });
  const unique = [...new Set(ranks)].sort((a, b) => b - a);
  const straightHigh = (arr) => {
    const u = [...new Set(arr)].sort((a, b) => b - a);
    for (let i = 0; i <= u.length - 5; i++) if (u[i] - u[i + 4] === 4) return u[i];
    if (u.includes(14) && u.includes(5) && u.includes(4) && u.includes(3) && u.includes(2)) return 5;
    return 0;
  };
  let flushRanks = null;
  for (const list of suits.values()) if (list.length >= 5) flushRanks = list.sort((a, b) => b - a);
  if (flushRanks) { const sf = straightHigh(flushRanks); if (sf) return { name: sf === 14 ? "Royal Flush" : "Straight Flush", score: [8, sf] }; }
  if (byCount[0]?.[1] === 4) return { name: "Four of a Kind", score: [7, byCount[0][0], byCount.find(e => e[1] === 1)?.[0] || 0] };
  if (byCount[0]?.[1] === 3 && byCount[1]?.[1] >= 2) return { name: "Full House", score: [6, byCount[0][0], byCount[1][0]] };
  if (flushRanks) return { name: "Flush", score: [5, ...flushRanks.slice(0, 5)] };
  const st = straightHigh(unique);
  if (st) return { name: "Straight", score: [4, st] };
  if (byCount[0]?.[1] === 3) return { name: "Three of a Kind", score: [3, byCount[0][0], ...byCount.filter(e => e[1] === 1).map(e => e[0]).slice(0, 2)] };
  if (byCount[0]?.[1] === 2 && byCount[1]?.[1] === 2) return { name: "Two Pair", score: [2, byCount[0][0], byCount[1][0], byCount.find(e => e[1] === 1)?.[0] || 0] };
  if (byCount[0]?.[1] === 2) return { name: "Pair", score: [1, byCount[0][0], ...byCount.filter(e => e[1] === 1).map(e => e[0]).slice(0, 3)] };
  return { name: "High Card", score: [0, ...ranks.slice(0, 5)] };
}

function box(scene, name, size, pos, mat) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), mat);
  m.name = name;
  m.position.set(pos.x, pos.y, pos.z);
  m.frustumCulled = false;
  scene.add(m);
  return m;
}

function addRoom(scene) {
  scene.background = new THREE.Color(0x02040b);
  const wTex = wallTexture(); wTex.repeat.set(3, 1.6); wTex.wrapS = wTex.wrapT = THREE.RepeatWrapping;
  const fTex = floorTexture(); fTex.repeat.set(4, 4); fTex.wrapS = fTex.wrapT = THREE.RepeatWrapping;
  const wall = new THREE.MeshStandardMaterial({ map: wTex, roughness: .78, metalness: .04, emissive: 0x05020a, emissiveIntensity: .18 });
  const floor = new THREE.MeshStandardMaterial({ map: fTex, roughness: .76, metalness: .05, emissive: 0x02070a, emissiveIntensity: .14 });
  const gold = new THREE.MeshBasicMaterial({ color: 0xd3a13b, toneMapped: false });
  const cyan = new THREE.MeshBasicMaterial({ color: 0x64eaff, toneMapped: false });
  box(scene, "SCORPION_ROOM_FLOOR_PHASE178", { x: 18, y: .12, z: 18 }, { x: 0, y: -0.06, z: 0 }, floor);
  box(scene, "SCORPION_ROOM_LEFT_WALL_PHASE178", { x: .18, y: 6.2, z: 18 }, { x: -9, y: 3.05, z: 0 }, wall);
  box(scene, "SCORPION_ROOM_RIGHT_WALL_PHASE178", { x: .18, y: 6.2, z: 18 }, { x: 9, y: 3.05, z: 0 }, wall);
  box(scene, "SCORPION_ROOM_FRONT_WALL_PHASE178", { x: 18, y: 6.2, z: .18 }, { x: 0, y: 3.05, z: 8.95 }, wall);
  box(scene, "SCORPION_BACK_ABOVE_WINDOW_PHASE178", { x: 15.7, y: .78, z: .20 }, { x: 0, y: 5.82, z: -8.95 }, wall);
  box(scene, "SCORPION_BACK_BELOW_WINDOW_PHASE178", { x: 15.7, y: .62, z: .20 }, { x: 0, y: .31, z: -8.95 }, wall);
  box(scene, "SCORPION_WINDOW_TOP_GOLD_TRIM_PHASE178", { x: 15.7, y: .12, z: .26 }, { x: 0, y: 5.32, z: -8.78 }, gold);
  box(scene, "SCORPION_WINDOW_BOTTOM_GOLD_TRIM_PHASE178", { x: 15.7, y: .12, z: .26 }, { x: 0, y: .67, z: -8.78 }, gold);
  box(scene, "SCORPION_WINDOW_LEFT_GOLD_TRIM_PHASE178", { x: .12, y: 4.75, z: .26 }, { x: -7.85, y: 3, z: -8.78 }, gold);
  box(scene, "SCORPION_WINDOW_RIGHT_GOLD_TRIM_PHASE178", { x: .12, y: 4.75, z: .26 }, { x: 7.85, y: 3, z: -8.78 }, gold);
  box(scene, "SCORPION_CYAN_TRIM_LEFT_PHASE178", { x: .06, y: .04, z: 16.4 }, { x: -8.65, y: .07, z: 0 }, cyan);
  box(scene, "SCORPION_CYAN_TRIM_RIGHT_PHASE178", { x: .06, y: .04, z: 16.4 }, { x: 8.65, y: .07, z: 0 }, cyan);
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(15.1, 4.45), new THREE.MeshBasicMaterial({ color: 0x07111d, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false }));
  glass.name = "SCORPION_HIGH_SKYLINE_WINDOW_GLASS_PHASE178";
  glass.position.set(0, 3, -8.68);
  scene.add(glass);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(6.8, 1.45), new THREE.MeshBasicMaterial({ map: labelTexture("SCORPION ROOM", "PLAYABLE HEADS-UP POKER • PHASE 178"), transparent: true, toneMapped: false }));
  sign.name = "SCORPION_ROOM_PHASE178_HEADER_SIGN";
  sign.position.set(0, 5.48, -8.55);
  scene.add(sign);
}

function addSkyline(scene) {
  const city = new THREE.Group(); city.name = "SCORPION_HIGH_SKYLINE_ENVIRONMENT_PHASE178";
  const neon = [0x64eaff, 0xb48cff, 0xffd36b, 0x78ff9f];
  for (let i = 0; i < 60; i++) {
    const x = -34 + Math.random() * 68, z = -24 - Math.random() * 78, w = .9 + Math.random() * 4.2, d = .9 + Math.random() * 4.1, h = 12 + Math.random() * 64, base = -34 - Math.random() * 8;
    const mat = new THREE.MeshStandardMaterial({ color: i % 2 ? 0x08345d : 0x07101f, roughness: .65, metalness: .12, emissive: 0x06101c, emissiveIntensity: .28 });
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    b.position.set(x, base + h / 2, z - (i % 4) * 4);
    city.add(b);
    for (let r = 0; r < Math.min(15, Math.floor(h / 3.8)); r++) if (Math.random() > .2) {
      const s = new THREE.Mesh(new THREE.BoxGeometry(w * .78, .045, .018), new THREE.MeshBasicMaterial({ color: neon[(i + r) % neon.length], transparent: true, opacity: .55, toneMapped: false }));
      s.position.set(b.position.x, base + 1 + r * 3.3, b.position.z + d / 2 + .024);
      city.add(s);
    }
  }
  city.position.set(0, 0, -2.5);
  scene.add(city);
}

function addTable(scene) {
  const root = new THREE.Group();
  root.name = "SCORPION_PLAYABLE_TABLE_PHASE178";
  scene.add(root);
  const rail = new THREE.Mesh(new THREE.CylinderGeometry(2.65, 2.65, .28, 128), new THREE.MeshStandardMaterial({ color: 0x120608, roughness: .72, metalness: .10, emissive: 0x080101, emissiveIntensity: .12 }));
  rail.position.y = .88; root.add(rail);
  const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.18, 2.18, .052, 128), new THREE.MeshStandardMaterial({ color: 0x063725, roughness: .88, emissive: 0x01100b, emissiveIntensity: .14 }));
  felt.position.y = 1.06; root.add(felt);
  const betLine = new THREE.Mesh(new THREE.RingGeometry(1.42, 1.46, 128), new THREE.MeshBasicMaterial({ color: 0xd3a13b, transparent: true, opacity: .78, side: THREE.DoubleSide, toneMapped: false }));
  betLine.rotation.x = -Math.PI / 2; betLine.position.y = 1.092; root.add(betLine);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.32, .50), new THREE.MeshBasicMaterial({ map: labelTexture("SVR", "SCORPION", "#64eaff", 512, 256), transparent: true, toneMapped: false }));
  logo.rotation.x = -Math.PI / 2; logo.position.set(0, 1.105, 0); root.add(logo);
  const active = new THREE.Mesh(new THREE.RingGeometry(.68, .78, 72), new THREE.MeshBasicMaterial({ color: 0x64eaff, transparent: true, opacity: .60, side: THREE.DoubleSide, toneMapped: false }));
  active.name = "SCORPION_ACTIVE_SEAT_RING_PHASE178"; active.rotation.x = -Math.PI / 2; active.position.set(0, .035, 3.25); scene.add(active);
  const botRing = active.clone(); botRing.material = new THREE.MeshBasicMaterial({ color: 0xd3a13b, transparent: true, opacity: .35, side: THREE.DoubleSide, toneMapped: false }); botRing.position.set(0, .035, -3.25); scene.add(botRing);
  const bot = new THREE.Mesh(new THREE.CapsuleGeometry(.28, .86, 8, 18), new THREE.MeshStandardMaterial({ color: 0x1b263b, roughness: .68, emissive: 0x080b12, emissiveIntensity: .2 })); bot.position.set(0, 1.12, -3.25); scene.add(bot);
  const head = new THREE.Mesh(new THREE.SphereGeometry(.25, 24, 12), new THREE.MeshStandardMaterial({ color: 0x9b6a4f, roughness: .7 })); head.position.set(0, 1.82, -3.25); scene.add(head);
  const tag = new THREE.Mesh(new THREE.PlaneGeometry(1.45, .34), new THREE.MeshBasicMaterial({ map: labelTexture("BOT NOVA", "$50,000", "#64eaff", 512, 160), transparent: true, toneMapped: false })); tag.position.set(0, 2.18, -3.45); scene.add(tag);
  return { root, active, botRing };
}

function chip(scene, x, z, color, count = 6) {
  const g = new THREE.Group(); g.position.set(x, 1.10, z); scene.add(g);
  for (let i = 0; i < count; i++) {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, .016, 24), new THREE.MeshStandardMaterial({ color, roughness: .34, metalness: .12, emissive: color, emissiveIntensity: .20 }));
    m.rotation.x = Math.PI / 2; m.position.y = i * .018; g.add(m);
  }
  return g;
}

function cardMesh(scene, name, x, z, face, hidden = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(.48, .68), new THREE.MeshBasicMaterial({ map: cardTexture(face, hidden), side: THREE.DoubleSide, toneMapped: false }));
  m.name = name;
  m.position.set(x, 1.135, z);
  m.rotation.x = -Math.PI / 2;
  scene.add(m);
  return m;
}

let state = { ps: 50000, bs: 50000 };

function updateHud() {
  const set = (id, v) => { const e = document.getElementById(id); if (e) e.textContent = v; };
  set("scorpionStatus", state.msg || "Ready");
  set("scorpionCards", `You: ${(state.p || []).join(" ")} • Board: ${(state.b || []).join(" ") || "--"}`);
  set("scorpionStacks", `You $${state.ps.toLocaleString()} • Bot $${state.bs.toLocaleString()} • Pot $${state.pot.toLocaleString()} • To Call $${state.toCall.toLocaleString()}`);
  set("scorpionHandName", state.handName || "--");
  set("scorpionTimer", `${Math.ceil(state.timer || 0)}s`);
  const fill = document.getElementById("scorpionTimerFill"); if (fill) fill.style.width = `${Math.max(0, Math.min(100, (state.timer || 0) / 20 * 100))}%`;
}

function clearMeshes(scene) { for (const m of state.meshes || []) scene.remove(m); state.meshes = []; }
function drawCards(scene) {
  clearMeshes(scene);
  const add = (...a) => state.meshes.push(cardMesh(scene, ...a));
  add("PLAYER_CARD_LEFT_PHASE178", -.36, 1.32, state.p[0]);
  add("PLAYER_CARD_RIGHT_PHASE178", .28, 1.32, state.p[1]);
  add("BOT_CARD_LEFT_PHASE178", -.36, -1.32, state.reveal ? state.bot[0] : "??", !state.reveal);
  add("BOT_CARD_RIGHT_PHASE178", .28, -1.32, state.reveal ? state.bot[1] : "??", !state.reveal);
  state.b.forEach((c, i) => add(`BOARD_CARD_${i}_PHASE178`, -1.25 + i * .62, -.05, c));
}

function renderPot(scene) {
  for (const m of state.chips || []) scene.remove(m);
  state.chips = [];
  const colors = [0x7d4dff, 0x2bd4ff, 0xf2d269, 0xff6fb1];
  for (let i = 0; i < Math.min(14, Math.ceil(state.pot / 200)); i++) state.chips.push(chip(scene, -0.42 + (i % 7) * .14, .34 + Math.floor(i / 7) * .14, colors[i % colors.length], 5 + (i % 4)));
  state.chips.push(chip(scene, -1.55, 1.82, 0x2bd4ff, 8));
  state.chips.push(chip(scene, 1.55, -1.82, 0xf2d269, 8));
}
function pushHistory(line) { state.history = state.history || []; state.history.unshift(line); state.history = state.history.slice(0, 8); const h = document.getElementById("scorpionHistory"); if (h) h.textContent = state.history.join("\n"); }
function streetName() { return ["Preflop", "Flop", "Turn", "River", "Showdown"][state.stage] || "Hand"; }
function startTimer() { state.timer = 20; }
function newHand(scene) {
  const d = makeDeck();
  const ps = Math.max(1000, state.ps || 50000), bs = Math.max(1000, state.bs || 50000);
  state = { deck: d, ps: ps - 100, bs: bs - 100, pot: 200, toCall: 0, lastBet: 100, stage: 0, p: [d.pop(), d.pop()], bot: [d.pop(), d.pop()], b: [], reveal: false, meshes: [], chips: [], msg: "New hand. Blinds posted. Your action.", handName: "Preflop", history: state.history || [] };
  startTimer(); drawCards(scene); renderPot(scene); pushHistory("New hand • blinds $100/$100 • your action"); updateHud();
}
function dealStreet(scene) {
  if (state.stage === 0) { state.b.push(state.deck.pop(), state.deck.pop(), state.deck.pop()); state.stage = 1; state.msg = "Flop dealt. Your action."; }
  else if (state.stage === 1) { state.b.push(state.deck.pop()); state.stage = 2; state.msg = "Turn dealt. Your action."; }
  else if (state.stage === 2) { state.b.push(state.deck.pop()); state.stage = 3; state.msg = "River dealt. Your action."; }
  else { return showdown(scene); }
  state.toCall = 0; state.lastBet = 0; startTimer(); drawCards(scene); renderPot(scene); pushHistory(`${streetName()} dealt: ${state.b.join(" ")}`); updateHud();
}
function botAct(scene, raised = 0) {
  const botScore = evaluate([...state.bot, ...state.b]);
  const strength = botScore.score[0];
  if (raised > 0) {
    if (strength === 0 && Math.random() < .30) { state.msg = "Bot folds. You win."; state.ps += state.pot; state.pot = 0; state.stage = 4; state.reveal = true; pushHistory("BOT NOVA folds to raise"); drawCards(scene); renderPot(scene); updateHud(); return; }
    const call = Math.min(raised, state.bs); state.bs -= call; state.pot += call; pushHistory(`BOT NOVA calls $${call}`);
  } else {
    if (strength >= 1 && Math.random() < .46) { const bet = Math.min(150, state.bs); state.bs -= bet; state.pot += bet; state.toCall = bet; state.lastBet = bet; state.msg = `BOT NOVA bets $${bet}.`; pushHistory(`BOT NOVA bets $${bet}`); startTimer(); renderPot(scene); updateHud(); return; }
    pushHistory("BOT NOVA checks");
  }
  dealStreet(scene);
}
function showdown(scene) {
  state.reveal = true; state.stage = 4; state.toCall = 0;
  const p = evaluate([...state.p, ...state.b]), b = evaluate([...state.bot, ...state.b]);
  const cmp = compareScore(p.score, b.score);
  if (cmp >= 0) { state.ps += state.pot; state.msg = `You win $${state.pot.toLocaleString()} • ${p.name}`; state.handName = p.name; pushHistory(`YOU win $${state.pot} with ${p.name}`); }
  else { state.bs += state.pot; state.msg = `BOT NOVA wins $${state.pot.toLocaleString()} • ${b.name}`; state.handName = b.name; pushHistory(`BOT NOVA wins $${state.pot} with ${b.name}`); }
  state.pot = 0; drawCards(scene); renderPot(scene); updateHud();
}
function act(scene, a) {
  if (a === "new" || state.stage === 4) return newHand(scene);
  if (a === "fold") { state.bs += state.pot; state.pot = 0; state.reveal = true; state.stage = 4; state.msg = "You folded. Bot wins."; pushHistory("YOU fold"); drawCards(scene); renderPot(scene); updateHud(); return; }
  if (a === "allin") { const amount = state.ps; state.ps = 0; state.pot += amount; pushHistory(`YOU all-in $${amount}`); botAct(scene, amount); return; }
  if (a === "raise") { const amount = Math.min(state.ps, Math.max(250, state.toCall + 250)); state.ps -= amount; state.pot += amount; state.msg = `You raise $${amount}.`; pushHistory(`YOU raises $${amount}`); renderPot(scene); botAct(scene, amount); return; }
  if (state.toCall > 0) { const call = Math.min(state.toCall, state.ps); state.ps -= call; state.pot += call; state.toCall = 0; pushHistory(`YOU calls $${call}`); renderPot(scene); botAct(scene, 0); return; }
  pushHistory("YOU checks"); botAct(scene, 0);
}

function hud(scene) {
  const old = document.getElementById("scorpionPhase178Hud"); if (old) old.remove();
  const h = document.createElement("div"); h.id = "scorpionPhase178Hud";
  h.style.cssText = "position:fixed;left:16px;bottom:16px;z-index:1000;max-width:620px;background:rgba(3,5,10,.84);border:1px solid rgba(211,161,59,.85);border-radius:18px;color:#fff7e3;padding:14px 16px;font:13px/1.35 system-ui,Segoe UI,Arial;box-shadow:0 18px 45px rgba(0,0,0,.60);backdrop-filter:blur(9px)";
  h.innerHTML = '<b style="color:#ffd36b;font-size:15px">SCORPION ROOM • PLAYABLE POLISH LOCK</b><div id="scorpionStatus" style="margin-top:5px;color:#bffcff">Loading hand…</div><div id="scorpionCards" style="margin-top:6px;color:#fff">Cards: --</div><div id="scorpionStacks" style="margin-top:6px;color:#ffd36b">Stacks loading…</div><div style="display:flex;gap:8px;margin-top:9px;align-items:center"><div style="flex:1;height:8px;background:rgba(255,255,255,.12);border-radius:999px;overflow:hidden"><div id="scorpionTimerFill" style="height:100%;width:100%;background:linear-gradient(90deg,#7ff5c7,#ffd36b,#ff6868)"></div></div><b id="scorpionTimer">20s</b><b id="scorpionHandName" style="color:#64eaff">--</b></div><div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:11px"><button data-a="check">Check / Call</button><button data-a="raise">Raise</button><button data-a="allin">All-In</button><button data-a="fold">Fold</button><button data-a="new">Next Hand</button></div><pre id="scorpionHistory" style="margin:9px 0 0;color:#c8d5e8;font:12px/1.3 monospace;white-space:pre-wrap;max-height:90px;overflow:auto"></pre><div style="margin-top:7px;color:#c8d5e8;font-size:12px">Keys: C check/call • R raise • A all-in • F fold • H next hand • auto-check/fold at 20s</div>';
  document.body.appendChild(h);
  h.querySelectorAll("button").forEach(b => { b.style.cssText = "border:1px solid rgba(100,234,255,.58);border-radius:999px;background:rgba(12,24,35,.90);color:#fff;padding:8px 12px;font-weight:900;cursor:pointer"; });
  h.addEventListener("click", e => { const b = e.target.closest("button[data-a]"); if (b) act(scene, b.dataset.a); });
  window.addEventListener("keydown", e => { const k = e.key.toLowerCase(); if (k === "c") act(scene, "check"); if (k === "r") act(scene, "raise"); if (k === "a") act(scene, "allin"); if (k === "f") act(scene, "fold"); if (k === "h") act(scene, "new"); });
}

function lighting(scene) {
  scene.add(new THREE.HemisphereLight(0xbadfff, 0x08030a, 1.15));
  const key = new THREE.DirectionalLight(0xffffff, 1.18); key.position.set(2, 8, 5); scene.add(key);
  const gold = new THREE.PointLight(0xd3a13b, 2.5, 38, 2); gold.position.set(0, 3, -8); scene.add(gold);
  const cyan = new THREE.PointLight(0x64eaff, 1.45, 18, 2); cyan.position.set(0, 2.4, 3.4); scene.add(cyan);
}

function tick(scene, rings) {
  const prev = scene.userData._tickScorpion178;
  scene.userData._tickScorpion178 = (dt) => {
    if (prev) prev(dt);
    if (state.stage !== 4) { state.timer = Math.max(0, (state.timer || 20) - dt); if (state.timer <= 0) act(scene, state.toCall > 0 ? "fold" : "check"); updateHud(); }
    const p = 0.5 + 0.5 * Math.sin(performance.now() * .003);
    rings.active.material.opacity = .42 + p * .28;
    rings.botRing.material.opacity = .26 + (1 - p) * .18;
    rings.active.rotation.z += dt * .55;
    rings.botRing.rotation.z -= dt * .35;
  };
  if (!scene.userData.phase178ScorpionTickHooked) {
    scene.userData.phase178ScorpionTickHooked = true;
    const old = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt) => { if (old) old(dt); if (scene.userData._tickScorpion178) scene.userData._tickScorpion178(dt); };
  }
}

bootPrivateScene({
  title: "SCORPION ROOM",
  subtitle: "PLAYABLE HEADS-UP POKER",
  accent: 0xd3a13b,
  buildLabel: BUILD,
  build: ({ scene, camera }) => {
    camera.position.set(0, 1.58, 5.8);
    camera.lookAt(0, 1.05, 0);
    lighting(scene);
    addRoom(scene);
    addSkyline(scene);
    const rings = addTable(scene);
    hud(scene);
    newHand(scene);
    tick(scene, rings);
    const status = document.getElementById("status");
    if (status) status.textContent = "Scorpion playable • Phase 178 polish lock";
    console.log(`[${BUILD}] ready`);
  }
});
