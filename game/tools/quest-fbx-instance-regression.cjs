const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),THREE=require('three');
(async()=>{
 const {clone}=await import(require('node:url').pathToFileURL(require.resolve('three/addons/utils/SkeletonUtils.js')).href);
 const source=new THREE.Group(),bone=new THREE.Bone();bone.name='hip';
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute([0,0,0,1,0,0,0,1,0],3));geometry.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(Array(12).fill(0),4));geometry.setAttribute('skinWeight',new THREE.Float32BufferAttribute([1,0,0,0,1,0,0,0,1,0,0,0],4));
 const mesh=new THREE.SkinnedMesh(geometry,new THREE.MeshBasicMaterial());mesh.add(bone);mesh.bind(new THREE.Skeleton([bone]));source.add(mesh);
 let loads=0;class Loader{async loadAsync(){loads++;return source}}
 const window={};const context=vm.createContext({FBXLoader:Loader,cloneSkeleton:clone,window,Symbol,URL,location:{href:'https://example.test/game/'}});
 vm.runInContext(fs.readFileSync('game/modules/phase381_asset_load_cache_guard.js','utf8').replace(/^import .*;$/gm,'').replace(/export /g,''),context);
 const loader=new Loader();const [a,b]=await Promise.all([loader.loadAsync('eric.fbx'),loader.loadAsync('eric.fbx')]);
 assert.equal(loads,1,'parse/download should remain cached');assert.notEqual(a,b);
 assert.notEqual(a.children[0].skeleton,b.children[0].skeleton);
 a.children[0].skeleton.bones[0].position.y=42;
 assert.equal(b.children[0].skeleton.bones[0].position.y,0,'floor/animation edits must stay within one dealer');
 a.children[0].material.visible=false;assert.equal(b.children[0].material.visible,true,'material visibility must not leak');
 const sceneA=new THREE.Scene(),sceneB=new THREE.Scene();sceneA.add(a);sceneB.add(b);assert.equal(a.parent,sceneA,'second load cannot steal the first model');
 const eric=fs.readFileSync('game/modules/dealer/eric_dealer_module.js','utf8');const start=eric.indexOf('function canonicalBoneName('),end=eric.indexOf('async function optionalTexture',start);vm.runInContext(eric.slice(start,end),context);
 for(const [name,key] of Object.entries({hip:'hips',spine_03:'spine2',upperarm_l:'leftarm',lowerarm_r:'rightforearm',hand_l:'lefthand',upperleg_r:'rightupleg',LeftHand:'lefthand'})) assert.equal(vm.runInContext(`canonicalBoneName('${name}')`,context),key);
 console.log('PASS: one cached FBX parse, isolated scene instances/skeletons/materials, and actual Eric rig bone aliases.');
})().catch(e=>{console.error(e);process.exitCode=1});
