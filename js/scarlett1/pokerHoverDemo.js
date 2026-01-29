/**
 * MODULE: pokerHoverDemo.js
 * Simple hover-cards demo so you see "real cards hover" behavior.
 * (Not full poker yet, but proves the layout & animation.)
 */
export async function init(ctx){
  const { THREE, scene, log } = ctx;

  const cards = new THREE.Group();
  cards.name = "HoverCards";
  scene.add(cards);

  const mat = new THREE.MeshStandardMaterial({ color:0xffffff, roughness:0.6, metalness:0.05 });
  const geo = new THREE.BoxGeometry(0.75, 0.02, 1.05);

  const y = -1.65 + 1.95; // above pit floor, near table top
  const r = 0.9;

  for (let i=0;i<5;i++){
    const c = new THREE.Mesh(geo, mat);
    c.position.set((i-2)*0.85, y, -0.2);
    c.rotation.x = -Math.PI/2;
    cards.add(c);
  }

  log('[poker] hover-card demo armed ✅');

  let t=0;
  return {
    updates:[(dt)=>{
      t+=dt;
      cards.children.forEach((c,i)=>{
        c.position.y = y + Math.sin(t*1.8 + i*0.6)*0.05;
      });
    }]
  };
}
