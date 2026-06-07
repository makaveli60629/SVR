(function(){
  const BUILD = "VERSION-1.4.8-BLACK-SCREEN-DIAG";
  window.SVR_BUILD_LABEL = BUILD;
  window.SVR_BOOT_DIAG = { build: BUILD, startedAt: Date.now(), errors: [], message: "diag loaded" };

  function panel(){
    let p = document.getElementById("svrBootDiagPanel");
    if (p) return p;
    p = document.createElement("pre");
    p.id = "svrBootDiagPanel";
    p.style.cssText = "position:fixed;left:10px;top:10px;z-index:2147483647;max-width:70vw;max-height:44vh;overflow:auto;white-space:pre-wrap;background:rgba(0,8,14,.88);color:#b7fff4;border:1px solid #00ffd5;border-radius:10px;padding:10px;font:12px/1.35 Consolas,monospace;box-shadow:0 0 18px rgba(0,255,213,.28)";
    document.body.appendChild(p);
    return p;
  }

  function render(){
    const s = window.SVR_BOOT_DIAG;
    const age = ((Date.now() - s.startedAt) / 1000).toFixed(1);
    const cvs = Array.from(document.querySelectorAll("canvas")).map((c,i)=> {
      const r = c.getBoundingClientRect();
      return `canvas[${i}] ${Math.round(r.width)}x${Math.round(r.height)} display=${getComputedStyle(c).display} opacity=${getComputedStyle(c).opacity}`;
    });
    panel().textContent =
      `SVR BOOT DIAG â€” ${BUILD}\n` +
      `age: ${age}s\nmessage: ${s.message}\nurl: ${location.href}\n\n` +
      `CANVAS:\n${cvs.length ? cvs.join("\n") : "none"}\n\n` +
      `ERRORS:\n${s.errors.length ? s.errors.slice(-10).join("\n\n") : "none captured"}`;
  }

  function note(m){ window.SVR_BOOT_DIAG.message = m; console.log("[SVR DIAG]", m); render(); }
  function error(m){ window.SVR_BOOT_DIAG.errors.push(String(m)); window.SVR_BOOT_DIAG.message = "error captured"; render(); }

  window.addEventListener("error", e => error((e.filename || "runtime") + ":" + (e.lineno || "?") + "\n" + (e.message || e.error || e)));
  window.addEventListener("unhandledrejection", e => { const r = e.reason || e; error(r.stack || r.message || String(r)); });

  function clearLoaders(){
    Array.from(document.body.children).forEach(n => {
      const t = (n.textContent || "").toUpperCase();
      if (n.id !== "svrBootDiagPanel" && (t.includes("LOADING LOBBY") || t.includes("STARTING RENDERER") || t.includes("SVR POKER"))) {
        n.style.opacity = "0"; n.style.pointerEvents = "none";
        setTimeout(()=>{ n.style.display = "none"; }, 250);
      }
    });
  }

  function fallback(){
    if (document.getElementById("svrFallbackScene")) return;
    const d = document.createElement("div");
    d.id = "svrFallbackScene";
    d.style.cssText = "position:fixed;inset:0;z-index:0;pointer-events:none;background:radial-gradient(circle at 50% 42%,rgba(0,255,213,.13),transparent 24%),linear-gradient(#02040a,#000);color:#00ffd5;font-family:Consolas,monospace";
    d.innerHTML = '<div style="position:absolute;left:50%;top:52%;transform:translate(-50%,-50%);text-align:center;border:1px solid rgba(0,255,213,.45);border-radius:16px;padding:22px 28px;background:rgba(0,0,0,.45)"><div style="font-size:26px;font-weight:900;letter-spacing:.14em">SVR POKER</div><div style="font-size:12px;margin-top:10px;color:#b7fff4">Black-screen diagnostic active. Send the cyan panel text.</div></div>';
    document.body.prepend(d);
  }

  function forceCanvas(){
    document.documentElement.style.background = "#02040a";
    document.body.style.background = "#02040a";
    document.querySelectorAll("canvas").forEach(c => {
      c.style.display = "block";
      c.style.visibility = "visible";
      c.style.opacity = "1";
    });
  }

  document.addEventListener("DOMContentLoaded", () => { note("DOMContentLoaded"); fallback(); clearLoaders(); forceCanvas(); });
  window.addEventListener("load", () => { note("window load"); clearLoaders(); forceCanvas(); });
  setInterval(() => { clearLoaders(); forceCanvas(); render(); }, 1500);
  setTimeout(() => { fallback(); note("8s black-screen check complete"); }, 8000);
})();
