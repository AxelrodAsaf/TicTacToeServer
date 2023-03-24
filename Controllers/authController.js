const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Secret key for signing JWT
const secretKey = process.env.JWT_SECRET_KEY;


// 1. When the client sends a get request to '/token' reply with "Token verified" after verification
// 2. When the client makes any request to the server, check if the token is valid
exports.token = async (req, res, next) => {
  if (req.headers.authorization !== undefined) {
    [, token] = req.headers.authorization.split(' ');
    // Verify token
    if (token !== undefined) {
      var payload = '';
      try {
        // Verify the JWT
        payload = jwt.verify(token, secretKey);
        // Access the payload of the JWT
        console.log('\x1b[32m%s\x1b[0m', `Verified token of user: ${payload.email}`);
        // Add the user's email (from the token) to the request
        req.user = payload.email;
      } catch (error) {
        // Handle error
        console.error(error.message);
      }
    }
  }
  else {
    console.log('\x1b[31m%s\x1b[0m', `No token verified for the request`);
  }
  // Continue to the next handler (with or without the user's email)
  next();
}