let players = {}; // { socketId: { x, y } }

function setup() {
  const canvas = createCanvas(400, 400);
  canvas.parent("sketch-container");

  socket.on("updateMove", ({ id, x, y }) => {
    players[id] = { x, y };
  });
}

function draw() {
  background(220);

  circle(mouseX, mouseY, 30);

  // draw all circles
  Object.values(players).forEach((p) => circle(p.x, p.y, 30));

  // send your mouse pos
  if (frameCount % 1 === 0) {
    socket.emit("playerMove", {
      roomId: window.currentRoom,
      x: mouseX,
      y: mouseY,
    });
  }
}
