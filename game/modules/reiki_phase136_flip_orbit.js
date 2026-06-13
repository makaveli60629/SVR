import * as THREE from "three";

function makeTexture(w,h,title,lines=[],accent="#7dfff0"){
  const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#02080b"); g.addColorStop(1,"#120617"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=accent; ctx.lineWidth=12; ctx.strokeRect(28,28,w-56,h-56); ctx.textAlign="center"; ctx.textBaseline="middle";
  ctx.fillStyle="#f7ffff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText(title,w/2,100,w-90);
  ctx.fillStyle="#dcfff7"; ctx.font="700 30px system-ui,Arial"; let y=210; lines.forEach(line=>{ctx.fillText(line,w/2,y,w-90);y+=54;});
  ctx.fillStyle="#bffcff"; ctx.font="900 30px system-ui,Arial"; ctx.fillText("SPONSOR PLACEHOLDER",w/2,h-100,w-120);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; return t;
}

export function applyReikiPhase136FlipOrbit({ scene, camera, renderer, sceneTargets, setStatus=()=>{}, log=()=>{} } = {}){
  if(!scene) return null;
  if(scene.userData._phase136Reiki) return scene.userData._phase136Reiki;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if(!rec?.pos || !rec?.look) return null;
  const wallCenter = rec.look.clone(); wallCenter.y = 0;
  const group = new THREE.Group(); group.name = "PHASE156 REIKI PLACEHOLDER STOREFRONT"; group.position.copy(wallCenter);
  const entry = new THREE.Vector3().subVectors(rec.pos, wallCenter); entry.y = 0; if(entry.lengthSq()<.001) entry.set(-1,0,0); else entry.normalize();
  group.rotation.y = Math.atan2(entry.x, entry.z); scene.add(group);
  const teal = new THREE.MeshStandardMaterial({ color:0x7dfff0, emissive:0x23bdaa, emissiveIntensity:.95, roughness:.20, metalness:.42 });
  const dark = new THREE.MeshStandardMaterial({ color:0x020607, emissive:0x07191b, emissiveIntensity:.32, roughness:.80, metalness:.08 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(11.45,5.25,.18), dark); back.position.set(0,2.88,-.14); group.add(back);
  [[0,5.55,.04,11.7,.16,.24],[-5.78,2.88,.04,.16,5.35,.28],[5.78,2.88,.04,.16,5.35,.28],[0,.28,.04,11.65,.10,.20]].forEach(v=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]),teal); m.position.set(v[0],v[1],v[2]); group.add(m); });
  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42), new THREE.MeshBasicMaterial({ map:makeTexture(900,1200,"REIKI HUB",["Sponsor placeholder","Provider unassigned","Website blank","Approval required"]), transparent:true, side:THREE.DoubleSide, depthWrite:false })); left.position.set(-3.82,2.78,.185); group.add(left);
  const center = new THREE.Mesh(new THREE.PlaneGeometry(2.22,3.52), new THREE.MeshBasicMaterial({ map:makeTexture(900,1200,"PLACEHOLDER",["Generic Reiki hub","Future approved sponsor","No active outside branding"],"#b58cff"), transparent:true, side:THREE.DoubleSide, depthWrite:false })); center.position.set(0,2.92,.78); group.add(center);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42), new THREE.MeshBasicMaterial({ map:makeTexture(900,1200,"PROFILE SLOT",["Photo reserved","Logo reserved","Copy reserved"],"#7dffb2"), transparent:true, side:THREE.DoubleSide, depthWrite:false })); right.position.set(3.82,2.78,.185); group.add(right);
  scene.userData._phase136Reiki = { group };
  window.SVR_PHASE156_REIKI_PLACEHOLDER = true;
  log?.("Phase 156 Reiki placeholder storefront active");
  setStatus("Phase 156 Reiki placeholder storefront active", {force:true});
  return scene.userData._phase136Reiki;
}
