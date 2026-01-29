export function bindVirtualJoysticks({ onMove, onTurn }) {
  const stickL = document.getElementById('stickL');
  const knobL = document.getElementById('knobL');
  const stickR = document.getElementById('stickR');
  const knobR = document.getElementById('knobR');
  if (!stickL || !stickR) return { destroy(){} };

  function makeStick(stick, knob, cb){
    let active=false, id=null, sx=0, sy=0;
    const rect = ()=>stick.getBoundingClientRect();
    const max = 55;

    function setKnob(dx,dy){
      knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }

    function start(e){
      const t = (e.changedTouches? e.changedTouches[0] : e);
      id = t.identifier ?? 'mouse';
      active=true;
      const r=rect();
      sx = t.clientX - (r.left + r.width/2);
      sy = t.clientY - (r.top + r.height/2);
      e.preventDefault();
    }
    function move(e){
      if(!active) return;
      const touches = e.changedTouches ? Array.from(e.changedTouches) : [e];
      const t = touches.find(x => (x.identifier ?? 'mouse') === id);
      if(!t) return;
      const r=rect();
      let dx = t.clientX - (r.left + r.width/2);
      let dy = t.clientY - (r.top + r.height/2);
      const len = Math.hypot(dx,dy);
      if (len>max){ dx = dx/len*max; dy = dy/len*max; }
      setKnob(dx,dy);
      cb(dx/max, dy/max);
      e.preventDefault();
    }
    function end(e){
      if(!active) return;
      active=false; id=null;
      setKnob(0,0);
      cb(0,0);
      e.preventDefault();
    }

    stick.addEventListener('touchstart', start, {passive:false});
    window.addEventListener('touchmove', move, {passive:false});
    window.addEventListener('touchend', end, {passive:false});
    stick.addEventListener('mousedown', start);
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', end);

    return { destroy(){} };
  }

  makeStick(stickL, knobL, (x,y)=>onMove?.(x,y));
  makeStick(stickR, knobR, (x,y)=>onTurn?.(x,y));
  return { destroy(){} };
}
