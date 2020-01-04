var socket;
var stage = 0;

var gameCode = ""; // The game code presented at the top of the landing page.
var inputCode = ""; // The current code typed into the input field.
var inputSide = 10; // The current (one-less-than) side-length as set / shown by the slider.
var draggingSlider = false;

// Side is one less than the actual side-length of the board.
// The variable represents the number of columns away from the center at the edge of the board.
var side;
var scaling;
var hexagons = [];
var playerColor;
var proposingFirstMove = false;
var decidingOnProposition = false;
var propositionResolved = false;
var myTurn = false;
var myLastMoveIndex = -1;
var gameResult = false;

var previousGameState = false;
var currentGameState = false;
var gameTree = [];

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
  // Your opponent has reverted the board to a previous game state.
  socket.on("revertedBoard", revertedBoard);
  
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
    if(propositionResolved) {
      renderGameTree();
    }
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
  calculateBoardScaling();
  hexagons = initializeHexagons();
  
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
    currentGameState = new GameState(hexagons, opponentColor);
    gameTree.push(currentGameState);
    beginAssigningNodePositions();
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
    currentGameState = new GameState(hexagons, playerColor);
    gameTree.push(currentGameState);
    beginAssigningNodePositions();
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
  // Update the game tree.
  var newGameState = new GameState(hexagons, opponentColor);
  currentGameState.addChild(newGameState);
  gameTree.push(newGameState);
  beginAssigningNodePositions();
  previousGameState = currentGameState;
  currentGameState = newGameState;
}

function opponentUndid(hexagonIndex) {
  hexagons[hexagonIndex].fillColor = false;
  myTurn = false;
  myLastMoveIndex = -1; // You shouldn't be able to undo right after your opponent undoes.
  currentGameState = previousGameState;
}

function opponentResigned() {
  myTurn = false;
  gameResult = playerColor;
}

function revertedBoard(gameNodeIndex) {
  console.log("reverted");
  currentGameState = gameTree[gameNodeIndex];
  currentGameState.revertBoard();
  if(currentGameState.lastPlayedColor == playerColor) {
    myTurn = false
  } else {
    myTurn = true;
  }
}

function initializeHexagons() {
  var hexagonArray = [];
  var horDist = scaling * (1 + cos(60)); // The distance between hexagons' centers horizontally.
  var verDist = scaling * sin(60); // Half the distance between hexagons' centers vertically.
  for(var x = -side; x <= side; x++) {
    for(var y = -abs(abs(x) - side); y <= abs(abs(x) - side); y += 2) {
      var upperLeft = (y == -abs(abs(x) - side) && x <= 0);
      var upperRight = (y == -abs(abs(x) - side) && x >= 0);
      var lowerLeft = (y == abs(abs(x) - side) && x <= 0);
      var lowerRight = (y == abs(abs(x) - side) && x >= 0);
      var sideData = {"upperLeft": upperLeft, "upperRight": upperRight, "lowerLeft": lowerLeft, "lowerRight": lowerRight};
      hexagonArray.push(new Hexagon(width / 2 + x * horDist, height / 2 + y * verDist, sideData));
    }
  }
  return hexagonArray;
}

function calculateBoardScaling() {
  // Calulate the board scaling factor.
  angleMode(DEGREES);
  activeHeight = height - 200;
  activeWidth = width - 200;
  heightBasedScaling = 30 * (activeHeight / (side + 1)) / (60 * sin(60));
  widthBasedScaling = 30 * (activeWidth / (2 * side + 2)) / (30 * (1 + cos(60)));
  scaling = min(heightBasedScaling, widthBasedScaling);
}

function windowResized() {
  createCanvas(windowWidth, windowHeight);
  calculateBoardScaling();
  
  // Create new hexagons with the right positions.
  var newHexagons = initializeHexagons();
  // Copy the fill colors of the old hexagons onto the new hexagons.
  for(var i = 0; i < hexagons.length; i++) {
    newHexagons[i].fillColor = hexagons[i].fillColor;
  }
  // Replace the old hexagons.
  hexagons = newHexagons;
}

function mouseClicked() {
  if(stage == 1) {
    console.log(mouseX, mouseY);
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
          // Update the game tree.
          var newGameState = new GameState(hexagons, playerColor);
          currentGameState.addChild(newGameState);
          gameTree.push(newGameState);
          beginAssigningNodePositions();
          previousGameState = currentGameState;
          currentGameState = newGameState;
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
      if(mouseX > width / 2 - 100 && mouseX < width / 2 - 50 && mouseY > height - 45 && mouseY < height - 15) {
        // Find the proposed hexagon and set it to your own color.
        for(var i = 0; i < hexagons.length; i++) {
          if(hexagons[i].fillColor == "main") {
            hexagons[i].fillColor = playerColor;
          }
        }
        decidingOnProposition = false;
        socket.emit("resolvedProposition", true);
        propositionResolved = true;
        currentGameState = new GameState(hexagons, playerColor);
        gameTree.push(currentGameState);
        beginAssigningNodePositions();
      }
      // Did you press the no button?
      if(mouseX > width / 2 + 50 && mouseX < width / 2 + 100 && mouseY > height - 45 & mouseY < height - 15) {
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
        currentGameState = new GameState(hexagons, opponentColor);
        gameTree.push(currentGameState);
        beginAssigningNodePositions();
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
        currentGameState = previousGameState;
      }
    }
    // Or maybe you were clicking a node on the game tree.
    for(var i = 0; i < gameTree.length; i++) {
      if(dist(mouseX, mouseY, gameTree[i].displayX, gameTree[i].displayY) < 25) {
        currentGameState = gameTree[i];
        currentGameState.revertBoard();
        if(currentGameState.lastPlayedColor == playerColor) {
          myTurn = false;
        } else {
          myTurn = true;
        }
        socket.emit("revertedBoard", i);
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
  } else {
    console.log(gameTree[0].toString(0));
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

// Call assignNodePositions on the first node.
function beginAssigningNodePositions() {
  assignNodePositions(gameTree[0], 50, 50);
}

// Recursively calculate and assign the on-screen positions of each game tree node.
function assignNodePositions(currentNode, x, y) {
  // Set the current node's display position.
  currentNode.setDisplayPosition(x, y);
  // Set the display positions of all the current node's children recursively.
  var children = currentNode.children;
  if(children.length == 0) {
    return 50;
  }
  var childX = x;
  for(var i = 0; i < children.length; i++) {
    var childTreeWidth = assignNodePositions(children[i], childX, y + 50);
    childX += childTreeWidth;
  }
  return (childX - x);
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