/*  Scarlett1 FULL WORLD BOOT (A-FRAME CDN)
    - Real lobby: circular 2x walls + deep pit + 8-seat table + 4 jumbotron doors
    - Rooms: Poker Pit (6-seat oval) + Store (balcony)
    - Teleport + portals + wristwatch teleports
    - Hands always visible (Quest)
    - Reticle/face-artifact killer
*/

const HUD_MAX = 18;
const logs = [];
function hudLog(msg) {
  try {
    const t = new Date();
    const stamp = `[${t.toLocaleTimeString()}] `;
    logs.push(stamp + msg);
    while (logs.length > HUD_MAX) logs.shift();
    const hud = document.getElementById("hud");
    if (hud) hud.textContent = logs.join("\n");
  } catch {}
}
window.hudLog = hudLog;

function $(id){ return document.getElementById(id); }

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function makeMat(color, emissive=null, ei=0){
  const m = { color };
  if (emissive) { m.emissive = emissive; m.emissiveIntensity = ei; }
  return m;
}

function setAttributes(el, attrs){
  Object.entries(attrs).forEach(([k,v]) => el.setAttribute(k, v));
}

function makeEntity(tag, attrs={}, parent=null){
  const e = document.createElement(tag);
  setAttributes(e, attrs);
  if (parent) parent.appendChild(e);
  return e;
}

/* ---------------------------
   1) Kill reticles / face junk
---------------------------- */
AFRAME.registerComponent("scarlett-vr-eye-fix", {
  init(){
    const scene = this.el.sceneEl;

    const apply = (tag) => {
      const cam = $("camera");
      const lh = $("leftHand");
      const rh = $("rightHand");

      // Remove camera-attached planes/text/rings
      if (cam) {
        [...cam.children].forEach(ch => {
          const tn = (ch.tagName||"").toLowerCase();
          if (tn.includes("a-plane") || tn.includes("a-text") || tn.includes("a-ring")) {
            ch.remove();
          }
        });
        // Remove cursor/raycaster if any
        if (cam.hasAttribute("cursor")) cam.removeAttribute("cursor");
        if (cam.hasAttribute("raycaster")) cam.removeAttribute("raycaster");
      }

      // Hide controller ray lines if any were created by other code
      [lh, rh].forEach(h => {
        if (!h) return;
        if (h.hasAttribute("raycaster")) {
          const rc = h.getAttribute("raycaster") || "";
          h.setAttribute("raycaster", `${rc}; showLine:false;`);
        }
        // Remove any UI children attached to hands
        [...h.children].forEach(ch => {
          const tn = (ch.tagName||"").toLowerCase();
          if (tn.includes("a-plane") || tn.includes("a-text") || tn.includes("a-ring")) ch.remove();
        });
      });

      hudLog(`VR Eye Fix applied ✅ (${tag})`);
    };

    scene.addEventListener("enter-vr", () => {
      setTimeout(()=>apply("enter-vr+200ms"),200);
      setTimeout(()=>apply("enter-vr+800ms"),800);
      setTimeout(()=>apply("enter-vr+1500ms"),1500);
    });

    // also apply once at boot
    setTimeout(()=>apply("boot+700ms"),700);
  }
});

/* ---------------------------
   2) Smooth Locomotion (sticks)
   - Left stick: move
   - Right stick: snap turn
---------------------------- */
AFRAME.registerComponent("scarlett-locomotion", {
  schema: {
    moveSpeed: {default: 2.0},      // meters/sec
    snapDeg:   {default: 22.5},
    snapCool:  {default: 220}       // ms
  },
  init(){
    this.rig = $("rig");
    this.cam = $("camera");
    this.lastSnap = 0;

    this._onMove = (e) => {
      // This is fired on some platforms; we also poll each tick via gamepad
    };
  },
  tick(t, dt){
    const rig = this.rig;
    const cam = this.cam;
    if (!rig || !cam) return;

    const gpL = this._getGamepad("left");
    const gpR = this._getGamepad("right");

    const secs = dt / 1000;

    // Move (left stick)
    if (gpL && gpL.axes && gpL.axes.length >= 2) {
      // Quest axes: [x,y]
      let x = gpL.axes[0] || 0;
      let y = gpL.axes[1] || 0;

      // deadzone
      if (Math.abs(x) < 0.12) x = 0;
      if (Math.abs(y) < 0.12) y = 0;

      // FIX: do NOT invert left/right; keep forward correct
      // forward on stick is negative y (typical)
      const forward = -y;
      const strafe  = x;

      if (forward !== 0 || strafe !== 0) {
        const yaw = cam.object3D.rotation.y;

        const sin = Math.sin(yaw), cos = Math.cos(yaw);
        const dx = (strafe * cos + forward * sin) * this.data.moveSpeed * secs;
        const dz = (forward * cos - strafe * sin) * this.data.moveSpeed * secs;

        const p = rig.object3D.position;
        p.x += dx;
        p.z += dz;
      }
    }

    // Snap turn (right stick x)
    if (gpR && gpR.axes && gpR.axes.length >= 2) {
      let rx = gpR.axes[0] || 0;
      if (Math.abs(rx) < 0.75) rx = 0;

      if (rx !== 0 && (t - this.lastSnap) > this.data.snapCool) {
        const dir = rx > 0 ? -1 : 1; // right stick right = turn right
        const r = rig.getAttribute("rotation");
        rig.setAttribute("rotation", `0 ${r.y + dir*this.data.snapDeg} 0`);
        this.lastSnap = t;
      }
    }
  },

  _getGamepad(hand){
    try{
      const el = hand === "left" ? $("leftHand") : $("rightHand");
      if (!el) return null;
      const c = el.components["oculus-touch-controls"] || el.components["tracked-controls"];
      if (c && c.controller) return c.controller;
    }catch{}
    return null;
  }
});

/* ---------------------------
   3) Teleport System
   - Right trigger: teleport to floor hit
   - Shows blue ring on floor
---------------------------- */
AFRAME.registerComponent("scarlett-teleport", {
  init(){
    this.rig = $("rig");
    this.rh  = $("rightHand");
    this.ring = null;
    this.hitPoint = new THREE.Vector3();
    this.ready = false;

    const scene = this.el.sceneEl;

    // ring indicator
    this.ring = makeEntity("a-ring", {
      id: "teleportRing",
      "radius-inner": "0.22",
      "radius-outer": "0.36",
      rotation: "-90 0 0",
      position: "999 -999 999",
      material: "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.25; opacity:0.7; transparent:true"
    }, scene);

    // raycaster on right hand (invisible line)
    if (this.rh) {
      this.rh.setAttribute("raycaster", "objects: .teleportable; far: 50; showLine: false;");
    }

    // trigger handlers
    scene.addEventListener("loaded", () => {
      this.ready = true;
      hudLog("Teleport ready ✅ (triggerdown, no laser)");
    });

    // controller events
    this._down = () => { this.isDown = true; };
    this._up   = () => { this.isDown = false; this.tryTeleport(); };

    scene.addEventListener("triggerdown", this._down);
    scene.addEventListener("triggerup", this._up);
  },

  tick(){
    if (!this.ready || !this.isDown || !this.rh) return;

    const rc = this.rh.components.raycaster;
    if (!rc) return;

    const hits = rc.intersections;
    if (!hits || !hits.length) {
      this.ring.setAttribute("position", "999 -999 999");
      return;
    }

    const h = hits[0];
    this.hitPoint.copy(h.point);

    this.ring.setAttribute("position", `${this.hitPoint.x.toFixed(2)} ${(this.hitPoint.y+0.03).toFixed(2)} ${this.hitPoint.z.toFixed(2)}`);
  },

  tryTeleport(){
    if (!this.rig || !this.ring) return;

    const pos = this.ring.getAttribute("position");
    // if ring is hidden
    if (!pos || pos.y < -500) return;

    // move rig to ring (keep current head height handled by camera)
    const r = this.rig.object3D.position;
    r.x = pos.x;
    r.z = pos.z;

    // hide ring
    this.ring.setAttribute("position", "999 -999 999");
  }
});

/* ---------------------------
   4) Wrist Watch Teleports
---------------------------- */
AFRAME.registerComponent("scarlett-watch", {
  schema: { targets: {default: ""} },
  init(){
    this.lh = $("leftHand");
    if (!this.lh) return;

    // watch base
    const watch = makeEntity("a-entity", { id:"watchUI", position:"0.05 0.02 -0.06", rotation:"-35 0 0" }, this.lh);

    makeEntity("a-plane", {
      width:"0.11", height:"0.09",
      material:"color:#0b0f14; opacity:0.85; transparent:true; emissive:#2bd6ff; emissiveIntensity:0.08"
    }, watch);

    const mkBtn = (id, y, label, targetId) => {
      const b = makeEntity("a-plane", {
        id, width:"0.10", height:"0.026",
        position:`0 ${y} 0.001`,
        material:"color:#111827; opacity:0.92; transparent:true; emissive:#7b61ff; emissiveIntensity:0.08"
      }, watch);

      makeEntity("a-text", {
        value: label, align:"center", color:"#9ff",
        width:"0.6", position:"0 0 0.0015"
      }, b);

      // click/trigger
      b.classList.add("clickable");
      b.addEventListener("click", ()=> teleportTo(targetId));
      b.addEventListener("triggerdown", ()=> teleportTo(targetId));
    };

    // Buttons
    mkBtn("btnLobby",  0.022, "LOBBY", "pad_lobby_safe");
    mkBtn("btnPoker", -0.004, "POKER PIT", "pad_poker_safe");
    mkBtn("btnStore", -0.030, "STORE", "pad_store_safe");

    // Make right-hand raycaster click watch too (no visible laser)
    const rh = $("rightHand");
    if (rh) rh.setAttribute("raycaster", "objects: .clickable; far: 10; showLine:false;");

    function teleportTo(padId){
      const pad = $(padId);
      const rig = $("rig");
      if (!pad || !rig) return;
      const p = pad.object3D.position;
      rig.object3D.position.x = p.x;
      rig.object3D.position.z = p.z;
      hudLog(`Watch teleport ✅ -> ${padId}`);
    }
  }
});

/* ---------------------------
   5) Portal Pads (room circles)
---------------------------- */
AFRAME.registerComponent("scarlett-portal", {
  schema: { target: {default:""} },
  init(){
    this.el.classList.add("clickable");
    this.el.addEventListener("click", ()=> this.go());
    this.el.addEventListener("triggerdown", ()=> this.go());
  },
  go(){
    const rig = $("rig");
    const tgt = $(this.data.target);
    if (!rig || !tgt) return;
    const p = tgt.object3D.position;
    rig.object3D.position.x = p.x;
    rig.object3D.position.z = p.z;
    hudLog(`Portal ✅ -> ${this.data.target}`);
  }
});

/* ---------------------------
   6) Simple Bots + Avatars (static)
   Uses your /assets/avatars/ files if present
---------------------------- */
function makeAvatar(parent, src, pos, rot="0 180 0", scale="1 1 1"){
  const a = makeEntity("a-entity", {
    position: pos, rotation: rot, scale,
    "gltf-model": src
  }, parent);

  a.addEventListener("model-error", ()=> {
    // fallback statue
    a.removeAttribute("gltf-model");
    makeEntity("a-cone", {
      radiusBottom:"0.25", radiusTop:"0.05", height:"1.6",
      position:"0 0.8 0",
      material:"color:#0b0f14; emissive:#2bd6ff; emissiveIntensity:0.35; roughness:0.9"
    }, a);
  });
  return a;
}

/* ---------------------------
   7) 6-seat oval table (your neon/leather style)
   (tight + fixed + better pedestal)
---------------------------- */
AFRAME.registerComponent("scarlett-table6", {
  init(){
    const el = this.el;

    // pedestal platform (bigger)
    makeEntity("a-cylinder", {
      radius:"3.9", height:"0.22",
      position:"0 0.11 0",
      material:"color:#0b0f14; metalness:0.75; roughness:0.35"
    }, el);

    makeEntity("a-cylinder", {
      radius:"0.75", height:"1.05",
      position:"0 0.74 0",
      material:"color:#0b0f14; metalness:0.70; roughness:0.35"
    }, el);

    // table top
    makeEntity("a-cylinder", {
      radius:"1.08", height:"0.18",
      position:"0 1.28 0",
      scale:"3.20 1 1.80",
      material:"color:#101827; metalness:0.20; roughness:0.55"
    }, el);

    // leather trim
    makeEntity("a-torus", {
      radius:"1.06", "radius-tubular":"0.075",
      rotation:"-90 0 0", position:"0 1.36 0",
      scale:"3.15 1 1.75",
      material:"color:#2a1b12; metalness:0.10; roughness:0.92"
    }, el);

    // felt
    makeEntity("a-cylinder", {
      radius:"0.96", height:"0.05",
      position:"0 1.36 0",
      scale:"2.90 1 1.60",
      material:"color:#07111a; roughness:0.95; metalness:0.0"
    }, el);

    // inner pot oval
    makeEntity("a-cylinder", {
      radius:"0.40", height:"0.02",
      position:"0 1.39 0",
      scale:"3.0 1 1.55",
      material:"color:#0b1a25; emissive:#2bd6ff; emissiveIntensity:0.25; roughness:0.9; metalness:0.0"
    }, el);

    // neon rail
    makeEntity("a-torus", {
      radius:"1.08", "radius-tubular":"0.02",
      rotation:"-90 0 0", position:"0 1.41 0",
      scale:"3.22 1 1.82",
      material:"color:#0f1116; emissive:#2bd6ff; emissiveIntensity:2.0; opacity:0.90; transparent:true"
    }, el);

    // pass-line oval (a thin neon oval)
    makeEntity("a-torus", {
      radius:"0.92", "radius-tubular":"0.012",
      rotation:"-90 0 0", position:"0 1.385 0",
      scale:"3.05 1 1.62",
      material:"color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.6; opacity:0.7; transparent:true"
    }, el);

    // seats: 6 (1 each end + 2 per side)
    const seatY = 0.22;
    const seats = [
      { id:"seat_front", x:0,    z: 3.35, r:180 },
      { id:"seat_back",  x:0,    z:-3.35, r:0   },
      { id:"seat_L1",    x:-2.75,z: 1.25, r:90  },
      { id:"seat_L2",    x:-2.75,z:-1.25, r:90  },
      { id:"seat_R1",    x: 2.75,z: 1.25, r:-90 },
      { id:"seat_R2",    x: 2.75,z:-1.25, r:-90 },
    ];

    seats.forEach(s=>{
      const chair = makeEntity("a-entity", {
        id: s.id,
        position: `${s.x} ${seatY} ${s.z}`,
        rotation: `0 ${s.r} 0`
      }, el);
      chair.setAttribute("scarlett-chair", "");
    });

    hudLog("Poker table (6-seat) built ✅");
  }
});

AFRAME.registerComponent("scarlett-chair", {
  init(){
    const el = this.el;
    const bodyMat = "color:#0e1016; metalness:0.6; roughness:0.35";
    const neonMat = "color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.6; opacity:0.95; transparent:true";

    makeEntity("a-cylinder",{radius:"0.38",height:"0.12",position:"0 0.06 0",material:bodyMat},el);
    makeEntity("a-cylinder",{radius:"0.06",height:"0.55",position:"0 0.34 0",material:bodyMat},el);
    makeEntity("a-box",{width:"0.70",height:"0.11",depth:"0.70",position:"0 0.59 0",material:bodyMat},el);
    makeEntity("a-box",{width:"0.70",height:"0.86",depth:"0.12",position:"0 1.06 -0.28",material:bodyMat},el);

    makeEntity("a-box",{width:"0.06",height:"0.34",depth:"0.06",position:"-0.30 1.28 -0.18",material:neonMat},el);
    makeEntity("a-box",{width:"0.06",height:"0.34",depth:"0.06",position:"0.30 1.28 -0.18",material:neonMat},el);

    makeEntity("a-ring",{
      "radius-inner":"0.20","radius-outer":"0.36",
      rotation:"-90 0 0", position:"0 0.02 0",
      material:"color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.55; transparent:true"
    }, el);
  }
});

/* ---------------------------
   8) Lobby (Real): 2× walls + deep pit + 8-seat round table + doors
---------------------------- */
AFRAME.registerComponent("scarlett-lobby", {
  init(){
    const el = this.el;

    // Circular floor
    const floor = makeEntity("a-circle", {
      radius:"22", rotation:"-90 0 0", position:"0 0 0",
      class:"teleportable",
      material:"color:#05070c; roughness:1.0; metalness:0.0"
    }, el);

    // 2× wall height cylinder
    makeEntity("a-cylinder", {
      radius:"22", height:"10", position:"0 5 0",
      material:"color:#0b0f14; roughness:0.95; metalness:0.05; side:double"
    }, el);

    // Brick-ish inner bands (visual)
    for (let i=0;i<4;i++){
      makeEntity("a-torus",{
        radius:"21.7","radius-tubular":"0.09",
        rotation:"-90 0 0",
        position:`0 ${1.2 + i*2.1} 0`,
        material:"color:#111827; roughness:0.9; metalness:0.05; opacity:0.35; transparent:true"
      }, el);
    }

    // Pillars + lights (bright)
    const pillarCount = 10;
    for (let i=0;i<pillarCount;i++){
      const a = (i/pillarCount) * Math.PI*2;
      const x = Math.cos(a)*18.5;
      const z = Math.sin(a)*18.5;

      const p = makeEntity("a-cylinder", {
        radius:"0.45", height:"9.5",
        position:`${x.toFixed(2)} 4.75 ${z.toFixed(2)}`,
        material:"color:#0b0f14; metalness:0.7; roughness:0.35"
      }, el);

      // neon wrap
      makeEntity("a-torus",{
        radius:"0.55","radius-tubular":"0.04",
        rotation:"90 0 0",
        position:`0 2.2 0`,
        material:"color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:2.3; opacity:0.8; transparent:true"
      }, p);

      makeEntity("a-torus",{
        radius:"0.55","radius-tubular":"0.04",
        rotation:"90 0 0",
        position:`0 6.2 0`,
        material:"color:#7b61ff; emissive:#7b61ff; emissiveIntensity:2.0; opacity:0.75; transparent:true"
      }, p);

      // light per pillar (your request)
      makeEntity("a-point-light", {
        intensity:"1.25", distance:"18",
        position:"0 6.6 0",
        color:"#9ff"
      }, p);
    }

    // Lighting base (strong)
    makeEntity("a-ambient-light", { intensity:"0.80", color:"#ffffff" }, el);
    makeEntity("a-directional-light", { intensity:"0.70", position:"-8 12 6", color:"#ffffff" }, el);

    // Deep center pit (no lid)
    const PIT_R = 8.0, PIT_D = 10.0, PIT_FY = -PIT_D;

    makeEntity("a-ring",{
      "radius-inner":(PIT_R+0.2).toFixed(2),
      "radius-outer":(PIT_R+0.95).toFixed(2),
      rotation:"-90 0 0", position:"0 0.03 0",
      material:"color:#0b0f14; metalness:0.7; roughness:0.35; opacity:0.98; transparent:true"
    }, el);

    makeEntity("a-cylinder",{
      radius:PIT_R.toFixed(2),
      height:PIT_D.toFixed(2),
      position:`0 ${(PIT_FY/2).toFixed(2)} 0`,
      material:"color:#05070c; roughness:1.0; metalness:0.0; side:double"
    }, el);

    makeEntity("a-circle",{
      radius:(PIT_R-0.4).toFixed(2),
      rotation:"-90 0 0",
      position:`0 ${PIT_FY.toFixed(2)} 0`,
      class:"teleportable",
      material:"color:#020308; roughness:1.0; metalness:0.0"
    }, el);

    makeEntity("a-ring",{
      "radius-inner":(PIT_R-0.9).toFixed(2),
      "radius-outer":(PIT_R-0.6).toFixed(2),
      rotation:"-90 0 0",
      position:`0 ${(PIT_FY+0.08).toFixed(2)} 0`,
      material:"color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.8; opacity:0.55; transparent:true"
    }, el);

    // 8-player “centerpiece” table down inside pit
    const centerpiece = makeEntity("a-entity",{ position:`0 ${PIT_FY.toFixed(2)} 0` }, el);
    centerpiece.setAttribute("scarlett-table8", "");

    // Door/Jumbotron portals (4 doors)
    // Targets are pads in other rooms.
    const portals = [
      { name:"POKER PIT", x:  0, z:-20.2, target:"pad_poker_safe" },
      { name:"STORE",     x: 20.2, z:  0, target:"pad_store_safe" },
      { name:"SCORPION",  x:  0, z: 20.2, target:"pad_poker_safe" },
      { name:"BACK",      x:-20.2, z:  0, target:"pad_poker_safe" },
    ];

    portals.forEach((p,i)=>{
      const door = makeEntity("a-entity",{ position:`${p.x} 0 ${p.z}` }, el);

      // door pad circle
      const ring = makeEntity("a-ring",{
        "radius-inner":"1.2","radius-outer":"1.55",
        rotation:"-90 0 0", position:"0 0.03 0",
        material:"color:#0f1116; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.7; transparent:true"
      }, door);
      ring.setAttribute("scarlett-portal", `target: ${p.target}`);

      // “jumbotron over door”
      const screen = makeEntity("a-plane",{
        width:"4.6", height:"2.6",
        position:"0 3.1 0.25",
        rotation:"0 180 0",
        material:"color:#080b12; emissive:#7b61ff; emissiveIntensity:0.22; opacity:0.95; transparent:true"
      }, door);

      makeEntity("a-text",{
        value:p.name, align:"center", color:"#9ff",
        width:"8", position:"0 0 0.01"
      }, screen);

      // small neon posts
      makeEntity("a-cylinder",{
        radius:"0.10", height:"2.6",
        position:"-2.4 1.3 0",
        material:"color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.6; opacity:0.85; transparent:true"
      }, door);

      makeEntity("a-cylinder",{
        radius:"0.10", height:"2.6",
        position:"2.4 1.3 0",
        material:"color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.85; transparent:true"
      }, door);
    });

    hudLog("Lobby created ✅");
    hudLog("Lobby upgraded ✅ (deep pit + heavy neon + bright lighting)");
  }
});

/* ---------------------------
   9) 8-seat round table (centerpiece)
---------------------------- */
AFRAME.registerComponent("scarlett-table8", {
  init(){
    const el = this.el;

    // base
    makeEntity("a-cylinder",{radius:"5.2",height:"0.25",position:"0 0.12 0",
      material:"color:#0b0f14; metalness:0.75; roughness:0.35"
    }, el);

    makeEntity("a-cylinder",{radius:"0.95",height:"1.15",position:"0 0.82 0",
      material:"color:#0b0f14; metalness:0.7; roughness:0.35"
    }, el);

    // big round top
    makeEntity("a-cylinder",{radius:"2.35",height:"0.22",position:"0 1.55 0",
      material:"color:#101827; metalness:0.18; roughness:0.55"
    }, el);

    // felt
    makeEntity("a-cylinder",{radius:"2.10",height:"0.06",position:"0 1.65 0",
      material:"color:#07111a; roughness:0.95; metalness:0.0"
    }, el);

    // neon edge
    makeEntity("a-torus",{
      radius:"2.38","radius-tubular":"0.03",
      rotation:"-90 0 0", position:"0 1.70 0",
      material:"color:#00e5ff; emissive:#00e5ff; emissiveIntensity:2.0; opacity:0.75; transparent:true"
    }, el);

    // 8 chairs in circle
    const seatR = 4.05;
    for (let i=0;i<8;i++){
      const a = (i/8)*Math.PI*2;
      const x = Math.cos(a)*seatR;
      const z = Math.sin(a)*seatR;
      const yaw = -THREE.MathUtils.radToDeg(a) + 90;

      const c = makeEntity("a-entity",{
        position:`${x.toFixed(2)} 0.22 ${z.toFixed(2)}`,
        rotation:`0 ${yaw.toFixed(0)} 0`
      }, el);
      c.setAttribute("scarlett-chair", "");
    }
  }
});

/* ---------------------------
   10) Poker Pit Room (6-seat oval + 5 bots + 1 seat for you + ninjas)
---------------------------- */
AFRAME.registerComponent("scarlett-room-poker", {
  init(){
    const el = this.el;

    // room floor
    makeEntity("a-circle",{radius:"18",rotation:"-90 0 0",position:"0 0 0",class:"teleportable",
      material:"color:#03050a; roughness:1.0; metalness:0.0"
    }, el);

    // room walls
    makeEntity("a-cylinder",{radius:"18",height:"8",position:"0 4 0",
      material:"color:#0b0f14; roughness:0.95; metalness:0.05; side:double"
    }, el);

    // lighting
    makeEntity("a-ambient-light",{intensity:"0.85",color:"#ffffff"}, el);
    makeEntity("a-directional-light",{intensity:"0.65",position:"6 10 -6",color:"#ffffff"}, el);

    // center table
    const table = makeEntity("a-entity",{position:"0 0 0"}, el);
    table.setAttribute("scarlett-table6","");

    // Reserve front seat marker (your seat)
    const marker = makeEntity("a-ring",{
      "radius-inner":"0.22","radius-outer":"0.36",
      rotation:"-90 0 0", position:"0 0.03 3.35",
      material:"color:#00e5ff; emissive:#00e5ff; emissiveIntensity:1.0; opacity:0.65; transparent:true"
    }, el);

    // Bots: 5 seated (skip seat_front)
    const botsRoot = makeEntity("a-entity",{id:"botsRoot"}, el);

    const botSeats = ["seat_back","seat_L1","seat_L2","seat_R1","seat_R2"];
    botSeats.forEach((sid,idx)=>{
      const seat = $(sid);
      // seat might not exist instantly; wait a beat
      setTimeout(()=>{
        const s = $(sid);
        if (!s) return;

        const pos = s.object3D.getWorldPosition(new THREE.Vector3());
        const bot = makeEntity("a-entity",{position:`${pos.x.toFixed(2)} 0.22 ${pos.z.toFixed(2)}`}, botsRoot);

        // use your avatar files (best guesses)
        const choices = [
          "/SVR/assets/avatars/male.glb",
          "/SVR/assets/avatars/female.glb",
          "/SVR/assets/avatars/ninja.glb",
          "/SVR/assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb"
        ];
        const src = choices[idx % choices.length];
        makeAvatar(bot, src, "0 0 0", "0 180 0", "1.0 1.0 1.0");
      }, 250);
    });

    // Ninja displays on pedestals
    const disp = makeEntity("a-entity",{position:"-7 0 2"}, el);
    makeEntity("a-cylinder",{radius:"0.9",height:"0.22",position:"0 0.11 0",material:"color:#0b0f14; metalness:0.7; roughness:0.35"}, disp);
    makeEntity("a-ring",{ "radius-inner":"0.55","radius-outer":"0.82",rotation:"-90 0 0",position:"0 0.12 0",
      material:"color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.4; opacity:0.55; transparent:true"
    }, disp);
    makeAvatar(disp, "/SVR/assets/avatars/ninja.glb", "0 0.22 0", "0 180 0", "1.1 1.1 1.1");

    const disp2 = makeEntity("a-entity",{position:"-7 0 -2"}, el);
    makeEntity("a-cylinder",{radius:"0.9",height:"0.22",position:"0 0.11 0",material:"color:#0b0f14; metalness:0.7; roughness:0.35"}, disp2);
    makeEntity("a-ring",{ "radius-inner":"0.55","radius-outer":"0.82",rotation:"-90 0 0",position:"0 0.12 0",
      material:"color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.55; transparent:true"
    }, disp2);
    makeAvatar(disp2, "/SVR/assets/avatars/combat_ninja_inspired_by_jin_roh_wolf_brigade.glb", "0 0.22 0", "0 180 0", "1.1 1.1 1.1");

    // Back-to-lobby portal in room
    const back = makeEntity("a-ring",{
      "radius-inner":"1.05","radius-outer":"1.35",
      rotation:"-90 0 0", position:"0 0.03 15.5",
      material:"color:#0f1116; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.7; transparent:true"
    }, el);
    back.setAttribute("scarlett-portal", "target: pad_lobby_safe");

    makeEntity("a-text",{value:"BACK TO LOBBY",align:"center",color:"#9ff",width:"8",position:"-2.2 1.6 15.2"}, el);

    hudLog("Poker room built ✅ (6-seat oval + 5 bots + your seat)");
  }
});

/* ---------------------------
   11) Store Room + Balcony
---------------------------- */
AFRAME.registerComponent("scarlett-room-store", {
  init(){
    const el = this.el;

    makeEntity("a-circle",{radius:"16",rotation:"-90 0 0",position:"0 0 0",class:"teleportable",
      material:"color:#05070c; roughness:1.0; metalness:0.0"
    }, el);

    makeEntity("a-cylinder",{radius:"16",height:"8",position:"0 4 0",
      material:"color:#0b0f14; roughness:0.95; metalness:0.05; side:double"
    }, el);

    // lighting
    makeEntity("a-ambient-light",{intensity:"0.95",color:"#ffffff"}, el);
    makeEntity("a-directional-light",{intensity:"0.60",position:"-6 10 6",color:"#ffffff"}, el);

    // balcony (square-ish)
    const balc = makeEntity("a-box",{
      width:"18", height:"0.25", depth:"10",
      position:"0 3.2 -2",
      material:"color:#0b0f14; metalness:0.5; roughness:0.5"
    }, el);

    // balcony rail
    makeEntity("a-ring",{
      "radius-inner":"6.0","radius-outer":"6.2",
      rotation:"-90 0 0", position:"0 3.35 -2",
      material:"color:#7b61ff; emissive:#7b61ff; emissiveIntensity:1.2; opacity:0.45; transparent:true"
    }, el);

    // Store sign + display shelves
    makeEntity("a-text",{value:"SCARLETT STORE",align:"center",color:"#9ff",width:"14",position:"-3 6.5 -14"}, el);

    for (let i=0;i<6;i++){
      const z = -10 + i*3.3;
      makeEntity("a-box",{width:"2.4",height:"1.6",depth:"0.35",position:"-12 1.0 "+z,
        material:"color:#111827; emissive:#2bd6ff; emissiveIntensity:0.08; opacity:0.95; transparent:true"
      }, el);
      makeEntity("a-box",{width:"2.4",height:"1.6",depth:"0.35",position:"12 1.0 "+z,
        material:"color:#111827; emissive:#7b61ff; emissiveIntensity:0.08; opacity:0.95; transparent:true"
      }, el);
    }

    // Back portal
    const back = makeEntity("a-ring",{
      "radius-inner":"1.05","radius-outer":"1.35",
      rotation:"-90 0 0", position:"0 0.03 13.5",
      material:"color:#0f1116; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.7; transparent:true"
    }, el);
    back.setAttribute("scarlett-portal", "target: pad_lobby_safe");

    makeEntity("a-text",{value:"BACK TO LOBBY",align:"center",color:"#9ff",width:"8",position:"-2.2 1.6 13.2"}, el);

    hudLog("Store room built ✅ (displays + balcony)");
  }
});

/* ---------------------------
   12) Spawn Pads
---------------------------- */
function makeSpawnPad(parent, {id, position, rotation="0 0 0", visible=false}){
  const pad = makeEntity("a-entity",{id, position, rotation}, parent);

  // invisible anchor ring (optional)
  const ring = makeEntity("a-ring",{
    "radius-inner":"0.40","radius-outer":"0.55",
    rotation:"-90 0 0", position:"0 0.03 0",
    material:"color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:0.9; opacity: visible ? 0.55 : 0.0; transparent:true"
  }, pad);
  return pad;
}

/* ---------------------------
   13) WORLD BOOT (this is the part you were missing)
---------------------------- */
AFRAME.registerComponent("scarlett-world", {
  init(){
    hudLog("A-FRAME loaded ✅");
    hudLog("Scarlett1 booting…");

    const scene = this.el.sceneEl;
    const world = $("worldRoot");
    if (!world) { hudLog("ERR: worldRoot missing"); return; }

    // Attach core systems
    scene.setAttribute("scarlett-vr-eye-fix", "");
    scene.setAttribute("scarlett-locomotion", "moveSpeed:2.2; snapDeg:22.5;");
    scene.setAttribute("scarlett-teleport", "");
    scene.setAttribute("scarlett-watch", "");

    // Build lobby
    const lobby = makeEntity("a-entity", { id:"roomLobby", position:"0 0 0" }, world);
    lobby.setAttribute("scarlett-lobby", "");

    // Build poker room (placed far away)
    const pokerRoom = makeEntity("a-entity", { id:"roomPoker", position:"0 0 -120" }, world);
    pokerRoom.setAttribute("scarlett-room-poker", "");

    // Build store room (placed far away)
    const storeRoom = makeEntity("a-entity", { id:"roomStore", position:"120 0 0" }, world);
    storeRoom.setAttribute("scarlett-room-store", "");

    // Spawn pads (safe)
    makeSpawnPad(world, { id:"pad_lobby_safe", position:"0 0 18", rotation:"0 180 0", visible:false });
    makeSpawnPad(world, { id:"pad_poker_safe", position:"0 0 -105", rotation:"0 0 0", visible:false });
    makeSpawnPad(world, { id:"pad_store_safe", position:"105 0 0", rotation:"0 -90 0", visible:false });

    // Spawn player at lobby safe pad
    const rig = $("rig");
    const p = $("pad_lobby_safe").object3D.position;
    rig.object3D.position.x = p.x;
    rig.object3D.position.z = p.z;

    hudLog("Spawned ✅ -> pad_lobby_safe (default)");
  }
});
