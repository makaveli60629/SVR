/**
 * SCARLETTVR POKER — SCARLETT1 (PERMANENT)
 * Permanent Spine: bright circular lobby + doors + interaction pads + poker table + cards + bots + wrist HUD + radio + joystick locomotion.
 * NEXT PHASE INCLUDED: Poker stages (Hole → Flop → Turn → River) + Jumbotrons + Circular Lobby.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js';

export const Scarlett1 = { start };

function start() {
  const hud = document.getElementById('hud');
  const log = (...args) => {
    const t = ((performance.now()/1000).toFixed(3)).padStart(7,' ');
    const line = `[${t}] ${args.join(' ')}`;
    console.log(line);
    hud.textContent = (hud.textContent + "\n" + line).slice(-1800);
  };

  // --- renderer / scene / camera ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.xr.enabled = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x05060a);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 300);
  camera.position.set(0, 1.65, 4.5);

  const clock = new THREE.Clock();

  // Player rig (for locomotion)
  const rig = new THREE.Group();
  rig.position.set(0, 0, 6);
  rig.add(camera);
  scene.add(rig);

  // --- bright lighting pack (max visibility) ---
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223366, 1.2);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.9);
  scene.add(ambient);

  const dir1 = new THREE.DirectionalLight(0xffffff, 2.2);
  dir1.position.set(6, 12, 6);
  scene.add(dir1);

  const dir2 = new THREE.DirectionalLight(0xffffff, 1.5);
  dir2.position.set(-6, 10, -6);
  scene.add(dir2);

  // --- circular sealed lobby (floor/ceiling/walls) ---
  const room = new THREE.Group();
  scene.add(room);

  const ROOM_R = 12;
  const ROOM_H = 6;

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_R, 64),
    new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.95, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  room.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.CircleGeometry(ROOM_R, 64),
    new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 1, metalness: 0 })
  );
  ceiling.rotation.x = Math.PI/2;
  ceiling.position.y = ROOM_H;
  room.add(ceiling);

  // Cylindrical wall (sealed)
  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.9, metalness: 0.12 });
  const wall = new THREE.Mesh(
    new THREE.CylinderGeometry(ROOM_R, ROOM_R, ROOM_H, 96, 1, true),
    wallMat
  );
  wall.position.y = ROOM_H/2;
  room.add(wall);

  // Neon ring accents
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x1730ff, roughness: 0.25, metalness: 0.75,
    emissive: new THREE.Color(0x2a55ff), emissiveIntensity: 0.9
  });
  const ring1 = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R-0.35, 0.06, 16, 128), ringMat);
  ring1.rotation.x = Math.PI/2;
  ring1.position.y = 0.08;
  room.add(ring1);

  const ring2 = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R-0.35, 0.06, 16, 128), ringMat);
  ring2.rotation.x = Math.PI/2;
  ring2.position.y = ROOM_H-0.08;
  room.add(ring2);

  const grid = new THREE.GridHelper(ROOM_R*2, 32, 0x3355ff, 0x0b1220);
  grid.position.y = 0.01;
  room.add(grid);

  // --- Doors (3 entrances on the cylinder) ---
  const doors = new THREE.Group();
  room.add(doors);

  const doorMat = new THREE.MeshStandardMaterial({
    color: 0x1a2a55, roughness: 0.6, metalness: 0.4,
    emissive: new THREE.Color(0x0a1435), emissiveIntensity: 0.8
  });

  function makeDoorAtAngle(theta, label) {
    // door panel
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.6, 0.18), doorMat);
    panel.userData = { type: 'door', label, open: false, theta, slide: 0 };

    // place on wall at radius
    const x = Math.sin(theta) * (ROOM_R - 0.12);
    const z = Math.cos(theta) * (ROOM_R - 0.12);
    panel.position.set(x, 1.8, z);

    // face inward
    panel.lookAt(0, 1.8, 0);

    doors.add(panel);
    return panel;
  }

  const doorA = makeDoorAtAngle(0, 'Main Entrance');                  // north
  const doorB = makeDoorAtAngle(Math.PI * 2/3, 'Side Entrance');      // 120°
  const doorC = makeDoorAtAngle(Math.PI * 4/3, 'VIP Entrance');       // 240°

  // --- Interaction pads (arc in front of spawn) ---
  const pads = new THREE.Group();
  room.add(pads);

  const padMat = new THREE.MeshStandardMaterial({
    color: 0x1230aa, roughness: 0.4, metalness: 0.6,
    emissive: new THREE.Color(0x1a3cff), emissiveIntensity: 1.2
  });

  function makePadPolar(r, theta, label, onTrigger) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32), padMat);
    const x = Math.sin(theta) * r;
    const z = Math.cos(theta) * r;
    pad.position.set(x, 0.04, z);
    pad.userData = { type: 'pad', label, onTrigger };
    pads.add(pad);

    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.62, 0.03, 12, 64),
      new THREE.MeshStandardMaterial({
        color: 0x6aa0ff, roughness: 0.2, metalness: 0.8,
        emissive: new THREE.Color(0x3355ff), emissiveIntensity: 0.7
      })
    );
    ring.rotation.x = Math.PI/2;
    ring.position.set(x, 0.08, z);
    pads.add(ring);

    return pad;
  }

  // --- Poker table area (center) ---
  const poker = new THREE.Group();
  poker.position.set(0, 0, 0);
  room.add(poker);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.35, 48),
    new THREE.MeshStandardMaterial({ color: 0x131b2f, roughness: 0.8, metalness: 0.15 })
  );
  table.position.set(0, 0.35/2, 0);
  poker.add(table);

  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.08, 48),
    new THREE.MeshStandardMaterial({
      color: 0x0a3a2a, roughness: 1.0, metalness: 0.0,
      emissive: new THREE.Color(0x02140e), emissiveIntensity: 0.22
    })
  );
  felt.position.set(0, 0.35 + 0.06, 0);
  poker.add(felt);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.05, 0.12, 16, 64),
    new THREE.MeshStandardMaterial({ color: 0x141a2f, roughness: 0.7, metalness: 0.2 })
  );
  rail.rotation.x = Math.PI/2;
  rail.position.set(0, 0.55, 0);
  poker.add(rail);

  // Seats + bots placeholders
  const seats = [];
  const bots = [];
  const botsGroup = new THREE.Group();
  poker.add(botsGroup);

  const chairMat = new THREE.MeshStandardMaterial({ color: 0x0e1428, roughness: 0.9, metalness: 0.1 });
  const botMatA = new THREE.MeshStandardMaterial({ color: 0x2a68ff, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(0x0b1a44), emissiveIntensity: 0.6 });
  const botMatB = new THREE.MeshStandardMaterial({ color: 0xff2a7a, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(0x440b22), emissiveIntensity: 0.6 });

  for (let i=0;i<8;i++){
    const a = (i/8)*Math.PI*2;
    const r = 3.4;
    const x = Math.sin(a)*r;
    const z = Math.cos(a)*r;

    const chair = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.9, 0.7), chairMat);
    chair.position.set(x, 0.45, z);
    chair.rotation.y = a + Math.PI;
    poker.add(chair);
    seats.push(chair);

    const bot = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.6, 6, 12), i%2===0?botMatA:botMatB);
    body.position.y = 0.9;
    bot.add(body);

    const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), i%2===0?botMatA:botMatB);
    head.position.y = 1.55;
    bot.add(head);

    bot.position.set(x, 0, z);
    bot.rotation.y = a + Math.PI;
    bot.userData = { seatIndex:i, idlePhase: Math.random()*Math.PI*2 };
    botsGroup.add(bot);
    bots.push(bot);
  }

  // --- Cards group + materials ---
  const cardsGroup = new THREE.Group();
  poker.add(cardsGroup);

  const cardMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2,
    roughness: 0.8,
    metalness: 0.0,
    emissive: new THREE.Color(0x0a0a0a),
    emissiveIntensity: 0.15,
    side: THREE.DoubleSide, // ✅ always visible
  });

  // Community cards (5)
  const cards = [];
  for (let i=0;i<5;i++){
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.78), cardMat);
    card.rotation.x = -Math.PI/2;
    card.position.set((i-2)*0.62, 0.72, 0);
    card.userData = { type:'card', idx:i, hoverPhase: Math.random()*Math.PI*2 };
    cardsGroup.add(card);
    cards.push(card);
  }

  // =============================
  // NEXT PHASE: Poker Stages System
  // Hole -> Flop -> Turn -> River
  // =============================
  const pokerState = {
    stage: 0, // 0=idle, 1=hole dealt, 2=flop, 3=turn, 4=river
    holeCards: [],
    community: cards,
  };

  function clearHand() {
    for (const hc of pokerState.holeCards) cardsGroup.remove(hc.mesh);
    pokerState.holeCards.length = 0;

    pokerState.community.forEach((c, i) => {
      c.visible = false;
      c.position.set((i-2)*0.62, 0.72, 0);
      c.rotation.set(-Math.PI/2, 0, 0);
    });

    pokerState.stage = 0;
    log('[poker] reset');
  }

  function spawnHoleCards() {
    const holeMat = cardMat.clone();
    holeMat.side = THREE.DoubleSide;

    for (let seatIndex = 0; seatIndex < 8; seatIndex++) {
      const chair = seats[seatIndex];
      const basePos = new THREE.Vector3().copy(chair.position);
      const dir = basePos.clone().multiplyScalar(-1).normalize();

      for (let j = 0; j < 2; j++) {
        const m = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.65), holeMat);
        const p = basePos.clone().add(dir.clone().multiplyScalar(0.9));
        p.y = 0.72;
        p.x += (j === 0 ? -0.18 : 0.18);

        m.position.copy(p);
        m.userData = { type: 'hole', seatIndex, j, hoverPhase: Math.random()*Math.PI*2 };
        m.visible = false;

        cardsGroup.add(m);
        pokerState.holeCards.push({ mesh: m, seatIndex });
      }
    }
  }

  function dealHole() {
    if (pokerState.holeCards.length === 0) spawnHoleCards();
    for (const hc of pokerState.holeCards) hc.mesh.visible = true;
    pokerState.stage = 1;
    log('[poker] hole dealt ✅');
  }

  function flop() {
    if (pokerState.stage < 1) dealHole();
    pokerState.community[0].visible = true;
    pokerState.community[1].visible = true;
    pokerState.community[2].visible = true;
    pokerState.stage = 2;
    log('[poker] flop ✅');
  }

  function turn() {
    if (pokerState.stage < 2) flop();
    pokerState.community[3].visible = true;
    pokerState.stage = 3;
    log('[poker] turn ✅');
  }

  function river() {
    if (pokerState.stage < 3) turn();
    pokerState.community[4].visible = true;
    pokerState.stage = 4;
    log('[poker] river ✅');
  }

  // Deal button = setup hand (hole visible, community hidden until phases)
  function dealHand() {
    clearHand();
    dealHole();
    log('[cards] full hand ready (Flop / Turn / River)');
  }

  // --- Pads actions toggles ---
  let padsEnabled = true;
  let botsEnabled = true;

  // --- Ray interaction (tap/click) ---
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = false;

  function setPointerFromEvent(ev) {
    const x = (ev.clientX / window.innerWidth) * 2 - 1;
    const y = -(ev.clientY / window.innerHeight) * 2 + 1;
    pointer.set(x, y);
  }

  function interact(ev) {
    if (!padsEnabled) return;
    setPointerFromEvent(ev);

    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([pads, doors], true);
    if (hits.length === 0) return;

    const obj = hits[0].object;
    if (obj?.userData?.type === 'pad') {
      log(`[pad] ${obj.userData.label}`);
      obj.userData.onTrigger?.();
    }
    if (obj?.userData?.type === 'door') {
      log(`[door] ${obj.userData.label}`);
      toggleDoor(obj);
    }
  }

  window.addEventListener('pointerdown', () => { pointerDown = true; });
  window.addEventListener('pointerup', (ev) => {
    if (!pointerDown) return;
    pointerDown = false;
    interact(ev);
  });

  // --- Wrist HUD wiring ---
  const btnEnterVR = document.getElementById('btnEnterVR');
  const btnReset   = document.getElementById('btnReset');
  const btnBright  = document.getElementById('btnBright');
  const btnDeal    = document.getElementById('btnDeal');
  const btnMusic   = document.getElementById('btnMusic');
  const btnBots    = document.getElementById('btnBots');
  const btnPads    = document.getElementById('btnPads');
  const stationSel = document.getElementById('station');

  btnReset.onclick  = () => resetSpawn();
  btnBright.onclick = () => setMaxBright(true);
  btnDeal.onclick   = () => dealHand();
  btnBots.onclick   = () => toggleBots();
  btnPads.onclick   = () => { padsEnabled = !padsEnabled; btnPads.textContent = `Pads: ${padsEnabled?'ON':'OFF'}`; };

  // Add Phase buttons to wrist (no HTML edits)
  const wrist = document.getElementById('wrist');

  const phaseRow = document.createElement('div');
  phaseRow.className = 'row';
  phaseRow.style.marginTop = '8px';

  const bFlop = document.createElement('button');
  bFlop.textContent = 'Flop';
  bFlop.onclick = () => flop();

  const bTurn = document.createElement('button');
  bTurn.textContent = 'Turn';
  bTurn.onclick = () => turn();

  phaseRow.appendChild(bFlop);
  phaseRow.appendChild(bTurn);
  wrist.appendChild(phaseRow);

  const phaseRow2 = document.createElement('div');
  phaseRow2.className = 'row';

  const bRiver = document.createElement('button');
  bRiver.textContent = 'River';
  bRiver.onclick = () => river();

  const bResetHand = document.createElement('button');
  bResetHand.textContent = 'Reset Hand';
  bResetHand.onclick = () => clearHand();

  phaseRow2.appendChild(bRiver);
  phaseRow2.appendChild(bResetHand);
  wrist.appendChild(phaseRow2);

  // --- Radio system (safe examples + expandable) ---
  const stations = [
    { name: 'OFF', url: '' },
    { name: 'SomaFM — Groove Salad', url: 'https://ice1.somafm.com/groovesalad-128-mp3' },
    { name: 'SomaFM — Deep Space One', url: 'https://ice1.somafm.com/deepspaceone-128-mp3' },
    { name: 'SomaFM — Drone Zone', url: 'https://ice1.somafm.com/dronezone-128-mp3' },
    { name: 'SomaFM — Secret Agent', url: 'https://ice1.somafm.com/secretagent-128-mp3' },
  ];
  for (const s of stations) {
    const opt = document.createElement('option');
    opt.value = s.url;
    opt.textContent = s.name;
    stationSel.appendChild(opt);
  }

  const audio = document.createElement('audio');
  audio.crossOrigin = 'anonymous';
  audio.loop = true;
  audio.preload = 'none';
  document.body.appendChild(audio);

  let musicOn = false;

  stationSel.onchange = () => {
    if (!musicOn) return;
    const url = stationSel.value;
    if (!url) { stopMusic(); return; }
    playMusic(url);
  };

  function playMusic(url) {
    audio.src = url;
    audio.volume = 0.6;
    audio.play().catch(()=>{});
    btnMusic.textContent = 'Music: ON';
    musicOn = true;
  }
  function stopMusic() {
    audio.pause();
    audio.src = '';
    btnMusic.textContent = 'Music: OFF';
    musicOn = false;
  }
  function toggleMusic() {
    if (musicOn) stopMusic();
    else {
      const url = stationSel.value;
      if (url) playMusic(url);
      else { musicOn = true; btnMusic.textContent = 'Music: ON'; }
    }
  }
  btnMusic.onclick = () => toggleMusic();

  // --- Doors logic ---
  function toggleDoor(doorMesh) {
    doorMesh.userData.open = !doorMesh.userData.open;
    const open = doorMesh.userData.open;
    doorMesh.userData.slide = open ? 1 : 0;
    doorMesh.material.emissiveIntensity = open ? 2.0 : 0.8;
  }

  function toggleDoors() { [doorA, doorB, doorC].forEach(toggleDoor); }

  // --- Brightness (max) ---
  let maxBright = false;
  function setMaxBright(on) {
    maxBright = on;
    ambient.intensity = on ? 1.4 : 0.9;
    hemi.intensity = on ? 1.8 : 1.2;
    dir1.intensity = on ? 3.0 : 2.2;
    dir2.intensity = on ? 2.2 : 1.5;
    scene.background = new THREE.Color(on ? 0x0a0c14 : 0x05060a);
    log(`[lights] maxBright=${on}`);
  }

  // --- Spawn reset ---
  const spawn = new THREE.Vector3(0, 0, 6);
  function resetSpawn() {
    rig.position.copy(spawn);
    rig.rotation.set(0, 0, 0);
    log('[spawn] reset');
  }

  // --- Bots toggle ---
  function toggleBots() {
    botsEnabled = !botsEnabled;
    botsGroup.visible = botsEnabled;
    btnBots.textContent = `Bots: ${botsEnabled?'ON':'OFF'}`;
    log(`[bots] ${botsEnabled?'ON':'OFF'}`);
  }

  // --- Create pads AFTER functions exist ---
  // Arrange pads in an arc near the player (south side, facing center)
  const PAD_R = 6.2;
  const baseTheta = Math.PI; // south
  const step = 0.22;

  makePadPolar(PAD_R, baseTheta + step*3, "Max Bright", () => setMaxBright(true));
  makePadPolar(PAD_R, baseTheta + step*2, "Deal Hand", () => dealHand());
  makePadPolar(PAD_R, baseTheta + step*1, "Flop", () => flop());
  makePadPolar(PAD_R, baseTheta + step*0, "Turn", () => turn());
  makePadPolar(PAD_R, baseTheta - step*1, "River", () => river());
  makePadPolar(PAD_R, baseTheta - step*2, "Reset Hand", () => clearHand());
  makePadPolar(PAD_R, baseTheta - step*3, "Toggle Doors", () => toggleDoors());

  // --- JUMBOTRONS (4) ---
  const jumbos = new THREE.Group();
  room.add(jumbos);

  function makeCanvasTexture(label) {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 256;
    const ctx = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;

    const state = { c, ctx, tex, label, t: 0 };

    function draw() {
      const { ctx } = state;
      ctx.clearRect(0,0,c.width,c.height);

      // background
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0,0,c.width,c.height);

      // glow frame
      ctx.strokeStyle = 'rgba(90,140,255,0.85)';
      ctx.lineWidth = 8;
      ctx.strokeRect(10,10,c.width-20,c.height-20);

      // title
      ctx.fillStyle = 'rgba(220,235,255,0.95)';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText('SCARLETT JUMBOTRON', 24, 58);

      // label
      ctx.fillStyle = 'rgba(120,180,255,0.95)';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(label, 24, 100);

      // ticker
      const now = new Date();
      const msg = `LIVE • ${now.toLocaleTimeString()} • Poker Night • Radio • VR •`;
      const x = 24 + ((state.t * 140) % (c.width + 600)) * -1;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(msg + ' ' + msg, x, 200);

      // simple pulse bar
      const p = (Math.sin(state.t*2.0)*0.5+0.5);
      ctx.fillStyle = `rgba(60,120,255,${0.25 + 0.35*p})`;
      ctx.fillRect(24, 128, (c.width-48)*p, 10);

      state.tex.needsUpdate = true;
    }

    return { state, draw };
  }

  const jumboAnim = [];

  function addJumbotron(theta, label) {
    const { state, draw } = makeCanvasTexture(label);
    jumboAnim.push({ state, draw });

    const mat = new THREE.MeshStandardMaterial({
      map: state.tex,
      emissive: new THREE.Color(0xffffff),
      emissiveIntensity: 1.2,
      roughness: 0.4,
      metalness: 0.1
    });

    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(4.4, 2.6, 0.18),
      new THREE.MeshStandardMaterial({ color: 0x070a14, roughness: 0.8, metalness: 0.2 })
    );

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(4.0, 2.2), mat);
    screen.position.z = 0.10;

    const g = new THREE.Group();
    g.add(frame);
    g.add(screen);

    const x = Math.sin(theta) * (ROOM_R - 0.55);
    const z = Math.cos(theta) * (ROOM_R - 0.55);
    g.position.set(x, 2.9, z);
    g.lookAt(0, 2.9, 0);

    jumbos.add(g);
  }

  addJumbotron(0, 'MAIN STAGE');
  addJumbotron(Math.PI/2, 'TABLE CAM');
  addJumbotron(Math.PI, 'TOURNAMENT');
  addJumbotron(Math.PI*1.5, 'VIP LOUNGE');

  // --- Android joystick locomotion ---
  const joy = document.getElementById('joystick');
  const knob = document.getElementById('joyKnob');
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouch) joy.style.display = 'block';

  let joyActive = false;
  let joyCenter = { x: 0, y: 0 };
  let joyVec = { x: 0, y: 0 };

  function setKnob(x, y) {
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }

  joy.addEventListener('pointerdown', (e) => {
    joyActive = true;
    const r = joy.getBoundingClientRect();
    joyCenter.x = r.left + r.width/2;
    joyCenter.y = r.top + r.height/2;
    joy.setPointerCapture(e.pointerId);
  });

  joy.addEventListener('pointermove', (e) => {
    if (!joyActive) return;
    const dx = e.clientX - joyCenter.x;
    const dy = e.clientY - joyCenter.y;
    const max = 45;
    const cx = clamp(dx, -max, max);
    const cy = clamp(dy, -max, max);
    setKnob(cx, cy);
    joyVec.x = cx / max;
    joyVec.y = cy / max;
  });

  joy.addEventListener('pointerup', () => {
    joyActive = false;
    joyVec.x = 0; joyVec.y = 0;
    setKnob(0,0);
  });

  // Keyboard fallback
  const keys = new Set();
  window.addEventListener('keydown', (e)=>keys.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e)=>keys.delete(e.key.toLowerCase()));

  // --- VR button ---
  document.body.appendChild(VRButton.createButton(renderer));
  btnEnterVR.onclick = async () => {
    log('[xr] press the VRButton (browser prompt)');
  };

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  log('Diagnostics mounted');
  log(`Android joystick ${isTouch ? 'visible' : 'hidden (desktop)'}`);
  log('World visible');

  // Start clean
  clearHand();

  // --- Main loop ---
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.033);

    // locomotion vector from joystick or keyboard
    // FIX: Forward/back is correct; strafe was reversed -> keep forward/back, invert ONLY X back to normal
    let moveX = joyVec.x;     // ✅ left/right fixed
    let moveZ = joyVec.y;     // ✅ forward/back correct

    if (keys.has('w')) moveZ += 1;
    if (keys.has('s')) moveZ -= 1;
    if (keys.has('a')) moveX -= 1;
    if (keys.has('d')) moveX += 1;

    const moveLen = Math.hypot(moveX, moveZ);
    if (moveLen > 0.01) {
      moveX /= Math.max(1, moveLen);
      moveZ /= Math.max(1, moveLen);

      // move relative to camera facing (Y-only)
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();

      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0,1,0)).normalize().multiplyScalar(-1);

      const speed = 3.0; // m/s
      rig.position.addScaledVector(forward, moveZ * speed * dt);
      rig.position.addScaledVector(right,   moveX * speed * dt);

      // keep within circular room bounds
      const r = Math.hypot(rig.position.x, rig.position.z);
      const limit = ROOM_R - 0.9;
      if (r > limit) {
        const s = limit / r;
        rig.position.x *= s;
        rig.position.z *= s;
      }
    }

    // doors slide animation (tangent slide)
    for (const d of [doorA, doorB, doorC]) {
      const theta = d.userData.theta;
      const open = d.userData.open;
      const target = open ? 1.0 : 0.0;
      d.userData.slide = THREE.MathUtils.lerp(d.userData.slide, target, 0.10);

      // tangent direction around circle
      const tx = Math.cos(theta);
      const tz = -Math.sin(theta);

      // base position on wall
      const baseX = Math.sin(theta) * (ROOM_R - 0.12);
      const baseZ = Math.cos(theta) * (ROOM_R - 0.12);

      d.position.x = baseX + tx * (1.2 * d.userData.slide);
      d.position.z = baseZ + tz * (1.2 * d.userData.slide);
      d.lookAt(0, 1.8, 0);
    }

    // bots idle animation
    if (botsEnabled) {
      for (const b of bots) {
        b.userData.idlePhase += dt * 1.2;
        b.position.y = 0.02 * Math.sin(b.userData.idlePhase * 2.0);
        b.rotation.y += 0.0015 * Math.sin(b.userData.idlePhase);
      }
    }

    // Hole card hover + face camera
    for (const hc of pokerState.holeCards) {
      const m = hc.mesh;
      if (!m.visible) continue;
      m.userData.hoverPhase += dt * 2.0;
      m.position.y = 0.72 + 0.02 * Math.sin(m.userData.hoverPhase);
      m.lookAt(camera.position);
      m.rotateY(Math.PI);
    }

    // Community cards face camera (if visible) + slight hover
    for (const c of pokerState.community) {
      if (!c.visible) continue;
      c.userData.hoverPhase += dt * 2.2;
      c.position.y = 0.72 + 0.02 * Math.sin(c.userData.hoverPhase);
      c.lookAt(camera.position);
      c.rotateY(Math.PI);
    }

    // neon pulse
    const pulse = (Math.sin(performance.now()*0.0012)*0.5+0.5);
    ringMat.emissiveIntensity = 0.7 + 0.7*pulse;

    // jumbotron updates
    for (const j of jumboAnim) {
      j.state.t += dt;
      j.draw();
    }

    renderer.render(scene, camera);
  });
}
