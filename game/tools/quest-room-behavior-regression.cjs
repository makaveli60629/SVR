const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const THREE = require('three');
function load(file, extra = {}) {
  const source = fs.readFileSync(file, 'utf8').replace(/^import .*;$/gm, '')
    .replace(/export /g, '').replace(/window\.SVR_\w+_READY_PROMISE\s*=\s*install\(\);/g, '');
  const context = vm.createContext({THREE, URLSearchParams, location:{search:'?platform=quest'}, navigator:{userAgent:''}, window:{}, performance, console, setTimeout:()=>0, addEventListener(){}, clearInterval(){}, ...extra});
  vm.runInContext(source, context);
  return context;
}
const initial = load('game/modules/quest_table_world.js');
vm.runInContext('var scene = new THREE.Scene(); createQuestTableWorld(scene);', initial);
assert.equal(initial.scene.children[0].children.filter(o=>o.isLight && o.intensity>0).length,2,'lighting must exist before any model loads');
const scene = new THREE.Scene();
const table = new THREE.Group(), dealer = new THREE.Group(), props = new THREE.Group();
props.name = 'PHASE438_APPROVED_DEALER_PROP_ROOT';
const room = new THREE.Group(); room.name='PHASE462_PROFESSIONAL_TABLE_ROOM';
const wall = new THREE.Mesh(); wall.name='PHASE462_DEALER_BACKGROUND'; room.add(wall);
const lights = new THREE.Group(); lights.name='PHASE438_APPROVED_DEALER_TABLE_LIGHT_RIG';
const duplicate = new THREE.Group(); duplicate.name='LEGACY_ERIC_DEALER';
const duplicateTable = new THREE.Group(); duplicateTable.name='DUPLICATE_TABLE';
scene.add(table,dealer,props,room,lights,duplicate,duplicateTable);
const runtime = {table:{group:table},dealer:{group:dealer,propGroup:props}};
const repair = load('game/modules/phase460_quest_vr_visible_repair.js',{window:{__SVR_SCENE__:scene}, runtime});
vm.runInContext('hardDedupe(runtime)',repair);
for(const object of [table,dealer,props,room,wall,lights]) assert.equal(object.visible,true,`${object.name} must survive deduplication`);
assert.equal(duplicate.visible,false); assert.equal(duplicateTable.visible,false);
let applications=0;
const professional = load('game/modules/phase462_quest_professional_table_room.js',{window:{SVR_PHASE446_SWEEP:()=>applications++,SVR_PHASE446_QA:()=>({seated:true,pass:true})}});
assert.equal(vm.runInContext("seat('test')",professional),true);
assert.equal(applications,1,'room must delegate to calibrated seat owner');
vm.runInContext(`
 scene=new THREE.Scene();
 var tableMesh=new THREE.Mesh(new THREE.BoxGeometry(2,.1,1)); tableMesh.position.y=.7;
 var dealerRoot=new THREE.Group();dealerRoot.position.z=1;
 scene.add(tableMesh,dealerRoot);
 runtime={table:{table:tableMesh},dealer:{group:dealerRoot}};
 buildEnvironment();
`,professional);
const environment = vm.runInContext("scene.getObjectByName('PHASE462_PROFESSIONAL_TABLE_ROOM')",professional);
assert.ok(environment);
assert.equal(environment.getObjectByName('PHASE462_SIDE_NEON_1').geometry.parameters.height,.035);
assert.equal(environment.getObjectByName('PHASE462_DEALER_BACKGROUND_HALO').rotation.x,0,'halo must be vertical');
assert.equal(vm.runInContext('typeof alignCards',professional),'undefined','room must not fight card animation');
console.log('PASS: startup lighting, protected room/props/lights, duplicate removal, single seat owner, narrow accents, vertical halo, card motion ownership.');
