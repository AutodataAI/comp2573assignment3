let powerUpUsed = false;


$(document).ready(function () {
  
  $("#themeSelector").on("change", function () {
    const selectedTheme = $(this).val();
    $("body").removeClass("light dark").addClass(selectedTheme);
  });
  
  
  $("#startBtn").on("click", function () {
    startNewGame();
  });

  $("#resetBtn").on("click", function () {
    clearInterval(timerInterval);
    $("#game_grid").empty();
    $("#clicks").text(0);
    $("#matches").text(0);
    $("#totalPairs").text(0);
    $("#pairsLeft").text(0);
    $("#timer").text(0);
    $("#powerUpBtn").prop("disabled", true);
    powerUpUsed = false;
  
  });


$("#powerUpBtn").on("click", function () {
  if ($("#game_grid").children().length === 0) {
    alert("Start the game first!");
    return;
  }

  if (powerUpUsed) {
    alert("Power-up already used!");
    return;
  }

  powerUpUsed = true;
  $("#powerUpBtn").prop("disabled", true);
  activatePowerUp();
});



});

let clickCount = 0;
let matchCount = 0;
let totalPairs = 0;
let timerInterval;
let timeRemaining = 0;

function updateStatus() {
  $("#clicks").text(clickCount);
  $("#matches").text(matchCount);
  $("#totalPairs").text(totalPairs);
  $("#pairsLeft").text(totalPairs - matchCount);
  $("#timer").text(timeRemaining);
}

function startTimer(duration) {
  clearInterval(timerInterval); 
  timeRemaining = duration;
  updateStatus();

  timerInterval = setInterval(() => {
    timeRemaining--;
    updateStatus();

    if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      endGame(false); 
    }
  }, 1000);
}

function endGame(won) {
  $(".card").off("click");
  if (won) {
    alert("🎉 You matched all pairs! You win!");
  } else {
    alert("⏰ Time's up! Game over.");
  }
}



// Get random unique Pokémon IDs
async function getRandomPokemonIDs(numPairs) {
  const response = await fetch("https://pokeapi.co/api/v2/pokemon?limit=1025");
  const data = await response.json();
  const allIDs = data.results.map((_, index) => index + 1);

  const selectedIDs = new Set();
  while (selectedIDs.size < numPairs) {
    const randIndex = Math.floor(Math.random() * allIDs.length);
    selectedIDs.add(allIDs[randIndex]);
  }

  return Array.from(selectedIDs);
}

// Fetch Pokemon image data
async function fetchPokemonData(ids) {
  const results = [];
  for (let id of ids) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    const data = await res.json();
    const imageUrl = data.sprites.other["official-artwork"].front_default;
    results.push({
      id: id,
      name: data.name,
      image: imageUrl,
    });
  }
  return results;
}

// Setup game board
function setupGame(pokemonData) {
  const cards = [];
  powerUpUsed = false;
  $("#powerUpBtn").prop("disabled", false);
  $("#game_grid").empty(); // Clear previous board

  // Create two cards per Pokémon
  pokemonData.forEach((poke) => {
    cards.push({ ...poke, uniqueId: `${poke.id}-a` });
    cards.push({ ...poke, uniqueId: `${poke.id}-b` });
  });

  // Shuffle cards
  const shuffled = cards.sort(() => 0.5 - Math.random());

  // Determine column count for rectangular layout
  const totalCards = shuffled.length;
  const cols = Math.ceil(Math.sqrt(totalCards));
  $("#game_grid").css("grid-template-columns", `repeat(${cols}, 1fr)`);

  // Generate card HTML
  for (let card of shuffled) {
    const cardHTML = `
      <div class="card" data-id="${card.id}" data-uid="${card.uniqueId}">
        <img class="front_face" src="${card.image}" alt="${card.name}">
        <img class="back_face" src="back.webp" alt="card back">
      </div>
    `;
    $("#game_grid").append(cardHTML);
  }

    // Reset game state
  clickCount = 0;
  matchCount = 0;
  totalPairs = pokemonData.length;
  updateStatus();

    // Choose time based on difficulty
  const difficulty = $("#difficulty").val();
  const duration = difficulty === "easy" ? 30 : difficulty === "medium" ? 60 : 90;
  startTimer(duration);


  bindCardLogic();
}

// Card flipping and match logic
function bindCardLogic() {
  let firstCard = null;
  let secondCard = null;
  let lockBoard = false;

  $(".card").on("click", function () {
    if (lockBoard) return;
    if ($(this).hasClass("flip")) return;

    $(this).addClass("flip");
    clickCount++;
    updateStatus();

    if (!firstCard) {
      firstCard = $(this);
    } else {
      secondCard = $(this);
      lockBoard = true;

      const id1 = firstCard.data("id");
      const id2 = secondCard.data("id");

      if (id1 === id2) {
        // Match
        firstCard.off("click");
        secondCard.off("click");
        matchCount++;

 

        
        updateStatus();
        resetTurn();

if (matchCount === totalPairs) {
  clearInterval(timerInterval);
  setTimeout(() => {
    endGame(true);
  }, 500); // wait 500ms
}

      } else {
        // Not a match
        setTimeout(() => {
          firstCard.removeClass("flip");
          secondCard.removeClass("flip");
          resetTurn();
        }, 1000);
      }
    }

    function resetTurn() {
      [firstCard, secondCard] = [null, null];
      lockBoard = false;
    }
  });
}


function activatePowerUp() {
  console.log("Power-up activated!");

  let allCards = $(".card");

  // disable input during power-up
  allCards.off("click");
  allCards.addClass("flip");

  setTimeout(() => {
    allCards.each(function () {
      const isMatched = $(this).off("click").length === 0;
      if (!isMatched) {
        $(this).removeClass("flip");
      }
    });

    
    bindCardLogic();

  }, 3000);
}


async function startNewGame() {
  const difficulty = $("#difficulty").val();
  const numPairs = difficulty === "easy" ? 3 : difficulty === "medium" ? 6 : 9;

  const pokemonIDs = await getRandomPokemonIDs(numPairs);
  const pokemonData = await fetchPokemonData(pokemonIDs);
  setupGame(pokemonData);
}



