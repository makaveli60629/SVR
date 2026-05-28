(function(){
  "use strict";

  const PHASE = "PHASE-252-ORIGINAL-LOBBY-STORE-HUB-EMBED";

  const items = [
    "Avatar Watch Skin",
    "Premium Chip Set",
    "Card Back Pack",
    "Lobby Table Theme",
    "Event Drop Pass"
  ];

  function makeDomHub(){
    if(document.getElementById("svr-phase252-store-hub")) return;

    const hub = document.createElement("section");
    hub.id = "svr-phase252-store-hub";
    hub.innerHTML = `
      <style>
        #svr-phase252-store-hub{
          position:fixed;
          right:14px;
          bottom:14px;
          z-index:30;
          width:min(360px,calc(100vw - 28px));
          color:white;
          font:14px system-ui,Segoe UI,Arial;
          background:rgba(5,2,15,.72);
          border:1px solid rgba(127,250,255,.35);
          box-shadow:0 18px 60px rgba(0,0,0,.55);
          border-radius:18px;
          padding:12px;
          backdrop-filter:blur(10px);
        }
        #svr-phase252-store-hub h2{
          margin:0 0 6px;
          font-size:15px;
          color:#9ffcff;
          letter-spacing:.08em;
          text-transform:uppercase;
        }
        #svr-phase252-store-hub p{
          margin:0 0 10px;
          color:#eee;
          line-height:1.35;
        }
        #svr-phase252-store-hub .links{
          display:flex;
          flex-wrap:wrap;
          gap:7px;
        }
        #svr-phase252-store-hub a{
          color:#9ffcff;
          text-decoration:none;
          border:1px solid rgba(159,252,255,.28);
          border-radius:999px;
          padding:6px 9px;
          background:rgba(0,0,0,.35);
        }
        #svr-phase252-store-hub small{
          display:block;
          margin-top:8px;
          opacity:.78;
        }
      </style>
      <h2>Original Lobby Store Hub</h2>
      <p>Storefront restored on top of the original lobby runtime. Example items: ${items.join(", ")}.</p>
      <div class="links">
        <a href="../site/store.html">Store</a>
        <a href="../site/profile.html">Profile</a>
        <a href="./app-hub.html">VR Hub</a>
        <a href="./scorpion.html">Scorpion</a>
      </div>
      <small>Phase 252 lock: do not replace original lobby.</small>
    `;

    document.body.appendChild(hub);
  }

  function findScene(){
    return (
      window.SVR?.scene ||
      window.svrScene ||
      window.scene ||
      null
    );
  }

  function addThreeHub(){
    if(!window.THREE) return false;

    const scene = findScene();
    if(!scene || !scene.add) return false;
    if(scene.getObjectByName && scene.getObjectByName("SVR_Phase252_StoreHub")) return true;

    const group = new THREE.Group();
    group.name = "SVR_Phase252_StoreHub";
    group.position.set(0, 1.7, -4.2);

    const panelMat = new THREE.MeshBasicMaterial({
      color:0x15132c,
      transparent:true,
      opacity:0.86
    });

    const accentMat = new THREE.MeshBasicMaterial({
      color:0x7dfaff,
      transparent:true,
      opacity:0.85
    });

    const panel = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 2.4), panelMat);
    group.add(panel);

    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.92, 0.025, 12, 64), accentMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, -1.05, 0.05);
    group.add(ring);

    scene.add(group);
    window.SVRStoreHub = { phase:PHASE, group:group, items:items };

    console.log("[SVR] Phase 252 embedded store hub into existing THREE lobby scene.");
    return true;
  }

  function boot(){
    makeDomHub();

    let tries = 0;
    const timer = setInterval(function(){
      tries++;
      if(addThreeHub() || tries > 100){
        clearInterval(timer);
      }
    }, 150);
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
