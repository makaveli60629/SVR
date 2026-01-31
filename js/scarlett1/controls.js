
import * as THREE from "three";

export class Controls{
  constructor(renderer,playerRoot){
    this.r=renderer;
    this.p=playerRoot;
    this.move=new THREE.Vector2();
    this.turn=0;
    this.speed=2.0;
    this.turnSpeed=2.2;
  }

  update(dt){
    // Reset each frame so stale values don't "lock" you
    this.move.set(0,0);
    this.turn=0;

    const s=this.r.xr.getSession?.();
    if(s){
      for(const src of s.inputSources){
        const gp=src.gamepad;
        if(!gp||!gp.axes) continue;
        if(src.handedness==="left"){
          const x=gp.axes[2] ?? gp.axes[0] ?? 0;
          const y=gp.axes[3] ?? gp.axes[1] ?? 0;
          this.move.set(x,y);
        }
        if(src.handedness==="right"){
          const x=gp.axes[2] ?? gp.axes[0] ?? 0;
          this.turn=x;
        }
      }
    }

    // Apply motion in local yaw space
    const forward=-this.move.y;
    const strafe=this.move.x;

    const yaw=this.p.rotation.y;
    const dir=new THREE.Vector3(strafe,0,forward);
    if(dir.lengthSq()>1e-5){
      dir.normalize().multiplyScalar(this.speed*dt);
      dir.applyAxisAngle(new THREE.Vector3(0,1,0), yaw);
      this.p.position.add(dir);
    }

    this.p.rotation.y += (-this.turn) * this.turnSpeed * dt;
  }
}
