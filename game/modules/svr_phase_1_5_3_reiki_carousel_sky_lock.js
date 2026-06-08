(function(){
  const BUILD = "VERSION-1.5.3-REIKI-CAROUSEL-SKY-LOCK";
  window.SVR_BUILD_LABEL = BUILD;

  const REIKI_ROOM_URL = "./reiki.html?v=1-5-3";
  const slides = [
    {
      id: "approval",
      title: "AWAITING APPROVAL",
      tag: "Approval Lock",
      body: "This wellness presentation area is staged for review. Partner branding, founder media, and final service content remain approval-gated before public release.",
      cta: "Review Mode"
    },
    {
      id: "founder",
      title: "Founder / Practitioner Profile",
      tag: "Presentation Slide",
      body: "Founder image and biography panel are reserved for the approved Reiki partner presentation. Use approved photo and written biography only after consent.",
      cta: "Profile Pending"
    },
    {
      id: "wellness",
      title: "Reiki Wellness Experience",
      tag: "Education Slide",
      body: "A clean introduction to Reiki, energy work, meditation, private sessions, and future group wellness experiences inside SVR.",
      cta: "Learn"
    },
    {
      id: "video",
      title: "Hologram Video Preview",
      tag: "Video Slide",
      body: "When the video slide is reached, the approved hologram video starts automatically. The sound and video stay local to this portal module.",
      cta: "Auto Play"
    },
    {
      id: "teleport",
      title: "Enter Reiki Room",
      tag: "Private VR Room",
      body: "Teleport to the private Reiki meditation room. The lobby storefront remains clean and the full experience loads in its own room.",
      cta: "Enter Room"
    }
  ];

  function norm(s){ return String(s || "").toLowerCase(); }

  function isReikiText(text){
    const t = norm(text);
    return t.includes("reiki") || t.includes("riki") || t.includes("zen den") || t.includes("wellness");
  }

  function makeStyles(){
    if (document.getElementById("svr153Style")) return;
    const s = document.createElement("style");
    s.id = "svr153Style";
    s.textContent = `
      .svr153-hidden-clutter {
        display:none !important;
        visibility:hidden !important;
        pointer-events:none !important;
      }

      #svr153ReikiCarousel {
        position: fixed;
        left: 50%;
        bottom: 5.5vh;
        transform: translateX(-50%);
        z-index: 2147482600;
        width: min(700px, 88vw);
        border: 1px solid rgba(0,255,213,.48);
        border-radius: 18px;
        background: rgba(0,0,0,.72);
        box-shadow: 0 0 28px rgba(0,255,213,.20), inset 0 0 24px rgba(130,60,255,.12);
        color: #eaffff;
        font-family: Consolas, system-ui, sans-serif;
        overflow: hidden;
        touch-action: pan-y;
      }

      #svr153ReikiCarousel .head {
        display:flex;
        align-items:center;
        justify-content:space-between;
        gap:10px;
        padding: 10px 14px;
        background: linear-gradient(90deg, rgba(0,255,213,.18), rgba(145,80,255,.16));
        border-bottom: 1px solid rgba(255,255,255,.12);
      }

      #svr153ReikiCarousel .brand {
        font-weight: 900;
        letter-spacing: .12em;
      }

      #svr153ReikiCarousel .approval {
        color: #ff4444;
        font-weight: 900;
        text-shadow: 0 0 8px rgba(255,0,0,.45);
      }

      #svr153ReikiCarousel .body {
        padding: 16px;
        min-height: 128px;
      }

      #svr153ReikiCarousel .tag {
        display:inline-block;
        color:#00ffd5;
        font-size:12px;
        letter-spacing:.12em;
        text-transform:uppercase;
        margin-bottom:8px;
      }

      #svr153ReikiCarousel h2 {
        margin: 0 0 8px;
        font-size: clamp(20px, 3.6vw, 32px);
      }

      #svr153ReikiCarousel p {
        margin: 0;
        line-height: 1.45;
        color: #d7ffff;
      }

      #svr153ReikiCarousel .controls {
        display:flex;
        gap:8px;
        align-items:center;
        justify-content:space-between;
        padding: 10px 14px 14px;
      }

      #svr153ReikiCarousel button {
        border: 1px solid rgba(0,255,213,.62);
        border-radius: 12px;
        background: rgba(0,0,0,.58);
        color: #eaffff;
        padding: 9px 12px;
        font-weight: 900;
      }

      #svr153ReikiCarousel .dots {
        display:flex;
        gap:6px;
        align-items:center;
        justify-content:center;
        flex:1;
      }

      #svr153ReikiCarousel .dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        background: rgba(255,255,255,.25);
      }

      #svr153ReikiCarousel .dot.active {
        background: #00ffd5;
        box-shadow: 0 0 10px #00ffd5;
      }

      #svr153ReikiCarousel .enter {
        border-color: rgba(255,80,80,.75);
        color: #fff;
        background: rgba(120,0,0,.42);
      }

      @media (max-width: 820px) and (orientation: landscape) {
        #svr153ReikiCarousel {
          width: min(560px, 72vw);
          bottom: 4vh;
          font-size: 12px;
        }
        #svr153ReikiCarousel .body { min-height: 84px; padding: 12px; }
        #svr153ReikiCarousel h2 { font-size: 20px; }
        #svr153ReikiCarousel p { font-size: 12px; }
      }
    `;
    document.head.appendChild(s);
  }

  let current = 0;

  function makeCarousel(){
    if (document.getElementById("svr153ReikiCarousel")) return;

    const box = document.createElement("div");
    box.id = "svr153ReikiCarousel";
    box.innerHTML = `
      <div class="head">
        <div class="brand">SVR REIKI STOREFRONT</div>
        <div class="approval">WAITING FOR APPROVAL</div>
      </div>
      <div class="body">
        <span class="tag"></span>
        <h2></h2>
        <p></p>
      </div>
      <div class="controls">
        <button type="button" class="prev">â€¹ Slide</button>
        <div class="dots"></div>
        <button type="button" class="next">Slide â€º</button>
        <button type="button" class="enter">Enter</button>
      </div>
    `;
    document.body.appendChild(box);

    let x0 = null;
    box.addEventListener("touchstart", ev => {
      if (ev.touches && ev.touches[0]) x0 = ev.touches[0].clientX;
    }, { passive:true });
    box.addEventListener("touchend", ev => {
      if (x0 === null || !ev.changedTouches || !ev.changedTouches[0]) return;
      const dx = ev.changedTouches[0].clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 45) setSlide(current + (dx < 0 ? 1 : -1));
    }, { passive:true });

    box.querySelector(".prev").onclick = () => setSlide(current - 1);
    box.querySelector(".next").onclick = () => setSlide(current + 1);
    box.querySelector(".enter").onclick = () => {
      if (slides[current].id === "teleport") location.href = REIKI_ROOM_URL;
      else setSlide(slides.findIndex(s => s.id === "teleport"));
    };

    setSlide(0);
  }

  function setSlide(n){
    const box = document.getElementById("svr153ReikiCarousel");
    if (!box) return;

    current = (n + slides.length) % slides.length;
    const slide = slides[current];

    box.querySelector(".tag").textContent = slide.tag;
    box.querySelector("h2").textContent = slide.title;
    box.querySelector("p").textContent = slide.body;
    box.querySelector(".enter").textContent = slide.id === "teleport" ? "Enter Reiki Room" : slide.cta;

    const dots = box.querySelector(".dots");
    dots.innerHTML = "";
    slides.forEach((_, i) => {
      const d = document.createElement("span");
      d.className = "dot" + (i === current ? " active" : "");
      d.onclick = () => setSlide(i);
      dots.appendChild(d);
    });

    if (slide.id === "video") startApprovedVideo();
  }

  function startApprovedVideo(){
    const vids = Array.from(document.querySelectorAll("video"));
    const video = vids.find(v => isReikiText((v.id || "") + " " + (v.src || "") + " " + (v.className || "")));
    if (video) {
      try {
        video.muted = true;
        video.loop = true;
        video.play().catch(()=>{});
      } catch(e) {}
    }
  }

  function clearCarpetClutter(){
    document.querySelectorAll("button,a,[data-route],[data-portal],[data-destination],.panel,.card,.hotspot,.portal").forEach(el => {
      if (el.closest("#svr153ReikiCarousel")) return;
      const text = [el.textContent, el.id, el.className, el.getAttribute && el.getAttribute("href")].join(" ");
      if (isReikiText(text)) return;
      if (norm(text).includes("pga") || norm(text).includes("store") || norm(text).includes("smoker") || norm(text).includes("lounge")) {
        el.classList.add("svr153-hidden-clutter");
      }
    });

    const roots = [];
    ["scene","SVR_SCENE","svrScene","world","SVR_WORLD"].forEach(k => { if (window[k]) roots.push(window[k]); });

    roots.forEach(scene => {
      if (!scene || !scene.traverse) return;

      const moonObjs = [];
      const marsObjs = [];

      scene.traverse(obj => {
        const ud = obj.userData || {};
        const name = norm((obj.name || "") + " " + JSON.stringify(ud || ""));
        if (name.includes("moon")) moonObjs.push(obj);
        if (name.includes("mars")) marsObjs.push(obj);

        const heavy = name.includes("pga") || name.includes("smoker") || name.includes("store room") || name.includes("old portal");
        if (heavy && !name.includes("reiki")) {
          obj.visible = false;
          obj.userData = obj.userData || {};
          obj.userData.SVR_PHASE153_HIDDEN_CLUTTER = true;
        }
      });

      function scorePlanet(obj){
        const mat = obj.material || {};
        const ud = obj.userData || {};
        let score = 0;
        if (ud.SVR_REAL_PLANET || ud.SVR_1_5_3_SKY_LOCK || ud.SVR_1_5_2_SKY_LOCK || ud.SVR_1_4G_SKY_LOCK) score += 200;
        if (mat.map) score += 90;
        if (mat.normalMap || mat.roughnessMap || mat.emissiveMap) score += 20;
        if (obj.isMesh) score += 10;
        return score;
      }

      function lockPlanet(kind, list, pos, scale){
        if (!list.length) return;
        const keep = list.slice().sort((a,b)=>scorePlanet(b)-scorePlanet(a))[0];

        list.forEach(obj => {
          if (obj === keep) return;
          const mat = obj.material || {};
          const ud = obj.userData || {};
          const locked = ud.SVR_DO_NOT_REMOVE || ud.SVR_REAL_PLANET;
          if (!mat.map && !locked) {
            obj.visible = false;
            if (obj.parent) obj.parent.remove(obj);
          }
        });

        keep.visible = true;
        keep.frustumCulled = false;
        if (keep.position && keep.position.set) keep.position.set(pos[0], pos[1], pos[2]);
        if (keep.scale && keep.scale.setScalar) keep.scale.setScalar(scale);
        keep.userData = keep.userData || {};
        keep.userData.SVR_REAL_PLANET = kind;
        keep.userData.SVR_1_5_3_SKY_LOCK = true;
      }

      lockPlanet("moon", moonObjs, [-86, 430, -760], 96);
      lockPlanet("mars", marsObjs, [-38, 455, -860], 48);
    });
  }

  function init(){
    makeStyles();
    makeCarousel();
    document.body.classList.add("svr153-reiki-sealed-storefront");
    clearCarpetClutter();

    window.dispatchEvent(new CustomEvent("svr-ready", { detail: { build: BUILD, source: "phase153" }}));
    window.dispatchEvent(new CustomEvent("SVR_READY", { detail: { build: BUILD, source: "phase153" }}));

    console.log("[SVR]", BUILD, "active: carousel storefront, red carpet clear, sky planet lock");
  }

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("load", () => setTimeout(init, 500));
  setInterval(clearCarpetClutter, 2500);
})();
