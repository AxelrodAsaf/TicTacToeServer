const express = require("express");
const app = express();
const mongoose = require("mongoose");
const Game = require("./Models/Game");
const bodyParser = require("body-parser");
const port = 8000;
const cors = require('cors');
require('dotenv').config()

// Create a server using express
const server = require('http').createServer(app);

// Use socket.io to listen to the server
const io = require("socket.io")(server, {
  cors: {
    origin: "*",
  }
});

// Connection to the mongodb server
mongoose.set("strictQuery", false);
const mongooseURL = process.env.REACT_APP_MONGOOSE_URL;
mongoose.connect(mongooseURL, {})
  .then(() => {
    console.log("Connected to monbodb successfully.");
    console.log('\x1b[32m%s\x1b[0m', `+----------------------------+`);
  })
  .catch(error => {
    console.log("There was an error.");
    console.log(error);
  })

// Help parse the body of the request
app.use(bodyParser.json());

// Permit all to send/receive data
app.use(cors());

// Game Controllers - this allows users to create, join, and view games
io.on("connection", (socket) => {
  console.log(`A user connected with socket id: ${socket.id}`);

  // Wait for host-client to call 'createGame'
  socket.on("createGame", async (data) => {
    console.log(`A new game has been created with ID: ${data.gameID}`);
    const gameID = data.gameID.toLowerCase();
    const username = data.username;
    const player1Piece = data.player1Piece
    const player2Piece = player1Piece === "X" ? "O" : "X";

    // Check if there is already a game with the given ID
    const existingGame = await Game.findOne({ gameID });
    if (existingGame) {
      return socket.emit("createGameResponse", { error: `Game with gameID: ${gameID} already exists` });
    }

    // Generate a random number either 0 or 1 to define first turn
    const randomNumber = Math.floor(Math.random() * 2);
    const turn = randomNumber === 0 ? "X" : "O";

    // Create a new game
    const newGame = new Game({
      gameID: gameID,
      players: [username],
      player1Piece: player1Piece,
      player2Piece: player2Piece,
      turn: turn,
    });
    try {
      await newGame.save();

      // Create a new socket room for the game
      socket.join(gameID);
      console.log(`createGame: Player ${username} joined the room: ${gameID}`);

    } catch (err) {
      console.log(err);
    }
  });


  // Wait for guest-client to call 'joinGame'
  socket.on("joinGame", async (data) => {
    // Define the username as in the request
    const username = data.username;
    // Use the gameID to find the game in the database
    const gameID = data.gameID.toLowerCase();
    try {
      const game = await Game.findOne({ gameID: gameID });
      if (!game) {
        console.log(`joinGame: No game found: ${gameID}`);
        return socket.emit("joinGameError", { error: `No game found: ${gameID}` });
      }

      // Check if the user is already in the game
      if (game.players.includes(username)) {
        console.log(`joinGame: User ${username} already in game ${gameID}`);
        return socket.emit("joinGameError", { error: `User ${username} is already in game ${gameID}` });
      }

      // Check how many players are in the game
      if (game.players.length >= 2) {
        console.log(`joinGame: Game full: ${gameID}`);
        return socket.emit("joinGameError", { error: `Game ${gameID} has ${game.players.length} players` });
      }

      // Join the user to the room
      socket.join(gameID);
      console.log(`Player ${username} joined the room: ${gameID}`);

      // Add the user to the game
      console.log(`joinGame: Adding user ${username} to game ${gameID}`);
      game.players.push(username);
      await game.save();

      // Emit an event to players that the game has started
      console.log("Emitting startGame event");
      io.in(gameID).emit("startGame", { message: `Starting game ${gameID}` });
    }
    catch (err) {
      console.log(err);
      io.in(gameID).emit("joinGameError", { error: err });
    }
  });


  // Wait for either client to call 'getGame' to receive game data
  socket.on("getGame", async (data) => {
    console.log(`A user requested data for the game with ID: ${data.gameID}`);
    const gameID = data.gameID.toLowerCase();
    try {
      // Find the game in the database
      const game = await Game.findOne({ gameID: gameID });
      if (!game) {
        return socket.emit("getGameError", { error: `No game found: ${gameID}` });
      }

      // Return the game's data
      socket.emit("getGameSuccess", { gameData: game });
    }
    catch (err) {
      console.log(err);
      socket.emit("getGameError", { error: err });
    }
  });

  // Listen for a player to call "makeMove" event
  socket.on('makeMove', async (data) => {
    const gameID = data.gameID.toLowerCase();
    const username = data.username;
    const playerPiece = data.playerPiece;
    const cell = data.cell;
    console.log(`User ${username} made a move to cell ${cell} with piece ${playerPiece}`);

    try {
      // Check if the game exists
      const game = await Game.findOne({ gameID });
      if (!game) {
        return socket.emit('error', { message: `Game with gameID: ${gameID} does not exist` });
      }

      // Check if the player is in the game
      const playerList = game.players;
      if (!playerList.includes(username)) {
        return socket.emit('error', { message: `Player ${username} is not in the player list of the game` });
      }

      // Check if it is the player's turn
      const playerTurn = game.turn;
      if (playerTurn !== playerPiece) {
        return socket.emit('error', { message: `It is not ${playerPiece} to make a move` });
      }

      // Calculate the row and column of the cell
      const row = Math.floor(cell / 3);
      const col = cell % 3;

      // Check if the cell is empty
      const gameboard = game.gameboard;
      if (gameboard[row][col] !== "#") {
        return socket.emit('error', { message: `Cell ${cell} is already occupied` });
      }

      // Update the gameboard with the player's move
      gameboard[row][col] = playerPiece;

      // Check if the game has been won (Game logic is at the end of the file)
      checkGameStatus(gameID, gameboard);

      // Change the player's turn to the other player
      playerTurn === "X" ? game.turn = "O" : game.turn = "X";

      // Mark the gameboard property as modified
      game.markModified('gameboard');
      game.markModified('turn');

      // Update the game in the database
      await game.save();
      console.log(`Player ${playerPiece} made a move at cell ${cell}`);
      io.in(gameID).emit('moveMade', { game: game, turn: game.turn });
    } catch (err) {
      console.log(err);
      socket.emit('error', { message: err });
    }
  });

  // Listen for "disconnect" event
  socket.on("disconnect", () => {
    console.log(`A user disconnected with socket id: ${socket.id}`);
  });
});

// Listen for room deletion and delete the game if there's a matching gameID.
// There will be (self) rooms without a match.
io.of("/").adapter.on("delete-room", async (room) => {
  console.log(`Room ${room} was deleted`);

  // Delete the game
  const game = await Game.findOne({ gameID: room });
  if (game) {
    await game.deleteOne();
  }
});

// Run the server on port with a console.log to tell the backend "developer"
server.listen(port, () => {
  console.log('\x1b[32m%s\x1b[0m', `+----------------------------+`);
  console.log(`Starting connection to port ${port}.`);
});




// ========================================================GAME LOGIC=======================================================
// Check if the game has been won in a row
function checkRow(gameboard, player) {
  for (let i = 0; i < 3; i++) {
    if (gameboard[i][0] === player && gameboard[i][1] === player && gameboard[i][2] === player) {
      return true;
    }
  }
  return false;
}

// Check if the game has been won in a column
function checkColumn(gameboard, player) {
  for (let i = 0; i < 3; i++) {
    if (gameboard[0][i] === player && gameboard[1][i] === player && gameboard[2][i] === player) {
      return true;
    }
  }
  return false;
}

// Check if the game has been won diagonally
function checkDiagonal(gameboard, player) {
  if ((gameboard[0][0] === player && gameboard[1][1] === player && gameboard[2][2] === player) ||
    (gameboard[0][2] === player && gameboard[1][1] === player && gameboard[2][0] === player)) {
    return true;
  }
  return false;
}

// Check if the game has been won by either player
function checkWin(gameboard, player) {
  return checkRow(gameboard, player) || checkColumn(gameboard, player) || checkDiagonal(gameboard, player);
}

// Check if the game has been won by either player
function checkGameStatus(gameID, gameboard) {
  if (checkWin(gameboard, `X`)) {
    console.log(`Player X wins!`);
    io.in(gameID).emit(`gameOver`, { winner: `X` });
  } else if (checkWin(gameboard, `O`)) {
    console.log(`Player O wins!`);
    io.in(gameID).emit(`gameOver`, { winner: `O` });
  } else if (gameboard.every(row => row.every(cell => cell !== `#`))) {
    console.log(`Game is a tie!`);
    io.in(gameID).emit(`gameOver`, { winner: `T` });
  }
}
// =========================================================================================================================


// ++++++++++++++++++ Console.log() commands to change colors of the output: ++++++++++++++++++
// console.log('\x1b[31m%s\x1b[0m', 'This text is red.');
// console.log('\x1b[32m%s\x1b[0m', 'This text is green.');
// console.log('\x1b[33m%s\x1b[0m', 'This text is yellow.');
// console.log('\x1b[34m%s\x1b[0m', 'This text is blue.');
// console.log('\x1b[35m%s\x1b[0m', 'This text is magenta.');
// console.log('\x1b[36m%s\x1b[0m', 'This text is cyan.');
// console.log('\x1b[37m%s\x1b[0m', 'This text is white.');
// ++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
// Quick start commands for installations:
// npm install express mongoose bcrypt jsonwebtoken dotenv cors