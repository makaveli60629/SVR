import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export const boot = {
  el: null,
  lines: [],
  mount: async ({ build }) => {
    // HUD
    const wrap = document.createElement('div');
    wrap.id = "scarlett-hud";
    wrap.style.cssText = `
      position:fixed; left:14px; top:14px; z-index:9999;
      padding:14px 14px 10px 14px; border-radius:18px;
      background:rgba(10,12,18,0.85); color:#d7e2ff;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
      max-width: 92vw; width: 620px;
      backdrop-filter: blur(8px);
      border: 1px solid rgba(120,150,255,0.18);
    `;
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <div style="font-size:22px;font-weight:700;">ScarlettVR Poker • SAFE MODULAR SPINE</div>
        <div id="readyBadge" style="font-size:18px;opacity:0.7;">READY ⏳</div>
      </div>
      <div style="margin-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
        <button id="enterVR" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:#fff;color:#000;font-weight:700;">Enter VR</button>
        <button id="reset" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:#fff;color:#000;font-weight:700;">Reset</button>
        <button id="copy" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:#fff;color:#000;font-weight:700;">Copy Report</button>
        <button id="hide" style="padding:8px 12px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:#fff;color:#000;font-weight:700;">Hide</button>
      </div>
      <pre id="log" style="margin-top:10px;white-space:pre-wrap;line-height:1.25;font-size:14px;"></pre>
      <div style="margin-top:10px;display:flex;gap:10px;">
        <button id="musicOn" style="padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:#fff;color:#000;font-weight:700;">Music On</button>
        <button id="musicOff" style="padding:10px 14px;border-radius:12px;border:1px solid rgba(255,255,255,0.15);background:#fff;color:#000;font-weight:700;">Music Off</button>
      </div>
    `;
    document.body.appendChild(wrap);
    boot.el = wrap;

    const pre = wrap.querySelector('#log');
    const t0 = performance.now();
    const addLine = (s) => {
      const dt = ((performance.now()-t0)/1000).toFixed(3);
      boot.lines.push(`[${dt}] ${s}`);
      pre.textContent = boot.lines.join("\n");
    };

    // Basic WebXR + Three boot
    const renderer = new THREE.WebGLRenderer({ antialias:true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.domElement.style.cssText = "position:fixed;inset:0;z-index:0;";
    document.body.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020206);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 400);
    camera.position.set(0, 1.65, 18);

    // Ground-level rig group
    const rig = new THREE.Group();
    rig.add(camera);
    scene.add(rig);

    // XR button
    wrap.querySelector('#enterVR').onclick = async () => {
      try{
        const nav = navigator;
        if (!nav.xr) return addLine("[xr] navigator.xr not available");
        const ok = await nav.xr.isSessionSupported('immersive-vr');
        if(!ok) return addLine("[xr] immersive-vr not supported");
        const session = await nav.xr.requestSession('immersive-vr', { optionalFeatures:['local-floor','bounded-floor','hand-tracking'] });
        renderer.xr.setSession(session);
        addLine("[xr] session started ✅");
      }catch(e){ addLine(`[xr] start fail: ${e?.message||e}`); }
    };

    wrap.querySelector('#reset').onclick = () => {
      camera.position.set(0,1.65,18);
      rig.position.set(0,0,0);
      addLine("[ui] reset");
    };

    wrap.querySelector('#copy').onclick = async () => {
      try{
        await navigator.clipboard.writeText(boot.lines.join("\n"));
        addLine("[ui] copied report ✅");
      }catch(e){ addLine("[ui] copy failed"); }
    };

    wrap.querySelector('#hide').onclick = () => {
      wrap.style.display = "none";
    };

    // Music buttons just dispatch events (other modules can listen)
    wrap.querySelector('#musicOn').onclick = () => window.dispatchEvent(new CustomEvent("scarlett:musicOn"));
    wrap.querySelector('#musicOff').onclick = () => window.dispatchEvent(new CustomEvent("scarlett:musicOff"));

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth/window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });

    const ctx = { renderer, scene, camera, rig, addLine };
    boot.log = addLine;

    addLine("=== SCARLETT SAFE MODULAR SPINE ===");
    addLine(`build=${build}`);
    addLine(`href=${location.href}`);
    addLine(`secureContext=${window.isSecureContext}`);
    addLine(`ua=${navigator.userAgent}`);

    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });

    addLine("[boot] renderer mounted ✅");
    return ctx;
  },
  ready: () => {
    const badge = document.getElementById("readyBadge");
    if (badge) { badge.textContent = "READY ✅"; badge.style.opacity = "1"; }
    boot.log("[boot] ready ✅");
  },
  log: (s)=>{ /* replaced at mount */ }
};
