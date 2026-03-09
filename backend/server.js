
const express=require("express")
const cors=require("cors")
const app=express()
app.use(cors())
app.use(express.json())
app.get("/",(req,res)=>res.send("SVR Cyberpunk Casino Backend Running"))
app.listen(8080,()=>console.log("Server running on 8080"))
