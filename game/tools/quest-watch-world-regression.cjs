// NODE_PATH=/path/to/three/node_modules node game/tools/quest-watch-world-regression.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const THREE = require('three');
const context2d = new Proxy({}, { get: (_, key) => key === 'createLinearGradient' ? () => ({ addColorStop() {} }) : () => {} });
const document = {
  createElement: () => ({ getContext: () => context2d }),
  getElementById: () => null,
  querySelectorAll: () => [],
  body: { classList: { add() {}, remove() {} }, dataset: {} },
  addEventListener() {}
};
function source(path) { return fs.readFileSync(path, 'utf8').replace(/^import .*;$/gm, '').replace(/export /g, ''); }
function context(extra = {}) {
  const window = { addEventListener() {}, dispatchEvent() {} }; window.self = window; window.top = window;
  return vm.createContext({ THREE, URLSearchParams, location: { search: '?platform=quest&direct=1&tableonly=1', pathname:'/game/index.html' },
    navigator: { userAgent: 'Mozilla/5.0 (Linux; Android; Quest 2) OculusBrowser' },
    document, window, performance, console, setTimeout:()=>0, clearInterval(){}, addEventListener(){},
    ...extra });
}
(async () => {
  const c = context();
  vm.runInContext(source('game/modules/quest_table_world.js'), c);
  vm.runInContext(source('game/modules/gestures.js'), c);
  vm.runInContext('const CONFIG = { PINCH_DIST: .025 };', c);
  vm.runInContext(source('game/modules/watch.js'), c);
  vm.runInContext(`
    var scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera();
    camera.position.set(0,1.6,1.2);
    var renderer = {xr:{isPresenting:false,getCamera:()=>camera,addEventListener(){}},domElement:{},setAnimationLoop:fn=>window.testFrame=fn,render(){}};
    var hand = new THREE.Group(); hand.joints = {};
    for (const [name, pos] of Object.entries({wrist:[0,1,0],'index-finger-metacarpal':[.025,1,-.065],'pinky-finger-metacarpal':[-.025,1,-.065],'index-finger-tip':[.02,1,-.12],'thumb-tip':[.04,1,-.1]})) {
      const j = new THREE.Object3D(); j.position.fromArray(pos); hand.joints[name]=j; scene.add(j);
    }
    var right = new THREE.Group(); right.joints={};
    for (const name of ['wrist','index-finger-tip','thumb-tip']) {const j = new THREE.Object3D();j.position.set(2,1,0);right.joints[name]=j;scene.add(j);}
    var inputs = {leftHand:hand,rightHand:right,leftController:null,rightController:null};
    var actions = []; window.SVR_POKER_ACTION = action => {actions.push(action);return true};
    var createCore=()=>({scene,camera,renderer});
    var createPhase148QuestPerfPass=()=>({lockSceneForQuest(){},onXRSessionStart(){},optionalTickAllowed:()=>false,reportFrame(){}});
    var createHands=()=>({update(){},getLeftHand:()=>inputs.leftHand,getRightHand:()=>inputs.rightHand,getLeftController:()=>inputs.leftController,getRightController:()=>inputs.rightController});
    var createTeleportRig=()=>({setLogoTexture(){},update(){},isEnabled:()=>false,onSessionStart:async()=>{}});
    var createAndroidSmartControls=()=>({isAndroid:false});
    var createDesktopControls=()=>{throw new Error('Quest must not start desktop movement')};
    var assetUrls=()=>[],loadFirstTexture=async()=>new THREE.Texture();
  `, c);
  await vm.runInContext('(async()=>{' + source('game/main.js') + '})()', c);
  assert.equal(c.window.SVR_QUEST_WORLD_STATE.legacyLobbyConstructed, false);
  assert.equal(c.window.__SVR_ANDROID_SMART_LOCK__, false, 'Quest Android UA must not start phone controls');
  assert.equal(c.scene.getObjectByName('PHASE200_ORDERED_GRAND_LOBBY_ROOT'), undefined);
  c.window.testFrame();
  const watch = c.window.SVR_WRIST_WATCH.object;
  assert.equal(watch.visible, true, 'real main-loop bundle must display watch');
  assert.ok(watch.position.toArray().every(Number.isFinite));
  const point = watch.localToWorld(new THREE.Vector3((.5 - 184/1024)*.224, (242/512-.5)*.116, .012));
  c.right.joints['index-finger-tip'].position.copy(point);
  c.right.joints['thumb-tip'].position.copy(point).addScalar(.001);
  for (let i=0; i<30; i++) c.window.SVR_WRIST_WATCH.update(1/72,c.inputs);
  assert.deepEqual(Array.from(c.actions), ['fold'], 'one held opposite-hand pinch sends one action');
  c.inputs.leftHand = null; c.inputs.rightHand = null;
  c.window.testFrame();
  assert.equal(watch.visible, false, 'lost tracking hides the watch');

  // Real controller fallback: no metacarpal joints are required. The proxy
  // carries a tracked controller transform plus synthetic fingertip joints.
  const controllerObject = new THREE.Group(); controllerObject.position.set(-.2,1.1,.1); scene.add(controllerObject);
  const proxy = new THREE.Group(); proxy.userData.controller=controllerObject; proxy.userData.trigger=0; proxy.joints={};
  for (const name of ['wrist','index-finger-tip','thumb-tip']) { const j=new THREE.Object3D(); proxy.joints[name]=j; proxy.add(j); }
  scene.add(proxy);
  c.inputs.leftController = proxy;
  c.window.testFrame();
  assert.equal(watch.visible, true, 'controller proxy restores the watch without metacarpal hand joints');
  assert.equal(c.window.SVR_PHASE460_WATCH_STATE.anchor, 'controller');
  assert.ok(watch.position.toArray().every(Number.isFinite));

  c.window.SVR_WRIST_WATCH.update(1/72,c.hand,null);
  assert.equal(watch.visible, true, 'legacy positional callers remain compatible');

  const geo = context();
  vm.runInContext(source('game/modules/quest_table_clearance.js'), geo);
  vm.runInContext(`
    var scene=new THREE.Scene(), group=new THREE.Group();scene.add(group);
    var felt=new THREE.Mesh(new THREE.BoxGeometry(2,.04,1));felt.name='NATIVE_FELT';felt.position.y=.7;group.add(felt);
    var runtime={table:{group,nativeFeltRecords:[{mesh:felt}],hiddenCoverRecords:[]},dealer:{}};
    var cover=new THREE.Mesh(new THREE.BoxGeometry(1.9,.02,.9));cover.position.y=1.1;scene.add(cover);
    var internalCover=new THREE.Mesh(new THREE.BoxGeometry(1.9,.02,.9));internalCover.name='TABLETOP_LEGACY_COVER';internalCover.position.y=.78;group.add(internalCover);
    var cards=new THREE.Group();cards.name='PHASE341_CARDS';scene.add(cards);
    var card=new THREE.Mesh(new THREE.BoxGeometry(.06,.002,.09));card.position.y=.73;cards.add(card);
    var ui=new THREE.Group();ui.userData.svrUserInterface=true;scene.add(ui);
    var screen=cover.clone();ui.add(screen);
    var result=clearQuestTableObstructions(scene,runtime);
  `, geo);
  assert.equal(geo.result.removed, 2, 'external and internal broad hovering covers must be found geometrically');
  assert.equal(geo.result.internal, 1, 'authoritative table-group cover must no longer bypass clearance');
  assert.equal(geo.cover.visible, false);
  assert.equal(geo.internalCover.visible, false);
  assert.equal(geo.felt.visible, true);
  assert.equal(geo.card.visible, true);
  assert.equal(geo.screen.visible, true);
  assert.equal(vm.runInContext('clearQuestTableObstructions(scene,runtime).removed',geo),0,'cleanup is idempotent');

  const manifest = context();
  vm.runInContext(source('game/modules/phase340_platform_manifest.js'),manifest);
  assert.equal(vm.runInContext("validateManifest('quest').pass",manifest),true);
  assert.equal(vm.runInContext("manifestFor('quest').some(p=>p.startsWith('phase101_'))",manifest),false);
  assert.equal(vm.runInContext("manifestFor('desktop').includes('phase101_boot_load_screen_recovery.js')",manifest),true);
  const seat = context({ clearQuestTableObstructions:()=>({checked:true,removed:0}) });
  vm.runInContext(source('game/modules/phase446_quest_lab_table_seat_lock.js').replace('window.SVR_PHASE446_READY_PROMISE = install()', 'window.SVR_PHASE446_READY_PROMISE = null'), seat);
  vm.runInContext(`
    scene=new THREE.Scene();camera=new THREE.PerspectiveCamera();renderer={xr:{isPresenting:false}};
    var table=new THREE.Mesh(new THREE.BoxGeometry(2,.1,1));table.position.y=.7;
    var dealer=new THREE.Group();dealer.position.set(0,0,1.4);scene.add(table,dealer);
    runtime={table:{table,group:table},dealer:{group:dealer,loaded:true}};
    var placements=0,yaw=null;
    window.SVR_TELEPORT_RIG_REF={setPlayerPose(){placements++},setPlayerYaw(value){yaw=value}};
    seat('test');
    var forward=new THREE.Vector3(0,0,-1).applyAxisAngle(new THREE.Vector3(0,1,0),yaw);
    var toTable=table.position.clone().sub(camera.position).setY(0).normalize();
    var directionCorrect=forward.dot(toTable)>.999;
    camera.position.x+=.1;
    seat('later-guard');
  `,seat);
  assert.equal(seat.directionCorrect,true,'seat faces the dealer/table, not away');
  assert.equal(seat.placements,1,'settled guards must not continuously reset the user pose');
  assert.equal(seat.window.SVR_QUEST_SEAT_OWNER,'phase446');
  console.log('Quest Phase 460 main-loop, controller watch, table-only world, internal/external clearance and platform regressions passed.');
})().catch(error=>{console.error(error);process.exitCode=1});