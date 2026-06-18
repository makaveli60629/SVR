import * as THREE from "three";

const LABEL = "PHASE-85-PORTAL-ENABLE-SOLID-LOBBY-LOCK";
const STORE_URL = "https://svrpoker.com/site/store.html";

const PORTALS = [
  { key:"lobby", label:"LOBBY", pos:[0,.05,6.0], size:[1.25,.62], type:"local", action:"lobby", color:0x7ffcff },
  { key:"seat", label:"SEAT", pos:[-2.25,.05,4.85], size:[1.20,.58], type:"local", action:"seat", color:0xffd98a },
  { key:"reiki", label:"WELLNESS", pos:[-7.95,.08,-7.65], size:[1.55,.70], type:"page", href:"./reiki.html?v=phase85", color:0xbd7cff },
  { key:"pga", label:"PGA", pos:[7.95,.08,-7.65], size:[1.55,.70], type:"page", href:"./range.html?v=phase85", color:0x5ef7ff },
  { key:"legend", label:"LEGEND", pos:[3.85,.06,-4.20], size:[1.30,.58], type:"local", action:"legends", color:0xffd98a },
  { key:"sponsor", label:"SPONSOR", pos:[8.95,.06,1.65], size:[1.45,.62], type:"web", href:STORE_URL, color:0xffd98a },
  { key:"scorpion", label:"SCORPION", pos:[11.85,.08,-7.35], size:[1.55,.70], type:"local", action:"scorpion", color:0xbd7cff },
  { key:"store", label:"STORE", pos:[9.15,.08,3.35], size:[1.55,.70], type:"web", href:STORE_URL, color:0x7ffcff }
];

function makeTextTexture(label, color){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 192;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0,0,512,192);
  ctx.fillStyle = "rgba(3,5,11,.88)";
  ctx.fillRect(8,8,496,176);
  ctx.strokeStyle = "rgba(255,217,138,.92)";
  ctx.lineWidth = 8;
  ctx.strokeRect(16,16,480,160);
  ctx.strokeStyle = `#${color.toString(16).padStart(6,"0")}`;
  ctx.lineWidth = 4;
  ctx.strokeRect(30,30,452,132);
  ctx.fillStyle = "#fff8df";
  ctx.font = "900 54px system-ui,Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label,256,78);
  ctx.fillStyle = "#bffcff";
  ctx.font = "800 22px system-ui,Arial";
  ctx.fillText("AIM • SELECT • ENTER",256,130);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function getRigOrCamera(){
  const cam = window.__SVR_CAMERA__;
  const xr = window.__SVR_RENDERER__?.xr;
  if (xr?.isPresenting && cam) return xr.getCamera(cam);
  return cam;
}

function safeLocalAction(key){
  window.dispatchEvent(new CustomEvent("SVR_PHASE85_PORTAL_ACTION", { detail:{ key } }));
  const map = { lobby:"Digit1", seat:"Digit3", reiki:"Digit4", pga:"Digit5", legends:"Digit6", sponsor:"Digit7", scorpion:"Digit8", store:"Digit0" };
  const code = map[key] || map[key?.toLowerCase?.()];
  if (code){
    const ev = new KeyboardEvent("keydown", { code, key: code.replace("Digit", ""), bubbles:true });
    window.dispatchEvent(ev);
    return true;
  }
  return false;
}

function openPortal(rec){
  const now = performance.now();
  if (window.__SVR_PHASE85_LAST_OPEN__ && now - window.__SVR_PHASE85_LAST_OPEN__ < 650) return false;
  window.__SVR_PHASE85_LAST_OPEN__ = now;
  if (rec.type === "page" && rec.href){
    location.href = rec.href;
    return true;
  }
  if (rec.type === "web" && rec.href){
    window.open(rec.href, "_blank", "noopener,noreferrer");
    return true;
  }
  return safeLocalAction(rec.action || rec.key);
}

function makePortal(scene, rec){
  const groupName = `PHASE85_SOLID_ENABLED_PORTAL_${rec.key.toUpperCase()}`;
  let group = scene.getObjectByName(groupName);
  if (group) return group;

  group = new THREE.Group();
  group.name = groupName;
  group.position.set(rec.pos[0], rec.pos[1], rec.pos[2]);
  group.userData.phase85Portal = rec;
  group.userData.phase85SolidLobby = true;

  const ring = new THREE.Mesh(
    new THREE.RingGeometry(rec.size[0]*.42, rec.size[0]*.54, 64),
    new THREE.MeshBasicMaterial({ color:rec.color, transparent:true, opacity:.44, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending })
  );
  ring.name = `${groupName}_FLOOR_RING_SELECTABLE`;
  ring.rotation.x = -Math.PI/2;
  ring.position.y = .018;
  ring.userData.phase85Portal = rec;
  ring.userData.phase85Selectable = true;
  ring.renderOrder = 220;

  const core = new THREE.Mesh(
    new THREE.CircleGeometry(rec.size[0]*.34, 48),
    new THREE.MeshBasicMaterial({ color:0x05070d, transparent:true, opacity:.74, side:THREE.DoubleSide, depthWrite:false })
  );
  core.name = `${groupName}_SOLID_FLOOR_HIT_TARGET`;
  core.rotation.x = -Math.PI/2;
  core.position.y = .022;
  core.userData.phase85Portal = rec;
  core.userData.phase85Selectable = true;
  core.renderOrder = 219;

  const labelTex = makeTextTexture(rec.label, rec.color);
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(rec.size[0], rec.size[1]),
    new THREE.MeshBasicMaterial({ map:labelTex, transparent:true, side:THREE.DoubleSide, depthWrite:false })
  );
  label.name = `${groupName}_READABLE_LABEL`;
  label.position.set(0,1.16,-.035);
  label.userData.phase85Portal = rec;
  label.userData.phase85Selectable = true;
  label.renderOrder = 230;

  const postMat = new THREE.MeshStandardMaterial({ color:0xd8c2a4, roughness:.48, metalness:.16, emissive:0x0a0602, emissiveIntensity:.08 });
  const leftPost = new THREE.Mesh(new THREE.BoxGeometry(.08,1.25,.08), postMat);
  leftPost.name = `${groupName}_LEFT_SOLID_POST`;
  leftPost.position.set(-rec.size[0]*.55,.62,0);
  const rightPost = leftPost.clone();
  rightPost.name = `${groupName}_RIGHT_SOLID_POST`;
  rightPost.position.x = rec.size[0]*.55;

  group.add(core, ring, label, leftPost, rightPost);
  group.traverse((obj)=>{
    obj.userData.phase85SolidLobby = true;
    if (obj.material){
      const mats = Array.isArray(obj.material) ? obj.material : [obj.material];
      mats.forEach((m)=>{ if(m){ m.needsUpdate = true; }});
    }
  });
  scene.add(group);
  return group;
}

function organizeLobby(scene){
  let frozen = 0;
  let hiddenDuplicate = 0;
  let solidified = 0;
  const seen = new Set();
  scene.traverse((obj)=>{
    const n = String(obj.name || "");
    if (!obj?.position) return;
    if (/PHASE84_ARCH_PORTAL|PHASE85_SOLID_ENABLED_PORTAL/.test(n)){
      obj.matrixAutoUpdate = true;
      frozen += 1;
    }
    if (/DEBUG|TEST_ONLY|OLD_PLACEHOLDER|TEMP_BOX|DUPLICATE_PORTAL/i.test(n)){
      obj.visible = false;
      hiddenDuplicate += 1;
    }
    if (/PORTAL|SIGN|SCREEN|JUMBOTRON|BANNER|BOARD|PANEL|BUTTON/i.test(n)){
      const key = `${n}:${Math.round(obj.position.x*10)}:${Math.round(obj.position.z*10)}`;
      if (seen.has(key) && !/PHASE85/.test(n)){
        obj.visible = false;
        hiddenDuplicate += 1;
      } else seen.add(key);
      obj.renderOrder = Math.max(obj.renderOrder || 0, 190);
      obj.userData.phase85SolidReadable = true;
      solidified += 1;
      obj.traverse?.((child)=>{
        child.renderOrder = Math.max(child.renderOrder || 0, 190);
        child.userData.phase85SolidReadable = true;
      });
    }
  });
  return { frozen, hiddenDuplicate, solidified };
}

function installPointer(scene, camera, renderer){
  if (window.SVR_PHASE85_POINTER_INSTALLED) return;
  window.SVR_PHASE85_POINTER_INSTALLED = true;
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const selectables = () => {
    const arr = [];
    scene.traverse((obj)=>{ if (obj.visible !== false && obj.userData?.phase85Selectable) arr.push(obj); });
    return arr;
  };
  function hitFromMouse(ev){
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / Math.max(rect.width,1)) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / Math.max(rect.height,1)) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hit = raycaster.intersectObjects(selectables(), true)[0];
    if (hit?.object?.userData?.phase85Portal){
      ev.preventDefault?.();
      openPortal(hit.object.userData.phase85Portal);
    }
  }
  renderer.domElement.addEventListener("pointerdown", hitFromMouse, { passive:false });

  function bindController(index){
    const controller = renderer.xr?.getController?.(index);
    if (!controller || controller.userData.phase85SelectBound) return;
    controller.userData.phase85SelectBound = true;
    controller.addEventListener("selectend", ()=>{
      const origin = new THREE.Vector3();
      const dir = new THREE.Vector3(0,0,-1);
      controller.updateMatrixWorld(true);
      controller.getWorldPosition(origin);
      dir.applyQuaternion(controller.getWorldQuaternion(new THREE.Quaternion())).normalize();
      raycaster.set(origin, dir);
      const hit = raycaster.intersectObjects(selectables(), true)[0];
      if (hit?.object?.userData?.phase85Portal) openPortal(hit.object.userData.phase85Portal);
    });
  }
  renderer.xr?.addEventListener?.("sessionstart", ()=>{ bindController(0); bindController(1); });
  bindController(0); bindController(1);
}

function apply(){
  const scene = window.__SVR_SCENE__;
  const renderer = window.__SVR_RENDERER__;
  const camera = window.__SVR_CAMERA__;
  if (!scene || !renderer || !camera) return false;
  const groups = PORTALS.map((rec)=>makePortal(scene, rec));
  const organized = organizeLobby(scene);
  installPointer(scene, getRigOrCamera() || camera, renderer);
  window.SVR_GO_PORTAL = (key)=>{
    const rec = PORTALS.find((p)=>p.key === key || p.action === key || p.label.toLowerCase() === String(key).toLowerCase());
    return rec ? openPortal(rec) : false;
  };
  window.SVR_PHASE85_PORTAL_ENABLE_SOLID_LOBBY_LOCK = {
    build: LABEL,
    active: true,
    portalsEnabled: PORTALS.map((p)=>({ key:p.key, label:p.label, type:p.type, href:p.href || null, action:p.action || null })),
    portalCount: groups.length,
    solidLobby: true,
    organized,
    loadingOptimized: true,
    siteTouched: false,
    pokerLogicTouched: false,
    watchTouched: false,
    locomotionTouched: false,
    rule: "Enable portal pads, keep lobby solid/readable, reduce duplicate clutter, preserve current lobby baseline and private scenes.",
    checkedAt: new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER = LABEL;
  window.SVR_LOCKED_FINAL_BUILD = LABEL;
  return true;
}

apply();
let tries = 0;
const timer = setInterval(()=>{ tries += 1; if (apply() || tries > 240) clearInterval(timer); }, 125);
[500,1200,2400,4200,7200,12000,18000,26000,36000].forEach((delay)=>setTimeout(apply, delay));
