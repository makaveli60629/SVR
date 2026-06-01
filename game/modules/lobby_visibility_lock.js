import * as THREE from "three";

const REIKI_YAW = THREE.MathUtils.degToRad(348.93);
const COLORS = { reiki:"#7fffd4", pga:"#69e8ff", smoker:"#ff8bd7", store:"#ffd36b", scorpion:"#b48cff", sponsor:"#a7ff80" };

function makeLabelTexture(title, subtitle, color = "#69e8ff"){
  const c = document.createElement("canvas"); c.width = 1024; c.height = 512; const x = c.getContext("2d");
  x.clearRect(0,0,c.width,c.height); x.fillStyle = "rgba(0,0,0,.22)"; x.fillRect(0,0,c.width,c.height); x.strokeStyle = color; x.lineWidth = 10; x.strokeRect(28,28,c.width-56,c.height-56);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = color; x.shadowBlur = 20; x.fillStyle = "#fff"; x.font = "900 78px Arial"; x.fillText(String(title).toUpperCase(),512,206);
  x.shadowBlur = 7; x.fillStyle = color; x.font = "800 36px Arial"; x.fillText(String(subtitle).toUpperCase(),512,324);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function makeLogoTexture(title, subtitle, color = "#69e8ff", icon = "SVR"){
  const c = document.createElement("canvas"); c.width = 768; c.height = 768; const x = c.getContext("2d"); x.clearRect(0,0,768,768);
  const glow = x.createRadialGradient(384,338,30,384,338,360); glow.addColorStop(0,color); glow.addColorStop(.25,"rgba(255,255,255,.24)"); glow.addColorStop(1,"rgba(0,0,0,0)"); x.fillStyle = glow; x.fillRect(0,0,768,768);
  x.fillStyle = "rgba(0,0,0,.56)"; x.beginPath(); x.arc(384,310,156,0,Math.PI*2); x.fill(); x.strokeStyle = color; x.lineWidth = 12; x.beginPath(); x.arc(384,310,184,0,Math.PI*2); x.stroke();
  x.shadowColor = color; x.shadowBlur = 20; x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle"; x.font = "900 86px Arial"; x.fillText(icon,384,310);
  x.shadowBlur = 8; x.font = "900 50px Arial"; x.fillText(title.toUpperCase(),384,556); x.font = "800 24px Arial"; x.fillStyle = color; x.fillText(subtitle.toUpperCase(),384,612);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function makeScanTexture(){
  const c = document.createElement("canvas"); c.width = 512; c.height = 512; const x = c.getContext("2d"); x.clearRect(0,0,512,512);
  for(let y=0;y<512;y+=12){ x.fillStyle = y % 24 === 0 ? "rgba(127,255,212,.20)" : "rgba(127,255,212,.07)"; x.fillRect(0,y,512,2); }
  x.strokeStyle = "rgba(127,255,212,.48)"; x.lineWidth = 4; x.strokeRect(8,8,496,496); const t = new THREE.CanvasTexture(c); t.needsUpdate = true; return t;
}
function makePlanetTexture(kind = "moon"){
  const c = document.createElement("canvas"); c.width = 2048; c.height = 2048; const x = c.getContext("2d");
  const main = x.createRadialGradient(670,560,58,1024,1024,1020);
  if(kind === "mars"){ main.addColorStop(0,"#c97347"); main.addColorStop(.25,"#74301f"); main.addColorStop(.58,"#2d0f0b"); main.addColorStop(1,"#080201"); }
  else { main.addColorStop(0,"#cfd3dc"); main.addColorStop(.28,"#707784"); main.addColorStop(.60,"#252a34"); main.addColorStop(1,"#07090f"); }
  x.fillStyle = main; x.fillRect(0,0,2048,2048);
  if(kind === "mars"){
    x.globalAlpha = .48; x.strokeStyle = "#180604"; x.lineWidth = 9;
    for(let i=0;i<52;i++){ const yy = 135 + i*40 + Math.sin(i*1.55)*28; x.beginPath(); x.moveTo(65,yy); for(let xx=65;xx<1995;xx+=56) x.lineTo(xx, yy + Math.sin(xx*.012+i)*22); x.stroke(); }
    x.globalAlpha = .26; x.fillStyle = "#b86543"; for(let i=0;i<160;i++){ x.beginPath(); x.ellipse(Math.random()*2048, Math.random()*2048, 12+Math.random()*90, 5+Math.random()*28, Math.random()*Math.PI, 0, Math.PI*2); x.fill(); }
    x.globalAlpha = .34; x.fillStyle = "#1b0704"; for(let i=0;i<120;i++){ x.beginPath(); x.ellipse(Math.random()*2048, Math.random()*2048, 8+Math.random()*44, 4+Math.random()*18, Math.random()*Math.PI, 0, Math.PI*2); x.fill(); }
  } else {
    x.globalAlpha = .56; x.fillStyle = "#121722"; for(let i=0;i<340;i++){ x.beginPath(); x.arc(Math.random()*2048, Math.random()*2048, 6+Math.random()*76, 0, Math.PI*2); x.fill(); }
    x.globalAlpha = .30; x.strokeStyle = "#a8b0bd"; x.lineWidth = 4; for(let i=0;i<125;i++){ x.beginPath(); x.arc(Math.random()*2048, Math.random()*2048, 16+Math.random()*88, 0, Math.PI*2); x.stroke(); }
    x.globalAlpha = .24; x.fillStyle = "#d7dde8"; for(let i=0;i<90;i++){ x.beginPath(); x.arc(Math.random()*2048, Math.random()*2048, 2+Math.random()*8, 0, Math.PI*2); x.fill(); }
  }
  x.globalAlpha = 1; const contrast = x.createLinearGradient(0,0,2048,2048); contrast.addColorStop(0,"rgba(255,255,255,.12)"); contrast.addColorStop(.38,"rgba(0,0,0,.02)"); contrast.addColorStop(1,"rgba(0,0,0,.72)"); x.fillStyle = contrast; x.fillRect(0,0,2048,2048);
  const vignette = x.createRadialGradient(660,560,230,1024,1024,1040); vignette.addColorStop(0,"rgba(255,255,255,.10)"); vignette.addColorStop(.58,"rgba(0,0,0,0)"); vignette.addColorStop(1,"rgba(0,0,0,.70)"); x.fillStyle = vignette; x.fillRect(0,0,2048,2048);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function makeVolumeTexture(volume = 1, muted = false, gain = 3.5, primed = false){
  const c = document.createElement("canvas"); c.width = 1400; c.height = 720; const x = c.getContext("2d"); const pct = Math.round(volume * 100); const boost = gain.toFixed(1);
  x.fillStyle = "rgba(0,0,0,.86)"; x.fillRect(0,0,c.width,c.height); const grad = x.createLinearGradient(0,0,c.width,c.height); grad.addColorStop(0,"rgba(127,255,212,.18)"); grad.addColorStop(1,"rgba(180,140,255,.12)"); x.fillStyle = grad; x.fillRect(0,0,c.width,c.height);
  x.strokeStyle = muted ? "#ff6b7f" : COLORS.reiki; x.lineWidth = 18; x.strokeRect(36,36,c.width-72,c.height-72);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = muted ? "#ff6b7f" : COLORS.reiki; x.shadowBlur = 26; x.fillStyle = "#fff"; x.font = "900 76px Arial"; x.fillText("REIKI HOLOGRAM AUDIO",700,104);
  x.shadowBlur = 8; x.fillStyle = muted ? "#ff6b7f" : COLORS.reiki; x.font = "900 58px Arial"; x.fillText(muted ? "MUTED" : `VOLUME ${pct}%  •  BOOST ${boost}x`,700,196);
  x.fillStyle = primed ? "#7fffd4" : "#ffd36b"; x.font = "900 40px Arial"; x.fillText(primed ? "AUDIO UNLOCKED" : "CLICK GAME ONCE TO UNLOCK AUDIO",700,275);
  x.fillStyle = "rgba(255,255,255,.14)"; x.fillRect(185,348,1030,70); x.strokeStyle = "rgba(255,255,255,.38)"; x.lineWidth = 4; x.strokeRect(185,348,1030,70);
  x.fillStyle = muted ? "#ff6b7f" : COLORS.reiki; x.fillRect(185,348,Math.max(10,1030*Math.min(1,gain/6)),70);
  x.shadowBlur = 0; x.fillStyle = "#ffffff"; x.font = "900 38px Arial"; x.fillText("[  LOWER BOOST   ]       [  HIGHER BOOST   ]       U = MUTE",700,500);
  x.fillStyle = "#c9fff1"; x.font = "800 31px Arial"; x.fillText("Walk into the Reiki glass hub to hear the voice",700,578); x.fillText("This uses WebAudio gain, not browser volume only",700,628);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.needsUpdate = true; return t;
}
function addPanel(root, title, subtitle, x, y, z, color, w = 4.6, h = 1.35){ const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), new THREE.MeshBasicMaterial({ map: makeLabelTexture(title, subtitle, color), transparent:true, side:THREE.DoubleSide, depthWrite:false })); m.position.set(x,y,z); m.lookAt(0,y,0); root.add(m); return m; }
function addPortal(root,cfg){
  const color = new THREE.Color(cfg.color).getHex(); const group = new THREE.Group(); group.position.set(cfg.x,0,cfg.z); group.userData.portalKey = cfg.key; root.add(group);
  const ring = new THREE.Mesh(new THREE.RingGeometry(.72,1.15,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.62, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x=-Math.PI/2; ring.position.y=.045; group.add(ring);
  const disk = new THREE.Mesh(new THREE.CircleGeometry(1.10,96), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.11, side:THREE.DoubleSide, depthWrite:false })); disk.rotation.x=-Math.PI/2; disk.position.y=.035; group.add(disk);
  const pillar = new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,2.55,24,1,true), new THREE.MeshBasicMaterial({ color, transparent:true, opacity:.16, side:THREE.DoubleSide, depthWrite:false })); pillar.position.y=1.28; group.add(pillar);
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(1.95,1.95), new THREE.MeshBasicMaterial({ map:makeLogoTexture(cfg.title,cfg.subtitle,cfg.color,cfg.icon), transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.97 })); logo.position.set(0,2.72,.02); if(cfg.rotationY!==undefined) logo.rotation.y=cfg.rotationY; else logo.lookAt(-cfg.x,2.72,-cfg.z); group.add(logo);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(2.9,.78), new THREE.MeshBasicMaterial({ map:makeLabelTexture(cfg.title,cfg.subtitle,cfg.color), transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.94 })); label.position.set(0,1.34,.03); if(cfg.rotationY!==undefined) label.rotation.y=cfg.rotationY; else label.lookAt(-cfg.x,1.34,-cfg.z); group.add(label); return group;
}
function addConnector(root,a,b){ const start=new THREE.Vector3(a.x,.04,a.z), end=new THREE.Vector3(b.x,.04,b.z), mid=start.clone().add(end).multiplyScalar(.5); const mesh=new THREE.Mesh(new THREE.BoxGeometry(.10,.035,start.distanceTo(end)), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.28, depthWrite:false })); mesh.position.copy(mid); mesh.rotation.y=Math.atan2(b.x-a.x,b.z-a.z); root.add(mesh); }
function addGlassHubExpansion(root){
  const group = new THREE.Group(); group.name = "SVR_Reiki_Expanded_Glass_Hub_Phase98P"; root.add(group);
  const glassMat = new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.14, side:THREE.DoubleSide, depthWrite:false }); const edgeMat = new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.46, depthWrite:false }); const floorMat = new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.09, side:THREE.DoubleSide, depthWrite:false }); const carpetMat = new THREE.MeshBasicMaterial({ color:0x6e1026, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(10.8,4.2), floorMat); floor.rotation.x=-Math.PI/2; floor.position.set(19.25,.025,-4.72); group.add(floor); const carpet = new THREE.Mesh(new THREE.PlaneGeometry(8.6,2.35), carpetMat); carpet.rotation.x=-Math.PI/2; carpet.position.set(20.25,.035,-5.05); group.add(carpet);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(10.8,3.15), glassMat); back.position.set(19.25,1.78,-6.72); group.add(back); const front = new THREE.Mesh(new THREE.PlaneGeometry(10.8,2.55), glassMat); front.position.set(19.25,1.48,-2.88); front.rotation.y=Math.PI; group.add(front);
  const left = new THREE.Mesh(new THREE.PlaneGeometry(3.85,2.75), glassMat); left.position.set(13.85,1.58,-4.80); left.rotation.y=Math.PI/2; group.add(left); const right = new THREE.Mesh(new THREE.PlaneGeometry(3.85,2.75), glassMat); right.position.set(24.65,1.58,-4.80); right.rotation.y=-Math.PI/2; group.add(right);
  const edges = [[19.25,3.35,-6.72,10.8,.055,.055],[19.25,.18,-6.72,10.8,.055,.055],[19.25,2.80,-2.88,10.8,.055,.055],[19.25,.18,-2.88,10.8,.055,.055],[13.85,1.62,-4.80,.055,2.85,.055],[24.65,1.62,-4.80,.055,2.85,.055],[13.85,.18,-4.80,.055,.055,3.85],[24.65,.18,-4.80,.055,.055,3.85]]; for(const e of edges){ const m=new THREE.Mesh(new THREE.BoxGeometry(e[3],e[4],e[5]),edgeMat); m.position.set(e[0],e[1],e[2]); group.add(m); }
  addPanel(group,"Reiki Glass Hub","Audio boost active",19.25,3.72,-6.70,COLORS.reiki,6.2,1.15); return group;
}
function addOrb(root,color,x,y,z,scale,kind){ const g = new THREE.Group(); g.position.set(x,y,z); root.add(g); const sphere = new THREE.Mesh(new THREE.SphereGeometry(scale,96,64), new THREE.MeshBasicMaterial({ map:makePlanetTexture(kind), color: kind === "mars" ? 0xb16b50 : 0xb5bbc6 })); g.add(sphere); const halo = new THREE.Mesh(new THREE.SphereGeometry(scale*1.15,64,32), new THREE.MeshBasicMaterial({ color, transparent:true, opacity: kind === "mars" ? .035 : .042, side:THREE.BackSide, depthWrite:false })); g.add(halo); const light = new THREE.PointLight(color, kind === "mars" ? .38 : .46, 210, 1.6); g.add(light); return { group:g, sphere, halo }; }
function addReikiVideo(root){
  const g = new THREE.Group(); g.position.set(20.69,1.74,-5.40); g.rotation.y=REIKI_YAW; root.add(g);
  const video = document.createElement("video"); video.src="../site/assets/video/reiki_hologram.mp4"; video.muted=true; video.loop=true; video.playsInline=true; video.autoplay=true; video.preload="auto"; video.volume=1; video.play().catch(()=>{});
  let primed=false,currentVolume=0,maxVolume=1,gainBoost=3.5,panel=null,muted=false,audioCtx=null,gainNode=null,mediaSource=null;
  const zoneCenter = new THREE.Vector3(20.69,1.6,-5.40);
  const refreshPanel=()=>{ if(!panel) return; const tex=makeVolumeTexture(maxVolume,muted,gainBoost,primed); panel.material.map?.dispose?.(); panel.material.map=tex; panel.material.needsUpdate=true; };
  const setupAudio=()=>{ try{ const AC = window.AudioContext || window.webkitAudioContext; if(!AC) return false; if(!audioCtx) audioCtx = new AC(); if(audioCtx.state === "suspended") audioCtx.resume().catch(()=>{}); if(!mediaSource){ mediaSource = audioCtx.createMediaElementSource(video); gainNode = audioCtx.createGain(); mediaSource.connect(gainNode); gainNode.connect(audioCtx.destination); } return true; }catch(err){ console.warn("SVR Reiki audio boost setup failed", err); return false; } };
  const setBoost=(v)=>{ gainBoost=THREE.MathUtils.clamp(v,.2,8); refreshPanel(); };
  const primeAudio=()=>{ primed=true; setupAudio(); video.muted=muted; video.volume=1; video.play().catch(()=>{}); refreshPanel(); };
  window.addEventListener("pointerdown",primeAudio,{once:true,passive:true}); window.addEventListener("keydown",primeAudio,{once:true});
  window.addEventListener("keydown",(e)=>{ if(e.repeat) return; if(e.code==="BracketRight"||e.code==="Equal"){ muted=false; setBoost(gainBoost+.5); } if(e.code==="BracketLeft"||e.code==="Minus"){ setBoost(gainBoost-.5); } if(e.code==="KeyU"){ muted=!muted; refreshPanel(); } });
  window.SVR_REIKI_AUDIO = { primeAudio, setVolume:(v)=>{maxVolume=THREE.MathUtils.clamp(v,0,1);refreshPanel();}, setBoost, getVolume:()=>maxVolume, getBoost:()=>gainBoost, mute:()=>{muted=true;refreshPanel();}, unmute:()=>{muted=false;refreshPanel();}, toggleMute:()=>{muted=!muted;refreshPanel();} };
  const tex = new THREE.VideoTexture(video); tex.colorSpace=THREE.SRGBColorSpace; tex.minFilter=THREE.LinearFilter; tex.magFilter=THREE.LinearFilter;
  const wallGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.7,2.18), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.080, side:THREE.DoubleSide, depthWrite:false })); wallGlow.position.z=.010; g.add(wallGlow); const screen = new THREE.Mesh(new THREE.PlaneGeometry(3.12,1.76), new THREE.MeshBasicMaterial({ map:tex, side:THREE.DoubleSide, toneMapped:false, transparent:true, opacity:.99, depthWrite:false })); screen.position.z=.035; g.add(screen); const scan = new THREE.Mesh(new THREE.PlaneGeometry(3.15,1.78), new THREE.MeshBasicMaterial({ map:makeScanTexture(), color:0x7fffd4, transparent:true, opacity:.15, side:THREE.DoubleSide, depthWrite:false })); scan.position.z=.052; g.add(scan); const ring = new THREE.Mesh(new THREE.RingGeometry(1.35,1.90,96), new THREE.MeshBasicMaterial({ color:0x7fffd4, transparent:true, opacity:.42, side:THREE.DoubleSide, depthWrite:false })); ring.rotation.x=-Math.PI/2; ring.position.set(0,-1.70,.95); g.add(ring);
  panel = new THREE.Mesh(new THREE.PlaneGeometry(4.55,2.28), new THREE.MeshBasicMaterial({ map:makeVolumeTexture(maxVolume,muted,gainBoost,primed), transparent:true, side:THREE.DoubleSide, depthWrite:false, opacity:.98 })); panel.position.set(18.18,2.38,-2.72); panel.rotation.y=THREE.MathUtils.degToRad(180); root.add(panel);
  return { group:g, video, zoneCenter, scan, volumePanel:panel, primeAudio, getState(){ return { videoOn:!video.paused, primed, near:currentVolume>.004, volume:currentVolume, maxVolume, gainBoost, muted }; }, updateAudio(camera,dt=.016){ if(!camera) return; const p=new THREE.Vector3(); camera.getWorldPosition(p); const d=Math.hypot(p.x-zoneCenter.x,p.z-zoneCenter.z); const near=3.75, fade=8.0; let target=0; if(d<fade&&!muted) target=maxVolume*THREE.MathUtils.clamp((fade-d)/(fade-near),0,1); currentVolume=THREE.MathUtils.lerp(currentVolume,target,Math.min(1,dt*3.2)); if(gainNode) gainNode.gain.value = currentVolume * gainBoost; else video.volume = Math.min(1,currentVolume); video.muted=!primed||muted||currentVolume<.002; scan.material.opacity=.12+Math.sin(performance.now()*.006)*.04; if(video.paused) video.play().catch(()=>{}); } };
}
export function installLobbyVisibilityLock({ scene }){
  const root = new THREE.Group(); root.name="SVR_Phase98P_Reiki_Audio_Boost"; scene.add(root); const reikiMain = new THREE.Vector3(-5.6,0,-9.15), reikiExact = new THREE.Vector3(20.69,0,-5.40);
  const portals = [ {key:"reiki",label:"Reiki Main",target:"reiki",position:reikiMain.clone()}, {key:"reikiExpanded",label:"Reiki Hologram Hub",target:"reiki",position:reikiExact.clone()}, {key:"pga",label:"PGA",target:"pga",position:new THREE.Vector3(0,0,-9.25)}, {key:"smoker",label:"Smoker Lounge",target:"sponsor",position:new THREE.Vector3(5.6,0,-9.15)}, {key:"store",label:"SVR Store",route:"../site/store.html",position:new THREE.Vector3(-9.25,0,.8)}, {key:"scorpion",label:"Scorpion Room",route:"./scorpion.html?v=phase98-playable",position:new THREE.Vector3(9.25,0,.8)} ];
  addGlassHubExpansion(root); addPortal(root,{key:"reiki",title:"Reiki",subtitle:"Main Portal",icon:"REI",color:COLORS.reiki,x:-5.6,z:-9.15}); addPortal(root,{key:"reikiExpanded",title:"Reiki",subtitle:"Hologram Hub",icon:"REI",color:COLORS.reiki,x:20.69,z:-5.40,rotationY:REIKI_YAW}); addPortal(root,{key:"pga",title:"PGA",subtitle:"Training",icon:"PGA",color:COLORS.pga,x:0,z:-9.25}); addPortal(root,{key:"smoker",title:"Smoker",subtitle:"Lounge",icon:"SMK",color:COLORS.smoker,x:5.6,z:-9.15}); addPortal(root,{key:"store",title:"SVR Store",subtitle:"Web Portal",icon:"SVR",color:COLORS.store,x:-9.25,z:.8}); addPortal(root,{key:"scorpion",title:"Scorpion",subtitle:"Play Poker",icon:"SCP",color:COLORS.scorpion,x:9.25,z:.8}); addPortal(root,{key:"sponsor",title:"Sponsor",subtitle:"Ad Wall",icon:"AD",color:COLORS.sponsor,x:0,z:9.25}); addConnector(root,reikiMain,reikiExact);
  const reikiVideo = addReikiVideo(root); addPanel(root,"Reiki Hologram","Audio boost active",20.69,4.35,-5.40,COLORS.reiki,5.2,1.35); addPanel(root,"Sponsor Board","Future partner surface",0,6.45,-11.35,COLORS.sponsor,6.5,1.9); addPanel(root,"Espresso With Cream","Tier 1 sponsor",8.9,6.2,-5.35,"#ffb477",4.6,1.55); addPanel(root,"SVR Store","Official brand",-8.9,6.2,-5.35,COLORS.store,4.6,1.55); addPanel(root,"Scorpion Room","Playable poker now open",8.9,5.4,5.35,COLORS.scorpion,4.6,1.55); addPanel(root,"Play With Purpose","Community impact",0,6.45,11.35,COLORS.pga,6.5,1.9);
  const moon = addOrb(root,0x7898d8,-10,72,-126,5.75,"moon"); const mars = addOrb(root,0xd64c2b,24,66,-145,3.55,"mars");
  return { portals, reikiVideo, primeReikiAudio:reikiVideo.primeAudio, getReikiAudioState:reikiVideo.getState, update(t=0,dt=.016){ const cam=scene.userData?._camera; reikiVideo.updateAudio(cam,dt); moon.group.position.set(-10+Math.sin(t*.012)*7.5,72+Math.sin(t*.008)*.85,-126+Math.cos(t*.012)*4.8); moon.sphere.rotation.y+=dt*.032; moon.halo.rotation.y+=dt*.012; mars.group.position.set(24+Math.sin(t*.010)*8.0,66+Math.sin(t*.007)*.7,-145+Math.cos(t*.010)*5.7); mars.sphere.rotation.y+=dt*.056; mars.halo.rotation.y+=dt*.016; } };
}
