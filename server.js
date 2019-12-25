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
var games = []; // Store the socket ids for in-progress games.

function newConnection(socket) {
  console.log("New Connection: " + socket.id);
  
  // Give the new client a game code and save it.
  var selectedCode = possibleCodes[Math.floor(Math.random() * possibleCodes.length)].toUpperCase();
  socket.emit("gameCodeAssigned", selectedCode);
  codes[selectedCode] = socket.id;
  
  // When a player enters a game code from the landing page.
  socket.on("enterGame", enterGame);
  // data contains:
  //   "hostCode" which is the code entered by the sender and
  //   "joinCode" which is the sender's own code.
  function enterGame(data) {
    var opponentId = codes[data.hostCode];
    if(data.hostCode in codes && opponentId != socket.id) { // Check that the entered code is a valid match.
      var newGame;
      // Randomly choose game listing order (for color assignment).
      if(Math.random() < 0.5) {
        newGame = [socket.id, opponentId];
      } else {
        newGame = [opponentId, socket.id];
      }
      io.to(newGame[0]).emit("enterGame", "blue");
      io.to(newGame[1]).emit("enterGame", "red");
      games.push(newGame);
      delete codes[data.hostCode];
      delete codes[data.joinCode];
    }
  }
  
  socket.on("playedMove", playedMove);
  // data contains:
  //    "x" which is the x position of the selected hexagon and
  //    "y" which is the y position of the selected hexagon and
  //    "gameOver" which determines if the player won the game.
  // note: width / 2 and height / 2 have been substracted respectively
  // so players with different window sizes will not encounter problems.
  function playedMove(data) {
    var opponentId;
    // Determine the opponent's socket id.
    for(var i = 0; i < games.length; i++) {
      if(games[i][0] == socket.id) {
        opponentId = games[i][1];
      } else if(games[i][1] == socket.id) {
        opponentId = games[i][0];
      }
    }
    io.to(opponentId).emit("opponentPlayed", data);
  }
}