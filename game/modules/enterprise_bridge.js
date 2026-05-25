import * as THREE from "three";

const DEFAULT_API = localStorage.getItem("SVR_API_BASE") || "";

export function initEnterpriseBridge({ scene, sceneTargets = {}, log = console.log } = {}){
  const state = {
    apiBase: DEFAULT_API,
    online: false,
    modules: ["charity", "private", "sponsor", "commerce", "analytics", "avatar", "table-router", "store-portal"],
    build: window.SVR_BUILD_LABEL || "PHASE-174-ENTERPRISE-AUTO-FINISH-LOCK"
  };
  window.SVR_ENTERPRISE = state;

  async function api(path, options = {}){
    if (!state.apiBase) return null;
    try{
      const res = await fetch(`${state.apiBase}${path}`, { credentials: "omit", ...options });
      if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
      return await res.json();
    }catch(err){
      log("Enterprise API offline/fallback", path, err.message || err);
      return null;
    }
  }

  async function refreshStatus(){
    const health = await api("/api/health");
    state.online = !!health && health.status === "ok";
    window.dispatchEvent(new CustomEvent("svr_backend_status", { detail: { online: state.online, health } }));
  }

  function createStorePortal(){
    if (!scene || scene.getObjectByName("SVR_STORE_WEB_PORTAL")) return;
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const x = c.getContext("2d");
    const g = x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#090913"); g.addColorStop(1,"#25104a");
    x.fillStyle = g; x.fillRect(0,0,c.width,c.height);
    x.strokeStyle = "rgba(180,140,255,.95)"; x.lineWidth = 16; x.strokeRect(28,28,c.width-56,c.height-56);
    x.textAlign = "center"; x.textBaseline = "middle";
    x.fillStyle = "#fff"; x.font = "bold 82px system-ui, Arial"; x.fillText("SVR STORE PORTAL", c.width/2, 150);
    x.fillStyle = "#c7fff1"; x.font = "bold 38px system-ui, Arial"; x.fillText("svrpoker.com/site/store.html", c.width/2, 245);
    x.fillStyle = "#ffd77a"; x.font = "30px system-ui, Arial"; x.fillText("Use desktop/mobile fallback for live checkout until API lock is approved", c.width/2, 328);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    const portal = new THREE.Mesh(new THREE.PlaneGeometry(4.8, 2.4), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide }));
    portal.name = "SVR_STORE_WEB_PORTAL";
    portal.position.set(4.8, 2.2, -4.2);
    portal.rotation.y = -0.52;
    portal.userData.url = "https://svrpoker.com/site/store.html";
    scene.add(portal);
  }

  window.addEventListener("svr_inject_sponsor_materials", (event)=>{
    state.lastSponsorTexturePacket = event.detail || {};
  });
  window.addEventListener("svr_hand_complete", (event)=>{
    api("/api/game/hand-results", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(event.detail) });
  });
  window.addEventListener("svr_store_portal_open", ()=>{ window.open("https://svrpoker.com/site/store.html", "_blank", "noopener"); });

  createStorePortal();
  refreshStatus();
  setInterval(refreshStatus, 60000);
  return state;
}
