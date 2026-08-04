import * as THREE from "three";

export const HUB_SPONSORSHIP_REGISTRY_PHASE157 = Object.freeze({
  reiki: { enabled: false, title: "REIKI HUB", slot: "wellness sponsor placeholder", route: "store-reiki.html", color: "#b58cff" },
  pga: { enabled: false, title: "PGA HUB", slot: "golf sponsor placeholder", route: "store-pga.html", color: "#7dffb2" },
  store: { enabled: false, title: "SVR STORE", slot: "store sponsor placeholder", route: "store.html", color: "#58fff4" },
  smoker: { enabled: false, title: "SMOKER HUB", slot: "lounge sponsor placeholder", route: "store-smoker.html", color: "#ffd56e" },
  scorpion: { enabled: false, title: "SCORPION ROOM", slot: "room sponsor placeholder", route: "scorpion", color: "#ff5e75" },
  legends: { enabled: false, title: "LEGENDS", slot: "hall sponsor placeholder", route: "legends", color: "#65b7ff" },
  sponsor: { enabled: false, title: "SPONSOR HUB", slot: "general sponsor placeholder", route: "sponsorship.html", color: "#ffffff" },
  charity: { enabled: false, title: "CHARITY HUB", slot: "community sponsor placeholder", route: "impact.html", color: "#ff7fa8" }
});

export const HUB_SPONSORSHIP_EXCLUDED_PHASE157 = Object.freeze(["vibes", "vibesTheater", "theater"]);

function textureForHub(hubKey, record){
  const c = document.createElement("canvas");
  c.width = 1200;
  c.height = 760;
  const ctx = c.getContext("2d");
  const g = ctx.createLinearGradient(0, 0, c.width, c.height);
  g.addColorStop(0, "#02070d");
  g.addColorStop(.52, "#090d20");
  g.addColorStop(1, "#020306");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.strokeStyle = record.color || "#58fff4";
  ctx.lineWidth = 18;
  ctx.strokeRect(34, 34, c.width - 68, c.height - 68);
  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.lineWidth = 5;
  ctx.strokeRect(74, 74, c.width - 148, c.height - 148);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = record.color || "#58fff4";
  ctx.shadowBlur = 20;
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 88px system-ui, Arial";
  ctx.fillText(record.title || hubKey.toUpperCase(), c.width / 2, 190, c.width - 120);
  ctx.shadowBlur = 0;
  ctx.fillStyle = record.color || "#58fff4";
  ctx.font = "900 46px system-ui, Arial";
  ctx.fillText("SPONSORSHIP SLOT", c.width / 2, 320, c.width - 120);
  ctx.fillStyle = "#dffcff";
  ctx.font = "700 40px system-ui, Arial";
  ctx.fillText(record.slot || "placeholder", c.width / 2, 420, c.width - 130);
  ctx.fillStyle = "rgba(255,255,255,.10)";
  ctx.fillRect(138, 520, c.width - 276, 88);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 34px system-ui, Arial";
  ctx.fillText(record.enabled ? "ACTIVE SPONSOR" : "PLACEHOLDER ONLY", c.width / 2, 565, c.width - 170);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function addHubBoard(scene, rec, hubKey, record){
  if (!rec?.pos || !rec?.look) return null;
  const group = new THREE.Group();
  group.name = `PHASE157 MODULAR SPONSOR SLOT ${hubKey.toUpperCase()}`;
  const dir = new THREE.Vector3().subVectors(rec.look, rec.pos);
  dir.y = 0;
  if (dir.lengthSq() < .001) dir.set(0, 0, -1);
  dir.normalize();
  const side = new THREE.Vector3(-dir.z, 0, dir.x);
  const pos = rec.pos.clone().add(side.multiplyScalar(1.25)).add(dir.multiplyScalar(.36));
  group.position.set(pos.x, 1.82, pos.z);
  group.lookAt(rec.look.x, 1.55, rec.look.z);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.55), new THREE.MeshBasicMaterial({ color: 0x58fff4, transparent: true, opacity: .12, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  glow.position.z = -.025;
  group.add(glow);
  const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.25, 1.42), new THREE.MeshBasicMaterial({ map: textureForHub(hubKey, record), transparent: true, side: THREE.DoubleSide, depthWrite: false }));
  panel.userData.hubSponsorKey = hubKey;
  panel.userData.hubSponsorRoute = record.route || "";
  group.add(panel);
  scene.add(group);
  return group;
}

export function applyHubSponsorshipRegistryPhase157(args = {}, result = {}){
  const scene = args.scene;
  const sceneTargets = args.sceneTargets || {};
  if (!scene || scene.userData._phase157HubSponsorRegistry) return result;
  const groups = [];
  for (const [hubKey, record] of Object.entries(HUB_SPONSORSHIP_REGISTRY_PHASE157)){
    if (HUB_SPONSORSHIP_EXCLUDED_PHASE157.includes(hubKey)) continue;
    const rec = sceneTargets[hubKey] || (hubKey === "smoker" ? sceneTargets.store : null);
    const group = addHubBoard(scene, rec, hubKey, record);
    if (group) groups.push(group);
  }
  scene.userData._phase157HubSponsorRegistry = { groups, registry: HUB_SPONSORSHIP_REGISTRY_PHASE157, excluded: HUB_SPONSORSHIP_EXCLUDED_PHASE157 };
  window.SVR_PHASE157_HUB_SPONSOR_REGISTRY = { registry: HUB_SPONSORSHIP_REGISTRY_PHASE157, excluded: HUB_SPONSORSHIP_EXCLUDED_PHASE157 };
  args.log?.("Phase 157 modular hub sponsorship registry active");
  args.setStatus?.("Phase 157: modular sponsor slots active for hubs except Vibes Theater", { force: true });
  return result;
}
