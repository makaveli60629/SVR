import * as THREE from "three";

const REIKI_YAW = THREE.MathUtils.degToRad(348.93);
const COLORS = { reiki:"#7fffd4", pga:"#69e8ff", smoker:"#ff8bd7", store:"#ffd36b", scorpion:"#b48cff", sponsor:"#a7ff80" };

function makeLabelTexture(title, subtitle, color = "#69e8ff"){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height); x.fillStyle = "rgba(0,0,0,.20)"; x.fillRect(0,0,c.width,c.height); x.strokeStyle = color; x.lineWidth = 10; x.strokeRect(28,28,c.width-56,c.height-56);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = color; x.shadowBlur = 26; x.fillStyle = "#fff"; x.font = "900 78px Arial"; x.fillText(String(title).toUpperCase(),512,206);
  x.shadowBlur = 10; x.fillStyle = color; x.font = "800 36px Arial"; x.fillText(String(subtitle).toUpperCase(),512,324);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}

function makeLogoTexture(title, subtitle, color = "#69e8ff", icon = "SVR"){
  const c = document.createElement("canvas"); c.width = 768; c.height = 768; const x = c.getContext("2d"); x.clearRect(0,0,768,768);
  const glow = x.createRadialGradient(384,338,30,384,338,360); glow.addColorStop(0,color); glow.addColorStop(.30,"rgba(255,255,255,.35)"); glow.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle = glow; x.fillRect(0,0,768,768);
  x.fillStyle = "rgba(0,0,0,.50)"; x.beginPath(); x.arc(384,310,156,0,Math.PI*2); x.fill(); x.strokeStyle = color; x.lineWidth = 12; x.beginPath(); x.arc(384,310,184,0,Math.PI*2); x.stroke();
  x.shadowColor = color; x.shadowBlur = 34; x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "900 86px Arial"; x.fillText(icon,384,310);
  x.shadowBlur = 14; x.font = "900 50px Arial"; x.fillText(title.toUpperCase(),384,556); x.font = "800 24px Arial"; x.fillStyle = color; x.fillText(subtitle.toUpperCase(),384,612);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}

function makeScanTexture(){
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const x = c.getContext("2d"); x.clearRect(0,0,512,512);
  for(let y=0;y<512;y+=12){ x.fillStyle = y % 24 === 0 ? "rgba(127,255,212,.22)" : "rgba(127,255,212,.08)"; x.fillRect(0,y,512,2); }
  x.strokeStyle = "rgba(127,255,212,.55)"; x.lineWidth = 4; x.strokeRect(8,8,496,496); const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}

function makePlanetTexture(kind = "moon"){
  const c = document.createElement("canvas"); c.width = 2048; c.height = 2048; const x = c.getContext("2d"); const main = x.createRadialGradient(720,610,70,1024,1024,980);
  if(kind === "mars"){ main.addColorStop(0,"#de8a5a"); main.addColorStop(.32,"#8e3a25"); main.addColorStop(.68,"#3b140e"); main.addColorStop(1,"#100402"); }
  else { main.addColorStop(0,"#e4e8ef"); main.addColorStop(.35,"#8a909c"); main.addColorStop(.72,"#353a44"); main.addColorStop(1,"#10131a"); }
  x.fillStyle = main; x.fillRect(0,0,2048,2048);
  if(kind === "mars"){
    x.globalAlpha = .38; x.strokeStyle = "#230b07"; x.lineWidth = 8;
    for(let i=0;i<42;i++){ const yy = 160 + i * 45 + Math.sin(i * 1.7) * 22; x.beginPath(); x.moveTo(80, yy); for(let xx=80; xx<1980; xx+=70) x.lineTo(xx, yy + Math.sin(xx*.012+i)*20); x.stroke(); }
    x.globalAlpha = .24; x.fillStyle = "#d59263"; for(let i=0;i<120;i++){ x.beginPath(); x.ellipse(Math.random()*2048, Math.random()*2048, 16+Math.random()*100, 7+Math.random()*32, Math.random()*Math.PI, 0, Math.PI*2); x.fill(); }
  } else {
    x.globalAlpha = .44; x.fillStyle = "#1a1f29"; for(let i=0;i<280;i++){ x.beginPath(); x.arc(Math.random()*2048, Math.random()*2048, 8+Math.random()*74, 0, Math.PI*2); x.fill(); }
    x.globalAlpha = .27; x.strokeStyle = "#c7cfdb"; x.lineWidth = 4; for(let i=0;i<90;i++){ x.beginPath(); x.arc(Math.random()*2048, Math.random()*2048, 20+Math.random()*82, 0, Math.PI*2); x.stroke(); }
  }
  x.globalAlpha = 1; const shade = x.createRadialGradient(720,620,280,1024,1024,1050); shade.addColorStop(0,"rgba(255,255,255,.12)"); shade.addColorStop(.55,"rgba(0,0,0,0)"); shade.addColorStop(1,"rgba(0,0,0,.68)"); x.fillStyle = shade; x.fillRect(0,0,2048,2048);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}

function makeVolumeTexture(volume = .075, muted = false){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d"); const pct = Math.round(volume * 1000);
  x.fillStyle = "rgba(0,0,0,.72)"; x.fillRect(0,0,1024,512); x.strokeStyle = COLORS.reiki; x.lineWidth = 12; x.strokeRect(26,26,972,460);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = COLORS.reiki; x.shadowBlur = 22; x.fillStyle = "#fff"; x.font = "900 56px Arial"; x.fillText("REIKI HOLOGRAM AUDIO",512,98);
  x.shadowBlur = 8; x.fillStyle = muted ? "#ff6b7f" : COLORS.reiki; x.font = "900 42px Arial"; x.fillText(muted ? "MUTED" : `VOLUME ${pct}%`,512,168);
  x.fillStyle = "rgba(255,255,255,.12)"; x.fillRect(160,220,704,46); x.fillStyle = muted ? "#ff6b7f" : COLORS.reiki; x.fillRect(160,220,Math.max(8,704*Math.min(1,volume/.18)),46);
  x.fillStyle = "#fff"; x.font = "800 30px Arial"; x.fillText("[  lower   ]  higher   U mute",512,322); x.fillStyle = "#bfffee"; x.font = "700 25px Arial"; x.fillText("Click once to prime audio • walk into Reiki zone",512,384); x.fillText("Send PLACE HERE line and I will lock this panel",512,426);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}

function addPanel(root, title, subtitle, x, y, z, color, w = 4.6, h = 1.35){
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map: makeLabelTexture(title, subtitle, color), transparent:true, side:THREE.DoubleSide, depthWrite:false }));
  m.position.set(x,y,z); m.lookAt(0,y,0); root.add(m); return m;
}

function addPortal(root, cfg){
  const color = new THREE.Color(cfg.color).getHex(); const group = new THREE.Group(); group.position.set(cfg.x,0,cfg.z); group.userData.portalKey = cfg.key; root.add(group);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.72,1.15,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.62, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x = -Math.PI/2; ring.position.y = .045; group.add(ring);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(1.10,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.11, side:THREE.DoubleSide, depthWrite:false })); disk.rotation.x = -Math.PI/2; disk.position.y = .035; group.add(disk);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.55,24,1,true), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.16, side:THREE.DoubleSide, depthWrite:false })); pillar.position.y = 1.28; group.add(pillar);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.95,1.95), new THREE.MeshBasicMaterial({ map: makeLogoTexture(cfg.title, cfg.subtitle, cfg.color, cfg.icon), transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.97 })); logo.position.set(0,2.72,.02); if(cfg.rotationY !== undefined) logo.rotation.y = cfg.rotationY; else logo.lookAt(-cfg.x,2.72,-cfg.z); group.add(logo);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.9,.78), new THREE.MeshBasicMaterial({ map: makeLabelTexture(cfg.title, cfg.subtitle, cfg.color), transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.94 })); label.position.set(0,1.34,.03); if(cfg.rotationY !== undefined) label.rotation.y = cfg.rotationY; else label.lookAt(-cfg.x,1.34,-cfg.z); group.add(label);
  return group;
}

function addConnector(root, a, b){
  const start = new THREE.Vector3(a.x,.04,a.z), end = new THREE.Vector3(b.x,.04,b.z), mid = start.clone().add(end).multiplyScalar(.5);
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(.10,.035,start.distanceTo(end)), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.28, depthWrite:false }));
  mesh.position.copy(mid); mesh.rotation.y = Math.atan2(b.x-a.x,b.z-a.z); root.add(mesh);
}

function addGlassHubExpansion(root){
  const group = new THREE.Group(); group.name = "SVR_Reiki_Expanded_Glass_Hub_Phase98M"; root.add(group);
  const glassMat = new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.16, side:THREE.DoubleSide, depthWrite:false });
  const edgeMat = new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.52, depthWrite:false });
  const floorMat = new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.10, side:THREE.DoubleSide, depthWrite:false });
  const carpetMat = new THREE.MeshBasicMaterial({ color:0x6e1026, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false });

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.8,4.2), floorMat); floor.rotation.x = -Math.PI/2; floor.position.set(19.25,.025,-4.72); group.add(floor);
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(8.6,2.35), carpetMat); carpet.rotation.x = -Math.PI/2; carpet.position.set(20.25,.035,-5.05); group.add(carpet);

  const back = new THREE.Mesh(new THREE.PlaneGeometry(10.8,3.15), glassMat); back.position.set(19.25,1.78,-6.72); back.rotation.y = 0; group.add(back);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(10.8,2.55), glassMat); front.position.set(19.25,1.48,-2.88); front.rotation.y = Math.PI; group.add(front);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(3.85,2.75), glassMat); left.position.set(13.85,1.58,-4.80); left.rotation.y = Math.PI/2; group.add(left);
  const right = new THREE.Mesh(new THREE.PlaneGeometry(3.85,2.75), glassMat); right.position.set(24.65,1.58,-4.80); right.rotation.y = -Math.PI/2; group.add(right);

  const edges = [
    [19.25,3.35,-6.72,10.8,.055,.055],[19.25,.18,-6.72,10.8,.055,.055],[19.25,2.80,-2.88,10.8,.055,.055],[19.25,.18,-2.88,10.8,.055,.055],
    [13.85,1.62,-4.80,.055,2.85,.055],[24.65,1.62,-4.80,.055,2.85,.055],[13.85,.18,-4.80,.055,.055,3.85],[24.65,.18,-4.80,.055,.055,3.85]
  ];
  for(const e of edges){ const m = new THREE.Mesh(new THREE.BoxGeometry(e[3],e[4],e[5]), edgeMat); m.position.set(e[0],e[1],e[2]); group.add(m); }

  addPanel(group,"Reiki Glass Hub","Expanded wall / volume controls",19.25,3.72,-6.70,COLORS.reiki,6.2,1.15);
  return group;
}

function addOrb(root, color, x, y, z, scale, kind){
  const g = new THREE.Group(); g.position.set(x,y,z); root.add(g);
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(scale,96,64), new THREE.MeshBasicMaterial({ map: makePlanetTexture(kind), color: kind === "mars" ? 0xd0896c : 0xcbd1dc })); g.add(sphere);
  const halo = new THREE.Mesh(new THREE.SphereGeometry(scale*1.36,64,36), new THREE.MeshBasicMaterial({ color, transparent:true, opacity: kind === "mars" ? .13 : .15, side:THREE.BackSide, depthWrite:false })); g.add(halo);
  const outer = new THREE.Mesh(new THREE.SphereGeometry(scale*1.82,48,24), new THREE.MeshBasicMaterial({ color, transparent:true, opacity: kind === "mars" ? .050 : .060, side:THREE.BackSide, depthWrite:false })); g.add(outer);
  g.add(new THREE.PointLight(color, kind === "mars" ? 1.65 : 1.95, 300, 1.4)); return { group:g, sphere, halo, outer };
}

function addReikiVideo(root){
  const g = new THREE.Group(); g.position.set(20.69,1.74,-5.40); g.rotation.y = REIKI_YAW; root.add(g);
  const video = document.createElement("video"); video.src = "../site/assets/video/reiki_hologram.mp4"; video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true; video.preload = "auto"; video.volume = 0; video.play().catch(()=>{});
  let primed = false, currentVolume = 0, maxVolume = .075, panel = null, panelMap = null, muted = false;
  const zoneCenter = new THREE.Vector3(20.69,1.6,-5.40);
  const refreshPanel = ()=>{ if(!panel) return; const tex = makeVolumeTexture(maxVolume, muted); panel.material.map?.dispose?.(); panel.material.map = tex; panel.material.needsUpdate = true; panelMap = tex; };
  const setMaxVolume = (v)=>{ maxVolume = THREE.MathUtils.clamp(v,.0,.18); muted = maxVolume <= .001 ? true : muted; refreshPanel(); };
  const primeAudio = ()=>{ primed = true; video.muted = muted; video.play().catch(()=>{}); refreshPanel(); };
  window.addEventListener("pointerdown", primeAudio, { once:true, passive:true }); window.addEventListener("keydown", primeAudio, { once:true });
  window.addEventListener("keydown", (e)=>{
    if(e.repeat) return;
    if(e.code === "BracketRight" || e.code === "Equal"){ muted = false; setMaxVolume(maxVolume + .015); }
    if(e.code === "BracketLeft" || e.code === "Minus"){ setMaxVolume(maxVolume - .015); }
    if(e.code === "KeyU"){ muted = !muted; refreshPanel(); }
  });
  window.SVR_REIKI_AUDIO = { primeAudio, setVolume:setMaxVolume, getVolume:()=>maxVolume, mute:()=>{muted=true; refreshPanel();}, unmute:()=>{muted=false; refreshPanel();}, toggleMute:()=>{muted=!muted; refreshPanel();} };

  const tex = new THREE.VideoTexture(video); tex.colorSpace = THREE.SRGBColorSpace; tex.minFilter = THREE.LinearFilter; tex.magFilter = THREE.LinearFilter;
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.7,2.18), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.095, side:THREE.DoubleSide, depthWrite:false })); wallGlow.position.z = .010; g.add(wallGlow);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.12,1.76), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, toneMapped:false, transparent:true, opacity:.99, depthWrite:false })); screen.position.z = .035; g.add(screen);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.15,1.78), new THREE.MeshBasicMaterial({ map:makeScanTexture(), color:0x7fffd4, transparent:true, opacity:.17, side:THREE.DoubleSide, depthWrite:false })); scan.position.z = .052; g.add(scan);
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.35,1.90,96), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x = -Math.PI/2; ring.position.set(0,-1.70,.95); g.add(ring);

  panelMap = makeVolumeTexture(maxVolume, muted);
  panel = new THREE.Mesh(new THREE.PlaneGeometry(3.3,1.65), new THREE.MeshBasicMaterial({ map:panelMap, transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.96 }));
  panel.position.set(18.18,2.18,-2.96); panel.rotation.y = THREE.MathUtils.degToRad(180); root.add(panel);

  return {
    group:g, video, zoneCenter, scan, volumePanel:panel, primeAudio,
    getState(){ return { videoOn:!video.paused, primed, near:currentVolume>.004, volume:currentVolume, maxVolume, muted }; },
    updateAudio(camera, dt=.016){
      if(!camera) return;
      const p = new THREE.Vector3(); camera.getWorldPosition(p); const d = Math.hypot(p.x-zoneCenter.x,p.z-zoneCenter.z); const near = 3.75, fade = 6.1;
      let target = 0; if(d < fade && !muted) target = maxVolume * THREE.MathUtils.clamp((fade-d)/(fade-near),0,1);
      currentVolume = THREE.MathUtils.lerp(currentVolume,target,Math.min(1,dt*2.8)); video.volume = primed ? currentVolume : 0; video.muted = !primed || muted || currentVolume < .002;
      scan.material.opacity = .13 + Math.sin(performance.now()*.006)*.045; if(video.paused) video.play().catch(()=>{});
    }
  };
}

export function installLobbyVisibilityLock({ scene }){
  const root = new THREE.Group(); root.name = "SVR_Phase98M_Reiki_Volume_Expanded_Glass_Hub"; scene.add(root);
  const reikiMain = new THREE.Vector3(-5.6,0,-9.15), reikiExact = new THREE.Vector3(20.69,0,-5.40);
  const portals = [
    { key:"reiki", label:"Reiki Main", target:"reiki", position:reikiMain.clone() }, { key:"reikiExpanded", label:"Reiki Hologram Hub", target:"reiki", position:reikiExact.clone() },
    { key:"pga", label:"PGA", target:"pga", position:new THREE.Vector3(0,0,-9.25) }, { key:"smoker", label:"Smoker Lounge", target:"sponsor", position:new THREE.Vector3(5.6,0,-9.15) },
    { key:"store", label:"SVR Store", route:"../site/store.html", position:new THREE.Vector3(-9.25,0,.8) }, { key:"scorpion", label:"Scorpion Room", route:"./scorpion.html?v=phase98-playable", position:new THREE.Vector3(9.25,0,.8) }
  ];

  addGlassHubExpansion(root);
  addPortal(root,{ key:"reiki", title:"Reiki", subtitle:"Main Portal", icon:"REI", color:COLORS.reiki, x:-5.6, z:-9.15 });
  addPortal(root,{ key:"reikiExpanded", title:"Reiki", subtitle:"Hologram Hub", icon:"REI", color:COLORS.reiki, x:20.69, z:-5.40, rotationY:REIKI_YAW });
  addPortal(root,{ key:"pga", title:"PGA", subtitle:"Training", icon:"PGA", color:COLORS.pga, x:0, z:-9.25 });
  addPortal(root,{ key:"smoker", title:"Smoker", subtitle:"Lounge", icon:"SMK", color:COLORS.smoker, x:5.6, z:-9.15 });
  addPortal(root,{ key:"store", title:"SVR Store", subtitle:"Web Portal", icon:"SVR", color:COLORS.store, x:-9.25, z:.8 });
  addPortal(root,{ key:"scorpion", title:"Scorpion", subtitle:"Play Poker", icon:"SCP", color:COLORS.scorpion, x:9.25, z:.8 });
  addPortal(root,{ key:"sponsor", title:"Sponsor", subtitle:"Ad Wall", icon:"AD", color:COLORS.sponsor, x:0, z:9.25 });
  addConnector(root,reikiMain,reikiExact);

  const reikiVideo = addReikiVideo(root);
  addPanel(root,"Reiki Hologram","MP4 playing / volume panel active",20.69,4.35,-5.40,COLORS.reiki,5.2,1.35);
  addPanel(root,"Sponsor Board","Future partner surface",0,6.45,-11.35,COLORS.sponsor,6.5,1.9);
  addPanel(root,"Espresso With Cream","Tier 1 sponsor",8.9,6.2,-5.35,"#ffb477",4.6,1.55);
  addPanel(root,"SVR Store","Official brand",-8.9,6.2,-5.35,COLORS.store,4.6,1.55);
  addPanel(root,"Scorpion Room","Playable poker now open",8.9,5.4,5.35,COLORS.scorpion,4.6,1.55);
  addPanel(root,"Play With Purpose","Community impact",0,6.45,11.35,COLORS.pga,6.5,1.9);

  const moon = addOrb(root,0xaec5ff,-8,55,-86,5.45,"moon");
  const mars = addOrb(root,0xff643e,22,49,-99,3.35,"mars");

  return { portals, reikiVideo, primeReikiAudio:reikiVideo.primeAudio, getReikiAudioState:reikiVideo.getState,
    update(t=0,dt=.016){
      const cam = scene.userData?._camera; reikiVideo.updateAudio(cam,dt);
      moon.group.position.set(-8+Math.sin(t*.018)*8.5,55+Math.sin(t*.012)*1.1,-86+Math.cos(t*.018)*5.2); moon.sphere.rotation.y += dt*.040; moon.halo.rotation.y += dt*.018; if(moon.outer) moon.outer.rotation.y -= dt*.010;
      mars.group.position.set(22+Math.sin(t*.016)*9.0,49+Math.sin(t*.010)*.9,-99+Math.cos(t*.016)*6.4); mars.sphere.rotation.y += dt*.068; mars.halo.rotation.y += dt*.023; if(mars.outer) mars.outer.rotation.y -= dt*.012;
    }
  };
}
