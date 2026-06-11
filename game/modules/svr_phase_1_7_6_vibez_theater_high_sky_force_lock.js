(function(){
  const BUILD = "VERSION-1.7.6-VIBEZ-THEATER-HIGH-SKY-FORCE-LOCK";
  const ROOT_ID = "svr.module.phase176.force.lock";
  const SKY_ID = "svr.module.cosmic.high-sky.force.primary";
  const THEATER_ID = "svr.module.theater.vibez.force-visible.primary";
  window.SVR_BUILD_LABEL = BUILD;
  window.SVR_PHASE_176_LOCK = true;

  const MOON = {pos:[0,240,-260], scale:[85,85,85], color:0xffffff};
  const MARS = {pos:[135,300,-235], scale:[62,62,62], color:0xff6944};

  function css(el, txt){ el.style.cssText = txt; }
  function installBadges(){
    let b=document.getElementById('svr176ForceBadge');
    if(!b){ b=document.createElement('div'); b.id='svr176ForceBadge'; document.body.appendChild(b); }
    css(b,'position:fixed;left:10px;top:10px;z-index:2147483647;background:linear-gradient(135deg,rgba(0,0,0,.94),rgba(34,0,60,.94));border:2px solid #20ffb0;border-radius:12px;box-shadow:0 0 24px rgba(32,255,176,.75);color:#eaffff;font:900 12px Arial,sans-serif;padding:10px 12px;pointer-events:none;max-width:450px');
    b.innerHTML='<div style="color:#20ffb0">SVR 1.7.6 FORCE LOCK ACTIVE</div><div>'+BUILD+'</div><div style="color:#ffe69a;font-size:11px;margin-top:4px">VIBEZ Theater forced visible â€¢ Moon/Mars raised â€¢ Position display locked.</div>';

    let p=document.getElementById('svr176PositionDisplayAlways');
    if(!p){ p=document.createElement('div'); p.id='svr176PositionDisplayAlways'; document.body.appendChild(p); }
    css(p,'position:fixed;left:10px;bottom:10px;z-index:2147483647;min-width:340px;max-width:470px;background:rgba(0,0,0,.84);border:2px solid #9b6cff;border-radius:12px;box-shadow:0 0 22px rgba(155,108,255,.58);color:#eaffff;font:900 11px Consolas,monospace;padding:10px 12px;pointer-events:none;white-space:pre-line');
    function pose(){
      let pos={x:0,y:0,z:0}, yaw=0;
      try{
        const rig=document.querySelector('#rig')||document.querySelector('#playerRig')||document.querySelector('[camera-rig]');
        const cam=document.querySelector('[camera]')||document.querySelector('a-camera');
        if(rig&&rig.object3D){ pos=rig.object3D.position; yaw=rig.object3D.rotation.y*180/Math.PI; }
        else if(cam&&cam.object3D&&window.THREE){ const v=new THREE.Vector3(); cam.object3D.getWorldPosition(v); pos=v; yaw=cam.object3D.rotation.y*180/Math.PI; }
      }catch(e){}
      p.textContent='BUILD: '+BUILD+'\nPOSITION DISPLAY: ALWAYS ON\nPLAYER X/Y/Z: '+Number(pos.x||0).toFixed(2)+' / '+Number(pos.y||0).toFixed(2)+' / '+Number(pos.z||0).toFixed(2)+'\nYAW: '+Number(yaw||0).toFixed(1)+'Â°\nMOON: 0,240,-260 | SCALE 85\nMARS: 135,300,-235 | SCALE 62\nVIBEZ THEATER: BIG LEFT-WALL BILLBOARD\nOLD BUILD BADGES: HIDDEN';
      requestAnimationFrame(pose);
    }
    if(!window.SVR_176_POSITION_LOOP_STARTED){ window.SVR_176_POSITION_LOOP_STARTED=true; pose(); }
  }

  function hideOldDomBadges(){
    try{ Array.from(document.querySelectorAll('div,span,button')).forEach(n=>{ const t=n.textContent||''; if(t.includes('VERSION-1.7.')&&!t.includes('VERSION-1.7.6')&&!n.closest('#svr176ForceBadge')&&!n.closest('#svr176PositionDisplayAlways')) n.style.display='none'; }); }catch(e){}
  }

  function scene(){
    const af=document.querySelector('a-scene'); if(af&&af.object3D&&af.object3D.add) return af.object3D;
    for(const k of ['scene','SVR_SCENE','svrScene']){ if(window[k]&&window[k].add) return window[k]; if(window[k]&&window[k].object3D&&window[k].object3D.add) return window[k].object3D; }
    if(window.world&&window.world.scene&&window.world.scene.add) return window.world.scene;
    if(window.SVR_WORLD&&window.SVR_WORLD.scene&&window.SVR_WORLD.scene.add) return window.SVR_WORLD.scene;
    return null;
  }

  function mat(c,o,i){ return new THREE.MeshStandardMaterial({color:c,transparent:o<1,opacity:o,roughness:.26,metalness:.1,emissive:c,emissiveIntensity:i==null?.14:i,side:THREE.DoubleSide}); }
  function basic(c,o){ return new THREE.MeshBasicMaterial({color:c,transparent:o<1,opacity:o,side:THREE.DoubleSide,depthWrite:false}); }
  function box(w,h,d,c,o,i){ return new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c,o==null?1:o,i)); }
  function text(msg,w,h,px,color){
    const c=document.createElement('canvas'); c.width=2048; c.height=1024; const x=c.getContext('2d');
    x.clearRect(0,0,c.width,c.height); x.textAlign='center'; x.textBaseline='middle'; x.fillStyle=color||'#fff'; x.shadowColor=color||'#fff'; x.shadowBlur=24; x.font='900 '+px+'px Arial Black, Arial, sans-serif';
    const lines=String(msg).split('\n'), lh=px*1.18; lines.forEach((line,i)=>x.fillText(line,c.width/2,c.height/2+(i-(lines.length-1)/2)*lh));
    const tex=new THREE.CanvasTexture(c); if(THREE.SRGBColorSpace) tex.colorSpace=THREE.SRGBColorSpace;
    return new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  }
  function load(paths, cb){ let i=0, l=new THREE.TextureLoader(); function n(){ if(i>=paths.length){cb(null);return;} l.load(paths[i++],t=>{ if(THREE.SRGBColorSpace)t.colorSpace=THREE.SRGBColorSpace; cb(t); },undefined,n); } n(); }

  function clean(s){
    const rm=[], hide=[];
    s.traverse(o=>{ const n=String(o.name||''), id=(o.userData||{}).SVR_MODULE_ID||'', low=n.toLowerCase();
      if(n.includes('SVR_LOBBY_POLISH_1_7_')||n.includes('SVR_VIBES_THEATER')||n.includes('SVR_VIBEZ_THEATER')||n.includes('SVR_LOCKED_MOON')||n.includes('SVR_LOCKED_MARS')||n.includes('SVR_COSMIC_')||id===ROOT_ID||id===THEATER_ID||id===SKY_ID){ rm.push(o); return; }
      if((/moon|mars|planet|celestial/.test(low))&&!n.includes('1_7_6')) hide.push(o);
    });
    rm.forEach(o=>{ if(o.parent) o.parent.remove(o); });
    hide.forEach(o=>{ o.visible=false; o.userData.SVR_HIDDEN_BY_176=true; });
    console.log('[SVR 1.7.6] cleaned',rm.length,'old objects; hid',hide.length,'duplicate planets');
  }

  function stars(root){
    const g=new THREE.BufferGeometry(), pts=[], colors=[];
    for(let i=0;i<900;i++){ const r=250+Math.random()*210, th=Math.random()*Math.PI*2, y=90+Math.random()*260, x=Math.cos(th)*r, z=Math.sin(th)*r-120; pts.push(x,y,z); const col=new THREE.Color(i%6===0?0x9b6cff:i%8===0?0x66f5ff:0xffffff); colors.push(col.r,col.g,col.b); }
    g.setAttribute('position',new THREE.Float32BufferAttribute(pts,3)); g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    const p=new THREE.Points(g,new THREE.PointsMaterial({size:1.8,vertexColors:true,transparent:true,opacity:.94,depthWrite:false})); p.name='SVR_COSMIC_STARS_1_7_6'; root.add(p);
  }
  function planet(name,cfg,paths){ const p=new THREE.Mesh(new THREE.SphereGeometry(1,72,36),new THREE.MeshBasicMaterial({color:cfg.color})); p.name=name; p.userData.SVR_MODULE_ID=SKY_ID; p.position.set(...cfg.pos); p.scale.set(...cfg.scale); const h=new THREE.Mesh(new THREE.SphereGeometry(1.08,48,24),basic(cfg.color,.16)); h.name=name+'_HALO'; h.position.copy(p.position); h.scale.set(cfg.scale[0]*1.28,cfg.scale[1]*1.28,cfg.scale[2]*1.28); h.userData.SVR_MODULE_ID=SKY_ID; load(paths,t=>{ if(t){p.material.map=t; p.material.color.set(0xffffff); p.material.needsUpdate=true;} }); return [p,h]; }
  function cosmic(s){ const root=new THREE.Group(); root.name='SVR_COSMIC_HIGH_SKY_FORCE_1_7_6'; root.userData.SVR_MODULE_ID=SKY_ID; root.add(new THREE.Mesh(new THREE.SphereGeometry(500,48,24),new THREE.MeshBasicMaterial({color:0x03000d,side:THREE.BackSide}))); stars(root); const m=planet('SVR_LOCKED_MOON_HIGH_FORCE_1_7_6',MOON,['./assets/textures/moon.jpg','./assets/moon.jpg','./textures/moon.jpg','./moon.jpg']); const r=planet('SVR_LOCKED_MARS_HIGH_FORCE_1_7_6',MARS,['./assets/textures/mars.jpg','./assets/mars.jpg','./textures/mars.jpg','./mars.jpg']); m.concat(r).forEach(o=>root.add(o)); s.add(root); function spin(){m[0].rotation.y+=.00055; r[0].rotation.y+=.0008; requestAnimationFrame(spin);} spin(); }

  function vibez(s){
    const g=new THREE.Group(); g.name='SVR_VIBEZ_THEATER_FORCE_VISIBLE_1_7_6'; g.userData.SVR_MODULE_ID=THEATER_ID; g.userData.SVR_ROUTE='/game/?scene=vibez-theater'; g.position.set(-6.25,2.45,-3.15); g.lookAt(new THREE.Vector3(0,2.1,2.8));
    g.add(box(7.7,4.6,.24,0x05020c,.94,.08)); const top=box(8.1,.16,.32,0xffcc66,1,.3); top.position.y=2.38; g.add(top); const bot=box(8.1,.12,.32,0x00eaff,1,.24); bot.position.y=-2.38; g.add(bot); const l=box(.14,4.85,.32,0xffcc66,1,.22); l.position.x=-3.95; g.add(l); const r=box(.14,4.85,.32,0xffcc66,1,.22); r.position.x=3.95; g.add(r);
    const marq=box(7.05,.92,.36,0x170020,.97,.22); marq.position.set(0,1.78,.18); g.add(marq); const title=text('SVR VIBEZ THEATER',4.85,.95,132,'#ffe69a'); title.position.set(0,1.8,.42); g.add(title); const sub=text('VR CINEMA â€¢ STORIES â€¢ PREMIERES',4.55,.5,74,'#9fffff'); sub.position.set(0,1.16,.44); g.add(sub);
    const screen=box(4.65,1.78,.18,0x050010,.96,.14); screen.position.set(0,-.3,.23); g.add(screen); const st=text('COMING SOON\nCOMMUNITY STORIES\nFEATURE SCREENINGS',4.35,1.55,86,'#fff'); st.position.set(0,-.3,.47); g.add(st);
    const portal=box(3.05,.62,.18,0x001b24,.91,.28); portal.name='SVR_VIBEZ_THEATER_ENTER_VR_CINEMA'; portal.position.set(0,-1.82,.35); g.add(portal); const enter=text('ENTER VR CINEMA',2.75,.46,96,'#aaffff'); enter.position.set(0,-1.82,.58); g.add(enter); const arrow=text('â˜… NEW VIBEZ THEATER â˜…',5.4,.48,82,'#ffcc66'); arrow.position.set(0,2.82,.55); g.add(arrow);
    s.add(g);
    const ring=new THREE.Mesh(new THREE.RingGeometry(1.1,1.45,96),basic(0xffcc66,.62)); ring.name='SVR_VIBEZ_THEATER_FLOOR_RING_1_7_6'; ring.position.set(-6.25,.07,-3.15); ring.rotation.x=-Math.PI/2; s.add(ring); function pulse(){const t=performance.now()*.003; ring.material.opacity=.46+Math.sin(t)*.14; const q=1+Math.sin(t)*.07; ring.scale.set(q,q,q); requestAnimationFrame(pulse);} pulse();
  }

  let applied=false;
  function apply(){ installBadges(); hideOldDomBadges(); const s=scene(); if(!s||!window.THREE){ console.warn('[SVR 1.7.6] waiting for scene'); return false; } clean(s); cosmic(s); vibez(s); window.SVR_176_AUDIT={build:BUILD,loaded:true,positionDisplayAlways:true,moon:MOON,mars:MARS,vibezTheaterForcedVisible:true,timestamp:new Date().toISOString()}; applied=true; console.log('[SVR 1.7.6] loaded',window.SVR_176_AUDIT); return true; }
  document.addEventListener('DOMContentLoaded',apply); window.addEventListener('load',()=>setTimeout(apply,350)); [900,1600,2800,4500,7000].forEach(ms=>setTimeout(()=>{if(!applied)apply();else hideOldDomBadges();},ms)); setInterval(()=>{installBadges(); hideOldDomBadges();},5000);
  window.SVR_176_VIBEZ_THEATER_HIGH_SKY_FORCE_LOCK={build:BUILD,apply,moon:MOON,mars:MARS};
})();
