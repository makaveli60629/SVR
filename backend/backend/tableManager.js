
const tables={};

function createTable(id,maxPlayers=6){

tables[id]={
id,
players:[],
maxPlayers,
pot:0,
community:[]
};

}

function joinTable(tableId,playerId){

const table=tables[tableId];
if(!table) return false;

if(table.players.length>=table.maxPlayers)
return false;

table.players.push({
id:playerId,
hand:[],
chips:1000,
bet:0,
folded:false
});

return true;

}

function getTable(id){
return tables[id];
}

module.exports={
createTable,
joinTable,
getTable
};
