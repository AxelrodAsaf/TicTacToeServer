const Game = require("../Models/Game");

exports.makeMove = async (req, res) => {
  const gameID = req.params.gameID;
  const username = req.body.username;
  const playerPiece = req.body.playerPiece;
  const cell = req.body.cell;

  // Check if the game exists
  const game = await Game.findOne({ gameID });
  if (!game) {
    console.log(`Game with gameID: ${gameID} does not exist`);
    return res.status(400).json({ message: `Game with gameID: ${gameID} does not exist` });
  }

  // Check if the player is in the game
  const playerList = game.players;
  if (!playerList.includes(username)) {
    console.log(`Player ${username} is not in the player list of the game`);
    return res.status(400).json({ message: `Player ${username} is not in the player list of the game` });
  }

  // Check if it is the player's turn
  const playerTurn = game.turn;
  if (playerTurn !== playerPiece) {
    console.log(`It is not ${playerPiece} to make a move`);
    return res.status(400).json({ message: `It is not ${playerPiece} to make a move` });
  }

  // Calculate the row and column of the cell
  const row = Math.floor(cell / 3);
  console.log(`row: ${row}`);
  const col = cell % 3;
  console.log(`col: ${col}`);

  // Check if the cell is empty
  const gameboard = game.gameboard;
  if (gameboard[row][col] !== "#") {
    console.log(`Cell ${cell} is already occupied`);
    return res.status(400).json({ message: `Cell ${cell} is already occupied` });
  }

  // Update the gameboard with the player's move
  gameboard[row][col] = playerPiece;

  // Change the player's turn to the other player
  if (playerTurn === "X") {
    game.turn = "O";
  }
  else {
    game.turn = "X";
  }

  // Mark the gameboard property as modified
  game.markModified('gameboard');
  game.markModified('turn');

  // Update the game in the database
  try {
    await game.save();
    console.log(`Player ${playerPiece} made a move at cell ${cell}`);
    return res.status(200).json({ message: `Player ${playerPiece} made a move at cell ${cell}` });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }

}
