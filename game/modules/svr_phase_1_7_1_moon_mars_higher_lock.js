(function(){
  const BUILD = "VERSION-1.7.1-MOON-MARS-HIGHER-LOCK";
  window.SVR_BUILD_LABEL = BUILD;
  const SKY = {
    moon: { x:-900, y:12000, z:-9000, scale:900, color:0xf3ead8, url:"./assets/textures/moon.jpg", spin:0.00004 },
    mars: { x:950, y:12200, z:-10400, scale:900, color:0xc96a3b, url:"./assets/textures/mars.jpg", spin:0.00006 }
  };
  const state = { moon:null, mars:null, moonHalo:null, marsHalo:null, loop:false };
  function scene(){
    const af=document.querySelector("a-scene");
    if(af&&af.object3D&&af.object3D.traverse)return af.object3D;
    for(const k of ["scene","SVR_SCENE","svrScene"]){
      if(window[k]&&window[k].traverse)return window[k];
      if(window[k]&&window[k].object3D&&window[k].object3D.traverse)return window[k].object3D;
    }
    if(window.world&&window.world.scene)return window.world.scene;
    if(window.SVR_WORLD&&window.SVR_WORLD.scene)return window.SVR_WORLD.scene;
    return null;
  }
  function tex(url){ try{ const t=new THREE.TextureLoader().load(url); if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace; return t; }catch(e){ return null; } }
  function badge(){
    let b=document.getElementById("svr171BuildBadge");
    if(!b){ b=document.createElement("div"); b.id="svr171BuildBadge"; b.style.cssText="position:fixed;right:10px;top:8px;z-index:2147483600;border:1px solid rgba(0,255,213,.55);border-radius:10px;background:rgba(0,0,0,.72);color:#eaffff;font:700 11px Consolas,monospace;padding:6px 8px;pointer-events:none"; document.body.appendChild(b); }
    b.textContent="BUILD: "+BUILD;
  }
  function far(){
    document.querySelectorAll("[camera],a-camera").forEach(el=>{ try{ el.setAttribute("far","20000"); const c=el.components&&el.components.camera&&el.components.camera.camera; if(c){c.far=20000;c.updateProjectionMatrix();} }catch(e){} });
  }
  function make(s,key){
    const c=SKY[key];
    const mat=new THREE.MeshStandardMaterial({color:c.color,map:tex(c.url),roughness:.9,metalness:0,emissive:c.color,emissiveIntensity:key==="moon"?.14:.09});
    const m=new THREE.Mesh(new THREE.SphereGeometry(1,96,48),mat);
    m.name="SVR_REAL_"+key.toUpperCase()+"_PHASE_1_7_1_HIGHER";
    m.position.set(c.x,c.y,c.z); m.scale.setScalar(c.scale); m.visible=true; m.frustumCulled=false; m.renderOrder=700;
    m.userData.SVR_REAL_PLANET=key; m.userData.SVR_1_7_1_HIGHER=true; m.userData.SVR_PERMANENT_SKY_OBJECT=true;
    s.add(m);
    const h=new THREE.Mesh(new THREE.SphereGeometry(1.055,64,32), new THREE.MeshBasicMaterial({color:c.color,transparent:true,opacity:key==="moon"?.12:.08,depthWrite:false,side:THREE.DoubleSide}));
    h.name="SVR_"+key.toUpperCase()+"_HALO_PHASE_1_7_1"; h.position.copy(m.position); h.scale.setScalar(c.scale*1.08); h.visible=true; h.frustumCulled=false; h.renderOrder=699; h.userData.SVR_REAL_PLANET_HALO=key; h.userData.SVR_PERMANENT_SKY_OBJECT=true; s.add(h);
    state[key+"Halo"]=h; return m;
  }
  function lock(s,key){
    const list=[]; s.traverse(o=>{ const ud=o.userData||{}, mat=o.material||{}; const t=String((o.name||"")+" "+JSON.stringify(ud)+" "+(mat.name||"")).toLowerCase(); if(t.includes(key)||ud.SVR_REAL_PLANET===key)list.push(o); });
    let keep=list.find(o=>(o.userData||{}).SVR_1_7_1_HIGHER)||make(s,key);
    list.forEach(o=>{ if(o!==keep&&!((o.userData||{}).SVR_DO_NOT_REMOVE)){ o.visible=false; o.userData=o.userData||{}; o.userData.SVR_1_7_1_HIDDEN_LOWER_DUPLICATE=true; }});
    const c=SKY[key]; keep.visible=true; keep.frustumCulled=false; keep.position.set(c.x,c.y,c.z); keep.scale.setScalar(c.scale); keep.renderOrder=700; keep.userData.SVR_REAL_PLANET=key; keep.userData.SVR_1_7_1_HIGHER=true; keep.userData.SVR_PERMANENT_SKY_OBJECT=true;
    const h=state[key+"Halo"]; if(h){h.visible=true;h.position.copy(keep.position);h.scale.setScalar(c.scale*1.08);} state[key]=keep;
  }
  function cap(s){
    const c={minX:-2200,maxX:2200,minZ:-11500,maxZ:-650,maxY:145,maxScaleY:.52};
    s.traverse(o=>{ if(!o.position)return; const ud=o.userData||{}; if(ud.SVR_PERMANENT_SKY_OBJECT||ud.SVR_REAL_PLANET||ud.SVR_REAL_PLANET_HALO)return; const t=String((o.name||"")+" "+JSON.stringify(ud)).toLowerCase(); if(!(t.includes("building")||t.includes("tower")||t.includes("skyline")||t.includes("banner")||t.includes("megatron")||t.includes("sponsor")))return; const p=o.position; if(p.x>=c.minX&&p.x<=c.maxX&&p.z>=c.minZ&&p.z<=c.maxZ){ if(p.y>c.maxY)p.y=c.maxY; if(o.scale&&typeof o.scale.y==="number"&&o.scale.y>c.maxScaleY)o.scale.y=c.maxScaleY; } });
  }
  function apply(){ badge(); far(); const s=scene(); if(!s||!window.THREE)return; lock(s,"moon"); lock(s,"mars"); cap(s); if(!state.loop){state.loop=true;requestAnimationFrame(tick);} console.log("[SVR]",BUILD,"active"); }
  function tick(){ requestAnimationFrame(tick); far(); ["moon","mars"].forEach(key=>{ const o=state[key]; if(!o)return; const c=SKY[key]; o.visible=true; o.position.set(c.x,c.y,c.z); o.scale.setScalar(c.scale); if(o.rotation)o.rotation.y+=c.spin; const h=state[key+"Halo"]; if(h){h.visible=true;h.position.copy(o.position);h.scale.setScalar(c.scale*1.08);} }); }
  document.addEventListener("DOMContentLoaded",apply); window.addEventListener("load",()=>setTimeout(apply,700)); setInterval(apply,1000);
  window.SVR_171_MOON_MARS_HIGHER_LOCK={build:BUILD,sky:SKY,apply};
})();
