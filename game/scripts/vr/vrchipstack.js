
export function createChipStack(scene,amount,pos){

const chip = document.createElement("a-cylinder");

chip.setAttribute("radius","0.15");
chip.setAttribute("height",amount/100);

chip.setAttribute("color","#ff0000");
chip.setAttribute("position",pos);

scene.appendChild(chip);

}
