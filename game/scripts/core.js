
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160/build/three.module.js'
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160/examples/jsm/loaders/GLTFLoader.js'

let scene,camera,renderer

init()
animate()

function init(){

scene = new THREE.Scene()

camera = new THREE.PerspectiveCamera(
70,
window.innerWidth/window.innerHeight,
0.1,
1000
)

camera.position.set(0,1.6,4)
camera.lookAt(0,1,0)

renderer = new THREE.WebGLRenderer({antialias:true})
renderer.setSize(window.innerWidth,window.innerHeight)

document.body.appendChild(renderer.domElement)

const ambient = new THREE.AmbientLight(0xffffff,.6)
scene.add(ambient)

const light = new THREE.DirectionalLight(0xffffff,1)
light.position.set(5,10,5)
scene.add(light)

createRooftop()
loadTable()
loadMoon()

}

function createRooftop(){

const floor = new THREE.Mesh(
new THREE.PlaneGeometry(60,60),
new THREE.MeshStandardMaterial({color:0x111111})
)

floor.rotation.x = -Math.PI/2
scene.add(floor)

}

function loadTable(){

const loader = new GLTFLoader()

loader.load('../assets/models/table.glb',(gltf)=>{

const table = gltf.scene
table.position.set(0,0,0)
scene.add(table)

})

}

function loadMoon(){

const geo = new THREE.SphereGeometry(4,32,32)

const mat = new THREE.MeshBasicMaterial({
color:0xffffff
})

const moon = new THREE.Mesh(geo,mat)

moon.position.set(0,30,-80)

scene.add(moon)

}

function animate(){

requestAnimationFrame(animate)

renderer.render(scene,camera)

}
