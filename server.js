'use strict'

require('dotenv').config();

const express = require('express');
const app = express();
// const pg = require('pg');
const superagent = require('superagent');
const PORT = process.env.PORT;

app.get('/', (request, response) => {
    response.send(`It's alllllive!`);
  });

  //Xrun npm init
//Xrun npm install w/ express, cors, superagent
//list out routes...


app.listen(PORT, () => console.log(`Server up on port ${PORT}`))
