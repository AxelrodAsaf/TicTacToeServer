const express = require("express");
const app = express();
const mongoose = require("mongoose");
// const authController = require("./Controllers/authController");
const gameController = require("./Controllers/gameController");
const moveController = require("./Controllers/moveController");
const bodyParser = require("body-parser");
const port = 8000;
const cors = require('cors');
require('dotenv').config()


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
app.use(cors("*"));

// Using app.use make sure that the token is valid for all requests
// app.use(authController.token);


app.post("/createGame", gameController.createGame);
app.post("/joinGame", gameController.joinGame);
app.get("/getGame", gameController.getGame);



// Run the server on port with a console.log to tell the backend "developer"
app.listen(port, () => {
  console.log('\x1b[32m%s\x1b[0m', `+----------------------------+`);
  console.log(`Starting connection to port ${port}.`);
});

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