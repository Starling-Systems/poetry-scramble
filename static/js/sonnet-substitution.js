function shuffleArray(array) {
  for (let i = array.length - 1; i >= 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
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
  words.forEach((w, i) => {
    if (wordBag[w]) {
      let positions = wordBag[w];
      wordBag[w] = positions.push(i);
    } else {
      wordBag[w] = [i];
    }
  });
  return wordBag;
}

function getWordBagWords() {
  return Object.keys(wordBag);
}

function markWordUsed(word, lineIndex) {
  let positions = wordBag[word];
  // if this is the correct word choice at position index ...
  if (Array.isArray(positions) && positions.includes(lineIndex)) {
    // then remove this index from the remaining choices for this word:
    positions.filter((i) => i != lineIndex);
  }
  wordBag[word] = positions;
}

function isWordMatched(word, lineIndex) {
  let positions = wordBag[word];
  // if this is the correct word choice at position index ...
  if (positions.includes(lineIndex)) {
    // then remove this index from the remaining choices for this word:
    wordBag[word].filter((i) => i != lineIndex);
    return false;
  }
  return true;
}

function shuffleWordBag() {
  //  debugger;
  let words = Object.keys(wordBag);
  shuffleArray(words);
  let wordHash = {};
  words.forEach((w) => {
    wordHash[w] = false;
  });
  wordBag = wordHash;
  return wordBag;
}

function makeOptionsDiv(correctWord, lineButton, lineIndex) {
  let optionsDiv = $(
    `<ul class="dropdown-menu" id="words-${lineIndex}" aria-labelledby="line-${lineIndex}">`
  );
  getWordBagWords().forEach((word) => {
    let classStr = isWordMatched(word, lineIndex) ? "disabled" : "";
    const wordButton = $(
      `<li><a class="dropdown-item ${classStr}">${word}</a></li>`
    );
    wordButton.click((e) => {
      e.preventDefault();
      handleWordSelect(word, correctWord, lineButton, lineIndex);
    });
    optionsDiv.append(wordButton);
  });
  return optionsDiv;
}

function displayPoem() {
  const poemDisplay = $("#poemDisplay");
  poemDisplay.html("");
  //  shuffleWordBag();
  allLines.forEach((line, index) => {
    let dropdownDiv = $(`<div class="dropdown">`);
    let lineText = line[0];
    let correctWord = line[1];
    let lineButton = $(`
    <button class="btn btn-secondary dropdown-toggle line" id="line-${index}" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      ${lineText}
    </button>
    `);
    lineButton.on("show.bs.dropdown", (e) => {
      let words = $(`#words-${index}`).find(".dropdown-item");
      [...words].forEach((wordElement, lineIndex) => {
        let w = wordElement.innerHTML;
        if (isWordMatched(w, lineIndex)) {
          $(wordElement).addClass("disabled");
          $(wordElement).parent().off("click");
        }
      });
    });
    let optionsDiv = makeOptionsDiv(correctWord, lineButton, index);
    dropdownDiv.append(lineButton);
    dropdownDiv.append(optionsDiv);
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
    initWordBag(orderedLastWords);
    displayPoem();
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

function handleWordSelect(selectedWord, correctWord, lineButton, lineIndex) {
  if (selectedWord !== correctWord) {
    movesLeft--;
    updateProgressBar();
  } else {
    const lineText = lineButton[0].innerHTML;
    markWordUsed(correctWord, lineIndex);
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

function checkCorrectCompletion() {
  const poemDisplay = document.getElementById("poemDisplay");
  const lines = document.querySelectorAll(".line");
  const progressBar = document.getElementById("progressBar");

  let correct = true;
  Object.keys(wordBag).forEach((word) => {
    if (!wordBag[word]) {
      correct = false;
    }
  });
  if (correct) {
    poemDisplay.classList.add("correct");
    setTimeout(() => {
      poemDisplay.classList.remove("correct");
      shareSuccess(currentPoem);
    }, 1000);
  } else if (movesLeft <= 0) {
    progressBar.classList.add("out-of-moves");
    progressBar.innerHTML = "Out of Moves!";
    poemDisplay.innerHTML =
      "<a href='/sonnet-substitution  '>Try another poem</a>";
    //    wordBoxen.forEach(e => removeDragListeners(e));
  }
}

async function writeClipboardText(text) {
  console.log(`writing ${text.innerText()} to clipboard`);
  try {
    await navigator.clipboard.writeText(text.innerText());
  } catch (error) {
    console.error(error.message);
  }
}

function shareSuccess(currentPoem) {
  let poemDisplay = $("#poemDisplay");
  let lines = [
    `I just completed "${currentPoem.title}"`,
    `by ${currentPoem.author}`,
    `with ${movesLeft} moves to spare!`,
    `http://poetryscramble.xyz/`,
  ];
  poemDisplay.html("");
  let successDiv = $(`<div>`).attr("id", "success").addClass("col");
  poemDisplay.append(successDiv);
  lines.forEach((l) => {
    $("#success").append($("<div>").addClass("row").html(l));
  });
}

function updateProgressBar() {
  const progressBar = document.getElementById("progressBar");
  const total = allLines.length;
  progressBar.textContent = `Lines Completed: ${numLinesCompleted}/${total} | Wrong Guesses Left: ${movesLeft}`;
}

window.onload = loadRandomPoem;
