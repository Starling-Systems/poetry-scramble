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
    displayNextLines();
    updateProgressBar();
    updatePoemDetails(currentPoem);
  } catch (error) {
    document.getElementById("poemDisplay").textContent =
      "Error loading poem: " + error.message;
  }
}

window.onload = loadRandomSonnet;
