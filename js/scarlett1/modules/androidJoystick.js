// /js/scarlett1/modules/androidJoystick.js
// On-screen touch joystick for Android/mobile.
// No external deps. Uses DOM + pointer events.
// Auto-disables movement when XR is presenting (uses window.__SCARLETT_RENDERER__).

export function createAndroidJoystick(opts = {}) {
  const {
    size = 120,
    margin = 18,
    deadzone = 0.12,
    opacity = 0.22,
    knobOpacity = 0.35,
  } = opts;

  const root = document.createElement("div");
  root.style.position = "fixed";
  root.style.left = `${margin}px`;
  root.style.bottom = `${margin}px`;
  root.style.width = `${size}px`;
  root.style.height = `${size}px`;
  root.style.borderRadius = "999px";
  root.style.background = `rgba(255,255,255,${opacity})`;
  root.style.border = "1px solid rgba(255,255,255,0.25)";
  root.style.zIndex = "60";
  root.style.touchAction = "none";
  root.style.userSelect = "none";
  root.style.webkitUserSelect = "none";

  const knob = document.createElement("div");
  knob.style.position = "absolute";
  knob.style.left = "50%";
  knob.style.top = "50%";
  knob.style.transform = "translate(-50%,-50%)";
  knob.style.width = `${size * 0.44}px`;
  knob.style.height = `${size * 0.44}px`;
  knob.style.borderRadius = "999px";
  knob.style.background = `rgba(0,0,0,${knobOpacity})`;
  knob.style.border = "1px solid rgba(255,255,255,0.22)";
  knob.style.boxShadow = "0 10px 30px rgba(0,0,0,0.35)";
  root.appendChild(knob);

  document.body.appendChild(root);

  let active = false;
  let pid = null;
  let cx = 0, cy = 0;
  let x = 0, y = 0; // normalized [-1..1]

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  function setKnob(nx, ny) {
    const r = (size * 0.5) - (size * 0.22);
    const px = nx * r;
    const py = ny * r;
    knob.style.transform = `translate(calc(-50% + ${px}px), calc(-50% + ${py}px))`;
  }

  function reset() {
    active = false;
    pid = null;
    x = 0; y = 0;
    setKnob(0, 0);
  }

  function onDown(e) {
    active = true;
    pid = e.pointerId;
    root.setPointerCapture(pid);
    const rect = root.getBoundingClientRect();
    cx = rect.left + rect.width / 2;
    cy = rect.top + rect.height / 2;
    onMove(e);
  }

  function onMove(e) {
    if (!active || e.pointerId !== pid) return;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;

    const r = size * 0.5;
    let nx = dx / r;
    let ny = dy / r;

    // clamp to circle
    const mag = Math.hypot(nx, ny);
    if (mag > 1) { nx /= mag; ny /= mag; }

    // deadzone
    const dz = deadzone;
    const mag2 = Math.hypot(nx, ny);
    if (mag2 < dz) { nx = 0; ny = 0; }

    x = clamp(nx, -1, 1);
    y = clamp(ny, -1, 1);

    setKnob(x, y);
  }

  function onUp(e) {
    if (e.pointerId !== pid) return;
    try { root.releasePointerCapture(pid); } catch {}
    reset();
  }

  root.addEventListener("pointerdown", onDown);
  root.addEventListener("pointermove", onMove);
  root.addEventListener("pointerup", onUp);
  root.addEventListener("pointercancel", onUp);

  function isXRPresenting() {
    const r = window.__SCARLETT_RENDERER__;
    return !!(r && r.xr && r.xr.isPresenting);
  }

  function updateMove(dt, THREE, camera, speed = 2.6) {
    if (!camera) return;
    if (isXRPresenting()) return; // don't fight XR

    // Convert joystick to forward/strafe (y is down, so invert)
    const strafe = x;
    const forward = -y;

    if (Math.abs(strafe) < 0.001 && Math.abs(forward) < 0.001) return;

    // Camera forward on XZ plane
    const vF = new THREE.Vector3();
    camera.getWorldDirection(vF);
    vF.y = 0;
    vF.normalize();

    const vR = new THREE.Vector3().crossVectors(vF, new THREE.Vector3(0, 1, 0)).normalize(); // right

    const move = new THREE.Vector3();
    move.addScaledVector(vF, forward);
    move.addScaledVector(vR, strafe);

    if (move.lengthSq() > 0) {
      move.normalize().multiplyScalar(speed * dt);
      camera.position.add(move);
    }
  }

  function destroy() {
    root.remove();
  }

  return {
    get x() { return x; },
    get y() { return y; },
    updateMove,
    destroy,
  };
}
