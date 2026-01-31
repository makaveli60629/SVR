(function () {
  const LABEL_LOBBY = "Lobby ✅";
  const LABEL_TABLES = "Poker Tables ✅"; // rename from pit if you want

  function log(m){ if(window.hudLog) hudLog(m); }
  function top(m){ if(window.hudSetTop) hudSetTop(m); }

  // ---------------- MODE ----------------
  function setMode(mode, pit, lobby, btn) {
    const isTables = mode === "tables";
    pit.setAttribute("visible", isTables);
    lobby.setAttribute("visible", !isTables);
    if (btn) btn.textContent = isTables ? "Back To Lobby" : "Enter Poker Tables";
    top(isTables ? LABEL_TABLES : LABEL_LOBBY);
    log(isTables ? "Tables ON" : "Lobby ON");
  }

  function toggleMode(pit, lobby, btn) {
    const isTables = pit.getAttribute("visible") === true || pit.getAttribute("visible") === "true";
    setMode(isTables ? "lobby" : "tables", pit, lobby, btn);
  }

  // ---------------- XR LOCOMOTION ----------------
  AFRAME.registerComponent("svr-xr-locomotion", {
    schema:{ speed:{default:2.2}, turn:{default:2.0}, dz:{default:0.12} },
    init:function(){
      this.l=[0,0]; this.r=[0,0];
      this.f=new THREE.Vector3(); this.rt=new THREE.Vector3(); this.u=new THREE.Vector3(0,1,0);

      const L=document.getElementById("leftHand");
      const R=document.getElementById("rightHand");

      if(L) L.addEventListener("axismove",e=>{ const a=e.detail.axis||[]; this.l=[a[2]||0,a[3]||0]; });
      if(R) R.addEventListener("axismove",e=>{ const a=e.detail.axis||[]; this.r=[a[2]||0,a[3]||0]; });

      log("Move: LEFT stick. Turn: RIGHT stick.");
    },
    tick:function(t,dt){
      const s=this.el.sceneEl;
      if(!s || !s.is("vr-mode")) return;

      const ms=(dt||16)/1000, dz=this.data.dz;
      let mx=this.l[0], my=this.l[1], turn=this.r[0];

      if(Math.abs(mx)<dz) mx=0;
      if(Math.abs(my)<dz) my=0;
      if(Math.abs(turn)<dz) turn=0;

      // Smooth yaw
      if(turn!==0) this.el.object3D.rotation.y += (-turn)*this.data.turn*ms;

      if(mx===0 && my===0) return;

      const cam=document.getElementById("camera");
      if(!cam) return;

      cam.object3D.getWorldDirection(this.f);
      this.f.y=0; this.f.normalize();
      this.rt.crossVectors(this.f,this.u).normalize();

      // Forward/back correct
      this.el.object3D.position.addScaledVector(this.f, my*this.data.speed*ms);

      // ✅ Strafe fixed: left is left, right is right
      this.el.object3D.position.addScaledVector(this.rt, -mx*this.data.speed*ms);
    }
  });

  // ---------------- TELEPORT AIM (RIGHT TRIGGER) ----------------
  AFRAME.registerComponent("svr-teleport-aim", {
    init: function () {
      this.rig = document.getElementById("rig");
      this.hand = this.el;

      // Target ring that follows the ray hit point
      this.target = document.createElement("a-ring");
      this.target.setAttribute("id", "teleportTarget");
      this.target.setAttribute("radius-inner", "0.18");
      this.target.setAttribute("radius-outer", "0.28");
      this.target.setAttribute("rotation", "-90 0 0");
      this.target.setAttribute("position", "999 999 999"); // hidden
      this.target.setAttribute("material",
        "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.9; transparent:true");
      this.target.classList.add("clickable"); // harmless
      this.el.sceneEl.appendChild(this.target);

      this.hitOK = false;
      this.hitPos = new THREE.Vector3();

      // Teleport on trigger
      this.hand.addEventListener("triggerdown", () => {
        if (!this.hitOK || !this.rig) return;
        // Keep same Y (0) so you don't fall through
        this.rig.setAttribute("position", `${this.hitPos.x.toFixed(3)} 0 ${this.hitPos.z.toFixed(3)}`);
        log("Teleported ✅");
      });

      log("Teleport: aim with RIGHT laser, press trigger.");
    },

    tick: function () {
      const rc = this.hand.components.raycaster;
      if (!rc) return;

      // Intersections with floor class
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

  // ---------------- IN-WORLD LOBBY BUTTON (NOT ON FACE) ----------------
  function createLobbyButton(scene, pit, lobby, btn) {
    if (document.getElementById("lobbyButton3D")) return;

    const b = document.createElement("a-entity");
    b.setAttribute("id", "lobbyButton3D");
    // Place near your lobby beacon (you can adjust)
    b.setAttribute("position", "0 1.35 -1.6");
    b.setAttribute("rotation", "0 0 0");
    b.classList.add("clickable");

    const bg = document.createElement("a-plane");
    bg.setAttribute("width", "1.25");
    bg.setAttribute("height", "0.28");
    bg.setAttribute("material", "color:#0b0f14; opacity:0.75; transparent:true");
    b.appendChild(bg);

    const txt = document.createElement("a-text");
    txt.setAttribute("value", "ENTER POKER TABLES");
    txt.setAttribute("align", "center");
    txt.setAttribute("color", "#9ff");
    txt.setAttribute("width", "3.0");
    txt.setAttribute("position", "0 0 0.01");
    b.appendChild(txt);

    b.addEventListener("click", () => toggleMode(pit, lobby, btn));

    // Add a neon outline
    const outline = document.createElement("a-ring");
    outline.setAttribute("radius-inner", "0.60");
    outline.setAttribute("radius-outer", "0.64");
    outline.setAttribute("rotation", "0 0 0");
    outline.setAttribute("position", "0 0 0.005");
    outline.setAttribute("material", "color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.7; transparent:true");
    b.appendChild(outline);

    scene.appendChild(b);
    log("3D Lobby button ready ✅ (laser-click it)");
  }

  // ---------------- BOOT ----------------
  function boot(){
    const scene=document.querySelector("a-scene");
    const pit=document.getElementById("pitRoot");
    const lobby=document.getElementById("lobbyRoot");
    const btn=document.getElementById("btnPit");
    const rig=document.getElementById("rig");
    const rightHand=document.getElementById("rightHand");

    if(!scene||!pit||!lobby||!rig||!rightHand){ setTimeout(boot,60); return; }

    top("Scarlett VR Booting…");
    log("A-Frame loaded ✅");

    scene.addEventListener("loaded",()=>{
      setMode("lobby", pit, lobby, btn);

      // Android button
      if(btn) btn.onclick=()=>toggleMode(pit,lobby,btn);

      scene.addEventListener("enter-vr",()=>{
        // Enable locomotion AFTER VR enters
        rig.setAttribute("svr-xr-locomotion","");

        // Enable teleport aim on RIGHT hand
        rightHand.setAttribute("svr-teleport-aim","");

        // Create a real in-world lobby button
        createLobbyButton(scene, pit, lobby, btn);

        log("XR ready ✅");
      });
    });
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
