function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function restoreSentence(sentence, word) {
  return sentence.replace("___", word);
}

let allLines = [];
let movesLeft = 6;
let currentPoem = {};
let numLinesCompleted = 0;

function displayWordBag(words) {
  const bagDisplay = document.getElementById("wordBag");
  let wordBoxes = [];
  let shuffledWordBoxes = [];

  bagDisplay.innerHTML = ``;
  words.forEach((word, index) => {
    const wordBox = document.createElement("div");
    wordBox.classList.add("word-box");
    wordBox.draggable = true;
    wordBox.textContent = word;
    // The word to place matches the sentence's missing word:
    wordBox.dataset.word = word;
    addDragListeners(wordBox);
    addTouchListenersForWords(wordBox);
    //    $(wordBox).draggable();
    wordBoxes.push(wordBox);
  });

  // Display the words in shuffled order:
  shuffleArray(wordBoxes);
  wordBoxes.forEach((wordBox) => {
    bagDisplay.appendChild(wordBox);
  });

  updateProgressBar();
}

function displayPoem() {
  const poemDisplay = document.getElementById("poemDisplay");

  poemDisplay.innerHTML = ``;
  allLines.forEach((line, index) => {
    const lineBox = document.createElement("div");
    lineBox.classList.add("line-box");
    lineBox.textContent = line[0];
    lineBox.dataset.word = line[1];
    addDropListeners(lineBox);
    poemDisplay.appendChild(lineBox);
  });

  updateProgressBar();
}

async function loadRandomPoem() {
  try {
    const response = await fetch("/sonnet_deworded");
    console.log("/sonnet_deworded response:");
    console.log(response);
    if (!response.ok) {
      throw new Error("Failed to load sonnet!");
    }
    currentPoem = await response.json();
    allLines = currentPoem.lines.map((l) => [l[0], l[1]]);
    orderedLastWords = currentPoem.lines.map((l) => l[1]);
    currentIndex = 0;
    numLinesCompleted = 0;
    movesLeft = 6;
    displayPoem();
    displayWordBag(orderedLastWords);
    updateProgressBar();
    updatePoemDetails(currentPoem);
  } catch (error) {
    document.getElementById("poemDisplay").textContent =
      "Error loading sonnet: " + error.message;
  }
}

function updatePoemDetails(currentPoem) {
  const poemDetails = document.getElementById("poemDetails");
  poemDetails.innerHTML = `<h3>${currentPoem.title} by ${currentPoem.author}</h3>`;
}

// was addDragAndDropListeners
function handleDrop(e) {
  const dragging = document.querySelector(".dragging");
  if (!dragging) return;

  const draggingWord = dragging.dataset.word;
  const targetWord = e.dataset.word;

  if (draggingWord !== targetWord) {
    e.classList.add("incorrect");
    e.dataset.correct = false;
    movesLeft--;
    setTimeout(() => {
      e.classList.remove("incorrect");
      e.classList.add("attempted");
    }, 1000);
    updateProgressBar();
  } else {
    e.classList.add("correct");
    // fill in the completed line:
    e.innerHTML = restoreSentence(e.innerHTML, dragging.innerHTML);
    e.dataset.correct = true;
    numLinesCompleted++;
    // keep the green outline for correct answers
    setTimeout(() => {
      e.classList.remove("incorrect");
      e.classList.remove("attempted");
      e.classList.remove("correct");
      dragging.classList.add("completed");
      e.classList.add("completed");
    }, 1000);
  }

  checkCorrectCompletion();
}

function addDropListeners(element) {
  element.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const dragging = document.querySelector(".dragging");
    if (
      dragging &&
      e.target.classList.contains("line-box") &&
      e.target !== dragging
    ) {
      e.target.classList.add("over");
    }
  });

  element.addEventListener("dragleave", (e) => {
    e.target.classList.remove("over");
  });

  element.addEventListener("drop", handleDrop);
}

function handleMove(e) {
  e.target.classList.add("dragging");
  e.dataTransfer.setData("text/plain", e.target.dataset.word);
  e.dataTransfer.effectAllowed = "move";
}

function handleEnd(e) {
  e.target.classList.remove("dragging");
  document
    .querySelectorAll(".line-box.over")
    .forEach((el) => el.classList.remove("over"));
}

function addTouchListenersForWords(wordElement) {
  wordElement.addEventListener("touchstart", handleTouchStart); // Touch drag start
  wordElement.addEventListener("touchmove", handleTouchMove); // Touch drag move
  wordElement.addEventListener("touchend", handleTouchEnd); // Touch drag end
}

function addDragListeners(element) {
  element.addEventListener("dragstart", handleMove);
  element.addEventListener("dragend", handleEnd);
}

function removeDragListeners(element) {
  element.removeEventListener("dragstart");
  element.removeEventListener("dragend");
}

let touchDraggedElement;
// Touch handlers
function handleTouchStart(event) {
  touchDraggedElement = event.target;
  touchDraggedElement.classList.add("dragging");
  // Prevent touch scrolling on the start of a drag
  event.preventDefault();
}

function handleTouchMove(event) {
  if (!touchDraggedElement) return;

  // Prevent touch scrolling during dragging
  event.preventDefault();

  const touch = event.touches[0];
  const elementAtTouch = document.elementFromPoint(
    touch.clientX,
    touch.clientY
  );

  if (elementAtTouch && elementAtTouch.classList.contains("line")) {
    elementAtTouch.classList.add("over");
  } else {
    document
      .querySelectorAll(".line.over")
      .forEach((el) => el.classList.remove("over"));
  }
}

function handleTouchEnd(event) {
  event.preventDefault();
  if (!touchDraggedElement) return;

  const touch = event.changedTouches[0];
  const elementAtTouch = document.elementFromPoint(
    touch.clientX,
    touch.clientY
  );

  if (elementAtTouch && elementAtTouch.classList.contains("line-box")) {
    elementAtTouch.classList.remove("over");
    handleDrop(elementAtTouch);
  }

  touchDraggedElement.classList.remove("dragging");
  touchDraggedElement = null;
}

function checkCorrectCompletion() {
  const poemDisplay = document.getElementById("poemDisplay");
  const lines = document.querySelectorAll(".line-box");
  const progressBar = document.getElementById("progressBar");
  const wordBoxen = document.querySelectorAll(".word-box");

  let correct = true;
  lines.forEach((line) => {
    if (line.dataset.correct !== "true") {
      correct = false;
    }
  });

  if (correct) {
    poemDisplay.classList.add("correct");
    setTimeout(() => {
      poemDisplay.classList.remove("correct");
      displayPoem();
    }, 1000);
  } else if (movesLeft <= 0) {
    progressBar.classList.add("out-of-moves");
    progressBar.innerHTML = "Out of Moves!";
    poemDisplay.innerHTML = "Reload for another poem."
    //    wordBoxen.forEach(e => removeDragListeners(e));
  }
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const total = allLines.length;
  progressBar.textContent = `Lines Completed: ${numLinesCompleted}/${total} | Wrong Guesses Left: ${movesLeft}`;
}

window.onload = loadRandomPoem;
