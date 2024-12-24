async function loadRandomSonnet() {
  try {
    const response = await fetch("/random_sonnet");
    console.log("/random response:");
    console.log(response);
    if (!response.ok) {
      throw new Error("Failed to load poem");
    }
    currentPoem = await response.json();
    allLines = filterBlankLines(currentPoem.lines);
    orderedLines = [];
    currentIndex = 0;
    movesLeft = 6;
    points = 0;
    displaySonnet(currentPoem);
    updateSonnetDetails(currentPoem);
  } catch (error) {
    document.getElementById("poemDisplay").textContent =
      "Error loading poem: " + error.message;
  }
}

function updateSonnetDetails(currentPoem) {
  const poemDetails = document.getElementById("poemDetails");
  poemDetails.innerHTML = `<h3>${currentPoem.title} by ${currentPoem.author}</h3>`;
}

function displaySonnet(currentPoem) {
  const poemDisplay = document.getElementById("poemDisplay");
  let sonnet = currentPoem.lines;
  let sonnetText = `<h2>Complete the rhymes:</h2>`;
  sonnet.each((line) => (sonnetText += line));
  poemDisplay.innerHTML = sonnetText;
}

window.onload = loadRandomSonnet;
