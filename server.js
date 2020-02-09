'use strict'

require('dotenv').config();

const express = require('express');
const app = express();
const pg = require('pg');
const superagent = require('superagent');
const PORT = process.env.PORT;

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', renderHomePage);
app.get('/searches/new', showForm);
app.get('/credits', showCredits);
// app.get('/books/show', getBook);
app.get('/books/:id', returnDetails);


app.post('/searches', createSearch);
app.post('/addtocollection', addBookToCollection);


function returnDetails(request, response) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [request.params.id];
  return client.query(SQL, values)
    .then(results => {
      return response.render('pages/books/show.ejs', { results: results.rows });
    })
    .catch(err => errorHandler(err, response));
}


function Book(info) {
  this.imageurl = info.imageLinks.smallThumbnail.replace('http://', 'https://') || placeholderImage;
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title || 'No title available';
  this.author = info.authors || 'None of your business';
  this.bookdescription = info.description || 'Absolutely not.';
}

function renderHomePage(request, response) {
  let SQL = 'SELECT * from books;';
  return client.query(SQL)
    .then(results => response.render('pages/index.ejs', { results: results.rows }))
    .catch(errorHandler);
  // response.render('pages/index.ejs');
}

// function getBook(request, response) {
// }

function showForm(request, response) {
  response.render('pages/searches/new.ejs');
}

function showCredits(request, respone) {
  respone.render('pages/credits.ejs');
}

function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';
  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }
  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }));
}

function errorHandler(error, response) {
  response.render('pages/error.ejs', { error: 'Uh Oh' });
}



function addBookToCollection(request, response) {
  let { title, bookdescription, author, imageurl } = request.body;
  console.log(request.body);
  let SQL = 'INSERT INTO books(title, bookdescription, author, imageurl) VALUES ($1, $2, $3, $4);';
  let values = [title, bookdescription, author, imageurl];

  return client.query(SQL, values)
    .then(response.redirect('/'))
    .catch(err => errorHandler(err, response));
}







app.get('*', (request, response) => response.status(404).send('This route does not exist'));

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Server up on port ${PORT}`))
  });
