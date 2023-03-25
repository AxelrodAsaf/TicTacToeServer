const Game = require("../Models/Game");

exports.createGame = async (req, res) => {
  const gameID = req.body.gameID;
  const username = req.body.username;
  var player1Piece = gameID.match(/[XO].*/)[0].slice(0, 1);
  console.log(player1Piece);
  var player2Piece = "X";
  if (player1Piece === "X") {
    player2Piece = "O";
    console.log(player2Piece);
  }

  // Check the gameID if there isn't already a game with that ID
  const game = await Game.findOne({ gameID });
  if (game) {
    console.log(`Game with gameID: ${gameID} already exists`);
    return res.status(400).json({ message: `Game with gameID: ${gameID} already exists` });
  }

  // Create a new game
  try {
    const newGame = new Game({
      gameID: gameID,
      players: [username],
      player1Piece: player1Piece,
      player2Piece: player2Piece
    });
    console.log(`Saving new game with gameID: ${gameID} and player: ${username}`);
    await newGame.save();
    return res.status(200).json({ message: "Game created successfully" });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
}

exports.joinGame = async (req, res) => {
  // Define the username as in the request
  const username = req.body.username;
  // Use the gameID to find the game in the database
  const gameID = req.body.gameID;
  try {
    const game = await Game.findOne({ gameID: gameID });
    if (!game) {
      console.log(`No game found: ${gameID}`);
      return res.status(404).json({ message: `No game found: ${gameID}` });
    }

    // Check if the user is already in the game
    if (game.players.includes(username)) {
      console.log(`User ${username} is already in game ${gameID}`);
      return res.status(400).json({ message: `User ${username} is already in game ${gameID}` });
    }

    // Check how many players are in the game
    if (game.players.length >= 2) {
      console.log(`Game ${gameID} has ${game.players.length} players`);
      return res.status(400).json({ message: `Game ${gameID} has ${game.players.length} players` });
    }

    // Add the user to the game
    game.players.push(username);
    await game.save();
    console.log(`User ${username} joined game ${gameID}`);
    return res.status(200).json({ message: `User ${username} joined game ${gameID} ` });
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }

}

exports.getGame = async (req, res) => {
  const gameID = req.params.gameID;
  try {
    // Find the game in the database
    const game = await Game.findOne({ gameID: gameID });
    if (!game) {
      console.log(`No game found: ${gameID}`);
      return res.status(404).json({ message: `No game found: ${gameID}` });
    }

    // Return the game's data
    return res.status(200).json(game);
  }
  catch (err) {
    console.log(err);
    return res.status(500).json({ message: err });
  }
}