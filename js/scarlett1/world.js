export async function initWorld({THREE,scene,camera,log}){
log('[world] init');
scene.background=new THREE.Color(0x050508);
scene.add(new THREE.HemisphereLight(0xffffff,0x444444,1.2));
const d=new THREE.DirectionalLight(0xffffff,1.5);d.position.set(5,10,5);scene.add(d);
const floor=new THREE.Mesh(new THREE.CircleGeometry(12,64),new THREE.MeshStandardMaterial({color:0x111116}));
floor.rotation.x=-Math.PI/2;scene.add(floor);
const walls=new THREE.Mesh(new THREE.CylinderGeometry(10,10,4,64,1,true),new THREE.MeshStandardMaterial({color:0x1a1a22,side:THREE.BackSide}));
walls.position.y=2;scene.add(walls);
camera.position.set(0,1.6,6);camera.lookAt(0,1.4,0);
log('[world] ready');
return{updates:[]};
}
