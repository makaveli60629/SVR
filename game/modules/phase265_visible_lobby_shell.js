/*
 * SVR Phase 265 — Boot Visible Lobby Shell Lock
 * Creates a visible fallback lobby immediately so black canvas cannot hide the experience.
 */
import * as THREE from "three";

const BUILD = "PHASE-267-JS-NEWLINE-BOOT-RENDER-REPAIR-LOCK";

function mat(color, options = {}){
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.75,
    metalness: options.metalness ?? 0.05,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });
}

function label(text, width = 2.8, height = 0.65){
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "rgba(3, 4, 12, 0.88)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(140,255,220,0.95)";
  ctx.lineWidth = 8;
  ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);
  ctx.fillStyle = "#eaffff";
  ctx.font = "bold 54px system-ui, Segoe UI, Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true })
  );
}

export function createPhase265VisibleLobbyShell(scene){
  if (!scene || scene.getObjectByName("phase265_visible_lobby_shell")) {
    return scene?.getObjectByName("phase265_visible_lobby_shell") || null;
  }

  const shell = new THREE.Group();
  shell.name = "phase265_visible_lobby_shell";

  // Lighting assist
  const hemi = new THREE.HemisphereLight(0x9fdcff, 0x140018, 1.25);
  hemi.name = "phase265_hemi_light";
  shell.add(hemi);

  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(4, 8, 6);
  key.name = "phase265_key_light";
  shell.add(key);

  // Floor
  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7.5, 96),
    mat(0x090812, { roughness: 0.92 })
  );
  floor.name = "phase265_visible_floor";
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  shell.add(floor);

  // Room boundary / walls
  const wallMat = mat(0x13091f, { roughness: 0.85 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(12, 3.2, 0.12), wallMat);
  backWall.position.set(0, 1.6, -5.6);
  backWall.name = "phase265_back_wall";
  shell.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 9), wallMat);
  leftWall.position.set(-6, 1.6, -1.1);
  leftWall.name = "phase265_left_wall";
  shell.add(leftWall);

  const rightWall = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.2, 9), wallMat);
  rightWall.position.set(6, 1.6, -1.1);
  rightWall.name = "phase265_right_wall";
  shell.add(rightWall);

  // Neon trim
  const neonMat = new THREE.MeshBasicMaterial({ color: 0x8cffdc });
  for (const z of [-5.45, 3.3]) {
    const trim = new THREE.Mesh(new THREE.BoxGeometry(11.8, 0.025, 0.025), neonMat);
    trim.position.set(0, 0.035, z);
    trim.name = "phase265_neon_trim";
    shell.add(trim);
  }

  // Poker table fallback
  const felt = new THREE.Mesh(
    new THREE.CylinderGeometry(2.25, 2.25, 0.16, 96),
    mat(0x07382f, { roughness: 0.96 })
  );
  felt.name = "phase265_poker_table_felt";
  felt.position.set(0, 0.78, 0);
  felt.scale.z = 0.68;
  shell.add(felt);

  const rail = new THREE.Mesh(
    new THREE.TorusGeometry(2.28, 0.13, 12, 96),
    mat(0x22081b, { roughness: 0.75, metalness: 0.1 })
  );
  rail.name = "phase265_poker_table_rail";
  rail.rotation.x = Math.PI / 2;
  rail.position.set(0, 0.91, 0);
  rail.scale.z = 0.68;
  shell.add(rail);

  const logo = new THREE.Mesh(
    new THREE.CircleGeometry(0.45, 64),
    mat(0xd6a43d, { roughness: 0.45, metalness: 0.35 })
  );
  logo.name = "phase265_svr_table_logo";
  logo.rotation.x = -Math.PI / 2;
  logo.position.set(0, 0.93, 0);
  shell.add(logo);

  const passLine = new THREE.Mesh(
    new THREE.RingGeometry(1.35, 1.37, 96),
    new THREE.MeshBasicMaterial({ color: 0xffe49b, transparent: true, opacity: 0.9 })
  );
  passLine.name = "phase265_pass_bet_line";
  passLine.rotation.x = -Math.PI / 2;
  passLine.position.set(0, 0.935, 0);
  passLine.scale.z = 0.62;
  shell.add(passLine);

  // Readable cards
  const cardMat = mat(0xf8f8ff, { roughness: 0.72 });
  for (let i = 0; i < 5; i++){
    const card = new THREE.Mesh(new THREE.BoxGeometry(0.27, 0.014, 0.38), cardMat);
    card.name = "phase265_readable_card_" + (i + 1);
    card.userData.isCard = true;
    card.position.set(-0.58 + i * 0.29, 0.96, -0.24);
    shell.add(card);
  }

  // Flat chips
  const chipColors = [0xffffff, 0xdd3333, 0x2d6cff, 0x22aa5d, 0x111111];
  for (let i = 0; i < 25; i++){
    const chip = new THREE.Mesh(
      new THREE.CylinderGeometry(0.075, 0.075, 0.018, 32),
      mat(chipColors[i % chipColors.length], { roughness: 0.55, metalness: 0.08 })
    );
    chip.name = "phase265_flat_chip_" + i;
    chip.userData.isChip = true;
    chip.userData.grabbable = true;
    chip.rotation.x = Math.PI / 2;
    chip.position.set(-1.35 + (i % 5) * 0.16, 0.95 + Math.floor(i / 5) * 0.019, 0.92);
    shell.add(chip);
  }

  // Visible Moon and Mars, high above skyline
  const moon = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 32, 20),
    new THREE.MeshBasicMaterial({ color: 0xf2f2ff })
  );
  moon.name = "phase265_visible_moon_high";
  moon.position.set(-3.8, 7.5, -8.5);
  shell.add(moon);

  const mars = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 32, 20),
    new THREE.MeshBasicMaterial({ color: 0xff6236 })
  );
  mars.name = "phase265_visible_mars_high";
  mars.position.set(3.9, 7.1, -9.2);
  shell.add(mars);

  // Store kiosk visible, not behind wall
  const kiosk = new THREE.Group();
  kiosk.name = "phase265_visible_store_kiosk";
  kiosk.userData.svrInteractive = true;
  kiosk.userData.interactionType = "kiosk";
  kiosk.position.set(-4.15, 0, -2.4);

  const kioskBody = new THREE.Mesh(new THREE.BoxGeometry(1.75, 1.2, 0.08), mat(0x161025, { roughness: 0.65 }));
  kioskBody.position.y = 1.35;
  kiosk.add(kioskBody);

  const kioskLabel = label("SVR STORE KIOSK", 1.65, 0.38);
  kioskLabel.position.set(0, 1.42, -0.055);
  kiosk.add(kioskLabel);

  kiosk.lookAt(0, 1.25, 0);
  shell.add(kiosk);

  // Portal labels
  const reiki = label("REIKI ROOM", 1.8, 0.42);
  reiki.name = "phase265_portal_reiki";
  reiki.userData.svrInteractive = true;
  reiki.userData.interactionType = "reiki";
  reiki.position.set(-3.3, 1.45, -5.48);
  shell.add(reiki);

  const pga = label("PGA DRIVE", 1.8, 0.42);
  pga.name = "phase265_portal_pga";
  pga.userData.svrInteractive = true;
  pga.userData.interactionType = "pga";
  pga.position.set(0, 1.45, -5.48);
  shell.add(pga);

  const scorpion = label("SCORPION", 1.8, 0.42);
  scorpion.name = "phase265_portal_scorpion";
  scorpion.userData.svrInteractive = true;
  scorpion.userData.interactionType = "scorpion";
  scorpion.position.set(3.3, 1.45, -5.48);
  shell.add(scorpion);

  scene.add(shell);

  window.SVR_VISIBLE_LOBBY_SHELL = {
    build: BUILD,
    ready: true,
    createdAt: new Date().toISOString()
  };

  try {
    window.dispatchEvent(new CustomEvent("svr_visible_lobby_shell_ready", {
      detail: window.SVR_VISIBLE_LOBBY_SHELL
    }));
  } catch(_) {}

  return shell;
}




