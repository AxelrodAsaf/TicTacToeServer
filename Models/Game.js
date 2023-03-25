const mongoose = require("mongoose");

// Define a way to save a certain set of fields of data
const gameSchema = new mongoose.Schema({
  gameID: {
    type: String,
    required: true,
    unique: true
  },
  players: {
    type: Array,
    default: [],
    max: 2
  },
  gameboard: {
    type: Array,
    default:
      [["#", "#", "#"], ["#", "#", "#"], ["#", "#", "#"]]
  },
  player1Piece: {
    type: String,
    default: "X"
  },
  player2Piece: {
    type: String,
    default: "X"
  },
  turn: {
    type: String,
    default: "X"
  }
}, { timestamps: true });

// Export the schema
module.exports = mongoose.model("Game", gameSchema)
