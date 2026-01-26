import * as THREE from 'three';

// Creates a live CanvasTexture for a jumbotron mesh.
// Uses a shared dispatcher: window.__jumbotronUpdate(id, title, status)
export function initVideoFeed(mesh, id = "main") {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;

  // attach to material
  if (mesh.material) {
    mesh.material.map = tex;
    if ('emissiveMap' in mesh.material) mesh.material.emissiveMap = tex;
    if ('emissiveIntensity' in mesh.material) mesh.material.emissiveIntensity = 1.2;
    mesh.material.needsUpdate = true;
  }

  // local render function
  function render(title, status) {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // border glow
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, canvas.width-20, canvas.height-20);

    ctx.fillStyle = '#00ff00';
    ctx.font = 'bold 80px Courier New, monospace';
    ctx.fillText(String(title).toUpperCase(), 50, 150);

    ctx.font = '40px Courier New, monospace';
    ctx.fillText(`STATUS: ${status}`, 50, 300);

    ctx.font = '24px Courier New, monospace';
    ctx.fillText(`SCREEN: ${id.toUpperCase()}`, 50, 430);

    tex.needsUpdate = true;
  }

  // shared dispatcher
  const prev = window.__jumbotronUpdate;
  window.__jumbotronUpdate = (targetId, title, status) => {
    // keep other screens working
    if (prev && prev !== window.__jumbotronUpdate) prev(targetId, title, status);
    if (targetId === id) render(title, status);
  };

  // initial draw
  render('Scarlett Empire', 'Lobby Active');
}
