import * as THREE from "three";

const LABEL = "PHASE-138-CLEAN-VIEW-SINGLE-STAIR-LOCK";
const ROOT = "PHASE138_CLEAN_VIEW_SINGLE_STAIR_ROOT";
const STAIR_Y = 3.42;
const RED = 0xb20f24;
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const GLASS = 0x8fdcff;

const PANEL_IDS = [
  "svr-phase321-stability-panel",
  "svr-phase322-final-panel",
  "svr-phase323-package-panel",
  "svr-phase324-version-panel"
];

function mat(color, opacity=1, emissive=.04){
  return new THREE.MeshStandardMaterial({color,roughness:.46,metalness:.12,transparent:opacity<1,opacity,emissive:color,emissiveIntensity:emissive,side:THREE.DoubleSide,depthWrite:opacity>=.55});
}
function conceal(o){ if(!o) return false; o.visible=false; o.userData.phase138Concealed=true; return true; }
function sweepPanels(){
  let removed=0;
  PANEL_IDS.forEach(id=>{ const el=document.getElementById(id); if(el){ el.remove(); removed++; } });
  Array.from(document.querySelectorAll("body *")).forEach(el=>{
    const id=String(el.id||""), cls=String(el.className||""), txt=String(el.textContent||"").slice(0,180);
    const hit=/phase32[1-4]|update\s*3\.1|game\.zip export|final prep|version sync|stability qa/i.test(`${id} ${cls} ${txt}`);
    if(!hit) return;
    const cs=getComputedStyle(el);
    if(cs.position==="fixed" || cs.position==="absolute" || /panel|hud|overlay/i.test(`${id} ${cls}`)){ el.remove(); removed++; }
  });
  window.SVR_PHASE138_CLEAN_VIEW_PANELS_REMOVED=(window.SVR_PHASE138_CLEAN_VIEW_PANELS_REMOVED||0)+removed;
  return removed;
}
function installDomShield(){
  let style=document.getElementById("phase138-clean-view-style");
  if(!style){
    style=document.createElement("style"); style.id="phase138-clean-view-style";
    style.textContent=`
      #svr-phase321-stability-panel,#svr-phase322-final-panel,#svr-phase323-package-panel,#svr-phase324-version-panel,
      [id*="phase321"],[id*="phase322"],[id*="phase323"],[id*="phase324"],[id*="update31"],
      [class*="phase321"],[class*="phase322"],[class*="phase323"],[class*="phase324"],[class*="update31"]{
        display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;
      }
      #svrPhaseBadge{position:fixed;left:10px;top:10px;z-index:9999;padding:8px 12px;border:1px solid rgba(127,252,255,.75);border-radius:999px;background:rgba(0,0,0,.56);color:#bffcff;font:900 12px system-ui,Arial;letter-spacing:.08em;pointer-events:none;box-shadow:0 0 18px rgba(127,252,255,.2)}
    `;
    document.head.appendChild(style);
  }
  let badge=document.getElementById("svrPhaseBadge");
  if(!badge){ badge=document.createElement("div"); badge.id="svrPhaseBadge"; document.body.appendChild(badge); }
  badge.textContent="PHASE 138 • CLEAN VIEW";
  sweepPanels();
  if(!window.SVR_PHASE138_CLEAN_VIEW_OBSERVER){
    const obs=new MutationObserver(()=>sweepPanels());
    obs.observe(document.documentElement,{childList:true,subtree:true});
    window.SVR_PHASE138_CLEAN_VIEW_OBSERVER=true;
  }
}
function concealOldStairs(scene){
  let hidden=0;
  const re=/STAIR|RAMP|UPSTAIRS_RED|RED_CARPET_STAIR|BLACK.*STEP|STEP_.*BLACK|GLASS.*FENCE|FENCE|BALCONY_SURFACE|WALKWAY|PHASE136|PHASE137_CONNECTED|PHASE137_RED_STAIR|PHASE138_SINGLE_RED_STAIR|PHASE138_RED_ONLY_STEP|PHASE138_ALIGNED_UPSTAIRS|PHASE138_SINGLE_ALIGNED/i;
  scene?.traverse?.(o=>{
    const name=String(o.name||"");
    if(/PHASE138_PLAN_SINGLE|PHASE138_PLAN_STAIR|PHASE138_PLAN_UPSTAIRS|PHASE138_PLAN_GLASS/i.test(name)) return;
    if(re.test(name)){ conceal(o); hidden++; }
  });
  window.SVR_PHASE138_OLD_STAIR_OBJECTS_CONCEALED=hidden;
  return hidden;
}
function installFloorHeight(){
  const fn=(x,z)=>{
    const localX=x-14.8;
    if(Math.abs(localX)<=2.35 && z<=7.8 && z>=-10.2) return THREE.MathUtils.clamp((7.8-z)/18.0,0,1)*STAIR_Y;
    if(Math.abs(x)<=18.6 && z<=-10.2 && z>=-17.2) return STAIR_Y;
    return 0;
  };
  window.SVR_PHASE227_FLOOR_HEIGHT=fn;
  window.SVR_PHASE137_FLOOR_HEIGHT=fn;
  window.SVR_PHASE138_FLOOR_HEIGHT=fn;
}
function addSingleStair(root){
  const group=new THREE.Group(); group.name="PHASE138_PLAN_SINGLE_GRAND_STAIR_RIGHT_SIDE"; group.position.set(14.8,0,0); root.add(group);
  const stairMat=mat(RED,.98,.055), goldMat=mat(GOLD,.94,.045), glassMat=mat(GLASS,.25,.10);
  const width=4.55, steps=18;
  for(let i=0;i<steps;i++){
    const u=i/(steps-1), z=7.8+(-18.0*u), y=.06+STAIR_Y*u;
    const step=new THREE.Mesh(new THREE.BoxGeometry(width,.11,.72),stairMat); step.name=`PHASE138_PLAN_STAIR_RED_STEP_${i}`; step.position.set(0,y,z); step.userData.phase138Walkable=true; group.add(step);
    const edge=new THREE.Mesh(new THREE.BoxGeometry(width+.06,.045,.055),goldMat); edge.name=`PHASE138_PLAN_STAIR_GOLD_NOSING_${i}`; edge.position.set(0,y+.09,z-.36); group.add(edge);
  }
  const ramp=new THREE.Mesh(new THREE.BoxGeometry(width+.08,.06,18.75),stairMat); ramp.name="PHASE138_PLAN_STAIR_CONTINUOUS_WALKABLE_RED_RAMP"; ramp.position.set(0,1.72,-1.2); ramp.rotation.x=-0.187; ramp.material.transparent=true; ramp.material.opacity=.72; ramp.userData.phase138Walkable=true; group.add(ramp);
  [-2.42,2.42].forEach(x=>{ const rail=new THREE.Mesh(new THREE.BoxGeometry(.085,.72,18.85),goldMat); rail.name="PHASE138_PLAN_STAIR_SINGLE_GOLD_RAIL"; rail.position.set(x,2.07,-1.2); rail.rotation.x=-0.187; group.add(rail); });
  const landing=new THREE.Mesh(new THREE.BoxGeometry(width+.35,.10,2.25),stairMat); landing.name="PHASE138_PLAN_STAIR_TOP_LANDING_CONNECTED"; landing.position.set(0,STAIR_Y+.06,-10.65); landing.userData.phase138Walkable=true; group.add(landing);
  const deck=new THREE.Mesh(new THREE.BoxGeometry(34,.10,6.8),stairMat); deck.name="PHASE138_PLAN_UPSTAIRS_DECK_SINGLE_CONNECTED_RED_CARPET"; deck.position.set(0,STAIR_Y+.05,-14.0); deck.userData.phase138Walkable=true; root.add(deck);
  const rail=new THREE.Mesh(new THREE.BoxGeometry(34.4,.86,.08),glassMat); rail.name="PHASE138_PLAN_GLASS_RAIL_SINGLE_CLEAN_BALCONY"; rail.position.set(0,STAIR_Y+.64,-10.2); root.add(rail);
}
function addSmallLabel(root){
  const c=document.createElement("canvas"); c.width=900; c.height=260; const x=c.getContext("2d");
  x.fillStyle="rgba(0,0,0,.68)"; x.fillRect(0,0,c.width,c.height); x.strokeStyle="#7ffcff"; x.lineWidth=8; x.strokeRect(20,20,c.width-40,c.height-40);
  x.textAlign="center"; x.textBaseline="middle"; x.fillStyle="#fff8df"; x.font="900 42px system-ui,Arial"; x.fillText("ONE CLEAN STAIR ROUTE",450,88,820);
  x.fillStyle="#bffcff"; x.font="800 26px system-ui,Arial"; x.fillText("Update panels removed • storefront view open",450,158,820);
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace;
  const panel=new THREE.Mesh(new THREE.PlaneGeometry(2.75,.78),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  panel.name="PHASE138_PLAN_SMALL_CONFIRMATION_LABEL"; panel.position.set(8.8,2.05,2.3); panel.rotation.y=-0.65; panel.renderOrder=990; root.add(panel);
}
function count(scene,re){let n=0;scene?.traverse?.(o=>{if(re.test(String(o.name||""))&&o.visible!==false)n++;});return n;}
function qa(scene){
  const state={build:LABEL,panelIdsPresent:PANEL_IDS.filter(id=>!!document.getElementById(id)),panelsRemoved:window.SVR_PHASE138_CLEAN_VIEW_PANELS_REMOVED||0,oldStairsConcealed:window.SVR_PHASE138_OLD_STAIR_OBJECTS_CONCEALED||0,singleStairSteps:count(scene,/PHASE138_PLAN_STAIR_RED_STEP/),singleDeck:!!scene?.getObjectByName?.("PHASE138_PLAN_UPSTAIRS_DECK_SINGLE_CONNECTED_RED_CARPET"),oldVisibleStairs:count(scene,/PHASE136.*STAIR|PHASE137.*STAIR|BLACK.*STAIR|DUPLICATE.*STAIR/),siteTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_PHASE138_CLEAN_VIEW_SINGLE_STAIR_STATE=state;
  return state;
}
function install(){
  const scene=window.__SVR_SCENE__; if(!scene) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  installDomShield(); installFloorHeight(); concealOldStairs(scene); addSingleStair(root); addSmallLabel(root);
  window.SVR_PHASE138_CLEAN_VIEW_SINGLE_STAIR_LOCK={build:LABEL,active:true,update31PanelsRemoved:true,oneStairOnly:true,singleStairName:"PHASE138_PLAN_SINGLE_GRAND_STAIR_RIGHT_SIDE",siteTouched:false,publicRootTouched:false,checkedAt:new Date().toISOString()};
  window.SVR_RUN_PHASE138_CLEAN_VIEW_QA=()=>qa(scene);
  window.SVR_LIVE_BUILD_POINTER=LABEL; window.SVR_LOCKED_FINAL_BUILD=LABEL; qa(scene); return true;
}
install();
let tries=0;
const timer=setInterval(()=>{tries++;sweepPanels();if(install()||tries>60)clearInterval(timer);},250);
[600,1200,2500,5000,9000,14000].forEach(d=>setTimeout(()=>{sweepPanels();install();},d));
