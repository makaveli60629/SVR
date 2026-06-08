import * as THREE from "three";

export function isAndroidBrowserOnly(){
  const ua = navigator.userAgent || "";
  const isAndroid = /Android/i.test(ua);
  const isQuest = /Quest|OculusBrowser|Meta Quest|VR/i.test(ua);
  const hasTouch = (navigator.maxTouchPoints || 0) > 0 || "ontouchstart" in window;
  return isAndroid && hasTouch && !isQuest;
}

export function createAndroidControls({ camera, roomClamp, enabled = true } = {}){
  const isAndroid = isAndroidBrowserOnly();
  const state = { active:false, x:0, y:0, turnLeft:false, turnRight:false, lastSnap:0 };
  const fwd = new THREE.Vector3();
  const right = new THREE.Vector3();
  const move = new THREE.Vector3();
  let root = null;

  function setVisible(on){
    if (!root) return;
    root.style.display = on ? "block" : "none";
    root.setAttribute("aria-hidden", on ? "false" : "true");
    document.body.classList.toggle("android-controls-enabled", on);
    document.body.classList.toggle("android-controls-disabled", !on);
  }

  function build(){
    document.body.classList.toggle("android-controls-disabled", !isAndroid);
    if (!isAndroid || !enabled) return null;
    root = document.createElement("div");
    root.id = "androidControls";
    root.className = "android-controls mobile-controls";
    root.innerHTML = `
      <div class="android-stick-zone" id="androidMoveZone" aria-label="Android movement joystick">
        <div class="android-stick-base"><div class="android-stick-knob" id="androidMoveKnob"></div></div>
        <div class="android-stick-label">MOVE</div>
      </div>
      <div class="android-turn-zone" aria-label="Android snap turn controls">
        <button class="android-turn-btn" id="androidTurnLeft" type="button">↶</button>
        <button class="android-turn-btn" id="androidTurnRight" type="button">↷</button>
      </div>`;
    document.body.appendChild(root);

    const zone = root.querySelector("#androidMoveZone");
    const knob = root.querySelector("#androidMoveKnob");
    const left = root.querySelector("#androidTurnLeft");
    const rightBtn = root.querySelector("#androidTurnRight");
    const resetStick = ()=>{ state.active=false; state.x=0; state.y=0; knob.style.transform = "translate(-50%, -50%)"; };
    const updateStick = (ev)=>{
      const t = ev.touches ? ev.touches[0] : ev;
      if (!t) return;
      const r = zone.getBoundingClientRect();
      const cx = r.left + r.width * 0.5;
      const cy = r.top + r.height * 0.5;
      const max = Math.min(r.width, r.height) * 0.34;
      let dx = t.clientX - cx;
      let dy = t.clientY - cy;
      const d = Math.hypot(dx, dy);
      if (d > max){ dx = dx / d * max; dy = dy / d * max; }
      state.active = true;
      state.x = dx / max;
      state.y = -dy / max;
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    };
    zone.addEventListener("touchstart", (e)=>{ e.preventDefault(); updateStick(e); }, { passive:false });
    zone.addEventListener("touchmove", (e)=>{ e.preventDefault(); updateStick(e); }, { passive:false });
    zone.addEventListener("touchend", (e)=>{ e.preventDefault(); resetStick(); }, { passive:false });
    zone.addEventListener("pointerdown", (e)=>{ if (e.pointerType === "mouse") return; zone.setPointerCapture?.(e.pointerId); updateStick(e); });
    zone.addEventListener("pointermove", (e)=>{ if (!state.active || e.pointerType === "mouse") return; updateStick(e); });
    zone.addEventListener("pointerup", resetStick);
    zone.addEventListener("pointercancel", resetStick);

    const hold = (key, val)=>{ state[key] = val; };
    left.addEventListener("touchstart", e=>{ e.preventDefault(); hold("turnLeft", true); }, { passive:false });
    left.addEventListener("touchend", e=>{ e.preventDefault(); hold("turnLeft", false); }, { passive:false });
    rightBtn.addEventListener("touchstart", e=>{ e.preventDefault(); hold("turnRight", true); }, { passive:false });
    rightBtn.addEventListener("touchend", e=>{ e.preventDefault(); hold("turnRight", false); }, { passive:false });
    left.addEventListener("pointerdown", e=>{ e.preventDefault(); hold("turnLeft", true); });
    left.addEventListener("pointerup", e=>{ e.preventDefault(); hold("turnLeft", false); });
    rightBtn.addEventListener("pointerdown", e=>{ e.preventDefault(); hold("turnRight", true); });
    rightBtn.addEventListener("pointerup", e=>{ e.preventDefault(); hold("turnRight", false); });
    setVisible(true);
    return root;
  }

  build();

  function update(dt, { xrPresenting = false } = {}){
    if (!isAndroid || !root) return;
    setVisible(!xrPresenting);
    if (xrPresenting) return;
    const now = performance.now();
    if ((state.turnLeft || state.turnRight) && now - state.lastSnap > 280){
      camera.rotation.y += state.turnLeft ? Math.PI / 4 : -Math.PI / 4;
      state.lastSnap = now;
    }
    const mag = Math.hypot(state.x, state.y);
    if (!state.active || mag < 0.08) return;
    camera.getWorldDirection(fwd);
    fwd.y = 0;
    if (fwd.lengthSq() < 0.0001) return;
    fwd.normalize();
    right.crossVectors(fwd, new THREE.Vector3(0,1,0)).normalize();
    move.copy(fwd).multiplyScalar(state.y).addScaledVector(right, state.x).normalize();
    const speed = 2.25;
    camera.position.addScaledVector(move, speed * dt * Math.min(1, mag));
    if (roomClamp) roomClamp(camera.position);
  }

  return { isAndroid, update, setVisible };
}
