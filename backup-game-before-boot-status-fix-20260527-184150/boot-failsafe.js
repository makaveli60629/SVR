(function(){
  "use strict";

  const BUILD = "PHASE-91-BLACK-BOOT-LOG-RECOVERY-V2";
  const startedAt = Date.now();
  const notes = [];
  let failed = false;
  let ready = false;

  function safeText(value){
    if (value == null) return "";
    if (value instanceof Error) return value.stack || value.message || String(value);
    if (typeof value === "string") return value;
    try { return JSON.stringify(value, null, 2); } catch (_) { return String(value); }
  }

  function addNote(message){
    const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1) + "s";
    notes.push("[" + elapsed + "] " + safeText(message));
    if (notes.length > 80) notes.shift();
    const log = document.getElementById("log");
    if (log) {
      log.style.display = "block";
      log.textContent = notes.join("\n");
      log.scrollTop = log.scrollHeight;
    }
    const bootLog = document.getElementById("svrBootLog");
    if (bootLog) bootLog.textContent = notes.join("\n");
  }

  function ensureOverlay(){
    let overlay = document.getElementById("svrBootOverlay");
    if (!overlay) {
      overlay = document.createElement("div");
      overlay.id = "svrBootOverlay";
      overlay.innerHTML = [
        '<div class="svr-boot-card">',
        '<div class="svr-boot-kicker">SVR BOOT RECOVERY</div>',
        '<h1 id="svrBootTitle">Booting SVR Poker...</h1>',
        '<p id="svrBootMsg">Starting runtime.</p>',
        '<pre id="svrBootLog"></pre>',
        '<div class="svr-boot-actions">',
        '<button id="svrBootReload" type="button">Reload no cache</button>',
        '<button id="svrBootCopy" type="button">Copy boot log</button>',
        '<a href="./version.json?v=' + Date.now() + '" target="_blank" rel="noreferrer">version.json</a>',
        '<a href="./deploy-health.json?v=' + Date.now() + '" target="_blank" rel="noreferrer">deploy-health</a>',
        '</div>',
        '</div>'
      ].join("");
      document.body.appendChild(overlay);

      const reload = document.getElementById("svrBootReload");
      if (reload) reload.addEventListener("click", function(){
        location.href = location.pathname + "?v=" + Date.now();
      });

      const copy = document.getElementById("svrBootCopy");
      if (copy) copy.addEventListener("click", async function(){
        try {
          await navigator.clipboard.writeText(notes.join("\n"));
          copy.textContent = "Copied";
        } catch (_) {
          copy.textContent = "Copy failed";
        }
      });
    }
    return overlay;
  }

  function setOverlay(title, message, forceShow){
    const overlay = ensureOverlay();
    const t = document.getElementById("svrBootTitle");
    const m = document.getElementById("svrBootMsg");
    const l = document.getElementById("svrBootLog");
    if (t) t.textContent = title;
    if (m) m.textContent = message;
    if (l) l.textContent = notes.join("\n");
    overlay.style.display = forceShow ? "flex" : "none";
  }

  function fail(error, label){
    if (ready) return;
    failed = true;
    const text = safeText(error);
    addNote((label || "Boot failure") + ": " + text);

    const status = document.getElementById("status");
    if (status) status.textContent = "Boot failed - recovery log is open";

    const err = document.getElementById("err");
    if (err) {
      err.style.display = "block";
      err.textContent = BUILD + "\n" + (label || "Boot failure") + "\n\n" + text + "\n\nRecent boot notes:\n" + notes.join("\n");
    }

    setOverlay(
      "Black boot caught",
      "The game did not reach the ready marker. This recovery layer is now showing the boot reason instead of a silent black screen.",
      true
    );
  }

  function markReady(message){
    ready = true;
    window.SVR_GAME_READY = true;
    addNote(message || "SVR ready marker received.");
    const overlay = document.getElementById("svrBootOverlay");
    if (overlay) overlay.style.display = "none";
  }

  window.SVR_BOOT_FAILSAFE = {
    build: BUILD,
    note: addNote,
    fail: fail,
    ready: markReady,
    getLog: function(){ return notes.slice(); }
  };

  const oldError = window.onerror;
  window.onerror = function(message, source, line, col, error){
    fail(error || (message + " at " + source + ":" + line + ":" + col), "window.onerror");
    if (typeof oldError === "function") return oldError.apply(this, arguments);
    return false;
  };

  window.addEventListener("error", function(event){
    const target = event.target;
    if (target && target !== window && (target.src || target.href)) {
      fail((target.tagName || "asset") + " failed: " + (target.src || target.href), "asset/script load error");
      return;
    }
    fail(event.error || event.message || event, "runtime error");
  }, true);

  window.addEventListener("unhandledrejection", function(event){
    fail(event.reason || event, "unhandled promise rejection");
  });

  document.addEventListener("DOMContentLoaded", function(){
    ensureOverlay();
    addNote("DOM loaded. Starting module import.");
    setOverlay("Booting SVR Poker...", "Loading runtime modules. If a module fails, the error will appear here.", true);
  });

  window.addEventListener("svr:ready", function(event){
    markReady((event && event.detail && event.detail.message) || "svr:ready event received");
  });

  setTimeout(function(){
    if (!ready && !failed) {
      addNote("Boot still loading after 5 seconds.");
      const status = document.getElementById("status");
      if (status) status.textContent = "Boot watchdog active - still loading";
    }
  }, 5000);

  setTimeout(function(){
    if (!ready && !failed) {
      fail("Timed out before window.SVR_GAME_READY / svr:ready. Likely blocked CDN import, missing module, bad top-level await, or asset hang.", "boot timeout");
    }
  }, 11000);

  addNote(BUILD + " installed.");
})();