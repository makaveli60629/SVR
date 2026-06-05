import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-3-REIKI-SIGN-CAROUSEL-AUDIO-POLISH";

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas"); c.width = opts.w || 900; c.height = opts.h || 1160;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(3,8,14,.96)"); g.addColorStop(.55, opts.bg1 || "rgba(18,6,34,.96)"); g.addColorStop(1, opts.bg2 || "rgba(2,30,28,.95)");
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(0,255,204,.82)"; x.lineWidth = opts.lineWidth || 8; x.strokeRect(24, 24, c.width - 48, c.height - 48);
  x.textAlign = "center"; x.textBaseline = "middle";
  x.shadowColor = opts.glow || "rgba(0,255,204,.60)"; x.shadowBlur = opts.shadow || 16;
  x.fillStyle = opts.titleColor || "#ffffff"; x.font = opts.titleFont || "900 58px system-ui,Arial"; x.fillText(title, c.width / 2, opts.titleY || 132, c.width - 88);
  x.shadowBlur = 5; x.fillStyle = opts.lineColor || "#dffff8"; x.font = opts.lineFont || "760 30px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 260) + i * (opts.gap || 72), c.width - 96));
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8; return tex;
}
function panelMat(texture, opacity = 0.97) { return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }); }
function hideTree(obj) { if (!obj) return 0; let count = 0; obj.visible = false; count++; obj.traverse?.((child) => { child.visible = false; count++; }); return count; }
function rootLocal(root, obj) { const p = new THREE.Vector3(); obj.getWorldPosition(p); return root.worldToLocal(p.clone()); }
function clearEntry(scene, root) {
  let hidden = 0; root.updateWorldMatrix(true, true);
  root.traverse((obj) => { const n = String(obj.name || ""); if (/WELCOME_STRIP|WELCOME|BOTTOM_GLASS_TRACK|THRESHOLD|FLOOR_TRACK|LOWER_TRACK/i.test(n)) hidden += hideTree(obj); });
  scene.traverse((obj) => { if (!obj || obj === scene || obj === root) return; const n = String(obj.name || ""); if (!/PLANT|POT|LEAF|TREE|DECOR/i.test(n)) return; const p = rootLocal(root, obj); if (Math.abs(p.x) < 2.18 && p.z > -0.55 && p.z < 8.05 && p.y < 2.4) hidden += hideTree(obj); });
  return hidden;
}
function getVideo() { return window.SVR_REIKI_HOLOGRAM_VIDEO?.element || document.getElementById("svr-reiki-hologram-video"); }
function pauseVideo(reset = false) {
  const video = getVideo(); if (!video) return false;
  video.muted = true; video.volume = 0; video.pause?.(); if (reset) { try { video.currentTime = 0; } catch (_) {} }
  window.SVR_REIKI_VIDEO_GATE_STATE = "paused-hidden-silent"; return true;
}
function playVideoMuted() {
  const video = getVideo(); if (!video) return false;
  video.muted = true; video.volume = 0; video.preload = "metadata"; video.play?.().catch?.(() => {});
  window.SVR_REIKI_VIDEO_GATE_STATE = "playing-muted-visible"; return true;
}
function playVideoWithAudio() {
  const video = getVideo(); if (!video) return false;
  video.muted = false; video.volume = 0.78; video.play?.().catch?.(() => { video.muted = true; video.play?.().catch?.(() => {}); });
  window.SVR_REIKI_VIDEO_GATE_STATE = "playing-audio-visible"; return true;
}
function setupVideoPosition(root) {
  const videoParts = [
    ["SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO", [0, 1.72, -1.335], [0, 0, 0]],
    ["SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO_FRAME", [0, 1.72, -1.352], [0, 0, 0]],
    ["SVR_RICI_UPDATE_101_REIKI_VIDEO_PROMPT", [0, 0.72, -1.29], [0, 0, 0]],
    ["SVR_RICI_UPDATE_101_REIKI_VIDEO_BASE_GLOW", [0, 0.18, -1.34], [-Math.PI / 2, 0, 0]],
  ];
  const found = [];
  for (const [name, pos, rot] of videoParts) { const obj = root.getObjectByName(name); if (!obj) continue; obj.position.set(pos[0], pos[1], pos[2]); obj.rotation.set(rot[0], rot[1], rot[2]); obj.renderOrder = Math.max(obj.renderOrder || 0, 520); found.push(obj); }
  return found;
}
function bringApprovalSignsForward(root) {
  let moved = 0;
  root.traverse((obj) => {
    const n = String(obj.name || "");
    if (/REIKI.*SIGN|APPROVAL|AWAITING|WAITING/i.test(n)) {
      obj.renderOrder = Math.max(obj.renderOrder || 0, 760);
      if (obj.material) { obj.material.depthWrite = false; obj.material.depthTest = true; obj.material.needsUpdate = true; }
      if (obj.position && obj.position.z < 0.18) obj.position.z += 0.22;
      moved++;
    }
  });
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.25, .74), panelMat(makeTexture("AWAITING APPROVAL", ["presentation preview only"], { w: 1200, h: 300, titleFont: "900 62px system-ui,Arial", titleY: 92, startY: 190, gap: 46, border: "rgba(255,60,70,.96)", glow: "rgba(255,60,70,.72)", lineColor: "#ffd8d8", bg0: "#160307", bg1: "#2b0610", bg2: "#10040a" }), .98));
  sign.name = "SVR_REIKI_APPROVAL_SIGN_FRONT_LOCK"; sign.position.set(0, 4.48, .52); sign.renderOrder = 780; root.add(sign);
  return moved + 1;
}
function patchCarousel(root) {
  const cardMesh = root.getObjectByName("SVR_RICI_UPDATE_101_ACTIVE_HOLOGRAM_CARD");
  const prev = root.getObjectByName("SVR_RICI_UPDATE_101_PREV_BUTTON");
  const next = root.getObjectByName("SVR_RICI_UPDATE_101_NEXT_BUTTON");
  const activate = root.getObjectByName("SVR_RICI_UPDATE_101_ACTIVATE_BUTTON");
  if (!cardMesh || !prev || !next || !activate) return false;
  const videoParts = setupVideoPosition(root);
  const cards = [
    { type: "about", title: "WELCOME TO REIKI", lines: ["ABOUT THIS HUB", "SWIPE TO EXPLORE", "NEXT: VIDEO INTERVIEW", "AWAITING APPROVAL"], big: true },
    { type: "video", title: "VIDEO INTERVIEW", lines: ["hologram video page", "press ACTION for voice", "video appears only here", "AWAITING APPROVAL"] },
    { type: "symbols", title: "REIKI SYMBOLS", lines: ["glowing training wall", "definitions pending", "voiceover slot ready", "AWAITING APPROVAL"] },
    { type: "services", title: "SERVICES", lines: ["remote session preview", "private VR future", "training room future", "NO PRICING LIVE"] },
    { type: "shop", title: "SHOP PREVIEW", lines: ["crystal/product ideas", "book/product placeholder", "no checkout connected", "AWAITING APPROVAL"] },
    { type: "private", title: "PRIVATE VR ROOM", lines: ["future multiplayer sessions", "practitioner room", "not live yet", "AWAITING APPROVAL"] },
    { type: "portal", title: "ENTER SANCTUARY", lines: ["private Reiki room", "meditation destination", "activation portal", "PRESENTATION ONLY"] },
  ];
  let active = 0;
  function setVideoVisible(on) {
    videoParts.forEach((obj) => { obj.visible = !!on; });
    const oldPhoto = root.getObjectByName("SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO"); const oldFrame = root.getObjectByName("SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO_FRAME");
    if (oldPhoto) oldPhoto.visible = false; if (oldFrame) oldFrame.visible = false;
    if (on) playVideoMuted(); else pauseVideo(true);
  }
  function setCard(i) {
    active = (i + cards.length) % cards.length; const card = cards[active]; const isVideo = card.type === "video";
    setVideoVisible(isVideo); cardMesh.visible = !isVideo;
    if (!isVideo) {
      cardMesh.material = panelMat(makeTexture(card.title, card.lines, { border: card.type === "portal" ? "rgba(0,204,255,.90)" : "rgba(0,255,204,.82)", titleFont: card.big ? "900 72px system-ui,Arial" : "900 58px system-ui,Arial", lineFont: card.big ? "900 44px system-ui,Arial" : "760 30px system-ui,Arial", startY: card.big ? 295 : 260, gap: card.big ? 90 : 72 }), .97);
      cardMesh.material.needsUpdate = true;
    }
    window.SVR_REIKI_CAROUSEL_12_ACTIVE = { index: active, card };
  }
  function activateCard() {
    const card = cards[active];
    if (card.type === "video") { playVideoWithAudio(); return; }
    if (card.type === "shop") { window.open("/site/store-reiki.html", "_blank", "noopener,noreferrer"); return; }
    if (card.type === "portal" || card.type === "private") window.location.href = "./reiki.html?v=reiki-sanctuary-preview";
  }
  prev.userData.activate = () => setCard(active - 1); next.userData.activate = () => setCard(active + 1); activate.userData.activate = activateCard;
  window.SVR_RICI_UPDATE_101_CAROUSEL = { next: () => setCard(active + 1), prev: () => setCard(active - 1), activate: activateCard, setCard, getActiveIndex: () => active, getActiveCard: () => cards[active], cards, patchedBy: BUILD, videoGate: true, audioAction: true };
  setCard(0); pauseVideo(true); return true;
}
export function applyReikiLuxuryCleanup12(scene, { log = console.log } = {}) {
  const root = scene?.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root || root.getObjectByName("SVR_REIKI_LUXURY_CLEANUP_12_LOCK")) return null;
  const lock = new THREE.Group(); lock.name = "SVR_REIKI_LUXURY_CLEANUP_12_LOCK"; root.add(lock);
  const hidden = clearEntry(scene, root);
  const signsForward = bringApprovalSignsForward(root);
  const carouselPatched = patchCarousel(root);
  window.SVR_REIKI_LUXURY_CLEANUP_12 = { build: BUILD, hiddenEntryObjects: hidden, signsForward, carouselPatched, aboutFirst: true, videoSecond: true, videoAudioOnAction: true, videoGatedUntilSecondCard: true, carpetClear: true, welcomeFloorRemoved: true, thresholdRemoved: true };
  log?.("Reiki sign/carousel/audio polish loaded", window.SVR_REIKI_LUXURY_CLEANUP_12);
  return lock;
}
