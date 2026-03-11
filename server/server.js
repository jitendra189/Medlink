const app = require("./app")
const http = require("http")
const { Server } = require("socket.io")
const connectDB = require("./config/db")

require("dotenv").config()

/* CONNECT DATABASE */

connectDB()

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

const io = new Server(server,{
cors:{origin:"*"}
})

global.io = io

io.on("connection",(socket)=>{
console.log("Client connected:",socket.id)

socket.on("disconnect",()=>{
console.log("Client disconnected")
})

})

server.listen(PORT,()=>{
console.log("Server running on port",PORT)
})