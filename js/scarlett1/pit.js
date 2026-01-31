
import { createTable } from "./table.js";
import { createJumbotron } from "./jumbotron.js";

export function pit(scene){
  const {g,seats}=createTable();
  g.position.z=-3;
  scene.add(g);

  const jumbo=createJumbotron();
  scene.add(jumbo);

  return { group:g, seats };
}
