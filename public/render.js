// Render everything that shows during your turn.
function renderMyTurn() {
  noStroke();
  fill(colors[playerColor]);
  textSize(30);
  textAlign(CENTER);
  text("Play your move.", width / 2, height / 2 + 330);
  
  renderHighlight();
}

function renderHighlight() {
  for(var i = 0; i < hexagons.length; i++) {
    if(hexagons[i].coordsInside(mouseX, mouseY) && hexagons[i].fillColor == false) {
      hexagons[i].render(colors[playerColor]);
    }
  }
}

// Render everything that shows during your opponent's turn.
function renderOpponentTurn() {
  noStroke();
  fill(colors[playerColor]);
  textSize(30);
  textAlign(CENTER);
  if(gameResult == false) {
    text("Wait for your opponent's move.", width / 2, height / 2 + 330);
  } else if(gameResult == playerColor) {
    text("You have won the game.", width / 2, height / 2 + 330);
  } else {
    text("You have lost the game.", width / 2, height / 2 + 330);
  }
}

// Render the entire game board.
function renderBoard() {
  angleMode(DEGREES);
  strokeWeight(3);
  stroke(colors["main"]);
  strokeCap(ROUND);
  noFill();
  
  // Render all the hexagons.
  for(var i = 0; i < hexagons.length; i++) {
    hexagons[i].render(false);
  }
  
  var horDist = 30 * (1 + cos(60)); // The distance between hexagons' centers horizontally.
  var verDist = 30 * sin(60); // The distance between hexagons' centers vertically.
  strokeWeight(3.5);
  noFill();
  stroke(colors["red"]);
  // Add the lower-left red marker.
  beginShape();
  for(var x = -9; x <= 0; x++) {
    vertex(width / 2 + x * horDist - 30, height / 2 + verDist * (x + 9));
    vertex(width / 2 + x * horDist - 30 * cos(60), height / 2 + verDist * (x + 10));
  }
  endShape();
  // Add the upper-right red marker.
  beginShape();
  for(var x = 9; x >= 0; x--) {
    vertex(width / 2 + x * horDist + 30, height / 2 + verDist * (x - 9));
    vertex(width / 2 + x * horDist + 30 * cos(60), height / 2 + verDist * (x - 10));
  }
  endShape();
  stroke(colors["blue"]);
  // Add the upper-left blue marker.
  beginShape();
  beginShape();
  for(var x = -9; x <= 0; x++) {
    vertex(width / 2 + x * horDist - 30, height / 2 - verDist * (x + 9));
    vertex(width / 2 + x * horDist - 30 * cos(60), height / 2 - verDist * (x + 10));
  }
  endShape();
  // Add the lower-right blue marker.
  beginShape();
  for(var x = 9; x >= 0; x--) {
    vertex(width / 2 + x * horDist + 30, height / 2 - verDist * (x - 9));
    vertex(width / 2 + x * horDist + 30 * cos(60), height / 2 - verDist * (x - 10));
  }
  endShape();
  // Cap the ends of the color markers.
  stroke(colors["main"]);
  point(width / 2 - 9 * horDist - 30, height / 2);
  point(width / 2 + 9 * horDist + 30, height / 2);
  point(width / 2 - 30 * cos(60), height / 2 - verDist * 10);
  point(width / 2 + 30 * cos(60), height / 2 - verDist * 10);
  point(width / 2 - 30 * cos(60), height / 2 + verDist * 10);
  point(width / 2 + 30 * cos(60), height / 2 + verDist * 10);
}

// Render a single hexagon.
function renderHex(x, y) {
  beginShape();
  vertex(x + 30, y);
  vertex(x + 30 * cos(60), y - 30 * sin(60));
  vertex(x - 30 * cos(60), y - 30 * sin(60));
  vertex(x - 30, y);
  vertex(x - 30 * cos(60), y + 30 * sin(60));
  vertex(x + 30 * cos(60), y + 30 * sin(60));
  endShape(CLOSE);
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
  line(width / 2 - 150.5, height / 2 + 50, width / 2 + 149.5, height / 2 + 50);
  rectMode(CENTER);
  noStroke();
  fill(red(colors["main"]), green(colors["main"]), blue(colors["main"]), 50);
  rect(width / 2, height / 2 + 12.5, 300, 75, 20, 20, 0, 0);
  fill(colors["main"]);
  textAlign(LEFT, CENTER);
  text(inputCode, width / 2 - 130, height / 2 + 20);
  if(inputCode.length == 5) {
    text("✓", width / 2 + 75, height / 2 + 20);
    textSize(20);
    text("Press enter to begin.", width / 2 - 130, height / 2 + 75);
  } else {
    textSize(20);
    text("Enter your friend's code.", width / 2 - 130, height / 2 + 75);
  }
}