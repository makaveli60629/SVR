/**
 * SCARLETTVR POKER — SCARLETT1 (PERMANENT)
 * Single spine module: bright sealed lobby + doors + pads + table + cards + bots + wrist HUD + radio + joystick locomotion.
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js';

export const Scarlett1 = {
  start
};

function start() {
  const hud = document.getElementById('hud');

  const log = (...args) => {
    const t = ((performance.now()/1000).toFixed(3)).padStart(7,' ');
    const line = `[${t}] ${args.join(' ')}`;
    console.log(line);
    hud.textContent = (hud.textContent + "\n" + line).slice(-1400);
  };

  // --- renderer / scene / camera ---
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.xr.enabled = true;
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

  // --- sealed lobby room (walls/ceiling/floor) ---
  const room = new THREE.Group();
  scene.add(room);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.95, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI/2;
  floor.position.y = 0;
  room.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(24, 24),
    new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 1, metalness: 0 })
  );
  ceiling.rotation.x = Math.PI/2;
  ceiling.position.y = 6;
  room.add(ceiling);

  const wallMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.9, metalness: 0.1 });
  const mkWall = (w,h, x,y,z, ry=0) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), wallMat);
    m.position.set(x,y,z);
    m.rotation.y = ry;
    room.add(m);
    return m;
  };
  mkWall(24, 6, 0, 3, -12, 0);
  mkWall(24, 6, 0, 3,  12, Math.PI);
  mkWall(24, 6, -12, 3, 0, Math.PI/2);
  mkWall(24, 6,  12, 3, 0, -Math.PI/2);

  const grid = new THREE.GridHelper(24, 24, 0x3355ff, 0x0b1220);
  grid.position.y = 0.01;
  room.add(grid);

  // --- Doors (entrances) ---
  const doors = new THREE.Group();
  room.add(doors);

  const doorMat = new THREE.MeshStandardMaterial({ color: 0x1a2a55, roughness: 0.6, metalness: 0.4, emissive: new THREE.Color(0x0a1435), emissiveIntensity: 0.6 });
  function makeDoor(x,z, ry, label) {
    const g = new THREE.Group();
    const panel = new THREE.Mesh(new THREE.BoxGeometry(2.4, 3.6, 0.15), doorMat);
    panel.position.set(0, 1.8, 0);
    panel.userData = { type: 'door', label, open: false };
    g.add(panel);

    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.8, 0.2), new THREE.MeshStandardMaterial({ color: 0x05070f, roughness: 1 }));
    frame.position.set(0, 1.9, -0.08);
    g.add(frame);

    g.position.set(x, 0, z);
    g.rotation.y = ry;
    doors.add(g);
    return panel;
  }
  const doorA = makeDoor(0, -11.85, 0, 'Main Entrance');
  const doorB = makeDoor(-11.85, 0, Math.PI/2, 'Side Entrance');
  const doorC = makeDoor(11.85, 0, -Math.PI/2, 'VIP Entrance');

  // --- Interaction pads ---
  const pads = new THREE.Group();
  room.add(pads);

  const padMat = new THREE.MeshStandardMaterial({ color: 0x1230aa, roughness: 0.4, metalness: 0.6, emissive: new THREE.Color(0x1a3cff), emissiveIntensity: 1.2 });
  function makePad(x,z, label, onTrigger) {
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32), padMat);
    pad.position.set(x, 0.04, z);
    pad.userData = { type: 'pad', label, onTrigger };
    pads.add(pad);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.03, 12, 64), new THREE.MeshStandardMaterial({
      color: 0x6aa0ff, roughness: 0.2, metalness: 0.8, emissive: new THREE.Color(0x3355ff), emissiveIntensity: 0.7
    }));
    ring.rotation.x = Math.PI/2;
    ring.position.set(x, 0.08, z);
    pads.add(ring);

    return pad;
  }

  // --- Poker table area ---
  const poker = new THREE.Group();
  poker.position.set(0, 0, 0);
  room.add(poker);

  // Table base
  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.2, 0.35, 48),
    new THREE.MeshStandardMaterial({ color: 0x131b2f, roughness: 0.8, metalness: 0.15 })
  );
  table.position.set(0, 0.35/2, 0);
  poker.add(table);

  // Felt top
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2.0, 2.0, 0.08, 48),
    new THREE.MeshStandardMaterial({ color: 0x0a3a2a, roughness: 1.0, metalness: 0.0, emissive: new THREE.Color(0x02140e), emissiveIntensity: 0.2 })
  );
  felt.position.set(0, 0.35 + 0.06, 0);
  poker.add(felt);

  // Rail
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

  // --- Cards (hover + deal animation) ---
  const cardsGroup = new THREE.Group();
  poker.add(cardsGroup);

  const cardMat = new THREE.MeshStandardMaterial({
    color: 0xf2f2f2, roughness: 0.8, metalness: 0.0,
    emissive: new THREE.Color(0x0a0a0a), emissiveIntensity: 0.15
  });

  const cards = [];
  for (let i=0;i<5;i++){
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.78), cardMat);
    card.rotation.x = -Math.PI/2;
    card.position.set((i-2)*0.62, 0.70, 0);
    card.userData = { type:'card', idx:i, hoverPhase: Math.random()*Math.PI*2 };
    cardsGroup.add(card);
    cards.push(card);
  }

  // --- Pads actions ---
  let padsEnabled = true;
  let botsEnabled = true;

  const padBright = makePad(-4.5, -3.5, "Max Bright", () => setMaxBright(true));
  const padDeal   = makePad(-3.2, -3.5, "Deal Cards", () => dealCards());
  const padReset  = makePad(-1.9, -3.5, "Reset Spawn", () => resetSpawn());
  const padDoor   = makePad( 1.9, -3.5, "Toggle Doors", () => toggleDoors());
  const padMusic  = makePad( 3.2, -3.5, "Music Toggle", () => toggleMusic());
  const padBots   = makePad( 4.5, -3.5, "Bots Toggle", () => toggleBots());

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

  window.addEventListener('pointerdown', (ev) => { pointerDown = true; });
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
  btnDeal.onclick   = () => dealCards();
  btnMusic.onclick  = () => toggleMusic();
  btnBots.onclick   = () => toggleBots();
  btnPads.onclick   = () => { padsEnabled = !padsEnabled; btnPads.textContent = `Pads: ${padsEnabled?'ON':'OFF'}`; };

  // --- Radio system (safe examples + expandable) ---
  // NOTE: These are examples. You can replace/add your own station URLs anytime.
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
      if (!url) { btnMusic.textContent = 'Music: ON'; musicOn = true; btnMusic.textContent = 'Music: ON'; }
      if (url) playMusic(url);
      else { musicOn = true; btnMusic.textContent = 'Music: ON'; }
    }
  }

  // --- Doors logic ---
  function toggleDoor(doorMesh) {
    doorMesh.userData.open = !doorMesh.userData.open;
    // slide door sideways when open
    const open = doorMesh.userData.open;
    doorMesh.position.x = open ? 1.4 : 0;
    doorMesh.material.emissiveIntensity = open ? 1.8 : 0.6;
  }
  function toggleDoors() {
    [doorA, doorB, doorC].forEach(toggleDoor);
  }

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

  // --- Deal animation ---
  let dealing = false;
  let dealT = 0;

  function dealCards() {
    dealing = true;
    dealT = 0;
    // start stacked at dealer spot
    cards.forEach((c, i) => {
      c.position.set(0, 0.78 + i*0.002, -0.6);
      c.rotation.z = (Math.random()-0.5)*0.6;
    });
    log('[cards] dealing…');
  }

  // --- Bots toggle ---
  function toggleBots() {
    botsEnabled = !botsEnabled;
    botsGroup.visible = botsEnabled;
    btnBots.textContent = `Bots: ${botsEnabled?'ON':'OFF'}`;
    log(`[bots] ${botsEnabled?'ON':'OFF'}`);
  }

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
    // VRButton handles session; we just nudge UX
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

  // --- Main loop ---
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.033);

    // locomotion vector from joystick or keyboard
    let moveX = joyVec.x;
    let moveZ = -joyVec.y;

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

      // keep within room bounds
      rig.position.x = clamp(rig.position.x, -10.5, 10.5);
      rig.position.z = clamp(rig.position.z, -10.5, 10.5);
    }

    // bots idle animation (simple breathing + head bob)
    if (botsEnabled) {
      for (const b of bots) {
        const p = b.userData.idlePhase;
        b.userData.idlePhase += dt * 1.2;
        b.position.y = 0.02 * Math.sin(b.userData.idlePhase * 2.0);
        b.rotation.y += 0.0015 * Math.sin(b.userData.idlePhase + p);
      }
    }

    // card hover + deal animation
    for (const c of cards) {
      c.userData.hoverPhase += dt * 2.2;
      if (!dealing) {
        c.position.y = 0.70 + 0.03 * Math.sin(c.userData.hoverPhase);
      }
    }

    if (dealing) {
      dealT += dt;
      const t = Math.min(dealT / 1.2, 1);
      for (let i=0;i<cards.length;i++){
        const c = cards[i];
        const tx = (i-2)*0.62;
        const ty = 0.70;
        const tz = 0;

        // smooth slide
        c.position.x = THREE.MathUtils.lerp(c.position.x, tx, 0.10 + t*0.25);
        c.position.y = THREE.MathUtils.lerp(c.position.y, ty, 0.10 + t*0.25);
        c.position.z = THREE.MathUtils.lerp(c.position.z, tz, 0.10 + t*0.25);

        c.rotation.z = THREE.MathUtils.lerp(c.rotation.z, 0, 0.08);
      }
      if (t >= 1) {
        dealing = false;
        log('[cards] dealt ✅');
      }
    }

    renderer.render(scene, camera);
  });
                                    }
