const socket = io();
window.socket = socket;
// UI refs
const lobbyEl = document.getElementById("lobby");
const waitingEl = document.getElementById("waiting");
const gameEl = document.getElementById("game");
const roomsUl = document.getElementById("rooms");
const newRoomInput = document.getElementById("newRoomName");
const createBtn = document.getElementById("createBtn");
const startBtn = document.getElementById("startBtn");
const leaveBtn = document.getElementById("leaveBtn");
const exitBtn = document.getElementById("exitBtn");
const roomLabel = document.getElementById("roomLabel");
const playerCount = document.getElementById("playerCount");

let currentRoom, isHost;

lobbyEl.style.display = "block";
waitingEl.style.display = "none";
gameEl.style.display = "none";

socket.on("rooms", (rooms) => {
  roomsUl.innerHTML = "";
  rooms.forEach((r) => {
    const li = document.createElement("li");
    li.textContent = `${r.name} (${r.count}/4)`;
    if (r.count < 4) {
      const btn = document.createElement("button");
      btn.textContent = "Join";
      btn.onclick = () => socket.emit("joinRoom", r.id);
      li.append(btn);
    }
    roomsUl.append(li);
  });
});

createBtn.onclick = () => {
  const name = newRoomInput.value.trim();
  if (name) socket.emit("createRoom", name);
};

socket.on("joinedRoom", ({ roomId, isHost: hostFlag }) => {
  window.currentRoom = roomId;
  window.isHost = hostFlag;
  lobbyEl.style.display = "none";
  waitingEl.style.display = "block";
  roomLabel.textContent = roomId;
  updateStartBtn();
});

function updateStartBtn() {
  // window.isHost is set in joinedRoom handler
  const numPlayers = parseInt(playerCount.textContent, 10);
  startBtn.disabled = !(window.isHost && numPlayers === 4);
}

socket.on("playerList", (players) => {
  playerCount.textContent = players.length;
  updateStartBtn();
});

startBtn.onclick = () => socket.emit("startGame", window.currentRoom);
leaveBtn.onclick = () => socket.emit("leaveRoom", window.currentRoom);

socket.on("leftRoom", () => {
  // hide any room/game UI
  waitingEl.style.display = "none";
  gameEl.style.display = "none";

  // show the lobby
  lobbyEl.style.display = "block";

  // clear state
  window.currentRoom = undefined;
  playerCount.textContent = "0";
});

socket.on("gameStarted", () => {
  waitingEl.style.display = "none";
  gameEl.style.display = "block";
});

socket.on("gameEnded", () => {
  gameEl.style.display = "none";
  waitingEl.style.display = "block";
});

exitBtn.onclick = () => {
  socket.emit("leaveRoom", window.currentRoom);
  gameEl.style.display = "none";
  lobbyEl.style.display = "block";
};
