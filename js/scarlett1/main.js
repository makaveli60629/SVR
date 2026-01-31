
import { createWorld } from "./world.js";
import { Controls } from "./controls.js";
import { lobby } from "./lobby.js";
import { pit } from "./pit.js";
import { Bots } from "./bots.js";
import { log, setTop, showError } from "./ui.js";
import { VRButton } from "three/addons/webxr/VRButton.js";

try{
  const {scene,camera,renderer,playerRoot}=createWorld();
  document.body.appendChild(VRButton.createButton(renderer)); // adds ENTER VR button when available
  const controls=new Controls(renderer,playerRoot);

  lobby(scene);
  setTop("Lobby ready (press Enter Poker Pit)");
  log("If scene is black: check console for BOOT ERROR");

  let bots=null;
  document.getElementById("btnEnter").onclick=async()=>{
    const p=pit(scene);
    bots=new Bots(scene,p.seats);
    await bots.spawn();
    setTop("Poker Pit Live + Jumbotron");
    log("Bots spawned");
    // move player slightly closer to table
    playerRoot.position.set(0,0,1.8);
    playerRoot.rotation.y=0;
  };

  let last=performance.now();
  renderer.setAnimationLoop(()=>{
    const now=performance.now();
    const dt=Math.min((now-last)/1000,0.033);
    last=now;

    controls.update(dt);
    if(bots) bots.update(now/1000);

    // IMPORTANT: render with camera (XR will override internally)
    renderer.render(scene,camera);
  });

}catch(e){
  console.error(e);
  showError(e);
}
