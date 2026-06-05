import * as THREE from "three";

const BUILD = "LOBBY-ORG-1-2-REIKI-LUXURY-CLEANUP-CAROUSEL";

function makeTexture(title, lines = [], opts = {}) {
  const c = document.createElement("canvas");
  c.width = opts.w || 900;
  c.height = opts.h || 1160;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, opts.bg0 || "rgba(3,8,14,.96)");
  g.addColorStop(0.55, opts.bg1 || "rgba(18,6,34,.96)");
  g.addColorStop(1, opts.bg2 || "rgba(2,30,28,.95)");
  x.fillStyle = g;
  x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = opts.border || "rgba(0,255,204,.82)";
  x.lineWidth = 8;
  x.strokeRect(24, 24, c.width - 48, c.height - 48);
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.shadowColor = "rgba(0,255,204,.60)";
  x.shadowBlur = 16;
  x.fillStyle = opts.titleColor || "#ffffff";
  x.font = opts.titleFont || "900 58px system-ui,Arial";
  x.fillText(title, c.width / 2, opts.titleY || 132, c.width - 88);
  x.shadowBlur = 5;
  x.fillStyle = opts.lineColor || "#dffff8";
  x.font = opts.lineFont || "760 30px system-ui,Arial";
  lines.forEach((line, i) => x.fillText(line, c.width / 2, (opts.startY || 260) + i * (opts.gap || 72), c.width - 96));
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function panelMat(texture, opacity = 0.97) {
  return new THREE.MeshBasicMaterial({ map: texture, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false });
}

function hideTree(obj) {
  if (!obj) return 0;
  let count = 0;
  obj.visible = false;
  count++;
  obj.traverse?.((child) => { child.visible = false; count++; });
  return count;
}

function rootLocal(root, obj) {
  const p = new THREE.Vector3();
  obj.getWorldPosition(p);
  return root.worldToLocal(p.clone());
}

function clearEntry(scene, root) {
  let hidden = 0;
  root.updateWorldMatrix(true, true);
  root.traverse((obj) => {
    const n = String(obj.name || "");
    if (/WELCOME_STRIP|WELCOME|BOTTOM_GLASS_TRACK|THRESHOLD|FLOOR_TRACK|LOWER_TRACK/i.test(n)) {
      hidden += hideTree(obj);
    }
  });
  scene.traverse((obj) => {
    if (!obj || obj === scene || obj === root) return;
    const n = String(obj.name || "");
    if (!/PLANT|POT|LEAF|TREE|DECOR/i.test(n)) return;
    const p = rootLocal(root, obj);
    const blockingCarpet = Math.abs(p.x) < 2.18 && p.z > -0.55 && p.z < 8.05 && p.y < 2.4;
    if (blockingCarpet) hidden += hideTree(obj);
  });
  return hidden;
}

function setupVideoPosition(root) {
  const videoParts = [
    ["SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO", [0, 1.72, -1.335], [0, 0, 0]],
    ["SVR_RICI_UPDATE_101_REIKI_HOLOGRAM_VIDEO_FRAME", [0, 1.72, -1.352], [0, 0, 0]],
    ["SVR_RICI_UPDATE_101_REIKI_VIDEO_PROMPT", [0, 0.72, -1.29], [0, 0, 0]],
    ["SVR_RICI_UPDATE_101_REIKI_VIDEO_BASE_GLOW", [0, 0.18, -1.34], [-Math.PI / 2, 0, 0]],
  ];
  const found = [];
  for (const [name, pos, rot] of videoParts) {
    const obj = root.getObjectByName(name);
    if (!obj) continue;
    obj.position.set(pos[0], pos[1], pos[2]);
    obj.rotation.set(rot[0], rot[1], rot[2]);
    obj.renderOrder = Math.max(obj.renderOrder || 0, 365);
    found.push(obj);
  }
  return found;
}

function findFirst(root, re) {
  let out = null;
  root.traverse((obj) => { if (!out && re.test(String(obj.name || ""))) out = obj; });
  return out;
}

function patchCarousel(root) {
  const cardMesh = root.getObjectByName("SVR_RICI_UPDATE_101_ACTIVE_HOLOGRAM_CARD");
  const prev = root.getObjectByName("SVR_RICI_UPDATE_101_PREV_BUTTON");
  const next = root.getObjectByName("SVR_RICI_UPDATE_101_NEXT_BUTTON");
  const activate = root.getObjectByName("SVR_RICI_UPDATE_101_ACTIVATE_BUTTON");
  if (!cardMesh || !prev || !next || !activate) return false;

  const videoParts = setupVideoPosition(root);
  const cards = [
    { type: "about", title: "ABOUT REIKI", lines: ["Wellness presentation hub", "Founder profile placeholder", "Community work spotlight", "AWAITING APPROVAL"] },
    { type: "video", title: "INTERVIEW VIDEO", lines: ["Hologram media console", "Tap activate for sound", "Presentation only", "AWAITING APPROVAL"] },
    { type: "symbols", title: "REIKI SYMBOLS", lines: ["Symbol training wall planned", "Source review required", "Tutorial card ready", "AWAITING APPROVAL"] },
    { type: "services", title: "SERVICES", lines: ["Remote session preview", "Private VR session future", "Training room future", "NO PRICING LIVE"] },
    { type: "shop", title: "SHOP PREVIEW", lines: ["Crystals / mineral ideas", "Book/product placeholders", "No checkout connected", "AWAITING APPROVAL"] },
    { type: "private", title: "PRIVATE VR ROOM", lines: ["Future multiplayer sessions", "Practitioner-controlled room", "Not live yet", "AWAITING APPROVAL"] },
    { type: "portal", title: "ENTER SANCTUARY", lines: ["Private Reiki room", "Meditation destination", "Activation portal", "PRESENTATION ONLY"] },
  ];
  let active = 0;

  function setVideoVisible(on) {
    videoParts.forEach((obj) => { obj.visible = !!on; });
    const oldPhoto = root.getObjectByName("SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO");
    const oldFrame = root.getObjectByName("SVR_RICI_UPDATE_101_REIKI_HOLO_PHOTO_FRAME");
    if (oldPhoto) oldPhoto.visible = false;
    if (oldFrame) oldFrame.visible = false;
  }

  function setCard(i) {
    active = (i + cards.length) % cards.length;
    const card = cards[active];
    const isVideo = card.type === "video";
    setVideoVisible(isVideo);
    cardMesh.visible = !isVideo;
    if (!isVideo) {
      cardMesh.material = panelMat(makeTexture(card.title, card.lines, { border: card.type === "portal" ? "rgba(0,204,255,.90)" : "rgba(0,255,204,.82)" }), 0.97);
      cardMesh.material.needsUpdate = true;
    }
    window.SVR_REIKI_CAROUSEL_12_ACTIVE = { index: active, card };
  }

  function activateCard() {
    const card = cards[active];
    if (card.type === "video") {
      window.SVR_REIKI_HOLOGRAM_VIDEO?.play?.();
      return;
    }
    if (card.type === "shop") {
      window.open("/site/reiki-about.html#shop", "_blank", "noopener,noreferrer");
      return;
    }
    if (card.type === "portal" || card.type === "private") {
      window.location.href = "./reiki.html?v=reiki-sanctuary-preview";
    }
  }

  prev.userData.activate = () => setCard(active - 1);
  next.userData.activate = () => setCard(active + 1);
  activate.userData.activate = activateCard;

  window.SVR_RICI_UPDATE_101_CAROUSEL = {
    next: () => setCard(active + 1),
    prev: () => setCard(active - 1),
    activate: activateCard,
    setCard,
    getActiveIndex: () => active,
    getActiveCard: () => cards[active],
    cards,
    patchedBy: BUILD
  };

  setCard(0);
  return true;
}

export function applyReikiLuxuryCleanup12(scene, { log = console.log } = {}) {
  const root = scene?.getObjectByName("SVR_RICI_UPDATE_101_MOTHER_MODULE_LOCK");
  if (!root || root.getObjectByName("SVR_REIKI_LUXURY_CLEANUP_12_LOCK")) return null;
  const lock = new THREE.Group();
  lock.name = "SVR_REIKI_LUXURY_CLEANUP_12_LOCK";
  root.add(lock);

  const hidden = clearEntry(scene, root);
  const carouselPatched = patchCarousel(root);

  window.SVR_REIKI_LUXURY_CLEANUP_12 = {
    build: BUILD,
    hiddenEntryObjects: hidden,
    carouselPatched,
    aboutFirst: true,
    videoSecond: true,
    carpetClear: true,
    welcomeFloorRemoved: true,
    thresholdRemoved: true
  };
  log?.("Reiki luxury cleanup 1.2 loaded", window.SVR_REIKI_LUXURY_CLEANUP_12);
  return lock;
}
