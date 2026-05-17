import * as THREE from "three";

function buildStoreTexture(themeColor = "#b95aff", accentColor = "#00ffff") {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = "rgba(10, 8, 18, 0.94)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  grad.addColorStop(0, "rgba(185,90,255,0.28)");
  grad.addColorStop(0.5, "rgba(0,255,255,0.10)");
  grad.addColorStop(1, "rgba(255,64,100,0.20)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = themeColor;
  ctx.lineWidth = 8;
  ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16);

  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(28, 28, canvas.width - 56, canvas.height - 56);

  ctx.textAlign = "center";
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 54px Arial";
  ctx.fillText("SVR VR STORE", canvas.width / 2, 76);

  ctx.fillStyle = accentColor;
  ctx.font = "bold 24px Arial";
  ctx.fillText("PREVIEW MODE • CHECKOUT DISABLED • SANDBOX ONLY", canvas.width / 2, 116);

  const items = [
    ["GLOVES", "Preview hand skins and future cosmetics"],
    ["WATCHES", "Forearm device styles and UI themes"],
    ["TABLE SKINS", "Future felt, rail, and room styles"],
    ["AVATAR GEAR", "Future clothing and accessories"]
  ];

  ctx.textAlign = "left";
  items.forEach((item, i) => {
    const x = i % 2 === 0 ? 70 : 540;
    const y = i < 2 ? 165 : 310;

    ctx.fillStyle = "rgba(20, 20, 32, 0.88)";
    ctx.fillRect(x, y, 410, 110);

    ctx.strokeStyle = i % 2 === 0 ? themeColor : accentColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 410, 110);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 30px Arial";
    ctx.fillText(item[0], x + 28, y + 44);

    ctx.fillStyle = "rgba(235,245,255,0.78)";
    ctx.font = "20px Arial";
    ctx.fillText(item[1], x + 28, y + 80);
  });

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "20px Arial";
  ctx.fillText("Store portal target: https://svrpoker.com/site/store.html", canvas.width / 2, 470);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function addStoreHologram(scene, config = {}) {
  const group = new THREE.Group();
  group.name = "svr_store_hologram_preview";

  const panel = new THREE.Mesh(
    new THREE.PlaneGeometry(5.4, 2.7),
    new THREE.MeshBasicMaterial({
      map: buildStoreTexture(config.themeColor, config.accentColor),
      transparent: true,
      opacity: 0.96,
      side: THREE.DoubleSide,
      depthWrite: false
    })
  );

  panel.position.set(config.x ?? 0, config.y ?? 2.65, config.z ?? -4.2);
  panel.userData.isSVRStorePreview = true;
  panel.userData.portalUrl = "https://svrpoker.com/site/store.html";
  panel.userData.onSelect = () => {
    window.dispatchEvent(new CustomEvent("svr_store_preview_selected", {
      detail: {
        mode: "preview_only",
        checkoutEnabled: false,
        portalUrl: panel.userData.portalUrl,
        timestamp: Date.now()
      }
    }));
  };

  group.add(panel);

  const glow = new THREE.PointLight(0xb95aff, 1.6, 7, 2);
  glow.position.set(panel.position.x, panel.position.y, panel.position.z + 0.8);
  group.add(glow);

  scene.add(group);
  scene.userData._svrStoreHologram = group;
  return group;
}

export function tickStoreHologram(scene, t = 0) {
  const group = scene?.userData?._svrStoreHologram;
  if (!group) return;
  group.rotation.y = Math.sin(t * 0.35) * 0.015;
}