
document.addEventListener("DOMContentLoaded",()=>{
let slot=document.querySelector('#slot')
slot.addEventListener('click',()=>{
let rewards=[50,100,250,500,1000]
let win=rewards[Math.floor(Math.random()*rewards.length)]
alert("Daily Slot Reward: "+win+" chips")
})
})
