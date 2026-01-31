(function () {
  const LABEL_LOBBY = "Lobby ✅";
  const LABEL_TABLES = "Poker Tables ✅"; // renamed from "Pit"

  function log(m){ if(window.hudLog) hudLog(m); }
  function top(m){ if(window.hudSetTop) hudSetTop(m); }

  // ---------------- MODE ----------------
  function setMode(mode, tablesRoot, lobbyRoot, btn) {
    const inTables = mode === "tables";
    tablesRoot.setAttribute("visible", inTables);
    lobbyRoot.setAttribute("visible", !inTables);
    if (btn) btn.textContent = inTables ? "Back To Lobby" : "Enter Poker Tables";
    top(inTables ? LABEL_TABLES : LABEL_LOBBY);
    log(inTables ? "Mode: TABLES" : "Mode: LOBBY");
  }

  function toggleMode(tablesRoot, lobbyRoot, btn) {
    const inTables = (tablesRoot.getAttribute("visible") === true || tablesRoot.getAttribute("visible") === "true");
    setMode(inTables ? "lobby" : "tables", tablesRoot, lobbyRoot, btn);
  }

  // ---------------- XR LOCOMOTION ----------------
  AFRAME.registerComponent("svr-xr-locomotion", {
    schema:{ speed:{default:2.25}, turn:{default:2.05}, dz:{default:0.12} },

    init:function(){
      this.l=[0,0]; this.r=[0,0];
      this.f=new THREE.Vector3(); this.rt=new THREE.Vector3(); this.u=new THREE.Vector3(0,1,0);

      const L=document.getElementById("leftHand");
      const R=document.getElementById("rightHand");

      if(L) L.addEventListener("axismove",e=>{
        const a=e.detail.axis||[];
        this.l=[a[2]||0, a[3]||0];
      });

      if(R) R.addEventListener("axismove",e=>{
        const a=e.detail.axis||[];
        this.r=[a[2]||0, a[3]||0];
      });

      log("Move: LEFT stick | Turn: RIGHT stick ✅");
    },

    tick:function(t,dt){
      const s=this.el.sceneEl;
      if(!s || !s.is("vr-mode")) return;

      const ms=(dt||16)/1000, dz=this.data.dz;
      let mx=this.l[0], my=this.l[1], turn=this.r[0];

      if(Math.abs(mx)<dz) mx=0;
      if(Math.abs(my)<dz) my=0;
      if(Math.abs(turn)<dz) turn=0;

      // Turn (yaw)
      if(turn!==0) this.el.object3D.rotation.y += (-turn) * this.data.turn * ms;

      // Move
      if(mx===0 && my===0) return;

      const cam=document.getElementById("camera");
      if(!cam) return;

      cam.object3D.getWorldDirection(this.f);
      this.f.y=0; this.f.normalize();
      this.rt.crossVectors(this.f,this.u).normalize();

      // Forward/back
      this.el.object3D.position.addScaledVector(this.f, my * this.data.speed * ms);

      // Strafe (fixed: left is left, right is right)
      this.el.object3D.position.addScaledVector(this.rt, -mx * this.data.speed * ms);
    }
  });

  // ---------------- TELEPORT AIM (RIGHT TRIGGER) ----------------
  AFRAME.registerComponent("svr-teleport-aim", {
    init: function () {
      this.rig = document.getElementById("rig");
      this.hand = this.el;

      // Target ring follows ray hit point on the floor
      this.target = document.createElement("a-ring");
      this.target.setAttribute("id", "teleportTarget");
      this.target.setAttribute("radius-inner", "0.18");
      this.target.setAttribute("radius-outer", "0.28");
      this.target.setAttribute("rotation", "-90 0 0");
      this.target.setAttribute("position", "999 999 999"); // hidden
      this.target.setAttribute("material",
        "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.9; transparent:true");
      this.el.sceneEl.appendChild(this.target);

      this.hitOK = false;
      this.hitPos = new THREE.Vector3();

      // Teleport on trigger down
      this.hand.addEventListener("triggerdown", () => {
        if (!this.hitOK || !this.rig) return;
        this.rig.setAttribute("position", `${this.hitPos.x.toFixed(3)} 0 ${this.hitPos.z.toFixed(3)}`);
        log("Teleported ✅");
      });

      log("Teleport: aim RIGHT laser at floor → trigger ✅");
    },

    tick: function () {
      const rc = this.hand.components.raycaster;
      if (!rc) return;

      const hits = rc.intersections || [];
      const floorHit = hits.find(h => h.object && h.object.el && h.object.el.classList.contains("floor"));

      if (floorHit) {
        this.hitOK = true;
        this.hitPos.copy(floorHit.point);
        this.target.setAttribute("position", `${this.hitPos.x} 0.02 ${this.hitPos.z}`);
      } else {
        this.hitOK = false;
        this.target.setAttribute("position", "999 999 999");
      }
    }
  });

  // ---------------- IN-WORLD BUTTON (NOT ON FACE) ----------------
  function createLobbyButton(scene, tablesRoot, lobbyRoot, btn) {
    if (document.getElementById("lobbyButton3D")) return;

    const b = document.createElement("a-entity");
    b.setAttribute("id", "lobbyButton3D");
    b.setAttribute("position", "0 1.45 -1.9");
    b.setAttribute("rotation", "0 0 0");
    b.classList.add("clickable");

    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "1.35");
    bg.setAttribute("height", "0.30");
    bg.setAttribute("material", "color:#0b0f14; opacity:0.78; transparent:true");
    b.appendChild(bg);

    const txt = document.createElement("a-text");
    txt.setAttribute("value", "ENTER POKER TABLES");
    txt.setAttribute("align", "center");
    txt.setAttribute("color", "#9ff");
    txt.setAttribute("width", "3.2");
    txt.setAttribute("position", "0 0 0.01");
    b.appendChild(txt);

    const outline = document.createElement("a-ring");
    outline.setAttribute("radius-inner", "0.62");
    outline.setAttribute("radius-outer", "0.66");
    outline.setAttribute("position", "0 0 0.008");
    outline.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.25; opacity:0.7; transparent:true");
    b.appendChild(outline);

    // Make it laser-clickable by providing a click fallback:
    // If you’re not using cursor components, A-Frame “click” may not fire automatically.
    // We'll also listen for triggerdown while pointing at it using raycaster intersections.
    b.addEventListener("click", () => toggleMode(tablesRoot, lobbyRoot, btn));

    scene.appendChild(b);
    log("3D button placed ✅ (near lobby)");
  }

  // ---------------- SEAT SNAP (A BUTTON) ----------------
  function enableSeatSnap() {
    const rig = document.getElementById("rig");
    const rightHand = document.getElementById("rightHand");
    if (!rig || !rightHand) return;

    function snapToPlayerSeat() {
      const seat = document.getElementById("seat_front"); // reserved seat id
      if (!seat) { log("Seat not found yet…"); return; }

      const p = seat.object3D.position;

      // sit slightly behind the seat so camera is centered at table
      rig.setAttribute("position", `${p.x.toFixed(3)} 0 ${(p.z + 0.18).toFixed(3)}`);
      log("Seated ✅ (your reserved seat)");
    }

    // Oculus A button event (right controller)
    rightHand.addEventListener("abuttondown", snapToPlayerSeat);

    // Optional: trigger seat snap if near marker
    rightHand.addEventListener("triggerdown", () => {
      const marker = document.getElementById("playerSeatMarker");
      if (!marker) return;

      const rp = rig.object3D.position;
      const mp = marker.object3D.position;
      const dx = rp.x - mp.x, dz = rp.z - mp.z;
      const dist = Math.sqrt(dx*dx + dz*dz);

      if (dist < 1.2) snapToPlayerSeat();
    });

    log("Seat snap ready ✅ (press A near your seat)");
  }

  // ---------------- BOOT ----------------
  function boot(){
    const scene = document.querySelector("a-scene");
    const tablesRoot = document.getElementById("pitRoot");   // we keep id pitRoot but conceptually “tables”
    const lobbyRoot  = document.getElementById("lobbyRoot");
    const btn        = document.getElementById("btnPit");
    const rig        = document.getElementById("rig");
    const rightHand  = document.getElementById("rightHand");

    if(!scene || !tablesRoot || !lobbyRoot || !rig || !rightHand){
      setTimeout(boot, 60);
      return;
    }

    top("Scarlett VR Booting…");
    log("A-Frame loaded ✅");

    scene.addEventListener("loaded", () => {
      setMode("lobby", tablesRoot, lobbyRoot, btn);

      // Android/desktop button (if present)
      if (btn) btn.onclick = () => toggleMode(tablesRoot, lobbyRoot, btn);

      scene.addEventListener("enter-vr", () => {
        // Enable movement + teleport only after VR enters (Quest-safe)
        rig.setAttribute("svr-xr-locomotion", "");
        rightHand.setAttribute("svr-teleport-aim", "");

        // Put the 3D button into the WORLD (not camera)
        createLobbyButton(scene, tablesRoot, lobbyRoot, btn);

        // Seat snap
        enableSeatSnap();

        log("XR ready ✅");
        top(LABEL_LOBBY);
      });
    });
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
