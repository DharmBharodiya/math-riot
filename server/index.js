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

// Helper: Generate shared question sequence
function generateQuestionSequence(count = 100) {
  const ops = ['+', '-', '*', '/'];
  const questions = [];

  for (let i = 0; i < count; i++) {
    const op = ops[Math.floor(Math.random() * ops.length)];
    let a, b, answer;
    if (op === '+') {
      // Addition: 80% 2-digit, 20% 3-digit
      if (Math.random() < 0.8) {
        a = Math.floor(Math.random() * 90) + 10; // 10-99
        b = Math.floor(Math.random() * 90) + 10;
      } else {
        a = Math.floor(Math.random() * 900) + 100; // 100-999
        b = Math.floor(Math.random() * 900) + 100;
      }
      answer = a + b;
    } else if (op === '-') {
      // Subtraction: 80% 2-digit, 20% 3-digit, ensure non-negative
      if (Math.random() < 0.8) {
        a = Math.floor(Math.random() * 90) + 10;
        b = Math.floor(Math.random() * 90) + 10;
        if (b > a) [a, b] = [b, a]; // swap to ensure a >= b
      } else {
        a = Math.floor(Math.random() * 900) + 100;
        b = Math.floor(Math.random() * 900) + 100;
        if (b > a) [a, b] = [b, a];
      }
      answer = a - b;
    } else if (op === '*') {
      // Multiplication: easy pairs
      if (Math.random() < 0.5) {
        // One large, one small
        a = Math.floor(Math.random() * 30) + 70; // 70-99
        b = Math.floor(Math.random() * 11) + 2;  // 2-12
      } else {
        // Both small
        a = Math.floor(Math.random() * 21) + 10; // 10-30
        b = Math.floor(Math.random() * 21) + 10; // 10-30
      }
      answer = a * b;
    } else if (op === '/') {
      // Division: always 2-digit, whole number answer, no floats
      b = Math.floor(Math.random() * 90) + 10; // 10-99
      answer = Math.floor(Math.random() * 9) + 2; // 2-10
      a = b * answer;
    }
    questions.push({ q: `${a} ${op} ${b}`, a: answer });
  }

  return questions;
}

io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  socket.on("start_matchmaking", () => {
    console.log("Matchmaking started by", socket.id);

    if (waitingPlayer) {
      const roomId = `${waitingPlayer.id}_${socket.id}`;
      socket.join(roomId);
      waitingPlayer.join(roomId);

      const questions = generateQuestionSequence(100);

      // Send the shared questions to both players
      io.to(roomId).emit("start_game", {
        roomId,
        questions,
      });

      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
    }
  });

  socket.on("submit_score", ({ roomId, score }) => {
    socket.data.score = score;
    console.log(`${socket.id} submitted score ${score}`);

    const room = io.sockets.adapter.rooms.get(roomId);
    if (room && room.size === 2) {
      const players = Array.from(room);
      const [player1, player2] = players.map(id => io.sockets.sockets.get(id));

      if (
        player1?.data.score !== undefined &&
        player2?.data.score !== undefined
      ) {
        io.to(roomId).emit("end_game", {
          p1: player1.data.score,
          p2: player2.data.score,
        });
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
    if (waitingPlayer === socket) waitingPlayer = null;

    // Inform others in rooms they were in
    const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
    rooms.forEach(roomId => {
      socket.to(roomId).emit("opponent_left");
    });
  });
});

server.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
