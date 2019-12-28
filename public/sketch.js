var socket;
var stage = 0;

var gameCode = ""; // The game code presented at the top of the landing page.
var inputCode = ""; // The current code typed into the input field.
var inputSide = 10; // The current (one-less-than) side-length as set / shown by the slider.
var draggingSlider = false;

// Side is one less than the actual side-length of the board.
// The variable represents the number of columns away from the center at the edge of the board.
var side;
var hexagons = [];
var playerColor;
var proposingFirstMove = false;
var decidingOnProposition = false;
var propositionResolved = false;
var myTurn = false;
var myLastMoveIndex = -1;
var gameResult = false;

// Colors to be used throughout the app.
var colors;

function setup() {
  socket = io.connect("https://onlinehex.herokuapp.com");
  //socket = io.connect("http://localhost:3000");
  // When a player reaches the landing page, the server assigns them game code.
  socket.on("gameCodeAssigned", gameCodeAssigned);
  // You have been matched with another player, and a game is beginning.
  socket.on("enterGame", enterGame);
  // Your opponent has played their move.
  socket.on("opponentPlayed", opponentPlayed);
  // Your opponent has proposed the first move of the game.
  socket.on("opponentProposed", opponentProposed);
  // Your opponent has accepted or denied your proposed initial move.
  socket.on("opponentResolvedProposition", opponentResolvedProposition);
  // Your opponent has undone their previous move.
  socket.on("opponentUndid", opponentUndid);
  // Your opponent has resigned.
  socket.on("opponentResigned", opponentResigned);
  
  createCanvas(windowWidth, windowHeight);
  colors = {
    "background": color(117, 187, 167),
    "main": color(25, 11, 40),
    "blue": color(0, 75, 168),
    "red": color(191, 33, 30)
  };
}

function draw() {
  background(colors["background"]);
  
  if(stage == 0) {
    renderCode();
    renderInput();
    renderSlider();
    handleSliderDragging();
  } else if(stage == 1) {
    renderBoard();
    renderMenu();
    if(proposingFirstMove) {
      renderProposing();
    } else if(decidingOnProposition) {
      renderDeciding();
    } else if(myTurn) {
      renderMyTurn();
    } else {
      renderOpponentTurn();
    }
  }
}

function gameCodeAssigned(code) {
  gameCode = code;
}

// data contains:
//   "color" which is this player's color and
//   "side" which is one less than the desired board side-length.
function enterGame(data) {
  stage = 1;
  playerColor = data["color"];
  side = data["side"];
  
  // Initalize the board's hexagons.
  angleMode(DEGREES);
  var horDist = 30 * (1 + cos(60)); // The distance between hexagons' centers horizontally.
  var verDist = 30 * sin(60); // The distance between hexagons' centers vertically.
  for(var x = -side; x <= side; x++) {
    for(var y = -abs(abs(x) - side); y <= abs(abs(x) - side); y += 2) {
      var upperLeft = (y == -abs(abs(x) - side) && x <= 0);
      var upperRight = (y == -abs(abs(x) - side) && x >= 0);
      var lowerLeft = (y == abs(abs(x) - side) && x <= 0);
      var lowerRight = (y == abs(abs(x) - side) && x >= 0);
      var sideData = {"upperLeft": upperLeft, "upperRight": upperRight, "lowerLeft": lowerLeft, "lowerRight": lowerRight};
      hexagons.push(new Hexagon(width / 2 + x * horDist, height / 2 + y * verDist, sideData));
    }
  }
  
  // The blue player goes first.
  if(playerColor == "blue") {
    proposingFirstMove = true;
  }
}

function opponentProposed(index) {
  decidingOnProposition = true;
  hexagons[index].fillColor = "main";
}

function opponentResolvedProposition(accepted) {
  propositionResolved = true;
  // Did the opponent accept your proposed initial move?
  if(accepted) {
    myTurn = true;
    // Determine the opponent's color.
    var opponentColor;
    if(playerColor == "red") {
      opponentColor = "blue";
    } else if(playerColor == "blue") {
      opponentColor = "red";
    }
    // Find the proposed hexagon and set it to the opponent's color.
    for(var i = 0; i < hexagons.length; i++) {
      if(hexagons[i].fillColor == "main") {
        hexagons[i].fillColor = opponentColor;
      }
    }
  }
  // Did the opponent reject your proposed initial move?
  if(accepted == false) {
    myTurn = false;
    // Find the proposed hexagon and set it to your own color.
    for(var i = 0; i < hexagons.length; i++) {
      if(hexagons[i].fillColor == "main") {
        hexagons[i].fillColor = playerColor;
      }
    }
  }
}

// data contains:
//    "index" which is the index of the selected hexagon in the hexagons array and
//    "gameOver" which determines if your opponent won the game.
function opponentPlayed(data) {
  // Determine the opponent's color.
  var opponentColor;
  if(playerColor == "red") {
    opponentColor = "blue";
  } else if(playerColor == "blue") {
    opponentColor = "red";
  }
  hexagons[data["index"]].fillColor = opponentColor;
  
  if(data["gameOver"]) {
    gameResult = opponentColor;
  } else {
    myTurn = true;
  }
}

function opponentUndid(hexagonIndex) {
  hexagons[hexagonIndex].fillColor = false;
  myTurn = false;
  myLastMoveIndex = -1; // You shouldn't be able to undo right after your opponent undoes.
}

function opponentResigned() {
  myTurn = false;
  gameResult = playerColor;
}

function mouseClicked() {
  if(stage == 1) {
    // Find the hexagon in which you played and send off its position.
    for(var i = 0; i < hexagons.length; i++) {
      if(hexagons[i].coordsInside(mouseX, mouseY) && hexagons[i].fillColor == false) {
        if(myTurn) {
          hexagons[i].fillColor = playerColor;
          myTurn = false;
          var gameOver = checkGameOver();
          socket.emit("playedMove", {"index": i, "gameOver": gameOver});
          myLastMoveIndex = i;
          if(gameOver) {
            gameResult = playerColor;
          }
        } else if(proposingFirstMove) {
          hexagons[i].fillColor = "main";
          socket.emit("proposedFirstMove", i);
          proposingFirstMove = false;
        }
      }
    }
    // Or maybe you were accepting / denying the initial proposition.
    if(decidingOnProposition) {
      // Did you press the yes button?
      if(mouseX > width / 2 - 100 && mouseX < width / 2 - 50 && mouseY > height / 2 + 355 && mouseY < height / 2 + 385) {
        // Find the proposed hexagon and set it to your own color.
        for(var i = 0; i < hexagons.length; i++) {
          if(hexagons[i].fillColor == "main") {
            hexagons[i].fillColor = playerColor;
          }
        }
        decidingOnProposition = false;
        socket.emit("resolvedProposition", true);
        propositionResolved = true;
      }
      // Did you press the no button?
      if(mouseX > width / 2 + 50 && mouseX < width / 2 + 100 && mouseY > height / 2 + 355 & mouseY < height / 2 + 385) {
        // Determine the opponent's color.
        var opponentColor;
        if(playerColor == "red") {
          opponentColor = "blue";
        } else if(playerColor == "blue") {
          opponentColor = "red";
        }
        // Find the proposed hexagon and set it to the opponent's color.
        for(var i = 0; i < hexagons.length; i++) {
          if(hexagons[i].fillColor == "main") {
            hexagons[i].fillColor = opponentColor;
          }
        }
        decidingOnProposition = false;
        myTurn = true;
        socket.emit("resolvedProposition", false);
        propositionResolved = true;
      }
    }
    // Or maybe you were pressing the resign button.
    if(mouseX > width - 115 && mouseX < width - 25 && mouseY > 25 && mouseY < 60) {
      myTurn = false;
      // Determine the opponent's color.
      var opponentColor;
      if(playerColor == "red") {
        opponentColor = "blue";
      } else if(playerColor == "blue") {
        opponentColor = "red";
      }
      gameResult = opponentColor;
      socket.emit("resigned");
    }
    // Or maybe you were pressing the undo button.
    if(myTurn == false && myLastMoveIndex != -1) {
      if(mouseX > width - 105 && mouseX < width - 25 && mouseY > 67.5 && mouseY < 102.5) {
        hexagons[myLastMoveIndex].fillColor = false;
        myTurn = true;
        socket.emit("undidMove", myLastMoveIndex);
      }
    }
  }
}

function mousePressed() {
  if(stage == 0) {
    if(mouseX > width / 2 - 160 && mouseX < width / 2 + 160 && mouseY > height / 2 + 225 && mouseY < height / 2 + 275) {
      draggingSlider = true;
    }
  }
}

function mouseReleased() {
  if(stage == 0) {
    draggingSlider = false;
  }
}

function keyTyped() {
  if(stage == 0) {
    var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(alphabet.includes(key) && inputCode.length < 5) {
      inputCode += key.toUpperCase();
    }
  }
}

function keyPressed() {
  if(stage == 0) {
    if(keyCode == BACKSPACE) {
      inputCode = inputCode.slice(0, -1);
    }
    if(keyCode == RETURN && inputCode.length == 5) {
      socket.emit("enterGame", {"hostCode": inputCode, "joinCode": gameCode, "boardSide": inputSide});
    }
  }
}

function handleSliderDragging() {
  if(draggingSlider) {
    if(mouseX < width / 2 - 160) {
      inputSide = 4;
    } else if(mouseX > width / 2 + 160) {
      inputSide = 14;
    } else {
      inputSide = round(((mouseX - (width / 2 - 160)) / 320) * 10 + 4);
    }
  }
}

function checkGameOver() {
  for(var i = 0; i < hexagons.length; i++) {
    if(hexagons[i].fillColor == playerColor) {
      if(hexagons[i].sideData["upperLeft"] && playerColor == "blue") {
        if(hexagons[i].canFindPath("lowerRight", [])) {
          return true;
        }
      }
      if(hexagons[i].sideData["upperRight"] && playerColor == "red") {
        if(hexagons[i].canFindPath("lowerLeft", [])) {
          return true;
        }
      }
    }
  }
  return false;
}
