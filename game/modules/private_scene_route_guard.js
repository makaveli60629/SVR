// PHASE-104-PRIVATE-SCENE-ROUTE-HARDENING-LOCK
// Game-side only. Adds a safe private-scene route registry/checker so missing
// private scene pages are reported clearly instead of causing confusing jumps.
// Normal lobby quick-jump buttons remain intact.

const PHASE = "PHASE-104-PRIVATE-SCENE-ROUTE-HARDENING-LOCK";
const ROUTES = Object.freeze({
  reiki: { label: "Reiki Room", url: "./reiki.html", nav: "reiki" },
  pgaDrive: { label: "PGA Driving Range", url: "./pga-drive.html", altUrl: "./range.html", nav: "pgaDrive" },
  chipPutt: { label: "PGA Chip/Putt", url: "./chip-putt.html", nav: "chipPutt" },
  storeRoom: { label: "VR Store", url: "./store-room.html", nav: "storeRoom" },
  smokerLounge: { label: "Smoker Lounge", url: "./smoker-lounge.html", nav: "smokerLounge" },
  scorpion: { label: "Scorpion Room", url: "./scorpion.html", nav: "scorpion" }
});

let root = null;
let body = null;
let lastAudit = null;
let checking = false;

function isPreview(){
  const params = new URLSearchParams(location.search);
  return document.body.classList.contains("preview-mode") || params.has("preview") || params.get("cam") === "director";
}

function injectStyle(){
  if (document.getElementById("svr-private-route-style")) return;
  const style = document.createElement("style");
  style.id = "svr-private-route-style";
  style.textContent = `
    #svrPrivateRouteGuard { position: fixed; right: 12px; top: 72px; z-index: 43; width: min(390px, calc(100vw - 24px)); border: 1px solid rgba(127,245,199,.44); border-radius: 16px; padding: 10px; background: linear-gradient(135deg, rgba(4,8,16,.88), rgba(20,9,40,.90)); color: #f5f2ff; box-shadow: 0 16px 44px rgba(0,0,0,.42); backdrop-filter: blur(9px); font-family: system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif; pointer-events: auto; display: none; contain: layout paint style; }
    #svrPrivateRouteGuard.svr-open { display:block; }
    #svrPrivateRouteGuard h3 { margin:0 0 8px; font-size:13px; letter-spacing:.10em; text-transform:uppercase; color:#7ff5c7; }
    #svrPrivateRouteGuard .route-row { display:flex; align-items:center; justify-content:space-between; gap:8px; border-top:1px solid rgba(255,255,255,.08); padding:7px 0; font-size:12px; }
    #svrPrivateRouteGuard .route-label { font-weight:800; color:#fff; }
    #svrPrivateRouteGuard .route-status { color:#f6e27f; text-align:right; }
    #svrPrivateRouteGuard .route-status.good { color:#7ff5c7; }
    #svrPrivateRouteGuard .route-status.bad { color:#ff6b7f; }
    #svrPrivateRouteGuard .route-actions { display:flex; gap:6px; justify-content:flex-end; }
    #svrPrivateRouteGuard button { border:1px solid rgba(180,140,255,.42); border-radius:999px; background:rgba(255,255,255,.08); color:#fff; font-size:11px; font-weight:800; padding:5px 8px; cursor:pointer; }
    #svrPrivateRouteGuard button:hover { background:rgba(180,140,255,.24); }
    .scene-btn[data-route-status="ok"] { border-color: rgba(127,245,199,.76) !important; }
    .scene-btn[data-route-status="missing"] { border-color: rgba(255,107,127,.72) !important; }
    .scene-btn[data-route-status="checking"] { border-color: rgba(246,226,127,.72) !important; }
    body.preview-mode #svrPrivateRouteGuard { display:none !important; }
    body.svr-low-perf #svrPrivateRouteGuard { backdrop-filter:none; box-shadow:0 8px 20px rgba(0,0,0,.38); }
  `;
  document.head.appendChild(style);
}

function makePanel(){
  if (root) return;
  injectStyle();
  root = document.createElement("section");
  root.id = "svrPrivateRouteGuard";
  root.setAttribute("aria-label", "SVR private route guard");
  root.innerHTML = `<h3>Private Scene Routes</h3><div id="svrPrivateRouteBody">Checking routes…</div>`;
  body = root.querySelector("#svrPrivateRouteBody");
  document.body.appendChild(root);
}

async function checkUrl(url){
  try {
    const res = await fetch(url, { method: "HEAD", cache: "no-store" });
    if (res.ok) return { ok: true, status: res.status, url };
    // Some static hosts block HEAD. Try a tiny GET fallback.
    const get = await fetch(url, { method: "GET", cache: "no-store" });
    return { ok: get.ok, status: get.status, url };
  } catch (err){
    return { ok: false, status: "ERR", url, error: err?.message || String(err) };
  }
}

async function checkRoute(key, rec){
  const primary = await checkUrl(rec.url);
  if (primary.ok) return { key, ...rec, ok: true, status: primary.status, resolvedUrl: rec.url, checkedAt: new Date().toISOString() };
  if (rec.altUrl){
    const alt = await checkUrl(rec.altUrl);
    if (alt.ok) return { key, ...rec, ok: true, status: alt.status, resolvedUrl: rec.altUrl, primaryMissing: true, checkedAt: new Date().toISOString() };
    return { key, ...rec, ok: false, status: `${primary.status}/${alt.status}`, resolvedUrl: rec.url, altUrl: rec.altUrl, checkedAt: new Date().toISOString() };
  }
  return { key, ...rec, ok: false, status: primary.status, resolvedUrl: rec.url, checkedAt: new Date().toISOString() };
}

function patchNavButtons(audit){
  for (const item of audit.routes){
    const btn = document.querySelector(`#sceneNav [data-scene="${item.nav}"]`);
    if (!btn) continue;
    btn.dataset.privateRoute = item.resolvedUrl;
    btn.dataset.routeStatus = item.ok ? "ok" : "missing";
    btn.title = item.ok
      ? `${item.label}: private route available (${item.resolvedUrl}). Normal click = lobby jump. Shift/Alt click = open private scene.`
      : `${item.label}: private route missing (${item.resolvedUrl}). Normal click still uses lobby fallback.`;
  }
}

function renderPanel(audit){
  if (!body || !audit) return;
  body.innerHTML = audit.routes.map(item => `
    <div class="route-row">
      <div><div class="route-label">${item.label}</div><div>${item.resolvedUrl}</div></div>
      <div>
        <div class="route-status ${item.ok ? "good" : "bad"}">${item.ok ? "READY" : "MISSING"}</div>
        <div class="route-actions"><button data-open-route="${item.key}" ${item.ok ? "" : "disabled"}>OPEN</button></div>
      </div>
    </div>
  `).join("") + `<div class="route-row"><span>Shift/Alt-click a route button to open private page.</span><span class="route-status ${audit.ok ? "good" : "bad"}">${audit.ok ? "ALL READY" : "CHECK"}</span></div>`;
  body.querySelectorAll("[data-open-route]").forEach(btn => {
    btn.addEventListener("click", (event)=>{
      event.preventDefault(); event.stopPropagation();
      go(btn.dataset.openRoute);
    });
  });
}

async function runAudit(){
  if (checking) return lastAudit;
  checking = true;
  makePanel();
  Object.values(ROUTES).forEach(rec => {
    const btn = document.querySelector(`#sceneNav [data-scene="${rec.nav}"]`);
    if (btn) btn.dataset.routeStatus = "checking";
  });
  const routes = [];
  for (const [key, rec] of Object.entries(ROUTES)) routes.push(await checkRoute(key, rec));
  const audit = {
    phase: PHASE,
    timestamp: new Date().toISOString(),
    siteTouched: false,
    gameTrackOnly: true,
    ok: routes.every(r => r.ok),
    routes,
    missingRoutes: routes.filter(r => !r.ok).map(r => ({ key: r.key, label: r.label, url: r.resolvedUrl, status: r.status }))
  };
  lastAudit = audit;
  window.SVR_PHASE104_PRIVATE_ROUTE_GUARD = { phase: PHASE, audit, routes: ROUTES, go, refresh: runAudit, openPanel: () => root?.classList.add("svr-open"), closePanel: () => root?.classList.remove("svr-open") };
  window.dispatchEvent(new CustomEvent("svr-private-route-audit", { detail: audit }));
  patchNavButtons(audit);
  renderPanel(audit);
  checking = false;
  return audit;
}

function routeFor(key){
  const record = lastAudit?.routes?.find(r => r.key === key || r.nav === key) || null;
  if (record?.ok) return record;
  const fallback = ROUTES[key] || Object.values(ROUTES).find(r => r.nav === key);
  return fallback ? { key, ...fallback, ok: false, resolvedUrl: fallback.url } : null;
}

function go(key){
  const rec = routeFor(key);
  if (!rec) return false;
  if (!rec.ok){
    root?.classList.add("svr-open");
    renderPanel(lastAudit);
    try { window.SVR_PHASE95_POKER_FEEDBACK_FX?.showToast?.({ title: "Route Missing", body: `${rec.label || key} private page is not deployed yet`, sub: rec.resolvedUrl || rec.url, kind: "warn", ms: 3600 }); } catch {}
    return false;
  }
  window.location.href = rec.resolvedUrl;
  return true;
}

function hookNav(){
  document.addEventListener("click", (event)=>{
    const btn = event.target?.closest?.("#sceneNav [data-scene]");
    if (!btn) return;
    const key = btn.dataset.scene;
    const rec = routeFor(key);
    if (!rec) return;
    if (event.shiftKey || event.altKey){
      event.preventDefault();
      event.stopImmediatePropagation();
      go(key);
    }
  }, true);
  document.addEventListener("keydown", (event)=>{
    if (event.code === "KeyV" && event.shiftKey){
      event.preventDefault();
      makePanel();
      root.classList.toggle("svr-open");
    }
  });
}

function boot(){
  if (isPreview()) return;
  makePanel();
  hookNav();
  runAudit();
  setTimeout(runAudit, 5500);
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot, { once: true });
else boot();
