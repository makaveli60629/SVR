import * as THREE from "three";

const PHOTO_URL = "./assets/ui/shyona_royston.png";
const VIDEO_URL = "./assets/video/reiki_hologram.mp4";

function tex(w, h, draw){
  const c = document.createElement("canvas"); c.width = w; c.height = h;
  const x = c.getContext("2d"); draw(x, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
function box(ctx,x,y,w,h,r){
  ctx.beginPath(); ctx.moveTo(x+r,y); ctx.lineTo(x+w-r,y); ctx.quadraticCurveTo(x+w,y,x+w,y+r); ctx.lineTo(x+w,y+h-r); ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h); ctx.lineTo(x+r,y+h); ctx.quadraticCurveTo(x,y+h,x,y+h-r); ctx.lineTo(x,y+r); ctx.quadraticCurveTo(x,y,x+r,y); ctx.closePath();
}
function panel(title, lines=[], accent="#7dfff0", footer="WAITING FOR APPROVAL"){
  return tex(1200,760,(c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,"#050b10"); g.addColorStop(.58,"#11051a"); g.addColorStop(1,"#020306");
    c.fillStyle=g; c.fillRect(0,0,w,h); c.strokeStyle=accent; c.lineWidth=12; box(c,28,28,w-56,h-56,34); c.stroke();
    c.textAlign="center"; c.textBaseline="middle"; c.fillStyle="#f7ffff"; c.font="900 72px system-ui,Arial"; c.fillText(title,w/2,112);
    c.fillStyle="#dcfff7"; c.font="700 38px system-ui,Arial"; let y=230;
    lines.forEach(line=>{ c.fillText(line,w/2,y); y+=62; });
    c.fillStyle="rgba(255,52,76,.20)"; box(c,210,h-145,w-420,74,22); c.fill();
    c.strokeStyle="rgba(255,110,120,.85)"; c.lineWidth=5; box(c,210,h-145,w-420,74,22); c.stroke();
    c.fillStyle="#ffd9dc"; c.font="900 30px system-ui,Arial"; c.fillText(footer,w/2,h-108);
  });
}
function founderInfo(){
  return panel("FOUNDER INFO", ["Shyona Royston", "Trueitive Reiki / Wellness", "Founder-led presentation", "Private session pathway", "Meditation room route"], "#7dfff0");
}
function chakraPanel(){
  return tex(1200,760,(c,w,h)=>{
    c.fillStyle="#030509"; c.fillRect(0,0,w,h); c.strokeStyle="#7dfff0"; c.lineWidth=12; box(c,28,28,w-56,h-56,34); c.stroke();
    c.textAlign="center"; c.textBaseline="middle"; c.fillStyle="#f7ffff"; c.font="900 68px system-ui,Arial"; c.fillText("7 CHAKRAS",w/2,90);
    const names=["Root","Sacral","Solar","Heart","Throat","Third Eye","Crown"];
    const colors=["#ff3355","#ff8a2a","#ffd13d","#55ff99","#54d9ff","#7b6cff","#d88cff"];
    names.forEach((n,i)=>{
      const x=150+i*150, y=330; c.fillStyle=colors[i]; c.beginPath(); c.arc(x,y,48,0,Math.PI*2); c.fill();
      c.strokeStyle="rgba(255,255,255,.85)"; c.lineWidth=5; c.beginPath(); c.arc(x,y,66,0,Math.PI*2); c.stroke();
      c.fillStyle="#fff"; c.font="900 44px serif"; c.fillText("✦",x,y+2);
      c.fillStyle="#eaffff"; c.font="800 26px system-ui,Arial"; c.fillText(n,x,y+108);
    });
    c.fillStyle="#dffff7"; c.font="700 34px system-ui,Arial"; c.fillText("Use NEXT / BACK to slide the hologram display",w/2,590);
    c.fillStyle="#ffd9dc"; c.font="900 30px system-ui,Arial"; c.fillText("WAITING FOR APPROVAL",w/2,670);
  });
}
function photoFallback(){
  return tex(900,1200,(c,w,h)=>{
    const g=c.createLinearGradient(0,0,w,h); g.addColorStop(0,"#0c171a"); g.addColorStop(1,"#1b0b18"); c.fillStyle=g; c.fillRect(0,0,w,h);
    c.strokeStyle="#7dfff0"; c.lineWidth=12; box(c,28,28,w-56,h-56,42); c.stroke();
    c.textAlign="center"; c.textBaseline="middle";
    const rg=c.createRadialGradient(w/2,320,20,w/2,350,210); rg.addColorStop(0,"#ffd8c5"); rg.addColorStop(.58,"#9b5d52"); rg.addColorStop(1,"rgba(0,0,0,0)");
    c.fillStyle=rg; c.beginPath(); c.ellipse(w/2,310,140,170,0,0,Math.PI*2); c.fill();
    c.fillStyle="#f7ffff"; c.font="900 56px system-ui,Arial"; c.fillText("Shyona Royston",w/2,650);
    c.fillStyle="#dcfff7"; c.font="700 34px system-ui,Arial"; c.fillText("Founder Photo",w/2,730); c.fillText("Upload final image to",w/2,790); c.fillText("assets/ui/shyona_royston.png",w/2,850);
    c.fillStyle="#ffd9dc"; c.font="900 30px system-ui,Arial"; c.fillText("WAITING FOR APPROVAL",w/2,1050);
  });
}
function makeButton(label, accent){
  return new THREE.Mesh(new THREE.PlaneGeometry(.95,.42), new THREE.MeshBasicMaterial({map:panel(label,["Tap / trigger"],accent,""), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
}

export function applyReikiHologramPhase133({scene,camera,renderer,sceneTargets,setStatus=()=>{},log=()=>{}}={}){
  if(!scene || scene.userData._phase133ReikiHologram) return scene?.userData?._phase133ReikiHologram;
  if(scene.userData._phase130ReikiDisplay?.group) scene.userData._phase130ReikiDisplay.group.visible=false;
  const rec=sceneTargets?.reiki || sceneTargets?.reikiRoom; if(!rec?.pos || !rec?.look) return null;
  const forward=new THREE.Vector3().subVectors(rec.look,rec.pos); forward.y=0; if(forward.lengthSq()<.001) forward.set(0,0,-1); else forward.normalize();
  const center=rec.pos.clone().addScaledVector(forward,3.9);
  const group=new THREE.Group(); group.name="PHASE133 CLEAN INTERACTIVE REIKI HOLOGRAM"; group.position.copy(center);
  const entry=new THREE.Vector3().subVectors(rec.pos,center); entry.y=0; entry.normalize(); group.rotation.y=Math.atan2(entry.x,entry.z); scene.add(group);

  const teal=new THREE.MeshStandardMaterial({color:0x7dfff0,emissive:0x218c82,emissiveIntensity:.65,roughness:.25,metalness:.35});
  const dark=new THREE.MeshStandardMaterial({color:0x03070a,emissive:0x020808,emissiveIntensity:.22,roughness:.82,metalness:.05});
  const glass=new THREE.MeshStandardMaterial({color:0x7dfff0,transparent:true,opacity:.10,side:THREE.DoubleSide,depthWrite:false});
  const carpet=new THREE.Mesh(new THREE.PlaneGeometry(5.2,6.1),new THREE.MeshStandardMaterial({color:0x8b071e,roughness:.86,side:THREE.DoubleSide})); carpet.rotation.x=-Math.PI/2; carpet.position.set(0,.018,2.0); group.add(carpet);
  const cover=new THREE.Mesh(new THREE.BoxGeometry(10.8,4.65,.18),dark); cover.position.set(0,2.65,-1.16); group.add(cover);
  const backGlass=new THREE.Mesh(new THREE.PlaneGeometry(10.45,4.35),glass); backGlass.position.set(0,2.65,-1.05); group.add(backGlass);
  [[0,5.0,-1.0,10.9,.14,.22],[-5.48,2.7,-1.0,.14,4.7,.22],[5.48,2.7,-1.0,.14,4.7,.22]].forEach(([x,y,z,w,h,d])=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),teal); m.position.set(x,y,z); group.add(m);});

  const left=new THREE.Mesh(new THREE.PlaneGeometry(2.25,3.2),new THREE.MeshBasicMaterial({map:founderInfo(),transparent:true,side:THREE.DoubleSide,depthWrite:false})); left.position.set(-3.75,2.42,-.88); group.add(left);
  const photoMat=new THREE.MeshBasicMaterial({map:photoFallback(),transparent:true,side:THREE.DoubleSide,depthWrite:false});
  const photo=new THREE.Mesh(new THREE.PlaneGeometry(2.25,3.2),photoMat); photo.position.set(3.75,2.42,-.88); group.add(photo);
  new THREE.TextureLoader().load(PHOTO_URL,(t)=>{t.colorSpace=THREE.SRGBColorSpace; photoMat.map=t; photoMat.needsUpdate=true;},undefined,()=>{});

  const video=document.createElement("video"); video.src=VIDEO_URL; video.loop=true; video.playsInline=true; video.preload="metadata"; video.muted=true; video.volume=.85;
  const videoTex=new THREE.VideoTexture(video); videoTex.colorSpace=THREE.SRGBColorSpace;
  const slides=[{kind:"video",map:null},{kind:"panel",map:panel("ABOUT",["Shyona Royston","Trueitive wellness presentation","Founder story and booking path"],"#b58cff")},{kind:"panel",map:chakraPanel()},{kind:"panel",map:panel("REIKI SYMBOLS",["Energy focus","Balance / reset","Guided meditation","Private Reiki room portal"],"#7dffb2")}];
  let index=0;
  const displayMat=new THREE.MeshBasicMaterial({map:videoTex,transparent:true,opacity:.86,side:THREE.DoubleSide,depthWrite:false});
  const display=new THREE.Mesh(new THREE.PlaneGeometry(3.2,1.9),displayMat); display.position.set(0,2.55,.65); group.add(display);
  const frame=new THREE.Mesh(new THREE.BoxGeometry(3.42,2.10,.08),teal); frame.position.set(0,2.55,.60); group.add(frame);
  const back=makeButton("BACK","#b58cff"); const next=makeButton("NEXT","#7dffb2"); back.position.set(-2.1,1.22,.72); next.position.set(2.1,1.22,.72); group.add(back,next);
  function setSlide(n){index=(n+slides.length)%slides.length; const s=slides[index]; displayMat.map=s.kind==="video"?videoTex:s.map; displayMat.needsUpdate=true; if(s.kind!=="video") video.pause(); setStatus(`Reiki hologram slide ${index+1}/${slides.length}`,{force:true});}
  setSlide(0);
  const ray=new THREE.Raycaster(); const mouse=new THREE.Vector2();
  renderer?.domElement?.addEventListener("pointerdown",ev=>{const r=renderer.domElement.getBoundingClientRect(); mouse.x=((ev.clientX-r.left)/r.width)*2-1; mouse.y=-((ev.clientY-r.top)/r.height)*2+1; ray.setFromCamera(mouse,camera); const hit=ray.intersectObjects([back,next,display],true)[0]; if(!hit)return; if(hit.object===back)setSlide(index-1); else setSlide(index+1);},{passive:true});
  window.addEventListener("keydown",ev=>{if(ev.code==="ArrowLeft")setSlide(index-1); if(ev.code==="ArrowRight")setSlide(index+1);});
  let primed=false,near=false; const wp=new THREE.Vector3(), cp=new THREE.Vector3(); const prime=()=>{primed=true;}; window.addEventListener("pointerdown",prime,{passive:true}); window.addEventListener("keydown",prime);
  const oldTick=scene.userData._tickWorld;
  scene.userData._tickWorld=(dt)=>{oldTick?.(dt); camera?.getWorldPosition(cp); group.getWorldPosition(wp); near=cp.distanceTo(wp)<8.5; if(near&&primed&&index===0){video.muted=false; if(video.paused)video.play().catch(()=>{});} else {if(!video.paused)video.pause(); video.muted=true;} display.position.y=2.55+Math.sin(performance.now()*.002)*.035;};
  scene.userData._phase133ReikiHologram={group,setSlide,video}; log?.("Phase 133 clean Reiki hologram active"); setStatus("Phase 133 Reiki hologram rebuilt",{force:true}); return scene.userData._phase133ReikiHologram;
}
