const express = require('express');
const jwt = require('jsonwebtoken');
let books = require("./booksdb.js");
const regd_users = express.Router();

let users = [];

const isValid = (username)=>{ //returns boolean
  // A username is valid (available) if no registered user already has it
  const userswithsamename = users.filter((user) => user.username === username);
  return userswithsamename.length === 0;
}

const authenticatedUser = (username,password)=>{ //returns boolean
  // Check that the username and password match a registered user
  const validusers = users.filter((user) => user.username === username && user.password === password);
  return validusers.length > 0;
}

//only registered users can login
regd_users.post("/login", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Error logging in. Username and password are required." });
  }

  if (authenticatedUser(username, password)) {
    const accessToken = jwt.sign({ data: password }, 'access', { expiresIn: 60 * 60 });
    req.session.authorization = { accessToken, username };
    return res.status(200).json({ message: "Customer successfully logged in" });
  } else {
    return res.status(208).json({ message: "Invalid Login. Check username and password" });
  }
});

// Add or modify a book review (one review per user per book)
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const review = req.query.review;
  const username = req.session.authorization['username'];

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (!review) {
    return res.status(400).json({ message: "Please provide a review in the 'review' query parameter" });
  }

  books[isbn].reviews[username] = review;
  return res.status(200).json({
    message: `The review for the book with ISBN ${isbn} has been added/updated.`,
    reviews: books[isbn].reviews
  });
});

// Delete the logged-in user's review for a book
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session.authorization['username'];

  if (!books[isbn]) {
    return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
  }
  if (!books[isbn].reviews[username]) {
    return res.status(404).json({ message: `No review by ${username} found for the book with ISBN ${isbn}` });
  }

  delete books[isbn].reviews[username];
  return res.status(200).json({
    message: `Reviews for the ISBN ${isbn} posted by the user ${username} deleted.`
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
