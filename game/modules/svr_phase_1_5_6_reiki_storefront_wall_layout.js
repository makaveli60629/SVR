(function(){
  const BUILD = "VERSION-1.5.6-REIKI-STOREFRONT-WALL-LAYOUT";
  window.SVR_BUILD_LABEL = BUILD;

  const ASSETS = {
    founder: "./assets/presentation/shyona_royston.png",
    banner: "./assets/presentation/trueitive_banner.png",
    ad: "./assets/presentation/trueitive_ad.png",
    video: "./assets/presentation/trueitive_hologram.mp4",
    moon: "./assets/textures/moon.jpg",
    mars: "./assets/textures/mars.jpg"
  };

  const WALL = {
    // Approximate north/Reiki storefront wall presentation coordinates.
    // These keep the red carpet clear by putting all material on/near the wall plane.
    x: 0,
    y: 4.7,
    z: -18,
    rotY: 0
  };

  const SLIDES = [
    { title:"TRUEITIVE REIKI", sub:"Presentation Review", body:"Founder profile, approved service details, video hologram, and private Reiki room entry.", kind:"cover" },
    { title:"SHYONA ROYSTON", sub:"Founder Profile", body:"Approved founder photo and website-approved biography slot. Add approved image at assets/presentation/shyona_royston.png.", kind:"founder" },
    { title:"TRUEITIVE BANNER", sub:"Partner Display", body:"Approved banner/ad slot. Add approved banner at assets/presentation/trueitive_banner.png.", kind:"banner" },
    { title:"VIDEO HOLOGRAM", sub:"Long Frame", body:"Approved video plays inside a long frame without stretching the face.", kind:"video" },
    { title:"ENTER REIKI ROOM", sub:"Private VR Room", body:"Teleport route to private Reiki meditation room.", kind:"enter" }
  ];

  let slideIndex = 0;
  let wallGroup = null;
  let slideCanvas = null;
  let slideTexture = null;
  let videoPlane = null;
  let lastScene = null;

  function hideBadOverlays(){
    ["svr153ReikiCarousel","svr154ReikiHud","svr155TrueitiveHud"].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.opacity = "0";
        el.style.pointerEvents = "none";
        el.setAttribute("data-svr156-hidden-overlay","true");
      }
    });

    document.querySelectorAll("button,a,.panel,.card,.portal,[data-route],[data-portal],[data-destination]").forEach(el => {
      if (el.closest("#svr156StoreControls")) return;
      const t = String([el.textContent, el.id, el.className, el.getAttribute && el.getAttribute("href")].join(" ")).toLowerCase();
      if (
        t.includes("reiki hologram carousel") ||
        t.includes("riki hologram carousel") ||
        t.includes("open reiki") ||
        t.includes("phase 103 trueitive reiki final") ||
        t.includes("trueitive presentation")
      ) {
        el.style.display = "none";
        el.style.visibility = "hidden";
        el.style.pointerEvents = "none";
        el.setAttribute("data-svr156-hidden-old-label","true");
      }
    });
  }

  function addMinimalControls(){
    if(document.getElementById("svr156StoreControls")) return;
    const style = document.createElement("style");
    style.id = "svr156StoreControlsStyle";
    style.textContent = `
      #svr156StoreControls{
        position:fixed;
        right:max(12px, env(safe-area-inset-right));
        top:78px;
        z-index:2147483100;
        display:flex;
        gap:8px;
        font-family:Consolas,system-ui,sans-serif;
      }
      #svr156StoreControls button{
        border:1px solid rgba(0,255,213,.55);
        border-radius:12px;
        background:rgba(0,0,0,.55);
        color:#eaffff;
        padding:8px 10px;
        font-weight:900;
        font-size:12px;
      }
      @media(max-width:900px){
        #svr156StoreControls{top:54px;right:8px;transform:scale(.86);transform-origin:top right}
      }
    `;
    document.head.appendChild(style);
    const box = document.createElement("div");
    box.id = "svr156StoreControls";
    box.innerHTML = '<button type="button" id="svr156Prev">â€¹ Reiki Slide</button><button type="button" id="svr156Next">Reiki Slide â€º</button><button type="button" id="svr156Enter">Enter Room</button>';
    document.body.appendChild(box);
    document.getElementById("svr156Prev").onclick = () => setSlide(slideIndex - 1);
    document.getElementById("svr156Next").onclick = () => setSlide(slideIndex + 1);
    document.getElementById("svr156Enter").onclick = () => { location.href = "./reiki.html?v=1-5-6"; };
  }

  function getScene(){
    for (const k of ["scene","SVR_SCENE","svrScene"]) {
      if (window[k] && window[k].add && window[k].traverse) return window[k];
    }
    if (window.world && window.world.scene && window.world.scene.add) return window.world.scene;
    if (window.SVR_WORLD && window.SVR_WORLD.scene && window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }

  function canvasTexture(title, sub, body, approval){
    const c = document.createElement("canvas");
    c.width = 2048;
    c.height = 1024;
    const ctx = c.getContext("2d");

    ctx.fillStyle = "rgba(0,6,10,0.94)";
    ctx.fillRect(0,0,c.width,c.height);

    const grad = ctx.createLinearGradient(0,0,c.width,0);
    grad.addColorStop(0,"rgba(0,255,213,.25)");
    grad.addColorStop(.5,"rgba(120,80,255,.22)");
    grad.addColorStop(1,"rgba(0,255,213,.10)");
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,c.width,128);

    ctx.strokeStyle = "rgba(0,255,213,.85)";
    ctx.lineWidth = 8;
    ctx.strokeRect(18,18,c.width-36,c.height-36);

    ctx.fillStyle = "#ff3333";
    ctx.font = "bold 54px Consolas, monospace";
    ctx.textAlign = "right";
    ctx.fillText("WAITING FOR APPROVAL", c.width-64, 82);

    ctx.fillStyle = "#00ffd5";
    ctx.font = "bold 52px Consolas, monospace";
    ctx.textAlign = "left";
    ctx.fillText(sub.toUpperCase(), 64, 82);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 106px Consolas, monospace";
    wrap(ctx, title, 64, 260, c.width-128, 114);

    ctx.fillStyle = "#dfffff";
    ctx.font = "44px Consolas, monospace";
    wrap(ctx, body, 64, 470, c.width-128, 60);

    ctx.fillStyle = "rgba(255,255,255,.55)";
    ctx.font = "28px Consolas, monospace";
    ctx.fillText("Manual slides only â€¢ swipe/controller buttons â€¢ no floor signs â€¢ red carpet clear", 64, c.height-64);

    const tx = new THREE.CanvasTexture(c);
    tx.needsUpdate = true;
    return { canvas:c, texture:tx };
  }

  function wrap(ctx, text, x, y, maxWidth, lineHeight){
    const words = String(text).split(" ");
    let line = "";
    for (let n=0; n<words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && n > 0) {
        ctx.fillText(line, x, y);
        line = words[n] + " ";
        y += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, y);
  }

  function makeMaterialFromImage(url, fallbackColor){
    let map = null;
    try { map = new THREE.TextureLoader().load(url); } catch(e) {}
    return new THREE.MeshBasicMaterial({
      color: map ? 0xffffff : fallbackColor,
      map: map,
      transparent: true,
      opacity: 0.98,
      side: THREE.DoubleSide,
      depthWrite: false
    });
  }

  function buildWall(scene){
    if(!window.THREE || !scene || wallGroup) return;

    wallGroup = new THREE.Group();
    wallGroup.name = "SVR_TRUEITIVE_REIKI_WALL_LAYOUT_PHASE_1_5_6";
    wallGroup.position.set(WALL.x, WALL.y, WALL.z);
    wallGroup.rotation.y = WALL.rotY;
    wallGroup.userData.SVR_REIKI_PRESENTATION_WALL = true;

    // Glass-frame style arch/header.
    const frameMat = new THREE.MeshBasicMaterial({ color:0x00ffd5, transparent:true, opacity:.38, side:THREE.DoubleSide });
    const backMat = new THREE.MeshBasicMaterial({ color:0x001114, transparent:true, opacity:.44, side:THREE.DoubleSide, depthWrite:false });

    const back = new THREE.Mesh(new THREE.PlaneGeometry(12.8, 6.4), backMat);
    back.position.set(0, 0, -0.04);
    back.name = "SVR_REIKI_GLASS_BACKING";
    wallGroup.add(back);

    function bar(name,x,y,w,h){
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w,h), frameMat);
      m.name = name; m.position.set(x,y,0.02); wallGroup.add(m); return m;
    }
    bar("SVR_REIKI_TOP_ARCH_BAR",0,3.25,13.2,.16);
    bar("SVR_REIKI_BOTTOM_FRAME_BAR",0,-3.25,13.2,.12);
    bar("SVR_REIKI_LEFT_FRAME_BAR",-6.6,0,.16,6.5);
    bar("SVR_REIKI_RIGHT_FRAME_BAR",6.6,0,.16,6.5);

    // Main center slide: one page at a time.
    const slideTex = canvasTexture(SLIDES[0].title, SLIDES[0].sub, SLIDES[0].body, true);
    slideCanvas = slideTex.canvas;
    slideTexture = slideTex.texture;
    const slide = new THREE.Mesh(
      new THREE.PlaneGeometry(5.2, 2.65),
      new THREE.MeshBasicMaterial({ map: slideTexture, transparent:true, side:THREE.DoubleSide, depthWrite:false })
    );
    slide.name = "SVR_REIKI_MANUAL_SLIDE_FRAME";
    slide.position.set(0, .2, .06);
    wallGroup.add(slide);

    // Founder portrait/frame left.
    const founder = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 3.05), makeMaterialFromImage(ASSETS.founder, 0x111827));
    founder.name = "SVR_TRUEITIVE_FOUNDER_PHOTO_FRAME";
    founder.position.set(-4.25, .05, .07);
    wallGroup.add(founder);

    const founderLabelTex = canvasTexture("FOUNDER", "SHYONA ROYSTON", "Approved founder profile and website information frame.", true);
    const founderLabel = new THREE.Mesh(new THREE.PlaneGeometry(2.25,.75), new THREE.MeshBasicMaterial({map:founderLabelTex.texture,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
    founderLabel.name = "SVR_TRUEITIVE_FOUNDER_INFO_LABEL";
    founderLabel.position.set(-4.25,-2.15,.08);
    wallGroup.add(founderLabel);

    // Banner/ad frame right.
    const banner = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.45), makeMaterialFromImage(ASSETS.banner, 0x101820));
    banner.name = "SVR_TRUEITIVE_BANNER_FRAME";
    banner.position.set(4.25, 1.0, .07);
    wallGroup.add(banner);

    const ad = new THREE.Mesh(new THREE.PlaneGeometry(2.55, 1.45), makeMaterialFromImage(ASSETS.ad, 0x101820));
    ad.name = "SVR_TRUEITIVE_AD_FRAME";
    ad.position.set(4.25, -1.0, .07);
    wallGroup.add(ad);

    // Video frame kept long and contain-fit by using video texture when available.
    videoPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.85, 3.15), new THREE.MeshBasicMaterial({ color:0x080018, transparent:true, opacity:.95, side:THREE.DoubleSide, depthWrite:false }));
    videoPlane.name = "SVR_TRUEITIVE_LONG_VIDEO_HOLOGRAM_FRAME";
    videoPlane.position.set(0, -1.75, .09);
    videoPlane.visible = false;
    wallGroup.add(videoPlane);

    scene.add(wallGroup);
    lastScene = scene;
    setSlide(0);
  }

  function setSlide(n){
    slideIndex = (n + SLIDES.length) % SLIDES.length;
    const s = SLIDES[slideIndex];

    if (slideTexture && slideCanvas) {
      const fresh = canvasTexture(s.title, s.sub, s.body, true);
      const slideMesh = wallGroup && wallGroup.getObjectByName("SVR_REIKI_MANUAL_SLIDE_FRAME");
      if (slideMesh) slideMesh.material.map = fresh.texture;
      slideTexture = fresh.texture;
    }

    if (videoPlane) {
      videoPlane.visible = s.kind === "video";
      if (s.kind === "video") attachVideoTexture();
    }
  }

  function attachVideoTexture(){
    if(!videoPlane || !window.THREE) return;
    if(videoPlane.userData.SVR_VIDEO_ATTACHED) return;

    const v = document.createElement("video");
    v.src = ASSETS.video;
    v.muted = true;
    v.loop = true;
    v.playsInline = true;
    v.crossOrigin = "anonymous";
    v.style.display = "none";
    document.body.appendChild(v);

    v.addEventListener("loadeddata", () => {
      try {
        const tx = new THREE.VideoTexture(v);
        tx.needsUpdate = true;
        videoPlane.material = new THREE.MeshBasicMaterial({ map: tx, side:THREE.DoubleSide, transparent:true, depthWrite:false });
        videoPlane.userData.SVR_VIDEO_ATTACHED = true;
        v.play().catch(()=>{});
      } catch(e) {}
    }, { once:true });

    v.addEventListener("error", () => {
      videoPlane.material = new THREE.MeshBasicMaterial({ color:0x240030, transparent:true, opacity:.94, side:THREE.DoubleSide, depthWrite:false });
    }, { once:true });

    v.play().catch(()=>{});
  }

  function cleanupFloorAndCarpet(){
    const scene = getScene();
    if(!scene || !scene.traverse) return;

    scene.traverse(obj => {
      const ud = obj.userData || {};
      const name = String((obj.name || "") + " " + JSON.stringify(ud || {})).toLowerCase();

      // Hide old floor text / spinning carousel / bottom presentation clutter.
      if (
        name.includes("reiki hologram carousel") ||
        name.includes("open reiki hologram carousel") ||
        name.includes("phase 103 trueitive reiki final") ||
        name.includes("floor sign") ||
        name.includes("carousel spinner")
      ) {
        obj.visible = false;
        obj.userData = obj.userData || {};
        obj.userData.SVR_PHASE156_HIDDEN_FLOOR_CLUTTER = true;
      }

      // Red carpet clear: hide plant-like objects near center walkway only.
      const plantLike = name.includes("plant") || name.includes("pot") || name.includes("fern");
      if (plantLike && obj.position && Math.abs(obj.position.x) < 1.6 && obj.position.z > -9 && obj.position.z < 3) {
        obj.visible = false;
        obj.userData = obj.userData || {};
        obj.userData.SVR_PHASE156_RED_CARPET_CLEAR = true;
      }
    });
  }

  function lockSky(){
    const scene = getScene();
    if(!scene || !scene.traverse || !window.THREE) return;

    const moons = [];
    const mars = [];
    scene.traverse(obj => {
      const ud = obj.userData || {};
      const mat = obj.material || {};
      const t = String((obj.name || "") + " " + JSON.stringify(ud) + " " + (mat.name || "")).toLowerCase();
      if(t.includes("moon") || ud.SVR_REAL_PLANET === "moon") moons.push(obj);
      if(t.includes("mars") || ud.SVR_REAL_PLANET === "mars") mars.push(obj);
    });

    function tx(url){ try { return new THREE.TextureLoader().load(url); } catch(e) { return null; } }
    function make(kind,pos,scale,url,color){
      const mat = new THREE.MeshStandardMaterial({ color, map:tx(url)||null, roughness:.9, emissive:color, emissiveIntensity: kind === "moon" ? .12 : .08 });
      const m = new THREE.Mesh(new THREE.SphereGeometry(1,64,32), mat);
      m.name = "SVR_REAL_" + kind.toUpperCase() + "_PHASE_1_5_6";
      m.position.set(pos[0],pos[1],pos[2]);
      m.scale.setScalar(scale);
      m.visible = true;
      m.frustumCulled = false;
      m.userData.SVR_REAL_PLANET = kind;
      m.userData.SVR_1_5_6_SKY_LOCK = true;
      scene.add(m);
      return m;
    }

    function score(o){
      const mat = o.material || {};
      const ud = o.userData || {};
      return (ud.SVR_REAL_PLANET || ud.SVR_1_5_6_SKY_LOCK ? 300 : 0) + (mat.map ? 100 : 0) + (o.isMesh ? 10 : 0) + (o.visible ? 5 : 0);
    }

    function keep(kind,list,pos,scale,url,color){
      const k = list.slice().sort((a,b)=>score(b)-score(a))[0] || make(kind,pos,scale,url,color);
      list.forEach(o => {
        if(o === k) return;
        const mat = o.material || {};
        const ud = o.userData || {};
        if(!mat.map && !ud.SVR_DO_NOT_REMOVE && !ud.SVR_REAL_PLANET){
          o.visible = false;
          if(o.parent) o.parent.remove(o);
        }
      });
      k.visible = true;
      k.frustumCulled = false;
      if(k.position && k.position.set) k.position.set(pos[0],pos[1],pos[2]);
      if(k.scale && k.scale.setScalar) k.scale.setScalar(scale);
      k.userData = k.userData || {};
      k.userData.SVR_REAL_PLANET = kind;
      k.userData.SVR_1_5_6_SKY_LOCK = true;
    }

    keep("moon", moons, [-120, 520, -900], 108, ASSETS.moon, 0xf3ead8);
    keep("mars", mars, [-28, 545, -1020], 54, ASSETS.mars, 0xc96a3b);
  }

  function tryBuild(){
    hideBadOverlays();
    addMinimalControls();
    const scene = getScene();
    if(scene){
      buildWall(scene);
      cleanupFloorAndCarpet();
      lockSky();
    }
  }

  document.addEventListener("DOMContentLoaded", tryBuild);
  window.addEventListener("load", () => setTimeout(tryBuild, 700));
  setInterval(tryBuild, 2500);

  console.log("[SVR]", BUILD, "loaded: 3D Reiki storefront wall layout, no global popup overlay");
})();
