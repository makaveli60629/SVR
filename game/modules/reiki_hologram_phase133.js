import * as THREE from "three";

const PHOTO_URL = "./assets/ui/shyona_royston.png";
const VIDEO_URL = "./assets/video/reiki_hologram.mp4";

function makeTexture(w, h, draw){
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  draw(ctx, w, h);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function roundRect(ctx, x, y, w, h, r){
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawApproval(ctx, w, h){
  ctx.fillStyle = "rgba(190,0,22,.30)";
  roundRect(ctx, 90, h - 150, w - 180, 86, 24);
  ctx.fill();
  ctx.strokeStyle = "#ff3048";
  ctx.lineWidth = 8;
  roundRect(ctx, 90, h - 150, w - 180, 86, 24);
  ctx.stroke();
  ctx.fillStyle = "#ffb3bb";
  ctx.font = "900 38px system-ui, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("AWAITING APPROVAL", w / 2, h - 106);
}

function portraitPanel(title, lines){
  return makeTexture(900, 1200, (ctx, w, h)=>{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#031014");
    grad.addColorStop(1, "#120816");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#7dfff0";
    ctx.lineWidth = 14;
    roundRect(ctx, 26, 26, w - 52, h - 52, 42);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7ffff";
    ctx.font = "900 56px system-ui, Arial";
    ctx.fillText(title, w / 2, 98);
    ctx.fillStyle = "#dffff8";
    ctx.font = "700 31px system-ui, Arial";
    let y = 210;
    for (const line of lines){
      ctx.fillText(line, w / 2, y);
      y += 58;
    }
    drawApproval(ctx, w, h);
  });
}

function founderInfoTexture(){
  return portraitPanel("FOUNDER INFO", [
    "Trueitive.com presentation",
    "Release • relax • rejuvenate",
    "Massage therapy",
    "Reiki energy healing",
    "Meditation support",
    "Holistic nutrition support",
    "North Hollywood, CA",
    "Info@Trueitive.com"
  ]);
}

function shyonaFallbackTexture(){
  return makeTexture(900, 1200, (ctx, w, h)=>{
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#061417");
    grad.addColorStop(1, "#1a0a17");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#7dfff0";
    ctx.lineWidth = 14;
    roundRect(ctx, 26, 26, w - 52, h - 52, 42);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const glow = ctx.createRadialGradient(w/2, 325, 20, w/2, 350, 230);
    glow.addColorStop(0, "#ffe3d6");
    glow.addColorStop(.55, "#9b5d52");
    glow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.ellipse(w/2, 325, 150, 190, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#f7ffff";
    ctx.font = "900 56px system-ui, Arial";
    ctx.fillText("Shyona Royston", w / 2, 625);
    ctx.fillStyle = "#dffff8";
    ctx.font = "700 32px system-ui, Arial";
    ctx.fillText("Trueitive.com founder image", w / 2, 710);
    ctx.fillText("Use approved local image at", w / 2, 770);
    ctx.fillText("assets/ui/shyona_royston.png", w / 2, 830);
    drawApproval(ctx, w, h);
  });
}

function slideTexture(title, lines, accent = "#7dfff0"){
  return makeTexture(900, 1200, (ctx, w, h)=>{
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 14;
    roundRect(ctx, 28, 28, w - 56, h - 56, 42);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7ffff";
    ctx.font = "900 66px system-ui, Arial";
    ctx.fillText(title, w / 2, 120);
    ctx.fillStyle = "#dffff8";
    ctx.font = "700 36px system-ui, Arial";
    let y = 265;
    for (const line of lines){
      ctx.fillText(line, w / 2, y);
      y += 70;
    }
    drawApproval(ctx, w, h);
  });
}

function chakraTexture(){
  return makeTexture(900, 1200, (ctx, w, h)=>{
    ctx.fillStyle = "#020408";
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = "#7dfff0";
    ctx.lineWidth = 14;
    roundRect(ctx, 28, 28, w - 56, h - 56, 42);
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f7ffff";
    ctx.font = "900 64px system-ui, Arial";
    ctx.fillText("7 CHAKRAS", w / 2, 105);
    const names = ["Crown", "Third Eye", "Throat", "Heart", "Solar", "Sacral", "Root"];
    const colors = ["#d88cff", "#7b6cff", "#54d9ff", "#55ff99", "#ffd13d", "#ff8a2a", "#ff3355"];
    names.forEach((name, i)=>{
      const y = 220 + i * 105;
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(230, y, 38, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,.85)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(230, y, 52, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 34px serif";
      ctx.fillText("✦", 230, y + 2);
      ctx.fillStyle = "#eaffff";
      ctx.font = "900 34px system-ui, Arial";
      ctx.fillText(name, 520, y);
    });
    drawApproval(ctx, w, h);
  });
}

function buttonTexture(label, accent){
  return slideTexture(label, ["Tap / trigger"], accent);
}

function makeButton(label, accent){
  return new THREE.Mesh(
    new THREE.PlaneGeometry(.95, .42),
    new THREE.MeshBasicMaterial({ map: buttonTexture(label, accent), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
}

export function applyReikiHologramPhase133({scene, camera, renderer, sceneTargets, setStatus = ()=>{}, log = ()=>{}} = {}){
  if (!scene || scene.userData._phase133ReikiHologram) return scene?.userData?._phase133ReikiHologram;
  const rec = sceneTargets?.reiki || sceneTargets?.reikiRoom;
  if (!rec?.pos || !rec?.look) return null;

  const forward = new THREE.Vector3().subVectors(rec.look, rec.pos);
  forward.y = 0;
  if (forward.lengthSq() < .001) forward.set(0, 0, -1); else forward.normalize();
  const center = rec.pos.clone().addScaledVector(forward, 3.9);
  const group = new THREE.Group();
  group.name = "PHASE134 TRUEITIVE INTERACTIVE REIKI HOLOGRAM";
  group.position.copy(center);
  const entry = new THREE.Vector3().subVectors(rec.pos, center);
  entry.y = 0;
  entry.normalize();
  group.rotation.y = Math.atan2(entry.x, entry.z);
  scene.add(group);

  const teal = new THREE.MeshStandardMaterial({color:0x7dfff0, emissive:0x218c82, emissiveIntensity:.65, roughness:.25, metalness:.35});
  const dark = new THREE.MeshStandardMaterial({color:0x03070a, emissive:0x020808, emissiveIntensity:.22, roughness:.82, metalness:.05});
  const glass = new THREE.MeshStandardMaterial({color:0x7dfff0, transparent:true, opacity:.10, side:THREE.DoubleSide, depthWrite:false});
  const carpet = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 6.1), new THREE.MeshStandardMaterial({color:0x8b071e, roughness:.86, side:THREE.DoubleSide}));
  carpet.rotation.x = -Math.PI / 2;
  carpet.position.set(0, .018, 2.0);
  group.add(carpet);

  const cover = new THREE.Mesh(new THREE.BoxGeometry(10.8, 4.65, .18), dark);
  cover.position.set(0, 2.65, -1.16);
  group.add(cover);
  const backGlass = new THREE.Mesh(new THREE.PlaneGeometry(10.45, 4.35), glass);
  backGlass.position.set(0, 2.65, -1.05);
  group.add(backGlass);
  [[0,5.0,-1.0,10.9,.14,.22],[-5.48,2.7,-1.0,.14,4.7,.22],[5.48,2.7,-1.0,.14,4.7,.22]].forEach(([x,y,z,w,h,d])=>{
    const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), teal);
    m.position.set(x,y,z);
    group.add(m);
  });

  const left = new THREE.Mesh(new THREE.PlaneGeometry(2.22, 3.32), new THREE.MeshBasicMaterial({map: founderInfoTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false}));
  left.position.set(-3.75, 2.42, -.88);
  group.add(left);

  const photoMat = new THREE.MeshBasicMaterial({map: shyonaFallbackTexture(), transparent:true, side:THREE.DoubleSide, depthWrite:false});
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(2.22, 3.32), photoMat);
  photo.position.set(3.75, 2.42, -.88);
  group.add(photo);
  new THREE.TextureLoader().load(PHOTO_URL, (texture)=>{
    texture.colorSpace = THREE.SRGBColorSpace;
    photoMat.map = texture;
    photoMat.needsUpdate = true;
  }, undefined, ()=>{});

  const video = document.createElement("video");
  video.src = VIDEO_URL;
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.muted = true;
  video.volume = .85;
  const videoTex = new THREE.VideoTexture(video);
  videoTex.colorSpace = THREE.SRGBColorSpace;

  const slides = [
    {kind:"video", map:null},
    {kind:"panel", map:slideTexture("ABOUT", ["Trueitive.com", "Release • relax • rejuvenate", "Energy in motion", "Mind • body • spirit"], "#b58cff")},
    {kind:"panel", map:chakraTexture()},
    {kind:"panel", map:slideTexture("REIKI", ["Energy healing", "Clear blockages", "Reduce stress", "Chakra balancing", "Inner peace"], "#7dffb2")}
  ];
  let index = 0;
  const displayMat = new THREE.MeshBasicMaterial({map: videoTex, transparent:true, opacity:.90, side:THREE.DoubleSide, depthWrite:false});
  const display = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 3.18), displayMat);
  display.position.set(0, 2.58, .68);
  group.add(display);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2.78, 3.42, .08), teal);
  frame.position.set(0, 2.58, .62);
  group.add(frame);

  const back = makeButton("BACK", "#b58cff");
  const next = makeButton("NEXT", "#7dffb2");
  back.position.set(-2.0, .92, .78);
  next.position.set(2.0, .92, .78);
  group.add(back, next);

  function setSlide(n){
    index = (n + slides.length) % slides.length;
    const slide = slides[index];
    displayMat.map = slide.kind === "video" ? videoTex : slide.map;
    displayMat.needsUpdate = true;
    if (slide.kind !== "video") video.pause();
    setStatus(`Reiki hologram slide ${index + 1}/${slides.length}`, {force:true});
  }
  setSlide(0);

  const ray = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  renderer?.domElement?.addEventListener("pointerdown", (ev)=>{
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    ray.setFromCamera(mouse, camera);
    const hit = ray.intersectObjects([back, next, display], true)[0];
    if (!hit) return;
    if (hit.object === back) setSlide(index - 1);
    else setSlide(index + 1);
  }, {passive:true});
  window.addEventListener("keydown", (ev)=>{
    if (ev.code === "ArrowLeft") setSlide(index - 1);
    if (ev.code === "ArrowRight") setSlide(index + 1);
  });

  let primed = false;
  let near = false;
  const worldPos = new THREE.Vector3();
  const camPos = new THREE.Vector3();
  const prime = ()=>{ primed = true; };
  window.addEventListener("pointerdown", prime, {passive:true});
  window.addEventListener("keydown", prime);
  const oldTick = scene.userData._tickWorld;
  scene.userData._tickWorld = (dt)=>{
    oldTick?.(dt);
    camera?.getWorldPosition(camPos);
    group.getWorldPosition(worldPos);
    near = camPos.distanceTo(worldPos) < 8.5;
    if (near && primed && index === 0){
      video.muted = false;
      if (video.paused) video.play().catch(()=>{});
    } else {
      if (!video.paused) video.pause();
      video.muted = true;
    }
    display.position.y = 2.58 + Math.sin(performance.now() * .002) * .035;
  };
  scene.userData._phase133ReikiHologram = {group, setSlide, video};
  log?.("Phase 134 Trueitive Reiki hologram active");
  setStatus("Phase 134 Reiki hologram refined", {force:true});
  return scene.userData._phase133ReikiHologram;
}
