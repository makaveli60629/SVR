/**
 * MODULE: storePad.js
 * Adds a purple Store Pad near the Store Door (tap center-screen to open store UI).
 */
export async function init(ctx){
  const { THREE, scene, log } = ctx;
  const outerR = 70.0;
  const storeAngle = 0;

  const pad = new THREE.Mesh(
    new THREE.CircleGeometry(0.7, 48),
    new THREE.MeshBasicMaterial({ color:0x8a2be2, transparent:true, opacity:0.55 })
  );
  pad.rotation.x = -Math.PI/2;
  pad.position.set(Math.cos(storeAngle)*(outerR-2.0), 0.02, Math.sin(storeAngle)*(outerR-2.0));
  pad.name = "STORE_PAD";
  scene.add(pad);

  log('[store] pad placed ✅');

  return {
    interactables:[pad],
    hooks:{
      onStorePad: ()=>{
        const el = document.getElementById('storePanel');
        if (!el) return;
        el.style.display = (el.style.display==='none' || !el.style.display) ? 'block' : 'none';
        log('[store] pad activated ✅');
      }
    }
  };
}
