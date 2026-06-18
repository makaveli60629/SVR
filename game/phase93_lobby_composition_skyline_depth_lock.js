import * as THREE from "three";

const LABEL = "PHASE-93-LOBBY-COMPOSITION-SKYLINE-DEPTH-LOCK";
const ROOT = "PHASE93_LOBBY_COMPOSITION_SKYLINE_DEPTH_ROOT";
const GOLD = 0xffd98a;
const CYAN = 0x7ffcff;
const PURPLE = 0xbd7cff;
const DARK = 0x05070d;
let installed = false;

function basic(color, opacity=.32){
  return new THREE.MeshBasicMaterial({color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false});
}
function glow(color, opacity=.22){
  return new THREE.MeshBasicMaterial({color, transparent:true, opacity, side:THREE.DoubleSide, depthWrite:false, blending:THREE.AdditiveBlending});
}
function standard(color, roughness=.42, metalness=.18){
  return new THREE.MeshStandardMaterial({color, roughness, metalness, emissive:color, emissiveIntensity:.035});
}
function signTex(title, subtitle="", accent="#ffd98a"){
  const c=document.createElement("canvas"); c.width=1024; c.height=384;
  const ctx=c.getContext("2d");
  ctx.fillStyle="#04060d"; ctx.fillRect(0,0,c.width,c.height);
  const g=ctx.createLinearGradient(0,0,c.width,0); g.addColorStop(0,"rgba(189,124,255,.20)"); g.addColorStop(.5,"rgba(255,217,138,.16)"); g.addColorStop(1,"rgba(127,252,255,.18)");
  ctx.fillStyle=g; ctx.fillRect(24,24,976,336);
  ctx.strokeStyle=accent; ctx.lineWidth=10; ctx.strokeRect(32,32,960,320);
  ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#ffffff"; ctx.font="900 62px system-ui,Arial"; ctx.fillText(title,512,145);
  if(subtitle){ ctx.fillStyle="#bffcff"; ctx.font="800 30px system-ui,Arial"; ctx.fillText(subtitle,512,235); }
  const tex=new THREE.CanvasTexture(c); tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=2; return tex;
}
function addGrandBackWall(root){
  const wall=new THREE.Mesh(new THREE.PlaneGeometry(18.8,4.2), basic(0x070913,.78));
  wall.name="PHASE93_GRAND_REAR_WALL_DARK_COMPOSITION_BACKDROP"; wall.position.set(0,2.05,-8.72); wall.renderOrder=20; root.add(wall);
  const header=new THREE.Mesh(new THREE.PlaneGeometry(12.8,.62), new THREE.MeshBasicMaterial({map:signTex("SVR POKER", "Lobby • Portals • Play-Money Table", "#ffd98a"), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  header.name="PHASE93_GRAND_REAR_HEADER_SIGN"; header.position.set(0,3.78,-8.80); header.renderOrder=330; root.add(header);
  [-7.25,-3.65,3.65,7.25].forEach((x,i)=>{
    const pil=new THREE.Mesh(new THREE.BoxGeometry(.18,3.85,.14), standard(i%2?CYAN:GOLD,.34,.36));
    pil.name=`PHASE93_REAR_GOLD_CYAN_VERTICAL_DIVIDER_${i}`; pil.position.set(x,1.95,-8.58); pil.renderOrder=42; root.add(pil);
    const cap=new THREE.Mesh(new THREE.SphereGeometry(.18,18,12), glow(i%2?CYAN:GOLD,.30));
    cap.name=`PHASE93_REAR_DIVIDER_CAP_GLOW_${i}`; cap.position.set(x,3.92,-8.50); cap.renderOrder=335; root.add(cap);
  });
}
function addSideWallBands(root){
  [-9.86,9.86].forEach((x,side)=>{
    const wall=new THREE.Mesh(new THREE.PlaneGeometry(13.4,3.7), basic(0x070913,.46));
    wall.name=`PHASE93_SIDE_WALL_DARK_COMPOSITION_BAND_${side}`; wall.position.set(x,1.95,-1.05); wall.rotation.y=side===0?Math.PI/2:-Math.PI/2; wall.renderOrder=19; root.add(wall);
    [-4.8,0,4.8].forEach((z,i)=>{
      const trim=new THREE.Mesh(new THREE.BoxGeometry(.08,2.95,.09), standard(i%2?PURPLE:GOLD,.38,.28));
      trim.name=`PHASE93_SIDE_VERTICAL_TRIM_${side}_${i}`; trim.position.set(x,1.82,z); trim.renderOrder=43; root.add(trim);
    });
  });
}
function addSkylineDepth(root){
  const z=-10.85;
  const widths=[.72,1.1,.86,1.35,.94,.68,1.22,.78,1.05,1.42,.82,.98,1.18];
  const heights=[2.1,2.9,2.45,3.55,2.75,2.0,3.3,2.35,2.8,3.85,2.25,2.65,3.15];
  let x=-8.2;
  widths.forEach((w,i)=>{
    const h=heights[i];
    const b=new THREE.Mesh(new THREE.BoxGeometry(w,h,.22), new THREE.MeshStandardMaterial({color:i%3===0?0x10162a:i%3===1?0x141428:0x0d1325, roughness:.55, metalness:.08, emissive:i%2?0x071122:0x100719, emissiveIntensity:.22}));
    b.name=`PHASE93_DISTANT_SKYLINE_LAYER_BUILDING_${i}`; b.position.set(x+w/2,h/2+.42,z-(i%3)*.42); b.renderOrder=4; root.add(b);
    for(let r=0;r<Math.floor(h/.42);r++){
      for(let col=0;col<Math.max(1,Math.floor(w/.26));col++){
        if((r+col+i)%3) continue;
        const win=new THREE.Mesh(new THREE.PlaneGeometry(.055,.095), glow(i%2?CYAN:PURPLE,.30));
        win.name=`PHASE93_SKYLINE_WINDOW_${i}_${r}_${col}`; win.position.set(x+.16+col*.24,.72+r*.38,z-.13-(i%3)*.42); win.renderOrder=6; root.add(win);
      }
    }
    x += w + .22;
  });
  const moonHalo=new THREE.Mesh(new THREE.RingGeometry(.48,.78,64), glow(0xdce8ff,.18));
  moonHalo.name="PHASE93_HIGH_MOON_VISIBILITY_HALO_REFERENCE"; moonHalo.position.set(-5.75,5.45,-11.9); moonHalo.renderOrder=2; root.add(moonHalo);
  const marsHalo=new THREE.Mesh(new THREE.RingGeometry(.25,.42,48), glow(0xff7a4a,.18));
  marsHalo.name="PHASE93_HIGH_MARS_VISIBILITY_HALO_REFERENCE"; marsHalo.position.set(5.85,5.25,-12.2); marsHalo.renderOrder=2; root.add(marsHalo);
}
function addTableLoungeDepth(root){
  const railMat=standard(GOLD,.30,.42);
  [[-3.1,-2.65],[3.1,-2.65],[-3.1,1.15],[3.1,1.15]].forEach(([x,z],i)=>{
    const post=new THREE.Mesh(new THREE.CylinderGeometry(.055,.075,.88,24), railMat);
    post.name=`PHASE93_TABLE_AREA_GOLD_ROPE_POST_${i}`; post.position.set(x,.46,z); root.add(post);
    const glowTop=new THREE.Mesh(new THREE.SphereGeometry(.09,20,12), glow(GOLD,.34));
    glowTop.name=`PHASE93_TABLE_AREA_POST_TOP_GLOW_${i}`; glowTop.position.set(x,.93,z); glowTop.renderOrder=322; root.add(glowTop);
  });
  [[0,-2.65],[-3.1,-.75],[3.1,-.75],[0,1.15]].forEach(([x,z],i)=>{
    const line=new THREE.Mesh(new THREE.BoxGeometry(i%2? .055:6.2,.035,i%2?3.8:.055), new THREE.MeshBasicMaterial({color:GOLD,transparent:true,opacity:.48,depthWrite:false}));
    line.name=`PHASE93_TABLE_AREA_SUBTLE_GOLD_ROPE_${i}`; line.position.set(x,.88,z); line.renderOrder=321; root.add(line);
  });
}
function addPortalFloorGuides(root){
  const guides=[[-7.95,-7.35,PURPLE],[7.95,-7.35,CYAN],[9.25,3.15,GOLD],[11.65,-7.0,PURPLE],[0,-7.55,GOLD]];
  guides.forEach(([x,z,c],i)=>{
    const guide=new THREE.Mesh(new THREE.RingGeometry(.58,.72,64), glow(c,.18));
    guide.name=`PHASE93_PORTAL_FLOOR_GUIDE_UNIFIED_${i}`; guide.rotation.x=-Math.PI/2; guide.position.set(x,.092,z); guide.renderOrder=318; root.add(guide);
  });
}
function rebalanceExisting(scene){
  let moved=0, dimmed=0, protectedCount=0;
  scene.traverse((o)=>{
    const n=String(o.name||"").toUpperCase();
    if(/PILLAR|COLUMN|ARCH/.test(n) && /DISPLAY|SIGN|PANEL|PORTAL/.test(n)){
      o.renderOrder=Math.min(o.renderOrder||40,80); protectedCount++;
    }
    if(/SIGN|PANEL|PORTAL|WATCH|CARD|CHIP|ACTION/.test(n)){ o.renderOrder=Math.max(o.renderOrder||0,330); protectedCount++; }
    if(/SPRITE|DUST|FOG/.test(n) && o.material){
      const mats=Array.isArray(o.material)?o.material:[o.material];
      mats.forEach(m=>{ if(m?.opacity && m.opacity>.16){ m.opacity=.16; m.needsUpdate=true; dimmed++; }});
    }
    if(/PHASE92_PORTAL_SIGN|PHASE85_SOLID_ENABLED_PORTAL/.test(n) && o.position?.y && o.position.y<.1){ o.position.y += .005; moved++; }
  });
  return {moved, dimmed, protectedCount};
}
function install(){
  const scene=window.__SVR_SCENE__; const renderer=window.__SVR_RENDERER__;
  if(!scene || !renderer) return false;
  const old=scene.getObjectByName(ROOT); if(old) old.parent?.remove(old);
  const root=new THREE.Group(); root.name=ROOT; scene.add(root);
  addGrandBackWall(root);
  addSideWallBands(root);
  addSkylineDepth(root);
  addTableLoungeDepth(root);
  addPortalFloorGuides(root);
  const rebalance=rebalanceExisting(scene);
  renderer.toneMappingExposure=Math.min(renderer.toneMappingExposure||1,1.02);
  installed=true;
  window.SVR_PHASE93_LOBBY_COMPOSITION_SKYLINE_DEPTH_LOCK={
    build:LABEL,
    active:true,
    style:"luxury casino composition with rear wall depth, skyline layering, table lounge focus, portal guide rings",
    added:["grand rear wall","side wall bands","skyline depth layer","moon mars halo references","table lounge ropes","portal floor guides","sign/render balance"],
    rebalance,
    siteTouched:false,
    publicRootTouched:false,
    privateScenesTouched:false,
    pokerLogicTouched:false,
    movementTouched:false,
    watchTouched:false,
    questSafe:true,
    checkedAt:new Date().toISOString()
  };
  window.SVR_LIVE_BUILD_POINTER=LABEL;
  window.SVR_LOCKED_FINAL_BUILD=LABEL;
  return true;
}
install();
let tries=0; const timer=setInterval(()=>{ tries++; if(install()||tries>180) clearInterval(timer); },300);
[1200,2600,5200,9200,15000].forEach(d=>setTimeout(install,d));
