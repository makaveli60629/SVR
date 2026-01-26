import * as THREE from 'three';

/**
 * Store Display: renders a simple inventory screen onto a jumbotron via CanvasTexture.
 * This is a placeholder "Asset Store" board you can later wire to real inventory.
 */
export function initStoreDisplay(mesh) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  if (mesh.material) {
    mesh.material.map = tex;
    if ('emissiveMap' in mesh.material) mesh.material.emissiveMap = tex;
    if ('emissiveIntensity' in mesh.material) mesh.material.emissiveIntensity = 1.3;
    mesh.material.needsUpdate = true;
  }

  const items = [
    { name: 'NEON CHIP SET', price: 500 },
    { name: 'TABLE FELT: EMPIRE', price: 1200 },
    { name: 'CARD BACK: VOID', price: 750 },
    { name: 'AVATAR AURA', price: 900 },
  ];

  function draw(title, selected=0) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    // header
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 10;
    ctx.strokeRect(10,10,canvas.width-20,canvas.height-20);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 72px Courier New, monospace';
    ctx.fillText(title.toUpperCase(), 50, 110);

    ctx.font = '32px Courier New, monospace';
    ctx.fillText('ASSET STORE • TAP "OPEN STORE" NEXT', 50, 160);

    // list
    const startY = 230;
    items.forEach((it, i) => {
      const y = startY + i*60;
      ctx.fillStyle = (i===selected) ? '#00ffff' : '#00ff00';
      ctx.fillText(`${i===selected ? '▶' : ' '} ${it.name}`, 60, y);
      ctx.fillText(`${it.price} CR`, 820, y);
    });

    ctx.fillStyle = '#00ff00';
    ctx.font = '24px Courier New, monospace';
    ctx.fillText('STATUS: LIVE', 50, 470);

    tex.needsUpdate = true;
  }

  let sel = 0;
  window.openStore = () => {
    sel = (sel + 1) % items.length;
    draw('Empire Store', sel);
  };

  draw('Empire Store', sel);
}
