import "./modules/spawnpads.js";
import "./modules/vr_eye_fix.js";
import "./modules/teleport.js";
import "./modules/lobby.js";

window.hudLog = function hudLog(msg) {
  const el = document.getElementById("hud");
  if (!el) return;
  const t = new Date().toLocaleTimeString();
  el.innerHTML = `${el.innerHTML}<br/>[${t}] ${msg}`;
};

function wireForcedVRButton(scene) {
  const btn = document.getElementById("enterVRBtn");
  if (!btn) return;

  const update = () => {
    // Show button on Quest / XR-capable browsers; also show if A-Frame says VR is possible.
    const xr = !!navigator.xr;
    const likelyQuest = /OculusBrowser|Quest|Meta/i.test(navigator.userAgent);
    const canVR = (scene && scene.is && scene.is("vr-mode")) || likelyQuest || xr;

    btn.style.display = canVR ? "block" : "none";
    if (!canVR) {
      hudLog("No VR runtime detected on this browser (phone is normal).");
    }
  };

  btn.onclick = async () => {
    try {
      hudLog("ENTER VR pressed…");
      await scene.enterVR();
      hudLog("enterVR() called ✅");
    } catch (e) {
      console.error(e);
      hudLog("enterVR failed ❌ (use Quest/Oculus Browser)");
    }
  };

  scene.addEventListener("enter-vr", () => { btn.style.display = "none"; });
  scene.addEventListener("exit-vr",  () => { update(); });

  setTimeout(update, 300);
  setTimeout(update, 1200);
}

AFRAME.registerComponent("scarlett-world", {
  init() {
    const world = document.getElementById("worldRoot");
    const scene = this.el.sceneEl;

    hudLog("A-FRAME loaded ✅");
    hudLog("Scarlett1 booting…");

    // Spawn system = single source of truth
    scene.setAttribute("scarlett-spawn-system", "defaultPad: pad_lobby_safe; lockSeconds: 3.2");

    // Fix right-eye-only artifacts (reticles/panels/laser visuals)
    scene.setAttribute("scarlett-vr-eye-fix", "");

    // Teleport (no visible laser/reticle)
    scene.setAttribute("scarlett-teleport", "");

    // Rooms (start with lobby)
    const lobby = document.createElement("a-entity");
    lobby.setAttribute("id", "room_lobby");
    lobby.setAttribute("position", "0 0 0");
    lobby.setAttribute("scarlett-lobby", "");
    world.appendChild(lobby);

    hudLog("Lobby created ✅");

    // Force VR button (works even if A-Frame button disappears)
    wireForcedVRButton(scene);
  }
});
