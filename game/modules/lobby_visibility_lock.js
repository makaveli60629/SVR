import * as THREE from "three";

const REIKI_YAW = THREE.MathUtils.degToRad(348.93);

function makeTexture(title, subtitle, color = "#69e8ff"){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d");
  const g = x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#040714"); g.addColorStop(.55,"#17082b"); g.addColorStop(1,"#02040c");
  x.fillStyle = g; x.fillRect(0,0,c.width,c.height); x.strokeStyle = color; x.lineWidth = 14; x.strokeRect(32,32,c.width-64,c.height-64);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = color; x.shadowBlur = 26; x.fillStyle = "#fff"; x.font = "900 68px Arial"; x.fillText(String(title).toUpperCase(),512,205);
  x.shadowBlur = 8; x.fillStyle = color; x.font = "800 34px Arial"; x.fillText(String(subtitle).toUpperCase(),512,320);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function logoTexture(title, subtitle, color = "#69e8ff", icon = "SVR"){
  const c = document.createElement("canvas"); c.width = 768; c.height = 768; const x = c.getContext("2d"); x.clearRect(0,0,768,768);
  const g = x.createRadialGradient(384,330,40,384,384,360); g.addColorStop(0,color); g.addColorStop(.25,"rgba(255,255,255,.34)"); g.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle = g; x.fillRect(0,0,768,768);
  x.strokeStyle = color; x.lineWidth = 12; x.beginPath(); x.arc(384,306,180,0,Math.PI*2); x.stroke(); x.fillStyle = "rgba(0,0,0,.55)"; x.beginPath(); x.arc(384,306,154,0,Math.PI*2); x.fill();
  x.shadowColor = color; x.shadowBlur = 28; x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "900 86px Arial"; x.fillText(icon,384,306);
  x.shadowBlur = 12; x.font = "900 54px Arial"; x.fillText(title.toUpperCase(),384,555); x.font = "800 26px Arial"; x.fillStyle = color; x.fillText(subtitle.toUpperCase(),384,615);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function scanTexture(){
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const x = c.getContext("2d"); x.clearRect(0,0,512,512);
  for(let y=0;y<512;y+=12){ x.fillStyle = y%24===0 ? "rgba(127,255,212,.22)" : "rgba(127,255,212,.08)"; x.fillRect(0,y,512,2); }
  x.strokeStyle = "rgba(127,255,212,.5)"; x.lineWidth = 4; x.strokeRect(8,8,496,496);
  const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
function planetTexture(kind){
  const c = document.createElement("canvas"); c.width = 2048; c.height = 2048; const x = c.getContext("2d");
  const base = x.createRadialGradient(720,620,70,1024,1024,980);
  if(kind === "mars"){
    base.addColorStop(0,"#c96f45"); base.addColorStop(.28,"#7d3324"); base.addColorStop(.62,"#38140f"); base.addColorStop(1,"#120604");
  } else {
    base.addColorStop(0,"#d8dde8"); base.addColorStop(.34,"#7d8492"); base.addColorStop(.70,"#363b46"); base.addColorStop(1,"#11141b");
  }
  x.fillStyle = base; x.fillRect(0,0,2048,2048);
  x.globalCompositeOperation = "multiply";
  const shade = x.createLinearGradient(0,0,2048,2048); shade.addColorStop(0,"rgba(255,255,255,.18)"); shade.addColorStop(.42,"rgba(0,0,0,.08)"); shade.addColorStop(1,"rgba(0,0,0,.72)"); x.fillStyle = shade; x.fillRect(0,0,2048,2048);
  x.globalCompositeOperation = "source-over";
  if(kind === "mars"){
    x.globalAlpha = .34; x.strokeStyle = "#2a0d08"; x.lineWidth = 10;
    for(let i=0;i<34;i++){ x.beginPath(); const yy = 220 + i*48 + Math.sin(i)*24; x.moveTo(90,yy); for(let xx=90;xx<1980;xx+=80) x.lineTo(xx,yy+Math.sin(xx*.009+i)*24); x.stroke(); }
    x.globalAlpha = .28; x.fillStyle = "#d18457"; for(let i=0;i<90;i++){ x.beginPath(); x.ellipse(Math.random()*2048,Math.random()*2048,20+Math.random()*120,8+Math.random()*38,Math.random()*Math.PI,0,Math.PI*2); x.fill(); }
  } else {
    x.globalAlpha = .42; x.fillStyle = "#1d222c";
    for(let i=0;i<260;i++){ x.beginPath(); x.arc(Math.random()*2048,Math.random()*2048,10+Math.random()*82,0,Math.PI*2); x.fill(); }
    x.globalAlpha = .26; x.strokeStyle = "#c9d1df"; x.lineWidth = 5; for(let i=0;i<80;i++){ x.beginPath(); x.arc(Math.random()*2048,Math.random()*2048,22+Math.random()*90,0,Math.PI*2); x.stroke(); }
  }
  x.globalAlpha = 1;
  const vignette = x.createRadialGradient(780,650,260,1024,1024,1040); vignette.addColorStop(0,"rgba(255,255,255,.10)"); vignette.addColorStop(.55,"rgba(0,0,0,0)"); vignette.addColorStop(1,"rgba(0,0,0,.62)"); x.fillStyle = vignette; x.fillRect(0,0,2048,2048);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function addPanel(root, title, subtitle, x, y, z, color, w = 4.2, h = 1.4){ const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map: makeTexture(title, subtitle, color), transparent:true, side:THREE.DoubleSide, depthWrite:false })); m.position.set(x,y,z); m.lookAt(0,y,0); root.add(m); return m; }
function addHoloLogo(root, title, subtitle, x, y, z, color, icon, rotY = null){ const m = new THREE.Mesh(new THREE.PlaneGeometry(1.85,1.85), new THREE.MeshBasicMaterial({ map:logoTexture(title,subtitle,color,icon), transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.96 })); m.position.set(x,y,z); if(rotY === null) m.lookAt(0,y,0); else m.rotation.y = rotY; root.add(m); return m; }
function addStorefront(root, title, subtitle, x, z, color, key, opt = {}){
  const g = new THREE.Group(); g.position.set(x,0,z); g.rotation.y = opt.rotationY ?? Math.atan2(-x,-z); g.userData.portalKey = key; root.add(g); const width = opt.width || 3.4; const col = new THREE.Color(color).getHex();
  const body = new THREE.Mesh(new THREE.BoxGeometry(width,3.05,.28), new THREE.MeshStandardMaterial({ color:0x070b15, roughness:.72, metalness:.05, emissive:0x101625, emissiveIntensity:.18 })); body.position.y = 1.5; g.add(body);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(width-.62,1.62), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.12, side:THREE.DoubleSide, depthWrite:false })); face.position.set(0,1.28,.17); g.add(face);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(width-.15,.78), new THREE.MeshBasicMaterial({ map:makeTexture(title,subtitle,color), transparent:true, side:THREE.DoubleSide, depthWrite:false })); sign.position.set(0,2.77,.2); g.add(sign);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.64,.96,64), new THREE.MeshBasicMaterial({ color:col, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x = -Math.PI/2; ring.position.set(0,.035,.84); g.add(ring); return g;
}
function addConnector(root, a, b){ const start = new THREE.Vector3(a.x,.04,a.z), end = new THREE.Vector3(b.x,.04,b.z), mid = start.clone().add(end).multiplyScalar(.5); const mesh = new THREE.Mesh(new THREE.BoxGeometry(.1,.035,start.distanceTo(end)), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.36, depthWrite:false })); mesh.position.copy(mid); mesh.rotation.y = Math.atan2(b.x-a.x,b.z-a.z); root.add(mesh); }
function addOrb(root, color, x, y, z, s, kind){
  const g = new THREE.Group(); g.position.set(x,y,z); root.add(g);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(s,96,64), new THREE.MeshBasicMaterial({ map:planetTexture(kind), color: kind === "mars" ? 0xd48a68 : 0xc5cad4 })); g.add(sphere);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(s*1.34,64,36), new THREE.MeshBasicMaterial({ color, transparent:true, opacity: kind === "mars" ? .115 : .14, side:THREE.BackSide, depthWrite:false })); g.add(halo);
  const outer = new THREE.Mesh(new THREE.SphereGeometry(s*1.72,48,24), new THREE.MeshBasicMaterial({ color, transparent:true, opacity: kind === "mars" ? .045 : .055, side:THREE.BackSide, depthWrite:false })); g.add(outer);
  g.add(new THREE.PointLight(color, kind === "mars" ? 1.55 : 1.85, 260, 1.4)); return { group:g, sphere, halo, outer };
}
function addReikiVideo(root){
  const g = new THREE.Group(); g.position.set(20.69,1.64,-5.40); g.rotation.y = REIKI_YAW; root.add(g);
  const video = document.createElement("video"); video.src = "../site/assets/video/reiki_hologram.mp4"; video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true; video.preload = "auto"; video.volume = 0; video.play().catch(()=>{});
  let primed = false, currentVolume = 0; const maxVolume = .075; const zoneCenter = new THREE.Vector3(20.69,1.6,-5.40); const primeAudio = ()=>{ primed = true; video.muted = false; video.play().catch(()=>{}); };
  window.addEventListener("pointerdown", primeAudio, { once:true, passive:true }); window.addEventListener("keydown", primeAudio, { once:true }); const tex = new THREE.VideoTexture(video); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.38,1.96), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.10, side:THREE.DoubleSide, depthWrite:false })); wallGlow.position.z = .012; g.add(wallGlow);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.95,1.66), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, toneMapped:false, transparent:true, opacity:.99, depthWrite:false })); screen.position.z = .035; g.add(screen);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.98,1.68), new THREE.MeshBasicMaterial({ map:scanTexture(), color:0x7fffd4, transparent:true, opacity:.18, side:THREE.DoubleSide, depthWrite:false })); scan.position.z = .052; g.add(scan);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.22,1.72,64), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.40, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x = -Math.PI/2; ring.position.set(0,-1.64,.95); g.add(ring);
  return { group:g, video, zoneCenter, scan, getState(){ return { videoOn:!video.paused, primed, near:currentVolume>.004, volume:currentVolume, maxVolume }; }, primeAudio, updateAudio(camera, dt=.016){ if(!camera) return; const p = new THREE.Vector3(); camera.getWorldPosition(p); const d = Math.hypot(p.x-zoneCenter.x,p.z-zoneCenter.z); const near = 3.75, fade = 6.1; let target = 0; if(d < fade) target = maxVolume * THREE.MathUtils.clamp((fade-d)/(fade-near),0,1); currentVolume = THREE.MathUtils.lerp(currentVolume,target,Math.min(1,dt*2.8)); video.volume = primed ? currentVolume : 0; video.muted = !primed || currentVolume < .002; scan.material.opacity = .13 + Math.sin(performance.now()*.006)*.045; if(video.paused) video.play().catch(()=>{}); }};
}
export function installLobbyVisibilityLock({ scene }){
  const root = new THREE.Group(); root.name = "SVR_Phase98K_Dark_Cinematic_Planets"; scene.add(root);
  const reikiMain = new THREE.Vector3(-5.6,0,-9.15), reikiExact = new THREE.Vector3(20.69,0,-5.40);
  const portals = [
    { key:"reiki", label:"Reiki Main", target:"reiki", position:reikiMain.clone() }, { key:"reikiExpanded", label:"Reiki Hologram Hub", target:"reiki", position:reikiExact.clone() },
    { key:"pga", label:"PGA", target:"pga", position:new THREE.Vector3(0,0,-9.25) }, { key:"smoker", label:"Smoker Lounge", target:"sponsor", position:new THREE.Vector3(5.6,0,-9.15) },
    { key:"store", label:"SVR Store", route:"../site/store.html", position:new THREE.Vector3(-9.25,0,.8) }, { key:"scorpion", label:"Scorpion Room", route:"./scorpion.html?v=phase98-playable", position:new THREE.Vector3(9.25,0,.8) }
  ];
  addStorefront(root,"Reiki","Main Portal",-5.6,-9.15,"#7fffd4","reiki",{width:3.35}); addStorefront(root,"Reiki","Hologram Here",20.69,-5.40,"#7fffd4","reikiExpanded",{width:4.15,rotationY:REIKI_YAW}); addConnector(root,reikiMain,reikiExact);
  addStorefront(root,"PGA","Golf Training",0,-9.25,"#69e8ff","pga",{width:3.35}); addStorefront(root,"Smoker","Lounge",5.6,-9.15,"#ff8bd7","smoker",{width:3.35}); addStorefront(root,"SVR Store","Web Portal",-9.25,.8,"#ffd36b","store",{width:3.55}); addStorefront(root,"Scorpion","Play Poker",9.25,.8,"#b48cff","scorpion",{width:3.55}); addStorefront(root,"Sponsor","Ad Wall",0,9.25,"#a7ff80","sponsor",{width:3.55});
  addHoloLogo(root,"Reiki","Main",-5.6,4.15,-8.86,"#7fffd4","REI"); addHoloLogo(root,"Reiki","Hologram",20.69,4.55,-5.18,"#7fffd4","REI",REIKI_YAW);
  addHoloLogo(root,"PGA","Training",0,4.15,-8.96,"#69e8ff","PGA"); addHoloLogo(root,"Smoker","Lounge",5.6,4.15,-8.86,"#ff8bd7","SMK"); addHoloLogo(root,"Store","SVR",-8.98,4.15,.8,"#ffd36b","SVR"); addHoloLogo(root,"Scorpion","Poker",8.98,4.15,.8,"#b48cff","SCP");
  const reikiVideo = addReikiVideo(root);
  addPanel(root,"Reiki Hologram","Wall embedded / sound zone live",20.69,4.15,-5.40,"#7fffd4",5.1,1.35); addPanel(root,"Sponsor Board","Future partner surface",0,6.45,-11.35,"#a7ff80",6.5,1.9); addPanel(root,"Espresso With Cream","Tier 1 sponsor",8.9,6.2,-5.35,"#ffb477",4.6,1.55); addPanel(root,"SVR Store","Official brand",-8.9,6.2,-5.35,"#ffd36b",4.6,1.55); addPanel(root,"Scorpion Room","Playable poker now open",8.9,5.4,5.35,"#b48cff",4.6,1.55); addPanel(root,"Play With Purpose","Community impact",0,6.45,11.35,"#69e8ff",6.5,1.9);
  const moon = addOrb(root,0x9fb8ff,-4,43.5,-66,5.25,"moon"), mars = addOrb(root,0xff5b35,18,39.5,-77,3.25,"mars");
  return { portals, reikiVideo, primeReikiAudio:reikiVideo.primeAudio, getReikiAudioState:reikiVideo.getState, update(t=0,dt=.016){ const cam = scene.userData?._camera; reikiVideo.updateAudio(cam,dt); moon.group.position.set(-4+Math.sin(t*.022)*7.2,43.5+Math.sin(t*.015)*1.15,-66+Math.cos(t*.022)*4.6); moon.sphere.rotation.y += dt*.045; moon.halo.rotation.y += dt*.020; mars.group.position.set(18+Math.sin(t*.020)*8.2,39.5+Math.sin(t*.013)*.9,-77+Math.cos(t*.020)*6.1); mars.sphere.rotation.y += dt*.075; mars.halo.rotation.y += dt*.026; }};
}
