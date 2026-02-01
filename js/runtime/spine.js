// SVR/js/runtime/spine.js
import * as THREE from 'three';
import { Input } from './input.js';
import { initWorld } from '../scarlett1/world.js';

export const Spine = {
  ctx: null,

  start(){
    const Bus = this._makeBus();
    const status = document.getElementById('status');
    const setStatus = (t)=>{ if(status) status.textContent = t; };

    Bus.log("booting…");
    setStatus("boot…");

    const canvas = document.getElementById('canvas');
    if (!canvas){
      Bus.log("❌ canvas missing");
      setStatus("canvas missing");
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x05060a);

    const camera = new THREE.PerspectiveCamera(70, window.innerWidth/window.innerHeight, 0.05, 300);
    camera.position.set(0, 1.65, 10);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias:true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;

    const rig = new THREE.Group();
    rig.position.set(0, 1.7, 14.5);
    rig.rotation.set(0, Math.PI, 0); // face toward center/store direction
    rig.add(camera);
    scene.add(rig);

    const controller1 = renderer.xr.getController(0);
    const controller2 = renderer.xr.getController(1);
    scene.add(controller1);
    scene.add(controller2);

    const ctx = this.ctx = {
      THREE, scene, camera, renderer, rig,
      controller1, controller2,
      Bus,
      walkSurfaces: [],
      teleportSurfaces: [],
      worldUpdate: null
    };

    this._wireUI(ctx, setStatus);

    // Input viz always loads, so if world fails you'll at least see ring/laser
    Input.init(ctx);

    (async ()=>{
      try{
        Bus.log("world: init…");
        setStatus("world init…");
        const res = await initWorld(ctx);
        if (res?.walkSurfaces) ctx.walkSurfaces = res.walkSurfaces;
        if (res?.teleportSurfaces) ctx.teleportSurfaces = res.teleportSurfaces;
        Bus.log("✅ world ready");
        setStatus("world ready ✅");
      }catch(e){
        Bus.log("❌ world init failed: " + (e?.message || e));
        setStatus("world failed ❌");
      }
    })();

    const onResize = ()=>{
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', onResize);

    let last = performance.now();
    renderer.setAnimationLoop(()=>{
      const now = performance.now();
      const dt = Math.min(0.05, (now-last)/1000);
      last = now;

      try { Input.update(dt); } catch(e){ Bus.log("Input err: "+(e?.message||e)); }
      try { ctx.worldUpdate?.(dt); } catch(e){ Bus.log("WorldUpdate err: "+(e?.message||e)); }

      renderer.render(scene, camera);
    });

    Bus.log("boot ok ✅");
    setStatus("boot ok ✅");
  },

  _makeBus(){
    const logEl = document.getElementById('log');
    return {
      log: (msg)=>{
        console.log(msg);
        if (!logEl) return;
        const t = new Date().toISOString().split('T')[1].replace('Z','');
        logEl.textContent += `[${t}] ${msg}\n`;
        logEl.scrollTop = logEl.scrollHeight;
      }
    };
  },

  _wireUI(ctx, setStatus){
    const $ = (id)=>document.getElementById(id);

    $('enterVr')?.addEventListener('click', async ()=>{
      try{
        if (!navigator.xr) throw new Error("navigator.xr not available");
        const session = await navigator.xr.requestSession('immersive-vr', {
          optionalFeatures: ['local-floor','bounded-floor','hand-tracking','layers']
        });
        await ctx.renderer.xr.setSession(session);
        ctx.Bus.log("XR session started ✅");
        setStatus("XR started ✅");
      }catch(e){
        ctx.Bus.log("XR start failed: " + (e?.message || e));
        setStatus("XR failed ❌");
      }
    });

    $('resetSpawn')?.addEventListener('click', ()=>{
      ctx.rig.position.set(0, 1.7, 14.5);
      ctx.rig.rotation.set(0, Math.PI, 0);
      ctx.Bus.log("spawn reset ✅");
      setStatus("spawn reset ✅");
    });

    $('hardReload')?.addEventListener('click', ()=> location.reload());

    $('nukeCache')?.addEventListener('click', async ()=>{
      try{
        if ('serviceWorker' in navigator){
          const regs = await navigator.serviceWorker.getRegistrations();
          for (const r of regs) await r.unregister();
        }
        if ('caches' in window){
          const keys = await caches.keys();
          for (const k of keys) await caches.delete(k);
        }
        ctx.Bus.log("cache nuked ✅");
        setStatus("cache nuked ✅");
      }catch(e){
        ctx.Bus.log("nuke failed: " + (e?.message || e));
        setStatus("nuke failed ❌");
      }
    });

    $('probePaths')?.addEventListener('click', async ()=>{
      const files = [
        './index.js',
        './js/runtime/spine.js',
        './js/runtime/input.js',
        './js/scarlett1/world.js'
      ];
      for (const f of files){
        try{
          const r = await fetch(f, { cache: 'no-store' });
          ctx.Bus.log(`probe ${f} status=${r.status}`);
        }catch(e){
          ctx.Bus.log(`probe ${f} FAIL ${(e?.message||e)}`);
        }
      }
    });

    // avatar buttons (world.js defines window.spawnAvatar)
    const setAv = (name)=>{ const el=$('av'); if(el) el.textContent = `Avatar: ${name||'NONE'}`; };
    $('avMale')?.addEventListener('click', ()=>{ window.spawnAvatar?.('male'); setAv('MALE'); });
    $('avFemale')?.addEventListener('click', ()=>{ window.spawnAvatar?.('female'); setAv('FEMALE'); });
    $('avNinja')?.addEventListener('click', ()=>{ window.spawnAvatar?.('ninja'); setAv('NINJA'); });
    $('avCombat')?.addEventListener('click', ()=>{ window.spawnAvatar?.('combat'); setAv('COMBAT'); });
    $('avClear')?.addEventListener('click', ()=>{ window.clearAvatar?.(); setAv(null); });
  }
};
