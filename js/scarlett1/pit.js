import * as THREE from "three";
import {createTable} from "./table.js";
export function pit(scene){
 const {g,seats}=createTable();g.position.z=-3;scene.add(g);
 return{group:g,seats};
}
