function filterBlankLines(lines) {
  return lines.filter((line) => line.trim() !== "");
}

function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

function restoreSentence(sentence, word) {
  return sentence.replace("___", word)
}

let allLines = [];
let currentIndex = 0;
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

  element.addEventListener("drop", (e) => {
    e.preventDefault();
    const dragging = document.querySelector(".dragging");
    if (!dragging) return;

    const draggingWord = dragging.dataset.word;
    const targetWord = e.target.dataset.word;

    if (draggingWord !== targetWord) {
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
      e.target.innerHTML = restoreSentence(e.target.innerHTML, dragging.innerHTML);
      e.target.dataset.correct = true;
      numLinesCompleted++;
      setTimeout(() => {
        e.target.classList.remove("correct");
      }, 1000);
    }

    checkCorrectCompletion();
  });
}

function addDragListeners(element) {
  element.addEventListener("dragstart", (e) => {
    e.target.classList.add("dragging");
    e.dataTransfer.setData("text/plain", e.target.dataset.word);
    e.dataTransfer.effectAllowed = "move";
  });

  element.addEventListener("dragend", (e) => {
    e.target.classList.remove("dragging");
    document
      .querySelectorAll(".line-box.over")
      .forEach((el) => el.classList.remove("over"));
  });
}

function removeDragListeners(element) {
  element.removeEventListener("dragstart");
  element.removeEventListener("dragend");
}

function checkCorrectCompletion() {
  const poemDisplay = document.getElementById("poemDisplay");
  const lines = document.querySelectorAll(".line-box");
  const progressBar = document.getElementById("progressBar")
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
    progressBar.innerHTML ='Out of Moves!';
    wordBoxen.forEach(e => removeDragListeners(e));
  } 
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const total = allLines.length;
  progressBar.textContent = `Lines Completed: ${numLinesCompleted}/${total} | Wrong Guesses Left: ${movesLeft}`;
}

window.onload = loadRandomPoem;
