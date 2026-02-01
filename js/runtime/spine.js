// SVR/js/runtime/spine.js
import * as THREE from 'three';
import { VRButton } from 'three/addons/webxr/VRButton.js';
import { XRHandModelFactory } from 'three/addons/webxr/XRHandModelFactory.js';
import { initWorld } from '../scarlett1/world.js';

const $ = (id)=>document.getElementById(id);

function logLine(msg){
  const el = $('log');
  if (!el) return;
  const t = new Date();
  const pad = (n)=>String(n).padStart(2,'0');
  const stamp = `${pad(t.getHours())}:${pad(t.getMinutes())}:${pad(t.getSeconds())}`;
  el.textContent += `[${stamp}] ${msg}\n`;
  el.scrollTop = el.scrollHeight;
}

function setStatus(text, ok=null){
  const s = $('status');
  if (!s) return;
  s.textContent = text;
  if (ok === true) { s.style.background = 'rgba(0,150,0,.45)'; s.style.borderColor='rgba(0,255,120,.45)'; }
  if (ok === false){ s.style.background = 'rgba(150,0,0,.55)'; s.style.borderColor='rgba(255,80,80,.45)'; }
}

export const Spine = {
  start: async ()=>{
    setStatus('boot…');
    logLine('booting…');

    // renderer
    const renderer = new THREE.WebGLRenderer({ antialias:true, alpha:false });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.setSize(innerWidth, innerHeight);
    renderer.xr.enabled = true;
    document.body.appendChild(renderer.domElement);

    // scene + camera rig (rig moves; camera is headset)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);

    const rig = new THREE.Group();
    rig.name = 'rig';
    scene.add(rig);

    const camera = new THREE.PerspectiveCamera(70, innerWidth/innerHeight, 0.05, 400);
    camera.position.set(0, 1.7, 6.5);
    rig.add(camera);

    // simple sky fog
    scene.fog = new THREE.Fog(0x05060a, 30, 120);

    // Bus-like logger
    const Bus = { log: (m)=>logLine(m) };

    // World
    let worldUpdate = null;
    let teleportSurfaces = [];
    try{
      const res = await initWorld({ THREE, scene, camera, rig, Bus });
      teleportSurfaces = res?.teleportSurfaces || [];
      worldUpdate = (dt)=>res?.worldUpdate?.(dt);
      logLine('world ready ✅');
      setStatus('world ready ✅ (VR available)', true);
    }catch(e){
      logLine('WORLD ERROR: ' + (e?.message || e));
      setStatus('boot failed ✖', false);
    }

    // UI buttons
    $('hardReload')?.addEventListener('click', ()=>location.reload(true));
    $('resetSpawn')?.addEventListener('click', ()=>{
      // respawn just outside pit entrance
      rig.position.set(0, 0, 7.5);
      rig.rotation.set(0,0,0);
      logLine('spawn reset');
    });
    $('probePaths')?.addEventListener('click', async ()=>{
      const paths = ['./index.js','./js/runtime/spine.js','./js/scarlett1/world.js'];
      for (const p of paths){
        try{
          const r = await fetch(p, { cache:'no-store' });
          logLine(`probe ${p} status=${r.status}`);
        }catch(e){
          logLine(`probe ${p} FAIL`);
        }
      }
    });
    $('nukeCache')?.addEventListener('click', async ()=>{
      // best-effort: clear SW + caches
      let unreg = 0, del = 0;
      if ('serviceWorker' in navigator){
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs){ await r.unregister(); unreg++; }
      }
      if (window.caches){
        const keys = await caches.keys();
        for (const k of keys){ await caches.delete(k); del++; }
      }
      logLine(`serviceWorker: unregistered ${unreg}`);
      logLine(`caches: deleted ${del}`);
      logLine('NUKE DONE ✅');
    });

    // VR button (Quest)
    $('enterVr')?.addEventListener('click', ()=>{
      // Use Three's VRButton; click triggers if not already added
      if (!document.getElementById('VRButton')){
        document.body.appendChild(VRButton.createButton(renderer));
      }
      // Some browsers require user to click the VRButton; we just add it.
      logLine('Enter VR button added (use browser prompt)');
    });
    // add VRButton immediately on XR-capable browsers
    try{ document.body.appendChild(VRButton.createButton(renderer)); }catch(_){}

    // Controllers + teleport + thumbstick locomotion
    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    rig.add(controller1); rig.add(controller2);

    const rayMat = new THREE.LineBasicMaterial({ color: 0x00d6ff });
    const rayGeo = new THREE.BufferGeometry().setFromPoints([ new THREE.Vector3(0,0,0), new THREE.Vector3(0,0,-1) ]);
    function makeRay(){
      const line = new THREE.Line(rayGeo, rayMat);
      line.name = 'ray';
      line.scale.z = 12;
      return line;
    }
    controller1.add(makeRay());
    controller2.add(makeRay());

    // WebXR hand tracking (Quest-style mesh hands)
    const handFactory = new XRHandModelFactory();
    const hand1 = renderer.xr.getHand(0);
    const hand2 = renderer.xr.getHand(1);
    rig.add(hand1); rig.add(hand2);

    const skin = new THREE.Color(0x8d5524);
    function applySkinTone(root){
      root.traverse((o)=>{
        if (!o.isMesh) return;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats){
          if (!m) continue;
          if ('color' in m) m.color.copy(skin);
          if ('roughness' in m) m.roughness = 0.55;
          if ('metalness' in m) m.metalness = 0.0;
          if ('emissive' in m){
            m.emissive = m.emissive || new THREE.Color(0x000000);
            m.emissive.multiplyScalar(0.0);
          }
          m.needsUpdate = true;
        }
      });
    }

    const handModel1 = handFactory.createHandModel(hand1, 'mesh');
    const handModel2 = handFactory.createHandModel(hand2, 'mesh');
    hand1.add(handModel1);
    hand2.add(handModel2);
    applySkinTone(handModel1);
    applySkinTone(handModel2);

    const reticle = new THREE.Mesh(
      new THREE.RingGeometry(0.16, 0.22, 32),
      new THREE.MeshBasicMaterial({ color: 0x00d6ff, transparent:true, opacity:0.85, side:THREE.DoubleSide })
    );
    reticle.rotation.x = -Math.PI/2;
    reticle.visible = false;
    scene.add(reticle);

    const raycaster = new THREE.Raycaster();
    const tempMatrix = new THREE.Matrix4();
    let teleportHit = null;

    function updateTeleportFromRay(origin, direction){
      raycaster.ray.origin.copy(origin);
      raycaster.ray.direction.copy(direction);
      const hits = raycaster.intersectObjects(teleportSurfaces, true);
      if (!hits.length){
        teleportHit = null;
        reticle.visible = false;
        return;
      }
      teleportHit = hits[0];
      reticle.visible = true;
      reticle.position.copy(teleportHit.point);
    }

    function updateTeleportFromController(ctrl){
      // IMPORTANT: Only sample ONE ray per frame to avoid reticle/teleport jitter
      tempMatrix.identity().extractRotation(ctrl.matrixWorld);
      const origin = new THREE.Vector3().setFromMatrixPosition(ctrl.matrixWorld);
      const dir = new THREE.Vector3(0,0,-1).applyMatrix4(tempMatrix).normalize();
      updateTeleportFromRay(origin, dir);
    }

    function updateTeleportFromHand(hand){
      // Ray: wrist -> index-tip
      const wrist = hand.joints?.['wrist'];
      const indexTip = hand.joints?.['index-finger-tip'];
      if (!wrist || !indexTip) return;
      const o = new THREE.Vector3();
      const t = new THREE.Vector3();
      wrist.getWorldPosition(o);
      indexTip.getWorldPosition(t);
      const dir = t.sub(o).normalize();
      if (dir.lengthSq() < 0.5) return;
      updateTeleportFromRay(o, dir);
    }

    function doTeleport(){
      if (!teleportHit) return;
      // keep head height: move rig so camera ends up over target
      const camWorld = new THREE.Vector3();
      camera.getWorldPosition(camWorld);
      const rigWorld = new THREE.Vector3();
      rig.getWorldPosition(rigWorld);
      const headOffset = camWorld.sub(rigWorld);
      rig.position.x = teleportHit.point.x - headOffset.x;
      rig.position.z = teleportHit.point.z - headOffset.z;
      // y stays (world uses y=0 floor, pit floor negative)
      rig.position.y = rig.position.y; 
    }

    controller1.addEventListener('selectstart', doTeleport);
    controller2.addEventListener('selectstart', doTeleport);

    // Hand pinch teleport: thumb-tip close to index-tip
    let pinchWasDown = false;
    function isPinching(hand){
      const thumb = hand.joints?.['thumb-tip'];
      const index = hand.joints?.['index-finger-tip'];
      if (!thumb || !index) return false;
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      thumb.getWorldPosition(a);
      index.getWorldPosition(b);
      return a.distanceTo(b) < 0.022;
    }

    // Thumbstick movement (left stick translate; right stick snap turn)
    let snapCooldown = 0;
    function applyGamepad(dt){
      const session = renderer.xr.getSession();
      if (!session) return;
      const sources = session.inputSources || [];
      let moveX=0, moveY=0, turnX=0;

      for (const src of sources){
        const gp = src.gamepad;
        if (!gp) continue;
        const ax = gp.axes || [];
        const a0 = ax[0]||0, a1 = ax[1]||0, a2 = ax[2]||0, a3 = ax[3]||0;

        // Some runtimes put the thumbstick on (0,1), others on (2,3).
        // Pick the pair with the larger magnitude.
        const m01 = Math.abs(a0) + Math.abs(a1);
        const m23 = Math.abs(a2) + Math.abs(a3);
        const stickX = (m23 > m01) ? a2 : a0;
        const stickY = (m23 > m01) ? a3 : a1;

        if (src.handedness === 'left'){
          moveX += stickX;
          moveY += stickY;
        } else if (src.handedness === 'right'){
          // Turn uses the X axis of the dominant pair.
          turnX += stickX;
        } else {
          // Unknown handedness: treat as movement, and if 4 axes exist also allow turning.
          moveX += stickX;
          moveY += stickY;
          if (ax.length >= 4) turnX += (m23 > m01 ? a0 : a2); // use the *other* pair if possible
        }
      }

      // deadzone
      const dz = 0.15;
      const dead = (v)=> Math.abs(v) < dz ? 0 : v;
      moveX = dead(moveX); moveY = dead(moveY); turnX = dead(turnX);

      // Move in camera-forward space (ignore pitch)
      const speed = 2.1; // m/s
      if (moveX || moveY){
        const dir = new THREE.Vector3();
        camera.getWorldDirection(dir);
        dir.y = 0; dir.normalize();
        const right = new THREE.Vector3().crossVectors(dir, new THREE.Vector3(0,1,0)).normalize();
        const delta = new THREE.Vector3();
        delta.addScaledVector(dir, -moveY * speed * dt);
        delta.addScaledVector(right, moveX * speed * dt);
        rig.position.add(delta);
      }

      // snap turn
      snapCooldown = Math.max(0, snapCooldown - dt);
      const snap = 0.45;
      if (snapCooldown === 0 && Math.abs(turnX) > snap){
        rig.rotation.y -= Math.sign(turnX) * (Math.PI/6); // 30°
        snapCooldown = 0.25;
      }
    }

    // Resize
    addEventListener('resize', ()=>{
      camera.aspect = innerWidth/innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(innerWidth, innerHeight);
    });

    // Render loop
    const clock = new THREE.Clock();
    renderer.setAnimationLoop(()=>{
      const dt = Math.min(clock.getDelta(), 0.05);
      // Teleport ray: prefer right controller; otherwise use right hand ray.
      const ctrlRay = (controller2.userData.inputSource && controller2.userData.inputSource.handedness==='right')
        ? controller2
        : (controller1.userData.inputSource ? controller1 : null);
      if (ctrlRay) updateTeleportFromController(ctrlRay);
      else {
        // hand ray (works in hand-tracking-only sessions)
        const handRay = (hand2.joints && Object.keys(hand2.joints).length) ? hand2 : hand1;
        updateTeleportFromHand(handRay);
      }

      // Pinch-to-teleport (hands). We only fire on the pinch edge.
      const pinchNow = isPinching(hand1) || isPinching(hand2);
      if (pinchNow && !pinchWasDown) doTeleport();
      pinchWasDown = pinchNow;

      applyGamepad(dt);
      worldUpdate?.(dt);
      renderer.render(scene, camera);
    });

    // Avatar buttons call into world module via window
    $('avMale')?.addEventListener('click', ()=>window.spawnAvatar?.('male'));
    $('avFemale')?.addEventListener('click', ()=>window.spawnAvatar?.('female'));
    $('avNinja')?.addEventListener('click', ()=>window.spawnAvatar?.('ninja'));
    $('avCombat')?.addEventListener('click', ()=>window.spawnAvatar?.('combat'));
    $('avClear')?.addEventListener('click', ()=>window.clearAvatar?.());

    logLine('spine started ✅');
  }
};
