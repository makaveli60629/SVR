# Phase 173 — Locomotion Module Full Copy / Lock

Source file in repo:

`game/modules/teleport.js`

Content SHA at lock time:

`e88b5273d056f887e8695c5450e160a05c44052c`

## Locked Controls

### Quest Hands
- Make fist to arm teleport.
- Purple hand glow confirms teleport is armed.
- Aim with hand.
- Pinch to teleport.
- Fist again cancels.
- Hand aim is protected from pointing behind the player by comparing aim against head forward direction.

### Quest Controllers
- Right stick forward/back follows head/camera direction.
- Right stick horizontal snap-turns 45 degrees.
- Left stick horizontal can strafe.
- Trigger/grip hold arms teleport.
- Release trigger/grip to teleport.
- Controller ray is protected from pointing behind the player.

### Android
- Android smart controls remain separate in `game/modules/android_smart_controls.js`.
- Android overlay must only appear for Android browser and must not interfere with Quest/WebXR.

### Desktop
- Desktop controls remain separate in `game/modules/desktop_controls.js`.
- Desktop preview is fallback only.

## Runtime API Returned by `createTeleportRig`

```js
{
  onSessionStart,
  setLogoTexture,
  update,
  setPlayerPose,
  setPlayerXZ,
  getPlayerPose,
  setPlayerYaw,
  toggleMode,
  getState
}
```

## Key Locomotion Rules Preserved

```js
function getXRHeadForward(){
  const xrCam = renderer.xr.getCamera(camera);
  xrCam.getWorldDirection(vHeadDir);
  vHeadDir.y = 0;
  if (vHeadDir.lengthSq() < 1e-5) vHeadDir.set(0,0,-1);
  return vHeadDir.normalize();
}
```

```js
function movePlayerFromControllers(dt){
  const leftGp = controllerGamepad(leftControllerRef);
  const rightGp = controllerGamepad(rightControllerRef);
  const leftStick = getStick(leftGp, "left");
  const rightStick = getStick(rightGp, "right");
  const now = performance.now();
  if (Math.abs(rightStick.x) > 0.72 && now > snapCooldownUntil){
    playerYaw += Math.sign(rightStick.x) * (Math.PI / 4);
    applyReferenceSpace();
    snapCooldownUntil = now + 220;
  }
  const moveY = Math.abs(rightStick.y) > 0.12 ? rightStick.y : leftStick.y;
  const strafeX = Math.abs(leftStick.x) > 0.12 ? leftStick.x : 0;
  if (Math.hypot(strafeX, moveY) < 0.12) return;
  const forward = getXRHeadForward();
  const right = new THREE.Vector3(forward.z, 0, -forward.x).normalize();
  const speed = 3.25;
  const stepX = (right.x * strafeX + forward.x * (-moveY)) * speed * dt;
  const stepZ = (right.z * strafeX + forward.z * (-moveY)) * speed * dt;
  const limit = Math.max(2, roomClamp - 1.1);
  setPlayerXZ(THREE.MathUtils.clamp(playerX + stepX, -limit, limit), THREE.MathUtils.clamp(playerZ + stepZ, -limit, limit));
}
```

```js
function handAim(hand){
  const wrist = hand?.joints?.wrist;
  const index = hand?.joints?.["index-finger-tip"];
  const thumb = hand?.joints?.["thumb-tip"];
  if (!wrist || !index) return null;
  wrist.updateWorldMatrix?.(true, false);
  index.updateWorldMatrix?.(true, false);
  wrist.getWorldPosition(vWrist);
  index.getWorldPosition(vIndex);
  if (thumb) thumb.getWorldPosition(vThumb); else vThumb.copy(vIndex);
  vDir.copy(vIndex).sub(vWrist);
  const forward = getXRHeadForward();
  const shortRay = vDir.lengthSq() < 0.006;
  if (shortRay) vDir.copy(forward).multiplyScalar(0.65).setY(-0.32);
  else {
    vDir.normalize();
    const flat = new THREE.Vector3(vDir.x, 0, vDir.z);
    if (flat.lengthSq() > 1e-5 && flat.normalize().dot(forward) < -0.20){
      vDir.x *= -1; vDir.z *= -1;
    }
  }
  if (vDir.y > -0.07) vDir.y = -0.38;
  vDir.normalize();
  vOrigin.copy(vIndex).lerp(vWrist, 0.35);
  const t = vOrigin.y / (-vDir.y);
  if (!isFinite(t) || t < 0.12) return null;
  return clampTarget(new THREE.Vector3(vOrigin.x + vDir.x * Math.min(t, 120), 0, vOrigin.z + vDir.z * Math.min(t, 120))).clone();
}
```

## Manual Test Checklist

### Quest Hands
1. Enter VR.
2. Confirm hands visible.
3. Make fist.
4. Confirm purple hand glow and purple teleport arc.
5. Aim in front of player.
6. Pinch.
7. Confirm teleport lands at marker.
8. Make fist again and confirm teleport cancels.

### Quest Controllers
1. Right stick forward/back.
2. Turn head 45 degrees and push forward.
3. Confirm movement follows head/camera forward.
4. Right stick horizontal snap-turns 45 degrees.
5. Trigger/grip aim shows teleport marker.
6. Release to teleport.

### Android Browser
1. Open on Android.
2. Confirm Android sticks appear.
3. Confirm Android overlay does not appear on Quest/Desktop.
4. Confirm left/right controls do not block UI.

### Desktop
1. Confirm desktop movement still works.
2. Confirm `J`, `L`, `T`, number shortcuts still work.

## Notes
This document is the Phase 173 locked copy/summary of the locomotion module. The source of truth remains `game/modules/teleport.js` at the SHA listed above.
