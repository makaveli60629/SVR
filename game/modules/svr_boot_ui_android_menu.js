(function(){
  const BUILD = "VERSION-1.4.9-BOOT-UI-ANDROID-MENU";
  window.SVR_BUILD_LABEL = BUILD;
  const start = performance.now();
  const logs = [];
  window.SVR_BOOT_LOG = logs;

  function log(msg, isError){
    const line = "[" + ((performance.now() - start) / 1000).toFixed(1) + "s] " + msg;
    logs.push(line);
    if (logs.length > 80) logs.shift();
    (isError ? console.error : console.log)("[SVR BOOT]", line);
    renderLogs();
  }
  window.SVR_LOG = log;

  function addStyle(){
    if (document.getElementById("svrBootUiStyle")) return;
    const s = document.createElement("style");
    s.id = "svrBootUiStyle";
    s.textContent = `
      html,body{background:#02040a;overscroll-behavior:none;touch-action:none}
      #svrLoadingPro{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;background:radial-gradient(circle at 50% 32%,rgba(0,255,213,.14),transparent 27%),linear-gradient(#02040a,#000);color:#dff;font-family:Consolas,system-ui,sans-serif;transition:opacity .35s ease}
      #svrLoadingCard{width:min(720px,92vw);max-height:84vh;border:1px solid rgba(0,255,213,.55);border-radius:18px;background:rgba(0,0,0,.62);box-shadow:0 0 32px rgba(0,255,213,.20);padding:20px}
      #svrLoadingTitle{font-size:clamp(24px,6vw,54px);font-weight:900;letter-spacing:.13em;text-align:center;color:#fff}
      #svrLoadingSub{text-align:center;margin-top:8px;color:#9ff;letter-spacing:.18em;font-weight:700}
      #svrLoadBar{height:14px;margin:18px 0 12px;border:1px solid rgba(0,255,213,.55);border-radius:999px;overflow:hidden;background:rgba(255,255,255,.05)}
      #svrLoadBarFill{height:100%;width:8%;border-radius:999px;background:linear-gradient(90deg,#00ffd5,#c986ff,#fff);transition:width .4s ease}
      #svrBootLogBox{height:150px;overflow:auto;border:1px solid rgba(0,255,213,.25);border-radius:10px;background:rgba(0,10,16,.78);padding:10px;color:#b7fff4;font-size:12px;line-height:1.35;white-space:pre-wrap}
      #svrTopMenu{position:fixed;right:12px;top:12px;z-index:2147483100;font-family:Consolas,system-ui,sans-serif}
      #svrMenuButton{border:1px solid rgba(0,255,213,.7);background:rgba(0,0,0,.68);color:#eaffff;border-radius:12px;padding:10px 14px;font-weight:900;box-shadow:0 0 15px rgba(0,255,213,.2)}
      #svrMenuPanel{display:none;margin-top:8px;width:min(260px,72vw);max-height:70vh;overflow:auto;border:1px solid rgba(0,255,213,.55);border-radius:14px;background:rgba(0,5,10,.88);box-shadow:0 0 22px rgba(0,255,213,.25);padding:8px}
      #svrMenuPanel.open{display:block}
      .svrMenuItem{display:block;width:100%;margin:5px 0;border:1px solid rgba(255,255,255,.18);border-radius:10px;background:rgba(255,255,255,.06);color:#eaffff;padding:10px 12px;text-align:left;font-weight:800}
      #svrLandscapeHint{display:none;position:fixed;inset:0;z-index:2147483200;background:rgba(0,0,0,.94);color:#fff;align-items:center;justify-content:center;text-align:center;font-family:system-ui,sans-serif;padding:28px}
      #svrLandscapeHint .box{border:1px solid #00ffd5;border-radius:18px;padding:22px;max-width:460px;box-shadow:0 0 26px rgba(0,255,213,.22)}
      @media (orientation:portrait) and (max-width:900px){#svrLandscapeHint{display:flex}}
      @media (orientation:landscape) and (max-width:940px){#svrLoadingCard{max-height:90vh;padding:14px}#svrBootLogBox{height:92px;font-size:11px}#svrLoadingTitle{font-size:30px}}
    `;
    document.head.appendChild(s);
  }

  function makeLoader(){
    if (document.getElementById("svrLoadingPro")) return;
    const d = document.createElement("div");
    d.id = "svrLoadingPro";
    d.innerHTML = '<div id="svrLoadingCard"><div id="svrLoadingTitle">SVR POKER</div><div id="svrLoadingSub">LOADING GAME RUNTIME</div><div id="svrLoadBar"><div id="svrLoadBarFill"></div></div><div id="svrBootLogBox"></div><div style="margin-top:10px;text-align:center;color:#9aa;font-size:12px">Live boot logs enabled. Rotate mobile sideways for best view.</div></div>';
    document.body.appendChild(d);
  }

  function makeLandscapeHint(){
    if (document.getElementById("svrLandscapeHint")) return;
    const d = document.createElement("div");
    d.id = "svrLandscapeHint";
    d.innerHTML = '<div class="box"><div style="font-size:42px">â†»</div><h2>Turn phone sideways</h2><p>SVR Game is optimized for landscape with controller fallback.</p></div>';
    document.body.appendChild(d);
  }

  function makeMenu(){
    if (document.getElementById("svrTopMenu")) return;
    const routes = [
      ["Lobby","./index.html?v=1-4-9"],["Seat","#seat"],["Reiki Room","./reiki.html?v=1-4-9"],
      ["PGA Drive","./pga-drive.html?v=1-4-9"],["Chip / Putt","./chip-putt.html?v=1-4-9"],
      ["Store","https://svrpoker.com/site/store.html"],["Smoker Lounge","./smoker-lounge.html?v=1-4-9"],["Scorpion","./scorpion.html?v=1-4-9"]
    ];
    const wrap = document.createElement("div");
    wrap.id = "svrTopMenu";
    wrap.innerHTML = '<button id="svrMenuButton" type="button">â˜° Destinations</button><div id="svrMenuPanel"></div>';
    document.body.appendChild(wrap);
    const panel = document.getElementById("svrMenuPanel");
    routes.forEach(function(pair){
      const b = document.createElement("button");
      b.className = "svrMenuItem";
      b.textContent = pair[0];
      b.onclick = function(){
        log("route requested: " + pair[0]);
        if (pair[1] === "#seat") {
          window.dispatchEvent(new CustomEvent("svr-seat-request",{detail:{source:"dropdown"}}));
          const seatBtn = document.querySelector('[data-action="seat"],#seatButton,.seat-button');
          if (seatBtn) seatBtn.click();
        } else if (pair[1].indexOf("http") === 0) {
          window.open(pair[1], "_blank", "noopener,noreferrer");
        } else {
          location.href = pair[1];
        }
      };
      panel.appendChild(b);
    });
    document.getElementById("svrMenuButton").onclick = function(){ panel.classList.toggle("open"); };
  }

  function renderLogs(){
    const box = document.getElementById("svrBootLogBox");
    if (box) {
      box.textContent = logs.slice(-30).join("\n");
      box.scrollTop = box.scrollHeight;
    }
    const fill = document.getElementById("svrLoadBarFill");
    if (fill) {
      const pct = Math.min(95, 10 + logs.length * 8 + ((performance.now() - start) / 1000) * 4);
      fill.style.width = pct.toFixed(0) + "%";
    }
  }

  function hideCrowdedButtons(){
    Array.from(document.querySelectorAll("button,a")).forEach(function(el){
      if (el.closest("#svrTopMenu") || el.closest("#svrLoadingPro")) return;
      const t = (el.textContent || "").trim().toLowerCase();
      if (["lobby","seat","reiki","pga","legend","sponsor","scorpion","table","zen den","drive","chip/putt","store"].indexOf(t) >= 0) {
        el.style.display = "none";
      }
    });
  }

  function clearLoader(reason){
    log("ready: " + reason);
    const fill = document.getElementById("svrLoadBarFill");
    if (fill) fill.style.width = "100%";
    const d = document.getElementById("svrLoadingPro");
    if (d) {
      d.style.opacity = "0";
      d.style.pointerEvents = "none";
      setTimeout(function(){ d.style.display = "none"; }, 450);
    }
    hideCrowdedButtons();
  }

  window.addEventListener("error", function(e){ log("ERROR " + (e.filename || "runtime") + ":" + (e.lineno || "?") + " " + (e.message || e.error || e), true); });
  window.addEventListener("unhandledrejection", function(e){ const r = e.reason || e; log("PROMISE ERROR " + (r.stack || r.message || String(r)), true); });
  ["svr-ready","SVR_READY","svr:ready","three-ready","xr-ready"].forEach(function(ev){ window.addEventListener(ev, function(){ clearLoader(ev); }); });

  document.addEventListener("DOMContentLoaded", function(){
    addStyle(); makeLandscapeHint(); makeLoader(); makeMenu();
    log("DOMContentLoaded");
    log("viewport: " + window.innerWidth + "x" + window.innerHeight);
    log("orientation: " + (window.innerWidth > window.innerHeight ? "landscape" : "portrait"));
  });
  window.addEventListener("load", function(){ log("window load"); setTimeout(function(){ clearLoader("window load fallback"); }, 8500); });
  setTimeout(function(){ log("still loading after 15s; canvas/runtime check needed"); }, 15000);
  setTimeout(function(){ clearLoader("25s forced clear"); }, 25000);
})();
