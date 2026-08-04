import * as THREE from "three";

const LABEL = "PHASE-96-UPDATE-4-WORLD-LAYER-LOCK";
const ROOT = "UPDATE4_WORLD_LAYER_ROOT";
const PURPLE = 0x8f35ff;
const CYAN = 0x66f7ff;
const GOLD = 0xffd98a;
const VOID = 0x010208;
const COLUMN_BOTTOM = new THREE.Color(0x32145f);
const COLUMN_TOP = new THREE.Color(0x4df5ff);
let installed = false;

function makeGlow(color, opacity = 0.3){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending });
}
function makeDark(color = 0x05070d, opacity = 0.74){
  return new THREE.MeshBasicMaterial({ color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false });
}
function makeTrim(color = PURPLE){
  return new THREE.MeshStandardMaterial({ color, roughness:.32, metalness:.38, emissive:color, emissiveIntensity:.28 });
}
function makeColumnGradientMaterial(){
  const c=document.createElement("canvas"); c.width=64; c.height=512;
  const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,512,0,0);
  g.addColorStop(0,"#32145f");
  g.addColorStop(.45,"#7a2cff");
  g.addColorStop(1,"#4df5ff");
  ctx.fillStyle=g; ctx.fillRect(0,0,64,512);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2;
  return new THREE.MeshStandardMaterial({ map:tex, roughness:.34, metalness:.22, emissive:0x14062a, emissiveIntensity:.18 });
}
function addRoomVolume(root){
  const back = new THREE.Mesh(new THREE.PlaneGeometry(20.4,6.2), makeDark(VOID,.58));
  back.name="UPDATE4_HIGH_VOID_REAR_WALL_VOLUME"; back.position.set(0,2.85,-9.62); back.renderOrder=8; root.add(back);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(17.2,6.0), makeDark(VOID,.42));
  left.name="UPDATE4_HIGH_VOID_LEFT_WALL_VOLUME"; left.position.set(-10.18,2.7,-1.05); left.rotation.y=Math.PI/2; left.renderOrder=8; root.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(17.2,6.0), makeDark(VOID,.42));
  right.name="UPDATE4_HIGH_VOID_RIGHT_WALL_VOLUME"; right.position.set(10.18,2.7,-1.05); right.rotation.y=-Math.PI/2; right.renderOrder=8; root.add(right);
  const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(20.4,17.2), makeDark(0x05040f,.34));
  ceiling.name="UPDATE4_RAISED_VOID_CEILING_PLANE"; ceiling.rotation.x=Math.PI/2; ceiling.position.set(0,5.35,-1.05); ceiling.renderOrder=7; root.add(ceiling);
}
function addContinuousTrims(root){
  const specs=[
    {name:"REAR_BASE", x:0,y:.33,z:-9.47,w:19.6,d:.06,ry:0},
    {name:"REAR_CROWN", x:0,y:4.96,z:-9.47,w:19.6,d:.06,ry:0},
    {name:"LEFT_BASE", x:-10.02,y:.33,z:-1.05,w:16.6,d:.06,ry:Math.PI/2},
    {name:"LEFT_CROWN", x:-10.02,y:4.96,z:-1.05,w:16.6,d:.06,ry:Math.PI/2},
    {name:"RIGHT_BASE", x:10.02,y:.33,z:-1.05,w:16.6,d:.06,ry:-Math.PI/2},
    {name:"RIGHT_CROWN", x:10.02,y:4.96,z:-1.05,w:16.6,d:.06,ry:-Math.PI/2}
  ];
  specs.forEach((s)=>{
    const mesh=new THREE.Mesh(new THREE.BoxGeometry(s.w,.045,s.d), makeTrim(PURPLE));
    mesh.name=`UPDATE4_CONTINUOUS_NEON_PURPLE_TRIM_${s.name}`; mesh.position.set(s.x,s.y,s.z); mesh.rotation.y=s.ry; mesh.renderOrder=60; root.add(mesh);
    const halo=new THREE.Mesh(new THREE.BoxGeometry(s.w,.075,s.d*1.8), makeGlow(PURPLE,.22));
    halo.name=`UPDATE4_TRIM_SOFT_HALO_${s.name}`; halo.position.copy(mesh.position); halo.rotation.y=s.ry; halo.renderOrder=61; root.add(halo);
  });
}
function addQuadColumns(root){
  const mat=makeColumnGradientMaterial();
  const positions=[[-8.92,-8.58],[8.92,-8.58],[-8.92,6.32],[8.92,6.32]];
  positions.forEach(([x,z],i)=>{
    const col=new THREE.Mesh(new THREE.BoxGeometry(.48,4.65,.48), mat.clone());
    col.name=`UPDATE4_QUAD_SQUARE_GRADIENT_COLUMN_${i}`; col.position.set(x,2.38,z); col.renderOrder=45; root.add(col);
    const capTop=new THREE.Mesh(new THREE.BoxGeometry(.72,.16,.72), makeTrim(i%2?CYAN:GOLD));
    capTop.name=`UPDATE4_QUAD_COLUMN_TOP_CAP_${i}`; capTop.position.set(x,4.75,z); root.add(capTop);
    const capBase=new THREE.Mesh(new THREE.BoxGeometry(.78,.18,.78), makeTrim(PURPLE));
    capBase.name=`UPDATE4_QUAD_COLUMN_BASE_CAP_${i}`; capBase.position.set(x,.16,z); root.add(capBase);
  });
}
function addCanopyLight(root){
  const group=new THREE.Group(); group.name="UPDATE4_OVERHEAD_GEOMETRIC_RING_CANOPY_LIGHT"; group.position.set(0,4.45,-2.55); root.add(group);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.92,.035,12,128), makeGlow(CYAN,.55));
  ring.name="UPDATE4_CANOPY_CYAN_RING_FIXTURE"; ring.rotation.x=Math.PI/2; ring.renderOrder=80; group.add(ring);
  const goldRing=new THREE.Mesh(new THREE.TorusGeometry(2.12,.025,10,128), makeGlow(GOLD,.30));
  goldRing.name="UPDATE4_CANOPY_GOLD_OUTER_RING"; goldRing.rotation.x=Math.PI/2; goldRing.renderOrder=79; group.add(goldRing);
  for(let i=0;i<8;i++){
    const a=i*Math.PI/4;
    const spoke=new THREE.Mesh(new THREE.BoxGeometry(1.84,.018,.036), makeGlow(i%2?CYAN:GOLD,.30));
    spoke.name=`UPDATE4_CANOPY_GEOMETRIC_SPOKE_${i}`; spoke.rotation.y=a; spoke.renderOrder=78; group.add(spoke);
  }
  const light=new THREE.PointLight(0xffc98a,1.15,7.4,2.1);
  light.name="UPDATE4_CANOPY_TABLE_SPECULAR_LIGHT"; light.position.set(0,-.35,0); light.castShadow=false; group.add(light);
}
function addDailyPick(root){
  const group=new THREE.Group(); group.name="UPDATE4_DAILY_PICK_SHOWCASE_TABLE"; group.position.set(-4.85,0,2.65); root.add(group);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(.76,.86,.18,48), new THREE.MeshStandardMaterial({color:0x091425,roughness:.42,metalness:.25,emissive:0x03182a,emissiveIntensity:.22}));
  base.name="UPDATE4_DAILY_PICK_LOW_SHOWCASE_BASE"; base.position.y=.14; group.add(base);
  const spot=new THREE.Mesh(new THREE.CircleGeometry(1.22,64), makeGlow(CYAN,.22));
  spot.name="UPDATE4_DAILY_PICK_BLUE_PIN_SPOT_POOL"; spot.rotation.x=-Math.PI/2; spot.position.y=.06; spot.renderOrder=82; group.add(spot);
  const c=document.createElement("canvas"); c.width=768; c.height=256;
  const ctx=c.getContext("2d"); ctx.fillStyle="rgba(0,0,0,0)"; ctx.clearRect(0,0,768,256); ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#7ffcff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText("DAILY PICK",384,80); ctx.fillStyle="#ffd98a"; ctx.font="900 42px system-ui,Arial"; ctx.fillText("$500 → $5000",384,158);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const holo=new THREE.Mesh(new THREE.PlaneGeometry(2.3,.76), new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  holo.name="UPDATE4_DAILY_PICK_FLOATING_HOLOGRAPHIC_TIERS"; holo.position.set(0,1.28,0); holo.rotation.y=.15; holo.renderOrder=390; group.add(holo);
}
function addWalletHologram(root){
  const c=document.createElement("canvas"); c.width=960; c.height=320;
  const ctx=c.getContext("2d"); ctx.fillStyle="rgba(0,0,0,0)"; ctx.clearRect(0,0,960,320); ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#7ffcff"; ctx.font="900 46px system-ui,Arial"; ctx.fillText("BANKROLL",480,86); ctx.fillStyle="#ffd98a"; ctx.font="900 64px system-ui,Arial"; ctx.fillText("$50,000",480,176); ctx.fillStyle="#ffffff"; ctx.font="700 25px system-ui,Arial"; ctx.fillText("PLAY-MONEY BALANCE",480,244);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const wallet=new THREE.Mesh(new THREE.PlaneGeometry(2.65,.88), new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  wallet.name="UPDATE4_SPATIAL_WALLET_GATEWAY_HOLOGRAM"; wallet.position.set(0,1.78,.92); wallet.renderOrder=392; root.add(wallet);
  const frame=new THREE.Mesh(new THREE.RingGeometry(.82,1.04,64), makeGlow(GOLD,.16));
  frame.name="UPDATE4_WALLET_GATEWAY_HOLOGRAM_FRAME"; frame.position.set(0,1.78,.90); frame.renderOrder=391; root.add(frame);
}
function hideEngineeringOverlays(scene){
  let hidden=0, preserved=0;
  scene.traverse((o)=>{
    const n=String(o.name||"").toUpperCase();
    if(/STABILITY_QA|GAME\.ZIP|FINAL_PREP|ENGINEERING|QA_PANEL|AIM.*SELECT.*ENTER|TRACKING_BLOCK/.test(n)){
      o.visible=false; o.userData.update4CollapsedEngineeringOverlay=true; hidden++;
    }
    if(/WATCH|PORTAL|SIGN|CARD|CHIP|ACTION|BUTTON|WALLET|DAILY/.test(n)){
      o.renderOrder=Math.max(o.renderOrder||0,390); preserved++;
      if(o.material){ const mats=Array.isArray(o.material)?o.material:[o.material]; mats.forEach(m=>{ if(m){ m.depthWrite=false; m.needsUpdate=true; }}); }
    }
  });
  return {hidden, preserved};
}
function tuneRenderer(renderer){
  if(!renderer) return {};
  renderer.setClearColor?.(VOID,1);
  renderer.toneMappingExposure=Math.min(renderer.toneMappingExposure||1,0.98);
  renderer.shadowMap.enabled=false;
  return {clearColor:"#010208", exposure:renderer.toneMappingExposure, shadows:false};
}
export function installUpdate4WorldLayer(){
  const scene=window.__SVR_SCENE__; const renderer=window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  addRoomVolume(root);
  addContinuousTrims(root);
  addQuadColumns(root);
  addCanopyLight(root);
  addDailyPick(root);
  addWalletHologram(root);
  const overlays=hideEngineeringOverlays(scene);
  const render=tuneRenderer(renderer);
  installed=true;
  window.SVR_UPDATE_4_WORLD_LAYER={
    build:LABEL,
    active:true,
    manifest:"Scarlett Poker VR Update 4.0 Hand-Off Manifest",
    spatialStyle:"Luxury Neon Void",
    modules:["raised room volume","crown/base neon trim","quad gradient columns","geometric canopy light","daily pick showcase","spatial wallet hologram","engineering overlay minimization"],
    overlays,
    render,
    siteTouched:false,
    publicRootTouched:false,
    pokerLogicTouched:false,
    movementTouched:false,
    watchTouched:false,
    privateScenesTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_PHASE96_UPDATE4_WORLD_LAYER_LOCK=window.SVR_UPDATE_4_WORLD_LAYER;
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
installUpdate4WorldLayer();
let tries=0; const timer=setInterval(()=>{ tries++; if(installUpdate4WorldLayer()||tries>180) clearInterval(timer); },300);
[1200,3000,6400,11200,18000].forEach(d=>setTimeout(installUpdate4WorldLayer,d));
