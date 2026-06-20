import * as THREE from "three";

const LABEL = "PHASE-135-VR-PLAYABILITY-DECLUTTER-LOBBY-LOCK";
const ROOT = "PHASE135_VR_PLAYABILITY_DECLUTTER_ROOT";
const DUP = "PHASE103_MAIN_TABLE_SURFACE";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GREEN = 0x86ffb7;
const RED = 0xff5b8c;
const GLASS = 0x8fdcff;

const STORE_FRAMES = [
  { key:"wellness", x:-16.2, z:-18.58, y:1.85, w:3.8, h:2.35, ry:0, label:"WELLNESS" },
  { key:"pga", x:16.2, z:-18.58, y:1.85, w:3.8, h:2.35, ry:0, label:"PGA RANGE" },
  { key:"store", x:23.05, z:5.8, y:1.75, w:3.45, h:2.2, ry:-Math.PI/2, label:"SVR STORE" },
  { key:"scorpion", x:23.05, z:-8.8, y:1.75, w:3.45, h:2.2, ry:-Math.PI/2, label:"SCORPION" },
  { key:"lounge", x:-23.05, z:5.8, y:1.75, w:3.45, h:2.2, ry:Math.PI/2, label:"LOUNGE" },
  { key:"vibes", x:-23.05, z:-8.8, y:1.75, w:3.45, h:2.2, ry:Math.PI/2, label:"THEATER" }
];

function count(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||"")) && o.visible !== false) n++; }); return n; }
function hideName(scene,re){ let n=0; scene?.traverse?.((o)=>{ if(re.test(String(o.name||""))){ o.visible=false; o.userData.phase135HiddenClutter=true; n++; } }); return n; }
function removeDuplicateTable(scene){ let removed=0; let dup=scene?.getObjectByName?.(DUP); while(dup){ dup.parent?.remove(dup); removed++; dup=scene.getObjectByName(DUP); } return removed; }
function material(color,opacity=1){ return new THREE.MeshStandardMaterial({ color, roughness:.42, metalness:.15, transparent:opacity<1, opacity, emissive:color, emissiveIntensity:.035 }); }
function makeCanvasText(lines, opts={}){
  const c=document.createElement("canvas"); c.width=900; c.height=360; const x=c.getContext("2d");
  x.fillStyle="rgba(0,0,0,.72)"; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle=opts.color||"#7ffcff"; x.lineWidth=8; x.strokeRect(22,22,c.width-44,c.height-44);
  x.strokeStyle="rgba(255,217,138,.75)"; x.lineWidth=4; x.strokeRect(48,48,c.width-96,c.height-96);
  x.textAlign="center"; x.textBaseline="middle"; x.shadowColor=opts.color||"#7ffcff"; x.shadowBlur=16;
  x.fillStyle="#fff8df"; x.font="900 48px system-ui,Arial"; x.fillText(lines[0]||"SVR",c.width/2,92,c.width-90);
  x.shadowBlur=6; x.font="800 30px system-ui,Arial"; x.fillStyle="#bffcff";
  for(let i=1;i<lines.length;i++) x.fillText(lines[i],c.width/2,92+i*54,c.width-90);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=4; return tex;
}
function addPhaseBadge(){
  let badge=document.getElementById("svrPhaseBadge");
  if(!badge){ badge=document.createElement("div"); badge.id="svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent="PHASE 135 • PLAYABILITY CLEANUP";
  Object.assign(badge.style,{position:"fixed",top:"10px",left:"10px",zIndex:"9999",padding:"8px 12px",border:"1px solid rgba(127,252,255,.75)",borderRadius:"999px",background:"rgba(0,0,0,.62)",color:"#bffcff",font:"900 12px system-ui,Arial",letterSpacing:".08em",pointerEvents:"none",boxShadow:"0 0 18px rgba(127,252,255,.20)"});
}
function cleanDom(){
  addPhaseBadge();
  const log=document.getElementById("log"), err=document.getElementById("err"), hud=document.getElementById("hud"), nav=document.getElementById("sceneNav");
  if(log) log.style.display="none";
  if(err) err.style.display="none";
  if(hud) hud.style.display="none";
  if(nav) nav.style.display="none";
  document.title="Scarlett Poker VR • Phase 135";
}
function addLighting(scene){
  const root=scene.getObjectByName(ROOT);
  const amb=new THREE.AmbientLight(0x9ebcff,.72); amb.name="PHASE135_SOFT_AMBIENT_LIGHT"; root.add(amb);
  const key=new THREE.DirectionalLight(0xffe7b0,1.15); key.name="PHASE135_LOBBY_KEY_LIGHT"; key.position.set(0,8,7); root.add(key);
  const table=new THREE.PointLight(0xffd98a,1.15,12,1.7); table.name="PHASE135_TABLE_SOFT_LIGHT"; table.position.set(0,3.6,-1.7); root.add(table);
  const store=new THREE.PointLight(0x7ffcff,.8,16,1.8); store.name="PHASE135_STOREFRONT_SOFT_LIGHT"; store.position.set(0,4.2,-10); root.add(store);
}
function addCompactTableHelp(scene){
  const root=scene.getObjectByName(ROOT);
  const tex=makeCanvasText(["QUEST POKER", "Point at button", "Trigger or pinch selects", "Desktop: F C V R A H"],{color:"#7ffcff"});
  const p=new THREE.Mesh(new THREE.PlaneGeometry(2.05,.82),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  p.name="PHASE135_COMPACT_TABLE_CONTROL_HELP";
  p.position.set(-2.65,1.85,1.55);
  p.rotation.y=.36;
  p.renderOrder=998;
  root.add(p);
}
function addStoreFrames(scene){
  const root=scene.getObjectByName(ROOT);
  const frameMat=material(GOLD,.94), glassMat=new THREE.MeshStandardMaterial({color:GLASS,transparent:true,opacity:.18,roughness:.18,metalness:.02,emissive:GLASS,emissiveIntensity:.08,side:THREE.DoubleSide});
  STORE_FRAMES.forEach((s)=>{
    const g=new THREE.Group(); g.name=`PHASE135_STOREFRONT_FRAME_${s.key.toUpperCase()}`; g.position.set(s.x,0,s.z); g.rotation.y=s.ry; root.add(g);
    const top=new THREE.Mesh(new THREE.BoxGeometry(s.w,.08,.08),frameMat); top.position.set(0,s.y+s.h/2,0); g.add(top);
    const bot=new THREE.Mesh(new THREE.BoxGeometry(s.w,.08,.08),frameMat); bot.position.set(0,s.y-s.h/2,0); g.add(bot);
    const l=new THREE.Mesh(new THREE.BoxGeometry(.08,s.h,.08),frameMat); l.position.set(-s.w/2,s.y,0); g.add(l);
    const r=new THREE.Mesh(new THREE.BoxGeometry(.08,s.h,.08),frameMat); r.position.set(s.w/2,s.y,0); g.add(r);
    const glass=new THREE.Mesh(new THREE.PlaneGeometry(s.w-.22,s.h-.22),glassMat); glass.position.set(0,s.y,.025); glass.name=`PHASE135_GLASS_STOREFRONT_${s.key.toUpperCase()}`; g.add(glass);
    const signTex=makeCanvasText([s.label,"WINDOW PREVIEW"],{color:"#ffd98a"});
    const sign=new THREE.Mesh(new THREE.PlaneGeometry(1.45,.58),new THREE.MeshBasicMaterial({map:signTex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    sign.position.set(0,s.y+s.h/2+.38,.04); sign.name=`PHASE135_STOREFRONT_HEADER_${s.key.toUpperCase()}`; g.add(sign);
  });
}
function tableCardCleanup(scene){
  let adjusted=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/CARD|COMMUNITY|HOLE/i.test(n) && o.isMesh && !/BOARD|SIGN|TEXT|PROMPT|PANEL/i.test(n)){
      if(o.position.y > .86 || o.position.y < .45){ o.position.y = .62; adjusted++; }
      o.renderOrder = Math.max(o.renderOrder||0, 260);
      o.userData.phase135CardTableSurface=true;
    }
  });
  return adjusted;
}
function skyCleanup(scene){
  let hidden=0;
  hidden += hideName(scene,/PHASE.*CEILING|CEILING|LOW_ROOF|ROOF_PANEL|CANOPY/i);
  hidden += hideName(scene,/MOON.*RING|MARS.*RING|PLANET.*RING|ORBIT_RING|ORBIT_PATH|CELESTIAL_RING/i);
  return hidden;
}
function declutter(scene){
  let hidden=0;
  hidden += hideName(scene,/PHASE12[6-9].*QA|PHASE13[0-4].*(BOARD|RING)|PHASE133_ARTIFACT|PHASE132_PACKAGE|PHASE131_MANUAL|PHASE130_PRODUCTION/i);
  hidden += hideName(scene,/HOTKEY|PRESS_R|PRESS R|WAITING_FOR_CARD_EVENT|WAITING.*CARD|DEMO_READY|QA_CHECK|PACKAGE_PREP|ARTIFACT_WORKFLOW/i);
  hidden += hideName(scene,/PHASE124.*HELP|PHASE124.*STRIP|PHASE124.*HOTKEY|PHASE123.*STATUS|PHASE122.*STATUS/i);
  return hidden;
}
function protectCore(scene){
  let protectedObjects=0;
  scene?.traverse?.((o)=>{
    const n=String(o.name||"");
    if(/POKER|TABLE|CARD|CHIP|ACTION|WATCH|HAND|TELEPORT|PORTAL|DOORWAY|MOON|MARS|SECOND_FLOOR|BALCONY|STAIR/i.test(n) && !o.userData.phase135HiddenClutter){
      o.visible=true;
      o.userData.phase135CoreProtected=true;
      if(o.isMesh){ o.frustumCulled=false; protectedObjects++; }
    }
  });
  return protectedObjects;
}
function qa(scene){
  return {
    build: LABEL,
    phaseBadge: !!document.getElementById("svrPhaseBadge"),
    oneTable: !scene?.getObjectByName?.(DUP),
    compactHelp: !!scene?.getObjectByName?.("PHASE135_COMPACT_TABLE_CONTROL_HELP"),
    storefrontFrames: count(scene,/PHASE135_STOREFRONT_FRAME/i),
    glassStorefronts: count(scene,/PHASE135_GLASS_STOREFRONT/i),
    clutterBoardsRemaining: count(scene,/PHASE13[0-4].*(BOARD|RING)|HOTKEY|WAITING.*CARD/i),
    movementControl: !!window.SVR_PHASE135_PLAYABILITY_MOVEMENT_CONTROL_LOCK,
    cardsOnSurfaceAdjusted: window.SVR_PHASE135_LAST_CARD_ADJUSTED || 0,
    siteTouched:false,
    checkedAt:new Date().toISOString()
  };
}
function install(){
  const scene=window.__SVR_SCENE__;
  if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  cleanDom();
  const removedDuplicateTable=removeDuplicateTable(scene);
  const hiddenClutter=declutter(scene);
  const hiddenSkyArtifacts=skyCleanup(scene);
  const adjustedCards=tableCardCleanup(scene);
  addLighting(scene);
  addCompactTableHelp(scene);
  addStoreFrames(scene);
  const protectedObjects=protectCore(scene);
  window.SVR_PHASE135_LAST_CARD_ADJUSTED=adjustedCards;
  window.SVR_PHASE135_VR_PLAYABILITY_DECLUTTER_LOBBY_LOCK={build:LABEL,active:true,removedDuplicateTable,hiddenClutter,hiddenSkyArtifacts,adjustedCards,protectedObjects,phaseBadge:true,siteTouched:false,publicRootTouched:false,pokerLogicTouched:false,watchTouched:false,movementWrapper:"movement_phase135_playability_control_lock",checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE135_PLAYABILITY_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0;
const timer=setInterval(()=>{ tries++; if(install() || tries>40) clearInterval(timer); },300);
[900,2000,4000,8000,12000].forEach((d)=>setTimeout(install,d));
