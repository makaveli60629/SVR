// PHASE-186-SOUTH-WALL-MISSION-ABOUT-FINAL-LOCK
// Final fix for the south mission/about wall. Uses the actual existing south-wall board coordinates
// so the AngelWingz art sits on the wall plane instead of floating at the wrong angle.
import * as THREE from "three";

const PHASE = "PHASE-186-SOUTH-WALL-MISSION-ABOUT-FINAL-LOCK";

if (!window.__SVR_PHASE186_SOUTH_WALL_FINAL__) {
  window.__SVR_PHASE186_SOUTH_WALL_FINAL__ = true;

  function canvasTex(draw, w = 1024, h = 512) {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const x = c.getContext("2d"); draw(x, c);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
  }

  function titleTex() {
    return canvasTex((x,c)=>{
      const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#050712"); g.addColorStop(1,"#15071e");
      x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle="rgba(217,217,255,.95)"; x.lineWidth=10; x.strokeRect(18,18,c.width-36,c.height-36);
      x.strokeStyle="rgba(127,245,199,.76)"; x.lineWidth=4; x.strokeRect(50,50,c.width-100,c.height-100);
      x.textAlign="center"; x.textBaseline="middle";
      x.fillStyle="#fff"; x.font="900 70px system-ui,Segoe UI,Arial"; x.fillText("ABOUT SVR POKER", c.width/2, 124);
      x.fillStyle="#bfffea"; x.font="800 34px system-ui,Segoe UI,Arial"; x.fillText("Mission wall • community impact • private room portals", c.width/2, 204);
      x.fillStyle="rgba(255,255,255,.52)"; x.font="22px system-ui,Segoe UI,Arial"; x.fillText(PHASE, c.width/2, c.height-56);
    },1024,384);
  }

  function infoTex(title, lines, accent="#7ff5c7") {
    return canvasTex((x,c)=>{
      const g=x.createLinearGradient(0,0,c.width,c.height); g.addColorStop(0,"#050710"); g.addColorStop(1,"#13061c");
      x.fillStyle=g; x.fillRect(0,0,c.width,c.height);
      x.strokeStyle=accent; x.lineWidth=9; x.strokeRect(18,18,c.width-36,c.height-36);
      x.textAlign="center"; x.textBaseline="middle";
      x.fillStyle="#fff"; x.font="900 58px system-ui,Segoe UI,Arial"; x.fillText(title.toUpperCase(),c.width/2,92);
      x.fillStyle="rgba(255,255,255,.90)"; x.font="31px system-ui,Segoe UI,Arial";
      lines.forEach((line,i)=>x.fillText(line,c.width/2,180+i*56));
    },720,520);
  }

  function bar(parent,x,y,z,w,h,color,opacity=.82){
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color,transparent:true,opacity,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    m.position.set(x,y,z); m.renderOrder=820; parent.add(m); return m;
  }
  function frame(parent,w,h,z=.055){
    bar(parent,0,h/2+.055,z,w+.22,.045,0xd9d9ff,.94); bar(parent,0,-h/2-.055,z,w+.22,.045,0xd9d9ff,.72);
    bar(parent,-w/2-.055,0,z,.045,h+.22,0x7ff5c7,.86); bar(parent,w/2+.055,0,z,.045,h+.22,0xb48cff,.86);
    const glow=new THREE.Mesh(new THREE.PlaneGeometry(w+.66,h+.66),new THREE.MeshBasicMaterial({color:0xb48cff,transparent:true,opacity:.09,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    glow.position.z=z-.035; glow.renderOrder=790; parent.add(glow);
  }

  async function getAngelUri(){
    if (window.SVR_ANGEL_URI && String(window.SVR_ANGEL_URI).startsWith("data:image/")) return window.SVR_ANGEL_URI;
    for (const url of ["./modules/phase185_south_wall_angle_angel_fix.js?v=phase186-art", "./modules/phase182_lobby_audit_storefront_rebuild.js?v=phase186-art"]) {
      try {
        const res = await fetch(url, { cache: "no-store" });
        const text = await res.text();
        const m = text.match(/const\s+ANGEL_URI\s*=\s*"([^"]+)"/);
        if (m && m[1] && m[1].startsWith("data:image/")) return m[1];
      } catch (_err) {}
    }
    return null;
  }

  function isFinal(obj){ for(let p=obj;p;p=p.parent){ if(p.name==="PHASE186_SOUTH_WALL_FINAL_ALIGNED_ROOT") return true; } return false; }

  function findSouthWallAnchor(scene){
    const pts=[];
    scene.traverse((obj)=>{
      if (!obj || !obj.isMesh || isFinal(obj)) return;
      const geo=obj.geometry; const p=geo?.parameters||{}; const type=geo?.type||"";
      if (!/PlaneGeometry/.test(type)) return;
      let pos=new THREE.Vector3(); try{ obj.getWorldPosition(pos); }catch(_err){ return; }
      const w=Number(p.width||0), h=Number(p.height||0);
      // Original south/about boards are the reliable wall reference: roughly 1.9x1.9, y around 1.7, z positive.
      if (pos.z>6.5 && Math.abs(pos.x)<5.5 && pos.y>.8 && pos.y<3.2 && w>.9 && w<2.6 && h>.9 && h<2.7) pts.push(pos.clone());
    });
    if (pts.length) {
      const avg=pts.reduce((a,p)=>a.add(p),new THREE.Vector3()).multiplyScalar(1/pts.length);
      return new THREE.Vector3(0, 2.92, avg.z - 0.035);
    }
    return new THREE.Vector3(0, 2.92, 11.65);
  }

  function hideOldSouthLayers(scene){
    let hidden=0;
    const rx=/PHASE18[2345]_SOUTH|PHASE18[2345]_ANGEL|PHASE18[2345]_ABOUT|PHASE184_SINGLE|PHASE185_|MISSION|HUBS|ABOUT|TOURNEY|LEADERBOARD|LEGENDS WALL|SVR LEGENDS WALL/i;
    scene.traverse((obj)=>{
      if(!obj || isFinal(obj)) return;
      const label=`${obj.name||""} ${obj.userData?.label||""} ${obj.userData?.title||""}`;
      let pos=new THREE.Vector3(); try{ obj.getWorldPosition(pos); }catch(_err){ pos.set(999,999,999); }
      const geo=obj.geometry; const p=geo?.parameters||{}; const type=geo?.type||"";
      const w=Number(p.width||0), h=Number(p.height||0);
      const southPanel=/PlaneGeometry|BoxGeometry/.test(type) && pos.z>6.5 && Math.abs(pos.x)<9.2 && pos.y>.25 && pos.y<6.8 && w<12 && h<8;
      if (rx.test(label) || southPanel) { obj.visible=false; obj.userData.phase186HiddenOldSouthLayer=true; hidden++; }
    });
    return hidden;
  }

  async function build(scene){
    if(!scene) return false;
    const anchor=findSouthWallAnchor(scene);
    hideOldSouthLayers(scene);
    const old=scene.getObjectByName("PHASE186_SOUTH_WALL_FINAL_ALIGNED_ROOT");
    if(old){ old.visible=false; scene.remove(old); }

    const root=new THREE.Group();
    root.name="PHASE186_SOUTH_WALL_FINAL_ALIGNED_ROOT";
    root.position.copy(anchor);
    root.lookAt(0, anchor.y, 0);
    root.userData.phase186OfficialSouthWall=true;
    scene.add(root);

    const back=new THREE.Mesh(new THREE.PlaneGeometry(9.05,5.55),new THREE.MeshBasicMaterial({color:0x010104,side:THREE.DoubleSide,depthWrite:true,toneMapped:false}));
    back.name="PHASE186_SINGLE_SOUTH_BACKPLATE"; back.position.z=-.045; back.renderOrder=760; root.add(back);

    const title=new THREE.Mesh(new THREE.PlaneGeometry(7.7,.72),new THREE.MeshBasicMaterial({map:titleTex(),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    title.name="PHASE186_ABOUT_TITLE"; title.position.set(0,2.36,.075); title.renderOrder=830; root.add(title);

    const artUri=await getAngelUri();
    if(artUri){
      new THREE.TextureLoader().load(artUri,(tex)=>{
        tex.colorSpace=THREE.SRGBColorSpace; tex.anisotropy=8;
        const art=new THREE.Mesh(new THREE.PlaneGeometry(5.85,4.0),new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
        art.name="PHASE186_ANGELWINGZ_MAIN_ART"; art.position.set(0,.10,.10); art.renderOrder=850; root.add(art); frame(art,5.85,4.0,.065);
      });
    } else {
      const fallback=new THREE.Mesh(new THREE.PlaneGeometry(5.85,4.0),new THREE.MeshBasicMaterial({map:infoTex("AngelWingz",["Artwork source loading","Refresh after deploy","Ctrl + F5"],"#d9d9ff"),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
      fallback.position.set(0,.10,.10); fallback.renderOrder=850; root.add(fallback); frame(fallback,5.85,4.0,.065);
    }

    const mission=new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.38),new THREE.MeshBasicMaterial({map:infoTex("Mission",["Play-money poker","Sponsor-supported rooms","Community giveback"],"#7ff5c7"),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    mission.position.set(-3.42,-1.88,.11); mission.renderOrder=835; root.add(mission); frame(mission,2.22,1.38,.05);

    const about=new THREE.Mesh(new THREE.PlaneGeometry(2.22,1.38),new THREE.MeshBasicMaterial({map:infoTex("About",["Scorpion Poker","PGA Training","Store & Lounge"],"#b48cff"),transparent:true,side:THREE.DoubleSide,depthWrite:false,toneMapped:false}));
    about.position.set(3.42,-1.88,.11); about.renderOrder=835; root.add(about); frame(about,2.22,1.38,.05);

    const light=new THREE.PointLight(0xd9d9ff,1.25,8.5,2); light.position.set(0,.8,1.15); root.add(light);
    const status=document.getElementById("status"); if(status) status.textContent="Phase 186: mission/about wall aligned with AngelWingz";
    document.querySelectorAll(".pill").forEach(p=>{ if(/PHASE-|Hands ready|BUILD:/i.test(p.textContent||"")) p.textContent=PHASE; });
    window.SVR_PHASE186_SOUTH_WALL={ phase:PHASE, anchor:{x:anchor.x,y:anchor.y,z:anchor.z}, mode:"uses real south wall board coordinates" };
    console.log(`[${PHASE}] loaded`, window.SVR_PHASE186_SOUTH_WALL);
    return true;
  }

  function boot(){
    const tryHook=()=>{ const scene=window.SVR_GAME?.scene; if(!scene) return false; build(scene); let passes=0; const id=setInterval(()=>{ passes++; hideOldSouthLayers(scene); const root=scene.getObjectByName("PHASE186_SOUTH_WALL_FINAL_ALIGNED_ROOT"); if(root){ root.visible=true; root.traverse(o=>o.visible=true); } if(passes>60) clearInterval(id); },500); return true; };
    if(!tryHook()){ let n=0; const id=setInterval(()=>{ n++; if(tryHook()||n>180) clearInterval(id); },200); }
  }
  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",boot,{once:true}); else boot();
}
