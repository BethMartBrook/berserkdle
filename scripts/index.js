// const { dailyChar, characterByName, searchByChar } = window.characterAPI;


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
            const lastPlayed = parsed.lastPlayed;
            if (lastPlayed === today) {
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
            } else if(lastPlayed === yesterday){
                gameState = {
                    streak: parsed.streak,
                    lastPlayed: today,
                    hasWonToday: false,
                    guessCount: 0,
                    guesses: []
                };
                saveGameState();
            }else {
                console.log("missed a day :3");
                createNewGameState();
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
    const char = await window.characterAPI.dailyChar();
    return char;
  } catch (error) {    
    console.error('Error fetching daily character:', error);
    return null;
  }
}

//gets selected character frp, the dropdown
async function getchar(char) {
  if (!char.trim()) {
    $('#dropdown').empty();
    return;
  }
  try {
    const results = await window.characterAPI.searchByChar(char);
    showDropdown(results);
    return results;
  } catch (error) {
    console.error('Error searching for characters:', error);
    $('#dropdown').html('<p class="error">Error loading characters</p>');
    return [];
  }
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

async function checkChar(char){
  if (!char.trim()) {
    $("#charInp").val("");
    return;
  }
  try {
    const character = await window.characterAPI.characterByName(char);
    charShow(character);
    return character;
  } catch (error) {
    console.error('Error fetching character by name:', error);
    return null;
  }
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
    let $finLine = `
        <h1 class="endTit">Congrats!</h1>
        <div id="endCont">
        <img src="images/${todayCharacter.image}.webp" class="endImg"> 
        <div class="endText">
        <h2>You Won</h2>
        <h2> Character Was <b>${character.name}</b></h2></div></div>`;
      $(".closeBut").after($finLine);
    gameState.hasWonToday = true;
    gameState.streak++;
    $("#streakCount").text(gameState.streak);
  }
  else if (gameState.guessCount === 8){
    $("#overlay").fadeIn(300);
    $("#finished").fadeIn(300);
    $("body").css("overflow", "hidden");
    let $finLine = `
          <h1 class="endTit">You Quit...</h1>
          <div id="endCont">
          <img src="images/${todayCharacter.image}.webp" class="endImg">
          <div class="endText">
          <h2>That's a shame</h2>
          <h2> Character Was <b>${todayCharacter.name}</b></h2></div></div>`;
      $(".closeBut").after($finLine);
    gameState.hasWonToday = false;
    gameState.streak = 0;
  }
  saveGameState();

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
    if (gameState.hasWonToday == false && gameState.guessCount < 8){
      gameState.hasWonToday = false;
      gameState.streak = 0;
      let $finLine = `
          <h1 class="endTit">You Quit...</h1>
          <div id="endCont">
          <img src="images/${todayCharacter.image}.webp" class="endImg">
          <div class="endText">
          <h2>That's a shame</h2>
          <h2> Character Was <b>${todayCharacter.name}</b></h2></div></div>`;
     $(".closeBut").after($finLine);
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
});

      




