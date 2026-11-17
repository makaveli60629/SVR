const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),THREE=require('three');
const source=fs.readFileSync('game/modules/phase341_canonical_table_geometry_card_motion_lock.js','utf8');
function fn(name){const start=source.indexOf('function '+name+'(');const asyncStart=source.slice(start-6,start)==='async '?start-6:start;const brace=source.indexOf('{',start);let end=brace,depth=1;while(depth){end++;if(source[end]==='{')depth++;if(source[end]==='}')depth--;}return source.slice(asyncStart,end+1);}
const scene=new THREE.Scene();let resolveLogo;
const context=vm.createContext({THREE,scene,window:{},V:()=>scene,R:()=>scene,detect:()=>true,
 orientForQuestPlayer(){},buildPass(){},buildLogo:()=>new Promise(resolve=>resolveLogo=resolve),sync(){},bindAndroid(){},
 record(name){const mesh=new THREE.Mesh();mesh.name=name;context.group.add(mesh);return {mesh}},setPose(){},layout:{burn:{x:0,z:0}},
 ROOT:'PHASE341_CANONICAL_TABLE_PRESENTATION_ROOT'});
vm.runInContext('var group,root,lastHand,rebuilding=null;var records={holes:Array.from({length:6},()=>[]),community:[],burn:[]};'+fn('buildCards')+fn('performRebuild')+fn('rebuild'),context);
(async()=>{
 for(let i=0;i<2;i++){
  const a=vm.runInContext('rebuild()',context),b=vm.runInContext('rebuild()',context);
  assert.equal(a,b,'overlapping rebuild callers must share one in-flight operation');
  assert.equal(context.group.children.length,20,'all cards must exist before optional logo loading finishes');
  resolveLogo();await a;
  assert.equal(scene.children.length,1,'only one presentation root may remain');
  assert.equal(vm.runInContext('records.burn.length',context),3,'burn records cannot accumulate across rebuilds');
 }
 const orientation=vm.createContext({THREE,window:{SVR_PLATFORM:'quest',__SVR_CAMERA__:new THREE.PerspectiveCamera()},root:new THREE.Scene(),group:new THREE.Group(),layout:{center:{x:2,z:3}}});
 orientation.window.__SVR_CAMERA__.position.set(2,1,-1);
 vm.runInContext(fn('orientForQuestPlayer'),orientation);vm.runInContext('orientForQuestPlayer()',orientation);
 const hole=new THREE.Object3D();hole.position.set(2,.6,3.4);orientation.group.add(hole);orientation.group.updateMatrixWorld(true);
 assert.ok(hole.getWorldPosition(new THREE.Vector3()).z<3,'human hole cards must be on the player side for a north-facing seat');
 const guardSource=fs.readFileSync('game/modules/phase390_surface_cards_final_guard.js','utf8');
 const guard=guardSource.slice(guardSource.indexOf('async function sweep('),guardSource.indexOf('function frame('));
 let rebuilds=0;const native={nativeFeltRecords:[{}],table:new THREE.Group(),getSurfaceY:()=>.63};
 const guardContext=vm.createContext({ACTIVE:true,scene,window:{__SVR_SCENE__:scene,SVR_LOBBY_DEALER_MODULE:{table:native}},state:{},Date,normalizeCards:()=>({root:{},cards:Array(20).fill({})}),rebuild:async()=>{rebuilds++}});
 vm.runInContext(guard,guardContext);
 for(let i=0;i<10;i++)assert.equal(await vm.runInContext('sweep()',guardContext),true);
 assert.equal(rebuilds,0,'a retired surface must not restart valid native-felt card animations');
 assert.equal(guardContext.state.surfaceTopY,.63);
 console.log('PASS: serialized card rebuilds, complete card root during logo load, single root three burn records after rebuilding, and no legacy-surface rebuild loop.');
})().catch(e=>{console.error(e);process.exitCode=1});
