// Render the game tree that is shown after the game is completed.
function renderGameTree() {
  renderGameTreeNode(gameTree[0]);
}

// Render a game tree node and its children recursively.
// NOTE: The children are rendered first so that the line to them will be under the current node.
function renderGameTreeNode(currentNode) {
  // Display the children of the current node;
  var children = currentNode.children;
  for(var i = 0; i < children.length; i++) {
    strokeWeight(3);
    stroke(0);
    line(currentNode.displayX, currentNode.displayY, children[i].displayX, currentNode.displayY);
    line(children[i].displayX, currentNode.displayY, children[i].displayX, children[i].displayY);
    renderGameTreeNode(children[i]);
  }
  // Display the current node.
  if(currentGameState == currentNode) {
    strokeWeight(3);
    stroke(colors["main"]);
  } else {
    noStroke();
  }
  console.log(colors[currentNode.lastPlayedColor]);
  fill(colors[currentNode.lastPlayedColor]);
  ellipse(currentNode.displayX, currentNode.displayY, 30, 30);
}

// Render everything that shows during your turn.
function renderMyTurn() {
  noStroke();
  fill(colors[playerColor]);
  textSize(30);
  textAlign(CENTER);
  text("Play your move.", width / 2, height -  70);
  
  renderHighlight(playerColor);
}

// Render everything that shows while proposing the initial move.
function renderProposing() {
  noStroke();
  fill(colors[playerColor]);
  textSize(30);
  textAlign(CENTER);
  text("Propose a first move.", width / 2, height - 70);
  
  renderHighlight("main");
}

// Render everything that shows while deciding on the opponent's proposition for the initial move.
function renderDeciding() {
  noStroke();
  fill(colors[playerColor]);
  textSize(30);
  textAlign(CENTER);
  text("Would you like to play this move?", width / 2, height - 70);
  
  // Display the yes and no buttons.
  rectMode(CENTER);
  strokeWeight(3);
  stroke(colors[playerColor]);
  noFill();
  rect(width / 2 - 75, height - 30, 50, 30, 10);
  rect(width / 2 + 75, height - 30, 50, 30, 10);
  noStroke();
  fill(colors[playerColor]);
  textSize(20);
  text("Yes", width / 2 - 75, height - 27.5);
  text("No", width / 2 + 75, height - 27.5);
}

// Lightly fill in the hexagon over which the mouse is hovering during your turn.
function renderHighlight(highlightColor) {
  for(var i = 0; i < hexagons.length; i++) {
    if(hexagons[i].coordsInside(mouseX, mouseY) && hexagons[i].fillColor == false) {
      hexagons[i].render(colors[highlightColor]);
    }
  }
}

// Render everything that shows during your opponent's turn.
function renderOpponentTurn() {
  noStroke();
  fill(colors[playerColor]);
  textSize(30);
  textAlign(CENTER);
  if(propositionResolved == false) {
    if(playerColor == "blue") {
      text("Wait for your opponent to make a choice.", width / 2, height - 70);
    } else if(playerColor == "red") {
      text("Wait for your opponent to propose a move.", width / 2, height - 70);
    }
  } else if(gameResult == false) {
    text("Wait for your opponent to play.", width / 2, height - 70);
  } else if(gameResult == playerColor) {
    text("You have won.", width / 2, height - 70);
  } else {
    text("You have lost.", width / 2, height - 70);
  }
}

// Render the in-game menu on the right side of the screen.
function renderMenu() {
  if(gameResult == false && propositionResolved) {
    renderMenuButton("Resign", width - 70, 40, 90);
  }
  if(myTurn == false && myLastMoveIndex != -1 && gameResult == false) {
    renderMenuButton("Undo", width - 65, 85, 80)
  }
}

// Render a button in the in-game menu.
function renderMenuButton(label, x, y, horSize) {
  strokeWeight(3);
  stroke(colors[playerColor]);
  noFill();
  rect(x, y, horSize, 35, 10);
  noStroke();
  fill(colors[playerColor]);
  textAlign(CENTER);
  textSize(25);
  text(label, x, y + 2.5);
}

// Render the entire game board.
function renderBoard() {
  angleMode(DEGREES);
  strokeWeight(scaling / 10);
  stroke(colors["main"]);
  strokeCap(ROUND);
  noFill();
  
  // Render all the hexagons.
  for(var i = 0; i < hexagons.length; i++) {
    hexagons[i].render(false);
  }
  
  var horDist = scaling * (1 + cos(60)); // The distance between hexagons' centers horizontally.
  var verDist = scaling * sin(60); // Half the distance between hexagons' centers vertically.
  strokeWeight(scaling / 10 + 0.5);
  noFill();
  stroke(colors["red"]);
  // Add the lower-left red marker.
  beginShape();
  for(var x = -side; x <= 0; x++) {
    vertex(width / 2 + x * horDist - scaling, height / 2 + verDist * (x + side));
    vertex(width / 2 + x * horDist - scaling * cos(60), height / 2 + verDist * (x + side + 1));
  }
  endShape();
  // Add the upper-right red marker.
  beginShape();
  for(var x = side; x >= 0; x--) {
    vertex(width / 2 + x * horDist + scaling, height / 2 + verDist * (x - side));
    vertex(width / 2 + x * horDist + scaling * cos(60), height / 2 + verDist * (x - side - 1));
  }
  endShape();
  stroke(colors["blue"]);
  // Add the upper-left blue marker.
  beginShape();
  beginShape();
  for(var x = -side; x <= 0; x++) {
    vertex(width / 2 + x * horDist - scaling, height / 2 - verDist * (x + side));
    vertex(width / 2 + x * horDist - scaling * cos(60), height / 2 - verDist * (x + side + 1));
  }
  endShape();
  // Add the lower-right blue marker.
  beginShape();
  for(var x = side; x >= 0; x--) {
    vertex(width / 2 + x * horDist + scaling, height / 2 - verDist * (x - side));
    vertex(width / 2 + x * horDist + scaling * cos(60), height / 2 - verDist * (x - side - 1));
  }
  endShape();
  // Cap the ends of the color markers.
  stroke(colors["main"]);
  point(width / 2 - side * horDist - scaling, height / 2);
  point(width / 2 + side * horDist + scaling, height / 2);
  point(width / 2 - scaling * cos(60), height / 2 - verDist * (side + 1));
  point(width / 2 + scaling * cos(60), height / 2 - verDist * (side + 1));
  point(width / 2 - scaling * cos(60), height / 2 + verDist * (side + 1));
  point(width / 2 + scaling * cos(60), height / 2 + verDist * (side + 1));
}

// Render the game code display on the landing page.
function renderCode() {
  noStroke();
  fill(colors["main"]);
  textAlign(CENTER);
  textSize(35);
  textFont("Georgia");
  text("Your code is", width / 2, 100);
  textSize(60);
  text(gameCode, width / 2, 160);
}

// Render the friend's code input on the landing page.
function renderInput() {
  strokeWeight(3);
  stroke(colors["main"]);
  strokeCap(SQUARE);
  line(width / 2 - 160.5, height / 2 + 50, width / 2 + 159.5, height / 2 + 50);
  rectMode(CENTER);
  noStroke();
  fill(red(colors["main"]), green(colors["main"]), blue(colors["main"]), 50);
  rect(width / 2, height / 2 + 12.5, 320, 75, 20, 20, 0, 0);
  fill(colors["main"]);
  textAlign(LEFT, CENTER);
  text(inputCode, width / 2 - 140, height / 2 + 20);
  if(inputCode.length == 5) {
    //text("✓", width / 2 + 75, height / 2 + 20);
    textSize(20);
    text("Press enter to begin.", width / 2 - 140, height / 2 + 75);
  } else {
    textSize(20);
    text("Enter your friend's code.", width / 2 - 140, height / 2 + 75);
  }
}

// Render the board side-length input slider on the landing page.
function renderSlider() {
  strokeWeight(5);
  stroke(colors["main"]);
  strokeCap(ROUND);
  line(width / 2 - 160, height / 2 + 250, width / 2 + 160, height / 2 + 250);
  var handlePos = ((inputSide - 4) / 10) * 320 + (width / 2 - 160);
  line(handlePos, height / 2  + 225, handlePos, height / 2 + 275);
  textAlign(CENTER);
  textSize(20);
  noStroke();
  fill(colors["main"]);
  text(str(inputSide + 1), handlePos, height / 2 + 300);
}