(function(){
  const BUILD = "VERSION-1.7.5-COSMIC-VIBEZ-SINGLE-RUNTIME-LOCK";
  const ROOT_ID = "svr.module.single-runtime.phase175";
  const SKY_ID = "svr.module.cosmic.primary";
  const THEATER_ID = "svr.module.theater.vibez.storefront.primary";
  const LOBBY_ID = "svr.module.lobby.polish.primary";
  window.SVR_BUILD_LABEL = BUILD;

  const COSMIC = {
    moon: { name:"SVR_LOCKED_MOON_CLOSE_SKY_1_7_5", position:[0,180,-400], scale:[50,50,50], color:0xffffff,
      textures:["./assets/textures/moon.jpg","./assets/moon.jpg","./textures/moon.jpg","./moon.jpg"] },
    mars: { name:"SVR_LOCKED_MARS_CLOSE_SKY_1_7_5", position:[150,220,-350], scale:[35,35,35], color:0xff6d42,
      textures:["./assets/textures/mars.jpg","./assets/mars.jpg","./textures/mars.jpg","./mars.jpg"] }
  };

  function log(){ try{ console.log.apply(console,["[SVR 1.7.5]"].concat(Array.from(arguments))); }catch(e){} }

  function installBadges(){
    let badge=document.getElementById("svr175DeployBadge");
    if(!badge){
      badge=document.createElement("div"); badge.id="svr175DeployBadge";
      badge.style.cssText="position:fixed;left:10px;top:10px;z-index:2147483647;background:linear-gradient(135deg,rgba(0,0,0,.94),rgba(25,0,50,.94));border:2px solid #20ffb0;border-radius:12px;box-shadow:0 0 24px rgba(32,255,176,.6);color:#eaffff;font:900 12px Arial,sans-serif;padding:10px 12px;pointer-events:none;max-width:390px";
      document.body.appendChild(badge);
    }
    badge.innerHTML="<div style='color:#20ffb0'>SVR SINGLE RUNTIME LOCK ACTIVE</div><div>"+BUILD+"</div><div style='color:#ffe69a;font-size:11px;margin-top:4px'>Duplicate lobby/sky versions disabled.</div>";

    let pos=document.getElementById("svr175PositionDisplayAlways");
    if(!pos){
      pos=document.createElement("div"); pos.id="svr175PositionDisplayAlways";
      pos.style.cssText="position:fixed;left:10px;bottom:10px;z-index:2147483647;min-width:315px;background:rgba(0,0,0,.84);border:2px solid #9b6cff;border-radius:12px;box-shadow:0 0 22px rgba(155,108,255,.55);color:#eaffff;font:900 11px Consolas,monospace;padding:10px 12px;pointer-events:none;white-space:pre-line";
      document.body.appendChild(pos);
      function update(){
        let p={x:0,y:0,z:0}, yaw=0;
        try{
          const rig=document.querySelector("#rig")||document.querySelector("#playerRig")||document.querySelector("[camera-rig]");
          const cam=document.querySelector("[camera]")||document.querySelector("a-camera");
          if(rig&&rig.object3D){p=rig.object3D.position; yaw=rig.object3D.rotation.y*180/Math.PI;}
          else if(cam&&cam.object3D){const v=new THREE.Vector3(); cam.object3D.getWorldPosition(v); p=v; yaw=cam.object3D.rotation.y*180/Math.PI;}
        }catch(e){}
        pos.textContent="BUILD: "+BUILD+"\nPOSITION DISPLAY: ALWAYS ON\nPLAYER X/Y/Z: "+Number(p.x||0).toFixed(2)+" / "+Number(p.y||0).toFixed(2)+" / "+Number(p.z||0).toFixed(2)+"\nYAW: "+Number(yaw||0).toFixed(1)+"Â°\nMOON: 0,180,-400 | SCALE 50\nMARS: 150,220,-350 | SCALE 35\nVIBEZ THEATER: WEST SIDE LOCKED";
        requestAnimationFrame(update);
      }
      update();
    }
  }

  function getScene(){
    const af=document.querySelector("a-scene");
    if(af&&af.object3D&&af.object3D.add) return af.object3D;
    for(const k of ["scene","SVR_SCENE","svrScene"]){ if(window[k]&&window[k].add) return window[k]; if(window[k]&&window[k].object3D&&window[k].object3D.add) return window[k].object3D; }
    if(window.world&&window.world.scene&&window.world.scene.add) return window.world.scene;
    if(window.SVR_WORLD&&window.SVR_WORLD.scene&&window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }

  function mat(color,opacity,intensity){ return new THREE.MeshStandardMaterial({color,transparent:opacity<1,opacity,roughness:.28,metalness:.08,emissive:color,emissiveIntensity:intensity==null?.12:intensity,side:THREE.DoubleSide}); }
  function basic(color,opacity){ return new THREE.MeshBasicMaterial({color,transparent:opacity<1,opacity,side:THREE.DoubleSide,depthWrite:false}); }
  function box(w,h,d,color,opacity,intensity){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(color,opacity==null?1:opacity,intensity)); }
  function text(msg,w,h,px,color){
    const c=document.createElement("canvas"); c.width=2048; c.height=1024;
    const ctx=c.getContext("2d"); ctx.clearRect(0,0,c.width,c.height); ctx.textAlign="center"; ctx.textBaseline="middle"; ctx.fillStyle=color||"#fff"; ctx.shadowColor=color||"#fff"; ctx.shadowBlur=24; ctx.font="900 "+px+"px Arial Black, Arial, sans-serif";
    const lines=String(msg).split("\n"), lh=px*1.18; lines.forEach((line,i)=>ctx.fillText(line,c.width/2,c.height/2+(i-(lines.length-1)/2)*lh));
    const tex=new THREE.CanvasTexture(c); if(THREE.SRGBColorSpace) tex.colorSpace=THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  }
  function panel(title,body,w,h,accent){ const g=new THREE.Group(); g.add(box(w,h,.12,0x03030a,.92,.05)); const top=box(w+.18,.08,.16,accent||0xffcc66,1,.28); top.position.y=h/2+.07; g.add(top); const bot=box(w+.18,.055,.16,0x00eaff,1,.22); bot.position.y=-h/2-.055; g.add(bot); const t=text(title,w*.96,h*.25,116,"#ffe69a"); t.position.set(0,h*.30,.09); g.add(t); const b=text(body,w*.92,h*.68,62,"#eaffff"); b.position.set(0,-h*.10,.10); g.add(b); return g; }

  function removeOld(scene){
    const remove=[], hide=[];
    scene.traverse(o=>{
      const n=String(o.name||""), id=(o.userData||{}).SVR_MODULE_ID||"", nl=n.toLowerCase();
      if(n.includes("SVR_LOBBY_POLISH_1_7_")||n.includes("SVR_VIBES_THEATER_")||n.includes("SVR_VIBEZ_THEATER_")||n.includes("SVR_LOCKED_MOON_")||n.includes("SVR_LOCKED_MARS_")||id===ROOT_ID||id===LOBBY_ID||id===THEATER_ID||id===SKY_ID){ remove.push(o); return; }
      if((/moon|mars|celestial|planet/.test(nl))&&!n.includes("1_7_5")) hide.push(o);
    });
    remove.forEach(o=>{ if(o.parent) o.parent.remove(o); });
    hide.forEach(o=>{ o.visible=false; o.userData=o.userData||{}; o.userData.SVR_HIDDEN_BY_PHASE_1_7_5_SINGLE_RUNTIME=true; });
    log("cleanup removed",remove.length,"hid",hide.length);
  }

  function loadTexture(list, cb){
    if(!THREE.TextureLoader){cb(null);return;} let i=0; const loader=new THREE.TextureLoader();
    function next(){ if(i>=list.length){cb(null);return;} const url=list[i++]; loader.load(url,tex=>{ if(THREE.SRGBColorSpace) tex.colorSpace=THREE.SRGBColorSpace; cb(tex); },undefined,next); }
    next();
  }
  function planet(root,cfg){
    const s=new THREE.Mesh(new THREE.SphereGeometry(1,64,32),new THREE.MeshBasicMaterial({color:cfg.color}));
    s.name=cfg.name; s.userData.SVR_MODULE_ID=SKY_ID; s.userData.SVR_PLANET_LOCK=true; s.position.set(...cfg.position); s.scale.set(...cfg.scale); root.add(s);
    const halo=new THREE.Mesh(new THREE.SphereGeometry(1.07,48,24),new THREE.MeshBasicMaterial({color:cfg.color,transparent:true,opacity:.14,side:THREE.BackSide,depthWrite:false}));
    halo.name=cfg.name+"_HALO"; halo.position.copy(s.position); halo.scale.set(cfg.scale[0]*1.22,cfg.scale[1]*1.22,cfg.scale[2]*1.22); halo.userData.SVR_MODULE_ID=SKY_ID; root.add(halo);
    loadTexture(cfg.textures,tex=>{ if(tex){s.material.map=tex; s.material.color.set(0xffffff); s.material.needsUpdate=true;} });
    return s;
  }
  function cosmic(scene){
    const root=new THREE.Group(); root.name="SVR_COSMIC_ENVIRONMENT_LAYER_1_7_5"; root.userData.SVR_MODULE_ID=SKY_ID; root.userData.SVR_LOCKED=true;
    const sky=new THREE.Mesh(new THREE.SphereGeometry(500,48,24),new THREE.MeshBasicMaterial({color:0x03000d,side:THREE.BackSide})); sky.name="SVR_DEEP_PURPLE_SKY_DOME_1_7_5"; root.add(sky);
    const geom=new THREE.BufferGeometry(), pts=[], cols=[];
    for(let i=0;i<650;i++){ const r=430+Math.random()*50, th=Math.random()*Math.PI*2, y=70+Math.random()*260, x=Math.cos(th)*r, z=Math.sin(th)*r-80; pts.push(x,y,z); const c=new THREE.Color(i%5===0?0x9b6cff:i%7===0?0x66f5ff:0xffffff); cols.push(c.r,c.g,c.b); }
    geom.setAttribute("position",new THREE.Float32BufferAttribute(pts,3)); geom.setAttribute("color",new THREE.Float32BufferAttribute(cols,3)); root.add(new THREE.Points(geom,new THREE.PointsMaterial({size:1.6,vertexColors:true,transparent:true,opacity:.92,depthWrite:false})));
    const moon=planet(root,COSMIC.moon), mars=planet(root,COSMIC.mars); scene.add(root);
    function tick(){ moon.rotation.y+=.00045; mars.rotation.y+=.00065; requestAnimationFrame(tick); } tick();
  }

  function theater(scene){
    const g=new THREE.Group(); g.name="SVR_VIBEZ_THEATER_1_7_5_ROOT"; g.userData.SVR_MODULE_ID=THEATER_ID; g.userData.SVR_LOCKED=true; g.userData.SVR_ROUTE="/game/?scene=vibez-theater"; g.position.set(-9.2,2.55,-4.8); g.rotation.y=Math.PI/2;
    g.add(box(8.4,5.2,.24,0x05020b,.92,.08));
    const top=box(8.75,.16,.32,0xffcc66,1,.28); top.position.set(0,2.72,.08); g.add(top); const bot=box(8.75,.12,.32,0x00eaff,1,.22); bot.position.set(0,-2.72,.08); g.add(bot);
    const marquee=box(7.5,1.05,.36,0x170020,.96,.20); marquee.position.set(0,2.05,.18); g.add(marquee);
    const title=text("SVR VIBEZ THEATER",4.95,1.08,124,"#ffe69a"); title.position.set(0,2.08,.40); g.add(title);
    const sub=text("VR CINEMA â€¢ STORIES â€¢ PREMIERES",4.65,.55,76,"#9fffff"); sub.position.set(0,1.38,.42); g.add(sub);
    const screen=box(4.9,2.18,.18,0x070011,.96,.10); screen.position.set(0,-.38,.22); g.add(screen);
    const st=text("COMING SOON\nCOMMUNITY STORIES\nFEATURE SCREENINGS",4.6,1.9,86,"#ffffff"); st.position.set(0,-.38,.43); g.add(st);
    const portal=box(3.0,.78,.18,0x001b24,.90,.25); portal.position.set(0,-2.10,.35); g.add(portal); const pt=text("ENTER VR CINEMA",2.7,.55,92,"#aaffff"); pt.position.set(0,-2.10,.56); g.add(pt);
    const carpet=box(3.8,.04,4.1,0x8b001a,.88,.05); carpet.position.set(0,-2.75,2.35); g.add(carpet);
    scene.add(g);
  }

  function lobby(scene){
    const root=new THREE.Group(); root.name="SVR_LOBBY_POLISH_1_7_5_ROOT_SINGLE"; root.userData.SVR_MODULE_ID=LOBBY_ID;
    const confirm=panel("SVR SINGLE RUNTIME ACTIVE","VIBEZ Theater â€¢ Cosmic Lock â€¢ Position Display\nOld 1.7.2 / 1.7.3 / 1.7.4 overlays removed.",6.4,1.58,0x20ffb0); confirm.position.set(0,3.18,2.9); confirm.rotation.y=Math.PI; root.add(confirm);
    const dir=panel("SVR LOBBY DIRECTORY","POKER TABLE\nREIKI / RICI PREVIEW\nPGA GOLF HUB\nVIBEZ THEATER\nSMOKER LOUNGE\nSCORPION ROOM\nVR STORE",4.3,3.0,0x00eaff); dir.position.set(-4.7,2.65,2.55); dir.rotation.y=Math.PI*.86; root.add(dir);
    const rings=[{l:"POKER",x:0,z:-2.8,c:0xffd36a,r:2.05},{l:"REIKI / RICI",x:6.5,z:-7.0,c:0xa66cff,r:1.55},{l:"PGA",x:6.6,z:5.0,c:0x39ff88,r:1.45},{l:"VIBEZ THEATER",x:-7.4,z:-4.7,c:0xffcc66,r:1.55},{l:"SCORPION",x:-6.4,z:5.2,c:0xff4b35,r:1.35},{l:"LOUNGE",x:-2.4,z:7.2,c:0xc58a52,r:1.15},{l:"VR STORE",x:2.5,z:7.2,c:0x66f5ff,r:1.15}];
    const ringMeshes=[]; rings.forEach((p,i)=>{ const ring=new THREE.Mesh(new THREE.RingGeometry(p.r*.74,p.r,96),basic(p.c,.52)); ring.position.set(p.x,.06,p.z); ring.rotation.x=-Math.PI/2; ring.renderOrder=999; root.add(ring); ringMeshes.push(ring); const label=text("ENTER\n"+p.l,1.6,.58,124,"#ffffff"); label.position.set(p.x,.09,p.z+p.r+.32); label.rotation.x=-Math.PI/2; label.renderOrder=1000; root.add(label); });
    scene.add(root); function pulse(){ const t=performance.now()*.003; ringMeshes.forEach((r,i)=>{ r.material.opacity=.42+Math.sin(t+i*.55)*.10; const s=1+Math.sin(t+i*.4)*.055; r.scale.set(s,s,s); }); requestAnimationFrame(pulse); } pulse();
  }

  let applied=false;
  function apply(){
    installBadges();
    if(applied) return true;
    const scene=getScene();
    if(!scene||!window.THREE){ log("waiting for scene"); return false; }
    removeOld(scene); cosmic(scene); theater(scene); lobby(scene); applied=true;
    window.SVR_175_AUDIT={build:BUILD,loaded:true,singleRuntime:true,positionDisplayAlways:true,moon:COSMIC.moon,mars:COSMIC.mars,vibezTheater:true,timestamp:new Date().toISOString()};
    log("loaded", window.SVR_175_AUDIT);
    return true;
  }
  document.addEventListener("DOMContentLoaded",apply); window.addEventListener("load",()=>setTimeout(apply,350)); [850,1600,2800,4500,7000].forEach(ms=>setTimeout(apply,ms)); setInterval(installBadges,5000);
  window.SVR_175_COSMIC_VIBEZ_SINGLE_RUNTIME_LOCK={build:BUILD,apply,cosmic:COSMIC};
})();
