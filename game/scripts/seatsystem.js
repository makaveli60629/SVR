
document.addEventListener("DOMContentLoaded",()=>{
const seats=document.querySelectorAll('.seat')
const rig=document.querySelector('#rig')
seats.forEach(seat=>{
seat.addEventListener('click',()=>{
let pos=seat.getAttribute('position')
rig.setAttribute('position',{x:pos.x,y:1.6,z:pos.z})
})
})
})
