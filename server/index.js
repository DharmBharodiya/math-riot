const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

let waitingPlayer = null;

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  if (waitingPlayer) {
    const roomId = `${waitingPlayer.id}_${socket.id}`;
    socket.join(roomId);
    waitingPlayer.join(roomId);

    io.to(roomId).emit("match_found", { roomId });
    waitingPlayer = null;
  } else {
    waitingPlayer = socket;
  }

  socket.on("submit_score", ({ roomId, score }) => {
    socket.data.score = score;

    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size === 2) {
      const players = Array.from(room);
      const [player1, player2] = players.map(id => io.sockets.sockets.get(id));
      if (player1?.data.score !== undefined && player2?.data.score !== undefined) {
        io.to(roomId).emit("end_game", {
          p1: player1.data.score,
          p2: player2.data.score,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Disconnected:", socket.id);
    if (waitingPlayer === socket) waitingPlayer = null;
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
