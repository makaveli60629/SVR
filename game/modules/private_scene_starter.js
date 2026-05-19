// PHASE-125-PRIVATE-SCENE-INTERACTION-POLISH-LOCK
// Game-side only. Adds lightweight interactive polish to private routes
// while keeping the full experiences separate from the main lobby.

const PHASE = "PHASE-125-PRIVATE-SCENE-INTERACTION-POLISH-LOCK";
let score = 0;
let sessionCount = 0;

function sceneData(){
  const b = document.body;
  return {
    title: b.dataset.title || "SVR Private Scene",
    kicker: b.dataset.kicker || "SVR PRIVATE WORLD",
    subtitle: b.dataset.subtitle || "Private scene route for a separate SVR experience.",
    object: b.dataset.object || "PRIVATE SCENE",
    detail: b.dataset.detail || "Environment route active.",
    status: b.dataset.status || "INTERACTION PASS",
    list: (b.dataset.list || "Separate from lobby|Game-side only|Ready for future 3D build").split("|")
  };
}
function kind(title){
  const t = String(title || "").toLowerCase();
  if (t.includes("reiki")) return "reiki";
  if (t.includes("driving")) return "drive";
  if (t.includes("chip") || t.includes("putt")) return "green";
  if (t.includes("store")) return "store";
  if (t.includes("lounge")) return "lounge";
  if (t.includes("scorpion")) return "scorpion";
  return "generic";
}
function roomObjects(k){
  if (k === "reiki") return ["ZEN MAT", "BREATH TIMER", "APPROVAL SAFE"];
  if (k === "drive") return ["STAND MAT", "BALL", "TARGET"];
  if (k === "green") return ["GREEN", "CUP", "AIM LINE"];
  if (k === "store") return ["PORTAL", "ITEM PREVIEW", "CART TEST"];
  if (k === "lounge") return ["SEATING", "MEDIA WALL", "SOCIAL ZONE"];
  if (k === "scorpion") return ["POKER TABLE", "BOT SEATS", "CARD ZONE"];
  return ["PORTAL", "ROOM", "READY"];
}
function sceneActions(k){
  if (k === "reiki") return [["start", "Start Calm Session"], ["breathe", "Breath Pulse"], ["safe", "Approval Check"]];
  if (k === "drive") return [["swing", "Demo Swing"], ["target", "Target Check"], ["reset", "Reset Ball"]];
  if (k === "green") return [["putt", "Demo Putt"], ["chip", "Demo Chip"], ["reset", "Reset Green"]];
  if (k === "store") return [["preview", "Preview Item"], ["banner", "Banner Slot"], ["cart", "Cart Test"]];
  if (k === "lounge") return [["seat", "Reserve Seat"], ["media", "Media Wall"], ["moderate", "Mod Check"]];
  if (k === "scorpion") return [["open", "Open Poker Room"], ["table", "Table Check"], ["bots", "Bot Seats"]];
  return [["health", "Scene Health"], ["pulse", "Pulse"], ["reset", "Reset"]];
}
function actionText(k, action){
  sessionCount += 1;
  if (k === "reiki"){
    if (action === "start") return "Calm session started. Reiki route remains SVR-branded and approval-safe.";
    if (action === "breathe") return "Breath pulse active: inhale 4, hold 4, exhale 6.";
    return "Approval check passed: no unapproved Reiki sponsor/founder branding is live.";
  }
  if (k === "drive"){
    if (action === "swing"){ score = Math.min(100, 62 + Math.floor(Math.random() * 38)); return `Demo swing complete. Drive accuracy ${score}%.`; }
    if (action === "target") return "Target lane active. Stand mat / ball / target flow is ready for real 3D gameplay wiring.";
    return "Ball reset to stand-mat position.";
  }
  if (k === "green"){
    if (action === "putt"){ score = Math.min(100, 55 + Math.floor(Math.random() * 45)); return `Demo putt rolled. Cup line ${score}%.`; }
    if (action === "chip") return "Demo chip launched toward green. Short-game station ready for scoring module.";
    return "Green reset. Cup and aim line are clear.";
  }
  if (k === "store"){
    if (action === "preview") return "Store item preview active. Ready for catalog/database wiring later.";
    if (action === "banner") return "Banner wearable slot marked for avatar attachment workflow.";
    return "Cart test local-only. Backend checkout remains disabled until approved.";
  }
  if (k === "lounge"){
    if (action === "seat") return "Private lounge seat reserved locally for this test session.";
    if (action === "media") return "Media wall placeholder active. Audio/video integration can be wired next.";
    return "Moderator check placeholder active. No real backend privileges granted.";
  }
  if (k === "scorpion"){
    if (action === "open") { location.href = "./scorpion.html?v=phase125-route"; return "Opening Scorpion poker room..."; }
    if (action === "table") return "Scorpion table route exists. Phase 124 gameplay wiring is available.";
    return "Five bot-seat layout locked for Scorpion private poker.";
  }
  return "Scene interaction test complete.";
}
function css(){
  const s = document.createElement("style");
  s.textContent = `
    html,body{height:100%;margin:0;background:radial-gradient(circle at 50% 14%,rgba(100,60,180,.34),transparent 35%),linear-gradient(#040407,#080815 48%,#020204);color:#f6f3ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;overflow:hidden}*{box-sizing:border-box}.stars{position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.52) 0 1px,transparent 1px),radial-gradient(circle,rgba(127,245,199,.28) 0 1px,transparent 1px);background-size:84px 84px,132px 132px;opacity:.34;animation:drift 36s linear infinite}.moon,.mars{position:fixed;border-radius:50%;box-shadow:0 0 38px currentColor}.moon{right:12%;top:10%;width:74px;height:74px;background:#d9d6cc;color:#d9d6cc}.mars{left:13%;top:17%;width:52px;height:52px;background:#c86d43;color:#c86d43}.wrap{position:fixed;inset:0;display:grid;place-items:center;padding:20px}.card{width:min(1040px,calc(100vw - 32px));min-height:min(710px,calc(100vh - 32px));border:1px solid rgba(127,245,199,.44);border-radius:28px;background:linear-gradient(135deg,rgba(5,8,16,.88),rgba(22,10,44,.90));box-shadow:0 30px 90px rgba(0,0,0,.6),inset 0 0 60px rgba(127,245,199,.05);overflow:hidden;position:relative}.head{display:flex;justify-content:space-between;gap:18px;padding:28px;border-bottom:1px solid rgba(255,255,255,.08)}.k{font-size:12px;font-weight:900;letter-spacing:.18em;color:#7ff5c7}.badge{border:1px solid rgba(246,226,127,.5);border-radius:999px;padding:8px 12px;color:#f6e27f;font-size:12px;font-weight:900;white-space:nowrap}h1{margin:8px 0;font-size:clamp(32px,5vw,60px);line-height:.95}.sub{max-width:710px;color:rgba(246,243,255,.76);font-size:18px;line-height:1.35}.grid{display:grid;grid-template-columns:1.28fr .72fr;gap:20px;padding:24px 28px 96px}.panel{border:1px solid rgba(180,140,255,.26);border-radius:20px;background:rgba(0,0,0,.22);padding:18px}.stage{min-height:404px;display:grid;place-items:center;position:relative;overflow:hidden;perspective:700px}.stage:before{content:"";position:absolute;left:-12%;right:-12%;bottom:-20%;height:70%;background:linear-gradient(rgba(127,245,199,.09) 1px,transparent 1px),linear-gradient(90deg,rgba(127,245,199,.09) 1px,transparent 1px);background-size:42px 42px;transform:rotateX(64deg);transform-origin:bottom;opacity:.75}.wall{position:absolute;inset:22px 22px 44%;border:1px solid rgba(180,140,255,.18);border-bottom:0;border-radius:18px 18px 0 0;background:radial-gradient(circle at 50% 25%,rgba(127,245,199,.09),transparent 45%)}.portal{position:relative;width:min(420px,74vw);height:235px;border:1px solid rgba(127,245,199,.46);border-radius:28px;background:linear-gradient(135deg,rgba(127,245,199,.12),rgba(180,140,255,.18));display:grid;place-items:center;text-align:center;padding:20px;box-shadow:0 0 52px rgba(127,245,199,.18),inset 0 0 44px rgba(180,140,255,.10);transform:rotateX(3deg) translateZ(10px);transition:.25s}.portal.active{transform:rotateX(3deg) translateZ(10px) scale(1.03);box-shadow:0 0 72px rgba(246,226,127,.28),inset 0 0 44px rgba(180,140,255,.14)}.portal strong{display:block;color:#7ff5c7;font-size:26px;letter-spacing:.08em;text-transform:uppercase}.portal span{display:block;margin-top:8px;color:rgba(246,243,255,.76)}.prop{position:absolute;border:1px solid rgba(246,226,127,.38);background:rgba(246,226,127,.08);color:#f6e27f;border-radius:999px;padding:7px 10px;font-weight:900;font-size:11px;box-shadow:0 0 18px rgba(246,226,127,.10)}.p1{left:8%;bottom:23%}.p2{right:8%;bottom:27%}.p3{left:50%;bottom:12%;transform:translateX(-50%)}a,button{border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(127,245,199,.08);color:#eafff4;padding:10px 14px;font-weight:900;text-decoration:none;cursor:pointer}button.alt,a.alt{border-color:rgba(180,140,255,.44);background:rgba(180,140,255,.08)}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}.scene-actions{display:grid;gap:9px;margin-top:12px}.scene-actions button{width:100%;border-radius:14px}li{margin:9px 0;color:rgba(246,243,255,.78)}.out{min-height:42px;color:#7ff5c7;font-weight:800}.meter{height:9px;border-radius:999px;background:rgba(255,255,255,.08);overflow:hidden;margin-top:12px}.fill{height:100%;width:0%;background:linear-gradient(90deg,#7ff5c7,#f6e27f);transition:.35s}.foot{position:absolute;left:28px;right:28px;bottom:24px;display:flex;justify-content:space-between;color:rgba(246,243,255,.56);font-size:12px}.reiki .portal{border-color:rgba(246,226,127,.46)}.drive .portal,.green .portal{border-color:rgba(127,245,199,.58)}.scorpion .portal{border-color:rgba(255,107,127,.48)}@keyframes drift{from{background-position:0 0,0 0}to{background-position:220px 140px,-180px 220px}}@media(max-width:760px){body{overflow:auto}.wrap{position:relative;min-height:100%}.card{min-height:auto}.head{display:block}.grid{grid-template-columns:1fr;padding-bottom:96px}.badge{display:inline-block;margin-top:10px}}
  `;
  document.head.appendChild(s);
}
function build(){
  css();
  const d = sceneData();
  const k = kind(d.title);
  const props = roomObjects(k);
  const actions = sceneActions(k);
  document.title = `${d.title} • SVR Poker`;
  document.body.classList.add(k);
  document.body.innerHTML = `
    <div class="stars"></div><div class="moon"></div><div class="mars"></div>
    <main class="wrap"><section class="card">
      <div class="head"><div><div class="k">${d.kicker}</div><h1>${d.title}</h1><div class="sub">${d.subtitle}</div></div><div class="badge">PHASE 125 INTERACTIVE</div></div>
      <div class="grid"><div class="panel stage"><div class="wall"></div><div class="prop p1">${props[0]}</div><div class="prop p2">${props[1]}</div><div class="prop p3">${props[2]}</div><div class="portal" id="portal"><div><strong>${d.object}</strong><span>${d.detail}</span></div></div></div>
      <aside class="panel"><h2>Private Interaction Panel</h2><p>This route is still separate from the main lobby, with lightweight test interactions for the next gameplay pass.</p><ul>${d.list.map(x=>`<li>${x}</li>`).join("")}</ul><div class="scene-actions">${actions.map(a=>`<button data-act="${a[0]}">${a[1]}</button>`).join("")}</div><div class="actions"><a href="./">Return Lobby</a><button class="alt" id="check">Scene Health</button></div><div class="meter"><div class="fill" id="fill"></div></div><p class="out" id="out">Ready for interaction test.</p></aside></div>
      <div class="foot"><span>${PHASE}</span><span>siteTouched: false • lobby untouched</span></div>
    </section></main>`;
  const out = document.getElementById("out");
  const fill = document.getElementById("fill");
  const portal = document.getElementById("portal");
  function show(text, amt = null){
    if (out) out.textContent = text;
    if (fill) fill.style.width = `${Math.max(8, Math.min(100, amt ?? (sessionCount * 17) % 100))}%`;
    portal?.classList.add("active");
    setTimeout(()=>portal?.classList.remove("active"), 450);
  }
  document.querySelectorAll("[data-act]").forEach(btn=>btn.addEventListener("click",()=>show(actionText(k, btn.dataset.act), score || null)));
  document.getElementById("check")?.addEventListener("click", ()=>show(`${d.title}: interactive private scene loaded, route separate, site untouched.`, 100));
  window.SVR_PHASE125_PRIVATE_SCENE_INTERACTION_POLISH = { phase: PHASE, scene: d.title, kind: k, siteTouched: false, actionText: (a)=>actionText(k,a) };
  window.SVR_PHASE117_PRIVATE_SCENE_3D_ENVIRONMENT = window.SVR_PHASE125_PRIVATE_SCENE_INTERACTION_POLISH;
  window.SVR_PHASE109_PRIVATE_SCENE_STARTER = window.SVR_PHASE125_PRIVATE_SCENE_INTERACTION_POLISH;
}
if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build, { once: true });
else build();
