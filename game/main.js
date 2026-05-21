const statusEl = document.getElementById("status");
const errEl = document.getElementById("err");
function setBootStatus(text){
  if (statusEl) statusEl.textContent = text;
}
function showBootError(err){
  const msg = err?.stack || err?.message || String(err);
  console.error("[SVR BOOT]", err);
  setBootStatus("Boot rescue mode active — runtime error captured");
  if (errEl){
    errEl.style.display = "block";
    errEl.textContent = "SVR BOOT RESCUE\n\nThe game runtime did not finish loading.\nThis is now captured instead of staying on a black Booting screen.\n\n" + msg;
  }
  const app = document.getElementById("app");
  if (app && !app.querySelector(".svr-boot-rescue-card")){
    const card = document.createElement("div");
    card.className = "svr-boot-rescue-card";
    card.style.cssText = "position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);max-width:760px;padding:24px;border:1px solid #8fffe6;border-radius:22px;background:linear-gradient(135deg,rgba(5,8,20,.96),rgba(45,12,72,.96));color:white;font-family:system-ui,Arial;text-align:center;box-shadow:0 0 40px rgba(143,255,230,.25);";
    card.innerHTML = `<h1 style="margin:0 0 10px;font-size:28px;">SVR Boot Rescue</h1><p style="margin:0 0 14px;color:#baffee;">Runtime failed before the 3D scene could start. The error is shown in Logs instead of leaving a black screen.</p><button onclick="location.reload()" style="padding:10px 18px;border-radius:999px;border:1px solid #b95aff;background:#1a0c28;color:white;font-weight:800;">Reload Game</button>`;
    app.appendChild(card);
  }
}

window.__SVR_BOOT_WRAPPER = "PHASE-106-HOLOCTX-BOOT-FIX-LOCK";
setBootStatus("Loading Phase 105 boot-safe runtime…");

const bootTimer = setTimeout(()=>{
  if (!window.__SVR_RUNTIME_READY){
    setBootStatus("Still loading assets — boot guard active");
  }
}, 6500);

import(`./main-runtime.js?v=phase105-${Date.now()}`)
  .then(()=>clearTimeout(bootTimer))
  .catch((err)=>{
    clearTimeout(bootTimer);
    showBootError(err);
  });
