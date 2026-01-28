/**
 * SCARLETT1 • ANDROID CONTROLS (PERMANENT)
 * Two on-screen joysticks:
 *  - Left: move (WASD equivalent)
 *  - Right: look (yaw)
 */
export function mountAndroidControls({ onMove, onLook, Diagnostics }) {
  const isTouch = ("ontouchstart" in window) || (navigator.maxTouchPoints > 0);
  if (!isTouch) {
    Diagnostics?.log?.("[android] no touch -> joystick disabled");
    return { destroy(){} };
  }

  const ui = document.getElementById("scarlett-ui") || document.body;

  const wrap = document.createElement("div");
  wrap.id = "scarlett-joysticks";
  wrap.style.cssText = `
    position:fixed; left:0; right:0; bottom:92px;
    height:220px; pointer-events:none; z-index:100000;
  `;

  function mkStick(side){
    const root = document.createElement("div");
    root.style.cssText = `
      position:absolute; ${side}:16px; bottom:0;
      width:180px; height:180px;
      border-radius:999px;
      border:2px solid rgba(120,160,255,0.35);
      background:rgba(10,12,18,0.18);
      box-shadow:0 10px 25px rgba(0,0,0,0.35);
      pointer-events:auto;
      touch-action:none;
      backdrop-filter: blur(2px);
    `;

    const knob = document.createElement("div");
    knob.style.cssText = `
      position:absolute; left:50%; top:50%;
      width:72px; height:72px; margin-left:-36px; margin-top:-36px;
      border-radius:999px;
      border:2px solid rgba(120,160,255,0.55);
      background:rgba(40,60,120,0.22);
    `;

    root.appendChild(knob);
    wrap.appendChild(root);

    const state = { active:false, id:null, cx:0, cy:0, dx:0, dy:0 };

    const rectCenter = () => {
      const r = root.getBoundingClientRect();
      state.cx = r.left + r.width/2;
      state.cy = r.top + r.height/2;
    };

    const setKnob = (nx, ny) => {
      const max = 48;
      knob.style.transform = `translate(${nx*max}px, ${ny*max}px)`;
    };

    const dead = 0.08;
    const clamp = (v)=> Math.max(-1, Math.min(1, v));

    const moveFrom = (clientX, clientY) => {
      const x = (clientX - state.cx) / 70;
      const y = (clientY - state.cy) / 70;
      let nx = clamp(x), ny = clamp(y);
      if (Math.abs(nx) < dead) nx = 0;
      if (Math.abs(ny) < dead) ny = 0;
      setKnob(nx, ny);
      state.dx = nx; state.dy = ny;
    };

    root.addEventListener("pointerdown", (e)=>{
      state.active = true;
      state.id = e.pointerId;
      root.setPointerCapture(e.pointerId);
      rectCenter();
      moveFrom(e.clientX, e.clientY);
    });

    root.addEventListener("pointermove", (e)=>{
      if (!state.active || e.pointerId !== state.id) return;
      moveFrom(e.clientX, e.clientY);
    });

    const end = (e)=>{
      if (e.pointerId !== state.id) return;
      state.active = false;
      state.id = null;
      state.dx = 0; state.dy = 0;
      setKnob(0,0);
    };

    root.addEventListener("pointerup", end);
    root.addEventListener("pointercancel", end);
    root.addEventListener("lostpointercapture", ()=> { state.active=false; state.dx=0; state.dy=0; setKnob(0,0);} );

    return state;
  }

  const left = mkStick("left");
  const right = mkStick("right");

  let alive = true;
  function loop(){
    if (!alive) return;
    onMove?.(left.dx, -left.dy);
    onLook?.(right.dx, -right.dy);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  ui.appendChild(wrap);
  Diagnostics?.log?.("[android] joystick visible ✅");

  return {
    destroy(){
      alive = false;
      try { wrap.remove(); } catch {}
    }
  };
}
