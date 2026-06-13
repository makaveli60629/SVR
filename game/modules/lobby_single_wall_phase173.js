import * as THREE from "three";

const PHASE = "UPDATE-3.0-PHASE-173-SINGLE-OCTAGON-WALL-LOCOMOTION-AUDIT-LOCK";

function makePanelTexture(title, subtitle, accent = "#7ffcff"){
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,1024,512);
  g.addColorStop(0,"#050914"); g.addColorStop(1,"#14051f");
  x.fillStyle = g; x.fillRect(0,0,1024,512);
  x.strokeStyle = accent; x.lineWidth = 10; x.strokeRect(28,28,968,456);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.fillStyle = accent; x.font = "900 54px system-ui,Arial"; x.fillText(title,512,190);
  x.fillStyle = "#ffffff"; x.font = "700 30px system-ui,Arial"; x.fillText(subtitle,512,282);
  x.fillStyle = "#ffdf8a"; x.font = "800 24px system-ui,Arial"; x.fillText("INSIDE SINGLE OCTAGON WALL",512,356);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
function distXZ(obj){
  const p = new THREE.Vector3();
  try { obj.getWorldPosition(p); } catch(_e){ return 0; }
  return Math.hypot(p.x,p.z);
}
function shouldHide(obj){
  const n = String(obj.name || "");
  if(/PHASE173|Phase173|SVR_REAL_SINGLE_OCTAGON/i.test(n)) return false;
  if(/PHASE171_BIG_TEXTURED_MOON|PHASE171_TEXTURED_MARS|moon|mars/i.test(n)) return false;
  if(/Store Web Portal|PHASE172|SPONSOR_MODULE/i.test(n)) return false;
  if(/wall|compact.*wall|lobby.*wall|octagon.*wall|ring.*wall|phase164|phase168|phase169|building|skyline|tower|city|adbuilding|bannerbuilding|billboard|earth|globe|planet/i.test(n)) return true;
  if(obj.isMesh && distXZ(obj) > 14.2 && distXZ(obj) < 70 && obj.position.y < 25){
    const type = String(obj.geometry?.type || "");
    if(/BoxGeometry|PlaneGeometry|CylinderGeometry|ExtrudeGeometry/i.test(type)) return true;
  }
  return false;
}
function wallSegment(length, height, mat){
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(length, height, .34), mat);
  mesh.castShadow = false; mesh.receiveShadow = true;
  return mesh;
}
function addTexturedPanel(root, name, title, subtitle, angle, radius){
  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(2.65,1.32),
    new THREE.MeshBasicMaterial({ map:makePanelTexture(title, subtitle), transparent:false, side:THREE.DoubleSide })
  );
  panel.name = name;
  panel.position.set(Math.cos(angle)*radius, 2.28, Math.sin(angle)*radius);
  panel.lookAt(0,2.18,0);
  root.add(panel);
  return panel;
}
function addPortalMarker(root, name, label, angle, radius, color=0x7ffcff){
  const g = new THREE.Group(); g.name = name;
  g.position.set(Math.cos(angle)*radius, .04, Math.sin(angle)*radius);
  g.lookAt(0,.04,0);
  const pad = new THREE.Mesh(new THREE.CircleGeometry(1.22,48), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.16, side:THREE.DoubleSide }));
  pad.rotation.x = -Math.PI/2; g.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(.82,.025,10,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.72, blending:THREE.AdditiveBlending }));
  ring.position.y = 1.0; g.add(ring);
  g.userData.tick = t => { ring.rotation.z = t*.8; };
  root.add(g);
  return g;
}
export function installPhase173SingleOctagonWall({ scene, log = console.log, enabled = true } = {}){
  if(!enabled || !scene) return null;
  const hidden = [];
  const targets = [];
  scene.traverse(o=>{ if(o !== scene && shouldHide(o)) targets.push(o); });
  targets.forEach(o=>{ o.visible = false; hidden.push(o.name || o.type); });
  const oldKeys = ["_phase123AdBanners","_phase164CompactLobbyWalls","_phase164LegendsStatues","_phase168SolidOctagon","_phase169ExpandedLobby"];
  oldKeys.forEach(k=>{ if(scene.userData?.[k]){ scene.userData[k].visible = false; hidden.push(k); } });

  const root = new THREE.Group(); root.name = "PHASE173_SVR_REAL_SINGLE_OCTAGON_WALL_LOCK";
  const R = 13.6;
  const H = 4.9;
  const side = 2 * R * Math.tan(Math.PI/8) + .18;
  const wallMat = new THREE.MeshStandardMaterial({ color:0x111827, roughness:.82, metalness:.05, emissive:0x060912, emissiveIntensity:.42 });
  const trimMat = new THREE.MeshBasicMaterial({ color:0x7ffcff, transparent:true, opacity:.64 });
  for(let i=0;i<8;i++){
    const a = i * Math.PI/4 + Math.PI/8;
    const seg = wallSegment(side, H, wallMat);
    seg.name = `PHASE173_REAL_SINGLE_OCTAGON_WALL_SEGMENT_${i+1}`;
    seg.position.set(Math.cos(a)*R, H/2, Math.sin(a)*R);
    seg.rotation.y = -a + Math.PI/2;
    root.add(seg);
    const top = new THREE.Mesh(new THREE.BoxGeometry(side+.05,.08,.06), trimMat);
    top.name = `PHASE173_TOP_TRIM_${i+1}`;
    top.position.set(seg.position.x,H+.06,seg.position.z);
    top.rotation.y = seg.rotation.y;
    root.add(top);
    const low = new THREE.Mesh(new THREE.BoxGeometry(side+.05,.055,.05), trimMat);
    low.name = `PHASE173_LOW_TRIM_${i+1}`;
    low.position.set(seg.position.x,.18,seg.position.z);
    low.rotation.y = seg.rotation.y;
    root.add(low);
  }
  const floor = new THREE.Mesh(new THREE.CircleGeometry(12.9,8), new THREE.MeshBasicMaterial({ color:0x050711, transparent:true, opacity:.36, side:THREE.DoubleSide }));
  floor.name = "PHASE173_SINGLE_OCTAGON_INNER_FLOOR_GUIDE";
  floor.rotation.x = -Math.PI/2; floor.rotation.z = Math.PI/8; floor.position.y = .018; root.add(floor);

  addTexturedPanel(root,"PHASE173_STORE_FRONT_PANEL","SVR STORE","Products + partner placement",Math.PI*.50,10.85);
  addTexturedPanel(root,"PHASE173_WELLNESS_FRONT_PANEL","WELLNESS / REIKI","Approval-based sponsor module",Math.PI*.25,10.85);
  addTexturedPanel(root,"PHASE173_PGA_FRONT_PANEL","PGA HUB","Training + range portal",-Math.PI*.25,10.85);
  addTexturedPanel(root,"PHASE173_SPONSOR_FRONT_PANEL","SPONSOR HUB","No-code approved campaigns",0,10.85);
  addTexturedPanel(root,"PHASE173_LEGENDS_FRONT_PANEL","LEGENDS HUB","Hall of Fame wall",-Math.PI*.75,10.85);
  addTexturedPanel(root,"PHASE173_SCORPION_FRONT_PANEL","SCORPION ROOM","Private room portal",Math.PI,10.85);

  const portals = [
    addPortalMarker(root,"PHASE173_STORE_PORTAL_MARKER","STORE",Math.PI*.50,9.2,0x7ffcff),
    addPortalMarker(root,"PHASE173_WELLNESS_PORTAL_MARKER","WELLNESS",Math.PI*.25,9.2,0xa77cff),
    addPortalMarker(root,"PHASE173_PGA_PORTAL_MARKER","PGA",-Math.PI*.25,9.2,0x77ff9d),
    addPortalMarker(root,"PHASE173_SPONSOR_PORTAL_MARKER","SPONSOR",0,9.2,0xffdf8a),
    addPortalMarker(root,"PHASE173_LEGENDS_PORTAL_MARKER","LEGENDS",-Math.PI*.75,9.2,0xff77dd),
    addPortalMarker(root,"PHASE173_SCORPION_PORTAL_MARKER","SCORPION",Math.PI,9.2,0xff5f6d)
  ];
  root.userData.tick = t => portals.forEach(p=>p.userData.tick?.(t));
  scene.add(root);
  window.SVR_PHASE173_SINGLE_WALL = { locked:true, radius:R, wallSegments:8, hiddenObjects:hidden.length, storefrontPanels:6, portals:6, note:"Only Phase173 octagon wall should be visible as the real lobby boundary." };
  log(`[Phase173] single octagon wall installed; hidden old walls/buildings=${hidden.length}`);
  return root;
}

export function autoInstallPhase173SingleWall(){
  const start = performance.now();
  const timer = setInterval(()=>{
    const scene = window.__SVR_SCENE__;
    if(scene){ clearInterval(timer); installPhase173SingleOctagonWall({ scene, log:console.log, enabled:true }); }
    else if(performance.now() - start > 12000){ clearInterval(timer); console.warn("[Phase173] scene not found for single wall install"); }
  }, 250);
}
