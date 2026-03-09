
const express = require("express")
const http = require("http")
const { Server } = require("socket.io")
const path = require("path")

const app = express()
const server = http.createServer(app)
const io = new Server(server)

const PORT = 8080

const GAME_PATH = path.join(__dirname, "../../game")
const ASSET_PATH = path.join(__dirname, "../../game/assets")

app.use("/game", express.static(GAME_PATH))
app.use("/assets", express.static(ASSET_PATH))

app.get("/api/startHand", (req, res) => {
  console.log("Poker hand started")
  res.json({status:"ok"})
})

io.on("connection", (socket)=>{
  console.log("Player connected:", socket.id)

  socket.on("startHand", ()=>{
    io.emit("handStarted")
  })

  socket.on("disconnect", ()=>{
    console.log("Player disconnected:", socket.id)
  })
})

server.listen(PORT, ()=>{
  console.log("===================================")
  console.log("SVR Poker Server Running")
  console.log("http://localhost:8080/game/index.html")
  console.log("===================================")
})
