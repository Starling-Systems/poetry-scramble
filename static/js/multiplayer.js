const socket = io();
let playerName = "";

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

async function writeClipboardText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch (error) {
    console.error(error.message);
  }
}

async function invite() {
  const roomName = document.getElementById("roomName");
  await writeClipboardText(roomName.innerText);
  console.log(`writing ${roomName} to clipboard`);
}

function joinGame() {
  debugger;
  playerName = document.getElementById("playerName").value;
  if (!playerName) {
    alert("Please enter your name");
    return;
  }
  const roomName = playerName + getRandomInt(1000);
  document.getElementById("gameArea").hidden = false;
  socket.emit("join", { room: roomName, player: playerName });
}

socket.on("update", (gameState) => {
  updateUI(gameState);
});

socket.on("join", (gameState) => {
  const roomName = gameState.room;
  alert(`Joining room ${roomName}`);
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
  const roomName = document.getElementById("roomName");
  const playersList = document.getElementById("players");
  playersList.innerHTML = "";
  roomName.innerHTML = gameState.room;
  gameState.players.forEach((player) => {
    const li = document.createElement("li");
    li.textContent = player;
    playersList.appendChild(li);
  });
}
