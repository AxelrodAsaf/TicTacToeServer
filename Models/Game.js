const mongoose = require("mongoose");

// Define a way to save a certain set of fields of data
const gameSchema = new mongoose.Schema({

}, { timeseries: true });

// Export the schema
module.exports = mongoose.model("User", gameSchema)
