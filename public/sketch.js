var socket;
var stage = 0;

var gameCode = "";
var inputCode = "";

var hexagons = [];
var playerColor;
var myTurn = false;
var gameResult = false;

// Colors to be used throughout the app.
var colors;

function setup() {
  socket = io.connect("https://playhexonline.herokuapp.com/");
  // When a player reaches the landing page, the server assigns them game code.
  socket.on("gameCodeAssigned", gameCodeAssigned);
  // You have been matched with another player, and a game is beginning.
  socket.on("enterGame", enterGame);
  // Your opponent has played their move.
  socket.on("opponentPlayed", opponentPlayed)
  
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
    if(myTurn) {
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
  for(var x = -9; x <= 9; x++) {
    for(var y = -abs(abs(x) - 9); y <= abs(abs(x) - 9); y += 2) {
      var upperLeft = (y == -abs(abs(x) - 9) && x <= 0);
      var upperRight = (y == -abs(abs(x) - 9) && x >= 0);
      var lowerLeft = (y == abs(abs(x) - 9) && x <= 0);
      var lowerRight = (y == abs(abs(x) - 9) && x >= 0);
      var sideData = {"upperLeft": upperLeft, "upperRight": upperRight, "lowerLeft": lowerLeft, "lowerRight": lowerRight};
      hexagons.push(new Hexagon(width / 2 + x * horDist, height / 2 + y * verDist, sideData));
    }
  }
  
  // The blue player goes first.
  if(assignedColor == "blue") {
    myTurn = true;
  }
}

function opponentPlayed(movePosition) {
  // Determing the opponent's color.
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
  if(stage == 1 && myTurn) {
    // Find the hexagon in which you played and send off its position.
    for(var i = 0; i < hexagons.length; i++) {
      if(hexagons[i].coordsInside(mouseX, mouseY) && hexagons[i].fillColor == false) {
        hexagons[i].fillColor = playerColor;
        myTurn = false;
        var gameOver = checkGameOver();
        socket.emit("playedMove", {"x": hexagons[i].x - width / 2, "y": hexagons[i].y - height / 2, "gameOver": gameOver});
        if(gameOver) {
          gameResult = playerColor;
        }
      }
    }
  }
}

function keyTyped() {
  if(stage == 0) {
    var alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if(alphabet.includes(key) && inputCode.length < 7) {
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