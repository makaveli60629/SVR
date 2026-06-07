(function(){
  const BUILD = "VERSION-1.4.8-BOOT-LOADER-RESCUE";
  window.SVR_BUILD_LABEL = BUILD;
  window.SVR_AUDIO_DISABLED = true;

  function loaderNodes(){
    const nodes = new Set();
    ["#loadingScreen","#loading-screen","#loader","#boot","#bootOverlay",".loading-screen",".loader",".boot-screen",".splash",".loading","[data-loader]","[data-splash]"]
      .forEach(sel => document.querySelectorAll(sel).forEach(n => nodes.add(n)));

    Array.from(document.body.children).forEach(el => {
      const t = (el.textContent || "").toUpperCase();
      if (t.includes("SVR POKER") || t.includes("LOADING LOBBY") || t.includes("STARTING RENDERER") || t.includes("LOBBY-ORG-1-4C") || t.includes("BOOTING")) nodes.add(el);
    });
    return Array.from(nodes);
  }

  function clearLoader(reason){
    document.documentElement.classList.add("svr-ready");
    document.body.classList.add("svr-ready");
    loaderNodes().forEach(el => {
      if (el.id === "svrRuntimeErrorPanel") return;
      el.style.opacity = "0";
      el.style.pointerEvents = "none";
      el.style.transition = "opacity 300ms ease";
      setTimeout(() => { el.style.display = "none"; }, 360);
    });
    console.log("[SVR]", BUILD, "loader cleared:", reason);
  }

  function showError(message){
    let box = document.getElementById("svrRuntimeErrorPanel");
    if (!box) {
      box = document.createElement("pre");
      box.id = "svrRuntimeErrorPanel";
      box.style.cssText = "position:fixed;left:10px;right:10px;bottom:10px;z-index:2147483647;max-height:45vh;overflow:auto;white-space:pre-wrap;background:rgba(25,0,0,.92);color:#ffd6d6;border:2px solid #ff4d4d;border-radius:12px;padding:12px;font:12px/1.35 Consolas,monospace";
      document.body.appendChild(box);
    }
    box.textContent = "SVR RUNTIME ERROR â€” 1.4.8 BOOT RESCUE\n\n" + message;
  }

  window.addEventListener("error", e => {
    showError((e.filename || "runtime") + ":" + (e.lineno || "?") + "\n" + (e.message || e.error || e));
    setTimeout(() => clearLoader("error surfaced"), 500);
  });
  window.addEventListener("unhandledrejection", e => {
    const r = e.reason || e;
    showError((r.stack || r.message || String(r)));
    setTimeout(() => clearLoader("promise error surfaced"), 500);
  });

  ["svr-ready","SVR_READY","svr:ready","three-ready","xr-ready"].forEach(ev => window.addEventListener(ev, () => clearLoader(ev)));
  window.addEventListener("DOMContentLoaded", () => setTimeout(() => clearLoader("DOMContentLoaded timeout"), 6500));
  window.addEventListener("load", () => setTimeout(() => clearLoader("window load timeout"), 2500));
  setTimeout(() => clearLoader("hard timeout"), 9500);
})();
