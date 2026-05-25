import sql from 'mssql';
let pool;
export async function getPool(){
  if (!process.env.AZURE_SQL_CONNECTION_STRING) throw new Error('Missing AZURE_SQL_CONNECTION_STRING');
  if (!pool) pool = await sql.connect(process.env.AZURE_SQL_CONNECTION_STRING);
  return pool;
}
export { sql };
