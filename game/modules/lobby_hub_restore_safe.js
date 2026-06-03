import * as THREE from "three";

const NAME = "SVR_Phase98SX_Lobby_Hub_Restore_Safe";

const hubs = [
  ["REIKI HUB", "PRIVATE ROOM", "#7fffd4", 20.15, 1.74, -5.35, Math.PI * 0.5],
  ["PGA TRAINING", "DRIVE CHIP PUTT", "#69e8ff", 0.0, 1.74, -10.92, 0],
  ["SVR STORE", "GEAR CARDS MERCH", "#ffd36b", -8.7, 1.74, -9.18, -0.32],
  ["PRIVATE LOUNGE", "SOCIAL ROOM", "#ff8bd7", 6.4, 1.74, -10.2, 0.24],
  ["SCORPION ROOM", "PLAYABLE POKER", "#b48cff", 12.78, 1.74, 15.75, THREE.MathUtils.degToRad(51.78)]
];

function texture(title, sub, color) {
  const c = document.createElement("canvas");
  c.width = 1024; c.height = 512;
  const x = c.getContext("2d");
  const g = x.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#030812");
  g.addColorStop(1, "#16041f");
  x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
  x.strokeStyle = color; x.lineWidth = 10; x.strokeRect(22, 22, c.width - 44, c.height - 44);
  x.strokeStyle = "rgba(255,255,255,.16)"; x.lineWidth = 3; x.strokeRect(54, 54, c.width - 108, c.height - 108);
  x.textAlign = "center"; x.textBaseline = "middle"; x.shadowColor = color; x.shadowBlur = 16;
  x.fillStyle = "#fff"; x.font = "900 72px Arial"; x.fillText(title, 512, 188);
  x.shadowBlur = 5; x.fillStyle = color; x.font = "800 34px Arial"; x.fillText(sub, 512, 292);
  x.fillStyle = "rgba(255,255,255,.72)"; x.font = "700 24px Arial"; x.fillText("PORTAL OPEN", 512, 374);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

function addHub(root, def) {
  const [title, sub, hex, px, py, pz, yaw] = def;
  const color = new THREE.Color(hex);
  const group = new THREE.Group();
  group.name = `SVR_98SX_${title.replace(/\s+/g, "_")}`;
  group.position.set(px, py, pz);
  group.rotation.y = yaw;
  root.add(group);

  const back = new THREE.Mesh(new THREE.BoxGeometry(4.45, 3.25, 0.2), new THREE.MeshStandardMaterial({ color: 0x05070d, roughness: 0.72, metalness: 0.18, emissive: color, emissiveIntensity: 0.06 }));
  back.position.z = -0.08; group.add(back);

  const sign = new THREE.Mesh(new THREE.PlaneGeometry(4.05, 2.02), new THREE.MeshBasicMaterial({ map: texture(title, sub, hex), side: THREE.DoubleSide, transparent: true, depthWrite: false }));
  sign.position.set(0, 0.34, 0.055); group.add(sign);

  const ring = new THREE.Mesh(new THREE.RingGeometry(0.62, 0.95, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72, side: THREE.DoubleSide, depthWrite: false }));
  ring.rotation.x = -Math.PI * 0.5; ring.position.set(0, -1.66, 0.92); group.add(ring);

  const glow = new THREE.Mesh(new THREE.CircleGeometry(0.96, 72), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  glow.rotation.x = -Math.PI * 0.5; glow.position.copy(ring.position); group.add(glow);

  const trim = new THREE.Mesh(new THREE.BoxGeometry(4.55, 0.08, 0.16), new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.44, emissive: color, emissiveIntensity: 0.55 }));
  trim.position.set(0, 1.68, 0.04); group.add(trim);
}

function muteAllMedia() {
  document.querySelectorAll("audio,video").forEach((el) => { try { el.muted = true; el.volume = 0; } catch {} });
  window.SVR_AUDIO_OFF_DEFAULT = { phase: "98S-X", muted: true, noAutoplayAudio: true };
}

export function installLobbyHubRestoreSafe({ scene }) {
  if (!scene || scene.getObjectByName(NAME)) return false;
  const root = new THREE.Group(); root.name = NAME; scene.add(root);
  hubs.forEach((hub) => addHub(root, hub));
  muteAllMedia();
  window.SVR_LOBBY_HUB_RESTORE_SAFE = { phase: "98S-X", installed: true, hubs: hubs.length, musicOffDefault: true };
  return true;
}

export function autoInstallLobbyHubRestoreSafe() {
  let attempts = 0;
  const timer = setInterval(() => {
    attempts++;
    if (window.SVR_SCENE && installLobbyHubRestoreSafe({ scene: window.SVR_SCENE })) clearInterval(timer);
    if (attempts > 120) clearInterval(timer);
  }, 250);
}

autoInstallLobbyHubRestoreSafe();
