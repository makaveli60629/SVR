/* js/scarlett1/logic.js
 * SCARLETT1 — EMERGENCY RESTORE + FULL DEMO INJECTION (Build 5.6)
 * GUARANTEES: visible floor + pit + table + bots + pads + store + guards.
 * Anchor: #poker-module (fallback #world-root, then a-scene)
 * Exports: window.scarlettModule with init + required functions.
 */
(function () {
  'use strict';

  // ---------- Contract IDs (from Spine 5.6) ----------
  const IDS = {
    anchor: 'poker-module',
    world: 'world-root',
    scene: 'a-scene',
    cam: 'main-cam',
    win: 'win-celebration',
    canvases: ['jumboCanvas_NE', 'jumboCanvas_NW', 'jumboCanvas_SE', 'jumboCanvas_SW']
  };

  // ---------- Assets ----------
  const NINJA_ASSET_ID = '#ninjaModel';               // if Spine preloads it
  const NINJA_FALLBACK = 'assets/models/combat_ninja.glb';

  // ---------- Geometry tuning ----------
  const ARENA_R = 60;
  const PIT_Y = -1.25;
  const PIT_R = 7.5;
  const TABLE_CENTER_Z = -15;      // pit/table pushed forward from spawn
  const TABLE_FELT_Y = PIT_Y + 0.95;
  const PAD_RING_R = 6.4;

  // Bot seats (relative to table center)
  const SEATS = [
    { id: 'ninja-1',      pos: { x:  3.5, y: PIT_Y + 0.50, z: TABLE_CENTER_Z + 2.5 }, rotY: 160, name: 'AGGRO_NINJA' },
    { id: 'ninja-dealer', pos: { x:  0.0, y: PIT_Y + 0.50, z: TABLE_CENTER_Z + 4.0 }, rotY: 180, name: 'DEALER_NINJA' },
    { id: 'ninja-3',      pos: { x: -3.5, y: PIT_Y + 0.50, z: TABLE_CENTER_Z + 2.5 }, rotY: 200, name: 'TACTIC_NINJA' }
  ];

  // Community card positions (relative to table center)
  const COMMUNITY = {
    flop:  ['-0.75 0.00 0.8','0 0.00 0.8','0.75 0.00 0.8'],
    turn:  ['-1.125 0.00 0.8','-0.375 0.00 0.8','0.375 0.00 0.8','1.125 0.00 0.8'],
    river: ['-1.5 0.00 0.8','-0.75 0.00 0.8','0 0.00 0.8','0.75 0.00 0.8','1.5 0.00 0.8']
  };

  // Store / credits
  const CREDIT_KEY = 'scarlett_credits';
  const DEFAULT_CREDITS = 5000;
  const STORE_ITEMS = [
    { id: 'vip_avatar', label: 'VIP AVATAR', price: 500 },
    { id: 'table_felt', label: 'TABLE FELT', price: 250 },
    { id: 'chip_skin',  label: 'CHIP SKIN',  price: 150 }
  ];

  // Radio
  const STATIONS = [
    { name: 'SomaFM Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3' },
    { name: 'SomaFM Synthwave',     url: 'https://ice1.somafm.com/synthwave-128-mp3' },
    { name: 'Radio Paradise',       url: 'https://stream.radioparadise.com/mp3-128' }
  ];

  // ---------- Helpers ----------
  const qs = (s, r = document) => r.querySelector(s);

  function anchorEl() {
    return document.getElementById(IDS.anchor)
      || document.getElementById(IDS.world)
      || qs(IDS.scene);
  }

  function ensure(id, tag = 'a-entity', parent) {
    let el = document.getElementById(id);
    if (el) return el;
    el = document.createElement(tag);
    el.id = id;
    (parent || anchorEl() || document.body).appendChild(el);
    return el;
  }

  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }
  function clickable(el) { if (el) el.classList.add('clickable'); }

  // Safe jumbotron write to all 4 canvases
  function drawJumbos(title, sub, lines = []) {
    IDS.canvases.forEach((cid, idx) => {
      const c = document.getElementById(cid);
      if (!c) return;
      const ctx = c.getContext('2d');
      const w = c.width, h = c.height;

      ctx.fillStyle = '#00050a';
      ctx.fillRect(0,0,w,h);

      // grid
      ctx.strokeStyle = 'rgba(0,255,255,0.08)';
      for (let x=0;x<w;x+=64){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,h); ctx.stroke(); }
      for (let y=0;y<h;y+=64){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(w,y); ctx.stroke(); }

      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 46px Courier New, monospace';
      ctx.fillText(String(title||'SCARLETT').slice(0,28), 56, 90);

      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 28px Courier New, monospace';
      ctx.fillText(String(sub||'').slice(0,40), 56, 140);

      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 22px Courier New, monospace';

      let y = 210;
      const zone = ['NE','NW','SE','SW'][idx] || '';
      ctx.fillText(`ZONE_${zone}: LINK_ACTIVE`, 56, y); y += 34;
      lines.slice(0,6).forEach(t => { ctx.fillText(String(t).slice(0,54), 56, y); y += 32; });
    });
  }

  // clink tone
  function clink(){
    try{
      const AC = window.AudioContext || window.webkitAudioContext;
      if(!AC) return;
      const ctx = clink._ctx || (clink._ctx = new AC());
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type='triangle';
      o.frequency.value = 820 + Math.random()*240;
      g.gain.value=0.10;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime+0.07);
      o.stop(ctx.currentTime+0.08);
    } catch {}
  }

  // ---------- State ----------
  const S = {
    built: false,
    logs: [],
    credits: Number(localStorage.getItem(CREDIT_KEY) || DEFAULT_CREDITS),
    storeVisible: false,
    radioOn: false,
    stationIdx: 0,
    pot: 0,
    street: 'PRE',
    audio: null
  };

  function log(msg){
    S.logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    S.logs = S.logs.slice(0, 8);
    drawJumbos('SCARLETT EMPIRE', `${S.street} | POT $${S.pot}`, S.logs);
  }

  function saveCredits(){ localStorage.setItem(CREDIT_KEY, String(S.credits)); }

  // ---------- Build pieces (GUARANTEED visible) ----------
  function addModuleLights(parent){
    const lightRoot = ensure('scarlett1_lights','a-entity', parent);
    clear(lightRoot);

    const amb = document.createElement('a-entity');
    amb.setAttribute('light','type: ambient; intensity: 1.8; color: #ffffff');
    lightRoot.appendChild(amb);

    const key = document.createElement('a-entity');
    key.setAttribute('position', `0 12 ${TABLE_CENTER_Z}`);
    key.setAttribute('light','type: point; intensity: 3.5; distance: 90; color: #ffffff');
    lightRoot.appendChild(key);

    const fill = document.createElement('a-entity');
    fill.setAttribute('position', `8 6 ${TABLE_CENTER_Z+6}`);
    fill.setAttribute('light','type: point; intensity: 2.2; distance: 60; color: #88ffff');
    lightRoot.appendChild(fill);

    const rim = document.createElement('a-entity');
    rim.setAttribute('position', `-8 6 ${TABLE_CENTER_Z+6}`);
    rim.setAttribute('light','type: point; intensity: 2.2; distance: 60; color: #a020f0');
    lightRoot.appendChild(rim);

    log('Module lights injected (anti-white-screen)');
  }

  function addFailsafeFloor(parent){
    const floorRoot = ensure('scarlett1_floor','a-entity', parent);
    clear(floorRoot);

    // dark floor plane
    const p = document.createElement('a-plane');
    p.setAttribute('rotation','-90 0 0');
    p.setAttribute('width','140');
    p.setAttribute('height','140');
    p.setAttribute('position', `0 ${PIT_Y+0.02} 0`);
    p.setAttribute('material','color:#05070b; roughness:1; metalness:0;');
    floorRoot.appendChild(p);

    // grid overlay (wireframe plane)
    const grid = document.createElement('a-plane');
    grid.setAttribute('rotation','-90 0 0');
    grid.setAttribute('width','140');
    grid.setAttribute('height','140');
    grid.setAttribute('position', `0 ${PIT_Y+0.03} 0`);
    grid.setAttribute('material','color:#00ffff; opacity:0.08; transparent:true; wireframe:true;');
    floorRoot.appendChild(grid);

    log('Failsafe floor/grid injected');
  }

  function addDoors(parent){
    const doors = ensure('scarlett1_doors','a-entity', parent);
    clear(doors);

    const defs = [
      { name:'NORTH GATE', x:0, z:-(ARENA_R-1), rot:'0 0 0' },
      { name:'SOUTH GATE', x:0, z:(ARENA_R-1),  rot:'0 180 0' },
      { name:'EAST GATE',  x:(ARENA_R-1), z:0,  rot:'0 -90 0' },
      { name:'WEST GATE',  x:-(ARENA_R-1), z:0, rot:'0 90 0' }
    ];

    defs.forEach(d=>{
      const frame = document.createElement('a-box');
      frame.setAttribute('width','10');
      frame.setAttribute('height','8');
      frame.setAttribute('depth','0.4');
      frame.setAttribute('position', `${d.x} 4 ${d.z}`);
      frame.setAttribute('rotation', d.rot);
      frame.setAttribute('material','color:#111; emissive:#A020F0; emissiveIntensity:6; opacity:0.55; transparent:true;');
      doors.appendChild(frame);

      const label = document.createElement('a-text');
      label.setAttribute('value', d.name);
      label.setAttribute('align','center');
      label.setAttribute('width','18');
      label.setAttribute('color','#00FF00');
      label.setAttribute('position', `${d.x} 9 ${d.z}`);
      doors.appendChild(label);
    });

    log('Doorways injected (N/E/S/W)');
  }

  function addPitAndTable(parent){
    const pit = ensure('scarlett1_pit','a-entity', parent);
    clear(pit);
    pit.setAttribute('position', `0 ${PIT_Y} 0`);

    const pitFloor = document.createElement('a-circle');
    pitFloor.setAttribute('rotation','-90 0 0');
    pitFloor.setAttribute('radius', String(PIT_R));
    pitFloor.setAttribute('material','color:#0b0b10; roughness:0.95;');
    pit.appendChild(pitFloor);

    const pitGlow = document.createElement('a-ring');
    pitGlow.setAttribute('rotation','-90 0 0');
    pitGlow.setAttribute('radius-inner', String(PIT_R-0.35));
    pitGlow.setAttribute('radius-outer', String(PIT_R+0.35));
    pitGlow.setAttribute('position','0 0.04 0');
    pitGlow.setAttribute('material','color:#00FFFF; emissive:#00FFFF; emissiveIntensity:10; opacity:0.9; transparent:true;');
    pitGlow.setAttribute('animation__pulse','property: material.emissiveIntensity; dir: alternate; dur: 1400; loop: true; to: 18');
    pit.appendChild(pitGlow);

    // Table root
    const table = ensure('scarlett1_table','a-entity', pit);
    table.setAttribute('position', `0 ${-PIT_Y} ${TABLE_CENTER_Z}`); // cancel pit y for local convenience

    // Base pedestal
    const pedestal = document.createElement('a-cylinder');
    pedestal.setAttribute('radius','2.0');
    pedestal.setAttribute('height','0.8');
    pedestal.setAttribute('position', `0 ${TABLE_FELT_Y - PIT_Y - 0.45} 0`);
    pedestal.setAttribute('material','color:#111; roughness:0.9;');
    table.appendChild(pedestal);

    // Felt
    const felt = document.createElement('a-cylinder');
    felt.setAttribute('radius','4.2');
    felt.setAttribute('height','0.25');
    felt.setAttribute('position', `0 ${TABLE_FELT_Y - PIT_Y} 0`);
    felt.setAttribute('material','color:#073010; roughness:0.85; metalness:0.05;');
    table.appendChild(felt);

    // Neon rail
    const rail = document.createElement('a-ring');
    rail.setAttribute('rotation','-90 0 0');
    rail.setAttribute('radius-inner','4.05');
    rail.setAttribute('radius-outer','4.35');
    rail.setAttribute('position', `0 ${TABLE_FELT_Y - PIT_Y + 0.14} 0`);
    rail.setAttribute('material','color:#A020F0; emissive:#A020F0; emissiveIntensity:14; opacity:0.95; transparent:true;');
    table.appendChild(rail);

    // Community anchor
    const comm = ensure('community-cards','a-entity', table);
    comm.setAttribute('position', `0 ${TABLE_FELT_Y - PIT_Y + 0.18} 0`);

    // Table label
    const t = document.createElement('a-text');
    t.setAttribute('value','HIGH STAKES PIT');
    t.setAttribute('align','center');
    t.setAttribute('width','14');
    t.setAttribute('color','#00FF00');
    t.setAttribute('position', `0 ${TABLE_FELT_Y - PIT_Y + 2.0} 0`);
    table.appendChild(t);

    log('Pit + table injected');
  }

  function ninjaModelSrc(){
    // prefer Spine preloaded asset-item id="ninjaModel"
    return document.getElementById('ninjaModel') ? NINJA_ASSET_ID : NINJA_FALLBACK;
  }

  function addBots(parent){
    const bots = ensure('scarlett1_bots','a-entity', parent);
    clear(bots);

    const table = document.getElementById('scarlett1_table');
    if (!table) { log('Bots: table missing'); return; }

    SEATS.forEach((s, i)=>{
      const bot = document.createElement('a-entity');
      bot.id = s.id;
      bot.setAttribute('position', `${s.pos.x} ${s.pos.y} ${s.pos.z}`);
      bot.setAttribute('rotation', `0 ${s.rotY} 0`);

      const model = document.createElement('a-entity');
      model.setAttribute('gltf-model', ninjaModelSrc());
      model.setAttribute('animation-mixer','clip: idle; loop: repeat; timeScale: 1');
      bot.appendChild(model);

      // nameplate
      const bg = document.createElement('a-plane');
      bg.setAttribute('width','1.6'); bg.setAttribute('height','0.34');
      bg.setAttribute('position','0 1.95 0.22');
      bg.setAttribute('material','color:#001a10; opacity:0.85; transparent:true; emissive:#00ff88; emissiveIntensity:0.06');
      bot.appendChild(bg);

      const name = document.createElement('a-text');
      name.setAttribute('value', s.name);
      name.setAttribute('align','center');
      name.setAttribute('width','3.4');
      name.setAttribute('color','#00FFFF');
      name.setAttribute('position','0 1.95 0.23');
      bot.appendChild(name);

      const think = document.createElement('a-ring');
      think.setAttribute('radius-inner','0.08');
      think.setAttribute('radius-outer','0.12');
      think.setAttribute('position','0 2.20 0.24');
      think.setAttribute('material','color:#A020F0; emissive:#A020F0; emissiveIntensity:10; opacity:0.95; transparent:true');
      think.setAttribute('animation__pulse','property: material.emissiveIntensity; dir: alternate; dur: 950; loop: true; to: 18');
      bot.appendChild(think);

      // subtle bob
      bot.setAttribute('animation__bob', `property: position; dir: alternate; dur: ${1800+i*240}; loop: true; to: ${s.pos.x} ${(s.pos.y+0.05).toFixed(2)} ${s.pos.z}`);

      table.appendChild(bot);
    });

    log('Bots injected (3 ninjas seated)');
  }

  function addGuards(parent){
    const guards = ensure('scarlett1_guards','a-entity', parent);
    clear(guards);

    const defs = [
      { pos:`3 0 ${-(ARENA_R-6)}`, rot:'0 0 0' },
      { pos:`-3 0 ${-(ARENA_R-6)}`, rot:'0 0 0' },
      { pos:`0 0 ${-(ARENA_R-10)}`, rot:'0 0 0' }
    ];

    defs.forEach((d, idx)=>{
      const g = document.createElement('a-entity');
      g.setAttribute('position', d.pos);
      g.setAttribute('rotation', d.rot);

      const m = document.createElement('a-entity');
      m.setAttribute('gltf-model', ninjaModelSrc());
      m.setAttribute('animation-mixer','clip: idle; loop: repeat; timeScale: 1');
      g.appendChild(m);

      const ring = document.createElement('a-ring');
      ring.setAttribute('rotation','-90 0 0');
      ring.setAttribute('radius-inner','0.45');
      ring.setAttribute('radius-outer','0.58');
      ring.setAttribute('position','0 0.02 0');
      ring.setAttribute('material','color:#00ff88; emissive:#00ff88; emissiveIntensity:10; opacity:0.9; transparent:true;');
      ring.setAttribute('animation__pulse', `property: material.emissiveIntensity; dir: alternate; dur: ${1200+idx*160}; loop: true; to: 18`);
      g.appendChild(ring);

      guards.appendChild(g);
    });

    log('Entrance guards injected');
  }

  // ---------- Interaction Pads ----------
  function addPads(parent){
    const pads = ensure('scarlett1_pads','a-entity', parent);
    clear(pads);

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

    const table = document.getElementById('scarlett1_table');
    if (!table) { log('Pads: table missing'); return; }

    actions.forEach((a, i)=>{
      const ang = (i / actions.length) * Math.PI * 2;
      const x = Math.sin(ang) * PAD_RING_R;
      const z = Math.cos(ang) * PAD_RING_R;

      const pad = document.createElement('a-box');
      pad.setAttribute('width','1.6');
      pad.setAttribute('height','0.22');
      pad.setAttribute('depth','1.0');
      pad.setAttribute('position', `${x.toFixed(2)} ${TABLE_FELT_Y - PIT_Y + 0.05} ${z.toFixed(2)}`);
      pad.setAttribute('rotation', `0 ${(-ang*180/Math.PI).toFixed(1)} 0`);
      pad.setAttribute('material','color:#081018; emissive:#00FFFF; emissiveIntensity:0.35; roughness:0.8; opacity:0.95; transparent:true;');
      clickable(pad);

      pad.addEventListener('click', ()=>{
        pad.setAttribute('material','emissiveIntensity','2.0');
        setTimeout(()=>pad.setAttribute('material','emissiveIntensity','0.35'), 140);
        a.fn();
      });

      const txt = document.createElement('a-text');
      txt.setAttribute('value', a.label);
      txt.setAttribute('align','center');
      txt.setAttribute('width','6');
      txt.setAttribute('color','#00FF00');
      txt.setAttribute('position', `${x.toFixed(2)} ${TABLE_FELT_Y - PIT_Y + 0.40} ${(z+0.2).toFixed(2)}`);

      pads.appendChild(pad);
      pads.appendChild(txt);
    });

    log('Interaction pads injected');
  }

  // ---------- Cards ----------
  function makeCard(i){
    const c = document.createElement('a-box');
    c.setAttribute('width','0.5');
    c.setAttribute('height','0.7');
    c.setAttribute('depth','0.02');
    c.setAttribute('rotation','-90 0 0');
    c.setAttribute('position','0 2.6 0');
    c.setAttribute('material','color:#ffffff; roughness:0.85; metalness:0; emissive:#111; emissiveIntensity:0.05');
    c.dataset.card = String(i);
    return c;
  }

  function dealCommunity(list){
    const comm = document.getElementById('community-cards');
    if (!comm) { log('Cards: anchor missing'); return; }
    clear(comm);

    list.forEach((p, idx)=>{
      const card = makeCard(idx);
      // positions are relative to table root (table center = 0,0,0 in its space)
      const to = p;
      card.setAttribute('animation__glide', `property: position; dur: 650; easing: easeOutCubic; to: ${to}`);
      const [x,y,z] = p.split(' ').map(Number);
      card.setAttribute('animation__hover', `property: position; dir: alternate; dur: 1200; loop: true; to: ${x} ${(y+0.10).toFixed(2)} ${z}`);
      comm.appendChild(card);
    });

    clink();
    log(`Dealt ${list.length} community card(s)`);
  }

  // ---------- Chips ----------
  const Chips = {
    chips: [],
    held: null,
    spawn(){
      // simplest visible stack on felt
      const table = document.getElementById('scarlett1_table');
      if (!table) { log('Chips: table missing'); return; }

      const root = ensure('scarlett1_chips','a-entity', table);
      clear(root);
      this.chips = [];
      this.held = null;

      const baseX = 0, baseZ = -1.6;
      for (let i=0;i<18;i++){
        const chip = document.createElement('a-cylinder');
        chip.setAttribute('radius','0.08');
        chip.setAttribute('height','0.02');
        chip.setAttribute('rotation','90 0 0');
        chip.setAttribute('position', `${baseX} ${(TABLE_FELT_Y - PIT_Y + i*0.021).toFixed(3)} ${baseZ}`);
        chip.setAttribute('color', (i%3===0)?'#00FFFF':((i%3===1)?'#A020F0':'#00FF00'));
        chip.setAttribute('material','roughness:0.6; metalness:0.12; emissiveIntensity:0.12;');
        clickable(chip);

        chip.addEventListener('click', (e)=>{
          e.stopPropagation();
          this.toggle(chip);
        });

        root.appendChild(chip);
        this.chips.push(chip);
      }

      log('Chips injected (click to pick/drop)');
    },
    toggle(chip){
      const cam = document.getElementById(IDS.cam) || qs('a-camera');
      const sc = qs(IDS.scene);
      if (!cam || !sc || !window.AFRAME) return;

      if (this.held && this.held !== chip) this.drop(this.held);
      if (this.held === chip) { this.drop(chip); this.held=null; return; }

      this.held = chip;
      cam.object3D.add(chip.object3D);
      chip.object3D.position.set(0.18, -0.22, -0.62);
      chip.object3D.rotation.set(Math.PI/2,0,0);
      clink();
      log('Chip picked up');
    },
    drop(chip){
      const cam = document.getElementById(IDS.cam) || qs('a-camera');
      const sc = qs(IDS.scene);
      if (!cam || !sc || !window.AFRAME) return;

      const dir = new AFRAME.THREE.Vector3();
      cam.object3D.getWorldDirection(dir);
      const pos = new AFRAME.THREE.Vector3();
      cam.object3D.getWorldPosition(pos);
      dir.multiplyScalar(0.8); pos.add(dir);

      sc.object3D.add(chip.object3D);
      chip.object3D.position.copy(pos);
      chip.object3D.rotation.set(Math.PI/2,0,0);

      clink();
      log('Chip dropped');
    }
  };

  // ---------- Store ----------
  let storeRoot = null;
  function buildStore(){
    const table = document.getElementById('scarlett1_table');
    if (!table) return;

    storeRoot = ensure('scarlett1_store','a-entity', table);
    clear(storeRoot);
    storeRoot.setAttribute('position', `0 ${TABLE_FELT_Y - PIT_Y + 0.10} ${PIT_R - 1.2}`);
    storeRoot.setAttribute('rotation','0 180 0');

    const base = document.createElement('a-cylinder');
    base.setAttribute('radius','3.0');
    base.setAttribute('height','0.35');
    base.setAttribute('material','color:#123018; roughness:0.95; emissive:#00ff88; emissiveIntensity:0.06');
    storeRoot.appendChild(base);

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
    sign.setAttribute('value', 'JUNGLE STORE');
    sign.setAttribute('align','center');
    sign.setAttribute('width','10');
    sign.setAttribute('color','#00FF00');
    sign.setAttribute('position','0 3.2 0');
    storeRoot.appendChild(sign);

    const pedPos = [
      { x:-1.4, z:0.8, item:STORE_ITEMS[0] },
      { x: 0.0, z:1.6, item:STORE_ITEMS[1] },
      { x: 1.4, z:0.8, item:STORE_ITEMS[2] },
    ];

    pedPos.forEach((p, idx)=>{
      const ped = document.createElement('a-cylinder');
      ped.setAttribute('radius','0.48');
      ped.setAttribute('height','1.05');
      ped.setAttribute('position', `${p.x} 0.52 ${p.z}`);
      ped.setAttribute('material','color:#0b0b10; emissive:#A020F0; emissiveIntensity:0.9; roughness:0.8');
      clickable(ped);
      ped.addEventListener('click', ()=>purchase(p.item));
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
  }

  function purchase(item){
    if (S.credits < item.price){
      log(`Store: insufficient credits for ${item.label}`);
      return;
    }
    S.credits -= item.price;
    saveCredits();
    log(`Store purchase: ${item.label} (-$${item.price}) — CREDITS $${S.credits}`);
  }

  function toggleStore(){
    if (!storeRoot) buildStore();
    S.storeVisible = !S.storeVisible;
    if (storeRoot) storeRoot.object3D.visible = S.storeVisible;
    log(`Store ${S.storeVisible ? 'OPEN' : 'CLOSED'}`);
  }

  // ---------- Radio ----------
  function ensureAudio(){
    if (S.audio) return S.audio;
    S.audio = new Audio();
    S.audio.crossOrigin = 'anonymous';
    S.audio.loop = true;
    S.audio.volume = 0.55;
    S.audio.src = STATIONS[S.stationIdx].url;
    return S.audio;
  }

  function toggleRadio(){
    const a = ensureAudio();
    S.radioOn = !S.radioOn;

    if (S.radioOn){
      a.src = STATIONS[S.stationIdx].url;
      a.play().then(()=>log(`Radio ON: ${STATIONS[S.stationIdx].name}`))
        .catch(()=>{ S.radioOn=false; log('Radio blocked / stream fail'); });
    } else {
      a.pause();
      log('Radio OFF');
    }
    return S.radioOn;
  }

  // ---------- Big Win ----------
  function bigWin(){
    S.pot += 1200 + Math.floor(Math.random()*3000);
    S.street = 'SHOWDOWN';
    log(`BIG WIN TRIGGERED — POT $${S.pot}`);

    const p = document.getElementById(IDS.win);
    if (p){
      p.setAttribute('particle-system','enabled', true);
      setTimeout(()=>p.setAttribute('particle-system','enabled', false), 10000);
    }
  }

  // ---------- Public API ----------
  const scarlettModule = {
    init(){
      if (S.built) return true;
      const a = anchorEl();
      if (!a){ setTimeout(()=>scarlettModule.init(), 200); return false; }

      // IMPORTANT: If module got ACTIVE but you saw white, this guarantees visible objects.
      clear(a);

      addModuleLights(a);
      addFailsafeFloor(a);
      addDoors(a);
      addPitAndTable(a);
      addBots(a);
      addPads(a);
      addGuards(a);
      Chips.spawn();
      buildStore();
      if (storeRoot) storeRoot.object3D.visible = false;

      // start with flop
      S.street = 'FLOP';
      S.pot = 300;
      dealCommunity(COMMUNITY.flop);

      S.built = true;
      log('INIT COMPLETE: geometry injected (no white screen)');
      return true;
    },

    // Required by Spine buttons
    dealFlop(){ S.street='FLOP';  S.pot += 150; dealCommunity(COMMUNITY.flop); return true; },
    dealTurn(){ S.street='TURN';  S.pot += 250; dealCommunity(COMMUNITY.turn); return true; },
    dealRiver(){S.street='RIVER'; S.pot += 350; dealCommunity(COMMUNITY.river); return true; },
    resetHand(){
      const comm = document.getElementById('community-cards');
      if (comm) clear(comm);
      S.street='PRE'; S.pot=0;
      log('HAND RESET');
      return true;
    },

    spawnStore(){ toggleStore(); return true; },
    toggleRadio(){ return toggleRadio(); },
    spawnGuard(){ addGuards(anchorEl()); return true; },
    bigWin(){ bigWin(); return true; }
  };

  window.scarlettModule = scarlettModule;

  // Auto-run (Spine handshake also calls init — both are safe)
  setTimeout(()=>{ try { scarlettModule.init(); } catch(e){ console.error(e); } }, 0);
})();
