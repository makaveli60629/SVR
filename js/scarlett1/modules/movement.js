// /js/scarlett1/modules/movement.js
import { deadzone, clamp, getRig, getCameraEl } from "./utils.js";

AFRAME.registerComponent("scarlett-move", {
  schema: {
    speed: { default: 2.0 }, // m/s
    turnSpeed: { default: 1.9 } // rad/s
  },

  init() {
    this._gp = [];
    this._last = performance.now();
    if (window.hudLog) hudLog("Teleport + smooth move ready ✅");
  },

  tick(t) {
    const rig = getRig();
    const cam = getCameraEl();
    if (!rig || !cam) return;

    const dt = Math.min(0.05, (t - this._last) / 1000);
    this._last = t;

    const gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let leftGP = null, rightGP = null;

    for (const g of gps) {
      if (!g) continue;
      const h = g.hand || (g.pose && g.pose.hand);
      if (h === "left") leftGP = g;
      if (h === "right") rightGP = g;
    }

    // Axis helpers: prefer 2/3 when present, else 0/1
    const getStick = (gp) => {
      if (!gp || !gp.axes) return {x:0,y:0};
      const a = gp.axes;
      if (a.length >= 4) return { x: a[2] ?? 0, y: a[3] ?? 0 };
      return { x: a[0] ?? 0, y: a[1] ?? 0 };
    };

    // LEFT stick = move
    const ls = getStick(leftGP);
    const mx = deadzone(ls.x, 0.16);
    const my = deadzone(ls.y, 0.16);

    // Right stick = turn (only x)
    const rs = getStick(rightGP);
    const tx = deadzone(rs.x, 0.20);

    // Move in camera-forward plane
    if (mx !== 0 || my !== 0) {
      const yaw = cam.object3D.rotation.y;
      const forward = { x: -Math.sin(yaw), z: -Math.cos(yaw) };
      const right = { x: Math.cos(yaw), z: -Math.sin(yaw) };

      // NOTE: In VR, many gamepads report forward as -Y. We use my as-is but invert if needed by flipping in one place.
      const moveF = -my; // forward on stick = negative Y, convert to +forward
      const moveR = mx;

      const vx = (forward.x * moveF + right.x * moveR) * this.data.speed;
      const vz = (forward.z * moveF + right.z * moveR) * this.data.speed;

      rig.object3D.position.x += vx * dt;
      rig.object3D.position.z += vz * dt;
    }

    if (tx !== 0) {
      rig.object3D.rotation.y -= tx * this.data.turnSpeed * dt;
    }
  }
});
