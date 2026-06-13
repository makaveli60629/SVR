import * as THREE from "three";

function makeTexture(w,h,title,lines=[],accent="#7dfff0"){
  const c=document.createElement("canvas"); c.width=w; c.height=h; const ctx=c.getContext("2d");
  const g=ctx.createLinearGradient(0,0,w,h); g.addColorStop(0,"#02080b"); g.addColorStop(1,"#120617"); ctx.fillStyle=g; ctx.fillRect(0,0,w,h);
  ctx.strokeStyle=accent; ctx.lineWidth=14; ctx.strokeRect(28,28,w-56,h-56);
  ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle="#f7ffff"; ctx.font="900 58px system-ui,Arial"; ctx.fillText(title,w/2,110,w-90);
  ctx.fillStyle="#dcfff7"; ctx.font="700 32px system-ui,Arial"; let y=230; lines.forEach(line=>{ctx.fillText(line,w/2,y,w-100);y+=58;});
  ctx.fillStyle="rgba(105,232,255,.14)"; ctx.fillRect(90,h-150,w-180,88); ctx.strokeStyle="#69e8ff"; ctx.lineWidth=7; ctx.strokeRect(90,h-150,w-180,88);
  ctx.fillStyle="#dffcff"; ctx.font="900 34px system-ui,Arial"; ctx.fillText("SPONSOR PLACEHOLDER",w/2,h-106,w-120);
  const t=new THREE.CanvasTexture(c); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=8; return t;
}
function button(label,accent){return new THREE.Mesh(new THREE.PlaneGeometry(.92,.40),new THREE.MeshBasicMaterial({map:makeTexture(900,420,label,["tap / trigger"],accent),transparent:true,side:THREE.DoubleSide,depthWrite:false}));}
function isChildOf(obj,parent){let p=obj;while(p){if(p===parent)return true;p=p.parent;}return false;}
function hideLegacy(scene,group){const pos=new THREE.Vector3();scene.traverse(obj=>{if(!obj?.isMesh||isChildOf(obj,group))return;obj.getWorldPosition(pos);const local=group.worldToLocal(pos.clone());const near=Math.abs(local.x)<7&&local.y>.4&&local.y<6.2&&local.z>-3.8&&local.z<2;if(near&&(obj.geometry?.type?.includes("Plane")||obj.material?.map||obj.material?.transparent))obj.visible=false;});}

export function applyReikiHologramPhase133({scene,camera,renderer,sceneTargets,setStatus=()=>{},log=()=>{}}={}){
  if(!scene||scene.userData._phase135ReikiWallAligned)return scene?.userData?._phase135ReikiWallAligned;
  const rec=sceneTargets?.reiki||sceneTargets?.reikiRoom;if(!rec?.pos||!rec?.look)return null;
  const wallCenter=rec.look.clone();wallCenter.y=0;const group=new THREE.Group();group.name="PHASE156 WALL ALIGNED REIKI PLACEHOLDER HOLOGRAM";group.position.copy(wallCenter);
  const entry=new THREE.Vector3().subVectors(rec.pos,wallCenter);entry.y=0;if(entry.lengthSq()<.001)entry.set(-1,0,0);else entry.normalize();group.rotation.y=Math.atan2(entry.x,entry.z);scene.add(group);group.updateMatrixWorld(true);hideLegacy(scene,group);
  const teal=new THREE.MeshStandardMaterial({color:0x7dfff0,emissive:0x218c82,emissiveIntensity:.72,roughness:.24,metalness:.38});
  const dark=new THREE.MeshStandardMaterial({color:0x020607,emissive:0x061015,emissiveIntensity:.22,roughness:.86,metalness:.06});
  const back=new THREE.Mesh(new THREE.BoxGeometry(11.2,5.15,.18),dark);back.position.set(0,2.88,.10);group.add(back);
  [[0,5.48,.0,11.4,.16,.24],[-5.68,2.88,.0,.16,5.25,.24],[5.68,2.88,.0,.16,5.25,.24]].forEach(v=>{const m=new THREE.Mesh(new THREE.BoxGeometry(v[3],v[4],v[5]),teal);m.position.set(v[0],v[1],v[2]);group.add(m);});
  const left=new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42),new THREE.MeshBasicMaterial({map:makeTexture(900,1200,"REIKI HUB",["Sponsor placeholder","Profile unassigned","Website unassigned","Logo unassigned","Approval required"]),transparent:true,side:THREE.DoubleSide,depthWrite:false}));left.position.set(-3.78,2.78,-.18);group.add(left);
  const right=new THREE.Mesh(new THREE.PlaneGeometry(2.28,3.42),new THREE.MeshBasicMaterial({map:makeTexture(900,1200,"PROFILE SLOT",["Reserved photo area","Approved sponsor only","Placeholder active"],"#b58cff"),transparent:true,side:THREE.DoubleSide,depthWrite:false}));right.position.set(3.78,2.78,-.18);group.add(right);
  const video=document.createElement("video");video.src="./assets/video/reiki_hologram.mp4";video.loop=true;video.playsInline=true;video.preload="metadata";video.muted=true;video.volume=.85;
  const videoTex=new THREE.VideoTexture(video);videoTex.colorSpace=THREE.SRGBColorSpace;
  const slides=[{kind:"video",map:null},{kind:"panel",map:makeTexture(900,1200,"ABOUT",["Reiki Hub placeholder","Future sponsor slot","Approved copy only"])},{kind:"panel",map:makeTexture(900,1200,"PLACEHOLDER",["Provider unassigned","Booking placeholder","Website blank"],"#7dffb2")}];
  let index=0;const displayMat=new THREE.MeshBasicMaterial({map:videoTex,transparent:true,opacity:.92,side:THREE.DoubleSide,depthWrite:false});const display=new THREE.Mesh(new THREE.PlaneGeometry(2.20,3.50),displayMat);display.position.set(0,2.92,-.62);group.add(display);const frame=new THREE.Mesh(new THREE.BoxGeometry(2.42,3.75,.08),teal);frame.position.set(0,2.92,-.66);group.add(frame);
  const prev=button("BACK","#b58cff"),next=button("NEXT","#7dffb2");prev.position.set(-1.9,.78,-.80);next.position.set(1.9,.78,-.80);group.add(prev,next);
  function setSlide(n){index=(n+slides.length)%slides.length;const s=slides[index];displayMat.map=s.kind==="video"?videoTex:s.map;displayMat.needsUpdate=true;if(s.kind!=="video")video.pause();setStatus(`Reiki hologram slide ${index+1}/${slides.length}`,{force:true});}
  setSlide(0);const ray=new THREE.Raycaster(),mouse=new THREE.Vector2();renderer?.domElement?.addEventListener("pointerdown",ev=>{const r=renderer.domElement.getBoundingClientRect();mouse.x=((ev.clientX-r.left)/r.width)*2-1;mouse.y=-((ev.clientY-r.top)/r.height)*2+1;ray.setFromCamera(mouse,camera);const hit=ray.intersectObjects([prev,next,display],true)[0];if(!hit)return;hit.object===prev?setSlide(index-1):setSlide(index+1);},{passive:true});
  const oldTick=scene.userData._tickWorld;let primed=false;window.addEventListener("pointerdown",()=>{primed=true;},{passive:true});scene.userData._tickWorld=dt=>{oldTick?.(dt);if(primed&&index===0){if(video.paused)video.play().catch(()=>{});}else{if(!video.paused)video.pause();}display.position.y=2.92+Math.sin(performance.now()*.002)*.03;};
  scene.userData._phase135ReikiWallAligned={group,setSlide,video};window.SVR_PHASE156_REIKI_PLACEHOLDER=true;log?.("Phase 156 Reiki placeholder hologram active");setStatus("Phase 156 Reiki placeholder hologram active",{force:true});return scene.userData._phase135ReikiWallAligned;
}
