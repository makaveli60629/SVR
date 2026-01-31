import {createWorld} from "./world.js";
import {Controls} from "./controls.js";
import {lobby} from "./lobby.js";
import {pit} from "./pit.js";
import {Bots} from "./bots.js";
import {log,setTop} from "./ui.js";

const {scene,renderer,playerRoot}=createWorld();
const c=new Controls(renderer,playerRoot);
let t0=performance.now(),bots=null;

lobby(scene);

document.getElementById("btnEnter").onclick=async()=>{
 const p=pit(scene);
 bots=new Bots(scene,p.seats);await bots.spawn();
 setTop("Poker Pit Live");
};

renderer.setAnimationLoop(t=>{
 const dt=(t-t0)/1000;t0=t;
 c.update(dt);if(bots)bots.update(t/1000);
 renderer.render(scene,renderer.xr.getCamera());
});
