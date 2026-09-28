/* PHASE-467-QUEST-LOBBY-TABLE-DEALER-AUTHORITY */
import * as THREE from "three";
import { TableCalibrationModule } from "./dealer/table_calibration_module.js?v=phase467";
import { EricDealerModule } from "./dealer/eric_dealer_module.js?v=phase467";

export const BUILD="PHASE-467-QUEST-LOBBY-TABLE-DEALER-AUTHORITY";
const TABLE_PRESET=Object.freeze({tableY:0.62,feltDrop:0.014,innerMargin:0.125,collisionDrop:0.02,cardLift:0.0006});
const DEALER_PRESET=Object.freeze({scale:0.0047,y:0,z:1.46,x:-0.10,shoulderX:0.55,shoulderZ:-0.48,elbowX:0.36,wristZ:-0.45,speed:1.35});
const state={build:BUILD,installed:false,tableReady:false,ericReady:false,dealing:false,animationFrames:0,lastError:null,checkedAt:null};
let table=null,dealer=null,lights=null,last=performance.now(),installPromise=null;

function installLights(scene){
  if(lights?.parent)return;
  lights=new THREE.Group();lights.name="PHASE467_LOBBY_TABLE_LIGHTS";
  const key=new THREE.SpotLight(0xfff2df,3.8,9,Math.PI/4.2,.5,1.3);
  key.position.set(2.1,3.2,-1.0);key.target.position.set(0,.72,.75);
  const fill=new THREE.DirectionalLight(0xb8eaff,1.0);fill.position.set(-2.2,2.5,0);
  const rim=new THREE.PointLight(0x9e55ff,1.8,7,1.7);rim.position.set(-1.4,1.8,2.5);
  lights.add(key,key.target,fill,rim);scene.add(lights);
}
export async function installPhase467QuestLobbyTableDealer({scene,renderer}={}){
  if(state.installed)return window.SVR_PHASE467_LOBBY_TABLE_DEALER;
  if(installPromise)return installPromise;
  installPromise=(async()=>{
    if(!scene||!renderer)throw new Error("PHASE467_SCENE_RENDERER_REQUIRED");
    table=new TableCalibrationModule(scene,TABLE_PRESET);
    table.group.name="PHASE467_LOBBY_APPROVED_TABLE_ROOT";
    table.presentationGroup.name="PHASE467_LOBBY_TABLE_PRESENTATION";
    table.brandingGroup.name="PHASE467_LOBBY_TABLE_BRANDING";
    await table.load();
    table.table.name="PHASE467_LOBBY_APPROVED_TABLE_GLB";
    table.table.position.z+=0.75;
    table.setParams(TABLE_PRESET);
    table.toggleGuides(false);
    table.applyHiddenCovers?.();
    for(const rec of table.nativeFeltRecords||[])rec.mesh.visible=true;
    for(const rec of table.handRestRecords||[])rec.mesh.visible=true;
    if(table.brandingMesh)table.brandingMesh.visible=true;

    dealer=new EricDealerModule(scene,DEALER_PRESET);
    dealer.group.name="PHASE467_LOBBY_APPROVED_ERIC_ROOT";
    dealer.propGroup.name="PHASE467_LOBBY_APPROVED_ERIC_PROPS";
    await dealer.load();
    if(dealer.model)dealer.model.name="PHASE467_LOBBY_APPROVED_ERIC_MODEL";
    dealer.setParams(DEALER_PRESET);
    dealer.groundToFloor(0);
    dealer.setMode("deal-loop");
    installLights(scene);

    const runtime={
      build:BUILD,scene,renderer,table,dealer,
      dealLoop:()=>dealer.setMode("deal-loop"),
      dealOnce:()=>dealer.setMode("deal-once"),
      idle:()=>dealer.setMode("idle"),
      update(dt,elapsed){dealer.update(dt,elapsed);state.animationFrames++;state.dealing=dealer.mode!=="idle";state.checkedAt=new Date().toISOString()},
      qa:()=>({...state,tableReady:Boolean(table?.table?.parent),ericReady:Boolean(dealer?.loaded&&dealer?.group?.parent),dealing:Boolean(dealer?.mode!=="idle"),pass:Boolean(state.installed&&table?.table?.parent&&dealer?.loaded&&!state.lastError),checkedAt:new Date().toISOString()})
    };
    state.installed=true;state.tableReady=true;state.ericReady=true;state.dealing=true;state.lastError=null;state.checkedAt=new Date().toISOString();
    window.SVR_PHASE467_LOBBY_TABLE_DEALER=runtime;
    window.SVR_PHASE467_QUEST_LOBBY_QA=runtime.qa;
    return runtime;
  })().catch(error=>{state.lastError=String(error?.stack||error?.message||error);state.checkedAt=new Date().toISOString();throw error});
  return installPromise;
}
