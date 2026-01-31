
import * as THREE from "three";
export class Controls{
 constructor(renderer,player){this.r=renderer;this.p=player;this.v=new THREE.Vector2();this.t=0;}
 update(dt){
  const s=this.r.xr.getSession?.();
  if(s)for(const i of s.inputSources){const g=i.gamepad;if(!g)continue;
   if(i.handedness==="left")this.v.set(g.axes[2]||0,g.axes[3]||0);
   if(i.handedness==="right")this.t=g.axes[2]||0;}
  this.p.position.x+=this.v.x*dt*2;
  this.p.position.z+=-this.v.y*dt*2;
  this.p.rotation.y+=this.t*dt*2;
 }
}
