const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const {
  createRoom,
  joinRoom,
  leaveRoom,
  listRooms,
  rooms,
} = require("./rooms");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + "/../public"));

io.on("connection", (socket) => {
  // send current rooms
  socket.emit("rooms", listRooms());

  socket.on("createRoom", (name) => {
    const roomId = createRoom(name, socket.id);
    socket.join(roomId);
    io.emit("rooms", listRooms());
    socket.emit("joinedRoom", { roomId, isHost: true });
  });

  socket.on("joinRoom", (roomId) => {
    if (joinRoom(roomId, socket.id)) {
      socket.join(roomId);
      // update lobby for everyone
      io.emit("rooms", listRooms());

      // tell only the joining socket that it’s in the room (and whether it’s host)
      socket.emit("joinedRoom", {
        roomId,
        isHost: rooms[roomId].host === socket.id,
      });

      // broadcast updated player list to everyone in the room
      io.to(roomId).emit("playerList", rooms[roomId].players);
    } else {
      socket.emit("errorMsg", "Unable to join room (full or not found).");
    }
  });

  socket.on("leaveRoom", (roomId) => {
    leaveRoom(roomId, socket.id);
    socket.leave(roomId);
    io.emit("rooms", listRooms());
    io.to(roomId).emit("playerList", rooms[roomId]?.players || []);
    socket.emit("leftRoom");
  });

  // server.js

  socket.on("startGame", (roomId) => {
    const room = rooms[roomId];
    // only the host with exactly 4 players can start
    if (room?.host === socket.id && room.players.length === 4) {
      room.state = "playing";
      io.to(roomId).emit("gameStarted");

      // capture `roomId` but check existence before touching it
      setTimeout(() => {
        const r = rooms[roomId];
        if (!r) return; // <— bail out if room is gone
        r.state = "waiting";
        io.to(roomId).emit("gameEnded");
      }, 30_000);
    }
  });

  socket.on("playerMove", ({ roomId, x, y }) => {
    socket.to(roomId).emit("updateMove", { id: socket.id, x, y });
  });

  socket.on("disconnecting", () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) leaveRoom(roomId, socket.id);
    }
    io.emit("rooms", listRooms());
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server on http://localhost:${PORT}`));
