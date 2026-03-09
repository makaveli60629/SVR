
function syncTableToVR(table){

  console.log("Syncing table to VR");

  table.players.forEach(player => {
    console.log("Player:", player.id, "chips:", player.chips);
  });

  console.log("Community Cards:", table.community);
  console.log("Pot:", table.pot);

}

module.exports = {
  syncTableToVR
};
