import * as THREE from "three";

const PHOTO_URL = "./assets/ui/shyona_royston.png";
const VIDEO_URL = "./assets/video/reiki_hologram.mp4";

function canvasTexture(w, h, draw){
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  const ctx = c.getContext("2d");
  draw(ctx, w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}
function round(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r);
  ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h);
  ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function approval(ctx,w,h){
  ctx.fillStyle = "rgba(220,0,36,.35)"; round(ctx,70,h-142,w-140,84,24); ctx.fill();
  ctx.strokeStyle = "#ff2342"; ctx.lineWidth = 8; round(ctx,70,h-142,w-140,84,24); ctx.stroke();
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#ffd8dd"; ctx.font = "900 38px system-ui,Arial";
  ctx.fillText("AWAITING APPROVAL", w/2, h-100);
}
function panel(title, lines = [], accent = "#7dfff0"){
  return canvasTexture(900,1200,(ctx,w,h)=>{
    const g = ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#02080b"); g.addColorStop(1,"#120617");
    ctx.fillStyle = g; ctx.fillRect(0,0,w,h); ctx.strokeStyle = accent; ctx.lineWidth = 14; round(ctx,26,26,w-52,h-52,44); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#f7ffff"; ctx.font = "900 58px system-ui,Arial"; ctx.fillText(title,w/2,100);
    ctx.fillStyle = "#dcfff7"; ctx.font = "700 32px system-ui,Arial"; let y = 210;
    lines.slice(0,9).forEach((line)=>{ ctx.fillText(line,w/2,y); y += 58; });
    approval(ctx,w,h);
  });
}
function founderInfoTexture(){
  return panel("FOUNDER INFO", ["Trueitive.com", "Shyona Royston", "Release • relax • rejuvenate", "Massage therapy", "Reiki energy healing", "Meditation support", "Holistic nutrition support", "Presentation-ready info"]);
}
function photoFrameTexture(){
  return canvasTexture(900,1200,(ctx,w,h)=>{
    ctx.fillStyle="#02080b"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="#7dfff0"; ctx.lineWidth=14; round(ctx,26,26,w-52,h-52,44); ctx.stroke();
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#f7ffff"; ctx.font="900 54px system-ui,Arial"; ctx.fillText("SHYONA ROYSTON",w/2,90);
    ctx.strokeStyle="rgba(125,255,240,.55)"; ctx.lineWidth=8; round(ctx,130,145,w-260,610,34); ctx.stroke();
    ctx.fillStyle="rgba(255,255,255,.08)"; round(ctx,145,160,w-290,580,28); ctx.fill();
    ctx.fillStyle="#dcfff7"; ctx.font="800 31px system-ui,Arial"; ctx.fillText("Founder Photo",w/2,825); ctx.fillText("Trueitive.com presentation",w/2,882);
    approval(ctx,w,h);
  });
}
function chakraTexture(){
  return canvasTexture(900,1200,(ctx,w,h)=>{
    ctx.fillStyle="#020408"; ctx.fillRect(0,0,w,h); ctx.strokeStyle="#7dfff0"; ctx.lineWidth=14; round(ctx,26,26,w-52,h-52,44); ctx.stroke();
    ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#f7ffff"; ctx.font="900 62px system-ui,Arial"; ctx.fillText("7 CHAKRAS",w/2,95);
    const names=["Crown","Third Eye","Throat","Heart","Solar","Sacral","Root"];
    const colors=["#d88cff","#7b6cff","#54d9ff","#55ff99","#ffd13d","#ff8a2a","#ff3355"];
    names.forEach((name,i)=>{ const y=210+i*102; ctx.fillStyle=colors[i]; ctx.beginPath(); ctx.arc(210,y,36,0,Math.PI*2); ctx.fill(); ctx.strokeStyle="rgba(255,255,255,.9)"; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(210,y,50,0,Math.PI*2); ctx.stroke(); ctx.fillStyle="#fff"; ctx.font="900 34px serif"; ctx.fillText("✦",210,y+1); ctx.fillStyle="#eaffff"; ctx.font="900 34px system-ui,Arial"; ctx.fillText(name,515,y); });
    approval(ctx,w,h);
  });
}
function makeButton(label, accent){
  return new THREE.Mesh(new THREE.PlaneGeometry(.92,.40), new THREE.MeshBasicMaterial({ map: panel(label,["tap / trigger"],accent), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
}
function glowTexture(colorA, colorB){
  return canvasTexture(256,256,(ctx,w,h)=>{ const g=ctx.createRadialGradient(w/2,h/2,4,w/2,h/2,w/2); g.addColorStop(0,colorA); g.addColorStop(.25,"rgba(255,255,255,.62)"); g.addColorStop(1,colorB); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); });
}
function earthTexture(){
  return canvasTexture(1024,512,(ctx,w,h)=>{ ctx.fillStyle="#0b2b64"; ctx.fillRect(0,0,w,h); for(let i=0;i<70;i++){ ctx.fillStyle=i%2?"rgba(45,150,92,.72)":"rgba(37,116,74,.62)"; ctx.beginPath(); ctx.ellipse(Math.random()*w,Math.random()*h,55+Math.random()*130,20+Math.random()*70,Math.random()*Math.PI,0,Math.PI*2); ctx.fill(); } ctx.fillStyle="rgba(255,255,255,.18)"; for(let i=0;i<22;i++){ ctx.beginPath(); ctx.ellipse(Math.random()*w,Math.random()*h,70+Math.random()*170,14+Math.random()*34,Math.random()*Math.PI,0,Math.PI*2); ctx.fill(); } });
}
function marsTexture(){
  return canvasTexture(512,256,(ctx,w,h)=>{ const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#7d2f1c"); g.addColorStop(1,"#d47a4c"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h); ctx.fillStyle="rgba(70,18,8,.35)"; for(let i=0;i<34;i++){ ctx.beginPath(); ctx.ellipse(Math.random()*w,Math.random()*h,20+Math.random()*90,8+Math.random()*26,Math.random()*Math.PI,0,Math.PI*2); ctx.fill(); } });
}
function moonTexture(){
  return canvasTexture(512,256,(ctx,w,h)=>{ ctx.fillStyle="#c9ccd3"; ctx.fillRect(0,0,w,h); for(let i=0;i<58;i++){ ctx.fillStyle=`rgba(70,72,80,${0.10+Math.random()*.22})`; ctx.beginPath(); ctx.arc(Math.random()*w,Math.random()*h,5+Math.random()*28,0,Math.PI*2); ctx.fill(); } });
}
function hideOldSky(scene, group){
  const p = new THREE.Vector3();
  scene.traverse((obj)=>{
    if(!obj || obj===group || group.children.includes(obj)) return;
    obj.getWorldPosition?.(p);
    if(obj.isMesh && String(obj.geometry?.type||"").includes("Sphere") && (obj.geometry?.parameters?.radius||0) >= 10 && p.y > 60) obj.visible = false;
    if(obj.isSprite && p.y > 60 && Math.max(obj.scale.x,obj.scale.y) > 60) obj.visible = false;
    if(obj.isPointLight && p.y > 60 && p.length() > 120) obj.visible = false;
  });
}
function addSolar(scene){
  if(scene.userData._phase136Solar) return scene.userData._phase136Solar;
  const group = new THREE.Group(); group.name = "PHASE136 EARTH ORBITS LOBBY"; scene.add(group);
  const earth = new THREE.Mesh(new THREE.SphereGeometry(18,48,32), new THREE.MeshStandardMaterial({ map:earthTexture(), roughness:.82, emissive:0x061020, emissiveIntensity:.05 }));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(6.2,32,20), new THREE.MeshStandardMaterial({ map:moonTexture(), roughness:.96, emissive:0x111827, emissiveIntensity:.03 }));
  const mars = new THREE.Mesh(new THREE.SphereGeometry(5.2,30,18), new THREE.MeshStandardMaterial({ map:marsTexture(), roughness:.82, emissive:0x250905, emissiveIntensity:.03 }));
  const earthHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(120,210,255,.95)","rgba(40,140,255,0)"), transparent:true, opacity:.18, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const moonHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(255,255,255,.92)","rgba(160,190,255,0)"), transparent:true, opacity:.14, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  const marsHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map:glowTexture("rgba(255,160,110,.9)","rgba(255,80,40,0)"), transparent:true, opacity:.13, depthWrite:false, depthTest:false, blending:THREE.AdditiveBlending }));
  earthHalo.scale.set(88,88,1); moonHalo.scale.set(32,32,1); marsHalo.scale.set(30,30,1);
  const light = new THREE.PointLight(0x81c8ff,1.5,420,1.8);
  group.add(earth,moon,mars,earthHalo,moonHalo,marsHalo,light);
  scene.userData._phase136Solar = { group, update(dt=0){
    const t = scene.userData._time || performance.now()*0.001;
    if(Math.floor(t*10)%8===0) hideOldSky(scene, group);
    const orbit = t*.055, r = 210, y = 122 + Math.sin(t*.13)*10;
    earth.position.set(Math.cos(orbit)*r, y, Math.sin(orbit)*r); earth.rotation.y += dt*.08; earth.rotation.z = .24;
    const mo = t*.48; moon.position.set(earth.position.x+Math.cos(mo)*46, earth.position.y+10+Math.sin(mo*.7)*8, earth.position.z+Math.sin(mo)*36); moon.rotation.y += dt*.16;
    const ma = t*.30; mars.position.set(earth.position.x+Math.cos(ma)*73, earth.position.y+19+Math.sin(ma*.82)*12, earth.position.z+Math.sin(ma)*58); mars.rotation.y += dt*.12;
    earthHalo.position.copy(earth.position); moonHalo.position.copy(moon.position); marsHalo.position.copy(mars.position); light.position.copy(earth.position);
  }};
  return scene.userData._phase136Solar;
}
function isChildOf(obj,parent){ let p=obj; while(p){ if(p===parent) return true; p=p.parent; } return false; }
function hideLegacyReiki(scene, group){
  const pos = new THREE.Vector3();
  scene.traverse((obj)=>{
    if(!obj?.isMesh || isChildOf(obj, group)) return;
    obj.getWorldPosition(pos);
    const local = group.worldToLocal(pos.clone());
    const near = Math.abs(local.x)<7.0 && local.y>.45 && local.y<6.3 && local.z>-3.8 && local.z<2.0;
    if(near && (obj.geometry?.type?.includes("Plane") || obj.material?.map || obj.material?.transparent)) obj.visible = false;
  });
}

export function applyReikiPhase136FlipOrbit({ scene, camera, renderer, sceneTargets, setStatus=()=>{}, log=()=>{} } = {}){
  if(!scene) return null;
  const solar = addSolar(scene);
  if(scene.userData._phase136Reiki) return scene.userData._phase136Reiki;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if(!rec?.pos || !rec?.look) return null;

  const wallCenter = rec.look.clone(); wallCenter.y = 0;
  const group = new THREE.Group(); group.name = "PHASE136 FLIPPED BEAUTIFIED TRUEITIVE REIKI STOREFRONT"; group.position.copy(wallCenter);
  const entry = new THREE.Vector3().subVectors(rec.pos, wallCenter); entry.y = 0; if(entry.lengthSq()<.001) entry.set(-1,0,0); else entry.normalize();
  group.rotation.y = Math.atan2(entry.x, entry.z);
  scene.add(group); group.updateMatrixWorld(true); hideLegacyReiki(scene, group);

  const teal = new THREE.MeshStandardMaterial({ color:0x7dfff0, emissive:0x23bdaa, emissiveIntensity:.95, roughness:.20, metalness:.42 });
  const dark = new THREE.MeshStandardMaterial({ color:0x020607, emissive:0x07191b, emissiveIntensity:.32, roughness:.80, metalness:.08 });
  const red = new THREE.MeshStandardMaterial({ color:0x8b071e, roughness:.86, side:THREE.DoubleSide, emissive:0x31040a, emissiveIntensity:.24 });
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.7,7.7), red); carpet.rotation.x = -Math.PI/2; carpet.position.set(0,.018,2.75); group.add(carpet);
  const back = new THREE.Mesh(new THREE.BoxGeometry(11.45,5.25,.18), dark); back.position.set(0,2.88,-.14); group.add(back);
  const glowBack = new THREE.Mesh(new THREE.PlaneGeometry(11.10,4.92), new THREE.MeshBasicMaterial({ color:0x7dfff0, transparent:true, opacity:.045, side:THREE.DoubleSide, depthWrite:false })); glowBack.position.set(0,2.88,.02); group.add(glowBack);
  [[0,5.55,.04,11.7,.16,.24],[-5.78,2.88,.04,.16,5.35,.24],[5.78,2.88,.04,.16,5.35,.24],[0,.28,.04,11.65,.10,.20]].forEach(v=>{ const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]),teal); m.position.set(v[0],v[1],v[2]); group.add(m); });

  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42), new THREE.MeshBasicMaterial({ map:founderInfoTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false })); left.position.set(-3.82,2.78,.16); group.add(left);
  const photoBack = new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42), new THREE.MeshBasicMaterial({ map:photoFrameTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false })); photoBack.position.set(3.82,2.78,.16); group.add(photoBack);
  const photoImg = new THREE.Mesh(new THREE.PlaneGeometry(1.55,2.05), new THREE.MeshBasicMaterial({ transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:1 })); photoImg.position.set(3.82,2.98,.185); group.add(photoImg);
  new THREE.TextureLoader().load(PHOTO_URL, t=>{ t.colorSpace=THREE.SRGBColorSpace; photoImg.material.map=t; photoImg.material.needsUpdate=true; }, undefined, ()=>{ photoImg.visible=false; });

  const video = document.createElement("video"); video.src = VIDEO_URL; video.loop = true; video.playsInline = true; video.preload = "metadata"; video.muted = true; video.volume = .85;
  const videoTex = new THREE.VideoTexture(video); videoTex.colorSpace = THREE.SRGBColorSpace;
  const slides = [{kind:"video", map:null}, {kind:"panel", map:panel("ABOUT",["Trueitive.com","Release • relax • rejuvenate","Energy in motion","Mind • body • spirit"],"#b58cff")}, {kind:"panel", map:chakraTexture()}, {kind:"panel", map:panel("REIKI",["Energy healing","Clear blockages","Reduce stress","Chakra balancing","Inner peace"],"#7dffb2")}];
  let index = 0;
  const displayMat = new THREE.MeshBasicMaterial({ map:videoTex, transparent:true, opacity:.95, side:THREE.DoubleSide, depthWrite:false });
  const display = new THREE.Mesh(new THREE.PlaneGeometry(2.22,3.52), displayMat); display.position.set(0,2.92,.78); group.add(display);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.48,3.82,.08), teal); frame.position.set(0,2.92,.70); group.add(frame);
  const prev = makeButton("BACK", "#b58cff"); const next = makeButton("NEXT", "#7dffb2"); prev.position.set(-2.05,.82,.90); next.position.set(2.05,.82,.90); group.add(prev,next);
  function setSlide(n){ index=(n+slides.length)%slides.length; const s=slides[index]; displayMat.map=s.kind==="video" ? videoTex : s.map; displayMat.needsUpdate=true; if(s.kind!=="video") video.pause(); setStatus(`Reiki hologram slide ${index+1}/${slides.length}`, {force:true}); }
  setSlide(0);
  const ray = new THREE.Raycaster(); const mouse = new THREE.Vector2();
  renderer?.domElement?.addEventListener("pointerdown", ev=>{ const r=renderer.domElement.getBoundingClientRect(); mouse.x=((ev.clientX-r.left)/r.width)*2-1; mouse.y=-((ev.clientY-r.top)/r.height)*2+1; ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects([prev,next,display],true)[0]; if(!hit) return; hit.object===prev ? setSlide(index-1) : setSlide(index+1); }, {passive:true});
  window.addEventListener("keydown", ev=>{ if(ev.code==="ArrowLeft") setSlide(index-1); if(ev.code==="ArrowRight") setSlide(index+1); });
  let primed=false, near=false; const gp=new THREE.Vector3(), cp=new THREE.Vector3(); const prime=()=>{ primed=true; }; window.addEventListener("pointerdown", prime, {passive:true}); window.addEventListener("keydown", prime);
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = dt=>{ oldTick?.(dt); solar?.update?.(dt); camera?.getWorldPosition(cp); group.getWorldPosition(gp); near=cp.distanceTo(gp)<11.5; if(near && primed && index===0){ video.muted=false; if(video.paused) video.play().catch(()=>{}); } else { if(!video.paused) video.pause(); video.muted=true; } display.position.y=2.92+Math.sin(performance.now()*.002)*.03; frame.position.y=display.position.y; };
  scene.userData._phase136Reiki = { group, setSlide, video, solar };
  log?.("Phase 136 flipped Reiki storefront and Earth orbit active");
  setStatus("Phase 136 Reiki flipped and Earth orbit active", {force:true});
  return scene.userData._phase136Reiki;
}
