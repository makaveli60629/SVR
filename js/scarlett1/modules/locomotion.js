export function initLocomotion({ playerGroup, camera, Bus }) {
  const keys = new Set();
  let yaw = 0;
  const stick = { mx:0, my:0, tx:0, ty:0 }; // move, turn
  const pads = {
    move: { pad: document.getElementById('movePad'), knob: document.getElementById('moveKnob'), active:false, id:null, cx:0, cy:0 },
    turn: { pad: document.getElementById('turnPad'), knob: document.getElementById('turnKnob'), active:false, id:null, cx:0, cy:0 },
  };

  window.addEventListener('keydown', (e)=>keys.add(e.key.toLowerCase()));
  window.addEventListener('keyup', (e)=>keys.delete(e.key.toLowerCase()));

  function bindPad(p, setFn){
    if (!p.pad || !p.knob) return;
    const radius = 50;
    p.pad.addEventListener('pointerdown', (e)=>{
      p.active = true; p.id = e.pointerId;
      const r = p.pad.getBoundingClientRect();
      p.cx = r.left + r.width/2; p.cy = r.top + r.height/2;
      p.pad.setPointerCapture(e.pointerId);
    });
    p.pad.addEventListener('pointermove', (e)=>{
      if (!p.active || e.pointerId !== p.id) return;
      const dx = e.clientX - p.cx;
      const dy = e.clientY - p.cy;
      const len = Math.hypot(dx,dy) || 1;
      const cl = Math.min(len, radius);
      const nx = (dx/len) * cl;
      const ny = (dy/len) * cl;
      p.knob.style.left = `${43 + nx}px`;
      p.knob.style.top  = `${43 + ny}px`;
      setFn(nx/radius, ny/radius);
    });
    const end = (e)=>{
      if (e.pointerId !== p.id) return;
      p.active = false; p.id = null;
      p.knob.style.left = '43px'; p.knob.style.top = '43px';
      setFn(0,0);
    };
    p.pad.addEventListener('pointerup', end);
    p.pad.addEventListener('pointercancel', end);
  }

  bindPad(pads.move, (x,y)=>{ stick.mx = x; stick.my = y; });
  bindPad(pads.turn, (x,y)=>{ stick.tx = x; stick.ty = y; });

  const speed = 3.2;
  const turnSpeed = 1.6; // rad/sec approx

  function update(dt){
    // keyboard move
    let fx = 0, fz = 0;
    if (keys.has('w')) fz -= 1;
    if (keys.has('s')) fz += 1;
    if (keys.has('a')) fx -= 1;
    if (keys.has('d')) fx += 1;

    // add stick
    fx += stick.mx;
    fz += stick.my;

    // turn from stick turn x
    yaw += (-stick.tx) * turnSpeed * dt;
    playerGroup.rotation.y = yaw;

    // move in facing direction
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const dx = (fx * cos - fz * sin) * speed * dt;
    const dz = (fx * sin + fz * cos) * speed * dt;

    playerGroup.position.x += dx;
    playerGroup.position.z += dz;
  }

  // expose
  window.__locomotionUpdate = update;
  Bus?.log?.('LOCOMOTION ONLINE');
}
