const socket = io();
let playerName = "";
const roomName = "room1";

function joinGame() {
  playerName = document.getElementById("playerName").value;
  if (!playerName) {
    alert("Please enter your name");
    return;
  }
  document.getElementById("gameArea").hidden = false;
  socket.emit("join", { room: roomName, player: playerName });
}

socket.on("update", (gameState) => {
  updateUI(gameState);
});

socket.on("join", (gameState) => {
  loadRandomPoem(gameState);
});

function completeLine(lineIndex) {
  socket.emit("complete_line", {
    room: roomName,
    line_index: lineIndex,
    player: playerName,
  });
}

function updateUI(gameState) {
  displayPoem(gameState);
  const playersList = document.getElementById("players");
  playersList.innerHTML = "";
  gameState.players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player;
    playersList.appendChild(li);
  });
}
