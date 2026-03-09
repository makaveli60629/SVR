const sql=require("mssql")

async function updateChips(pool,id,chips){

 await pool.request()
   .input("id",sql.Int,id)
   .input("chips",sql.Int,chips)
   .query(`
     UPDATE users
     SET chips=@chips
     WHERE id=@id
   `)

}

module.exports={updateChips}
