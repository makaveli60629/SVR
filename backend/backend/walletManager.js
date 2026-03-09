
const sql = require("mssql");

async function getWallet(playerId){

  const result =
    await sql.query`
      SELECT balance FROM Wallets
      WHERE player_id = ${playerId}
    `;

  return result.recordset[0];
}

async function updateWallet(playerId, amount){

  await sql.query`
    UPDATE Wallets
    SET balance = balance + ${amount}
    WHERE player_id = ${playerId}
  `;

}

module.exports = {
  getWallet,
  updateWallet
};
