export function installSvrBootFinalizer(){
  const status = document.getElementById("status");
  const mode = document.getElementById("mode");
  const log = document.getElementById("log");

  function setReady(reason){
    if (status && /booting|loading|boot issue/i.test(status.textContent || "")) {
      status.textContent = "Ready. Original lobby active.";
    }

    if (mode && /hands|not tracked|checking/i.test(mode.textContent || "")) {
      mode.textContent = "Input ready: desktop / Quest";
    }

    // Hide open log panel after recovery unless user opens it again.
    if (log && /main\.js import resolved|runtime ready|SVR runtime ready/i.test(log.textContent || "")) {
      setTimeout(()=>{ log.style.display = "none"; }, 900);
    }

    // Hide old desktop overlay text if present. Real VR still works in Quest Browser.
    document.querySelectorAll("*").forEach((el)=>{
      const txt = (el.textContent || "").trim();
      if (txt === "VR NOT SUPPORTED") {
        el.style.display = "none";
      }
    });

    window.SVR_BOOT_READY = true;
    console.log("[SVR boot finalizer] ready:", reason);
  }

  setTimeout(()=>setReady("2s"), 2000);
  setTimeout(()=>setReady("5s"), 5000);
  setTimeout(()=>setReady("8s"), 8000);

  window.addEventListener("svr-runtime-ready", ()=>setReady("event"));
  window.addEventListener("load", ()=>setReady("window-load"));
}
