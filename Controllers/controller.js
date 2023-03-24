const game = require("../Models/Game");

exports.createGame = async (req, res) => {

}

exports.getGame = async (req, res) => {
  try {
    console.log(req);
    return res.status(200).json(req);
  }
  catch (err) {
    console.log(err);
  }
}