require("dotenv").config();

module.exports = {
  server: process.env.DB_SERVER,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  options: {
    encrypt: false,
    trustServerCertificate: true
  }
};