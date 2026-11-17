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
