DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  bookdescription VARCHAR(255),
  author VARCHAR(255),
  imageurl VARCHAR(255)
);

INSERT INTO books (title, bookdescription, author, imageurl) 
VALUES('title', 'bookdescription', 'author', 'imageurl');
