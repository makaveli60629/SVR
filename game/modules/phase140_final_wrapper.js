import { applyPhase140LobbyReikiTheaterOverhaul } from "./phase140_lobby_reiki_theater_overhaul.js";

export async function applyPhase140Final(args = {}){
  const result = await applyPhase140LobbyReikiTheaterOverhaul(args);
  const scene = args.scene;
  const planets = result?.phase140Planets;
  if (scene && planets && !scene.userData._phase140PlanetsTickWrapped){
    const previousTick = scene.userData._tickWorld;
    scene.userData._tickWorld = (dt)=>{
      previousTick?.(dt);
      planets.update?.(dt);
    };
    scene.userData._phase140PlanetsTickWrapped = true;
  }
  return result;
}
