import * as THREE from "three";

const ANDROID_BUILD = "PHASE-321-ANDROID-LOBBY-PRODUCTION-AUDIT-LOCK";

export function createAndroidSmartControls({ camera, renderer, roomClamp = 10, enabled = true, setStatus = ()=>{}, setMode = ()=>{} }){
  const ua = navigator.userAgent || "";
  const isQuest = /Quest|Oculus|Meta Quest/i.test(ua);
  const isAndroid = /Android/i.test(ua) && !isQuest && enabled;
  const safeHeight = 1.62;
  const fallbackLimitX = 18.25;
  const fallbackLimitZ = 15.10;
  const clampFn = typeof roomClamp === "function" ? roomClamp : null;
  const numericClamp = Number.isFinite(Number(roomClamp)) ? Math.max(4, Number(roomClamp)) : null;

  const state = {
    isAndroid,
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    smoothMove: { x: 0, y: 0 },
    smoothLook: { x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    active: false,
    corrections: 0,
    blockedMoves: 0,
    route: "lobby",
    build: ANDROID_BUILD
  };

  if (!isAndroid || !camera || !renderer?.domElement){
    return { isAndroid:false, update:()=>{}, destroy:()=>{} };
  }

  document.body.classList.add("android-smart-lock", "android-production-controls");
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.style.userSelect = "none";
  renderer.domElement.style.display = "block";
  renderer.domElement.style.visibility = "visible";
  renderer.domElement.style.opacity = "1";

  function finite(n){ return Number.isFinite(n); }
  function safeNumber(n, fallback){ return finite(n) ? n : fallback; }
  function clampXZ(x, z){
    let nextX = safeNumber(x, 0);
    let nextZ = safeNumber(z, 7.2);
    if (clampFn){
      try {
        const result = clampFn(nextX, nextZ);
        if (result && finite(result.x) && finite(result.z)) return { x:result.x, z:result.z };
      } catch {}
    }
    const limitX = numericClamp || fallbackLimitX;
    const limitZ = numericClamp || fallbackLimitZ;
    return {
      x: THREE.MathUtils.clamp(nextX, -limitX, limitX),
      z: THREE.MathUtils.clamp(nextZ, -limitZ, limitZ)
    };
  }
  function publish(action = "state"){
    const clamped = clampXZ(camera.position.x, camera.position.z);
    window.SVR_ANDROID_SMART_CONTROLS = {
      build: ANDROID_BUILD,
      active: true,
      productionMode: true,
      isAndroid: true,
      roomClampMode: clampFn ? "world-function" : "numeric-fallback",
      roomBounds: { x:fallbackLimitX, z:fallbackLimitZ },
      corrections: state.corrections,
      blockedMoves: state.blockedMoves,
      route: state.route,
      action,
      cameraPosition: {
        x:+camera.position.x.toFixed(3),
        y:+camera.position.y.toFixed(3),
        z:+camera.position.z.toFixed(3)
      },
      clampedPosition: { x:+clamped.x.toFixed(3), z:+clamped.z.toFixed(3) },
      checkedAt: new Date().toISOString()
    };
  }
  function clampCamera(reason = "clamp"){
    let changed = false;
    if (!finite(camera.position.x) || !finite(camera.position.y) || !finite(camera.position.z)){
      camera.position.set(0, safeHeight, 7.2);
      changed = true;
    }
    const next = clampXZ(camera.position.x, camera.position.z);
    if (Math.abs(next.x - camera.position.x) > 0.0001 || Math.abs(next.z - camera.position.z) > 0.0001){
      camera.position.x = next.x;
      camera.position.z = next.z;
      changed = true;
    }
    if (Math.abs(camera.position.y - safeHeight) > 0.08){
      camera.position.y = safeHeight;
      changed = true;
    }
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
    <div class="android-stick android-stick-left" data-stick="move" aria-label="Move joystick"><div class="android-knob"></div><span>MOVE</span></div>
    <div class="android-stick android-stick-right" data-stick="look" aria-label="Look joystick"><div class="android-knob"></div><span>LOOK</span></div>
    <div class="android-action-row">
      <button class="android-action" data-action="lobby" type="button">LOBBY</button>
      <button class="android-action android-action-seat" data-action="seat" type="button">SEAT</button>
      <button class="android-action" data-action="center" type="button">CENTER</button>
    </div>
    <div class="android-help">Left stick moves • right stick looks</div>
  `;
  document.body.appendChild(wrap);

  const style = document.createElement("style");
  style.id = "androidSmartControlsStyle";
  style.textContent = `
    html,body{overscroll-behavior:none!important;-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
    body.android-production-controls #hud,body.android-production-controls #sceneNav,body.android-production-controls #log,body.android-production-controls #err,body.android-production-controls #svrPhaseBadge,body.android-production-controls .phase-label{display:none!important}
    body.android-production-controls .svr-vr-button{display:none!important}
    #androidSmartControls{position:fixed;inset:0;z-index:2147483600;pointer-events:none;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif}
    .android-stick{position:absolute;width:112px;height:112px;border-radius:999px;border:1px solid rgba(127,252,255,.64);background:radial-gradient(circle,rgba(127,252,255,.14),rgba(0,0,0,.28));box-shadow:0 0 24px rgba(127,252,255,.20);pointer-events:auto;touch-action:none;user-select:none}
    .android-stick-left{left:max(14px,env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom))}
    .android-stick-right{right:max(14px,env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom))}
    .android-knob{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:999px;background:rgba(127,252,255,.68);box-shadow:0 0 18px rgba(127,252,255,.72);transform:translate(0,0);will-change:transform}
    .android-stick span{position:absolute;left:0;right:0;bottom:-21px;text-align:center;color:#e9fdff;font-weight:900;font-size:10px;letter-spacing:.10em;text-shadow:0 0 8px #000}
    .android-action-row{position:absolute;left:50%;bottom:calc(24px + env(safe-area-inset-bottom));transform:translateX(-50%);display:flex;gap:7px;pointer-events:auto}
    .android-action{pointer-events:auto;touch-action:none;border:1px solid rgba(255,217,138,.60);border-radius:999px;background:rgba(0,0,0,.62);color:#fff4d0;font-weight:900;font-size:10px;letter-spacing:.07em;padding:9px 12px;box-shadow:0 0 16px rgba(255,217,138,.16)}
    .android-action-seat{border-color:rgba(127,252,255,.72);color:#dffeff;box-shadow:0 0 18px rgba(127,252,255,.20)}
    .android-help{position:absolute;left:50%;bottom:calc(82px + env(safe-area-inset-bottom));transform:translateX(-50%);color:#dffeff;font-size:10px;background:rgba(0,0,0,.46);border:1px solid rgba(127,252,255,.28);border-radius:999px;padding:6px 10px;white-space:nowrap;transition:opacity .5s ease}
    @media (max-width:430px){.android-stick{width:98px;height:98px}.android-knob{width:40px;height:40px;margin:-20px 0 0 -20px}.android-action{font-size:9px;padding:8px 10px}.android-help{font-size:9px;bottom:calc(76px + env(safe-area-inset-bottom))}}
    @media (max-height:520px){.android-stick{width:88px;height:88px}.android-knob{width:36px;height:36px;margin:-18px 0 0 -18px}.android-action-row{bottom:calc(16px + env(safe-area-inset-bottom))}.android-help{display:none}}
  `;
  document.head.appendChild(style);

  const maxRadius = 42;
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
    const dead = kind === "move" ? 0.14 : 0.10;
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
      ev.preventDefault();
      ev.stopPropagation();
      el.setPointerCapture?.(ev.pointerId);
      pointers.set(ev.pointerId, { el, kind });
      setStick(el, kind, ev);
      state.active = true;
    }, { passive:false });
    el.addEventListener("pointermove", (ev)=>{
      if (!pointers.has(ev.pointerId)) return;
      ev.preventDefault();
      ev.stopPropagation();
      setStick(el, kind, ev);
    }, { passive:false });
    const release = (ev)=>{
      if (!pointers.has(ev.pointerId)) return;
      ev.preventDefault();
      ev.stopPropagation();
      pointers.delete(ev.pointerId);
      resetStick(el, kind);
    };
    el.addEventListener("pointerup", release, { passive:false });
    el.addEventListener("pointercancel", release, { passive:false });
    el.addEventListener("lostpointercapture", release, { passive:false });
  });

  function dispatchCode(code){
    window.dispatchEvent(new KeyboardEvent("keydown", { code }));
  }
  function centerView(){
    state.yaw = 0;
    state.pitch = 0;
    camera.position.set(0, safeHeight, 7.2);
    camera.lookAt(0, 1.45, -2);
    state.route = "lobby";
    clampCamera("center");
    setStatus("Android view centered", { force:true });
  }
  wrap.querySelector(".android-action-row")?.addEventListener("pointerdown", (ev)=>{
    const button = ev.target.closest("button[data-action]");
    if (!button) return;
    ev.preventDefault();
    ev.stopPropagation();
    const action = button.dataset.action;
    if (action === "lobby"){
      dispatchCode("Digit1");
      state.route = "lobby";
    } else if (action === "seat"){
      dispatchCode("Digit3");
      state.route = "seat";
      setTimeout(()=>dispatchCode("KeyJ"), 120);
    } else if (action === "center"){
      centerView();
    }
    publish(`action-${action}`);
  }, { passive:false });

  const euler = new THREE.Euler(0, 0, 0, "YXZ");
  euler.setFromQuaternion(camera.quaternion);
  state.yaw = euler.y;
  state.pitch = euler.x;
  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();

  function update(dt = 0.016){
    if (renderer.xr?.isPresenting) return;
    const blendMove = Math.min(1, Math.max(0, dt) * 10.5);
    const blendLook = Math.min(1, Math.max(0, dt) * 13.0);
    state.smoothMove.x += (state.move.x - state.smoothMove.x) * blendMove;
    state.smoothMove.y += (state.move.y - state.smoothMove.y) * blendMove;
    state.smoothLook.x += (state.look.x - state.smoothLook.x) * blendLook;
    state.smoothLook.y += (state.look.y - state.smoothLook.y) * blendLook;

    const lookSpeed = 1.18;
    state.yaw -= state.smoothLook.x * lookSpeed * dt;
    state.pitch -= state.smoothLook.y * lookSpeed * dt;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -0.72, 0.72);
    camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");

    const mx = state.smoothMove.x;
    const my = state.smoothMove.y;
    if (Math.hypot(mx, my) > 0.025){
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0,0,-1);
      forward.normalize();
      right.set(forward.z, 0, -forward.x).normalize();
      const speed = 2.05;
      const dx = (right.x * mx + forward.x * (-my)) * speed * dt;
      const dz = (right.z * mx + forward.z * (-my)) * speed * dt;
      const next = clampXZ(camera.position.x + dx, camera.position.z + dz);
      if (!finite(next.x) || !finite(next.z)){
        state.blockedMoves++;
        centerView();
      } else {
        camera.position.x = next.x;
        camera.position.z = next.z;
        camera.position.y = safeHeight;
      }
    }
    clampCamera("update");
    setMode("Android dual-stick lobby controls");
  }

  const help = wrap.querySelector(".android-help");
  setTimeout(()=>{ if (help) help.style.opacity = "0.28"; }, 7000);
  window.SVR_ANDROID_SAFE_CENTER = centerView;
  window.SVR_ANDROID_SAFE_MOVE_STATE = state;
  window.SVR_ANDROID_LOBBY_CONTROLS = { build:ANDROID_BUILD, active:true, dualStick:true, fullLobbyBounds:true };
  clampCamera("install");
  setStatus("Android lobby controls ready", { force:true });
  setMode("Android dual-stick lobby controls");
  publish("install");

  return {
    isAndroid:true,
    update,
    destroy:()=>{
      wrap.remove();
      style.remove();
      document.body.classList.remove("android-smart-lock", "android-production-controls");
    }
  };
}
