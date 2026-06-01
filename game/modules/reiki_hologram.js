import * as THREE from "three";

function makeLabelTexture(title, subtitle = ""){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  g.addColorStop(0, "rgba(2,10,18,0.78)");
  g.addColorStop(1, "rgba(16,0,28,0.82)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "rgba(124,245,255,0.95)";
  ctx.lineWidth = 10;
  ctx.strokeRect(16,16,canvas.width-32,canvas.height-32);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(124,245,255,0.9)";
  ctx.shadowBlur = 24;
  ctx.fillStyle = "#eaffff";
  ctx.font = "800 64px system-ui, Arial";
  ctx.fillText(title, canvas.width/2, 92);
  ctx.shadowBlur = 10;
  ctx.fillStyle = "#9dfcff";
  ctx.font = "700 32px system-ui, Arial";
  ctx.fillText(subtitle, canvas.width/2, 168);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeButtonTexture(text){
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 160;
  const ctx = canvas.getContext("2d");
  const g = ctx.createLinearGradient(0,0,canvas.width,canvas.height);
  g.addColorStop(0, "rgba(0,24,38,0.92)");
  g.addColorStop(1, "rgba(35,0,62,0.92)");
  ctx.fillStyle = g;
  ctx.fillRect(0,0,canvas.width,canvas.height);
  ctx.strokeStyle = "rgba(128,255,246,0.95)";
  ctx.lineWidth = 8;
  ctx.roundRect?.(14,14,canvas.width-28,canvas.height-28,36);
  if (ctx.roundRect) ctx.stroke(); else ctx.strokeRect(14,14,canvas.width-28,canvas.height-28);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "rgba(128,255,246,0.85)";
  ctx.shadowBlur = 16;
  ctx.fillStyle = "#eaffff";
  ctx.font = "900 44px system-ui, Arial";
  ctx.fillText(text, canvas.width/2, canvas.height/2);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function faceObjectAt(object, target){
  if (!object || !target) return;
  const look = target.clone();
  look.y = object.position.y;
  object.lookAt(look);
}

export function createReikiHologram({ scene, sceneTargets = {}, renderer = null, camera = null, log = console.log } = {}){
  if (!scene) return null;

  const group = new THREE.Group();
  group.name = "SVR_Reiki_Hologram_Video_Player";

  const reikiRoom = sceneTargets.reikiRoom || sceneTargets.reiki || null;
  const basePos = reikiRoom?.pos ? reikiRoom.pos.clone() : new THREE.Vector3(12.0, 0, 0);
  const look = reikiRoom?.look ? reikiRoom.look.clone() : new THREE.Vector3(0, 1.4, 0);
  group.position.set(basePos.x, 0.05, basePos.z);
  scene.add(group);
  faceObjectAt(group, look);

  const video = document.createElement("video");
  video.src = "./assets/video/reiki_hologram.mp4";
  video.crossOrigin = "anonymous";
  video.loop = true;
  video.playsInline = true;
  video.preload = "metadata";
  video.muted = false;
  video.volume = 0.58;
  video.style.display = "none";
  document.body.appendChild(video);

  const texture = new THREE.VideoTexture(video);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const screenMat = new THREE.MeshBasicMaterial({
    map: texture,
    transparent: true,
    opacity: 0.82,
    side: THREE.DoubleSide,
    toneMapped: false
  });
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.05, 3.62), screenMat);
  screen.name = "SVR_Reiki_Hologram_Screen";
  screen.position.set(0, 2.42, 0);
  group.add(screen);

  const glow = new THREE.Mesh(
    new THREE.PlaneGeometry(2.32, 3.95),
    new THREE.MeshBasicMaterial({ color: 0x50f6ff, transparent: true, opacity: 0.16, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide })
  );
  glow.position.copy(screen.position).add(new THREE.Vector3(0, 0, -0.018));
  group.add(glow);

  const frameMat = new THREE.MeshBasicMaterial({ color: 0x7dfff0, transparent: true, opacity: 0.88, blending: THREE.AdditiveBlending });
  const frame = new THREE.Mesh(new THREE.TorusGeometry(1.16, 0.018, 10, 80), frameMat);
  frame.scale.y = 1.72;
  frame.position.copy(screen.position).add(new THREE.Vector3(0, 0, 0.018));
  group.add(frame);

  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(2.8, 0.70),
    new THREE.MeshBasicMaterial({ map: makeLabelTexture("REIKI HOLOGRAM", "tap / trigger to start • volume controls below"), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  label.position.set(0, 4.70, 0.03);
  group.add(label);

  const floorHalo = new THREE.Mesh(
    new THREE.RingGeometry(0.82, 1.68, 80),
    new THREE.MeshBasicMaterial({ color: 0x66ffdd, transparent: true, opacity: 0.22, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, depthWrite: false })
  );
  floorHalo.rotation.x = -Math.PI / 2;
  floorHalo.position.set(0, 0.028, 0);
  group.add(floorHalo);

  const btnRoot = new THREE.Group();
  btnRoot.name = "SVR_Reiki_Hologram_Button_Row";
  btnRoot.position.set(0, 0.72, 0.06);
  group.add(btnRoot);

  const buttons = [
    ["PLAY", "play"], ["VOL -", "down"], ["VOL +", "up"], ["MUTE", "mute"]
  ];
  const interactive = [];
  buttons.forEach(([txt, action], i)=>{
    const btn = new THREE.Mesh(
      new THREE.PlaneGeometry(0.66, 0.22),
      new THREE.MeshBasicMaterial({ map: makeButtonTexture(txt), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    btn.position.set((i - 1.5) * 0.74, 0, 0);
    btn.userData.hologramAction = action;
    btnRoot.add(btn);
    interactive.push(btn);
  });

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let isPlaying = false;
  let mutedBefore = false;

  function updateStatus(){
    window.SVR_REIKI_HOLOGRAM_STATUS = {
      playing: isPlaying,
      muted: video.muted,
      volume: Math.round(video.volume * 100),
      src: video.src
    };
  }

  async function play(){
    try {
      await video.play();
      isPlaying = true;
      updateStatus();
      log?.("[Reiki Hologram] playing");
    } catch (err){
      log?.("[Reiki Hologram] play blocked until user gesture", String(err?.message || err));
    }
  }
  function pause(){ video.pause(); isPlaying = false; updateStatus(); }
  function toggle(){ return video.paused ? play() : (pause(), Promise.resolve()); }
  function setVolume(v){ video.volume = Math.max(0, Math.min(1, v)); video.muted = false; updateStatus(); }
  function volumeUp(){ setVolume(video.volume + 0.10); }
  function volumeDown(){ setVolume(video.volume - 0.10); }
  function mute(){ video.muted = !video.muted; updateStatus(); }
  function action(name){
    if (name === "play") toggle();
    if (name === "up") volumeUp();
    if (name === "down") volumeDown();
    if (name === "mute") mute();
  }

  function pointerAction(event){
    if (!renderer || !camera) return;
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(interactive, false)[0];
    if (hit?.object?.userData?.hologramAction){
      action(hit.object.userData.hologramAction);
    } else {
      toggle();
    }
  }

  renderer?.domElement?.addEventListener("pointerdown", pointerAction, { passive: true });
  window.addEventListener("keydown", (e)=>{
    if (e.repeat) return;
    if (e.code === "KeyV") toggle();
    if (e.code === "Equal" || e.code === "NumpadAdd") volumeUp();
    if (e.code === "Minus" || e.code === "NumpadSubtract") volumeDown();
    if (e.code === "KeyB") mute();
  });
  renderer?.xr?.addEventListener("sessionstart", ()=>{
    // XR session start is a user gesture on Quest; start quietly after entering VR.
    play();
  });

  const api = {
    group,
    video,
    play,
    pause,
    toggle,
    volumeUp,
    volumeDown,
    mute,
    update(dt = 0){
      const t = performance.now() * 0.001;
      glow.material.opacity = 0.13 + Math.sin(t * 2.2) * 0.035;
      frame.rotation.z = Math.sin(t * 0.8) * 0.018;
      floorHalo.rotation.z += dt * 0.26;
      group.position.y = 0.05 + Math.sin(t * 0.9) * 0.018;
      updateStatus();
    },
    dispose(){
      renderer?.domElement?.removeEventListener("pointerdown", pointerAction);
      pause();
      video.remove();
      texture.dispose();
    }
  };
  window.SVR_REIKI_HOLOGRAM = api;
  updateStatus();
  return api;
}
