// PHASE-109-PRIVATE-SCENE-STARTER-BUILDS-LOCK
// Game-side only. Lightweight private scene starter pages share this module.
// No website or /site files are touched.

const PHASE = "PHASE-109-PRIVATE-SCENE-STARTER-BUILDS-LOCK";

function sceneData(){
  const b = document.body;
  return {
    title: b.dataset.title || "SVR Private Scene",
    kicker: b.dataset.kicker || "SVR PRIVATE WORLD",
    subtitle: b.dataset.subtitle || "Starter build placeholder for a separate private scene route.",
    object: b.dataset.object || "PRIVATE SCENE",
    detail: b.dataset.detail || "Environment starter active.",
    status: b.dataset.status || "STARTER BUILD",
    list: (b.dataset.list || "Separate from lobby|Game-side only|Ready for future 3D build").split("|")
  };
}

function css(){
  const s = document.createElement("style");
  s.textContent = `
    html,body{height:100%;margin:0;background:radial-gradient(circle at 50% 16%,rgba(100,60,180,.32),transparent 35%),linear-gradient(#040407,#080815 48%,#020204);color:#f6f3ff;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;overflow:hidden}*{box-sizing:border-box}.stars{position:fixed;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,.5) 0 1px,transparent 1px);background-size:84px 84px;opacity:.32}.moon,.mars{position:fixed;border-radius:50%;box-shadow:0 0 38px currentColor}.moon{right:12%;top:10%;width:74px;height:74px;background:#d9d6cc;color:#d9d6cc}.mars{left:13%;top:17%;width:52px;height:52px;background:#c86d43;color:#c86d43}.wrap{position:fixed;inset:0;display:grid;place-items:center;padding:20px}.card{width:min(980px,calc(100vw - 32px));min-height:min(660px,calc(100vh - 32px));border:1px solid rgba(127,245,199,.44);border-radius:28px;background:linear-gradient(135deg,rgba(5,8,16,.88),rgba(22,10,44,.9));box-shadow:0 30px 90px rgba(0,0,0,.6);overflow:hidden;position:relative}.head{display:flex;justify-content:space-between;gap:18px;padding:28px;border-bottom:1px solid rgba(255,255,255,.08)}.k{font-size:12px;font-weight:900;letter-spacing:.18em;color:#7ff5c7}.badge{border:1px solid rgba(246,226,127,.5);border-radius:999px;padding:8px 12px;color:#f6e27f;font-size:12px;font-weight:900;white-space:nowrap}h1{margin:8px 0;font-size:clamp(32px,5vw,60px);line-height:.95}.sub{max-width:680px;color:rgba(246,243,255,.76);font-size:18px;line-height:1.35}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:20px;padding:24px 28px 88px}.panel{border:1px solid rgba(180,140,255,.26);border-radius:20px;background:rgba(0,0,0,.22);padding:18px}.stage{min-height:340px;display:grid;place-items:center;position:relative;overflow:hidden}.stage:before{content:"";position:absolute;inset:0;background:linear-gradient(rgba(127,245,199,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(127,245,199,.08) 1px,transparent 1px);background-size:42px 42px;transform:perspective(500px) rotateX(62deg) translateY(100px);transform-origin:bottom}.obj{position:relative;width:min(360px,74vw);height:210px;border:1px solid rgba(127,245,199,.44);border-radius:26px;background:linear-gradient(135deg,rgba(127,245,199,.12),rgba(180,140,255,.16));display:grid;place-items:center;text-align:center;padding:20px;box-shadow:0 0 46px rgba(127,245,199,.16)}.obj strong{display:block;color:#7ff5c7;font-size:24px;letter-spacing:.08em}.obj span{display:block;margin-top:8px;color:rgba(246,243,255,.74)}a,button{border:1px solid rgba(127,245,199,.45);border-radius:999px;background:rgba(127,245,199,.08);color:#eafff4;padding:10px 14px;font-weight:900;text-decoration:none;cursor:pointer}button.alt,a.alt{border-color:rgba(180,140,255,.44);background:rgba(180,140,255,.08)}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:18px}li{margin:9px 0;color:rgba(246,243,255,.78)}.foot{position:absolute;left:28px;right:28px;bottom:24px;display:flex;justify-content:space-between;color:rgba(246,243,255,.56);font-size:12px}@media(max-width:760px){body{overflow:auto}.wrap{position:relative;min-height:100%}.card{min-height:auto}.head{display:block}.grid{grid-template-columns:1fr;padding-bottom:96px}.badge{display:inline-block;margin-top:10px}}
  `;
  document.head.appendChild(s);
}

function build(){
  css();
  const d = sceneData();
  document.title = `${d.title} • SVR Poker`;
  document.body.innerHTML = `
    <div class="stars"></div><div class="moon"></div><div class="mars"></div>
    <main class="wrap"><section class="card">
      <div class="head"><div><div class="k">${d.kicker}</div><h1>${d.title}</h1><div class="sub">${d.subtitle}</div></div><div class="badge">${d.status}</div></div>
      <div class="grid"><div class="panel stage"><div class="obj"><div><strong>${d.object}</strong><span>${d.detail}</span></div></div></div>
      <aside class="panel"><h2>Scene Starter</h2><p>This private route is separate from the main lobby and ready for the next 3D build pass.</p><ul>${d.list.map(x=>`<li>${x}</li>`).join("")}</ul><div class="actions"><a href="./">Return Lobby</a><button class="alt" id="check">Scene Health</button></div><p id="out"></p></aside></div>
      <div class="foot"><span>${PHASE}</span><span>siteTouched: false</span></div>
    </section></main>`;
  document.getElementById("check")?.addEventListener("click", ()=>{
    document.getElementById("out").textContent = `${d.title}: route loaded, starter scene active, site untouched.`;
  });
  window.SVR_PHASE109_PRIVATE_SCENE_STARTER = { phase: PHASE, scene: d.title, siteTouched: false };
}

if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", build, { once: true });
else build();
