
/**
 * XR Controller Locomotion Adapter
 * Permanent Patch – Quest / WebXR
 */
export function attachXRControllerLocomotion(renderer, player) {
  let lastSnap = 0;

  function readGamepad() {
    const session = renderer.xr.getSession?.();
    if (!session) return null;

    for (const src of session.inputSources) {
      if (src.gamepad && src.gamepad.axes) {
        const a = src.gamepad.axes;
        return {
          lx: a[0] ?? 0,
          ly: a[1] ?? 0,
          rx: a[2] ?? 0
        };
      }
    }
    return null;
  }

  return function update(dt) {
    const gp = readGamepad();
    if (!gp) return;

    const dead = 0.15;

    // Move
    if (Math.abs(gp.lx) > dead || Math.abs(gp.ly) > dead) {
      player.translateX(gp.lx * dt * 2.5);
      player.translateZ(-gp.ly * dt * 2.5);
    }

    // Snap turn
    if (Math.abs(gp.rx) > 0.75 && performance.now() - lastSnap > 250) {
      player.rotation.y += (gp.rx > 0 ? -1 : 1) * Math.PI / 6;
      lastSnap = performance.now();
    }
  };
}
