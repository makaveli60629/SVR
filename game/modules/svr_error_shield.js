export function installSvrErrorShield(){
  const status = document.getElementById("status");
  const mode = document.getElementById("mode");
  const log = document.getElementById("log");
  const err = document.getElementById("err");

  function writeLog(line){
    try {
      if (log) {
        log.style.display = "block";
        log.textContent += String(line) + "\n";
        log.scrollTop = log.scrollHeight;
      }
    } catch(_e) {}
  }

  function showError(label, detail){
    const text = `[SVR ERROR SHIELD] ${label}: ${detail || ""}`;
    writeLog(text);

    if (status) status.textContent = "Recovered runtime error. Open Logs.";
    if (mode) mode.textContent = "Error shield active";

    if (err) {
      err.style.display = "block";
      err.textContent = text;
      setTimeout(()=>{ err.style.display = "none"; }, 5000);
    }

    try { console.error(text); } catch(_e) {}
  }

  window.addEventListener("error", (e)=>{
    showError("window.error", e?.error?.stack || e?.message || e);
  });

  window.addEventListener("unhandledrejection", (e)=>{
    showError("unhandledrejection", e?.reason?.stack || e?.reason || e);
  });

  window.SVR_ERROR_SHIELD_READY = true;
  writeLog("[SVR] Error shield installed.");
}
