// Simple in-memory rooms store
// { roomId: { name, players: [socket.id,…], host: socket.id, state } }
const crypto = require("crypto");
const rooms = {};

function createRoom(name, hostId) {
  const id = crypto.randomBytes(3).toString("hex");
  rooms[id] = { name, host: hostId, players: [hostId], state: "waiting" };
  return id;
}

function joinRoom(roomId, socketId) {
  const room = rooms[roomId];
  if (!room || room.players.length >= 4) return false;
  room.players.push(socketId);
  return true;
}

function leaveRoom(roomId, socketId) {
  const room = rooms[roomId];
  if (!room) return;
  room.players = room.players.filter((id) => id !== socketId);
  if (room.host === socketId && room.players.length) {
    room.host = room.players[0];
  }
  if (room.players.length === 0) {
    delete rooms[roomId];
  }
}

function listRooms() {
  return Object.entries(rooms).map(([id, r]) => ({
    id,
    name: r.name,
    count: r.players.length,
  }));
}

module.exports = { createRoom, joinRoom, leaveRoom, listRooms, rooms };
