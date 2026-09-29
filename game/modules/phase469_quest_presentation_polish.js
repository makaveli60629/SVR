/* PHASE-469-QUEST-PRESENTATION-POLISH-LOCK
   Non-destructive visibility layer for Quest lobby/table presentation.
   Does not modify poker rules, locomotion, seating, dealer animation, hand tracking, or watch actions.
*/
import * as THREE from "three";

export const BUILD="PHASE-469-QUEST-PRESENTATION-POLISH-LOCK";

export function installPhase469QuestPresentationPolish({scene,renderer}={}){
  if(!scene||!renderer) throw new Error("PHASE469_SCENE_RENDERER_REQUIRED");
  const existing=scene.getObjectByName("PHASE469_PRESENTATION_LIGHTING_ROOT");
  if(existing) return window.SVR_PHASE469_QUEST_PRESENTATION;

  const root=new THREE.Group();
  root.name="PHASE469_PRESENTATION_LIGHTING_ROOT";

  const ambient=new THREE.AmbientLight(0xdde9ff,0.30);
  ambient.name="PHASE469_SOFT_AMBIENT";

  const hemi=new THREE.HemisphereLight(0xdff8ff,0x180b20,0.72);
  hemi.name="PHASE469_HEMISPHERE";

  const tableFill=new THREE.PointLight(0xffe7b5,1.15,8.5,1.8);
  tableFill.name="PHASE469_TABLE_WARM_FILL";
  tableFill.position.set(0,2.7,1.15);

  const dealerFill=new THREE.PointLight(0xbfeaff,0.92,7.5,1.7);
  dealerFill.name="PHASE469_DEALER_COOL_FILL";
  dealerFill.position.set(-0.25,2.25,2.35);

  const frontRim=new THREE.DirectionalLight(0xffffff,0.48);
  frontRim.name="PHASE469_FRONT_RIM";
  frontRim.position.set(0,3.8,5.5);

  root.add(ambient,hemi,tableFill,dealerFill,frontRim);
  scene.add(root);

  const previousExposure=Number(renderer.toneMappingExposure||1);
  renderer.toneMappingExposure=Math.max(previousExposure,1.24);

  const state={
    build:BUILD,
    installed:true,
    previousExposure,
    exposure:renderer.toneMappingExposure,
    tableVisible:Boolean(scene.getObjectByName("PHASE467_LOBBY_APPROVED_TABLE_ROOT")),
    dealerVisible:Boolean(scene.getObjectByName("PHASE467_LOBBY_APPROVED_ERIC_ROOT")),
    lightCount:5,
    gameplayTouched:false,
    watchTouched:false,
    locomotionTouched:false,
    checkedAt:new Date().toISOString()
  };

  const runtime={
    build:BUILD,
    root,
    state,
    qa:()=>({
      ...state,
      rootAttached:Boolean(root.parent),
      tableVisible:Boolean(scene.getObjectByName("PHASE467_LOBBY_APPROVED_TABLE_ROOT")),
      dealerVisible:Boolean(scene.getObjectByName("PHASE467_LOBBY_APPROVED_ERIC_ROOT")),
      pass:Boolean(root.parent&&renderer.toneMappingExposure>=1.24),
      checkedAt:new Date().toISOString()
    })
  };

  window.SVR_PHASE469_QUEST_PRESENTATION=runtime;
  window.SVR_PHASE469_QUEST_PRESENTATION_QA=runtime.qa;
  return runtime;
}
