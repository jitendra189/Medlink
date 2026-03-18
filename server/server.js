require("dotenv").config()

const app = require("./app")
const http = require("http")
const { Server } = require("socket.io")
const connectDB = require("./config/db")

/* CONNECT DATABASE */

connectDB()

const PORT = process.env.PORT || 5000

const server = http.createServer(app)

/* SOCKET.IO SETUP */

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
})

global.io = io

io.on("connection", (socket) => {
  console.log("Client connected:", socket.id)

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id)
  })
})

/* START SERVER */

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})