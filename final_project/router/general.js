const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let isValid = require("./auth_users.js").isValid;
let users = require("./auth_users.js").users;
const public_users = express.Router();

const BASE_URL = "http://localhost:5000";

public_users.post("/register", (req,res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (!username || !password) {
    return res.status(404).json({ message: "Unable to register user. Username and password are required." });
  }
  if (!isValid(username)) {
    return res.status(404).json({ message: "User already exists!" });
  }

  users.push({ username: username, password: password });
  return res.status(200).json({ message: "User successfully registered. Now you can login" });
});

// Get the book list available in the shop (Promise callbacks)
public_users.get('/',function (req, res) {
  new Promise((resolve) => {
    resolve(books);
  })
    .then((bookList) => res.status(200).send(JSON.stringify(bookList, null, 4)))
    .catch((err) => res.status(500).json({ message: err.message }));
});

// Get book details based on ISBN (Promise callbacks)
public_users.get('/isbn/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  new Promise((resolve, reject) => {
    if (books[isbn]) {
      resolve(books[isbn]);
    } else {
      reject(new Error(`Book with ISBN ${isbn} not found`));
    }
  })
    .then((book) => res.status(200).send(JSON.stringify(book, null, 4)))
    .catch((err) => res.status(404).json({ message: err.message }));
 });

// Get book details based on author (async/await)
public_users.get('/author/:author', async function (req, res) {
  const author = req.params.author;
  try {
    const booksbyauthor = await new Promise((resolve, reject) => {
      const result = [];
      Object.keys(books).forEach((isbn) => {
        if (books[isbn].author.toLowerCase() === author.toLowerCase()) {
          result.push({ isbn: isbn, title: books[isbn].title, reviews: books[isbn].reviews });
        }
      });
      result.length > 0 ? resolve(result) : reject(new Error(`No books found by author ${author}`));
    });
    return res.status(200).send(JSON.stringify({ booksbyauthor }, null, 4));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

// Get all books based on title (async/await)
public_users.get('/title/:title', async function (req, res) {
  const title = req.params.title;
  try {
    const booksbytitle = await new Promise((resolve, reject) => {
      const result = [];
      Object.keys(books).forEach((isbn) => {
        if (books[isbn].title.toLowerCase() === title.toLowerCase()) {
          result.push({ isbn: isbn, author: books[isbn].author, reviews: books[isbn].reviews });
        }
      });
      result.length > 0 ? resolve(result) : reject(new Error(`No books found with title ${title}`));
    });
    return res.status(200).send(JSON.stringify({ booksbytitle }, null, 4));
  } catch (err) {
    return res.status(404).json({ message: err.message });
  }
});

//  Get book review
public_users.get('/review/:isbn',function (req, res) {
  const isbn = req.params.isbn;
  if (books[isbn]) {
    return res.status(200).send(JSON.stringify(books[isbn].reviews, null, 4));
  }
  return res.status(404).json({ message: `Book with ISBN ${isbn} not found` });
});

/*
 * Tasks 10-13: client functions that call the routes above with Axios.
 * Run them with `node router/general.js all|isbn <n>|author <name>|title <name>`
 * while the server is running.
 */

// Task 10: Get all books, using async/await with Axios
const getAllBooks = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books: ${error.message}`);
  }
};

// Task 11: Get book details by ISBN, using Promise callbacks with Axios
const getBookByISBN = (isbn) => {
  return axios.get(`${BASE_URL}/isbn/${isbn}`)
    .then((response) => response.data)
    .catch((error) => {
      throw new Error(`Error fetching book with ISBN ${isbn}: ${error.message}`);
    });
};

// Task 12: Get book details by author, using async/await with Axios
const getBooksByAuthor = async (author) => {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books by author ${author}: ${error.message}`);
  }
};

// Task 13: Get book details by title, using async/await with Axios
const getBooksByTitle = async (title) => {
  try {
    const response = await axios.get(`${BASE_URL}/title/${encodeURIComponent(title)}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching books with title ${title}: ${error.message}`);
  }
};

module.exports.general = public_users;
module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;

// Command-line runner for the Axios client functions
if (require.main === module) {
  const [command, ...rest] = process.argv.slice(2);
  const arg = rest.join(' ');
  const actions = {
    all: () => getAllBooks(),
    isbn: () => getBookByISBN(arg),
    author: () => getBooksByAuthor(arg),
    title: () => getBooksByTitle(arg),
  };
  (actions[command] || actions.all)()
    .then((data) => console.log(JSON.stringify(data, null, 4)))
    .catch((err) => console.error(err.message));
}
