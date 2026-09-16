// Run with Three.js 0.160 available via NODE_PATH (or npm install --no-save three@0.160.0).
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const THREE = require('three');
function moduleContext(path, extra = {}) {
  let source = fs.readFileSync(path, 'utf8')
    .replace(/^import .*;$/gm, '')
    .replace(/export /g, '')
    .replace(/import\.meta\.url/g, "'http://localhost/game/modules/dealer/eric_dealer_module.js'")
    .replace(/window\.(SVR_\w+_READY_PROMISE) = install\(\);/g, 'window.$1 = null;');
  const context = vm.createContext({ THREE, URL, URLSearchParams, location: {search:'?platform=quest'}, navigator:{userAgent:''}, EventTarget, CustomEvent, performance, console, setTimeout:()=>0, clearInterval(){}, addEventListener(){}, window:{}, ...extra });
  vm.runInContext(source, context);
  return context;
}
(async()=>{
  const dealerContext = moduleContext('game/modules/dealer/eric_dealer_module.js');
  vm.runInContext(`
    var dealer = new EricDealerModule(new THREE.Scene());
    var arm = new THREE.Bone();
    dealer.bones.set('rightarm', arm);
    dealer.baseRotations.set(arm, arm.quaternion.clone());
    dealer.loaded = true;
    dealer.update(1/72, 0);
    var firstPose = arm.quaternion.clone();
    for (let frame=0; frame<720; frame++) dealer.update(1/72, frame/72);
  `, dealerContext);
  assert.ok(dealerContext.arm.quaternion.angleTo(dealerContext.firstPose)<1e-7, 'idle pose must not accumulate without a clip');
  vm.runInContext(`dealer.setMode('deal-loop'); dealer.update(1/72,.5); var dealPose=arm.quaternion.clone(); dealer.update(1/72,.5);`,dealerContext);
  assert.ok(dealerContext.arm.quaternion.angleTo(dealerContext.dealPose)<1e-7,'same dealing timestamp must produce same pose');

  let line={centerX:0,centerZ:0,halfWidth:1,halfDepth:.5,cornerRadius:.1};
  const runtime={table:{table:{},presentationGroup:{},brandingGroup:{},brandingMesh:{material:{}},hiddenCoverRecords:[]},interaction:{}};
  const overlay=moduleContext('game/modules/phase441_quest_table_overlay_guard.js',{window:{SVR_LOBBY_DEALER_MODULE:runtime,SVR_PHASE441_QA:()=>({passLine:line})}});
  assert.equal(vm.runInContext('installLocks()',overlay),true);
  assert.equal(runtime.interaction.isPastLine({x:0,z:0}),true);
  line={...line,centerX:3,halfWidth:.8};
  assert.equal(runtime.table.getBettingLine().centerX,3);
  assert.equal(runtime.interaction.isPastLine({x:0,z:0}),false,'old table center must no longer be in betting area');
  assert.equal(runtime.interaction.isPastLine({x:3,z:0}),true);
  assert.equal(runtime.table.brandingMesh.visible,false,'floating cover stays hidden');

  const seat=moduleContext('game/modules/phase446_quest_lab_table_seat_lock.js');
  vm.runInContext(`
    scene=new THREE.Scene();
    var tableMesh=new THREE.Mesh(new THREE.BoxGeometry(2,.1,1));
    runtime={table:{table:tableMesh}};scene.add(tableMesh);
    var decals=new THREE.Group();decals.name='PHASE441_TABLE_SAFE_DECALS';decals.visible=false;scene.add(decals);
    var legacy=new THREE.Mesh(new THREE.BoxGeometry(1,.01,.5));legacy.name='FLOATING_WHITE_LINE';scene.add(legacy);
    clearFloatingTableLines();
  `,seat);
  assert.equal(seat.decals.visible,true,'approved logo and line must remain visible');
  assert.equal(seat.legacy.visible,false,'legacy floating line must remain hidden');
  const surface=moduleContext('game/modules/phase441_quest_table_clearance_polish.js');
  vm.runInContext(`
    scene=new THREE.Scene();
    var felt=new THREE.Mesh(new THREE.BoxGeometry(2,.04,1));scene.add(felt);
    var surfaceTable={nativeFeltRecords:[{mesh:felt}]};
    badgeLeftTexture=new THREE.Texture();badgeRightTexture=new THREE.Texture();
    getLogoTexture=async()=>new THREE.Texture();
  `,surface);
  await vm.runInContext('Promise.all([rebuildDecals(surfaceTable),rebuildDecals(surfaceTable)])',surface);
  assert.equal(vm.runInContext('decalGroup.children.length',surface),5,'concurrent sweeps must build exactly one decal set');
  assert.equal(vm.runInContext("decalGroup.getObjectByName('PHASE441_CENTER_SVR_LOGO').material.depthTest",surface),true,'logo must respect occlusion');
  console.log('Quest behavioral regressions passed: stable idle/deal poses, resized betting boundary, visible approved decals, hidden legacy overlay.');
})();
