/* js/scarlett1/logic.js — BLUE SCREEN KILLER (Build 5.6+)
 * Goal: If anything fails, you STILL see a close-range test object + logs on all 4 jumbos.
 * Scope: modules only. Does NOT edit Spine.
 */
(function () {
  'use strict';

  const IDS = {
    anchor: 'poker-module',
    world: 'world-root',
    cam: 'main-cam',
    canvases: ['jumboCanvas_NE', 'jumboCanvas_NW', 'jumboCanvas_SE', 'jumboCanvas_SW'],
  };

  const MODEL_ASSET_ID = '#ninjaModel';
  const MODEL_FALLBACK = 'assets/models/combat_ninja.glb';

  const S = {
    started: false,
    logs: [],
    storeOpen: false,
    radioOn: false,
    pot: 0,
  };

  const qs = (s, r = document) => r.querySelector(s);

  function anchorEl() {
    return document.getElementById(IDS.anchor)
      || document.getElementById(IDS.world)
      || qs('a-scene');
  }

  function log(msg) {
    S.logs.unshift(`[${new Date().toLocaleTimeString()}] ${msg}`);
    S.logs = S.logs.slice(0, 10);
    drawJumbos('SCARLETT MODULE', msg, S.logs);
  }

  function drawJumbos(title, sub, lines) {
    IDS.canvases.forEach((cid, idx) => {
      const c = document.getElementById(cid);
      if (!c) return;
      const ctx = c.getContext('2d');
      const w = c.width, h = c.height;

      ctx.fillStyle = '#00050a';
      ctx.fillRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(0,255,255,0.08)';
      for (let x = 0; x < w; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
      for (let y = 0; y < h; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 44px Courier New, monospace';
      ctx.fillText(String(title).slice(0, 28), 56, 90);

      ctx.fillStyle = '#00FF00';
      ctx.font = 'bold 26px Courier New, monospace';
      ctx.fillText(String(sub || '').slice(0, 46), 56, 140);

      ctx.fillStyle = '#00FFFF';
      ctx.font = 'bold 20px Courier New, monospace';
      const zone = ['NE','NW','SE','SW'][idx] || '';
      ctx.fillText(`ZONE_${zone}: LINK_ACTIVE`, 56, 200);

      let y = 240;
      (lines || []).slice(0, 7).forEach(t => { ctx.fillText(String(t).slice(0, 60), 56, y); y += 30; });
    });
  }

  function safe(fn) {
    try { return fn(); }
    catch (e) {
      console.error(e);
      log(`CRASH: ${e && e.message ? e.message : String(e)}`);
      return null;
    }
  }

  function ensure(tag, attrs = {}, parent) {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    (parent || anchorEl()).appendChild(el);
    return el;
  }

  function addClickable(el) { el.classList.add('clickable'); }

  function ninjaSrc() {
    return document.getElementById('ninjaModel') ? MODEL_ASSET_ID : MODEL_FALLBACK;
  }

  // This is the object you MUST see. If you don't see it, init() is not being called or anchor isn't in scene.
  function injectTestMonolith(parent) {
    const mono = ensure('a-box', {
      id: 'SCARLETT_TEST_MONOLITH',
      position: '0 1.6 -3',
      width: '1.2',
      height: '1.2',
      depth: '1.2',
      material: 'color:#00FFFF; emissive:#00FFFF; emissiveIntensity:2.5; opacity:0.95; transparent:true'
    }, parent);
    mono.setAttribute('animation__spin', 'property: rotation; dur: 2500; loop: true; to: 0 360 0');
    addClickable(mono);
    mono.addEventListener('click', () => log('TEST MONOLITH CLICK ✅'));
    log('Injected TEST MONOLITH at z=-3');
  }

  function injectLights(parent) {
    ensure('a-entity', { light: 'type: ambient; intensity: 1.8; color: #fff' }, parent);
    ensure('a-entity', { position: '0 10 -6', light: 'type: point; intensity: 3.5; distance: 80; color: #fff' }, parent);
    ensure('a-entity', { position: '6 6 -6',  light: 'type: point; intensity: 2.0; distance: 60; color: #88ffff' }, parent);
    ensure('a-entity', { position: '-6 6 -6', light: 'type: point; intensity: 2.0; distance: 60; color: #a020f0' }, parent);
    log('Injected module lights');
  }

  function injectFloor(parent) {
    ensure('a-plane', {
      rotation: '-90 0 0',
      width: '120',
      height: '120',
      position: '0 0 0',
      material: 'color:#05070b; roughness:1; metalness:0'
    }, parent);
    ensure('a-plane', {
      rotation: '-90 0 0',
      width: '120',
      height: '120',
      position: '0 0.02 0',
      material: 'color:#00ffff; opacity:0.07; transparent:true; wireframe:true'
    }, parent);
    log('Injected floor + grid');
  }

  function injectTableAndBots(parent) {
    // Table (close enough to see immediately)
    ensure('a-cylinder', {
      id: 'SCARLETT_TABLE',
      position: '0 0.9 -10',
      radius: '4.2',
      height: '0.25',
      material: 'color:#073010; roughness:0.85; metalness:0.05'
    }, parent);

    ensure('a-ring', {
      rotation: '-90 0 0',
      position: '0 1.05 -10',
      radius-inner: '4.05',
      radius-outer: '4.35',
      material: 'color:#A020F0; emissive:#A020F0; emissiveIntensity:16; opacity:0.95; transparent:true'
    }, parent);

    // Bots (3) — if model fails, you still see their “beacons”
    const seats = [
      { x: 3.5, y: 0.0, z: -12.5, ry: 160, name: 'AGGRO_NINJA' },
      { x: 0.0, y: 0.0, z: -11.0, ry: 180, name: 'DEALER_NINJA' },
      { x: -3.5,y: 0.0, z: -12.5, ry: 200, name: 'TACTIC_NINJA' }
    ];

    seats.forEach((s, i) => {
      // beacon ring (always visible)
      ensure('a-ring', {
        rotation: '-90 0 0',
        position: `${s.x} 0.05 ${s.z}`,
        radius-inner: '0.35',
        radius-outer: '0.48',
        material: 'color:#00ff88; emissive:#00ff88; emissiveIntensity:10; opacity:0.9; transparent:true'
      }, parent);

      // actual model
      const bot = ensure('a-entity', {
        position: `${s.x} 0 ${s.z}`,
        rotation: `0 ${s.ry} 0`,
        'gltf-model': ninjaSrc(),
        'animation-mixer': 'clip: idle; loop: repeat; timeScale: 1'
      }, parent);

      // label
      ensure('a-text', {
        value: s.name,
        align: 'center',
        width: '6',
        color: '#00FFFF',
        position: `${s.x} 2.0 ${s.z}`
      }, parent);

      bot.setAttribute('animation__bob', `property: position; dir: alternate; dur: ${1800+i*250}; loop: true; to: ${s.x} 0.06 ${s.z}`);
    });

    log('Injected table + bots');
  }

  function dealFlop() { log('ACTION: DEAL FLOP'); }
  function spawnStore() { S.storeOpen = !S.storeOpen; log(`STORE: ${S.storeOpen ? 'OPEN' : 'CLOSED'}`); }
  function toggleRadio() { S.radioOn = !S.radioOn; log(`RADIO: ${S.radioOn ? 'ON' : 'OFF'}`); }
  function spawnGuard() { log('GUARDS: DEPLOYED'); }

  function init() {
    if (S.started) return true;

    const sc = qs('a-scene');
    if (!sc) { setTimeout(init, 150); return false; }

    // Wait for A-Frame scene to actually be ready
    if (!sc.hasLoaded) {
      sc.addEventListener('loaded', () => safe(init), { once: true });
      return false;
    }

    const parent = anchorEl();
    if (!parent) { setTimeout(init, 150); return false; }

    // Do NOT clear parent here — some Spines attach important nodes under poker-module.
    // Just inject our stuff under a module root.
    const modRoot = ensure('a-entity', { id: 'SCARLETT1_MODULE_ROOT' }, parent);

    S.started = true;
    log('INIT START');

    safe(() => injectLights(modRoot));
    safe(() => injectFloor(modRoot));
    safe(() => injectTestMonolith(modRoot)); // must be visible at z=-3
    safe(() => injectTableAndBots(modRoot));

    log('INIT COMPLETE');
    return true;
  }

  window.scarlettModule = {
    init,
    dealFlop,
    spawnStore,
    toggleRadio,
    spawnGuard,
  };

  // Auto init as backup (Spine handshake also calls init)
  setTimeout(() => safe(init), 0);

})();
