// Set up the server and such.
var express = require("express");
var app = express();
var server = app.listen(process.env.PORT || 3000);
app.use(express.static("public"));
console.log("The server is running.");
var socket = require("socket.io");
var io = socket(server);
io.sockets.on("connection", newConnection);

// Read the codes.txt file for possible game codes.
var fs = require("fs");
var fileText = fs.readFileSync("./codes.txt").toString();
var possibleCodes = fileText.split("\n");

var codes = {}; // Store game codes currently assigned to people on the landing page.
var games = {}; // Bidirectional mapping of players to their opponents.

function newConnection(socket) {
  console.log("New Connection: " + socket.id);
  
  // Give the new client a game code and save it.
  var selectedCode = possibleCodes[Math.floor(Math.random() * possibleCodes.length)].toUpperCase();
  socket.emit("gameCodeAssigned", selectedCode);
  codes[selectedCode] = socket.id;
  
  socket.on("disconnect", disconnect);
  function disconnect() {
    // If the socket has a code assigned, delete it.
    for(var code in codes) {
      if(codes[code] == socket.id) {
        delete codes[code];
      }
    }
    // If the socket is in a game, forget about it (in both directions).
    if(games[socket.id] != undefined) {
      delete games[socket.id];
      for(var player in games) {
        if(games[player] == socket.id) {
          delete games[player];
        }
      }
    }
  }
  
  // When a player enters a game code from the landing page.
  socket.on("enterGame", enterGame);
  // data contains:
  //   "hostCode" which is the code entered by the sender
  //   "joinCode" which is the sender's own code and
  //   "boardSide" which is one less than the side-length of the desired board.
  function enterGame(data) {
    var opponentId = codes[data.hostCode];
    if(data.hostCode in codes && opponentId != socket.id) { // Check that the entered code is a valid match.
      var newGame;
      // Randomly choose color assignment.
      if(Math.random() < 0.5) {
        io.to(socket.id).emit("enterGame", {"color": "blue", "side": data["boardSide"]});
        io.to(opponentId).emit("enterGame", {"color": "red", "side": data["boardSide"]});
      } else {
        io.to(opponentId).emit("enterGame", {"color": "blue", "side": data["boardSide"]});
        io.to(socket.id).emit("enterGame", {"color": "red", "side": data["boardSide"]});
      }
      
      games[socket.id] = opponentId;
      games[opponentId] = socket.id;
      delete codes[data.hostCode];
      delete codes[data.joinCode];
    }
  }
  
  socket.on("playedMove", playedMove);
  // data contains:
  //    "index" which is the index of the selected hexagon in the hexagons array and
  //    "gameOver" which determines if the player won the game.
  function playedMove(data) {
    var opponentId = games[socket.id];
    io.to(opponentId).emit("opponentPlayed", data);
  }
  
  socket.on("proposedFirstMove", proposedFirstMove);
  // This parameter is the index of the proposed hexagon in the hexagons array.
  function proposedFirstMove(index) {
    var opponentId = games[socket.id];
    io.to(opponentId).emit("opponentProposed", index);
  }
  
  socket.on("resolvedProposition", resolvedProposition);
  function resolvedProposition(accepted) {
    var opponentId = games[socket.id];
    io.to(opponentId).emit("opponentResolvedProposition", accepted);
  }
  
  socket.on("undidMove", undidMove);
  // This paremeter is the index in the hexagons array of the hexagon which is being unplayed.
  function undidMove(hexagonIndex) {
    var opponentId = games[socket.id];
    io.to(opponentId).emit("opponentUndid", hexagonIndex);
  }
  
  socket.on("resigned", resigned);
  function resigned() {
    var opponentId = games[socket.id];
    io.to(opponentId).emit("opponentResigned");
  }
}