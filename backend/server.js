require("dotenv").config()

const express = require("express")
const sql = require("mssql")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cors = require("cors")

const app = express()

app.use(cors())
app.use(express.json())

// Prevent browser GET usage
app.get("/api/login",(req,res)=>{
res.json({error:"Use POST request"})
})

app.get("/api/register",(req,res)=>{
res.json({error:"Use POST request"})
})

// Health endpoint
app.get("/health",(req,res)=>{
res.json({status:"ok"})
})

// Root test
app.get("/",(req,res)=>{
res.send("SVR Backend Running")
})

const config = {
user:process.env.DB_USER,
password:process.env.DB_PASSWORD,
server:process.env.DB_SERVER,
database:process.env.DB_DATABASE,
options:{
encrypt:true,
trustServerCertificate:false
}
}

let pool

async function connectDB(){
try{
pool = await sql.connect(config)
console.log("Connected to Azure SQL")
}catch(err){
console.error("SQL connection error:",err)
}
}

connectDB()

// Register
app.post("/api/register",async(req,res)=>{
try{

const {username,email,password} = req.body

const hash = await bcrypt.hash(password,10)

await pool.request()
.input("username",sql.NVarChar,username)
.input("email",sql.NVarChar,email)
.input("hash",sql.NVarChar,hash)
.query(`
INSERT INTO users(username,email,password_hash)
VALUES(@username,@email,@hash)
`)

res.json({success:true})

}catch(err){
console.error(err)
res.status(500).json({error:"Registration failed"})
}
})

// Login
app.post("/api/login",async(req,res)=>{
try{

const {email,password} = req.body

const result = await pool.request()
.input("email",sql.NVarChar,email)
.query(`SELECT * FROM users WHERE email=@email`)

const user = result.recordset[0]

if(!user) return res.json({success:false})

const valid = await bcrypt.compare(password,user.password_hash)

if(!valid) return res.json({success:false})

const token = jwt.sign(
{id:user.id},
process.env.JWT_SECRET,
{expiresIn:"7d"}
)

res.json({
success:true,
token,
username:user.username,
chips:user.chips
})

}catch(err){
console.error(err)
res.status(500).json({error:"Login failed"})
}
})

// User profile
app.get("/api/user",async(req,res)=>{

try{

const auth = req.headers.authorization
if(!auth) return res.status(401).json({error:"No token"})

const token = auth.split(" ")[1]
const decoded = jwt.verify(token,process.env.JWT_SECRET)

const result = await pool.request()
.input("id",sql.Int,decoded.id)
.query(`SELECT username,chips FROM users WHERE id=@id`)

res.json(result.recordset[0])

}catch(err){
console.error(err)
res.status(401).json({error:"Invalid token"})
}
})

const PORT = process.env.PORT || 8080

app.listen(PORT,()=>{
console.log("Server running on port "+PORT)
})
