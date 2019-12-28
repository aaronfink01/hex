var socket;
var stage = 0;

var gameCode = "";
var inputCode = "";

var size = 10; // Size is one less than the side-length of the board.
var hexagons = [];
var playerColor;
var proposingFirstMove = false;
var decidingOnProposition = false;
var propositionResolved = false;
var myTurn = false;
var gameResult = false;

// Colors to be used throughout the app.
var colors;

function setup() {
  socket = io.connect("https://onlinehex.herokuapp.com");
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
  } else if(stage == 1) {
    renderBoard();
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

function enterGame(assignedColor) {
  stage = 1;
  playerColor = assignedColor;
  
  // Initalize the board's hexagons.
  angleMode(DEGREES);
  var horDist = 30 * (1 + cos(60)); // The distance between hexagons' centers horizontally.
  var verDist = 30 * sin(60); // The distance between hexagons' centers vertically.
  for(var x = -size; x <= size; x++) {
    for(var y = -abs(abs(x) - size); y <= abs(abs(x) - size); y += 2) {
      var upperLeft = (y == -abs(abs(x) - size) && x <= 0);
      var upperRight = (y == -abs(abs(x) - size) && x >= 0);
      var lowerLeft = (y == abs(abs(x) - size) && x <= 0);
      var lowerRight = (y == abs(abs(x) - size) && x >= 0);
      var sideData = {"upperLeft": upperLeft, "upperRight": upperRight, "lowerLeft": lowerLeft, "lowerRight": lowerRight};
      hexagons.push(new Hexagon(width / 2 + x * horDist, height / 2 + y * verDist, sideData));
    }
  }
  
  // The blue player goes first.
  if(assignedColor == "blue") {
    proposingFirstMove = true;
  }
}

function opponentProposed(movePosition) {
  decidingOnProposition = true;
  // Find the hexagon which the opponent proposed and change its color.
  for(var i = 0; i < hexagons.length; i++) {
    // We check inside instead of equality to avoid rounding error problems.
    if(hexagons[i].coordsInside(movePosition["x"] + width / 2, movePosition["y"] + height / 2)) {
      hexagons[i].fillColor = "main";
    }
  }
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

function opponentPlayed(movePosition) {
  // Determine the opponent's color.
  var opponentColor;
  if(playerColor == "red") {
    opponentColor = "blue";
  } else if(playerColor == "blue") {
    opponentColor = "red";
  }
  // Find the hexagon in which the opponent played and change its color.
  for(var i = 0; i < hexagons.length; i++) {
    // We check inside instead of equality to avoid rounding error problems.
    if(hexagons[i].coordsInside(movePosition["x"] + width / 2, movePosition["y"] + height / 2)) {
      hexagons[i].fillColor = opponentColor;
    }
  }
  
  if(movePosition["gameOver"]) {
    gameResult = opponentColor;
  } else {
    myTurn = true;
  }
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
          socket.emit("playedMove", {"x": hexagons[i].x - width / 2, "y": hexagons[i].y - height / 2, "gameOver": gameOver});
          if(gameOver) {
            gameResult = playerColor;
          }
        } else if(proposingFirstMove) {
          hexagons[i].fillColor = "main";
          socket.emit("proposedFirstMove", {"x": hexagons[i].x - width / 2, "y": hexagons[i].y - height / 2});
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
      socket.emit("enterGame", {"hostCode": inputCode, "joinCode": gameCode});
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
