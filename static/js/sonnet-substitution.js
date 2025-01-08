function filterBlankLines(lines) {
  return lines.filter((line) => line.trim() !== "");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

let originalOrder = [];
let shuffledOrder = [];
let allLines = [];
let orderedLines = [];
let currentIndex = 0;
let movesLeft = 12;
let points = 0;
let currentPoem = {};
const linesPerRound = 14;
let touchStartIndex = null;
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
    // The word index matches the sentence index:
    wordBox.dataset.index = index;
    addDragAndDropListeners(wordBox);
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
    lineBox.textContent = line;
    lineBox.dataset.index = index;
    addDragAndDropListeners(lineBox);
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
    allLines = currentPoem.lines.map((l) => l[0]);
    orderedLastWords = currentPoem.lines.map((l) => l[1]);
    currentIndex = 0;
    movesLeft = 12;
    points = 0;
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

function addDragAndDropListeners(element) {
  element.addEventListener("dragstart", (e) => {
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.dataset.index);
    e.dataTransfer.effectAllowed = "move";
  });

  element.addEventListener("dragend", (e) => {
    e.target.classList.remove("dragging");
    document
      .querySelectorAll(".line-box.over")
      .forEach((el) => el.classList.remove("over"));
  });

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

  element.addEventListener("drop", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;

    const draggingIndex = parseInt(dragging.dataset.index);
    const targetIndex = parseInt(e.target.dataset.index);

    if (draggingIndex !== targetIndex) {
      e.target.classList.add("incorrect");
      e.target.dataset.correct = false;
      movesLeft--;
      setTimeout(() => {
        e.target.classList.remove("incorrect");
      }, 1000);
      updateProgressBar();
    } else {
      e.target.classList.add("correct");
      // fill in the completed line:
      e.target.innerHTML = e.target.innerHTML + " " + dragging.innerHTML;
      e.target.dataset.correct = true;
      numLinesCompleted++;
      setTimeout(() => {
        e.target.classList.remove("correct");
      }, 1000);
    }

    checkCorrectOrder();
  });
}

function checkCorrectOrder() {
  const poemDisplay = document.getElementById("poemDisplay");
  const lines = document.querySelectorAll(".line-box");

  let correct = true;
  lines.forEach((line) => {
    if (line.dataset.correct !== "true") {
      correct = false;
    }
  });

  if (correct) {
    poemDisplay.classList.add("correct");
    points++;
    setTimeout(() => {
      poemDisplay.classList.remove("correct");
      displayPoem();
    }, 1000);
  } else if (movesLeft <= 0) {
    poemDisplay.classList.add("out-of-moves");
    setTimeout(() => {
      poemDisplay.classList.remove("out-of-moves");
      loadRandomPoem();
    }, 1000);
  }
  updateProgressBar();
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const total = allLines.length;
  progressBar.textContent = `Lines Completed: ${numLinesCompleted}/${total} | Moves Left: ${movesLeft}`;
}

window.onload = loadRandomPoem;
