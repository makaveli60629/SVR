import * as THREE from 'three';
import { loadGLB } from './glbLoader.js';
import { createHandPinchInput } from './handPinch.js';

/**
 * Asset Store Module
 * - Pointer click (desktop/mobile)
 * - Optional hands pinch selection (Quest hand-tracking)
 * - Optional GLB avatar placement if files exist
 *
 * Expected (optional) asset paths:
 *  /assets/avatars/male.glb
 *  /assets/avatars/female.glb
 *  /assets/avatars/ninja.glb
 */
export function initAssetStore(scene, camera, renderer) {
  const store = {
    group: new THREE.Group(),
    items: [],
    rayTargets: [],
    hover: null,
    selected: null,
    _click: false,
    _pinchLatch: false,
  };

  store.group.name = "ASSET_STORE";
  store.group.position.set(0, 0, -2.2);

  // Store lighting
  const lightA = new THREE.HemisphereLight(0x88ffcc, 0x001010, 0.9);
  lightA.position.set(0, 3, 0);
  store.group.add(lightA);

  const lightB = new THREE.DirectionalLight(0xffffff, 0.8);
  lightB.position.set(2, 5, 2);
  store.group.add(lightB);

  // Pedestal + button materials
  const pedestalGeo = new THREE.CylinderGeometry(0.25, 0.35, 0.15, 24);
  const pedestalMat = new THREE.MeshStandardMaterial({ color: 0x061806, metalness: 0.2, roughness: 0.6 });

  const btnGeo = new THREE.BoxGeometry(0.22, 0.06, 0.08);
  const btnBase = new THREE.MeshStandardMaterial({ color: 0x001400, emissive: 0x003300, emissiveIntensity: 0.8 });

  const label = makeLabel("ASSET STORE", 0.8, 0.22);
  label.position.set(0, 0.65, 0);
  store.group.add(label);

  const defs = [
    { id: "male",   name: "MALE",   color: 0x00aaff, x: -0.75, url: "./assets/avatars/male.glb" },
    { id: "female", name: "FEMALE", color: 0xff44aa, x:  0.00, url: "./assets/avatars/female.glb" },
    { id: "ninja",  name: "NINJA",  color: 0xaaff00, x:  0.75, url: "./assets/avatars/ninja.glb" },
  ];

  for (const d of defs) {
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(d.x, 0.10, 0);
    store.group.add(pedestal);

    // Placeholder "display"
    const modelHolder = new THREE.Group();
    modelHolder.position.set(d.x, 0.36, 0);
    modelHolder.userData.spin = (d.id === "ninja") ? 1.6 : 0.8;

    const placeholder = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.16, 1),
      new THREE.MeshStandardMaterial({ color: d.color, emissive: d.color, emissiveIntensity: 0.15 })
    );
    modelHolder.add(placeholder);
    store.group.add(modelHolder);

    // Try replace with GLB if present (non-fatal)
    tryLoadGLBInto(modelHolder, d.url);

    const btn = new THREE.Mesh(btnGeo, btnBase.clone());
    btn.position.set(d.x, 0.22, 0.22);
    btn.userData = { type: "assetStoreButton", assetId: d.id, assetName: d.name, assetUrl: d.url };
    store.group.add(btn);

    const bl = makeLabel("EQUIP", 0.25, 0.09, 256, 96);
    bl.position.set(d.x, 0.28, 0.275);
    store.group.add(bl);

    store.items.push({ def: d, pedestal, modelHolder, btn, label: bl });
    store.rayTargets.push(btn);
  }

  // Pointer interaction
  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2(999, 999);

  function onPointerMove(e) {
    pointer.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
  }
  function onPointerDown() { store._click = true; }

  window.addEventListener("pointermove", onPointerMove, { passive: true });
  window.addEventListener("pointerdown", onPointerDown, { passive: true });

  // Hands-only pinch input (optional)
  const hand = renderer ? createHandPinchInput(renderer) : null;

  // Patch into XR animation frames safely:
  // We can't alter Spine's loop, but we can hook renderer.xr.getSession().requestAnimationFrame via "xrframe" event.
  // Some browsers don't expose a clean hook; we'll use setAnimationLoop side-effects by listening to session "inputsourceschange"
  // and using renderer.xr.getReferenceSpace() in update with renderer.xr.getSession() frame not available.
  // Instead, we support a very small feature: if an XRFrame is provided via renderer.xr.getSession().requestAnimationFrame, we won't rely on it.
  // (So, pinch may be limited depending on browser. Pointer still works always.)

  function log(msg){
    const term = document.getElementById("term-log");
    if (term && term.style.display !== "none") {
      term.innerHTML += `<br>> ${msg}`;
      term.scrollTop = term.scrollHeight;
    }
  }

  async function equipAsset(assetId, assetName, assetUrl) {
    store.selected = assetId;
    for (const it of store.items) setBtnSelected(it.btn, it.def.id === store.selected);

    log(`ASSET EQUIPPED: ${assetName}`);

    // Spawn equipped asset as a marker in front of player (simple demo)
    // (Later you can attach to playerGroup or use proper avatar system.)
    const spawnPos = new THREE.Vector3(0, 1.2, -1.4);
    let obj = null;

    try {
      obj = await loadGLB(assetUrl, { targetHeight: 1.6 });
    } catch {
      // fallback marker
      obj = new THREE.Mesh(
        new THREE.CapsuleGeometry(0.2, 0.8, 6, 12),
        new THREE.MeshStandardMaterial({ color: 0x00ff88, emissive: 0x006633, emissiveIntensity: 0.4 })
      );
    }

    obj.position.copy(spawnPos);
    obj.name = `EQUIPPED_${assetId.toUpperCase()}`;

    // Remove previous equipped
    const prev = scene.getObjectByName(/^EQUIPPED_/.source);
    // Regex name search workaround
    scene.traverse((o) => {
      if (o.name && o.name.startsWith('EQUIPPED_') && o !== obj) {
        // mark for removal
        o.userData._remove = true;
      }
    });
    const toRemove = [];
    scene.traverse((o)=>{ if(o.userData._remove) toRemove.push(o); });
    for (const o of toRemove) {
      if (o.parent) o.parent.remove(o);
    }

    scene.add(obj);
  }

  function update(delta, cam) {
    // Spin display models
    for (const it of store.items) it.modelHolder.rotation.y += delta * (it.modelHolder.userData.spin || 1.0);

    // Pointer hover/click
    raycaster.setFromCamera(pointer, cam);
    const hits = raycaster.intersectObjects(store.rayTargets, false);
    const hit = hits[0]?.object || null;

    if (hit !== store.hover) {
      if (store.hover) setBtnEmissive(store.hover, false);
      store.hover = hit;
      if (store.hover) setBtnEmissive(store.hover, true);
    }

    if (store._click && hit && hit.userData?.type === "assetStoreButton") {
      store._click = false;
      equipAsset(hit.userData.assetId, hit.userData.assetName, hit.userData.assetUrl);
    } else {
      store._click = false;
    }

    // Pinch selection (best-effort): we can still raycast from camera forward when pinching.
    if (hand && renderer && renderer.xr.isPresenting) {
      const session = renderer.xr.getSession();
      // XRFrame isn't directly available here; so we implement a simple latch:
      // Use "select" events from XR if any input source triggers select (some browsers map pinch to select).
      // If mapped, it will work. Otherwise it silently does nothing (pointer still works).
      if (!store._xrSelectBound && session) {
        store._xrSelectBound = true;
        session.addEventListener('select', () => {
          // Ray from camera forward
          const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).normalize();
          raycaster.set(cam.getWorldPosition(new THREE.Vector3()), dir);
          const hs = raycaster.intersectObjects(store.rayTargets, false);
          const h = hs[0]?.object || null;
          if (h && h.userData?.type === 'assetStoreButton') {
            equipAsset(h.userData.assetId, h.userData.assetName, h.userData.assetUrl);
          }
        });
      }
    }
  }

  scene.add(store.group);
  store.update = update;
  return store;
}

async function tryLoadGLBInto(holder, url) {
  try {
    const model = await loadGLB(url, { targetHeight: 0.35 });
    // Remove placeholder children
    while (holder.children.length) holder.remove(holder.children[0]);
    holder.add(model);
  } catch {
    // ignore: placeholder stays
  }
}

function setBtnEmissive(btn, on) {
  const mat = btn.material;
  if (!mat) return;
  mat.emissiveIntensity = on ? 1.6 : 0.8;
}

function setBtnSelected(btn, sel) {
  const mat = btn.material;
  if (!mat) return;
  if (sel) {
    mat.emissive.setHex(0x00ff66);
    mat.emissiveIntensity = 2.0;
  } else {
    mat.emissive.setHex(0x003300);
    mat.emissiveIntensity = 0.8;
  }
}

function makeLabel(text, wMeters, hMeters, w=512, h=128) {
  const canvas = document.createElement("canvas");
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,w,h);

  ctx.fillStyle = "rgba(0, 20, 0, 0.65)";
  roundRect(ctx, 8, 8, w-16, h-16, 18);
  ctx.fill();

  ctx.strokeStyle = "rgba(0, 255, 170, 0.8)";
  ctx.lineWidth = 4;
  roundRect(ctx, 8, 8, w-16, h-16, 18);
  ctx.stroke();

  ctx.fillStyle = "rgba(0,255,170,0.95)";
  ctx.font = "bold 56px Courier New, monospace";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, w/2, h/2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true });
  return new THREE.Mesh(new THREE.PlaneGeometry(wMeters, hMeters), mat);
}

function roundRect(ctx, x, y, w, h, r) {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}
