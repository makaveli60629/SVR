import * as THREE from "three";

function tex(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const x = c.getContext("2d");
  draw(x, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
function panelTexture(title, subtitle, accent="#58fff4", gold="#ffd56e"){
  return tex(1400, 760, (x,w,h)=>{
    const g=x.createLinearGradient(0,0,w,h); g.addColorStop(0,"#02080a"); g.addColorStop(.55,"#071416"); g.addColorStop(1,"#030305");
    x.fillStyle=g; x.fillRect(0,0,w,h);
    x.fillStyle="rgba(255,255,255,.045)"; x.fillRect(80,90,w-160,h-180);
    x.strokeStyle=accent; x.lineWidth=18; x.strokeRect(30,30,w-60,h-60);
    x.strokeStyle=gold; x.lineWidth=7; x.strokeRect(72,72,w-144,h-144);
    x.textAlign="center"; x.textBaseline="middle";
    x.shadowColor=accent; x.shadowBlur=22;
    x.fillStyle="#fff"; x.font="900 102px system-ui,Arial"; x.fillText(title,w/2,245,w-130);
    x.shadowBlur=0; x.fillStyle="#dffcf7"; x.font="900 48px system-ui,Arial"; x.fillText(subtitle,w/2,395,w-140);
    x.fillStyle="rgba(88,255,244,.12)"; x.fillRect(190,520,w-380,88);
    x.fillStyle=gold; x.font="900 34px system-ui,Arial"; x.fillText("REGISTRY CONTROLLED",w/2,565,w-250);
  });
}
function floorTexture(title, accent="#58fff4", gold="#ffd56e"){
  return tex(1024,1024,(x,w,h)=>{
    x.clearRect(0,0,w,h);
    const g=x.createRadialGradient(w/2,h/2,40,w/2,h/2,450); g.addColorStop(0,"rgba(255,255,255,.75)"); g.addColorStop(.34,accent.replace("#","rgba("));
    x.fillStyle=accent; x.globalAlpha=.24; x.fillRect(0,0,w,h); x.globalAlpha=1;
    x.strokeStyle=gold; x.lineWidth=18; x.beginPath(); x.arc(w/2,h/2,282,0,Math.PI*2); x.stroke();
    x.strokeStyle=accent; x.lineWidth=11; x.beginPath(); x.arc(w/2,h/2,216,0,Math.PI*2); x.stroke();
    x.textAlign="center"; x.textBaseline="middle"; x.fillStyle="#fff"; x.font="900 74px system-ui,Arial"; x.fillText(title,w/2,h/2+135,w-130);
  });
}
function makeBasicMaterial(color, emissive, intensity){
  return new THREE.MeshStandardMaterial({color, roughness:.48, metalness:.32, emissive, emissiveIntensity:intensity});
}
const HUBS = [
  {key:"wellness", target:"reiki", title:"WELLNESS HUB", subtitle:"LUXURY PLACEHOLDER", accent:"#7dffcc", gold:"#ffd56e", fallback:[0,0,-37]},
  {key:"pga", target:"pga", title:"PGA HUB", subtitle:"GOLF TRAINING", accent:"#7dffb2", gold:"#58fff4", fallback:[34,0,-20]},
  {key:"store", target:"store", title:"SVR STORE", subtitle:"MEMBERSHIP • MERCH • VIP", accent:"#58fff4", gold:"#ffd56e", fallback:[37,0,8]},
  {key:"sponsor", target:"sponsor", title:"SPONSOR HUB", subtitle:"AD TIERS • PARTNERS", accent:"#ffffff", gold:"#b58cff", fallback:[-37,0,8]},
  {key:"legends", target:"legends", title:"LEGENDS HALL", subtitle:"HALL OF FAME", accent:"#65b7ff", gold:"#ffd56e", fallback:[-28,0,-26]},
  {key:"scorpion", target:"scorpion", title:"SCORPION ROOM", subtitle:"PRIVATE TABLE", accent:"#ff5e75", gold:"#ffd56e", fallback:[28,0,26]},
  {key:"charity", target:"charity", title:"CHARITY HUB", subtitle:"COMMUNITY GOALS", accent:"#ff7fa8", gold:"#58fff4", fallback:[-28,0,26]}
];
function color(hex){ return new THREE.Color(hex).getHex(); }
function placement(sceneTargets, cfg){
  const rec = sceneTargets?.[cfg.target] || (cfg.key === "wellness" ? sceneTargets?.reikiRoom : null);
  if (rec?.pos && rec?.look) return {pos: rec.look.clone(), face: rec.pos.clone()};
  const pos = new THREE.Vector3(cfg.fallback[0],0,cfg.fallback[2]);
  return {pos, face:new THREE.Vector3(0,1.6,0)};
}
function hideOldHubObjects(scene, centers){
  const p = new THREE.Vector3();
  scene.traverse((o)=>{
    if (!o || o.userData?.phase162Hub) return;
    o.getWorldPosition?.(p);
    const near = centers.some(c=>Math.hypot(p.x-c.x,p.z-c.z)<12.8 && p.y>-0.3 && p.y<7.8);
    if (!near) return;
    const name = String(o.name||"").toLowerCase();
    const panel = o.isMesh && ["PlaneGeometry","CircleGeometry","TorusGeometry","BoxGeometry","CylinderGeometry"].includes(o.geometry?.type);
    if (panel || name.includes("reiki") || name.includes("wellness") || name.includes("pga") || name.includes("sponsor") || name.includes("legend") || name.includes("scorpion") || name.includes("storefront") || name.includes("rope") || name.includes("stanchion")){
      o.visible = false;
      o.userData.phase162Hidden = true;
    }
  });
}
function buildHub(scene, sceneTargets, cfg, index){
  const {pos, face} = placement(sceneTargets, cfg);
  const group = new THREE.Group(); group.name = `PHASE162 LUXURY HUB STOREFRONT ${cfg.key.toUpperCase()}`;
  group.position.copy(pos); group.position.y=0; group.lookAt(face.x,1.55,face.z);
  const black = makeBasicMaterial(0x020707,0x061412,.34);
  const trim = makeBasicMaterial(color(cfg.accent),color(cfg.accent),.82);
  const gold = makeBasicMaterial(color(cfg.gold),color(cfg.gold),.56);
  const glass = new THREE.MeshStandardMaterial({color:color(cfg.accent),transparent:true,opacity:.12,roughness:.04,metalness:.16,emissive:color(cfg.accent),emissiveIntensity:.10,side:THREE.DoubleSide,depthWrite:false});
  const width = cfg.key === "wellness" ? 12.8 : 10.4;
  const height = cfg.key === "wellness" ? 5.7 : 5.05;
  const wall = new THREE.Mesh(new THREE.BoxGeometry(width,height,.18),black); wall.position.set(0,height/2,-.42); wall.userData.phase162Hub=true; group.add(wall);
  const glassPane = new THREE.Mesh(new THREE.PlaneGeometry(width-.8,height-.7),glass); glassPane.position.set(0,height/2,-.29); glassPane.userData.phase162Hub=true; group.add(glassPane);
  [[0,height+.06,-.08,width+.25,.16,.36],[0,.22,-.08,width,.13,.30],[-width/2-.1,height/2,-.08,.15,height,.34],[width/2+.1,height/2,-.08,.15,height,.34]].forEach(v=>{const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]),trim);m.position.set(v[0],v[1],v[2]);m.userData.phase162Hub=true;group.add(m);});
  [-1,1].forEach(s=>{const m=new THREE.Mesh(new THREE.BoxGeometry(.10,height-.65,.25),gold);m.position.set(s*(width*.32),height/2,-.02);m.userData.phase162Hub=true;group.add(m);});
  const top = new THREE.Mesh(new THREE.PlaneGeometry(width*.70,.86),new THREE.MeshBasicMaterial({map:panelTexture(cfg.title,cfg.subtitle,cfg.accent,cfg.gold),transparent:true,side:THREE.DoubleSide,depthWrite:false})); top.position.set(0,height-.62,.03); top.userData.phase162Hub=true; group.add(top);
  const center = new THREE.Mesh(new THREE.PlaneGeometry(2.65,2.95),new THREE.MeshBasicMaterial({map:panelTexture("READY", "OPEN PLACEHOLDER", cfg.accent, cfg.gold),transparent:true,side:THREE.DoubleSide,depthWrite:false})); center.position.set(0,2.15,.05); center.userData.phase162Hub=true; group.add(center);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.55),new THREE.MeshBasicMaterial({map:panelTexture("ABOUT", "INFO PANEL", cfg.accent, cfg.gold),transparent:true,side:THREE.DoubleSide,depthWrite:false})); left.position.set(-width*.34,2.05,.04); left.userData.phase162Hub=true; group.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.55),new THREE.MeshBasicMaterial({map:panelTexture("ACTION", "PORTAL PANEL", cfg.accent, cfg.gold),transparent:true,side:THREE.DoubleSide,depthWrite:false})); right.position.set(width*.34,2.05,.04); right.userData.phase162Hub=true; group.add(right);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1,64),new THREE.MeshBasicMaterial({map:floorTexture(cfg.title.split(" ")[0],cfg.accent,cfg.gold),transparent:true,side:THREE.DoubleSide,depthWrite:false})); floor.rotation.x=-Math.PI/2; floor.position.set(0,.04,1.45); floor.userData.phase162Hub=true; group.add(floor);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(3.4,5.8),new THREE.MeshStandardMaterial({color:0x071816,roughness:.7,metalness:.05,emissive:color(cfg.accent),emissiveIntensity:.12,side:THREE.DoubleSide})); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.025,3.1); carpet.userData.phase162Hub=true; group.add(carpet);
  for(let i=0;i<9;i++){const dot=new THREE.Mesh(new THREE.SphereGeometry(.045,10,8),new THREE.MeshBasicMaterial({color:i%2?color(cfg.gold):color(cfg.accent),transparent:true,opacity:.9}));dot.position.set(-width*.36+i*(width*.09),height+.28,.12);dot.userData.phase162Hub=true;group.add(dot);}
  scene.add(group);
  return group;
}
export function applyPhase162AllHubLuxuryStorefronts(args={}, result={}){
  const scene=args.scene; if(!scene || scene.userData._phase162AllHubLuxury) return result;
  const sceneTargets=args.sceneTargets||{};
  const centers=HUBS.map(h=>placement(sceneTargets,h).pos);
  hideOldHubObjects(scene, centers);
  const groups=HUBS.map((h,i)=>buildHub(scene,sceneTargets,h,i));
  const oldTick=scene.userData._tickWorld;
  scene.userData._tickWorld=(dt=.016)=>{oldTick?.(dt);const t=performance.now()*.001;groups.forEach((g,idx)=>{g.children.forEach(o=>{if(o.isMesh&&o.geometry?.type==="SphereGeometry"&&o.material?.opacity!==undefined)o.material.opacity=.45+Math.sin(t*2.2+idx+o.position.x)*.28;});});};
  scene.userData._phase162AllHubLuxury={groups};
  window.SVR_PHASE162_ALL_HUBS_LUXURY=true;
  args.setStatus?.("Phase 162: all hub storefronts rebuilt as luxury geometry",{force:true});
  return {...result, phase162Hubs:groups};
}
