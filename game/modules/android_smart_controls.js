import * as THREE from "three";

export function createAndroidSmartControls({ camera, renderer, roomClamp = 10, enabled = true, setStatus = ()=>{}, setMode = ()=>{} }){
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua) && enabled;
  const state = {
    isAndroid,
    move: { x: 0, y: 0 },
    look: { x: 0, y: 0 },
    yaw: 0,
    pitch: 0,
    active: false
  };

  if (!isAndroid || !camera || !renderer?.domElement){
    return { isAndroid:false, update:()=>{}, destroy:()=>{} };
  }

  document.body.classList.add("android-smart-lock");
  renderer.domElement.style.touchAction = "none";
  renderer.domElement.style.userSelect = "none";

  const wrap = document.createElement("div");
  wrap.id = "androidSmartControls";
  wrap.innerHTML = `
    <div class="android-stick android-stick-left" data-stick="move"><div class="android-knob"></div><span>MOVE</span></div>
    <div class="android-stick android-stick-right" data-stick="look"><div class="android-knob"></div><span>LOOK</span></div>
    <button class="android-action android-action-seat" type="button">TABLE</button>
    <button class="android-action android-action-center" type="button">CENTER</button>
    <div class="android-help">Android lock: left stick moves • right stick looks</div>
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
    .android-stick{position:absolute;width:112px;height:112px;border-radius:999px;border:1px solid rgba(95,255,245,.44);background:radial-gradient(circle,rgba(95,255,245,.13),rgba(0,0,0,.24));box-shadow:0 0 22px rgba(95,255,245,.16);pointer-events:auto;touch-action:none;user-select:none;}
    .android-stick-left{left:max(16px,env(safe-area-inset-left));bottom:calc(18px + env(safe-area-inset-bottom));}
    .android-stick-right{right:max(16px,env(safe-area-inset-right));bottom:calc(18px + env(safe-area-inset-bottom));}
    .android-knob{position:absolute;left:50%;top:50%;width:46px;height:46px;margin:-23px 0 0 -23px;border-radius:999px;background:rgba(95,255,245,.58);box-shadow:0 0 18px rgba(95,255,245,.62);transform:translate(0,0);}
    .android-stick span{position:absolute;left:0;right:0;bottom:-22px;text-align:center;color:#bffcff;font-weight:800;font-size:10px;letter-spacing:.08em;text-shadow:0 0 8px #000;}
    .android-action{position:absolute;left:50%;transform:translateX(-50%);pointer-events:auto;touch-action:none;border:1px solid rgba(255,205,230,.50);border-radius:999px;background:rgba(0,0,0,.56);color:#fff;font-weight:900;font-size:11px;letter-spacing:.08em;padding:10px 14px;box-shadow:0 0 18px rgba(255,120,214,.18);}
    .android-action-seat{bottom:calc(74px + env(safe-area-inset-bottom));}
    .android-action-center{bottom:calc(26px + env(safe-area-inset-bottom));}
    .android-help{position:absolute;left:50%;bottom:calc(124px + env(safe-area-inset-bottom));transform:translateX(-50%);color:#dff;font-size:11px;background:rgba(0,0,0,.42);border:1px solid rgba(95,255,245,.25);border-radius:999px;padding:6px 10px;white-space:nowrap;}
    @media (max-width:420px){.android-stick{width:96px;height:96px}.android-knob{width:40px;height:40px;margin:-20px 0 0 -20px}.android-help{font-size:10px;bottom:calc(112px + env(safe-area-inset-bottom));}.android-action{font-size:10px;padding:9px 12px;}}
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
    state[kind].x = Math.abs(x) < 0.08 ? 0 : x;
    state[kind].y = Math.abs(y) < 0.08 ? 0 : y;
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
    };
    el.addEventListener("pointerup", release, { passive:false });
    el.addEventListener("pointercancel", release, { passive:false });
  });

  wrap.querySelector(".android-action-center")?.addEventListener("pointerdown", (ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    state.yaw = 0; state.pitch = 0;
    camera.lookAt(0, 1.2, 0);
    setStatus("Android view centered", { force:true });
  }, { passive:false });

  wrap.querySelector(".android-action-seat")?.addEventListener("pointerdown", (ev)=>{
    ev.preventDefault(); ev.stopPropagation();
    window.dispatchEvent(new KeyboardEvent("keydown", { code:"KeyJ" }));
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

    const lookSpeed = 1.65;
    state.yaw -= state.look.x * lookSpeed * dt;
    state.pitch -= state.look.y * lookSpeed * dt;
    state.pitch = THREE.MathUtils.clamp(state.pitch, -1.12, 1.12);
    camera.rotation.set(state.pitch, state.yaw, 0, "YXZ");

    const mx = state.move.x;
    const my = state.move.y;
    if (Math.hypot(mx, my) > 0.08){
      camera.getWorldDirection(forward);
      forward.y = 0;
      if (forward.lengthSq() < 1e-6) forward.set(0,0,-1);
      forward.normalize();
      right.set(forward.z, 0, -forward.x).normalize();
      const speed = 3.25;
      camera.position.x += (right.x * mx + forward.x * (-my)) * speed * dt;
      camera.position.z += (right.z * mx + forward.z * (-my)) * speed * dt;
      camera.position.x = THREE.MathUtils.clamp(camera.position.x, -roomClamp, roomClamp);
      camera.position.z = THREE.MathUtils.clamp(camera.position.z, -roomClamp, roomClamp);
      camera.position.y = Math.max(camera.position.y || 1.6, 1.18);
    }

    setMode("Android smart controls locked");
  }

  setStatus("Android smart controls loaded: left move, right look", { force:true });
  setMode("Android smart controls locked");

  return {
    isAndroid:true,
    update,
    destroy:()=>{
      wrap.remove();
      style.remove();
      document.body.classList.remove("android-smart-lock");
    }
  };
}
