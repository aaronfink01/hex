class GameState {
  constructor(currentHexagons, lastPlayedColor) {
    // Record the colors of each hexagon.
    this.fillColors = [];
    for(var i = 0; i < currentHexagons.length; i++) {
      this.fillColors.push(currentHexagons[i].fillColor);
    }
    this.children = [];
    this.lastPlayedColor = lastPlayedColor;
    this.displayX = false;
    this.displayY = false;
  }
  
  addChild(newGameState) {
    this.children.push(newGameState);
  }
  
  setDisplayPosition(x, y) {
    this.displayX = x;
    this.displayY = y;
  }
  
  revertBoard() {
    for(var i = 0; i < hexagons.length; i++) {
      hexagons[i].fillColor = this.fillColors[i];
    }
  }
  
  toString(indent) {
    var output = "  ".repeat(indent) + "contains " + str(this.children.length) + " children:\n";
    for(var i = 0; i < this.children.length; i++) {
      output += this.children[i].toString(indent + 1);
    }
    return output;
  }
}