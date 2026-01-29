
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

/**
 * floorTexture.js — procedural "casino floor" grid texture (no external assets)
 */
export function makeCasinoFloorTexture({ size=512, grid=32 } = {}) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  const ctx = c.getContext('2d');

  // Base
  ctx.fillStyle = '#07070c';
  ctx.fillRect(0,0,size,size);

  // Subtle noise dots
  for (let i=0;i<8000;i++){
    const x = (Math.random()*size)|0;
    const y = (Math.random()*size)|0;
    const a = Math.random()*0.08;
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fillRect(x,y,1,1);
  }

  // Grid lines
  ctx.lineWidth = 1;
  for (let i=0;i<=size;i+=grid){
    ctx.strokeStyle = 'rgba(90,140,255,0.10)';
    ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
  }

  // Bold lines every 4
  for (let i=0;i<=size;i+=grid*4){
    ctx.strokeStyle = 'rgba(90,140,255,0.18)';
    ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i,size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,i); ctx.lineTo(size,i); ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(c);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8,8);
  tex.anisotropy = 4;
  return tex;
}
