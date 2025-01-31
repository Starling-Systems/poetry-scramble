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
let wordsUsed = [];
let wordBag = {};

function initWordBag(words) {
  words.forEach((w) => {
    wordBag[w] = false;
  });
  return wordBag;
}

function getWordBagWords() {
  return Object.keys(wordBag);
}

function updateWordBag(word) {
  wordBag[word] = true;
  return wordBag;
}

function isWordMatched(word) {
  return wordBag[word];
}

function makeOptionsDiv(correctWord, lineButton) {
  let optionsDiv = $(`<div class="dropdown-menu">`);
  getWordBagWords().forEach((word) => {
    let classStr = isWordMatched(word) ? "disabled" : "";
    const wordButton = $(`<a class="dropdown-item ${classStr}">${word}</a>`);
    if (!isWordMatched(word)) {
      // Make the word clickable if it hasn't been matched yet:
      wordButton.click((e) => {
        e.preventDefault();
        handleWordSelect(word, correctWord, lineButton);
      });
    }
    optionsDiv.append(wordButton);
  });
  return optionsDiv;
}

function displayPoem() {
  const poemDisplay = $("#poemDisplay");
  poemDisplay.html("");

  initWordBag(allLines.map((l) => l[1]));
  shuffleArray(wordBag);
  allLines.forEach((line, index) => {
    let dropdownDiv = $(`<div class="dropdown">`);
    let lineText = line[0];
    let correctWord = line[1];
    let lineButton = $(`
    <button class="btn btn-secondary dropdown-toggle line" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      ${lineText}
    </button>
    `);
    lineButton.on("click", (e) => {
      e.preventDefault();
      debugger;
      // dynamically render the word options by ...
      // ... binding the containing dropdown div in this scope:
      let ddDiv = dropdownDiv;
      // ... removing existing dropdown options:
      ddDiv.innerHTML = "";
      // ... creating a new div using the current state of wordBag:
      let optionsDiv = makeOptionsDiv(correctWord, this);
      // ... and appending the dynamic list to the dropdown:
      ddDiv.append(optionsDiv);
    });
    dropdownDiv.append(lineButton);
    poemDisplay.append(dropdownDiv);
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
    initWordBag(orderedLastWords);
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

function handleWordSelect(selectedWord, correctWord, lineButton) {
  if (selectedWord !== correctWord) {
    movesLeft--;
    updateProgressBar();
  } else {
    const lineText = lineButton[0].innerHTML;
    updateWordBag(correctWord);
    // fill in the completed line:
    lineButton[0].innerHTML = restoreSentence(lineText, selectedWord);
    lineButton.data.correct = true;
    lineButton.removeClass("btn-secondary");
    lineButton.addClass("btn-success");
    numLinesCompleted++;
    updateProgressBar();
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
  const lines = document.querySelectorAll(".line");
  const progressBar = document.getElementById("progressBar");

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
    poemDisplay.innerHTML = "Reload for another poem.";
    //    wordBoxen.forEach(e => removeDragListeners(e));
  }
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const total = allLines.length;
  progressBar.textContent = `Lines Completed: ${numLinesCompleted}/${total} | Wrong Guesses Left: ${movesLeft}`;
}

window.onload = loadRandomPoem;
