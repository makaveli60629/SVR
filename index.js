import { Spine } from './spine.js';

const diag = document.getElementById('diag');
const joyBase = document.getElementById('joyBase');
const joyKnob = document.getElementById('joyKnob');

function log(s){
  diag.textContent += '\n' + s;
}

log('[boot] JS LOADED ✅');

let joyX = 0, joyY = 0;
let dragging = false;
let rect;

function setKnob(x,y){
  joyKnob.style.transform =
    `translate(${x*45}px,${y*45}px) translate(-50%,-50%)`;
}

joyBase.addEventListener('touchstart', e=>{
  rect = joyBase.getBoundingClientRect();
  dragging = true;
});

joyBase.addEventListener('touchmove', e=>{
  if(!dragging) return;
  const t = e.touches[0];
  const cx = rect.left + rect.width/2;
  const cy = rect.top + rect.height/2;
  let dx = (t.clientX - cx) / 60;
  let dy = (t.clientY - cy) / 60;
  dx = Math.max(-1,Math.min(1,dx));
  dy = Math.max(-1,Math.min(1,dy));
  joyX = dx;
  joyY = dy;
  setKnob(dx,dy);
  e.preventDefault();
},{passive:false});

joyBase.addEventListener('touchend', ()=>{
  dragging = false;
  joyX = joyY = 0;
  setKnob(0,0);
});

document.querySelectorAll('[data-action]').forEach(btn=>{
  btn.onclick = ()=>{
    const a = btn.dataset.action;
    if(a==='hardReload') location.reload();
    else window.SCARLETT?.[a]?.();
  };
});

Spine.start({
  log,
  getJoystick: ()=>({x:joyX,y:joyY})
});
