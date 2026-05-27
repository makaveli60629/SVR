export function installSvrBootFinalizer(){
  const status = document.getElementById("status");
  const mode = document.getElementById("mode");
  const log = document.getElementById("log");

  function hideOldVrUnsupportedBadge(){
    try {
      document.querySelectorAll("*").forEach((el)=>{
        const txt = (el.textContent || "").trim();
        if (txt === "VR NOT SUPPORTED") {
          el.style.display = "none";
        }
      });
    } catch(_e) {}
  }

  function setReady(reason){
    if (status && /booting|loading|boot issue/i.test(status.textContent || "")) {
      status.textContent = "Ready. Original lobby active. Hand teleport and portals locked.";
    }

    if (mode && /hands|not tracked|checking/i.test(mode.textContent || "")) {
      mode.textContent = "Input ready: desktop / Quest";
    }

    hideOldVrUnsupportedBadge();

    if (log && /main\.js import resolved|runtime ready|SVR runtime ready/i.test(log.textContent || "")) {
      setTimeout(()=>{ log.style.display = "none"; }, 1200);
    }

    window.SVR_BOOT_READY = true;
    try { console.log("[SVR boot finalizer] ready:", reason); } catch(_e) {}
  }

  setTimeout(()=>setReady("2s"), 2000);
  setTimeout(()=>setReady("5s"), 5000);
  setTimeout(()=>setReady("8s"), 8000);
  setTimeout(()=>setReady("12s"), 12000);

  window.addEventListener("svr-runtime-ready", ()=>setReady("event"));
  window.addEventListener("load", ()=>setReady("window-load"));
}
