(function () {

  function log(m){ if(window.hudLog) hudLog(m); }
  function top(m){ if(window.hudSetTop) hudSetTop(m); }

  // ---------------- MODE TOGGLE ----------------
  function setMode(mode, pit, lobby, btn, label) {
    const isPit = mode === "pit";
    pit.setAttribute("visible", isPit);
    lobby.setAttribute("visible", !isPit);

    if (btn) btn.textContent = isPit ? "Back To Lobby" : "Enter Poker Pit";
    if (label) label.setAttribute("value", isPit ? "BACK TO LOBBY" : "ENTER POKER PIT");

    const panel = document.getElementById("vrPitPanel");
    if (panel) panel.setAttribute("visible", !isPit);

    const pads = document.getElementById("teleportPads");
    if (pads) pads.setAttribute("visible", isPit);

    top(isPit ? "Poker Pit ✅" : "Lobby ✅");
  }

  // ---------------- XR LOCOMOTION ----------------
  AFRAME.registerComponent("svr-xr-locomotion", {
    schema:{ speed:{default:2.1}, turn:{default:1.9}, dz:{default:0.12} },

    init:function(){
      this.l=[0,0]; this.r=[0,0];
      this.f=new THREE.Vector3(); this.rt=new THREE.Vector3(); this.u=new THREE.Vector3(0,1,0);

      const L=document.getElementById("leftHand");
      const R=document.getElementById("rightHand");

      if(L) L.addEventListener("axismove",e=>{ const a=e.detail.axis||[]; this.l=[a[2]||0,a[3]||0];});
      if(R) R.addEventListener("axismove",e=>{ const a=e.detail.axis||[]; this.r=[a[2]||0,a[3]||0];});

      log("XR locomotion ready ✅");
    },

    tick:function(t,dt){
      const s=this.el.sceneEl;
      if(!s||!s.is("vr-mode"))return;

      const ms=(dt||16)/1000, dz=this.data.dz;
      let mx=this.l[0], my=this.l[1], turn=this.r[0];

      if(Math.abs(mx)<dz)mx=0;
      if(Math.abs(my)<dz)my=0;
      if(Math.abs(turn)<dz)turn=0;

      if(turn!==0) this.el.object3D.rotation.y += (-turn)*this.data.turn*ms;

      if(mx===0&&my===0)return;

      const cam=document.getElementById("camera");
      cam.object3D.getWorldDirection(this.f);
      this.f.y=0; this.f.normalize();
      this.rt.crossVectors(this.f,this.u).normalize();

      this.el.object3D.position.addScaledVector(this.f, my*this.data.speed*ms);
      this.el.object3D.position.addScaledVector(this.rt, -mx*this.data.speed*ms);
    }
  });

  // ---------------- TELEPORT PADS ----------------
  AFRAME.registerComponent("svr-teleport-pad",{
    schema:{x:{},y:{},z:{}},
    init:function(){
      this.el.classList.add("clickable");
      this.el.addEventListener("click",()=>{
        const rig=document.getElementById("rig");
        rig.setAttribute("position",`${this.data.x} ${this.data.y} ${this.data.z}`);
        log("Teleported ✅");
      });
    }
  });

  function buildPads(scene){
    if(document.getElementById("teleportPads"))return;
    const pads=document.createElement("a-entity");
    pads.id="teleportPads"; pads.setAttribute("visible","false");

    [
      {x:0,z:6},{x:0,z:-6},{x:6,z:0},{x:-6,z:0},{x:0,z:3.8}
    ].forEach(p=>{
      const r=document.createElement("a-ring");
      r.setAttribute("radius-inner","0.35");
      r.setAttribute("radius-outer","0.55");
      r.setAttribute("rotation","-90 0 0");
      r.setAttribute("position",`${p.x} 0.02 ${p.z}`);
      r.setAttribute("material","color:#2bd6ff; emissive:#2bd6ff; emissiveIntensity:1.2; opacity:0.85");
      r.setAttribute("svr-teleport-pad",`x:${p.x};y:0;z:${p.z}`);
      pads.appendChild(r);
    });

    scene.appendChild(pads);
    log("Teleport pads ready ✅");
  }

  // ---------------- VR PANEL ----------------
  function makePanel(cam,pit,lobby,btn){
    if(document.getElementById("vrPitPanel"))return;
    const p=document.createElement("a-entity");
    p.id="vrPitPanel"; p.setAttribute("position","0 -0.35 -1.25");

    const bg=document.createElement("a-plane");
    bg.setAttribute("width","1.05"); bg.setAttribute("height","0.25");
    bg.setAttribute("material","color:#0b0f14; opacity:0.65");
    p.appendChild(bg);

    const t=document.createElement("a-text");
    t.setAttribute("value","ENTER POKER PIT");
    t.setAttribute("align","center");
    t.setAttribute("color","#9ff");
    t.setAttribute("width","2.6");
    t.setAttribute("position","0 0 0.01");
    p.appendChild(t);

    p.classList.add("clickable");
    p.addEventListener("click",()=>setMode(
      pit.getAttribute("visible")?"lobby":"pit", pit, lobby, btn, t
    ));

    cam.appendChild(p);
  }

  // ---------------- BOOT ----------------
  function boot(){
    const scene=document.querySelector("a-scene");
    const pit=document.getElementById("pitRoot");
    const lobby=document.getElementById("lobbyRoot");
    const btn=document.getElementById("btnPit");
    const rig=document.getElementById("rig");
    const cam=document.getElementById("camera");

    if(!scene||!pit||!lobby||!rig||!cam){ setTimeout(boot,60); return; }

    top("Scarlett VR Booting…");
    scene.addEventListener("loaded",()=>{
      buildPads(scene);
      setMode("lobby",pit,lobby,btn,null);

      if(btn) btn.onclick=()=>setMode(
        pit.getAttribute("visible")?"lobby":"pit", pit, lobby, btn, null
      );

      scene.addEventListener("enter-vr",()=>{
        rig.setAttribute("svr-xr-locomotion","");
        makePanel(cam,pit,lobby,btn);
        log("XR ready ✅");
      });
    });
  }

  window.addEventListener("DOMContentLoaded", boot);
})();
