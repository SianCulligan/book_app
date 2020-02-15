'use strict'

require('dotenv').config();

const express = require('express');
const app = express();
const pg = require('pg');
const superagent = require('superagent');
const PORT = process.env.PORT;
const methodOverride = require('method-override');

const client = new pg.Client(process.env.DATABASE_URL);
client.on('error', err => console.error(err));

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));

app.get('/', renderHomePage);
app.get('/searches/new', showForm);
app.get('/credits', showCredits);
app.get('/books/:id', returnDetails);

app.post('/books/:id', returnDetails);
app.post('/updatedetails/:id', returnDetailsTwo);
app.post('/searches', createSearch);
app.post('/addtocollection', addBookToCollection);

app.delete('/books/:id', deleteDetails);

app.put('/books/:id', updateDetails);

function updateDetails (request, response) {
  console.log(request.body);
  let id = request.params.id;
  let title = request.body.title;
  let bookdescription = request.body.bookdescription;
  let author = request.body.author;
  let imageurl = request.body.imageurl;
  let categories = request.body.categories;
  let SQL = 'UPDATE books SET title=$1, bookdescription=$2, author=$3, imageurl=$4, categories=$5 WHERE id = $6;';
  let values = [title, bookdescription, author, imageurl, categories, id];
  client.query(SQL, values)
    .then(() => {
      console.log('HELLO!');
      response.redirect('/');
    })
    .catch(err => errorHandler(err, response));
}


function deleteDetails(request, response) {
  let id = request.params.id;
  let SQL = 'DELETE FROM books WHERE id = $1;';
  let values = [id];
  client.query(SQL, values)
    .then(() => {
      response.redirect('/');
    })
    .catch(err => errorHandler(err, response));
}

function returnDetails(request, response) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [request.params.id];
  return client.query(SQL, values)
    .then(results => {
      let SQL = 'SELECT * FROM books;';
      return client.query(SQL)
        .then(() => {
          SQL = 'SELECT DISTINCT categories FROM books;';
          client.query(SQL)
            .then(bookshelf => {
              console.log(bookshelf.rows);
              response.render('pages//books/show.ejs', {
                results: results.rows,
                bookshelf: bookshelf.rows
              })})})
        .catch(errorHandler);
    })
}


function returnDetailsTwo(request, response) {
  let SQL = 'SELECT * FROM books WHERE id=$1;';
  let values = [request.params.id];
  return client.query(SQL, values)
    .then(results => {
      let SQL = 'SELECT * FROM books;';
      return client.query(SQL)
        .then(() => {
          SQL = 'SELECT DISTINCT categories FROM books;';
          client.query(SQL)
            .then(bookshelf => {
              console.log('THIS IS WHAT YOU NEEEED!', bookshelf.rows);
              response.render('pages/books/edit.ejs', {
                results: results.rows,
                bookshelf: bookshelf.rows
              })})})
        .catch(errorHandler);
    })
}


function Book(info) {
  this.imageurl = info.imageLinks.smallThumbnail.replace('http://', 'https://') || placeholderImage;
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title || 'No title available';
  this.author = info.authors || 'None of your business';
  this.bookdescription = info.description || 'Absolutely not.';
  this.categories = info.categories || 'Other.';
}

function renderHomePage(request, response) {
  let SQL = 'SELECT * FROM books;';
  return client.query(SQL)
    .then(results => {
      SQL = 'SELECT DISTINCT categories FROM books;';
      client.query(SQL)
        .then(bookshelf => {
          console.log('render home page check',bookshelf.rows, results.rows);
          response.render('pages/index.ejs', {
            results: results.rows,
            bookshelf: bookshelf.rows
          })})})
    .catch(errorHandler);
}

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
    .then(results => {
      let SQL = 'SELECT * FROM books;';
      return client.query(SQL)
        .then(() => {
          SQL = 'SELECT DISTINCT categories FROM books;';
          client.query(SQL)
            .then(bookshelf => {
              console.log(bookshelf.rows);
              response.render('pages/searches/show', {
                searchResults: results,
                bookshelf: bookshelf.rows
              })})})
        .catch(errorHandler);
    })
}

function errorHandler(error, response) {
  response.render('pages/error.ejs', { error: 'Uh Oh' });
}

function addBookToCollection(request, response) {

  let title = request.body.title;
  let bookdescription = request.body.bookdescription;
  let author = request.body.author;
  let imageurl = request.body.imageurl;
  let categories = request.body.categories;
  console.log(request.body);
  let SQL = 'INSERT INTO books(title, bookdescription, author, imageurl, categories) VALUES ($1, $2, $3, $4, $5) RETURNING *;';
  let values = [title, bookdescription, author, imageurl, categories];
  client.query(SQL, values)
    .then( results => {
      console.log(results);
      response.redirect('/')
    })
    .catch(err => errorHandler(err, response));
}

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`Server up on port ${PORT}`))
  });
