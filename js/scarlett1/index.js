// UPDATE_9_12_DT_SINGLE_SOURCE
// UPDATE_9_11_CACHE_PURGE
/**
 * SCARLETTVR POKER — SCARLETT1 (PHASE 4: PRESENCE + PIT + INTERACTION SCAFFOLD)
 * - Circular sealed lobby (textured hooks)
 * - Jumbotrons (animated)
 * - Sunken pit "divot" under table
 * - Poker phases (Deal -> Flop -> Turn -> River)
 * - Seat snap-sit (tap seat) + stand
 * - Chip stacks (static now; grab hooks next phase)
 * - Correct joystick locomotion (final mapping)
 */

import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { VRButton } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/VRButton.js';
import { XRHandModelFactory } from 'https://unpkg.com/three@0.160.0/examples/jsm/webxr/XRHandModelFactory.js';

export const Scarlett1 = { start };

function start() {
  try {
    const hud = document.getElementById('hud');
    const hint = document.getElementById('hint');

    // ===== Update 9.3: Entry Recovery + Diagnostics (no guessing) =====
    const diag = {
      statusEl: document.getElementById('diagStatus'),
      logEl: document.getElementById('diagLog'),
      btnCopy: document.getElementById('btnCopyReport'),
      btnToggle: document.getElementById('btnToggleDiag'),
      lines: [],
      hidden: false
    };

    function diagSetStatus(s) {
      if (diag.statusEl) diag.statusEl.textContent = s;
    }

    function diagWrite(line) {
      try {
        diag.lines.push(line);
        if (diag.lines.length > 260) diag.lines.shift();
        if (diag.logEl) diag.logEl.textContent = diag.lines.join('\n');
      } catch {}
    }

    // Wire diag buttons (safe even if clipboard blocked)
    if (diag.btnToggle) diag.btnToggle.onclick = () => {
      diag.hidden = !diag.hidden;
      if (diag.logEl) diag.logEl.style.display = diag.hidden ? 'none' : 'block';
      diag.btnToggle.textContent = diag.hidden ? 'Show' : 'Hide';
    };
    if (diag.btnCopy) diag.btnCopy.onclick = async () => {
      const report = diag.lines.join('\n');
      try { await navigator.clipboard.writeText(report); } catch {}
      diagWrite('[diag] copied report');
    };

    // Catch uncaught errors early (before anything else)
    window.addEventListener('error', (ev) => {
      const msg = ev?.message || 'unknown error';
      diagWrite('[ERROR] ' + msg);
      if (ev?.error?.stack) diagWrite(ev.error.stack);
      diagSetStatus('ERROR');
      if (hud) hud.textContent = 'BOOT ERROR: ' + msg;
    });
    window.addEventListener('unhandledrejection', (ev) => {
      const msg = ev?.reason?.message || String(ev?.reason);
      diagWrite('[REJECT] ' + msg);
      if (ev?.reason?.stack) diagWrite(ev.reason.stack);
      diagSetStatus('REJECT');
      if (hud) hud.textContent = 'BOOT REJECT: ' + msg;
    });

    // Log helper (writes to HUD + DIAG)
    const log = (...args) => {
      const t = ((performance.now()/1000).toFixed(3)).padStart(7,' ');
      const line = `[${t}] ${args.join(' ')}`;
      console.log(line);
      if (hud) hud.textContent = (hud.textContent + "\n" + line).slice(-2200);
      diagWrite(line);
    };

    // Entry proof
    if (hud) hud.textContent = 'booting…';
    diagWrite('(starting…)');
    log('[boot] entry');
    diagSetStatus('booting');

    // Deadman timer: if still booting after 4s, show hint
    setTimeout(() => {
      if (diag.statusEl && (diag.statusEl.textContent || '').includes('boot')) {
        diagWrite('[hint] Still booting after 4s. Likely module/import error or path mismatch.');
      }
    }, 4000);

// Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.xr.enabled = true;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();

  // Soft sky sphere for contrast
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(120, 32, 32),
    new THREE.MeshBasicMaterial({ color: 0x0a1020, side: THREE.BackSide })
  );
  scene.add(sky);

  const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 300);
  camera.position.set(0, 1.7, 8);

  // Rig
  const rig = new THREE.Group();
  rig.position.set(0, 0.15, 7.5);
  rig.add(camera);
  scene.add(rig);

  // Lights
  const hemi = new THREE.HemisphereLight(0xffffff, 0x223366, 1.25);
  scene.add(hemi);

  const ambient = new THREE.AmbientLight(0xffffff, 0.85);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0xffffff, 2.35);
  key.position.set(6, 12, 6);
  scene.add(key);

  const fill = new THREE.DirectionalLight(0xffffff, 1.55);
  fill.position.set(-6, 10, -6);
  scene.add(fill);

  // Texture helpers (safe: fall back to colors if missing)
  const loader = new THREE.TextureLoader();
  function loadTex(url, {repeat=1, wrap=true} = {}) {
    return new Promise((resolve) => {
      loader.load(url, (t) => {
        t.colorSpace = THREE.SRGBColorSpace;
        if (wrap) {
          t.wrapS = t.wrapT = THREE.RepeatWrapping;
          t.repeat.set(repeat, repeat);
        }
        resolve(t);
      }, undefined, () => resolve(null));
    });
  }

  // Room constants
  const ROOM_R = 24; // Update 8: lobby radius doubled
  const ROOM_H = 6;

  // Room group
  const room = new THREE.Group();
  scene.add(room);

  // ============================
  // PHASE 5: SPEAKER ANCHORS (JBL placeholders)
  // Drop-in ready: replace meshes with your JBL GLB later.
  // ============================
  const speakers = new THREE.Group();
  room.add(speakers);

  const spkMat = new THREE.MeshStandardMaterial({
    color: 0x0b0f1c, roughness: 0.7, metalness: 0.2,
    emissive: new THREE.Color(0x0b1230), emissiveIntensity: 0.25
  });

  function addSpeaker(theta, label) {
    const g = new THREE.Group();
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.55, 1.1, 0.45), spkMat);
    box.position.y = 0.55;
    g.add(box);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 10, 40),
      new THREE.MeshStandardMaterial({ color: 0x2a55ff, emissive: new THREE.Color(0x2a55ff), emissiveIntensity: 0.9, roughness: 0.3, metalness: 0.2 })
    );
    ring.position.set(0, 0.55, 0.24);
    g.add(ring);

    g.userData = { type: 'speaker', label };
    const x = Math.sin(theta) * (ROOM_R - 1.25);
    const z = Math.cos(theta) * (ROOM_R - 1.25);
    g.position.set(x, 0.0, z);
    g.lookAt(0, 0.7, 0);
    speakers.add(g);
  }

  addSpeaker(0, 'North Speaker');
  addSpeaker(Math.PI/2, 'East Speaker');
  addSpeaker(Math.PI, 'South Speaker');
  addSpeaker(Math.PI*1.5, 'West Speaker');


  // Neon ring material (pulse)
  const ringMat = new THREE.MeshStandardMaterial({
    color: 0x1730ff, roughness: 0.25, metalness: 0.75,
    emissive: new THREE.Color(0x2a55ff), emissiveIntensity: 0.9
  });

  // Build environment async textures
  (async () => {
    const floorTex = await loadTex('./assets/textures/floor.jpg', {repeat: 4});
    const wallTex  = await loadTex('./assets/textures/wall.jpg', {repeat: 3});
    const feltTex  = await loadTex('./assets/textures/felt.jpg', {repeat: 2});

    // Floor
    const floorMat = floorTex
      ? new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.95, metalness: 0.05 })
      : new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.95, metalness: 0.05 });

    const floor = new THREE.Mesh(new THREE.CircleGeometry(ROOM_R, 96), floorMat);
    floor.rotation.x = -Math.PI/2;
    floor.position.y = 0;
    room.add(floor);

    // Ceiling
    const ceiling = new THREE.Mesh(
      new THREE.CircleGeometry(ROOM_R, 96),
      new THREE.MeshStandardMaterial({ color: 0x070a12, roughness: 1, metalness: 0 })
    );
    ceiling.rotation.x = Math.PI/2;
    ceiling.position.y = ROOM_H;
    room.add(ceiling);

    // Cylindrical wall
    const wallMat = wallTex
      ? new THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.9, metalness: 0.12 })
      : new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.9, metalness: 0.12 });

    const wall = new THREE.Mesh(
      new THREE.CylinderGeometry(ROOM_R, ROOM_R, ROOM_H, 128, 1, true),
      wallMat
    );
    wall.position.y = ROOM_H/2;
    room.add(wall);

    // Neon rings
    const ring1 = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R-0.35, 0.06, 16, 160), ringMat);
    ring1.rotation.x = Math.PI/2;
    ring1.position.y = 0.08;
    room.add(ring1);

    const ring2 = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R-0.35, 0.06, 16, 160), ringMat);
    ring2.rotation.x = Math.PI/2;
    ring2.position.y = ROOM_H-0.08;
    room.add(ring2);

    // Update 8: Extra lobby props (columns + ceiling spot rings) for scale
    const cols = new THREE.Group();
    room.add(cols);
    const colMat = new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.85, metalness: 0.12 });
    const colGeo = new THREE.CylinderGeometry(0.35, 0.35, ROOM_H, 18);
    for (let i=0;i<16;i++){
      const a = (i/16)*Math.PI*2;
      const r = ROOM_R - 1.8;
      const c = new THREE.Mesh(colGeo, colMat);
      c.position.set(Math.sin(a)*r, ROOM_H/2, Math.cos(a)*r);
      cols.add(c);

      const cap = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 12, 48),
        new THREE.MeshStandardMaterial({ color: 0x2a55ff, emissive: new THREE.Color(0x2a55ff), emissiveIntensity: 0.7, roughness: 0.3, metalness: 0.2 })
      );
      cap.rotation.x = Math.PI/2;
      cap.position.set(c.position.x, ROOM_H-0.20, c.position.z);
      cols.add(cap);
    }


    // Update 9: Outer lounge props + extra ambient bots for density
    const lounge = new THREE.Group();
    room.add(lounge);

    const loungeMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.9, metalness: 0.1 });
    const railMat = new THREE.MeshStandardMaterial({ color: 0x101830, roughness: 0.55, metalness: 0.35, emissive: new THREE.Color(0x0b1230), emissiveIntensity: 0.25 });

    // Rail ring around inner walkway
    const rail = new THREE.Mesh(new THREE.TorusGeometry(ROOM_R-3.8, 0.08, 14, 220), railMat);
    rail.rotation.x = Math.PI/2;
    rail.position.y = 0.95;
    lounge.add(rail);

    // Lounge couches (simple capsules) + tables
    const couchGeo = new THREE.CapsuleGeometry(0.55, 1.2, 6, 12);
    const tableGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 20);
    const tableMat = new THREE.MeshStandardMaterial({ color: 0x0e1428, roughness: 0.8, metalness: 0.15 });

    for (let i=0;i<12;i++){
      const a = (i/12)*Math.PI*2;
      const r = ROOM_R - 5.6;
      const x = Math.sin(a)*r;
      const z = Math.cos(a)*r;

      const couch = new THREE.Mesh(couchGeo, loungeMat);
      couch.position.set(x, 0.55, z);
      couch.rotation.y = a + Math.PI/2;
      lounge.add(couch);

      const t = new THREE.Mesh(tableGeo, tableMat);
      t.position.set(x + Math.sin(a+Math.PI/2)*1.25, 0.22, z + Math.cos(a+Math.PI/2)*1.25);
      lounge.add(t);

      // tiny lamp glow
      const lamp = new THREE.PointLight(0x88aaff, 0.7, 6);
      lamp.position.set(t.position.x, 1.15, t.position.z);
      lounge.add(lamp);
    }

    // Ambient perimeter bots (slow walkers)
    const ambientBots = new THREE.Group();
    room.add(ambientBots);

    const ambMatA = new THREE.MeshStandardMaterial({ color: 0x2a68ff, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(0x0b1a44), emissiveIntensity: 0.55 });
    const ambMatB = new THREE.MeshStandardMaterial({ color: 0xff2a7a, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(0x440b22), emissiveIntensity: 0.55 });

    const amb = [];
    for (let i=0;i<18;i++){
      const g = new THREE.Group();
      const mat = (i%2===0)?ambMatA:ambMatB;
      const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.55, 6, 12), mat);
      body.position.y = 0.9;
      g.add(body);
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 16, 16), mat);
      head.position.y = 1.45;
      g.add(head);

      const a = Math.random()*Math.PI*2;
      const r = ROOM_R - 2.4;
      g.position.set(Math.sin(a)*r, 0.0, Math.cos(a)*r);
      g.userData = { a, r, dir: (Math.random()<0.5?-1:1), speed: 0.12 + Math.random()*0.12 };
      ambientBots.add(g);
      window.ScarlettAttach(amb, g);
    }


    // Pit / divot (Phase 4)
    // Outer lip ring
    const pitLip = new THREE.Mesh(
      new THREE.TorusGeometry(5.2, 0.18, 18, 120),
      new THREE.MeshStandardMaterial({
        color: 0x101830, roughness: 0.7, metalness: 0.25,
        emissive: new THREE.Color(0x0b1230), emissiveIntensity: 0.25
      })
    );
    pitLip.rotation.x = Math.PI/2;
    pitLip.position.y = 0.06;
    room.add(pitLip);

    // Sunken floor disk
    const pitMat = floorTex
      ? new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.98, metalness: 0.02 })
      : new THREE.MeshStandardMaterial({ color: 0x08101f, roughness: 0.98, metalness: 0.02 });

    const pitFloor = new THREE.Mesh(new THREE.CircleGeometry(5.0, 96), pitMat);
    pitFloor.rotation.x = -Math.PI/2;
    pitFloor.position.y = -1.35; // Update 6: deeper pit floor
    room.add(pitFloor);

    // Pit walls (short cylinder)
    const pitWall = new THREE.Mesh(
      new THREE.CylinderGeometry(5.0, 5.0, 2.2, 128, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x0a0f1e, roughness: 0.9, metalness: 0.15 })
    );
    pitWall.position.y = -0.25; // Update 6: align with deeper pit
    room.add(pitWall);

    // Stairs/ramp hint (simple wedge)
    const ramp = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 1.2, 3.2),
      new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.95, metalness: 0.05 })
    );
    ramp.position.set(0, -0.65, 5.4); // Update 6: deeper ramp
    ramp.rotation.x = -0.25;
    room.add(ramp);

    // Update 6: Stair ring (simple steps) around the pit for a stronger "dug out" feeling
    const stairs = new THREE.Group();
    room.add(stairs);
    const stepMat = new THREE.MeshStandardMaterial({ color: 0x0b1220, roughness: 0.95, metalness: 0.05 });
    const stepGeo = new THREE.BoxGeometry(0.9, 0.18, 0.55);

    // 16 steps on the south arc (closest to spawn), tapering down
    const steps = 16;
    const arcStart = Math.PI * 0.70;
    const arcEnd   = Math.PI * 1.30;
    for (let i=0;i<steps;i++){
      const t = i/(steps-1);
      const theta = arcStart + (arcEnd-arcStart)*t;
      const radius = 5.05 + 0.15*Math.sin(t*Math.PI);
      const x = Math.sin(theta)*radius;
      const z = Math.cos(theta)*radius;

      const step = new THREE.Mesh(stepGeo, stepMat);
      // Height descends into pit
      step.position.set(x, -0.10 - t*0.95, z);
      step.lookAt(0, step.position.y, 0);
      step.rotateY(Math.PI);
      stairs.add(step);
    }

    // Poker table area centered in pit
    buildPoker(feltTex);

    log('Phase 4 world built ✅');
  })();

  // Groups we'll fill after buildPoker runs
  const interactables = [];
  const seats = [];
  const bots = [];
  let botsGroup = null;
  let padsGroup = null;

  // Poker state
  const pokerState = {
    stage: 0,
    holeCards: [],
    community: [],
    chips: [],
    seated: false,
    seatedSeatIndex: -1
  };

  // Build poker + bots + pads + jumbotrons
  function buildPoker(feltTex) {
  // UPDATE_9_12_DT_SINGLE_SOURCE
  var _dt = __scarlettDT();

  // Update 9.10: avoid TDZ by using local _dt
  var _dt = (typeof window !== 'undefined' && __scarlettDT()) ? __scarlettDT() : 0.016;

  var _dt = (arguments[0] && arguments[0]._dt) || (__scarlettDT()||0.016);
    // Poker group at pit depth
    const poker = new THREE.Group();
    poker.position.set(0, -1.35, 0); // Update 6: deeper pit
    room.add(poker);

    // Table pedestal
    const table = new THREE.Mesh(
      new THREE.CylinderGeometry(2.25, 2.25, 0.38, 64),
      new THREE.MeshStandardMaterial({ color: 0x121a2f, roughness: 0.8, metalness: 0.15 })
    );
    table.position.set(0, 0.19, 0);
    poker.add(table);

    // Felt top
    const feltMat = feltTex
      ? new THREE.MeshStandardMaterial({ map: feltTex, roughness: 1.0, metalness: 0.0, emissive: new THREE.Color(0x02140e), emissiveIntensity: 0.22 })
      : new THREE.MeshStandardMaterial({ color: 0x0a3a2a, roughness: 1.0, metalness: 0.0, emissive: new THREE.Color(0x02140e), emissiveIntensity: 0.22 });

    const felt = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 0.09, 64), feltMat);
    felt.position.set(0, 0.43, 0);
    poker.add(felt);

    // Rail (glow)
    const rail = new THREE.Mesh(
      new THREE.TorusGeometry(2.10, 0.13, 18, 160),
      new THREE.MeshStandardMaterial({ color: 0x121a2f, roughness: 0.7, metalness: 0.25, emissive: new THREE.Color(0x0b1230), emissiveIntensity: 0.18 })
    );
    rail.rotation.x = Math.PI/2;
    rail.position.set(0, 0.56, 0);
    poker.add(rail);

    // Under-rail light ring
    const under = new THREE.Mesh(
      new THREE.TorusGeometry(2.10, 0.03, 12, 160),
      new THREE.MeshStandardMaterial({ color: 0x2a55ff, roughness: 0.25, metalness: 0.2, emissive: new THREE.Color(0x2a55ff), emissiveIntensity: 1.0 })
    );
    under.rotation.x = Math.PI/2;
    under.position.set(0, 0.40, 0);
    poker.add(under);

    // Seats + bots
    botsGroup = new THREE.Group();
    poker.add(botsGroup);

    const chairMat = new THREE.MeshStandardMaterial({ color: 0x0e1428, roughness: 0.95, metalness: 0.08 });
    const botA = new THREE.MeshStandardMaterial({ color: 0x2a68ff, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(0x0b1a44), emissiveIntensity: 0.6 });
    const botB = new THREE.MeshStandardMaterial({ color: 0xff2a7a, roughness: 0.6, metalness: 0.2, emissive: new THREE.Color(0x440b22), emissiveIntensity: 0.6 });

    for (let i=0;i<8;i++){
      const a = (i/8)*Math.PI*2;
      const r = 3.5;
      const x = Math.sin(a)*r;
      const z = Math.cos(a)*r;

      // Seat base marker (tap to sit)
      const seat = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 24), chairMat);
      seat.position.set(x, 0.06, z);
      seat.userData = { type:'seat', seatIndex:i };
      poker.add(seat);
      seats.push(seat);
      interactables.push(seat);

      // Backrest
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.15), chairMat);
      back.position.set(x, 0.55, z);
      back.rotation.y = a + Math.PI;
      back.translateZ(-0.35);
      poker.add(back);

      // Bot improved proportions
      const bot = new THREE.Group();
      const mat = (i%2===0)?botA:botB;

      const hips = new THREE.Mesh(new THREE.CapsuleGeometry(0.18, 0.25, 6, 10), mat);
      hips.position.y = 0.40;
      bot.add(hips);

      const torso = new THREE.Mesh(new THREE.CapsuleGeometry(0.22, 0.55, 7, 12), mat);
      torso.position.y = 0.95;
      bot.add(torso);

      const shoulders = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.08, 4, 10), mat);
      shoulders.position.y = 1.25;
      shoulders.rotation.z = Math.PI/2;
      bot.add(shoulders);

      const head = new THREE.Mesh(new THREE.SphereGeometry(0.18, 18, 18), mat);
      head.position.y = 1.55;
      bot.add(head);

      // Simple arms (placeholders)
      const armGeo = new THREE.CapsuleGeometry(0.07, 0.35, 5, 10);
      const armL = new THREE.Mesh(armGeo, mat); armL.position.set(-0.35, 1.15, 0.05); armL.rotation.z = 0.15;
      const armR = new THREE.Mesh(armGeo, mat); armR.position.set( 0.35, 1.15, 0.05); armR.rotation.z = -0.15;
      bot.add(armL); bot.add(armR);

      bot.position.set(x, 0, z);
      bot.rotation.y = a + Math.PI;
      bot.userData = { seatIndex:i, idle: Math.random()*Math.PI*2, look: 0 };
      botsGroup.add(bot);
      bots.push(bot);
    }

    // Cards
    const cardsGroup = new THREE.Group();
    poker.add(cardsGroup);

    const cardMat = new THREE.MeshStandardMaterial({
      color: 0xf2f2f2,
      roughness: 0.8,
      metalness: 0.0,
      emissive: new THREE.Color(0x0a0a0a),
      emissiveIntensity: 0.15,
      side: THREE.DoubleSide
    });

    pokerState.community = [];
    for (let i=0;i<5;i++){
      const c = new THREE.Mesh(new THREE.PlaneGeometry(0.55, 0.78), cardMat);
      c.visible = false;
      c.userData = { type:'card', idx:i, hoverPhase: Math.random()*Math.PI*2 };
      c.position.set((i-2)*0.62, 0.72, 0);
      c.rotation.x = -Math.PI/2;
      cardsGroup.add(c);
      pokerState.community.push(c);
      interactables.push(c);
    }

    // Hole cards spawn on demand
    function spawnHoleCards() {
      const holeMat = cardMat.clone();
      holeMat.side = THREE.DoubleSide;

      for (let seatIndex=0; seatIndex<8; seatIndex++){
        const seat = seats[seatIndex];
        const basePos = new THREE.Vector3().copy(seat.position);
        const dir = basePos.clone().multiplyScalar(-1).normalize();

        for (let j=0;j<2;j++){
          const m = new THREE.Mesh(new THREE.PlaneGeometry(0.45, 0.65), holeMat);
          const p = basePos.clone().add(dir.clone().multiplyScalar(0.95));
          p.y = 0.72;
          p.x += (j===0?-0.18:0.18);
          m.position.copy(p);
          m.visible = false;
          m.userData = { type:'hole', seatIndex, j, hoverPhase: Math.random()*Math.PI*2 };
          cardsGroup.add(m);
          pokerState.holeCards.push({ mesh:m, seatIndex });
          interactables.push(m);
        }
      }
    }

    // Update 7: Hand pinch/grab
    updatePinch(0, _dt);
    updatePinch(1, _dt);

    function clearHand() {
      for (const hc of pokerState.holeCards) cardsGroup.remove(hc.mesh);
      pokerState.holeCards.length = 0;
      for (const c of pokerState.community) { c.visible=false; }
      pokerState.stage = 0;
      log('[poker] reset');
    }

    function dealHole() {
      if (pokerState.holeCards.length===0) spawnHoleCards();
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
    function dealHand() {
      clearHand();
      dealHole();
      log('[cards] full hand ready (Flop/Turn/River)');
    }

    // Chips (static stacks)
    const chipMatA = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 0.1 });
    const chipMatB = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.5, metalness: 0.1 });
    const chipGeo = new THREE.CylinderGeometry(0.11, 0.11, 0.03, 20);

    function makeStack(x,z, n=10) {
      const g = new THREE.Group();
      for (let i=0;i<n;i++){
        const m = new THREE.Mesh(chipGeo, (i%2===0)?chipMatA:chipMatB);
        m.position.y = 0.55 + i*0.032;
        g.add(m);
      }
      g.position.set(x, 0, z);
      g.userData = { type:'chips' };
      poker.add(g);
      pokerState.chips.push(g);
      interactables.push(g);
    }
    // 8 stacks near each seat
    for (let i=0;i<8;i++){
      const a = (i/8)*Math.PI*2;
      const r = 2.9;
      makeStack(Math.sin(a)*r, Math.cos(a)*r, 10);
    }

    // Pads arc inside pit
    padsGroup = new THREE.Group();
    poker.add(padsGroup);

    const padMat = new THREE.MeshStandardMaterial({
      color: 0x1230aa, roughness: 0.4, metalness: 0.6,
      emissive: new THREE.Color(0x1a3cff), emissiveIntensity: 1.2
    });

    function makePadPolar(r, theta, label, onTrigger) {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 32), padMat);
      pad.position.set(Math.sin(theta)*r, 0.04, Math.cos(theta)*r);
      pad.userData = { type:'pad', label, onTrigger };
      padsGroup.add(pad);
      interactables.push(pad);

      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.62, 0.03, 12, 64),
        new THREE.MeshStandardMaterial({ color: 0x6aa0ff, roughness: 0.2, metalness: 0.8, emissive: new THREE.Color(0x3355ff), emissiveIntensity: 0.7 })
      );
      ring.rotation.x = Math.PI/2;
      ring.position.copy(pad.position).add(new THREE.Vector3(0, 0.04, 0));
      padsGroup.add(ring);
      return pad;
    }

    const baseTheta = Math.PI; // towards south
    const step = 0.22;
    makePadPolar(4.8, baseTheta + step*2, "Deal Hand", () => dealHand());
    makePadPolar(4.8, baseTheta + step*1, "Flop", () => flop());
    makePadPolar(4.8, baseTheta + step*0, "Turn", () => turn());
    makePadPolar(4.8, baseTheta - step*1, "River", () => river());
    makePadPolar(4.8, baseTheta - step*2, "Reset Hand", () => clearHand());

    // Expose to wrist
    actions.dealHand = dealHand;
    actions.flop = flop;
    actions.turn = turn;
    actions.river = river;
    actions.resetHand = clearHand;

    clearHand();

    // Jumbotrons on outer ring (room level)
    buildJumbotrons();
  }

  // Jumbotron system
  const jumboAnim = [];
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
      ctx.fillStyle = '#060a16';
      ctx.fillRect(0,0,c.width,c.height);

      ctx.strokeStyle = 'rgba(90,140,255,0.85)';
      ctx.lineWidth = 8;
      ctx.strokeRect(10,10,c.width-20,c.height-20);

      ctx.fillStyle = 'rgba(220,235,255,0.95)';
      ctx.font = 'bold 34px system-ui, sans-serif';
      ctx.fillText('SCARLETT JUMBOTRON', 24, 58);

      ctx.fillStyle = 'rgba(120,180,255,0.95)';
      ctx.font = 'bold 28px system-ui, sans-serif';
      ctx.fillText(label, 24, 100);

      // status
      ctx.fillStyle = 'rgba(255,255,255,0.90)';
      ctx.font = '24px system-ui, sans-serif';
      const st = ['IDLE','HOLE','FLOP','TURN','RIVER'][Math.max(0, Math.min(4, pokerState.stage))];
      const seatTxt = pokerState.seated ? `SEATED: ${pokerState.seatedSeatIndex+1}` : 'STANDING';
      ctx.fillText(`POKER: ${st} • ${seatTxt}`, 24, 146);

      const now = new Date();
      const msg = `LIVE • ${now.toLocaleTimeString()} • Poker Night • Radio • VR •`;
      const x = 24 + ((state.t * 140) % (c.width + 600)) * -1;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.font = '24px system-ui, sans-serif';
      ctx.fillText(msg + ' ' + msg, x, 210);

      const p = (Math.sin(state.t*2.0)*0.5+0.5);
      ctx.fillStyle = `rgba(60,120,255,${0.25 + 0.35*p})`;
      ctx.fillRect(24, 168, (c.width-48)*p, 10);

      state.tex.needsUpdate = true;
    }
    return { state, draw };
  }

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

    room.add(g);
  }

  function buildJumbotrons() {
    addJumbotron(0, 'MAIN STAGE');
    addJumbotron(Math.PI/2, 'TABLE CAM');
    addJumbotron(Math.PI, 'TOURNAMENT');
    addJumbotron(Math.PI*1.5, 'VIP LOUNGE');
  }

  // Interaction: tap pads + doors + seats
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerDown = false;

  // ============================
  // PHASE 5: GRAB / PICKUP SCAFFOLD (Pointer now, Hands later)
  // - Tap grabbable (card/chips) to pick up
  // - Drag to move on a table plane
  // - Release to drop
  // ============================
  let grabbed = null;          // THREE.Object3D
  let grabbedParent = null;    // original parent
  let grabbedOffset = new THREE.Vector3();
  const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -(-1.35 + 0.72)); // Update 6 // y = pit + table height approx
  const dragPoint = new THREE.Vector3();
  const tmpVec3 = new THREE.Vector3();

  function isGrabbable(obj) {
    const t = obj?.userData?.type;
    return (t === 'card' || t === 'hole' || t === 'chips');
  }

  function tryGrab(ev) {
    if (!actions.padsEnabled) return false;
    setPointerFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);

    // Intersect deeply (groups included)
    const hits = raycaster.intersectObjects(interactables, true);
    if (!hits.length) return false;

    // Climb to first grabbable ancestor
    let o = hits[0].object;
    while (o && !isGrabbable(o)) o = o.parent;
    if (!o) return false;

    // Don't grab invisible cards
    if (o.visible === false) return false;

    grabbed = o;
    grabbedParent = o.parent;

    // Compute initial offset between hit point projected onto plane and object position
    const line = raycaster.ray;
    if (line.intersectPlane(dragPlane, dragPoint)) {
      grabbedOffset.copy(grabbed.position).sub(dragPoint);
    } else {
      grabbedOffset.set(0,0,0);
    }

    log(`[grab] ${grabbed.userData.type}`);
    return true;
  }

  function updateGrab(ev) {
    if (!grabbed) return;
    setPointerFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);

    const line = raycaster.ray;
    if (line.intersectPlane(dragPlane, dragPoint)) {
      tmpVec3.copy(dragPoint).add(grabbedOffset);
      // Keep chips slightly above table
      if (grabbed.userData.type === 'chips') tmpVec3.y = (-1.35) + 0.55; // Update 6
      // Keep cards at table height
      if (grabbed.userData.type === 'card' || grabbed.userData.type === 'hole') tmpVec3.y = (-1.35) + 0.72; // Update 6
      grabbed.position.copy(tmpVec3);
    }
  }

  function dropGrab() {
    if (!grabbed) return;
    log('[grab] drop');
    grabbed = null;
    grabbedParent = null;
  }


  function setPointerFromEvent(ev) {
    const x = (ev.clientX / window.innerWidth) * 2 - 1;
    const y = -(ev.clientY / window.innerHeight) * 2 + 1;
    pointer.set(x, y);
  }

  function doRayInteract(ev) {
    setPointerFromEvent(ev);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(interactables, true);
    if (hits.length === 0) return;
    const obj = hits[0].object;

    if (obj?.userData?.type === 'pad') {
      log(`[pad] ${obj.userData.label}`);
      obj.userData.onTrigger?.();
    } else if (obj?.userData?.type === 'seat') {
      snapSit(obj.userData.seatIndex);
    }
  }

  window.addEventListener('pointerdown', (ev) => {
    // 1) try grab first
    if (tryGrab(ev)) { pointerDown = true; return; }
    // 2) otherwise begin look-drag
    beginLook(ev);
    pointerDown = true;
  });
  window.addEventListener('pointermove', (ev) => {
    if (grabbed) updateGrab(ev);
    else updateLook(ev);
  });
  window.addEventListener('pointerup', (ev) => {
    if (!pointerDown) return;
    pointerDown = false;
    endLook();
    if (grabbed) { dropGrab(); return; }
    if (!actions.padsEnabled) return;
    doRayInteract(ev);
  });

  // Seat snap-sit (Phase 4)
  function snapSit(seatIndex) {
    if (!seats[seatIndex]) return;
    pokerState.seated = true;
    pokerState.seatedSeatIndex = seatIndex;

    // seat is in poker group at y=-1.05, so compute world position
    const target = new THREE.Vector3();
    seats[seatIndex].getWorldPosition(target);

    // move rig behind seat, facing table center
    const dir = target.clone().setY(0).normalize(); // away from center
    const sitPos = target.clone().add(dir.multiplyScalar(0.85));
    sitPos.y = 0.15; // rig base height

    rig.position.copy(sitPos);

    // face center
    const look = new THREE.Vector3(0, rig.position.y + 1.6, 0);
    rig.lookAt(look);

    if (hint) hint.textContent = `Seated at ${seatIndex+1}. Tap a different seat to move. (Stand: Reset Spawn)`;
    log(`[seat] seated ${seatIndex+1}`);
  }

  // Wrist + toggles
  const actions = {
    padsEnabled: true,
    botsEnabled: true,
    seatLock: true,

    dealHand: null,
    flop: null,
    turn: null,
    river: null,
    resetHand: null,
  };

  const btnEnterVR = document.getElementById('btnEnterVR');
  const btnReset   = document.getElementById('btnReset');
  const btnBright  = document.getElementById('btnBright');
  const btnDeal    = document.getElementById('btnDeal');
  const btnMusic   = document.getElementById('btnMusic');
  const btnBots    = document.getElementById('btnBots');
  const btnPads    = document.getElementById('btnPads');
  const btnHide    = document.getElementById('btnHide');
  const btnShow    = document.getElementById('btnShow');
  const btnShowOverlay = document.getElementById('btnShowOverlay');
  const showOverlay = document.getElementById('showOverlay');
  const stationSel = document.getElementById('station');

  btnReset.onclick  = () => resetSpawn();
  btnBright.onclick = () => setMaxBright(true);
  btnDeal.onclick   = () => actions.dealHand?.();

  // Phase buttons injected
  const wrist = document.getElementById('wrist');
  const row1 = document.createElement('div'); row1.className='row'; row1.style.marginTop='8px';
  const bFlop = document.createElement('button'); bFlop.textContent='Flop'; bFlop.onclick=()=>actions.flop?.();
  const bTurn = document.createElement('button'); bTurn.textContent='Turn'; bTurn.onclick=()=>actions.turn?.();
  row1.appendChild(bFlop); row1.appendChild(bTurn); wrist.appendChild(row1);

  const row2 = document.createElement('div'); row2.className='row';
  const bRiver = document.createElement('button'); bRiver.textContent='River'; bRiver.onclick=()=>actions.river?.();
  const bResetHand = document.createElement('button'); bResetHand.textContent='Reset Hand'; bResetHand.onclick=()=>actions.resetHand?.();
  row2.appendChild(bRiver); row2.appendChild(bResetHand); wrist.appendChild(row2);

  btnBots.onclick = () => {
    actions.botsEnabled = !actions.botsEnabled;
    if (botsGroup) botsGroup.visible = actions.botsEnabled;
    btnBots.textContent = `Bots: ${actions.botsEnabled?'ON':'OFF'}`;
    log(`[bots] ${actions.botsEnabled?'ON':'OFF'}`);
  };

  btnPads.onclick = () => {
    actions.padsEnabled = !actions.padsEnabled;
    btnPads.textContent = `Pads: ${actions.padsEnabled?'ON':'OFF'}`;
    log(`[pads] ${actions.padsEnabled?'ON':'OFF'}`);
  };

  if (btnHide) btnHide.onclick = () => setUIVisible(false);
  if (btnShow) btnShow.onclick = () => setUIVisible(true);
  if (btnShowOverlay) btnShowOverlay.onclick = () => setUIVisible(true);

  // Seat lock toggle (when seated, you can lock movement for comfort)
  const rowSeat = document.createElement('div'); rowSeat.className='row';
  const btnSeatLock = document.createElement('button');
  btnSeatLock.textContent = `Seat Lock: ${actions.seatLock?'ON':'OFF'}`;
  btnSeatLock.onclick = () => {
    actions.seatLock = !actions.seatLock;
    btnSeatLock.textContent = `Seat Lock: ${actions.seatLock?'ON':'OFF'}`;
    log(`[seatLock] ${actions.seatLock?'ON':'OFF'}`);
  };
  rowSeat.appendChild(btnSeatLock);
  wrist.appendChild(rowSeat);


  // Radio system (safe examples)
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
  stationSel.onchange = () => { if (musicOn) toggleMusic(), toggleMusic(); };

  // Brightness
  function setMaxBright(on) {
    ambient.intensity = on ? 1.35 : 0.85;
    hemi.intensity = on ? 1.8 : 1.25;
    key.intensity = on ? 3.1 : 2.35;
    fill.intensity = on ? 2.2 : 1.55;
    sky.material.color.setHex(on ? 0x0d1530 : 0x0a1020);
    log(`[lights] maxBright=${on}`);
  }

  // Spawn reset also stands you up
  const spawn = new THREE.Vector3(0, 0.15, 7.5);
  function resetSpawn() {
    rig.position.copy(spawn);
    rig.rotation.set(0,0,0);
    pokerState.seated = false;
    pokerState.seatedSeatIndex = -1;
    if (hint) hint.textContent = `Tip: Walk to a seat and tap it to snap-sit. Tap pads to trigger actions.`;
    log('[spawn] reset');
  }

  
  // UI hide/show (Phase 5.2)
  const ui = {
    visible: true,
    hudEl: document.getElementById('hud'),
    wristEl: document.getElementById('wrist'),
    joyEl: null,
    hintEl: document.getElementById('hint')
  };
  function setUIVisible(on) {
    ui.visible = on;
    if (ui.hudEl) ui.hudEl.style.display = on ? '' : 'none';
    if (ui.wristEl) ui.wristEl.style.display = on ? '' : 'none';
    if (ui.hintEl) ui.hintEl.style.display = on ? '' : 'none';
    // IMPORTANT: joysticks stay visible for control at all times
    if (showOverlay) showOverlay.style.display = on ? 'none' : '';
    log(`[ui] ${on ? 'shown' : 'hidden (controls remain)'}`);
  }


  // Update 9.1: boot HUD clear + hard reset
  const boot = { cleared: false };
  function clearBootHUD() {
    const hud = document.getElementById('hud');
    if (hud) hud.style.display = 'none'; // keep diag visible
    boot.cleared = true;
    log('[boot] hud cleared');
  }
  function hardReset() {
    try { localStorage.clear(); } catch {}
    try { sessionStorage.clear(); } catch {}
    location.reload(true);
  }

// Android joystick locomotion (FINAL mapping)
  const joy = document.getElementById('joystick');
  const knob = document.getElementById('joyKnob');
  const joyR = document.getElementById('joystickR');
  const knobR = document.getElementById('joyKnobR');
  const isTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
  if (isTouch) { joy.style.display = 'block'; if (joyR) joyR.style.display = 'block'; }

  let joyActive = false;
  let joyCenter = { x: 0, y: 0 };
  let joyVec = { x: 0, y: 0 };

  // Right joystick (look)
  let joyActiveR = false;
  let joyCenterR = { x: 0, y: 0 };
  let joyVecR = { x: 0, y: 0 };

  function setKnob(x, y) {
    knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }
  function setKnobR(x, y) {
    if (!knobR) return;
    knobR.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
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


  if (joyR) {
    joyR.addEventListener('pointerdown', (e) => {
      joyActiveR = true;
      const r = joyR.getBoundingClientRect();
      joyCenterR.x = r.left + r.width/2;
      joyCenterR.y = r.top + r.height/2;
      joyR.setPointerCapture(e.pointerId);
    });

    joyR.addEventListener('pointermove', (e) => {
      if (!joyActiveR) return;
      const dx = e.clientX - joyCenterR.x;
      const dy = e.clientY - joyCenterR.y;
      const max = 45;
      const cx = clamp(dx, -max, max);
      const cy = clamp(dy, -max, max);
      setKnobR(cx, cy);
      joyVecR.x = cx / max;
      joyVecR.y = cy / max;
    });

    joyR.addEventListener('pointerup', () => {
      joyActiveR = false;
      joyVecR.x = 0; joyVecR.y = 0;
      setKnobR(0,0);
    });
  }



  // ============================
  // Phase 5.2: Finger Look (Yaw)
  // Drag on screen to look left/right.
  // - Doesn't interfere with joystick area
  // - Doesn't interfere with grabs (cards/chips)
  // ============================
  let lookActive = false;
  let lookLastX = 0;
  const LOOK_SENS = 0.006; // radians per pixel (tuned for mobile)

  function inJoystick(ev) {
    const rL = joy.getBoundingClientRect();
    const hitL = (ev.clientX >= rL.left && ev.clientX <= rL.right && ev.clientY >= rL.top && ev.clientY <= rL.bottom);
    if (hitL) return true;
    if (joyR) {
      const rR = joyR.getBoundingClientRect();
      const hitR = (ev.clientX >= rR.left && ev.clientX <= rR.right && ev.clientY >= rR.top && ev.clientY <= rR.bottom);
      if (hitR) return true;
    }
    return false;
  }

  function beginLook(ev) {
    // don't begin look if touching joystick or currently grabbing
    if (grabbed) return false;
    if (inJoystick(ev)) return false;
    lookActive = true;
    lookLastX = ev.clientX;
    return true;
  }

  function updateLook(ev) {
    if (!lookActive) return;
    const dx = ev.clientX - lookLastX;
    lookLastX = ev.clientX;
    rig.rotation.y -= dx * LOOK_SENS;
  }

  function endLook() {
    lookActive = false;
  }


  // Keyboard fallback
  const keys = new Set();
  window.addEventListener('keydown', (e)=>{
    const key = e.key.toLowerCase();
    keys.add(key);
    if (key === 'h') setUIVisible(!ui.visible);
  });
  window.addEventListener('keyup', (e)=>keys.delete(e.key.toLowerCase()));

  // VR button
  document.body.appendChild(VRButton.createButton(renderer));

  // ============================
  // UPDATE 7: WebXR Hands (Pinch Grab)
  // - Visual hand models
  // - Pinch (thumb-tip + index-tip) grabs nearest card/chips
  // - Works alongside touch grab (Android)
  // ============================
  const handModelFactory = new XRHandModelFactory();

  const xrHands = [
    renderer.xr.getHand(0),
    renderer.xr.getHand(1),
  ];
  xrHands[0].name = 'hand0';
  xrHands[1].name = 'hand1';
  scene.add(xrHands[0]);
  scene.add(xrHands[1]);

  // Add visible models (optional but helpful)
  xrHands[0].add(handModelFactory.createHandModel(xrHands[0], 'mesh'));
  xrHands[1].add(handModelFactory.createHandModel(xrHands[1], 'mesh'));

  const handState = [
    { pinching: false, grabbed: null, grabbedOffset: new THREE.Vector3(), pinchWorld: new THREE.Vector3() },
    { pinching: false, grabbed: null, grabbedOffset: new THREE.Vector3(), pinchWorld: new THREE.Vector3() },
  ];

  function getJoint(hand, name) {
    // three.js WebXR hands populate .joints
    return hand.joints ? hand.joints[name] : null;
  }

  function isGrabbableType(t) {
    return (t === 'card' || t === 'hole' || t === 'chips');
  }

  function nearestGrabbable(worldPos, maxDist=0.28) {
    let best = null;
    let bestD = maxDist;
    for (const obj of interactables) {
      // Interactables can be groups; pick ancestor with userData.type
      let o = obj;
      if (!o) continue;
      // walk up to typed node
      while (o && !isGrabbableType(o.userData?.type) && o.parent) o = o.parent;
      const t = o?.userData?.type;
      if (!isGrabbableType(t)) continue;
      if (o.visible === false) continue;

      const p = new THREE.Vector3();
      o.getWorldPosition(p);
      const d = p.distanceTo(worldPos);
      if (d < bestD) { bestD = d; best = o; }
    }
    return best;
  }

  function beginHandGrab(handIndex, worldPos) {
    const st = handState[handIndex];
    if (st.grabbed) return;

    const target = nearestGrabbable(worldPos, 0.28);
    if (!target) return;

    st.grabbed = target;

    // Compute offset between object and pinch point
    const objWorld = new THREE.Vector3();
    target.getWorldPosition(objWorld);
    st.grabbedOffset.copy(objWorld).sub(worldPos);

    log(`[hand] grab ${target.userData.type} (${handIndex})`);
  }

  function updateHandGrab(handIndex, worldPos) {
    const st = handState[handIndex];
    if (!st.grabbed) return;

    // Desired world position = pinch + offset
    const desiredWorld = new THREE.Vector3().copy(worldPos).add(st.grabbedOffset);

    // Convert to local coordinates of parent
    const parent = st.grabbed.parent;
    if (!parent) return;
    const local = parent.worldToLocal(desiredWorld.clone());

    // Keep on appropriate plane heights (relative to poker group already)
    const t = st.grabbed.userData?.type;
    if (t === 'chips') local.y = 0.55;
    if (t === 'card' || t === 'hole') local.y = 0.72;

    st.grabbed.position.copy(local);
  }

  function endHandGrab(handIndex) {
    const st = handState[handIndex];
    if (!st.grabbed) return;
    log(`[hand] drop (${handIndex})`);
    st.grabbed = null;
  }

  function updatePinch(handIndex, dt) {
    const hand = xrHands[handIndex];
    const thumb = getJoint(hand, 'thumb-tip');
    const index = getJoint(hand, 'index-finger-tip');
    if (!thumb || !index) return;

    const tp = new THREE.Vector3(); thumb.getWorldPosition(tp);
    const ip = new THREE.Vector3(); index.getWorldPosition(ip);

    const dist = tp.distanceTo(ip);
    const pinchNow = dist < 0.028; // threshold tuned for Quest

    // Midpoint as pinch point
    const pinch = tp.add(ip).multiplyScalar(0.5);
    handState[handIndex].pinchWorld.copy(pinch);

    if (pinchNow && !handState[handIndex].pinching) {
      handState[handIndex].pinching = true;
      beginHandGrab(handIndex, pinch);
    } else if (!pinchNow && handState[handIndex].pinching) {
      handState[handIndex].pinching = false;
      endHandGrab(handIndex);
    }

    if (handState[handIndex].pinching) {
      updateHandGrab(handIndex, pinch);
    }
  }


  btnEnterVR.onclick = async () => log('[xr] press the VRButton (browser prompt)');

  // Resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  log('Diagnostics mounted');
  log(`Android joystick ${isTouch ? 'visible' : 'hidden (desktop)'}`);
  log('World visible');
  diagSetStatus('world');
  log('[boot] ready');
  log('Phase 4 loading…');

  // Main loop
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    // Update 9.1: clear boot on first frame (prevents endless 'booting...')
    if (!boot.cleared) clearBootHUD();
    const dt = Math.min(clock.getDelta(), 0.033);

    // Update 6: XR controller look (right stick yaw) when in VR
    if (renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      if (session) {
        for (const src of session.inputSources) {
          const gp = src.gamepad;
          if (!gp || !gp.axes || gp.axes.length < 3) continue;
          // Oculus/Quest typical: right stick X = axes[2]
          const rx = gp.axes[2] ?? 0;
          const dead = 0.18;
          if (Math.abs(rx) > dead) {
            const yawSpeed = 1.6; // rad/sec at full deflection
            rig.rotation.y -= (rx * yawSpeed) * dt;
          }
        }
      }
    }

    // Update 7: Hand pinch/grab
    updatePinch(0, dt);
    updatePinch(1, dt);


    // Update 8: Android right-stick look (yaw)
    if (!renderer.xr.isPresenting) {
      const dead = 0.10;
      if (Math.abs(joyVecR.x) > dead) {
        const yawSpeed = 1.7; // rad/sec
        rig.rotation.y -= (joyVecR.x * yawSpeed) * dt;
      }
    }

    // FINAL correct locomotion mapping
    // joystick up = forward; down = back; left/right correct
    let moveX = -joyVec.x;
    let moveZ = -joyVec.y;

    // If seated and seatLock enabled, require deliberate stick input to move
    if (pokerState.seated && actions.seatLock) {
      const mag = Math.hypot(moveX, moveZ);
      if (mag < 0.35) { moveX = 0; moveZ = 0; }
    }

    if (keys.has('w')) moveZ -= 1;
    if (keys.has('s')) moveZ += 1;
    if (keys.has('a')) moveX -= 1;
    if (keys.has('d')) moveX += 1;

    const len = Math.hypot(moveX, moveZ);
    if (len > 0.01) {
      moveX /= Math.max(1, len);
      moveZ /= Math.max(1, len);

      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; forward.normalize();

      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

      const speed = 3.0;
      rig.position.addScaledVector(forward, moveZ * speed * dt);
      rig.position.addScaledVector(right,   moveX * speed * dt);

      // keep inside circular room
      const r = Math.hypot(rig.position.x, rig.position.z);
      const limit = ROOM_R - 0.9;
      if (r > limit) {
        const s = limit / r;
        rig.position.x *= s;
        rig.position.z *= s;
      }
    }

    // Update 7: Hand pinch/grab
    updatePinch(0, dt);
    updatePinch(1, dt);

    // Ring pulse
    const pulse = (Math.sin(performance.now()*0.0012)*0.5+0.5);
    ringMat.emissiveIntensity = 0.65 + 0.75*pulse;

    // Bots idle + look-at table
    if (botsGroup && actions.botsEnabled) {
      for (const b of bots) {
        b.userData.idle += dt * 1.2;
        b.position.y = 0.02 * Math.sin(b.userData.idle * 2.0);
        // subtle head look to center
        b.rotation.y += 0.001 * Math.sin(b.userData.idle);
      }
    }

    // Update 9: animate ambient perimeter bots
    if (typeof amb !== 'undefined') {
      for (const b of amb) {
        b.userData.a += dt * b.userData.speed * b.userData.dir;
        const x = Math.sin(b.userData.a) * b.userData.r;
        const z = Math.cos(b.userData.a) * b.userData.r;
        b.position.x = x;
        b.position.z = z;
        b.lookAt(0, 1.2, 0);
      }
    }


    // Update 7: Hand pinch/grab
    updatePinch(0, dt);
    updatePinch(1, dt);

    // Cards face player
    if (pokerState.holeCards.length) {
      for (const hc of pokerState.holeCards) {
        const m = hc.mesh;
        if (!m.visible) continue;
        m.userData.hoverPhase += dt * 2.0;
        m.position.y = 0.72 + 0.02 * Math.sin(m.userData.hoverPhase);
        m.lookAt(camera.position);
        m.rotateY(Math.PI);
      }
    }

    // Update 7: Hand pinch/grab
    updatePinch(0, dt);
    updatePinch(1, dt);
    if (pokerState.community.length) {
      for (const c of pokerState.community) {
        if (!c.visible) continue;
        c.userData.hoverPhase += dt * 2.2;
        c.position.y = 0.72 + 0.02 * Math.sin(c.userData.hoverPhase);
        c.lookAt(camera.position);
        c.rotateY(Math.PI);
      }
    }

    // Update 7: Hand pinch/grab
    updatePinch(0, dt);
    updatePinch(1, dt);

    // Jumbotron updates
    for (const j of jumboAnim) {
      j.state.t += dt;
      j.draw();
    }

    renderer.render(scene, camera);
  });

  } catch (e) {
    console.error(e);
    const hud = document.getElementById('hud');
    if (hud) hud.textContent = 'BOOT ERROR:\n' + (e?.stack || e?.message || String(e));
  }
}