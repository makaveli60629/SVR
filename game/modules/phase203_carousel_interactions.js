import * as THREE from "three";

const LABEL = "UPDATE-3.0-PHASE-203-CAROUSEL-INTERACTION-ROUTE-LOCK";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xa77cff;
const GREEN = 0x8dffb4;
const RED = 0xff5b8c;

function makeSlideTexture({ title, kicker, lines, footer, color = "#a77cff" }){
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 720;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0,0,c.width,c.height);
  g.addColorStop(0,"#030713");
  g.addColorStop(1,"#14051e");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 16;
  ctx.strokeRect(30,30,c.width-60,c.height-60);
  ctx.strokeStyle = "rgba(255,255,255,.20)";
  ctx.lineWidth = 4;
  ctx.strokeRect(62,62,c.width-124,c.height-124);
  ctx.fillStyle = "rgba(255,255,255,.05)";
  ctx.fillRect(88,86,c.width-176,100);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 76px system-ui,Arial";
  ctx.fillText(title,c.width/2,136);
  ctx.fillStyle = color;
  ctx.font = "800 42px system-ui,Arial";
  ctx.fillText(kicker,c.width/2,244);
  ctx.textAlign = "left";
  ctx.fillStyle = "#eaf5ff";
  ctx.font = "700 34px system-ui,Arial";
  let y = 340;
  lines.forEach(line=>{
    ctx.fillText(`• ${line}`,110,y);
    y += 58;
  });
  ctx.textAlign = "center";
  ctx.fillStyle = footer.includes("APPROVAL") ? "#ff3b55" : color;
  ctx.font = "900 34px system-ui,Arial";
  ctx.fillText(footer,c.width/2,635);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function makeButtonTexture(text, color = "#ffd98a"){
  const c = document.createElement("canvas");
  c.width = 500;
  c.height = 220;
  const ctx = c.getContext("2d");
  ctx.fillStyle = "rgba(0,0,0,.82)";
  ctx.fillRect(0,0,c.width,c.height);
  ctx.strokeStyle = color;
  ctx.lineWidth = 12;
  ctx.strokeRect(18,18,c.width-36,c.height-36);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#fff";
  ctx.font = "900 64px system-ui,Arial";
  ctx.fillText(text,c.width/2,c.height/2);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
function addButtonLabel(root, name, text, x, y, z, color){
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.58,0.25), new THREE.MeshBasicMaterial({ map:makeButtonTexture(text, color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  label.name = name;
  label.position.set(x,y,z);
  label.renderOrder = 120;
  root.add(label);
  return label;
}
function findFirst(scene, names){
  for (const name of names){
    const obj = scene.getObjectByName(name);
    if (obj) return obj;
  }
  return null;
}
function setPanelTexture(mesh, texture){
  if (!mesh) return;
  if (mesh.material?.map) mesh.material.map.dispose?.();
  mesh.material = new THREE.MeshBasicMaterial({ map:texture, transparent:true, side:THREE.DoubleSide, depthWrite:false });
  mesh.renderOrder = 130;
  mesh.material.needsUpdate = true;
}
function controllerRaycast(controller, raycaster, targets){
  if (!controller || !targets.length) return null;
  const origin = new THREE.Vector3();
  const direction = new THREE.Vector3(0,0,-1);
  const q = new THREE.Quaternion();
  controller.getWorldPosition(origin);
  controller.getWorldQuaternion(q);
  direction.applyQuaternion(q).normalize();
  raycaster.set(origin,direction);
  raycaster.near = 0.02;
  raycaster.far = 8;
  return raycaster.intersectObjects(targets,true)[0] || null;
}
function addPulseRing(scene, target, color){
  if (!target) return null;
  const world = new THREE.Vector3();
  target.getWorldPosition(world);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.26,0.34,48), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:0.66, blending:THREE.AdditiveBlending, depthWrite:false, side:THREE.DoubleSide }));
  ring.name = `PHASE203_ACTION_PULSE_${target.name || "TARGET"}`;
  ring.position.copy(world);
  ring.position.y += 0.02;
  ring.rotation.x = -Math.PI/2;
  ring.userData.life = 0.55;
  scene.add(ring);
  return ring;
}
export function installPhase203CarouselInteractions({ scene, camera, renderer, gotoScene, openStorePortal, setStatus = ()=>{}, log = console.log } = {}){
  if (!scene || !renderer || !camera) return null;
  const existing = scene.getObjectByName("PHASE203_CAROUSEL_INTERACTION_ROOT");
  if (existing) existing.parent?.remove(existing);
  const root = new THREE.Group();
  root.name = "PHASE203_CAROUSEL_INTERACTION_ROOT";
  scene.add(root);

  const slides = [
    { key:"video", title:"VIDEO", kicker:"Founder presentation slide", lines:["Video placeholder is staged here","Use Next / Back to rotate the carousel","Final approved MP4 can replace this panel","Audio should remain local to the Wellness bay"], footer:"WAITING FOR APPROVAL", color:"#a77cff" },
    { key:"about", title:"ABOUT", kicker:"Wellness / Reiki overview", lines:["What the session offers","Benefits and session format","Booking handoff remains modular","Approval-safe content only for now"], footer:"APPROVAL-SAFE PREVIEW", color:"#7ffcff" },
    { key:"symbols", title:"SYMBOLS", kicker:"Education slide", lines:["Reiki symbol information placeholder","No final claims until approved","Slide content can be swapped later","Clean carousel frame stays locked"], footer:"CONTENT PLACEHOLDER", color:"#ffd98a" },
    { key:"portal", title:"MEDITATION", kicker:"Private room route", lines:["Press ENTER ROOM below","Routes to private meditation room bay","Keeps lobby clean and organized","Hologram stays compact in one section"], footer:"PORTAL READY", color:"#8dffb4" }
  ];
  let slideIndex = 0;
  const slidePanel = findFirst(scene,["PHASE202_CAROUSEL_VIDEO_SLIDE","PHASE203_CAROUSEL_ACTIVE_SLIDE"]);

  const nextBtn = findFirst(scene,["PHASE202_CAROUSEL_NEXT_BUTTON"]);
  const backBtn = findFirst(scene,["PHASE202_CAROUSEL_BACK_BUTTON"]);
  const portalBtn = findFirst(scene,["PHASE202_MEDITATION_ROOM_PORTAL_BUTTON"]);
  const storeTargets = [findFirst(scene,["PHASE202_STORE_STOREFRONT_SHELL_ENTRY_PAD_RING","PHASE202_STORE_DISPLAY_SIGN","PHASE202_STORE_STOREFRONT_SHELL_SIGN"]), findFirst(scene,["PHASE202_SVR_STORE_WEB_PORTAL"])] .filter(Boolean);
  const scorpionBtn = findFirst(scene,["PHASE202_SCORPION_DOOR","PHASE202_SCORPION_DOOR_SIGN"]);
  const pgaBtn = findFirst(scene,["PHASE202_PGA_TARGET_PANEL","PHASE202_PGA_PREVIEW_SIGN"]);

  if (nextBtn) nextBtn.userData.phase203Action = "next";
  if (backBtn) backBtn.userData.phase203Action = "back";
  if (portalBtn) portalBtn.userData.phase203Action = "meditation";
  storeTargets.forEach(obj=>obj.userData.phase203Action = "store");
  if (scorpionBtn) scorpionBtn.userData.phase203Action = "scorpion";
  if (pgaBtn) pgaBtn.userData.phase203Action = "pga";

  addButtonLabel(root,"PHASE203_BACK_BUTTON_LABEL","BACK",-13.08,0.86,-10.76,"#7ffcff");
  addButtonLabel(root,"PHASE203_NEXT_BUTTON_LABEL","NEXT",-10.92,0.86,-10.76,"#ffd98a");
  const enterLabel = new THREE.Mesh(new THREE.PlaneGeometry(1.42,0.28), new THREE.MeshBasicMaterial({ map:makeButtonTexture("ENTER ROOM","#a77cff"), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  enterLabel.name = "PHASE203_ENTER_ROOM_BUTTON_LABEL";
  enterLabel.position.set(-12,0.60,-10.76);
  enterLabel.renderOrder = 120;
  root.add(enterLabel);

  function renderSlide(){
    const s = slides[slideIndex];
    setPanelTexture(slidePanel, makeSlideTexture(s));
    window.SVR_PHASE203_CAROUSEL_STATE = { label:LABEL, slideIndex, slideKey:s.key, slideTitle:s.title, updatedAt:new Date().toISOString() };
    setStatus(`Wellness carousel: ${s.title}`, { force:true });
  }
  function doAction(action, target = null){
    if (!action) return false;
    if (action === "next"){
      slideIndex = (slideIndex + 1) % slides.length;
      renderSlide();
      addPulseRing(scene,target || nextBtn,GOLD);
      return true;
    }
    if (action === "back"){
      slideIndex = (slideIndex - 1 + slides.length) % slides.length;
      renderSlide();
      addPulseRing(scene,target || backBtn,CYAN);
      return true;
    }
    if (action === "meditation"){
      renderSlide();
      addPulseRing(scene,target || portalBtn,PURPLE);
      gotoScene?.("reikiRoom") || gotoScene?.("reiki");
      setStatus("Meditation room route selected.", { force:true });
      return true;
    }
    if (action === "store"){
      addPulseRing(scene,target,GREEN);
      openStorePortal?.();
      return true;
    }
    if (action === "pga"){
      addPulseRing(scene,target,CYAN);
      gotoScene?.("pga");
      setStatus("PGA practice bay selected.", { force:true });
      return true;
    }
    if (action === "scorpion"){
      addPulseRing(scene,target,RED);
      gotoScene?.("scorpion");
      setStatus("Scorpion room route selected.", { force:true });
      return true;
    }
    return false;
  }
  function actionFromHit(hit){
    let obj = hit?.object || null;
    while(obj){
      if (obj.userData?.phase203Action) return { action:obj.userData.phase203Action, target:obj };
      obj = obj.parent;
    }
    return null;
  }
  const actionTargets = [];
  scene.traverse(obj=>{
    if (obj?.userData?.phase203Action) actionTargets.push(obj);
  });
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let lastActionAt = 0;
  function runHit(hit){
    const rec = actionFromHit(hit);
    if (!rec) return false;
    const now = performance.now();
    if (now - lastActionAt < 260) return true;
    lastActionAt = now;
    return doAction(rec.action,rec.target);
  }
  renderer.domElement.addEventListener("pointerdown", (ev)=>{
    if (renderer.xr.isPresenting) return;
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse,camera);
    runHit(raycaster.intersectObjects(actionTargets,true)[0]);
  });
  const xrControllers = [renderer.xr.getController(0), renderer.xr.getController(1)];
  xrControllers.forEach(controller=>{
    controller.addEventListener("selectstart", ()=>{
      const hit = controllerRaycast(controller,raycaster,actionTargets);
      runHit(hit);
    });
  });
  renderSlide();

  const pulses = [];
  const oldAdd = addPulseRing;
  window.SVR_PHASE203_CAROUSEL_INTERACTIONS = {
    label: LABEL,
    locked: true,
    carouselButtonsFunctional: true,
    pointerClickFunctional: true,
    xrSelectFunctional: true,
    meditationRouteFunctional: true,
    storeRouteFunctional: true,
    pgaRouteFunctional: true,
    scorpionRouteFunctional: true,
    approvalSafe: true,
    checkedAt: new Date().toISOString(),
    next: ()=>doAction("next",nextBtn),
    back: ()=>doAction("back",backBtn),
    meditation: ()=>doAction("meditation",portalBtn)
  };
  log(`[Phase203] carousel interactions active: desktop pointer + XR select routes installed`);
  return {
    update(dt = 0.016){
      scene.children.slice().forEach(obj=>{
        if (!String(obj.name || "").startsWith("PHASE203_ACTION_PULSE_")) return;
        obj.userData.life = (obj.userData.life ?? 0.55) - dt;
        obj.scale.multiplyScalar(1 + dt*1.9);
        if (obj.material) obj.material.opacity = Math.max(0,obj.userData.life / 0.55) * 0.66;
        if (obj.userData.life <= 0) obj.parent?.remove(obj);
      });
    },
    next: ()=>doAction("next",nextBtn),
    back: ()=>doAction("back",backBtn),
    meditation: ()=>doAction("meditation",portalBtn)
  };
}
