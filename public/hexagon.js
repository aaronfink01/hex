class Hexagon {
  constructor(x, y, sideData) {
    this.x = x;
    this.y = y;
    this.fillColor = false;
    
    // The hexagon knows is it's part of an edge,
    // which makes checking if the game is over (more easily) possible.
    // sideData contains "upperLeft", "upperRight", "lowerLeft", and "lowerRight", all booleans.
    this.sideData = sideData;
  }
  
  // Render the hexagon.
  render(highlightColor) {
    beginShape();
    // Choose a fill color primarily based on the saved color of this hexagon.
    // But if there is no saved color and a highlight is specified, use that.
    if(this.fillColor == false) {
      if(highlightColor == false) {
        noFill();
      } else {
        fill(red(highlightColor), green(highlightColor), blue(highlightColor), 100);
      }
    } else {
      fill(colors[this.fillColor]);
    }
    // Place the six vertices of the hexagon.
    vertex(this.x + scaling, this.y);
    vertex(this.x + scaling * cos(60), this.y - scaling * sin(60));
    vertex(this.x - scaling * cos(60), this.y - scaling * sin(60));
    vertex(this.x - scaling, this.y);
    vertex(this.x - scaling * cos(60), this.y + scaling * sin(60));
    vertex(this.x + scaling * cos(60), this.y + scaling * sin(60));
    endShape(CLOSE);
  }
  
  // Check if a point is within the hexagon.
  coordsInside(x, y) {
    angleMode(DEGREES);
    // Is the mouse within the vertical, rectangular section of the hexagon?
    if(x > this.x - scaling * cos(60) && x < this.x + scaling * cos(60) && y > this.y - scaling * sin(60) && y < this.y + scaling * sin(60)) {
      return true;
    }
    // Is the mouse within the left triangular section of the hexagon?
    if(x > this.x - scaling && x < this.x - scaling * cos(60) && y > this.y - scaling * sin(60) + tan(60) * (this.x - scaling * cos(60) - x) && y < this.y + scaling * sin(60) - tan(60) * (this.x - scaling * cos(60) - x)) {
      return true;
    }
    // Is the mouse within the right triangular section of the hexagon?
    if(x > this.x + scaling * cos(60) && x < this.x + scaling && y > this.y - scaling * sin(60) + tan(60) * (x - (this.x + scaling * cos(60))) && y < this.y + scaling * sin(60) - tan(60) * (x - (this.x + scaling * cos(60)))) {
      return true;
    }
    return false;
  }
  
  // Attempt to find a path to a side of the board (as part of checking if the game is over).
  canFindPath(targetSide, prevUsedHexagons) {
    // If this hexagon is on the target side, we are done searching.
    if(this.sideData[targetSide]) {
      return true;
    }
    // Otherwise, attempt to make a path from each adjacent hexagon
    // (that hasn't been used yet and is of the right color).
    var newPrevUsedHexagons = prevUsedHexagons.concat([this]);
    var horDist = scaling * (1 + cos(60)); // The distance between hexagons' centers horizontally.
    var verDist = scaling * sin(60); // The distance between hexagons' centers vertically.
    var absoluteDist = sqrt(pow(horDist, 2) + pow(verDist, 2)); // The total distance is calculated by Pythagoras.
    for(var i = 0; i < hexagons.length; i++) {
      // Allow for a possible error of up to 10 to avoid rounding problems.
      if(abs(dist(this.x, this.y, hexagons[i].x, hexagons[i].y) - absoluteDist) < 10 && hexagons[i].fillColor == this.fillColor) {
        if(prevUsedHexagons.indexOf(hexagons[i]) == -1) {
          var result = hexagons[i].canFindPath(targetSide, newPrevUsedHexagons);
          if(result) {
            return true;
          }
        }
      }
    }
    return false;
  }
}