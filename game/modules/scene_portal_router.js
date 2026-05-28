import * as THREE from "three";

export const PRIVATE_SCENES = {
  lobby: "./index.html",
  reikiRoom: "./reiki.html",
  reiki: "./reiki.html",
  pgaDrive: "./range.html",
  pga: "./range.html",
  pgaChipPutt: "./chip-putt.html",
  chipPutt: "./chip-putt.html",
  storeRoom: "./store-room.html",
  smokerLounge: "./smoker-lounge.html",
  scorpion: "./scorpion.html"
};

export function openPrivateScene(key){
  const url = PRIVATE_SCENES[key];
  if (!url) return false;
  window.location.href = url;
  return true;
}

export function createPortal({ scene, label, sublabel = "PRIVATE SCENE", position, rotationY = 0, key, color = 0x7ff5c7 }){
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;
  group.userData.portalKey = key;
  scene.add(group);

  const frameMat = new THREE.MeshStandardMaterial({ color: 0x101522, roughness: 0.42, metalness: 0.28, emissive: color, emissiveIntensity: 0.08 });
  const glowMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.18, side: THREE.DoubleSide, depthWrite: false });
  const panel = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.28, 0.08), frameMat);
  panel.position.y = 1.15;
  group.add(panel);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 1.05), glowMat);
  glow.position.set(0, 1.15, -0.052);
  group.add(glow);

  const canvas = document.createElement("canvas");
  canvas.width = 1024; canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  function draw(){
    ctx.clearRect(0,0,1024,512);
    const grad = ctx.createLinearGradient(0,0,1024,512);
    grad.addColorStop(0,"rgba(4,8,18,.96)");
    grad.addColorStop(1,"rgba(28,10,48,.96)");
    ctx.fillStyle = grad; ctx.fillRect(0,0,1024,512);
    ctx.strokeStyle = "rgba(127,245,199,.82)"; ctx.lineWidth = 12; ctx.strokeRect(20,20,984,472);
    ctx.fillStyle = "#ffffff"; ctx.font = "bold 76px system-ui, Arial"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label,512,190);
    ctx.fillStyle = "rgba(127,245,199,.95)"; ctx.font = "bold 38px system-ui, Arial";
    ctx.fillText(sublabel,512,284);
    ctx.fillStyle = "rgba(255,255,255,.72)"; ctx.font = "28px system-ui, Arial";
    ctx.fillText("Click / watch button to enter • Return gate inside",512,358);
    tex.needsUpdate = true;
  }
  draw();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.05,1.02), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false }));
  sign.position.set(0,1.15,-0.102);
  group.add(sign);

  const pad = new THREE.Mesh(new THREE.RingGeometry(0.55,0.78,64), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.42, side:THREE.DoubleSide }));
  pad.rotation.x = -Math.PI/2;
  pad.position.set(0,0.025,-0.9);
  group.add(pad);

  return group;
}

export function installPortalClickHandler({ camera, scene, domElement }){
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  const portals = [];
  scene.traverse(o => { if (o?.parent?.userData?.portalKey || o?.userData?.portalKey) portals.push(o); });
  domElement.addEventListener("click", (event)=>{
    const rect = domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects(portals, true);
    if (!hits.length) return;
    let obj = hits[0].object;
    while(obj && !obj.userData?.portalKey) obj = obj.parent;
    if (obj?.userData?.portalKey) openPrivateScene(obj.userData.portalKey);
  }, { passive:true });
}
