/* js/scarlett1/logic.js
 * SCARLETT EMPIRE OS — SCARLETT1 MODULE ENGINE (Build 5.6 compatible)
 * RULES: Does NOT touch Spine. Injects into #poker-module (fallback #world-root).
 * Exports: window.scarlettModule with required API.
 */
(function () {
  'use strict';

  // ---------- Contract / IDs ----------
  const IDS = {
    container: 'poker-module',
    world: 'world-root',
    rig: 'rig',
    cam: 'main-cam',
    win: 'win-celebration',
    // 4 Spine canvases (Gemini confirmed)
    canvases: ['jumboCanvas_NE', 'jumboCanvas_NW', 'jumboCanvas_SE', 'jumboCanvas_SW']
  };

  // ---------- Assets ----------
  const MODEL_ASSET_ID = '#ninjaModel';
  const MODEL_FALLBACK_PATH = 'assets/models/combat_ninja.glb';

  // ---------- Constants ----------
  const ARENA_R = 60;
  const PIT_Y = -1.25;          // pit floor
  const PIT_R = 7.5;            // pit radius
  const TABLE_Z = 0;            // table centered in pit
  const TABLE_R = 4.5;
  const PAD_RING_R = 6.4;

  const SEATS = [
    { id: 'ninja-1',      pos: '3.5 -0.75 -3.6', rot: '0 160 0', name: 'AGGRO_NINJA' },
    { id: 'ninja-dealer', pos: '0 -0.75 -3.0',   rot: '0 180 0', name: 'DEALER_NINJA' },
    { id: 'ninja-3',      pos: '-3.5 -0.75 -3.6',rot: '0 200 0', name: 'TACTIC_NINJA' }
  ];

  const COMMUNITY = {
    flop:  ['-0.75 -0.05 -2.2','0 -0.05 -2.2','0.75 -0.05 -2.2'],
    turn:  ['-1.125 -0.05 -2.2','-0.375 -0.05 -2.2','0.375 -0.05 -2.2','1.125 -0.05 -2.2'],
    river: ['-1.5 -0.05 -2.2','-0.75 -0.05 -2.2','0 -0.05 -2.2','0.75 -0.05 -2.2','1.5 -0.05 -2.2']
  };

  const STATIONS = [
    { id: 'groovesalad', name: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3' },
    { id: 'synthwave',   name: 'SomaFM Synthwave',     url: 'https://ice1.somafm.com/synthwave-128-mp3' },
    { id: 'radiop',      name: 'Radio Paradise',       url: 'https://stream.radioparadise.com/mp3-128' }
  ];

  const STORE_ITEMS = [
    { id: 'vip_avatar', label: 'VIP AVATAR', price: 500 },
    { id: 'table_felt', label: 'TABLE FELT', price: 250 },
    { id: 'chip_skin',  label: 'CHIP SKIN',  price: 150 }
  ];

  // ---------- Helpers ----------
  const qs = (s, r = document) => r.querySelector(s);
  const scene = () => qs('a-scene');

  function root() {
    return document.getElementById(IDS.container) || document.getElementById(IDS.world) || scene();
  }

  function ensure(id, tag = 'a-entity', parent = null) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement(tag);
    el.id = id;
    (parent || root() || document.body).appendChild(el);
    return el;
  }

  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function addClickable(el) { if (el) el.classList.add('clickable'); }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  // Small “clink” synth (no audio asset)
  function clink() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ctx = clink._ctx || (clink._ctx = new AC());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = 840 + Math.random() * 260;
      g.gain.value = 0.10;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.07);
      o.stop(ctx.currentTime + 0.08);
    } catch {}
  }

  // ---------- State ----------
  const state = {
    started: false,
    credits: Number(localStorage.getItem('scarlett_credits') || '5000'),
    radioOn: false,
    stationIdx: 0,
    pot: 0,
    blinds: '50/100',
    handStep: 0, // 0=none, 1=flop, 2=turn, 3=river
    logs: [],
    storeVisible: false,
    lastWinnerSeat: 0
  };

  function log(msg) {
    state.logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    state.logs = state.logs.slice(0, 8);
  }

  function saveCredits() {
    localStorage.setItem('scarlett_credits', String(state.credits));
  }

  // ---------- Quad Jumbotron Drawing ----------
  function getCanvas(id) {
    const c = document.getElementById(id);
    if (!c) return null;
    const ctx = c.getContext('2d');
    return { c, ctx };
  }

  function drawBase(ctx, title, subtitle, accent = '#00FFFF') {
    const w = 1024, h = 512;
    ctx.fillStyle = '#00050a';
    ctx.fillRect(0, 0, w, h);

    // grid
    ctx.strokeStyle = 'rgba(0,255,255,0.08)';
    for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

    // header
    ctx.fillStyle = accent;
    ctx.font = 'bold 52px Courier New, monospace';
    ctx.fillText(String(title).slice(0, 30), 56, 90);

    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 30px Courier New, monospace';
    if (subtitle) ctx.fillText(String(subtitle).slice(0, 44), 56, 140);
  }

  function drawNE() {
    const x = getCanvas('jumboCanvas_NE'); if (!x) return;
    drawBase(x.ctx, 'SCARLETT SYSTEM', 'BUILD 5.6 — QUAD JUMBOS');
    x.ctx.fillStyle = '#00FFFF';
    x.ctx.font = 'bold 28px Courier New, monospace';
    x.ctx.fillText(`CREDITS: $${state.credits}`, 56, 220);
    x.ctx.fillText(`RADIO: ${state.radioOn ? 'ON' : 'OFF'}`, 56, 260);
    x.ctx.fillText(`MODULE: ACTIVE`, 56, 300);
  }

  function drawNW() {
    const x = getCanvas('jumboCanvas_NW'); if (!x) return;
    drawBase(x.ctx, 'HIGH STAKES TABLE', 'LIVE HAND STATUS', '#FFD700');
    x.ctx.fillStyle = '#00FFFF';
    x.ctx.font = 'bold 28px Courier New, monospace';
    x.ctx.fillText(`POT: $${state.pot}`, 56, 220);
    x.ctx.fillText(`BLINDS: ${state.blinds}`, 56, 260);
    x.ctx.fillText(`STREET: ${['PRE','FLOP','TURN','RIVER'][state.handStep] || 'PRE'}`, 56, 300);
  }

  function drawSE() {
    const x = getCanvas('jumboCanvas_SE'); if (!x) return;
    drawBase(x.ctx, 'JUNGLE STORE', state.storeVisible ? 'OPEN' : 'CLOSED');
    x.ctx.fillStyle = '#00FFFF';
    x.ctx.font = 'bold 26px Courier New, monospace';
    let y = 220;
    STORE_ITEMS.forEach(it => {
      x.ctx.fillText(`${it.label} — $${it.price}`, 56, y);
      y += 40;
    });
    x.ctx.fillStyle = '#00FF00';
    x.ctx.fillText(`TIP: USE PADS TO BUY/EQUIP`, 56, 420);
  }

  function drawSW() {
    const x = getCanvas('jumboCanvas_SW'); if (!x) return;
    drawBase(x.ctx, 'ACTION LOG', 'BOTS • STORE • RADIO');
    x.ctx.fillStyle = '#00FFFF';
    x.ctx.font = 'bold 22px Courier New, monospace';
    let y = 200;
    state.logs.slice(0, 8).forEach(line => {
      x.ctx.fillText(line.slice(0, 60), 56, y);
      y += 34;
    });
  }

  function drawAllJumbos() {
    drawNE(); drawNW(); drawSE(); drawSW();
  }

  // ---------- Scene Build: Beauty + Pit + Doors ----------
  function buildArenaDecor() {
    const r = root();

    const decor = ensure('scarlett_decor', 'a-entity', r);
    clear(decor);

    // Neon trim ring near ground
    const trim1 = document.createElement('a-ring');
    trim1.setAttribute('rotation', '-90 0 0');
    trim1.setAttribute('radius-inner', String(ARENA_R - 0.6));
    trim1.setAttribute('radius-outer', String(ARENA_R - 0.2));
    trim1.setAttribute('position', `0 0.02 0`);
    trim1.setAttribute('material', 'color:#A020F0; emissive:#A020F0; emissiveIntensity:18; opacity:0.95; transparent:true');
    decor.appendChild(trim1);

    // Pit glow ring
    const pitGlow = document.createElement('a-ring');
    pitGlow.setAttribute('rotation', '-90 0 0');
    pitGlow.setAttribute('radius-inner', String(PIT_R - 0.35));
    pitGlow.setAttribute('radius-outer', String(PIT_R + 0.35));
    pitGlow.setAttribute('position', `0 0.03 0`);
    pitGlow.setAttribute('material', 'color:#00FFFF; emissive:#00FFFF; emissiveIntensity:10; opacity:0.9; transparent:true');
    pitGlow.setAttribute('animation__pulse', 'property: material.emissiveIntensity; dir: alternate; dur: 1400; loop: true; to: 18');
    decor.appendChild(pitGlow);

    // Doorway “portal frames” (4 cardinal)
    const doors = ensure('scarlett_doors', 'a-entity', r);
    clear(doors);

    const doorDefs = [
      { name:'NORTH GATE', pos:`0 4 ${-(ARENA_R-1)}`, rot:'0 0 0' },
      { name:'SOUTH GATE', pos:`0 4 ${(ARENA_R-1)}`,  rot:'0 180 0' },
      { name:'EAST GATE',  pos:`${(ARENA_R-1)} 4 0`,  rot:'0 -90 0' },
      { name:'WEST GATE',  pos:`${-(ARENA_R-1)} 4 0`, rot:'0 90 0' },
    ];

    doorDefs.forEach(d => {
      const frame = document.createElement('a-box');
      frame.setAttribute('width','10');
      frame.setAttribute('height','8');
      frame.setAttribute('depth','0.4');
      frame.setAttribute('position', d.pos);
      frame.setAttribute('rotation', d.rot);
      frame.setAttribute('material','color:#111; emissive:#A020F0; emissiveIntensity:5; opacity:0.65; transparent:true');
      doors.appendChild(frame);

      const label = document.createElement('a-text');
      label.setAttribute('value', d.name);
      label.setAttribute('align','center');
      label.setAttribute('width','18');
      label.setAttribute('color','#00FF00');
      label.setAttribute('position', d.pos);
      // offset text slightly forward
      const [x,y,z] = d.pos.split(' ').map(Number);
      if (d.name.includes('NORTH')) label.setAttribute('position', `${x} ${y+4.6} ${z+0.8}`);
      if (d.name.includes('SOUTH')) label.setAttribute('position', `${x} ${y+4.6} ${z-0.8}`);
      if (d.name.includes('EAST'))  label.setAttribute('position', `${x-0.8} ${y+4.6} ${z}`);
      if (d.name.includes('WEST'))  label.setAttribute('position', `${x+0.8} ${y+4.6} ${z}`);
      doors.appendChild(label);
    });

    log('Lobby restored: doors + trim + pit glow');
  }

  function buildPitAndTable() {
    const r = root();

    const pit = ensure('scarlett_pit', 'a-entity', r);
    clear(pit);
    pit.setAttribute('position', `0 ${PIT_Y} 0`);

    // Pit floor
    const floor = document.createElement('a-circle');
    floor.setAttribute('rotation','-90 0 0');
    floor.setAttribute('radius', String(PIT_R));
    floor.setAttribute('material','color:#0b0b10; roughness:0.95; metalness:0.0;');
    pit.appendChild(floor);

    // Pit wall ring
    const wall = document.createElement('a-cylinder');
    wall.setAttribute('radius', String(PIT_R));
    wall.setAttribute('height','2.0');
    wall.setAttribute('open-ended','true');
    wall.setAttribute('position', `0 1.0 0`);
    wall.setAttribute('material','color:#0d0d14; roughness:0.9; emissive:#001a2a; emissiveIntensity:0.2; side:double');
    pit.appendChild(wall);

    // Table base
    const table = ensure('scarlett_table', 'a-entity', pit);
    table.setAttribute('position', `0 0 ${TABLE_Z}`);

    const base = document.createElement('a-cylinder');
    base.setAttribute('radius','4.2');
    base.setAttribute('height','0.9');
    base.setAttribute('position','0 0.45 -3.0');
    base.setAttribute('material','color:#073010; roughness:0.85; metalness:0.05');
    table.appendChild(base);

    // Neon ring on table rail
    const rail = document.createElement('a-ring');
    rail.setAttribute('rotation','-90 0 0');
    rail.setAttribute('radius-inner','4.05');
    rail.setAttribute('radius-outer','4.35');
    rail.setAttribute('position','0 0.92 -3.0');
    rail.setAttribute('material','color:#A020F0; emissive:#A020F0; emissiveIntensity:12; opacity:0.95; transparent:true');
    table.appendChild(rail);

    // Table label
    const title = document.createElement('a-text');
    title.setAttribute('value','HIGH STAKES PIT');
    title.setAttribute('align','center');
    title.setAttribute('width','12');
    title.setAttribute('color','#00FF00');
    title.setAttribute('position','0 2.2 -3.0');
    pit.appendChild(title);

    // Community cards anchor (on felt)
    const comm = ensure('community-cards', 'a-entity', table);
    comm.setAttribute('position','0 0.98 -3.0');

    log('Pit + table centerpiece online');
  }

  // ---------- Bots ----------
  function gltfEntity() {
    const asset = document.getElementById('ninjaModel');
    const src = asset ? MODEL_ASSET_ID : MODEL_FALLBACK_PATH;
    const e = document.createElement('a-entity');
    e.setAttribute('gltf-model', src);
    e.setAttribute('rotation','0 180 0');
    e.setAttribute('scale','1 1 1');
    // animation-mixer exists via aframe-extras
    e.setAttribute('animation-mixer', 'clip: idle; loop: repeat; timeScale: 1');
    return e;
  }

  function nameplate(text) {
    const wrap = document.createElement('a-entity');

    const bg = document.createElement('a-plane');
    bg.setAttribute('width','1.6');
    bg.setAttribute('height','0.34');
    bg.setAttribute('position','0 1.95 0.22');
    bg.setAttribute('material','color:#001a10; opacity:0.85; transparent:true; emissive:#00ff88; emissiveIntensity:0.06');
    wrap.appendChild(bg);

    const t = document.createElement('a-text');
    t.setAttribute('value', text);
    t.setAttribute('align','center');
    t.setAttribute('width','3.4');
    t.setAttribute('color','#00FFFF');
    t.setAttribute('position','0 1.95 0.23');
    wrap.appendChild(t);

    const think = document.createElement('a-ring');
    think.setAttribute('radius-inner','0.08');
    think.setAttribute('radius-outer','0.12');
    think.setAttribute('position','0 2.20 0.24');
    think.setAttribute('material','color:#A020F0; emissive:#A020F0; emissiveIntensity:10; opacity:0.95; transparent:true');
    think.setAttribute('animation__pulse','property: material.emissiveIntensity; dir: alternate; dur: 950; loop: true; to: 18');
    wrap.appendChild(think);

    return wrap;
  }

  function spawnBots() {
    const pit = document.getElementById('scarlett_pit') || root();
    const botRoot = ensure('scarlett_bots', 'a-entity', pit);
    clear(botRoot);

    // bots are placed relative to pit (pit is already offset to PIT_Y)
    SEATS.forEach((s, idx) => {
      const bot = document.createElement('a-entity');
      bot.id = s.id;
      bot.setAttribute('position', s.pos);
      bot.setAttribute('rotation', s.rot);

      bot.appendChild(gltfEntity());
      bot.appendChild(nameplate(s.name));

      // subtle bob
      const [x,y,z] = s.pos.split(' ').map(Number);
      bot.setAttribute('animation__bob', `property: position; dir: alternate; dur: ${1800+idx*240}; loop: true; to: ${x} ${(y+0.05).toFixed(2)} ${z}`);

      botRoot.appendChild(bot);
    });

    log('Bots seated and active');
  }

  function spawnGuard() {
    const r = root();
    const guardRoot = ensure('scarlett_guards', 'a-entity', r);
    clear(guardRoot);

    const defs = [
      { pos: `3 0 ${-(ARENA_R-6)}`,  rot: '0 0 0' },
      { pos: `-3 0 ${-(ARENA_R-6)}`, rot: '0 0 0' },
      { pos: `0 0 ${-(ARENA_R-10)}`, rot: '0 0 0' }
    ];

    defs.forEach((g, idx) => {
      const e = document.createElement('a-entity');
      e.setAttribute('position', g.pos);
      e.setAttribute('rotation', g.rot);
      e.appendChild(gltfEntity());

      const ring = document.createElement('a-ring');
      ring.setAttribute('rotation','-90 0 0');
      ring.setAttribute('radius-inner','0.45');
      ring.setAttribute('radius-outer','0.58');
      ring.setAttribute('position','0 0.02 0');
      ring.setAttribute('material','color:#00ff88; emissive:#00ff88; emissiveIntensity:10; opacity:0.9; transparent:true');
      ring.setAttribute('animation__pulse', `property: material.emissiveIntensity; dir: alternate; dur: ${1200+idx*160}; loop: true; to: 18`);
      e.appendChild(ring);

      guardRoot.appendChild(e);
    });

    log('Guards deployed at North gate');
    drawAllJumbos();
    return true;
  }

  // ---------- Cards ----------
  function createCard(i) {
    const c = document.createElement('a-box');
    c.setAttribute('width','0.5');
    c.setAttribute('height','0.7');
    c.setAttribute('depth','0.02');
    c.setAttribute('rotation','-90 0 0');
    c.setAttribute('position','0 2.5 0'); // spawn above pit center
    c.setAttribute('material','color:#ffffff; roughness:0.85; metalness:0; emissive:#111; emissiveIntensity:0.05');
    c.setAttribute('data-card', String(i));
    addClickable(c);
    return c;
  }

  function dealCards(posList) {
    const table = document.getElementById('scarlett_table') || root();
    const comm = document.getElementById('community-cards') || ensure('community-cards','a-entity', table);

    clear(comm);
    posList.forEach((p, idx) => {
      const card = createCard(idx);
      const to = p;
      card.setAttribute('animation__glide', `property: position; dur: 650; easing: easeOutCubic; to: ${to}`);
      const [x,y,z] = p.split(' ').map(Number);
      card.setAttribute('animation__hover', `property: position; dir: alternate; dur: 1200; loop: true; to: ${x} ${(y+0.10).toFixed(2)} ${z}`);
      comm.appendChild(card);
    });

    // update state
    state.handStep = clamp(posList.length - 2, 1, 3); // 3->flop,4->turn,5->river
    state.pot = clamp(state.pot + Math.floor(50 + Math.random()*450), 0, 100000);
    log(`Dealt ${posList.length} community card(s)`);
    drawAllJumbos();
  }

  function resetHand() {
    const comm = document.getElementById('community-cards');
    if (comm) clear(comm);
    state.handStep = 0;
    state.pot = 0;
    log('Hand reset');
    drawAllJumbos();
  }

  // ---------- Chips ----------
  const Chips = {
    chips: [],
    held: null,

    spawnStack(at = '0 -0.20 -4.6', count = 18) {
      const pit = document.getElementById('scarlett_pit') || root();
      const chipRoot = ensure('scarlett_chips', 'a-entity', pit);
      clear(chipRoot);
      this.chips = [];
      this.held = null;

      const [px, py, pz] = at.split(' ').map(Number);
      for (let i = 0; i < count; i++) {
        const chip = document.createElement('a-cylinder');
        chip.setAttribute('radius','0.08');
        chip.setAttribute('height','0.02');
        chip.setAttribute('rotation','90 0 0');
        chip.setAttribute('position', `${px} ${(py + i*0.021).toFixed(3)} ${pz}`);
        chip.setAttribute('color', (i%3===0)?'#00FFFF':((i%3===1)?'#A020F0':'#00FF00'));
        chip.setAttribute('material','roughness:0.6; metalness:0.12; emissiveIntensity:0.12');
        addClickable(chip);

        chip.addEventListener('click', (e) => {
          e.stopPropagation();
          this.toggleHold(chip);
        });

        chipRoot.appendChild(chip);
        this.chips.push(chip);
      }

      log('Chips spawned (click to pick/drop)');
      return chipRoot;
    },

    toggleHold(chip) {
      const cam = document.getElementById(IDS.cam) || qs('a-camera');
      const s = scene();
      if (!cam || !s) return;

      if (this.held && this.held !== chip) this.drop(this.held);

      if (this.held === chip) {
        this.drop(chip);
        this.held = null;
        return;
      }

      this.held = chip;
      cam.object3D.add(chip.object3D);
      chip.object3D.position.set(0.18, -0.22, -0.62);
      chip.object3D.rotation.set(Math.PI/2, 0, 0);
      clink();
      log('Chip picked up');
      drawAllJumbos();
    },

    drop(chip) {
      const cam = document.getElementById(IDS.cam) || qs('a-camera');
      const s = scene();
      if (!cam || !s) return;

      const dir = new AFRAME.THREE.Vector3();
      cam.object3D.getWorldDirection(dir);

      const pos = new AFRAME.THREE.Vector3();
      cam.object3D.getWorldPosition(pos);

      dir.multiplyScalar(0.8);
      pos.add(dir);

      s.object3D.add(chip.object3D);
      chip.object3D.position.copy(pos);
      chip.object3D.rotation.set(Math.PI/2, 0, 0);

      // snap stack if near another chip pile
      const nearby = this.chips
        .filter(c => c !== chip && c.object3D.parent === s.object3D)
        .map(c => ({ c, d: c.object3D.position.distanceTo(pos) }))
        .sort((a,b)=>a.d-b.d)[0];

      if (nearby && nearby.d < 0.18) {
        const base = nearby.c.object3D.position.clone();
        const pileCount = this.chips
          .filter(c => c.object3D.parent === s.object3D)
          .filter(c => c.object3D.position.distanceTo(base) < 0.18).length;
        chip.object3D.position.set(base.x, base.y + pileCount*0.021, base.z);
      }

      clink();
      log('Chip dropped (stacked if near pile)');
      drawAllJumbos();
    }
  };

  // ---------- Store ----------
  let storeRoot = null;

  function buildStore() {
    if (storeRoot) return storeRoot;

    const pit = document.getElementById('scarlett_pit') || root();
    storeRoot = ensure('scarlett_store', 'a-entity', pit);
    storeRoot.setAttribute('position', `0 0.10 ${PIT_R - 1.4}`);
    storeRoot.setAttribute('rotation', '0 180 0');

    const base = document.createElement('a-cylinder');
    base.setAttribute('radius','3.0');
    base.setAttribute('height','0.35');
    base.setAttribute('material','color:#123018; roughness:0.95; emissive:#00ff88; emissiveIntensity:0.06');
    storeRoot.appendChild(base);

    // jungle leaves
    for (let i=0;i<10;i++){
      const leaf = document.createElement('a-cone');
      leaf.setAttribute('radius-bottom','0.13');
      leaf.setAttribute('radius-top','0.01');
      leaf.setAttribute('height','2.4');
      leaf.setAttribute('color','#1b7a2f');
      leaf.setAttribute('position', `${(Math.cos(i)*2.1).toFixed(2)} 1.55 ${(Math.sin(i)*2.1).toFixed(2)}`);
      leaf.setAttribute('rotation', `0 ${(i*36)} 60`);
      storeRoot.appendChild(leaf);
    }

    const sign = document.createElement('a-text');
    sign.setAttribute('value','JUNGLE STORE');
    sign.setAttribute('align','center');
    sign.setAttribute('width','10');
    sign.setAttribute('color','#00FF00');
    sign.setAttribute('position','0 3.2 0');
    storeRoot.appendChild(sign);

    // item pedestals clickable
    const pedPositions = [
      { x:-1.4, z: 0.8, item: STORE_ITEMS[0] },
      { x: 0.0, z: 1.6, item: STORE_ITEMS[1] },
      { x: 1.4, z: 0.8, item: STORE_ITEMS[2] }
    ];

    pedPositions.forEach((p, idx) => {
      const ped = document.createElement('a-cylinder');
      ped.setAttribute('radius','0.48');
      ped.setAttribute('height','1.05');
      ped.setAttribute('position', `${p.x} 0.52 ${p.z}`);
      ped.setAttribute('material','color:#0b0b10; emissive:#A020F0; emissiveIntensity:0.9; roughness:0.8');
      addClickable(ped);
      ped.addEventListener('click', () => storePurchase(p.item.id));
      storeRoot.appendChild(ped);

      const orb = document.createElement('a-sphere');
      orb.setAttribute('radius','0.28');
      orb.setAttribute('position', `${p.x} 1.32 ${p.z}`);
      orb.setAttribute('material','color:#00FFFF; emissive:#00FFFF; emissiveIntensity:0.25');
      orb.setAttribute('animation__spin', `property: rotation; dur: ${2600 + idx*450}; loop: true; to: 0 360 0`);
      storeRoot.appendChild(orb);

      const t = document.createElement('a-text');
      t.setAttribute('value', `${p.item.label}\n$${p.item.price}`);
      t.setAttribute('align','center');
      t.setAttribute('width','4');
      t.setAttribute('color','#00FFFF');
      t.setAttribute('position', `${p.x} 1.95 ${p.z}`);
      storeRoot.appendChild(t);
    });

    return storeRoot;
  }

  function storePurchase(itemId) {
    const item = STORE_ITEMS.find(x => x.id === itemId);
    if (!item) return;

    if (state.credits < item.price) {
      log(`Store: insufficient credits for ${item.label}`);
      drawAllJumbos();
      return;
    }

    state.credits -= item.price;
    saveCredits();

    // tiny “equip” feedback by changing table rail emissive a bit
    const rail = qs('#scarlett_table a-ring');
    if (rail) rail.setAttribute('material', 'emissiveIntensity', String(14 + Math.random()*10));

    log(`Store purchase: ${item.label} (-$${item.price})`);
    drawAllJumbos();
  }

  function spawnStore() {
    const s = buildStore();
    state.storeVisible = !state.storeVisible;
    s.object3D.visible = state.storeVisible;
    log(`Store ${state.storeVisible ? 'opened' : 'closed'}`);
    drawAllJumbos();
    return true;
  }

  // ---------- Radio ----------
  let audio = null;

  function ensureAudio() {
    if (audio) return audio;
    audio = new Audio();
    audio.crossOrigin = 'anonymous';
    audio.loop = true;
    audio.volume = 0.55;
    audio.src = STATIONS[state.stationIdx].url;
    return audio;
  }

  function toggleRadio() {
    const a = ensureAudio();
    state.radioOn = !state.radioOn;

    if (state.radioOn) {
      a.src = STATIONS[state.stationIdx].url;
      a.play().then(() => {
        log(`Radio ON: ${STATIONS[state.stationIdx].name}`);
        drawAllJumbos();
      }).catch(() => {
        state.radioOn = false;
        log('Radio blocked by device policy / stream fail');
        drawAllJumbos();
      });
    } else {
      a.pause();
      log('Radio OFF');
      drawAllJumbos();
    }
    return state.radioOn;
  }

  // ---------- Interaction Pads (in-world, clickable) ----------
  function buildPads() {
    const pit = document.getElementById('scarlett_pit') || root();
    const pads = ensure('scarlett_pads', 'a-entity', pit);
    clear(pads);

    // ring of pads around table
    const actions = [
      { label:'DEAL FLOP',  fn: () => scarlettModule.dealFlop() },
      { label:'DEAL TURN',  fn: () => scarlettModule.dealTurn() },
      { label:'DEAL RIVER', fn: () => scarlettModule.dealRiver() },
      { label:'RESET',      fn: () => scarlettModule.resetHand() },
      { label:'STORE',      fn: () => scarlettModule.spawnStore() },
      { label:'RADIO',      fn: () => scarlettModule.toggleRadio() },
      { label:'GUARDS',     fn: () => scarlettModule.spawnGuard() },
      { label:'BIG WIN',    fn: () => scarlettModule.bigWin() },
    ];

    actions.forEach((a, i) => {
      const ang = (i / actions.length) * Math.PI * 2;
      const x = Math.sin(ang) * PAD_RING_R;
      const z = Math.cos(ang) * PAD_RING_R;

      const pad = document.createElement('a-box');
      pad.setAttribute('width','1.6');
      pad.setAttribute('height','0.22');
      pad.setAttribute('depth','1.0');
      pad.setAttribute('position', `${x.toFixed(2)} 0.10 ${z.toFixed(2)}`);
      pad.setAttribute('rotation', `0 ${(-ang * 180/Math.PI).toFixed(1)} 0`);
      pad.setAttribute('material','color:#081018; emissive:#00FFFF; emissiveIntensity:0.35; roughness:0.8; opacity:0.95; transparent:true');
      addClickable(pad);

      pad.addEventListener('click', () => {
        // tactile feedback flash
        pad.setAttribute('material', 'emissiveIntensity', '2.0');
        setTimeout(()=>pad.setAttribute('material','emissiveIntensity','0.35'), 140);
        a.fn();
      });

      const txt = document.createElement('a-text');
      txt.setAttribute('value', a.label);
      txt.setAttribute('align','center');
      txt.setAttribute('width','6');
      txt.setAttribute('color','#00FF00');
      txt.setAttribute('position', `${x.toFixed(2)} 0.45 ${(z+0.2).toFixed(2)}`);
      pads.appendChild(pad);
      pads.appendChild(txt);
    });

    log('Interaction pads deployed around pit');
  }

  // ---------- Big Win ----------
  function bigWin() {
    // rotate winners among seats
    state.lastWinnerSeat = (state.lastWinnerSeat + 1) % SEATS.length;
    const s = SEATS[state.lastWinnerSeat];
    log(`BIG WIN: ${s.name}`);

    // trigger Spine particle system if present
    const p = document.getElementById(IDS.win);
    if (p) {
      const [x, y, z] = s.pos.split(' ').map(Number);
      // convert pit-local seat pos to world: pit entity is at y = PIT_Y
      p.setAttribute('position', `${x} ${5 + PIT_Y} ${z}`);
      p.setAttribute('particle-system', 'enabled', true);
      setTimeout(() => p.setAttribute('particle-system', 'enabled', false), 10000);
    }

    // pot spike
    state.pot += 1000 + Math.floor(Math.random()*3000);
    drawAllJumbos();
    return true;
  }

  // ---------- “Bots playing” loop (fake but convincing) ----------
  let botLoop = null;
  function startBotLoop() {
    if (botLoop) return;
    botLoop = setInterval(() => {
      const actor = SEATS[Math.floor(Math.random()*SEATS.length)];
      const moves = ['CHECKS', 'CALLS', 'RAISES', 'THINKS', 'FOLDS'];
      const move = moves[Math.floor(Math.random()*moves.length)];
      log(`${actor.name} ${move}`);

      // modify pot on aggressive actions
      if (move === 'RAISES') state.pot += 200 + Math.floor(Math.random()*900);
      if (move === 'CALLS')  state.pot += 50 + Math.floor(Math.random()*250);

      // occasionally advance street automatically
      if (Math.random() < 0.18) {
        if (state.handStep === 0) scarlettModule.dealFlop();
        else if (state.handStep === 1) scarlettModule.dealTurn();
        else if (state.handStep === 2) scarlettModule.dealRiver();
        else if (state.handStep === 3 && Math.random() < 0.35) {
          bigWin();
          resetHand();
        }
      }

      drawAllJumbos();
    }, 2200);
  }

  // ---------- Init ----------
  function init() {
    if (state.started) return true;

    const s = scene();
    if (!s) { setTimeout(init, 250); return false; }

    state.started = true;

    buildArenaDecor();
    buildPitAndTable();
    buildPads();
    spawnBots();
    Chips.spawnStack('0 -0.20 -4.6', 18);
    buildStore();
    storeRoot.object3D.visible = false;
    state.storeVisible = false;

    // start with flop
    dealCards(COMMUNITY.flop);

    startBotLoop();

    log('Scarlett1 init complete — pit demo running');
    drawAllJumbos();
    return true;
  }

  // ---------- Public API (Spine calls these) ----------
  const scarlettModule = {
    init,

    // Poker
    dealFlop: () => { state.handStep = 1; dealCards(COMMUNITY.flop); return true; },
    dealTurn: () => { state.handStep = 2; dealCards(COMMUNITY.turn); return true; },
    dealRiver: () => { state.handStep = 3; dealCards(COMMUNITY.river); return true; },
    resetHand: () => { resetHand(); return true; },

    // Store/Radio
    spawnStore,
    toggleRadio,

    // Guards / Bots
    spawnGuard,
    spawnBots,

    // FX
    bigWin,
  };

  window.scarlettModule = scarlettModule;

  // Auto-init on load (Spine also calls init via handshake; this is safe)
  setTimeout(() => { try { init(); } catch (e) { console.error(e); } }, 0);
})();
