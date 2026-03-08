
document.addEventListener("DOMContentLoaded",()=>{
const seats=document.querySelectorAll('.seat')
const rig=document.querySelector('#rig')

seats.forEach(seat=>{
seat.addEventListener('click',()=>{

let p=seat.getAttribute('position')

rig.setAttribute('position',{
x:p.x,
y:1.6,
z:p.z
})

})
})
})
