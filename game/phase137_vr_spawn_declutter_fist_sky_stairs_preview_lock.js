import * as THREE from "three";

const LABEL = "PHASE-137-VR-SPAWN-DECLUTTER-FIST-SKY-STAIRS-PREVIEW-LOCK";
const ROOT = "PHASE137_VR_SPAWN_DECLUTTER_ROOT";
const CYAN = 0x7ffcff;
const GOLD = 0xffd98a;
const RED = 0xb20f24;
const PURPLE = 0x9b4dff;
const GLASS = 0x8fdcff;
const MOON_POS = new THREE.Vector3(0, 17.5, -47);
const MARS_ORBIT_R = 8.6;
const SECOND_FLOOR_Y = 3.42;

const STORE_FRONTS = [
  {key:"reiki", label:"REIKI HUB", x:-15.8, y:1.7, z:-17.35, ry:0, color:PURPLE},
  {key:"pga", label:"PGA RANGE", x:15.8, y:1.7, z:-17.35, ry:0, color:CYAN},
  {key:"store", label:"SVR STORE", x:22.25, y:1.55, z:5.7, ry:-Math.PI/2, color:GOLD},
  {key:"scorpion", label:"SCORPION", x:22.25, y:1.55, z:-8.8, ry:-Math.PI/2, color:PURPLE},
  {key:"lounge", label:"LOUNGE", x:-22.25, y:1.55, z:5.7, ry:Math.PI/2, color:GOLD},
  {key:"theater", label:"VIBES THEATER", x:-22.25, y:1.55, z:-8.8, ry:Math.PI/2, color:RED}
];

function makeMat(color, opacity=1, emissive=.035){
  return new THREE.MeshStandardMaterial({color, roughness:.44, metalness:.12, transparent:opacity<1, opacity, emissive:color, emissiveIntensity:emissive, side:THREE.DoubleSide});
}
function makeTextTexture(lines, color="#7ffcff", bg="rgba(0,0,0,.72)"){
  const c=document.createElement("canvas"); c.width=900; c.height=420; const x=c.getContext("2d");
  x.fillStyle=bg; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=color; x.lineWidth=9; x.strokeRect(22,22,c.width-44,c.height-44);
  x.strokeStyle="rgba(255,217,138,.74)"; x.lineWidth=4; x.strokeRect(50,50,c.width-100,c.height-100);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=color; x.shadowBlur=14;
  x.fillStyle="#fff8df"; x.font="900 52px system-ui,Arial"; x.fillText(lines[0]||"SVR",c.width/2,90,c.width-90);
  x.shadowBlur=5; x.fillStyle="#bffcff"; x.font="800 30px system-ui,Arial";
  for(let i=1;i<lines.length;i++) x.fillText(lines[i],c.width/2,92+i*58,c.width-90);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}
function count(scene,re){ let n=0; scene?.traverse?.(o=>{ if(re.test(String(o.name||"")) && o.visible!==false) n++; }); return n; }
function hideByName(scene,re, except=/PHASE137/i){
  let n=0;
  scene?.traverse?.(o=>{
    const name=String(o.name||"");
    if(except.test(name)) return;
    if(re.test(name)){ o.visible=false; o.userData.phase137Hidden=true; n++; }
  });
  return n;
}
function removeOldRoot(scene){ const old=scene?.getObjectByName?.(ROOT); if(old) old.parent?.remove(old); }
function isPreview(){ const p=new URLSearchParams(location.search); return window.self!==window.top || p.has("preview") || p.has("live") || p.get("cam")==="director" || p.has("autocam"); }

function installDomOverlayGuard(){
  let style=document.getElementById("phase137-overlay-guard-style");
  if(!style){
    style=document.createElement("style"); style.id="phase137-overlay-guard-style";
    style.textContent=`
      body.xr-active #hud, body.xr-active #log, body.xr-active #err, body.xr-active #sceneNav,
      body.preview-mode #hud, body.preview-mode #log, body.preview-mode #err, body.preview-mode #sceneNav,
      .phase-label,.debug-overlay,.diagnostic-overlay,.black-overlay,.xr-overlay-square{display:none!important;opacity:0!important;pointer-events:none!important;}
      #svrPhaseBadge{position:fixed;left:10px;top:10px;z-index:9999;padding:8px 12px;border:1px solid rgba(127,252,255,.75);border-radius:999px;background:rgba(0,0,0,.56);color:#bffcff;font:900 12px system-ui,Arial;letter-spacing:.08em;pointer-events:none;box-shadow:0 0 18px rgba(127,252,255,.2)}
    `;
    document.head.appendChild(style);
  }
  let badge=document.getElementById("svrPhaseBadge");
  if(!badge){ badge=document.createElement("div"); badge.id="svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent="PHASE 137 • VR CLEANUP";
  function sweep(){
    const vw=innerWidth||1, vh=innerHeight||1;
    Array.from(document.body.children).forEach(el=>{
      if(!el || el.id==="app" || el.id==="safeStage" || el.id==="svrPhaseBadge" || el.tagName==="SCRIPT" || el.tagName==="STYLE") return;
      const cs=getComputedStyle(el), r=el.getBoundingClientRect?.();
      const id=(el.id||"")+" "+(el.className||"");
      const looksOverlay=/overlay|hud|debug|diagnostic|fallback|log|err|sceneNav/i.test(id);
      const huge=r && r.width>vw*.30 && r.height>vh*.22;
      const black=/rgba?\(0,\s*0,\s*0|#000|black/i.test(cs.backgroundColor||"");
      if((looksOverlay && cs.position==="fixed") || (huge && black && cs.position==="fixed" && document.body.classList.contains("xr-active"))){
        el.style.display="none"; el.style.opacity="0"; el.style.pointerEvents="none";
      }
    });
  }
  sweep(); setInterval(sweep,1500);
}

function addTableTutorial(scene, root){
  const group=new THREE.Group(); group.name="PHASE137_TABLE_WALKUP_TUTORIAL_CLUSTER"; group.position.set(3.2,1.45,1.2); group.rotation.y=-0.55; root.add(group);
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.35,1.05),new THREE.MeshBasicMaterial({map:makeTextTexture(["HOW TO PLAY", "Walk to table", "Aim at poker buttons", "Trigger / pinch release selects", "Tutorial fades after use"],"#7ffcff"),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE137_TABLE_TUTORIAL_PANEL"; panel.renderOrder=960; group.add(panel);
  const base=new THREE.Mesh(new THREE.BoxGeometry(2.48,.08,.12),makeMat(GOLD,.88)); base.name="PHASE137_TABLE_TUTORIAL_STAND"; base.position.y=-.62; group.add(base);
}

function addStorefrontLevels(scene, root){
  const frameMat=makeMat(GOLD,.94,.05);
  const glassMat=new THREE.MeshStandardMaterial({color:GLASS,transparent:true,opacity:.17,roughness:.18,metalness:.02,emissive:GLASS,emissiveIntensity:.08,side:THREE.DoubleSide,depthWrite:false});
  STORE_FRONTS.forEach(s=>{
    const g=new THREE.Group(); g.name=`PHASE137_FORWARD_STOREFRONT_${s.key.toUpperCase()}`; g.position.set(s.x,0,s.z); g.rotation.y=s.ry; root.add(g);
    [1.15, SECOND_FLOOR_Y+1.05].forEach((cy,level)=>{
      const w=level?3.1:3.65, h=level?1.45:2.05;
      const levelName=level?"UPSTAIRS":"DOWNSTAIRS";
      const fg=new THREE.Group(); fg.name=`PHASE137_${levelName}_STOREFRONT_FRAME_${s.key.toUpperCase()}`; fg.position.y=cy; g.add(fg);
      const top=new THREE.Mesh(new THREE.BoxGeometry(w,.08,.10),frameMat); top.position.set(0,h/2,0); fg.add(top);
      const bot=new THREE.Mesh(new THREE.BoxGeometry(w,.08,.10),frameMat); bot.position.set(0,-h/2,0); fg.add(bot);
      const l=new THREE.Mesh(new THREE.BoxGeometry(.08,h,.10),frameMat); l.position.set(-w/2,0,0); fg.add(l);
      const r=new THREE.Mesh(new THREE.BoxGeometry(.08,h,.10),frameMat); r.position.set(w/2,0,0); fg.add(r);
      const glass=new THREE.Mesh(new THREE.PlaneGeometry(w-.18,h-.18),glassMat); glass.name=`PHASE137_${levelName}_GLASS_${s.key.toUpperCase()}`; glass.position.z=.035; fg.add(glass);
      if(!level){
        const label=new THREE.Mesh(new THREE.PlaneGeometry(1.55,.52),new THREE.MeshBasicMaterial({map:makeTextTexture([s.label,"PORTAL WINDOW"],`#${s.color.toString(16).padStart(6,"0")}`),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
        label.name=`PHASE137_STOREFRONT_LABEL_${s.key.toUpperCase()}`; label.position.set(0,h/2+.42,.06); label.renderOrder=970; fg.add(label);
      }
    });
  });
  const grand=new THREE.Mesh(new THREE.PlaneGeometry(5.8,.82),new THREE.MeshBasicMaterial({map:makeTextTexture(["SVR GRAND LOBBY", "UPSTAIRS • DOWNSTAIRS STOREFRONTS"],"#ffd98a"),transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  grand.name="PHASE137_SVR_GRAND_LOBBY_FORWARD_SIGN"; grand.position.set(0,5.12,-17.05); grand.renderOrder=975; root.add(grand);
}

function installFloorHeightLock(){
  const stairFn=(x,z)=>{
    const ax=Math.abs(x);
    if(ax>=11.6 && ax<=18.8 && z<=8.25 && z>=-10.25){
      const u=THREE.MathUtils.clamp((8.25-z)/18.5,0,1);
      return Number((u*SECOND_FLOOR_Y).toFixed(3));
    }
    if(z<=-10.25 && z>=-18.6 && ax<=21.5) return SECOND_FLOOR_Y;
    if(ax>=14.4 && ax<=20.5 && z<=8.25 && z>=-13.6) return SECOND_FLOOR_Y;
    return 0;
  };
  window.SVR_PHASE227_FLOOR_HEIGHT=stairFn;
  window.SVR_PHASE137_FLOOR_HEIGHT=stairFn;
}

function addConnectedStairs(scene, root){
  const mat=makeMat(RED,.96,.06); const edge=makeMat(GOLD,.92,.04); const glass=makeMat(GLASS,.22,.10);
  [-14.9,14.9].forEach((x,sideIdx)=>{
    const side=sideIdx?"RIGHT":"LEFT";
    const g=new THREE.Group(); g.name=`PHASE137_CONNECTED_RED_STAIR_${side}`; g.position.set(x,0,0); root.add(g);
    for(let i=0;i<16;i++){
      const u=i/15; const z=7.75 + (-17.65*u); const y=.055 + SECOND_FLOOR_Y*u;
      const step=new THREE.Mesh(new THREE.BoxGeometry(4.05,.10,.78),mat); step.name=`PHASE137_RED_STAIR_STEP_${side}_${i}`; step.position.set(0,y,z); step.userData.phase137Walkable=true; g.add(step);
      const nosing=new THREE.Mesh(new THREE.BoxGeometry(4.12,.045,.055),edge); nosing.name=`PHASE137_STAIR_GOLD_NOSING_${side}_${i}`; nosing.position.set(0,y+.08,z-.39); g.add(nosing);
    }
    const ramp=new THREE.Mesh(new THREE.BoxGeometry(4.16,.055,18.85),mat); ramp.name=`PHASE137_CONTINUOUS_RED_STAIR_RAMP_${side}`; ramp.position.set(0,1.72,-1.05); ramp.rotation.x=-0.184; ramp.userData.phase137Walkable=true; ramp.material.opacity=.76; ramp.material.transparent=true; g.add(ramp);
    [-2.18,2.18].forEach(rx=>{ const rail=new THREE.Mesh(new THREE.BoxGeometry(.07,.78,18.9),edge); rail.name=`PHASE137_CONNECTED_STAIR_RAIL_${side}`; rail.position.set(rx,2.05,-1.05); rail.rotation.x=-0.184; g.add(rail); });
  });
  const deck=new THREE.Mesh(new THREE.BoxGeometry(33,.08,7.8),mat); deck.name="PHASE137_CONNECTED_SECOND_FLOOR_RED_CARPET_DECK"; deck.position.set(0,SECOND_FLOOR_Y+.04,-14.05); deck.userData.phase137Walkable=true; root.add(deck);
  const safety=new THREE.Mesh(new THREE.BoxGeometry(34,.9,.08),glass); safety.name="PHASE137_SINGLE_CLEAN_GLASS_UPSTAIRS_RAIL"; safety.position.set(0,SECOND_FLOOR_Y+.64,-9.85); root.add(safety);
}

function moonTexture(){
  const c=document.createElement("canvas"); c.width=512; c.height=512; const x=c.getContext("2d");
  const grd=x.createRadialGradient(190,170,20,256,256,270); grd.addColorStop(0,"#ffffff"); grd.addColorStop(.4,"#d8d9d2"); grd.addColorStop(1,"#5f605e");
  x.fillStyle=grd; x.beginPath(); x.arc(256,256,246,0,Math.PI*2); x.fill();
  const craters=[[160,150,34],[285,125,22],[340,232,45],[205,310,50],[300,365,28],[120,260,24],[405,338,36],[245,225,18]];
  craters.forEach(([cx,cy,r],i)=>{ const g=x.createRadialGradient(cx-r*.35,cy-r*.35,2,cx,cy,r); g.addColorStop(0,"rgba(255,255,255,.28)"); g.addColorStop(.45,"rgba(80,80,80,.22)"); g.addColorStop(1,"rgba(0,0,0,.08)"); x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,Math.PI*2); x.fill(); });
  x.globalCompositeOperation="destination-in"; x.beginPath(); x.arc(256,256,246,0,Math.PI*2); x.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function marsTexture(){
  const c=document.createElement("canvas"); c.width=256; c.height=256; const x=c.getContext("2d");
  const g=x.createRadialGradient(80,70,8,128,128,140); g.addColorStop(0,"#ffd0a1"); g.addColorStop(.45,"#c94f2f"); g.addColorStop(1,"#4d140d"); x.fillStyle=g; x.beginPath(); x.arc(128,128,118,0,Math.PI*2); x.fill();
  x.fillStyle="rgba(80,20,10,.28)"; for(let i=0;i<22;i++){ x.beginPath(); x.ellipse(40+Math.random()*170,45+Math.random()*160,8+Math.random()*25,3+Math.random()*12,Math.random()*3,0,Math.PI*2); x.fill(); }
  x.globalCompositeOperation="destination-in"; x.beginPath(); x.arc(128,128,118,0,Math.PI*2); x.fill();
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}
function addCleanSky(scene, root){
  hideByName(scene,/MOON.*RING|MARS.*RING|PLANET.*RING|CELESTIAL.*RING|ORBIT.*RING|ORBIT_PATH|PHASE.*MOON|PHASE.*MARS|MOON|MARS/i,/PHASE137/i);
  const moon=new THREE.Mesh(new THREE.SphereGeometry(3.25,64,64),new THREE.MeshBasicMaterial({map:moonTexture(),transparent:false}));
  moon.name="PHASE137_CLEAN_TEXTURED_MOON_SOLID"; moon.position.copy(MOON_POS); moon.renderOrder=10; root.add(moon);
  const moonGlow=new THREE.Mesh(new THREE.SphereGeometry(3.75,64,64),new THREE.MeshBasicMaterial({color:0xbfd9ff,transparent:true,opacity:.12,side:THREE.BackSide,depthWrite:false,blending:THREE.AdditiveBlending}));
  moonGlow.name="PHASE137_MOON_SOFT_GLOW_NO_RING"; moonGlow.position.copy(MOON_POS); root.add(moonGlow);
  const mars=new THREE.Mesh(new THREE.SphereGeometry(1,48,48),new THREE.MeshBasicMaterial({map:marsTexture()}));
  mars.name="PHASE137_MARS_ORBITING_MOON_SCALE_WITH_DEPTH"; root.add(mars);
  const light=new THREE.PointLight(0xd7e7ff,.8,32,2); light.name="PHASE137_MOON_SOFT_LIGHT"; light.position.copy(MOON_POS); root.add(light);
  const prevTick=scene.userData._tickWorld;
  scene.userData._tickWorld=(dt)=>{
    try{ prevTick?.(dt); }catch{}
    const t=performance.now()*0.00012;
    moon.rotation.y += dt*.025;
    const zOff=Math.cos(t)*MARS_ORBIT_R;
    const xOff=Math.sin(t)*MARS_ORBIT_R;
    const yOff=Math.sin(t*1.7)*1.15;
    mars.position.set(MOON_POS.x+xOff, MOON_POS.y+yOff, MOON_POS.z+zOff);
    const near=THREE.MathUtils.clamp((zOff+MARS_ORBIT_R)/(MARS_ORBIT_R*2),0,1);
    const s=THREE.MathUtils.lerp(.62,1.42,near);
    mars.scale.setScalar(s);
    mars.rotation.y += dt*.18;
    window.SVR_PHASE137_SKY_ORBIT_STATUS={build:LABEL,moon:[MOON_POS.x,MOON_POS.y,MOON_POS.z],marsScale:Number(s.toFixed(2)),marsZ:Number(mars.position.z.toFixed(2)),checkedAt:new Date().toISOString()};
  };
}

function cleanupScene(scene){
  let hidden=0;
  hidden += hideByName(scene,/PHASE13[0-6].*(BOARD|RING|CHECKLIST|WORKFLOW|PACKAGE|ARTIFACT|READY|MANUAL|FLOOR_RING)|HOTKEY|PRESS_R|WAITING.*CARD|DEMO.*TEST|QA_CHECK|DIAGNOSTIC|DEBUG/i);
  hidden += hideByName(scene,/BLACK.*STAIR|STAIR.*BLACK|DUPLICATE.*STAIR|PHASE136_SOLID_RED_CARPET_STAIR|PHASE136_UPSTAIRS_RED_CARPET_BALCONY|PHASE136_STAIR|PHASE136_UPSTAIRS|GLASS.*FENCE|FENCE.*DUPLICATE|PHASE.*FENCE/i);
  hidden += hideByName(scene,/FACE_OVERLAY|HUD_OVERLAY|SCREEN_OVERLAY|BLACK_SQUARE|XR_BLACK|CAMERA_OVERLAY|TRANSPARENT_OVERLAY/i);
  if(isPreview()) hidden += hideByName(scene,/TAG|PILL|NAME_LABEL|STATUS_BOARD|HELP|TUTORIAL|PHASE12[0-9].*PANEL|PHASE13[0-6].*PANEL/i,/PHASE137_SVR_GRAND_LOBBY_FORWARD_SIGN|PHASE137_CLEAN|PHASE137_FORWARD/i);
  return hidden;
}

function qa(scene){
  return {
    build: LABEL,
    root: !!scene?.getObjectByName?.(ROOT),
    phaseBadge: !!document.getElementById("svrPhaseBadge"),
    fistTeleport: !!window.SVR_PHASE137_FIST_ARMED_TELEPORT_RELEASE_COMMIT_LOCK,
    tutorialAtTable: !!scene?.getObjectByName?.("PHASE137_TABLE_TUTORIAL_PANEL"),
    connectedStairs: count(scene,/PHASE137_CONNECTED_RED_STAIR|PHASE137_CONTINUOUS_RED_STAIR_RAMP/),
    cleanMoon: !!scene?.getObjectByName?.("PHASE137_CLEAN_TEXTURED_MOON_SOLID"),
    marsOrbit: !!scene?.getObjectByName?.("PHASE137_MARS_ORBITING_MOON_SCALE_WITH_DEPTH"),
    storefrontLevels: count(scene,/PHASE137_.*STOREFRONT_FRAME/),
    blackOverlaysRemaining: count(scene,/BLACK_SQUARE|XR_BLACK|FACE_OVERLAY|CAMERA_OVERLAY/),
    siteTouched:false,
    checkedAt:new Date().toISOString()
  };
}

function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  removeOldRoot(scene);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  installDomOverlayGuard();
  installFloorHeightLock();
  const hidden=cleanupScene(scene);
  addTableTutorial(scene, root);
  addStorefrontLevels(scene, root);
  addConnectedStairs(scene, root);
  addCleanSky(scene, root);
  window.SVR_PHASE137_VR_SPAWN_DECLUTTER_FIST_SKY_STAIRS_PREVIEW_LOCK={
    build: LABEL,
    active:true,
    hidden,
    tutorialMovedToTable:true,
    fistTeleportArmRequired:true,
    blackOverlayGuard:true,
    connectedRedStairs:true,
    storefrontGapForwardFix:true,
    cleanCamera3Preview:isPreview(),
    moonMarsRebuilt:true,
    siteTouched:false,
    publicRootTouched:false,
    checkedAt:new Date().toISOString()
  };
  window.SVR_RUN_PHASE137_VR_CLEANUP_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>50) clearInterval(timer); },250);
[800,1700,3000,5500,8500,13000].forEach(d=>setTimeout(install,d));
