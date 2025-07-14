let todayCharacter = null;
let gameState = {
    streak: 0,
    lastPlayed: null,
    hasWonToday: false,
    guessCount: 0,
    guesses: []
};

//initial game state
async function initGameState() {
    const savedState = localStorage.getItem('berserkdle_save');
    if (savedState) {
        try {

            const parsed = JSON.parse(savedState);
            const today = getLocalDate();
            let yesterday = getLocalDate(1);
            if (parsed.lastPlayed === today) {
                gameState = parsed;
                todayCharacter = await fetchTodayCharacter();
                if (gameState.hasWonToday || gameState.guessCount >= 8) {
                    $("#charInp").attr("disabled", "true");
                    $("#giveUp").data("disabled",true);
                    $("#overlay").fadeIn(300);
                    $("#finished").fadeIn(300);
                    $("#finished").html('<div class="closeBut" id="closeFinished">✕</div><h1 class="endTit">You\'ve played today,</h1><h2>Please come back tomorrow</h2>');
                    $("#charInp").val("Come Back Tomorrow.");
                }
                gameState.guesses.forEach(guess => {
                displayed(guess);  
                });
            } else if(parsed.lastPlayed > yesterday){
              console.log("missed a day :3");
              createNewGameState();
            }else {
                gameState = {
                    streak: parsed.streak,
                    lastPlayed: today,
                    hasWonToday: false,
                    guessCount: 0,
                    guesses: []
                };
                saveGameState();
            }
            
        } catch (e) {
            console.error('Error loading saved state:', e);
            createNewGameState();
        }
    } else {
        createNewGameState();
    }
    updateStatsUI();
}

//newPlayer
function createNewGameState() {
    const today = new Date().toISOString().split('T')[0];
    gameState = {
        streak: 0,
        lastPlayed: today,
        hasWonToday: false,
        guessCount: 0,
        guesses: []
    };
    saveGameState();
}

function updateStatsUI() {
    $("#streakCount").text(gameState.streak);
    $("#guess").text(`${gameState.guessCount}/8`);
}

//saves gamestate of the user to localStorage
function saveGameState() {
    try {
        localStorage.setItem('berserkdle_save', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

//retrieves date
function getLocalDate(daysToAdd=0) {
  const date = new Date();
  if (daysToAdd){
    date.setDate(date.getDate()-daysToAdd);
  }
  const offset = date.getTimezoneOffset();
  date.setMinutes(date.getMinutes() - offset);
  return date.toISOString().split('T')[0];
}

//fetches the daily character
async function fetchTodayCharacter(){
  try {
    const response = await fetch('/api/today');
    if (!response.ok) throw new Error('Failed to fetch today\'s character');
    return await response.json();
  } catch (error) {
    console.error('Error fetching today\'s character:', error);
    return null;
  }
}

//gets selected character frp, the dropdown
function getchar(char) {
  if (!char.trim()) {
    $('#dropdown').empty();
    return;
  }
  fetch(`/api/search?q=${encodeURIComponent(char)}`)
    .then(response => {
      if (!response.ok) throw new Error('API response error');
      return response.json();
    })
    .then(data => {
      showDropdown(data);
    })
    .catch(error => {
      console.error('Error:', error);
      $('#dropdown').html('<p class="error">Error loading characters</p>');
    });
}

//#winning
function perfectGame($row){
  const $items = $row.find('.item').slice(1);
  return $items.toArray().every(item => $(item).hasClass('correct'));
}

//compares the characters to see if you've won
function compareChar(character){
  if (!todayCharacter) return null;
  return {
    name: character.name === todayCharacter.name,
    gender: character.gender === todayCharacter.gender,
    hairColour: character.hairColour === todayCharacter.hairColour,
    weapon: character.weapon === todayCharacter.weapon,
    affiliation: character.affiliation === todayCharacter.affiliation,
    species: character.species === todayCharacter.species,
    arc: character.arc === todayCharacter.arc
  };
}

function checkChar(char){
  if (!char.trim()) {
    $("#charInp").val("");
    return;
  }
  
  fetch(`/api/character?name=${encodeURIComponent(char)}`)
    .then(response => {
      if (!response.ok) throw new Error('API response error');
      return response.json();
    })
    .then(data => {
      charShow(data);
    })
    .catch(error => {
      console.error('Error:', error);
      $("#charInp").val("Invalid Character");
    });
}


function showDropdown(results) {
  const $dropdown = $("#dropdown");
  $dropdown.empty();
  
  if (!results || !Array.isArray(results)) {
    $dropdown.hide();
    return;
  }

  if (results.length === 0) {
    $dropdown.hide();
    return;
  }
  
  results.forEach(char => {
      const $item = $('<div class="dropItem"></div>');
      $item.html(`
          <img src="images/${char.image}.webp" class="dropImg">
          <div>
              <div class="name">${char.name}</div>
              <div class="details">${char.arc} • ${char.weapon}</div>
          </div>
      `);
      $item.on("click",function(){
        $("#charInp").val(char.name);
        $dropdown.hide();
      });

      $dropdown.append($item);
  });

  
  $dropdown.show();
}

function displayed(character){
  const comparison = compareChar(character);
  const $row = $(`
    <div class="charRow">
      <img src="images/${character.image}.webp" class="item characterImg" loading="lazy">
      <div class="item ${comparison.name ? 'correct' : 'incorrect'}">${character.name}</div>
      <div class="item ${comparison.gender ? 'correct' : 'incorrect'}">${character.gender || 'N/A'}</div>
      <div class="item ${comparison.hairColour ? 'correct' : 'incorrect'}">${character.hairColour || 'N/A'}</div>
      <div class="item ${comparison.weapon ? 'correct' : 'incorrect'}">${character.weapon || 'N/A'}</div>
      <div class="item ${comparison.affiliation ? 'correct' : 'incorrect'}">${character.affiliation || 'N/A'}</div>
      <div class="item ${comparison.species ? 'correct' : 'incorrect'}">${character.species || 'N/A'}</div>
      <div class="item ${comparison.arc ? 'correct' : 'incorrect'}">${character.arc || 'N/A'}</div>
    </div>
  `);
  $("#labelRow").after($row);
}

//displaying and comparing the characters
async function charShow(character){
  if (!todayCharacter) {
    todayCharacter = await fetchTodayCharacter();
  }
  gameState.guesses.push(character);
  const comparison = compareChar(character);
  $("#charInp").val("");
  const $row = $(`
    <div class="charRow">
      <img src="images/${character.image}.webp" class="characterImg" loading="lazy">
      <div class="item ${comparison.name ? 'correct' : 'incorrect'}">${character.name}</div>
      <div class="item ${comparison.gender ? 'correct' : 'incorrect'}">${character.gender || 'N/A'}</div>
      <div class="item ${comparison.hairColour ? 'correct' : 'incorrect'}">${character.hairColour || 'N/A'}</div>
      <div class="item ${comparison.weapon ? 'correct' : 'incorrect'}">${character.weapon || 'N/A'}</div>
      <div class="item ${comparison.affiliation ? 'correct' : 'incorrect'}">${character.affiliation || 'N/A'}</div>
      <div class="item ${comparison.species ? 'correct' : 'incorrect'}">${character.species || 'N/A'}</div>
      <div class="item ${comparison.arc ? 'correct' : 'incorrect'}">${character.arc || 'N/A'}</div>
    </div>
  `);
  updateStatsUI();
  gameState.guessCount++;
  $("#labelRow").after($row);
  $("#guess").empty();
  $("#guess").append(gameState.guessCount + "/8");
  if (perfectGame($row)){
    $("#overlay").fadeIn(300);
    $("#finished").fadeIn(300);
    $finLine = `
        <h1 class="endTit">Congrats!</h1><h2>You Won</h2><h2> Character Was <b>${character.name}</b></h2>`;
    $(".share-section").before($finLine);
    gameState.hasWonToday = true;
    gameState.streak++;
    $("#giveUp").hide();
    $("#streakCount").text(gameState.streak);
  }
  else if (gameState.guessCount == 8){
    $("#overlay").fadeIn(300);
    $("#finished").fadeIn(300);
    $("body").css("overflow", "hidden");
    $finLine = `
        <h1 class="endTit">Better luck next time ...</h1><h2>You Ran out of moves</h2><h2> Character Was <b>${todayCharacter.name}</b></h2>`;
    $(".share-section").before($finLine);
    gameState.hasWonToday = false;
    gameState.streak = 0;
  }
  saveGameState();

}

function saveGameState() {
    try {
        localStorage.setItem('berserkdle_save', JSON.stringify(gameState));
    } catch (e) {
        console.error('Failed to save game state:', e);
    }
}

// Setup input listener
$(document).ready(function() {
  initGameState();
  $('#charInp').on('input', function() {
    getchar($(this).val());
  });
  
  $("#charInp").on("focus",function(){
      $(this).val('');
  });

  $("#submitInp").click(function(e){
      e.preventDefault();  
      checkChar($("#charInp").val());
  });
  $("#giveUp").click(function(){
    $("#overlay").fadeIn(300);
    $("#finished").fadeIn(300);
    if (gameState.hasWonToday == false){
      gameState.hasWonToday = false;
      gameState.streak = 0;
      $finLine = `
          <h1 class="endTit">You Quit...</h1><h2>That's a shame</h2><h2> Character Was <b>${todayCharacter.name}</b></h2>`;
      $(".share-section").before($finLine);
      gameState.guessCount = 8;
    }
    saveGameState();
  });

  $(document).on('click', '.closeBut', function() {
    $("#finished").hide();
    $("#overlay").hide();
    $("#charInp").attr("disabled","true");
    $("#giveUp").data("disabled",true);
  });
  $("#overlay").click(function(){
    $("#finished").hide();
    $("#overlay").hide();
    $("#charInp").attr("disabled","true");
    $("#giveUp").data("disabled",true);
  });
  $("#shareBut").click(function(){
    const conf = $("#confirmation")
        .removeClass("show")[0];
    void conf.offsetWidth;
    conf.classList.add("show");
    navigator.clipboard.writeText('http://localhost:3000/berserkdle.html');
    setTimeout(() => conf.classList.remove("show"), 3000);
    // alert("Copied as link");
  });
});
     