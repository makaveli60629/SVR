import * as THREE from "three";

const PHASE88_BUILD = "PHASE-88-PGA-CLUB-BAG-ALIGNMENT-LOCK";

const CLUBS = {
  DRIVER: { label: "DRIVER", color: 0x86e3ff, headScale: [1.25, 1.00, 1.35], shaftScale: [1, 1.12, 1], rest: new THREE.Vector3(1.05, 0.96, -0.36), palmRotation: [-1.08, 0.10, -0.10] },
  IRON: { label: "7-IRON", color: 0xdde7ff, headScale: [0.82, 0.88, 0.58], shaftScale: [1, 1.02, 1], rest: new THREE.Vector3(0.92, 0.94, -0.42), palmRotation: [-1.00, 0.04, 0.08] },
  PUTTER: { label: "PUTTER", color: 0x7dff8a, headScale: [1.45, 0.76, 0.46], shaftScale: [1, 0.94, 1], rest: new THREE.Vector3(0.82, 0.88, -0.50), palmRotation: [-0.92, 0.00, 0.00] }
};

function canvasTexture(width, height, painter){
  const c = document.createElement("canvas");
  c.width = width;
  c.height = height;
  const x = c.getContext("2d");
  painter(x, width, height, c);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function textTexture(title, subtitle, accent = "#7dff8a"){
  return canvasTexture(900, 420, (x, w, h)=>{
    const g = x.createLinearGradient(0,0,w,h);
    g.addColorStop(0,"#041008");
    g.addColorStop(1,"#080314");
    x.fillStyle = g;
    x.fillRect(0,0,w,h);
    x.strokeStyle = accent;
    x.lineWidth = 10;
    x.strokeRect(18,18,w-36,h-36);
    x.textAlign = "center";
    x.fillStyle = "#ffffff";
    x.font = "900 62px system-ui, Arial";
    x.fillText(title, w/2, 130);
    x.fillStyle = accent;
    x.font = "800 34px system-ui, Arial";
    x.fillText(subtitle, w/2, 205);
    x.fillStyle = "rgba(255,255,255,.80)";
    x.font = "700 25px system-ui, Arial";
    x.fillText("Press 1 Driver • 2 Iron • 3 Putter", w/2, 285);
    x.fillText("Ball/mat alignment locked for range play", w/2, 330);
  });
}

function createClubIcon(type){
  const cfg = CLUBS[type];
  const group = new THREE.Group();
  group.name = `SVR_PHASE88_BAG_CLUB_${type}`;
  const shaft = new THREE.Mesh(
    new THREE.CylinderGeometry(0.018, 0.018, 1.0, 12),
    new THREE.MeshStandardMaterial({ color: 0xcfd7e8, roughness: .36, metalness: .62 })
  );
  shaft.rotation.x = Math.PI / 2;
  group.add(shaft);
  const head = new THREE.Mesh(
    new THREE.BoxGeometry(0.28, 0.08, 0.16),
    new THREE.MeshStandardMaterial({ color: cfg.color, roughness: .34, metalness: .56, emissive: cfg.color, emissiveIntensity: .18 })
  );
  head.position.set(0.12, -0.02, -0.56);
  head.scale.set(...cfg.headScale);
  group.add(head);
  return group;
}

function makeClubBag(scene, refs, setClubType){
  const root = new THREE.Group();
  root.name = "SVR_PHASE88_PGA_CLUB_BAG_SELECTOR";
  root.position.set(-1.7, 0.05, -0.25);
  root.rotation.y = 0.42;
  refs.root?.add(root) || scene.add(root);

  const bag = new THREE.Mesh(
    new THREE.CylinderGeometry(0.24, 0.30, 0.82, 24),
    new THREE.MeshStandardMaterial({ color: 0x171421, roughness: .62, metalness: .24, emissive: 0x25104c, emissiveIntensity: .35 })
  );
  bag.position.y = 0.42;
  root.add(bag);

  const trim = new THREE.Mesh(
    new THREE.TorusGeometry(0.265, 0.018, 8, 48),
    new THREE.MeshBasicMaterial({ color: 0xb48cff, transparent: true, opacity: .92 })
  );
  trim.rotation.x = Math.PI / 2;
  trim.position.y = 0.86;
  root.add(trim);

  const positions = { DRIVER: [-0.18, 1.14, 0.02], IRON: [0.04, 1.08, 0.10], PUTTER: [0.22, 1.02, -0.02] };
  Object.keys(CLUBS).forEach((type)=>{
    const icon = createClubIcon(type);
    icon.position.set(...positions[type]);
    icon.rotation.set(0.28, 0.08, type === "DRIVER" ? -0.18 : type === "IRON" ? 0.05 : 0.22);
    icon.userData.svrClubType = type;
    root.add(icon);
  });

  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(2.45, 1.14),
    new THREE.MeshBasicMaterial({ map: textTexture("CLUB BAG", "DEFAULT: DRIVER", "#b48cff"), transparent: true, side: THREE.DoubleSide })
  );
  sign.position.set(0, 1.45, -0.46);
  root.add(sign);

  const glow = new THREE.PointLight(0xb48cff, 1.1, 5, 2);
  glow.position.set(0, 1.0, 0);
  root.add(glow);

  return { root, sign, glow };
}

function recolorClub(club, cfg){
  let headSeen = false;
  club.traverse((child)=>{
    if (!child.isMesh || !child.material) return;
    if (child === club.userData.head || child.name.toLowerCase().includes("head") || !headSeen){
      if (child === club.userData.head) headSeen = true;
      if (child.material.color) child.material.color.setHex(cfg.color);
      if (child.material.emissive) child.material.emissive.setHex(cfg.color);
      if ("emissiveIntensity" in child.material) child.material.emissiveIntensity = .30;
    }
  });
  if (club.userData.head?.scale) club.userData.head.scale.set(...cfg.headScale);
}

function alignActiveClub(club, clubType){
  const cfg = CLUBS[clubType] || CLUBS.DRIVER;
  club.userData.SVR_PHASE88_CLUB_TYPE = clubType;
  club.userData.SVR_PHASE88_PALM_ROTATION = cfg.palmRotation;
  club.userData.SVR_PHASE88_REST = cfg.rest.clone();
  recolorClub(club, cfg);
}

export function applyPhase88PgaClubBagAlignment({ scene, camera, renderer, range = null, statusCb = ()=>{} } = {}){
  if (!scene || scene.userData.SVR_PHASE88_PGA_CLUB_BAG_ALIGNMENT_LOCK) return scene?.userData?.SVR_PHASE88_PGA_CLUB_BAG_ALIGNMENT_LOCK || null;
  const refs = scene.userData.SVR_PGA_RANGE_REFS || {};
  const ball = refs.ball || scene.getObjectByName("svr-pga-ball");
  const club = refs.club || scene.getObjectByName("svr-range-club");
  const root = refs.root || scene;
  let currentClub = "DRIVER";

  function setClubType(type = "DRIVER"){
    currentClub = CLUBS[type] ? type : "DRIVER";
    if (club) alignActiveClub(club, currentClub);
    statusCb(`PGA club selected: ${CLUBS[currentClub].label}`);
    return currentClub;
  }

  const bag = makeClubBag(scene, { ...refs, root }, setClubType);
  setClubType("DRIVER");

  // Alignment lock: keep range spawn/mat relationship obvious and recoverable.
  if (ball) ball.position.set(0, .19, -1.05);
  if (scene.userData.SVR_RANGE_STANCE_MAT_LOCK){
    scene.userData.SVR_RANGE_STANCE_MAT_LOCK.playerStart = { x:0, y:0, z:0.42 };
    scene.userData.SVR_RANGE_STANCE_MAT_LOCK.ball = { x:0, y:.19, z:-1.05 };
  }
  if (!renderer?.xr?.isPresenting && camera){
    camera.position.set(0, 1.62, 0.72);
    camera.lookAt(0, .78, -1.05);
  }

  window.addEventListener("keydown", (e)=>{
    if (e.repeat) return;
    if (e.code === "Digit1") setClubType("DRIVER");
    if (e.code === "Digit2") setClubType("IRON");
    if (e.code === "Digit3") setClubType("PUTTER");
  });

  const api = {
    build: PHASE88_BUILD,
    get currentClub(){ return currentClub; },
    setClubType,
    update(dt = 0.016){
      const t = performance.now() * .001;
      if (bag?.glow) bag.glow.intensity = 1.0 + Math.sin(t * 1.6) * .18;
      if (bag?.root) bag.root.rotation.y = 0.42 + Math.sin(t * .55) * .025;
      if (club) {
        club.userData.SVR_PHASE88_CLUB_TYPE = currentClub;
        club.userData.SVR_PHASE88_PALM_ROTATION = (CLUBS[currentClub] || CLUBS.DRIVER).palmRotation;
      }
    }
  };
  window.SVR_PHASE88_PGA_CLUB_BAG = api;
  scene.userData.SVR_PHASE88_PGA_CLUB_BAG_ALIGNMENT_LOCK = api;
  return api;
}

export { PHASE88_BUILD, CLUBS as PHASE88_CLUBS };
