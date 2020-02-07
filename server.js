'use strict'

require('dotenv').config();

const express = require('express');
const app = express();
// const pg = require('pg');
const superagent = require('superagent');
const PORT = process.env.PORT;

app.set('view engine', 'ejs');

app.use(express.static('./public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', renderHomePage);
app.get('/searches/new', showForm);
app.get('/credits', showCredits);

app.post('/searches', createSearch);

function Book(info) {

  this.image = info.imageLinks.smallThumbnail.replace('http://', 'https://') || placeholderImage;
  const placeholderImage = 'https://i.imgur.com/J5LVHEL.jpg';
  this.title = info.title || 'No title available';
  this.author = info.authors || 'None of your business';
  this.description = info.description || 'Absolutely not.';
}

function renderHomePage(request, response) {
  response.render('pages/index.ejs');
}

function showForm(request, response) {
  response.render('pages/searches/new.ejs');
}

function showCredits(request, respone) {
  respone.render('pages/credits.ejs');
}

function createSearch(request, response) {
  let url = 'https://www.googleapis.com/books/v1/volumes?q=';

  // console.log(request.body);
  // console.log(request.body.search);

  if (request.body.search[1] === 'title') { url += `+intitle:${request.body.search[0]}`; }
  if (request.body.search[1] === 'author') { url += `+inauthor:${request.body.search[0]}`; }

  superagent.get(url)
    .then(apiResponse => apiResponse.body.items.map(bookResult => new Book(bookResult.volumeInfo)))
    .then(results => response.render('pages/searches/show', { searchResults: results }));
}

app.get('*', (request, response) => response.status(404).send('This route does not exist'));

app.listen(PORT, () => console.log(`Server up on port ${PORT}`))
