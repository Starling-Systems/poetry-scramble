let allLines = [];
let movesLeft = 6;
let currentPoem = {};
let numLinesCompleted = 0;
let wordsUsed = [];
let wordBag = {};
let orderedLastWords = [];
let shuffledLastWords = [];
let shuffledIndices = [];
let orderedIndexToShuffledIndex = {};
let shuffledIndexToOrderedIndex = {};

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

function isWordSelectionCorrect(word, shuffledIndex) {
  let orderedIndex = shuffledIndexToOrderedIndex[shuffledIndex];
  return orderedLastWords[orderedIndex] == word;
}

function markWordMatched(word, shuffledIndex) {
  debugger;
  // get the current remaining positions for this word:
  let remainingPositions = getRemainingWordPositions(word);
  let orderedIndex = shuffledIndexToOrderedIndex[shuffledIndex];
  remainingPositions = remainingPositions.filter((i) => i != orderedIndex);
  wordBag[word] = remainingPositions;
}

function getWordPositions(word) {
  let wordPositions = [];
  orderedLastWords.forEach((w, i) => {
    if (w == word) {
      wordPositions.push(i);
    }
  });
  return wordPositions;
}

function getRemainingWordPositions(word) {
  return wordBag[word];
}

function getShuffledWordPositions(word) {
  let shuffledWordPositions = [];
  shuffledLastWords.forEach((w, i) => {
    if (w == word) {
      shuffledWordPositions.push(i);
    }
  });
  return shuffledWordPositions;
}

function hasRemainingMatches(word) {
  return getRemainingWordPositions(word).length > 0;
}

function isWordMatched(word, shuffledIndex) {
  debugger;
  let orderedIndex = shuffledIndexToOrderedIndex[shuffledIndex];
  // if word appears on this line:
  if (getWordPositions(word).indexOf(orderedIndex) >= 0) {
    // then check if this line has been matched yet:
    let remainingPositions = getRemainingWordPositions(word);
    return !remainingPositions.includes(orderedIndex);
  } else {
    return false;
  }
}

function deepArrayCopy(array) {
  return JSON.parse(JSON.stringify(array));
}

function createHash(keys, values) {
  return keys.reduce((hash, key, index) => {
    hash[key] = values[index];
    return hash;
  }, {});
}

function createShuffledWords(orderedLastWords, orderedIndexToShuffledIndex) {
  let shuffledWords = new Array(orderedLastWords.length);
  for (let orderedIndex in orderedIndexToShuffledIndex) {
    let shuffledIndex = orderedIndexToShuffledIndex[orderedIndex];
    shuffledWords[shuffledIndex] = orderedLastWords[orderedIndex];
  }
  return shuffledWords;
}

function shuffleWords() {
  let words = deepArrayCopy(orderedLastWords);
  let indices = Array.from(words.keys());
  // array of shuffled indices:
  shuffledIndices = shuffleArray(deepArrayCopy(indices));
  // mapping from original index to shuffled index:
  orderedIndexToShuffledIndex = createHash(indices, shuffledIndices);
  // mapping from shuffled index to original index:
  shuffledIndexToOrderedIndex = createHash(shuffledIndices, indices);

  let wordHash = {};
  words.forEach((w) => {
    wordHash[w] = getWordPositions(w);
  });
  wordBag = wordHash;

  shuffledLastWords = createShuffledWords(
    orderedLastWords,
    orderedIndexToShuffledIndex
  );

  return wordBag;
}

/*
["line 0 ... love", "line 1 ... it", "line 2 ... you", 
"line 3 ... it", "line 4  ... you"]

orderedLastWords = 
[love, it, you, it, you]

wordBag = {
  "love": [0],
  "it": [1, 3],
  "you": [2, 4]
}

(shuffle)

shuffledLastWords = 
[it, you, it, love, you]

(match "it" on line index = 2)

wordBag =
{
  "love": [0],
  "it": [1],
  "you": [2, 4]
}

want to display "it" at index 2 as gray:
[it, you, it (*), love, you]

lineIndex = 0: [it, you, it (gray), love, you]
lineIndex = 1: [it, you, it (gray), love, you]
.... 

*/
function makeOptionsList(correctWord, lineButton, lineIndex) {
  let optionsDiv = $(
    `<ul class="dropdown-menu" id="words-${lineIndex}" aria-labelledby="line-${lineIndex}">`
  );
  shuffledLastWords.forEach((word, shuffledIndex) => {
    /* 
    [it, you, it (*), love, you]
    */

    let classStr = isWordMatched(word, shuffledIndex) ? "disabled" : "";
    const wordButton = $(
      `<li><a class="dropdown-item ${classStr}">${word}</a></li>`
    );
    wordButton.click((e) => {
      e.preventDefault();
      handleWordSelect(word, shuffledIndex, correctWord, lineButton, lineIndex);
    });
    optionsDiv.append(wordButton);
  });
  return optionsDiv;
}

function displayPoem() {
  const poemDisplay = $("#poemDisplay");
  poemDisplay.html("");
  allLines.forEach((line, lineIndex) => {
    let dropdownDiv = $(`<div class="dropdown">`);
    let lineText = line[0];
    let correctWord = line[1];
    let lineButton = $(`
    <button class="btn btn-secondary dropdown-toggle line" id="line-${lineIndex}" type="button" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
      ${lineText}
    </button>
    `);
    let optionsDiv = makeOptionsList(correctWord, lineButton, lineIndex);
    dropdownDiv.on("show.bs.dropdown", (e) => {
      debugger;
      setTimeout(() => {
        // remove the existing word options in the DOM:
        dropdownDiv.find(`#words-${lineIndex}`).remove();
        // add the new word options with current matches grayed:
        let optionsDiv = makeOptionsList(correctWord, lineButton, lineIndex);
        dropdownDiv.append(optionsDiv);
        // ✅ Toggle the .show class on the dropdown-menu (UL)
        dropdownDiv.find(".dropdown-menu").addClass("show");
      }, 0); // Allow Bootstrap dropdown to finish before modifying the DOM
    });
    // Ensure hiding the dropdown removes .show from <ul>
    dropdownDiv.on("hide.bs.dropdown", (e) => {
      dropdownDiv.find(".dropdown-menu").removeClass("show");
    });
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
    shuffleWords();
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

function handleWordSelect(
  selectedWord,
  shuffledIndex,
  correctWord,
  lineButton,
  lineIndex
) {
  if (!isWordSelectionCorrect(selectedWord, shuffledIndex)) {
    poemDisplay.classList.add("incorrect");
    movesLeft--;
    setTimeout(() => {
      poemDisplay.classList.remove("incorrect");
    }, 1000);
    updateProgressBar();
  } else {
    const poemDisplay = document.getElementById("poemDisplay");
    const lineText = lineButton[0].innerHTML;
    markWordMatched(correctWord, shuffledIndex);
    poemDisplay.classList.add("correct");
    setTimeout(() => {
      poemDisplay.classList.remove("correct");
    }, 1000);
    // fill in the completed line:
    lineButton[0].innerHTML = restoreSentence(lineText, selectedWord);
    lineButton.data.correct = true;
    lineButton.removeClass("btn-secondary");
    lineButton.addClass("btn-success");
    numLinesCompleted++;
    updateProgressBar();
    checkCorrectCompletion();
  }
}

function checkCorrectCompletion() {
  const poemDisplay = document.getElementById("poemDisplay");
  const progressBar = document.getElementById("progressBar");

  let correct = true;
  getWordBagWords().forEach((word) => {
    if (hasRemainingMatches(word)) {
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
