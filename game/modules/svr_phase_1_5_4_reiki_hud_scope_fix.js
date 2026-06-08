(function(){
  const BUILD = "VERSION-1.5.4-REIKI-HUD-SCOPE-FIX";
  window.SVR_BUILD_LABEL = BUILD;

  const REIKI_ROOM_URL = "./reiki.html?v=1-5-4";
  const REIKI_WORDS = ["reiki", "riki", "zen den", "wellness"];

  const slides = [
    { id:"approval", tag:"Approval Lock", title:"AWAITING APPROVAL", body:"This Reiki storefront is staged for review. Public founder media, partner branding, and final service content remain approval-gated.", cta:"Review" },
    { id:"founder", tag:"Founder Profile", title:"Founder / Practitioner", body:"Approved founder photo, name, website information, credentials, and biography belong here after written approval. Until then, this stays as an SVR placeholder.", cta:"Profile" },
    { id:"video", tag:"Hologram Frame", title:"Video Hologram", body:"The approved video should fit inside a long vertical hologram frame without stretching the face. This frame plays only on the video slide.", cta:"Video" },
    { id:"info", tag:"Reiki Session Info", title:"Session / Booking Concept", body:"Future approved services can explain group sessions, private sessions, remote partner routing, and follow-up booking logic.", cta:"Info" },
    { id:"enter", tag:"Private VR Room", title:"Enter Reiki Room", body:"Open the private Reiki meditation room. The lobby storefront stays clean; the full experience loads in the private room.", cta:"Enter" }
  ];

  let current = 0;
  let hudOpen = false;

  function norm(s){ return String(s || "").toLowerCase(); }
  function isReikiText(s){ const t = norm(s); return REIKI_WORDS.some(w => t.includes(w)); }

  function addStyle(){
    if (document.getElementById("svr154Style")) return;
    const st = document.createElement("style");
    st.id = "svr154Style";
    st.textContent = `
      body:not(.svr154-reiki-hud-open) #svr153ReikiCarousel,
      body.svr154-reiki-hud-open #svr153ReikiCarousel {
        display:none !important; visibility:hidden !important; opacity:0 !important; pointer-events:none !important;
      }
      #svr154ReikiHud {
        position: fixed; right: max(14px, env(safe-area-inset-right)); top: 78px; z-index: 2147483000;
        width: min(420px, 34vw); max-height: calc(100vh - 110px); color:#eaffff;
        font-family: Consolas, system-ui, sans-serif; pointer-events:auto;
      }
      #svr154ReikiHud .svr154-tab {
        display:flex; align-items:center; justify-content:space-between; gap:8px; width:100%;
        border:1px solid rgba(0,255,213,.62); border-radius:14px; background:rgba(0,0,0,.72);
        color:#eaffff; padding:10px 12px; font-weight:900; letter-spacing:.06em; box-shadow:0 0 18px rgba(0,255,213,.18);
      }
      #svr154ReikiHud .svr154-panel {
        display:none; margin-top:8px; border:1px solid rgba(0,255,213,.48); border-radius:16px;
        background:rgba(0,0,0,.76); box-shadow:0 0 24px rgba(0,255,213,.16), inset 0 0 24px rgba(130,60,255,.10); overflow:hidden;
      }
      body.svr154-reiki-hud-open #svr154ReikiHud .svr154-panel { display:block; }
      #svr154ReikiHud .svr154-head { display:flex; justify-content:space-between; align-items:center; gap:8px; padding:9px 12px; border-bottom:1px solid rgba(255,255,255,.12); background:linear-gradient(90deg, rgba(0,255,213,.14), rgba(150,80,255,.14)); }
      #svr154ReikiHud .svr154-title { font-weight:900; letter-spacing:.12em; font-size:12px; }
      #svr154ReikiHud .svr154-approval { color:#ff4444; font-weight:900; font-size:11px; text-shadow:0 0 8px rgba(255,0,0,.45); }
      #svr154ReikiHud .svr154-body { padding:14px; }
      #svr154ReikiHud .svr154-tag { color:#00ffd5; text-transform:uppercase; letter-spacing:.12em; font-size:11px; }
      #svr154ReikiHud h3 { margin:7px 0 8px; font-size:20px; }
      #svr154ReikiHud p { margin:0; line-height:1.45; color:#dfffff; font-size:13px; }
      #svr154ReikiHud .svr154-videoFrame { display:none; margin-top:12px; height:170px; border:1px solid rgba(0,255,213,.38); border-radius:14px; background:radial-gradient(circle at center, rgba(0,255,213,.18), rgba(10,0,30,.75)); overflow:hidden; position:relative; }
      #svr154ReikiHud .svr154-videoFrame::before { content:"LONG HOLOGRAM FRAME"; position:absolute; left:10px; top:8px; color:rgba(234,255,255,.58); font-size:10px; letter-spacing:.1em; z-index:1; }
      #svr154ReikiHud .svr154-videoFrame video { width:100%; height:100%; object-fit:contain !important; object-position:center center !important; display:block; }
      #svr154ReikiHud[data-slide="video"] .svr154-videoFrame { display:block; }
      #svr154ReikiHud .svr154-controls { display:flex; gap:7px; align-items:center; justify-content:space-between; padding:10px 12px 12px; }
      #svr154ReikiHud button { border:1px solid rgba(0,255,213,.58); border-radius:12px; background:rgba(0,0,0,.55); color:#eaffff; padding:8px 10px; font-weight:900; cursor:pointer; }
      #svr154ReikiHud .svr154-enter { border-color:rgba(255,80,80,.8); background:rgba(110,0,0,.42); }
      #svr154ReikiHud .svr154-dots { display:flex; gap:5px; align-items:center; justify-content:center; flex:1; }
      #svr154ReikiHud .svr154-dot { width:8px; height:8px; border-radius:50%; background:rgba(255,255,255,.25); }
      #svr154ReikiHud .svr154-dot.active { background:#00ffd5; box-shadow:0 0 8px #00ffd5; }
      #svr154AndroidSmartControls { display:none; }
      body.svr154-smart-device #svr154AndroidSmartControls { display:block; }
      @media (max-width: 900px) {
        #svr154ReikiHud { width:min(320px, 42vw); top:56px; right:8px; }
        #svr154ReikiHud .svr154-body { padding:10px; }
        #svr154ReikiHud h3 { font-size:16px; }
        #svr154ReikiHud p { font-size:11px; }
        #svr154ReikiHud .svr154-videoFrame { height:120px; }
        #svr154ReikiHud .svr154-tab { padding:8px 10px; font-size:12px; }
      }
    `;
    document.head.appendChild(st);
  }

  function removeGlobalPopup(){
    const old = document.getElementById("svr153ReikiCarousel");
    if (old) {
      old.style.display = "none";
      old.style.visibility = "hidden";
      old.style.opacity = "0";
      old.style.pointerEvents = "none";
      old.setAttribute("data-svr154-disabled-global-popup", "true");
    }
    document.querySelectorAll("button,a,.panel,.card,.portal,[data-route],[data-portal],[data-destination]").forEach(el => {
      if (el.closest("#svr154ReikiHud")) return;
      const txt = [el.textContent, el.id, el.className, el.getAttribute && el.getAttribute("href")].join(" ");
      const t = norm(txt);
      if (t.includes("reiki hologram carousel") || t.includes("riki hologram carousel") || t.includes("open reiki hologram carousel") || t.includes("phase 103 trueitive reiki final")) {
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
        el.setAttribute("data-svr154-hidden-old-reiki-label", "true");
      }
    });
  }

  function findExistingReikiVideo(){
    const videos = Array.from(document.querySelectorAll("video"));
    return videos.find(v => isReikiText((v.id || "") + " " + (v.src || "") + " " + (v.className || ""))) || null;
  }

  function createHud(){
    if (document.getElementById("svr154ReikiHud")) return;
    const hud = document.createElement("div");
    hud.id = "svr154ReikiHud";
    hud.setAttribute("data-slide", "approval");
    hud.innerHTML = `
      <button type="button" class="svr154-tab"><span>REIKI STOREFRONT HUD</span><span style="color:#ff4444">APPROVAL</span></button>
      <div class="svr154-panel">
        <div class="svr154-head"><div class="svr154-title">SVR REIKI HUD STOREFRONT</div><div class="svr154-approval">WAITING FOR APPROVAL</div></div>
        <div class="svr154-body"><div class="svr154-tag"></div><h3></h3><p></p><div class="svr154-videoFrame" id="svr154VideoFrame"></div></div>
        <div class="svr154-controls"><button type="button" class="svr154-prev">â€¹ Slide</button><div class="svr154-dots"></div><button type="button" class="svr154-next">Slide â€º</button><button type="button" class="svr154-enter">Enter</button></div>
      </div>`;
    document.body.appendChild(hud);

    hud.querySelector(".svr154-tab").onclick = () => setHudOpen(!hudOpen);
    hud.querySelector(".svr154-prev").onclick = () => setSlide(current - 1);
    hud.querySelector(".svr154-next").onclick = () => setSlide(current + 1);
    hud.querySelector(".svr154-enter").onclick = () => {
      if (slides[current].id === "enter") location.href = REIKI_ROOM_URL;
      else setSlide(slides.findIndex(s => s.id === "enter"));
    };

    let x0 = null;
    hud.addEventListener("touchstart", ev => { if (ev.touches && ev.touches[0]) x0 = ev.touches[0].clientX; }, { passive:true });
    hud.addEventListener("touchend", ev => {
      if (x0 === null || !ev.changedTouches || !ev.changedTouches[0]) return;
      const dx = ev.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 45) setSlide(current + (dx < 0 ? 1 : -1));
    }, { passive:true });

    setSlide(0);
  }

  function setHudOpen(open){
    hudOpen = !!open;
    document.body.classList.toggle("svr154-reiki-hud-open", hudOpen);
    removeGlobalPopup();
  }

  function setSlide(n){
    const hud = document.getElementById("svr154ReikiHud");
    if (!hud) return;
    current = (n + slides.length) % slides.length;
    const slide = slides[current];
    hud.setAttribute("data-slide", slide.id);
    hud.querySelector(".svr154-tag").textContent = slide.tag;
    hud.querySelector("h3").textContent = slide.title;
    hud.querySelector("p").textContent = slide.body;
    hud.querySelector(".svr154-enter").textContent = slide.id === "enter" ? "Enter Reiki Room" : slide.cta;

    const dots = hud.querySelector(".svr154-dots");
    dots.innerHTML = "";
    slides.forEach((_, i) => {
      const d = document.createElement("span");
      d.className = "svr154-dot" + (i === current ? " active" : "");
      d.onclick = () => setSlide(i);
      dots.appendChild(d);
    });

    if (slide.id === "video") attachVideoToLongFrame();
  }

  function attachVideoToLongFrame(){
    const frame = document.getElementById("svr154VideoFrame");
    if (!frame) return;
    if (!frame.querySelector("video")) {
      const existing = findExistingReikiVideo();
      if (existing) {
        try {
          const clone = existing.cloneNode(true);
          clone.controls = true;
          clone.muted = true;
          clone.loop = true;
          clone.style.objectFit = "contain";
          clone.style.width = "100%";
          clone.style.height = "100%";
          frame.appendChild(clone);
          clone.play().catch(()=>{});
        } catch(e) {}
      } else {
        frame.innerHTML = '<div style="height:100%;display:flex;align-items:center;justify-content:center;color:#eaffff;font-weight:900;letter-spacing:.08em;text-align:center;padding:10px;">APPROVED VIDEO FRAME<br><span style="font-size:11px;color:#00ffd5">No video file detected yet</span></div>';
      }
    }
    frame.querySelectorAll("video").forEach(v => {
      try {
        v.style.objectFit = "contain";
        v.style.objectPosition = "center center";
        v.muted = true;
        v.loop = true;
        v.play().catch(()=>{});
      } catch(e) {}
    });
  }

  function bindReikiPortalTriggers(){
    document.querySelectorAll("button,a,[data-route],[data-portal],[data-destination],.portal,.hotspot").forEach(el => {
      if (el.closest("#svr154ReikiHud")) return;
      const txt = [el.textContent, el.id, el.className, el.getAttribute && el.getAttribute("href"), el.getAttribute && el.getAttribute("data-route")].join(" ");
      if (!isReikiText(txt)) return;
      if (!el.dataset) return;
      if (el.dataset.svr154Bound) return;
      el.dataset.svr154Bound = "true";
      el.addEventListener("click", ev => {
        const raw = norm(txt);
        if (raw.includes("room") || raw.includes("enter") || raw.includes("escape")) return;
        ev.preventDefault();
        setHudOpen(true);
      }, true);
    });
  }

  function markSmartDeviceOnly(){
    const smart = /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent || "") || Math.min(innerWidth, innerHeight) < 760;
    document.body.classList.toggle("svr154-smart-device", smart);
    document.body.classList.toggle("svr154-desktop-device", !smart);
    ["svrAndroidPad","svrAndroidTurn","svrAndroidPlayHud"].forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      if (!smart) el.style.display = "none";
    });
  }

  function init(){
    addStyle();
    createHud();
    removeGlobalPopup();
    bindReikiPortalTriggers();
    markSmartDeviceOnly();
    setHudOpen(false);
    console.log("[SVR]", BUILD, "active: global Reiki popup removed; scoped storefront HUD only");
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", () => setTimeout(init, 500));
  window.addEventListener("resize", markSmartDeviceOnly);
  setInterval(() => { removeGlobalPopup(); bindReikiPortalTriggers(); markSmartDeviceOnly(); }, 2000);
})();
