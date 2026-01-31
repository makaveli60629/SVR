(function () {
  function log(m){ if(window.hudLog) hudLog(m); }
  function top(m){ if(window.hudSetTop) hudSetTop(m); }

  const MODES = ["lobby","tables","store","balcony"];

  function setVisible(id, v){
    const el = document.getElementById(id);
    if(el) el.setAttribute("visible", v);
  }

  function setMode(mode){
    if(!MODES.includes(mode)) mode="lobby";

    setVisible("lobbyRoot", mode==="lobby");
    setVisible("pitRoot", mode==="tables");
    setVisible("storeRoot", mode==="store");
    setVisible("balconyRoot", mode==="balcony");

    top("Mode: " + mode.toUpperCase());
    log("Switched ✅ " + mode);
  }

  window.gotoLobby   = ()=>setMode("lobby");
  window.gotoTables  = ()=>setMode("tables");
  window.gotoStore   = ()=>setMode("store");
  window.gotoBalcony = ()=>setMode("balcony");

  // XR locomotion (left stick move, right stick turn)
  AFRAME.registerComponent("svr-xr-locomotion", {
    schema:{ speed:{default:2.35}, turn:{default:2.10}, dz:{default:0.12} },
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

      // Turn yaw (invert for natural right)
      if(turn!==0) this.el.object3D.rotation.y += (-turn) * this.data.turn * ms;

      if(mx===0 && my===0) return;

      const cam=document.getElementById("camera");
      if(!cam) return;

      cam.object3D.getWorldDirection(this.f);
      this.f.y=0; this.f.normalize();
      this.rt.crossVectors(this.f,this.u).normalize();

      // forward/back = my (natural), strafe = -mx (fix left/right inversion)
      this.el.object3D.position.addScaledVector(this.f, my * this.data.speed * ms);
      this.el.object3D.position.addScaledVector(this.rt, -mx * this.data.speed * ms);
    }
  });

  // Teleport: aim right laser at floor, trigger to jump
  AFRAME.registerComponent("svr-teleport-aim", {
    init: function () {
      this.rig = document.getElementById("rig");
      this.hand = this.el;

      this.target = document.createElement("a-ring");
      this.target.setAttribute("id", "teleportTarget");
      this.target.setAttribute("radius-inner", "0.18");
      this.target.setAttribute("radius-outer", "0.28");
      this.target.setAttribute("rotation", "-90 0 0");
      this.target.setAttribute("position", "999 999 999");
      this.target.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.4; opacity:0.9; transparent:true");
      this.el.sceneEl.appendChild(this.target);

      this.hitOK = false;
      this.hitPos = new THREE.Vector3();

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
      const floorHit = hits.find(h => h.object && h.object.el && h.object.el.classList && h.object.el.classList.contains("floor"));

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

  // Trigger-to-click: right trigger clicks first ".clickable" hit
  function enableTriggerClick(){
    const rightHand = document.getElementById("rightHand");
    if (!rightHand) return;

    rightHand.addEventListener("triggerdown", () => {
      const rc = rightHand.components.raycaster;
      if (!rc) return;
      const hits = rc.intersections || [];
      if (!hits.length) return;

      const clickableHit = hits.find(h => h.object && h.object.el && h.object.el.classList && h.object.el.classList.contains("clickable"));
      if (!clickableHit) return;

      const targetEl = clickableHit.object.el;
      targetEl.emit("click");
      log("Clicked ✅ " + (targetEl.id || targetEl.tagName));
    });

    log("Trigger-click enabled ✅ (aim at button → trigger)");
  }

  // Seat snap in tables mode: press A to snap to reserved seat
  function enableSeatSnap() {
    const rig = document.getElementById("rig");
    const rightHand = document.getElementById("rightHand");
    if (!rig || !rightHand) return;

    function snapToPlayerSeat() {
      const seat = document.getElementById("seat_front");
      if (!seat) { log("Seat not found yet…"); return; }
      const p = seat.object3D.position;
      rig.setAttribute("position", `${p.x.toFixed(3)} 0 ${(p.z + 0.30).toFixed(3)}`);
      log("Seated ✅ (reserved seat)");
    }

    rightHand.addEventListener("abuttondown", snapToPlayerSeat);
    log("Seat snap ✅ (press A in tables)");
  }

  function wireHTMLButtons(){
    const bLobby = document.getElementById("btnLobby");
    const bPit   = document.getElementById("btnPit");
    const bStore = document.getElementById("btnStore");
    const bBal   = document.getElementById("btnBalcony");
    if(bLobby) bLobby.addEventListener("click", window.gotoLobby);
    if(bPit)   bPit.addEventListener("click", window.gotoTables);
    if(bStore) bStore.addEventListener("click", window.gotoStore);
    if(bBal)   bBal.addEventListener("click", window.gotoBalcony);
  }

  function boot(){
    const scene = document.querySelector("a-scene");
    const rig = document.getElementById("rig");
    const rightHand = document.getElementById("rightHand");

    if(!scene || !rig || !rightHand){
      setTimeout(boot, 60);
      return;
    }

    top("Scarlett booting…");
    log("Main loaded ✅");
    setMode("lobby");
    wireHTMLButtons();

    scene.addEventListener("enter-vr", () => {
      rig.setAttribute("svr-xr-locomotion", "");
      rightHand.setAttribute("svr-teleport-aim", "");
      enableTriggerClick();
      enableSeatSnap();
      log("XR ready ✅");
    });
  }

  window.addEventListener("DOMContentLoaded", boot);
})();