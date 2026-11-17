const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict'),THREE=require('three');
for(const [file,fn] of [
 ['phase331_quest_meta_hands_table_interaction_lock.js','table'],
 ['phase333_quest_shader_gameplay_polish_lock.js','authoritativeTable'],
 ['phase334_table_layout_gesture_poker_lock.js','authoritativeTable'],
 ['phase335_oculus_acceptance_gameplay_stability_lock.js','table']
]){
 const source=fs.readFileSync('game/modules/'+file,'utf8');
 const start=source.indexOf('function '+fn+'('),brace=source.indexOf('{',start);let end=brace,depth=1;
 while(depth){end++;if(source[end]==='{')depth++;if(source[end]==='}')depth--;}
 const table=new THREE.Group(),legacy=new THREE.Group();
 const window={SVR_LOBBY_DEALER_MODULE:{table:{table}},SVR_TABLE_AUTHORITY:legacy};
 const context=vm.createContext({window});vm.runInContext(source.slice(start,end+1),context);
 assert.equal(vm.runInContext(fn+'()',context),table,file+' must use the current approved table');
 delete window.SVR_LOBBY_DEALER_MODULE;
 assert.equal(vm.runInContext(fn+'()',context),legacy,file+' must fall back to the table authority');
}
console.log('PASS: hands, action buttons, layout and acceptance controls resolve the current approved table and original fallback.');
const cleanSource=fs.readFileSync('game/modules/phase396_quest_seated_clean_table_deal_lock.js','utf8');
const stage=new THREE.Scene(),table=new THREE.Mesh(new THREE.BoxGeometry(2,.1,1));table.position.y=.6;stage.add(table);
const ui=new THREE.Group();ui.userData.svrUserInterface=true;stage.add(ui);
const label=new THREE.Mesh(new THREE.PlaneGeometry(.2,.1));label.name='PHASE333_ACTION_LABEL_FOLD';label.position.y=.7;ui.add(label);
const clutter=label.clone();clutter.name='LEGACY_LABEL_PLANE';stage.add(clutter);
const bounds=o=>{o.updateWorldMatrix(true,true);const box=new THREE.Box3().setFromObject(o);return {box,center:box.getCenter(new THREE.Vector3())}};
const cleanContext=vm.createContext({scene:stage,table,felt:null,state:{tabletopObjectsHidden:0},findTable:()=>table,findFelt:()=>null,bounds,inside:()=>false,walk:(root,fn)=>root.traverse(fn)});
vm.runInContext(cleanSource.match(/^const TABLETOP_ASSET=.*$/m)[0]+cleanSource.match(/^const KEEP=.*$/m)[0]+cleanSource.slice(cleanSource.indexOf('function cleanTabletop()'),cleanSource.indexOf('function cardObjects()')),cleanContext);
vm.runInContext('cleanTabletop()',cleanContext);
assert.equal(label.visible,true,'table cleanup must preserve labels belonging to live gameplay UI');
assert.equal(clutter.visible,false,'unowned legacy labels should still be removed');
console.log('PASS: live action labels survive tabletop cleanup while legacy label clutter is removed.');
