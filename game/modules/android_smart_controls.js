import * as THREE from "three";

const ANDROID_SAFE_BUILD = "PHASE-148-ANDROID-MOVEMENT-BLACK-SCREEN-FIX";

export function createAndroidSmartControls({ camera, renderer, roomClamp = 10, enabled = true, setStatus = ()=>{}, setMode = ()=>{} }){
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua) && enabled;
  const safeClamp = Math.min(Number(roomClamp) || 8, 7.25);
  const safeHeight = 1.62;
  const state = {
    isAndroid,
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    active: false,
    corrections: 0,
    blockedMoves: 0,
    build: ANDROID_SAFE_BUILD
  };

  if (!isAndroid || !camera || !renderer?.domElement){
    return { isAndroid:false, update:()=>{}, destroy:()=>{} };
  }

  document.body.classList.add("android-smart-lock", "android-safe-move-lock");
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.style.userSelect = "none";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.visibility = "visible";
  renderer.domElement.style.opacity = "1";

  function finite(n){ return Number.isFinite(n); }
  function safeNumber(n, fallback){ return finite(n) ? n : fallback; }
  function publish(action = "state"){
    window.SVR_ANDROID_SMART_CONTROLS = {
      build: ANDROID_SAFE_BUILD,
      active: true,
      isAndroid: true,
      safeClamp,
      safeHeight,
      corrections: state.corrections,
      blockedMoves: state.blockedMoves,
      action,
      cameraPosition: { x:+camera.position.x.toFixed(3), y:+camera.position.y.toFixed(3), z:+camera.position.z.toFixed(3) },
      checkedAt: new Date().toISOString()
    };
  }
  function clampCamera(reason = "clamp"){
    let changed = false;
    if (!finite(camera.position.x) || !finite(camera.position.y) || !finite(camera.position.z)){
      camera.position.set(0, safeHeight, 7.2);
      changed = true;
    }
    const beforeX = camera.position.x;
    const beforeZ = camera.position.z;
    camera.position.x = THREE.MathUtils.clamp(safeNumber(camera.position.x, 0), -safeClamp, safeClamp);
    camera.position.z = THREE.MathUtils.clamp(safeNumber(camera.position.z, 7.2), -safeClamp, safeClamp);
    if (Math.abs(camera.position.y - safeHeight) > 0.08){ camera.position.y = safeHeight; changed = true; }
    if (beforeX !== camera.position.x || beforeZ !== camera.position.z) changed = true;
    if (changed){
      state.corrections++;
      window.SVR_RECOVER_ANDROID_VIEW?.();
    }
    renderer.domElement.style.display = "block";
    renderer.domElement.style.visibility = "visible";
    renderer.domElement.style.opacity = "1";
    publish(reason);
    return changed;
  }

  const wrap = document.createElement("div");
  wrap.id = "androidSmartControls";
  wrap.innerHTML = `
    <div class="android-stick android-stick-left" data-stick="move"><div class="android-knob"></div><span>MOVE</span></div>
    <div class="android-stick android-stick-right" data-stick="look"><div class="android-knob"></div><span>LOOK</span></div>
    <button class="android-action android-action-seat" type="button">TABLE</button>
    <button class="android-action android-action-center" type="button">CENTER</button>
    <div class="android-help">Android safe move: left stick walks • right stick looks</div>
  `;
  document.body.appendChild(wrap);

  const style = document.createElement("style");
  style.id = "androidSmartControlsStyle";
  style.textContent = `
    body.android-smart-lock #hud{left:max(8px,env(safe-area-inset-left));right:max(8px,env(safe-area-inset-right));top:max(8px,env(safe-area-inset-top));gap:6px;transform:scale(.92);transform-origin:top center;}
    body.android-smart-lock #hud .pill,body.android-smart-lock #hud .btn{font-size:11px;padding:7px 9px;}
    body.android-smart-lock #sceneNav{bottom:calc(118px + env(safe-area-inset-bottom));left:8px;right:8px;gap:6px;}
    body.android-smart-lock #sceneNav .scene-btn{font-size:11px;padding:7px 9px;}
    #androidSmartControls{position:fixed;inset:0;z-index:30;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;}
    .android-stick{position:absolute;width:108px;height:108px;border-radius:999px;border:1px solid rgba(141,255,180,.62);background:radial-gradient(circle,rgba(141,255,180,.14),rgba(0,0,0,.28));box-shadow:0 0 22px rgba(141,255,180,.20);pointer-events:auto;touch-action:none;user-select:none;}
    .android-stick-left{left:max(16px,env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom));}
    .android-stick-right{right:max(16px,env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));}
    .android-knob{position:absolute;left:50%;top:50%;width:44px;height:44px;margin:-22px 0 0 -22px;border-radius:999px;background:rgba(141,255,180,.64);box-shadow:0 0 18px rgba(141,255,180,.70);transform:translate(0,0);}
    .android-stick span{position:absolute;left:0;right:0;bottom:-22px;text-align:center;color:#dfffe9;font-weight:900;font-size:10px;letter-spacing:.08em;text-shadow:0 0 8px #000;}
    .android-action{position:absolute;left:50%;transform:translateX(-50%);pointer-events:auto;touch-action:none;border:1px solid rgba(141,255,180,.56);border-radius:999px;background:rgba(0,0,0,.58);color:#fff;font-weight:900;font-size:11px;letter-spacing:.08em;padding:10px 14px;box-shadow:0 0 18px rgba(141,255,180,.20);}
    .android-action-seat{bottom:calc(74px + env(safe-area-inset-bottom));}
    .android-action-center{bottom:calc(26px + env(safe-area-inset-bottom));}
    .android-help{position:absolute;left:50%;bottom:calc(124px + env(safe-area-inset-bottom));transform:translateX(-50%);color:#dff;font-size:11px;background:rgba(0,0,0,.42);border:1px solid rgba(141,255,180,.30);border-radius:999px;padding:6px 10px;white-space:nowrap;}
    @media (max-width:420px){.android-stick{width:94px;height:94px}.android-knob{width:38px;height:38px;margin:-19px 0 0 -19px}.android-help{font-size:10px;bottom:calc(112px + env(safe-area-inset-bottom));}.android-action{font-size:10px;padding:9px 12px;}}
  `;
  document.head.appendChild(style);

  const maxRadius = 40;
  const pointers = new Map();

  function setStick(el, kind, ev){
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    let dx = ev.clientX - cx;
    let dy = ev.clientY - cy;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius){ dx = dx / dist * maxRadius; dy = dy / dist * maxRadius; }
    const x = dx / maxRadius;
    const y = dy / maxRadius;
    const knob = el.querySelector(".android-knob");
    if (knob) knob.style.transform = `translate(${dx}px,${dy}px)`;
    const dead = kind === "move" ? 0.16 : 0.10;
    state[kind].x = Math.abs(x) < dead ? 0 : x;
    state[kind].y = Math.abs(y) < dead ? 0 : y;
  }

  function resetStick(el, kind){
    const knob = el.querySelector(".android-knob");
    if (knob) knob.style.transform = "translate(0,0)";
    state[kind].x = 0;
    state[kind].y = 0;
  }

  wrap.querySelectorAll(".android-stick").forEach((el)=>{
    const kind = el.dataset.stick === "look" ? "look" : "move";
    el.addEventListener("pointerdown", (ev)=>{
      ev.preventDefault(); ev.stopPropagation();
      el.setPointerCapture?.(ev.pointerId);
      pointers.set(ev.pointerId, { el, kind });
      setStick(el, kind, ev);
      state.active = true;
      clampCamera("pointerdown");
    }, { passive:false });
    el.addEventListener("pointermove", (ev)=>{
      if (!pointers.has(ev.pointerId)) return;
      ev.preventDefault(); ev.stopPropagation();
      setStick(el, kind, ev);
    }, { passive:false });
    const release = (ev)=>{
      if (!pointers.has(ev.pointerId)) return;
      ev.preventDefault(); ev.stopPropagation();
      pointers.delete(ev.pointerId);
      resetStick(el, kind);
      clampCamera("pointerup");
    };
    el.addEventListener("pointerup", release, { passive:false });
    el.addEventListener("pointercancel", release, { passive:false });
  });

  wrap.querySelector(".android-action-center")?.addEventListener("pointerdown", (ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    state.yaw = 0; state.pitch = 0;
    camera.position.set(0, safeHeight, 7.2);
    camera.lookAt(0, 1.45, -2);
    clampCamera("center");
    setStatus("Android view centered", { force:true });
  }, { passive:false });

  wrap.querySelector(".android-action-seat")?.addEventListener("pointerdown", (ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    window.dispatchEvent(new KeyboardEvent("keydown", { code:"KeyJ" }));
    clampCamera("table-button");
    setStatus("Android table button pressed", { force:true });
  }, { passive:false });

  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  euler.setFromQuaternion(camera.quaternion);
  state.yaw = euler.y;
  state.pitch = euler.x;

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  function update(dt = 0.016){
    if (renderer.xr?.isPresenting) return;
    clampCamera("pre-update");

    const lookSpeed = 1.12;
    state.yaw -= state.look.x * lookSpeed * dt;
    state.pitch -= state.look.y * lookSpeed * dt;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -0.72, 0.72);
    camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");

    const mx = state.move.x;
    const my = state.move.y;
    if (Math.hypot(mx, my) > 0.16){
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0,0,-1);
      forward.normalize();
      right.set(forward.z, 0, -forward.x).normalize();
      const speed = 1.45;
      const dx = (right.x * mx + forward.x * (-my)) * speed * dt;
      const dz = (right.z * mx + forward.z * (-my)) * speed * dt;
      const nextX = THREE.MathUtils.clamp(camera.position.x + dx, -safeClamp, safeClamp);
      const nextZ = THREE.MathUtils.clamp(camera.position.z + dz, -safeClamp, safeClamp);
      if (!finite(nextX) || !finite(nextZ)){
        state.blockedMoves++;
        camera.position.set(0, safeHeight, 7.2);
        window.SVR_RECOVER_ANDROID_VIEW?.();
      } else {
        camera.position.x = nextX;
        camera.position.z = nextZ;
        camera.position.y = safeHeight;
      }
    }

    clampCamera("post-update");
    setMode("Android safe movement locked");
  }

  window.SVR_ANDROID_SAFE_CENTER = () => { camera.position.set(0, safeHeight, 7.2); camera.lookAt(0, 1.45, -2); clampCamera("api-center"); };
  window.SVR_ANDROID_SAFE_MOVE_STATE = state;
  clampCamera("install");
  setStatus("Android safe controls loaded: slower movement, fixed height", { force:true });
  setMode("Android safe movement locked");

  return {
    isAndroid:true,
    update,
    destroy:()=>{
      wrap.remove();
      style.remove();
      document.body.classList.remove("android-smart-lock", "android-safe-move-lock");
    }
  };
}
