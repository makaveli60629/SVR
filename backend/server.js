
require("dotenv").config()
const express = require("express")
const sql = require("mssql")
const bcrypt = require("bcrypt")
const jwt = require("jsonwebtoken")
const cors = require("cors")

const app = express()
app.use(cors())
app.use(express.json())

const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: { encrypt: true }
}

sql.connect(config).then(()=>{
    console.log("Connected to Azure SQL")
}).catch(err=>console.error(err))

app.get("/", (req,res)=>{
    res.send("SVR Backend Running")
})

app.post("/api/register", async (req,res)=>{

    const {username,email,password} = req.body

    const hash = await bcrypt.hash(password,10)

    await sql.query`
        INSERT INTO users(username,email,password_hash)
        VALUES(${username},${email},${hash})
    `

    res.json({success:true})
})

app.post("/api/login", async (req,res)=>{

    const {email,password} = req.body

    const result = await sql.query`
        SELECT * FROM users WHERE email=${email}
    `

    const user = result.recordset[0]

    if(!user){
        return res.json({success:false})
    }

    const valid = await bcrypt.compare(password,user.password_hash)

    if(!valid){
        return res.json({success:false})
    }

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
})

app.get("/api/user", async (req,res)=>{

    const auth = req.headers.authorization
    if(!auth) return res.status(401).json({error:"No token"})

    const token = auth.split(" ")[1]

    const decoded = jwt.verify(token,process.env.JWT_SECRET)

    const result = await sql.query`
        SELECT username,chips FROM users WHERE id=${decoded.id}
    `

    res.json(result.recordset[0])
})

const PORT = process.env.PORT || 3000
app.listen(PORT,()=>{
    console.log("Server running on port "+PORT)
})
