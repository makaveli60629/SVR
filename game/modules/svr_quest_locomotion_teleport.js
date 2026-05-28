(function(){
  "use strict";

  const SVR = window.SVRLocomotion = window.SVRLocomotion || {};

  SVR.phase = "PHASE-252-ORIGINAL-LOBBY-STORE-HUB-EMBED";
  SVR.fistLocomotionEnabled = true;
  SVR.teleportLeapEnabled = true;

  SVR.config = Object.assign({
    fistMoveStrength: 0.055,
    teleportLeapDistance: 4.5,
    teleportCooldownMs: 650,
    debug: true
  }, SVR.config || {});

  SVR.state = {
    leftGrip:false,
    rightGrip:false,
    triggerDown:false,
    wasTriggerDown:false,
    lastTeleport:0
  };

  function pads(){
    return navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  }

  function read(){
    let left=false,right=false,trigger=false;

    for(const p of pads()){
      const id=(p.id||"").toLowerCase();
      const grip=!!(p.buttons[1] && p.buttons[1].pressed);
      const trig=!!(p.buttons[0] && p.buttons[0].pressed);

      if(id.includes("left")) left = grip;
      else if(id.includes("right")) right = grip;
      else {
        left = left || grip;
        right = right || grip;
      }

      if(trig) trigger = true;
    }

    SVR.state.leftGrip = left;
    SVR.state.rightGrip = right;
    SVR.state.triggerDown = trigger;
  }

  function cameraForward(){
    const cam =
      window.SVR?.camera ||
      window.svrCamera ||
      window.camera ||
      window.activeCamera;

    if(cam && cam.getWorldDirection && window.THREE){
      const dir = new THREE.Vector3();
      cam.getWorldDirection(dir);
      dir.y = 0;
      dir.normalize();
      return dir;
    }

    return null;
  }

  function moveRig(distance){
    const rig =
      window.SVR?.rig ||
      window.SVR?.playerRig ||
      window.svrRig ||
      window.playerRig ||
      window.cameraRig;

    const cam =
      window.SVR?.camera ||
      window.svrCamera ||
      window.camera ||
      window.activeCamera;

    const dir = cameraForward();
    if(!dir || !window.THREE) return;

    if(rig && rig.position){
      rig.position.add(dir.multiplyScalar(distance));
      return;
    }

    if(cam && cam.position){
      cam.position.add(dir.multiplyScalar(distance));
    }
  }

  function fist(){
    let z = 0;

    if(SVR.state.leftGrip && SVR.state.rightGrip) z = SVR.config.fistMoveStrength;
    else if(SVR.state.leftGrip || SVR.state.rightGrip) z = SVR.config.fistMoveStrength * 0.5;

    if(z) moveRig(z);

    window.dispatchEvent(new CustomEvent("svr:fist-locomotion", {
      detail:{ z:z, cameraForward:true, phase:SVR.phase }
    }));
  }

  function teleportRelease(){
    const released = SVR.state.wasTriggerDown && !SVR.state.triggerDown;
    const now = performance.now();

    if(released && now - SVR.state.lastTeleport > SVR.config.teleportCooldownMs){
      SVR.state.lastTeleport = now;
      moveRig(SVR.config.teleportLeapDistance);

      window.dispatchEvent(new CustomEvent("svr:teleport-leap", {
        detail:{
          distance:SVR.config.teleportLeapDistance,
          cameraForward:true,
          releaseLeap:true,
          phase:SVR.phase
        }
      }));
    }

    SVR.state.wasTriggerDown = SVR.state.triggerDown;
  }

  window.addEventListener("keydown", function(e){
    if(e.code === "KeyF"){
      SVR.state.leftGrip = true;
      SVR.state.rightGrip = true;
    }

    if(e.code === "Space" || e.code === "KeyT"){
      SVR.state.triggerDown = true;
    }
  });

  window.addEventListener("keyup", function(e){
    if(e.code === "KeyF"){
      SVR.state.leftGrip = false;
      SVR.state.rightGrip = false;
    }

    if(e.code === "Space" || e.code === "KeyT"){
      SVR.state.triggerDown = false;
    }
  });

  function loop(){
    read();
    fist();
    teleportRelease();
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
  console.log("[SVR] Phase 252 locomotion repaired: camera-forward fist move + trigger-release teleport leap.");
})();
