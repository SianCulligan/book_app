DROP TABLE IF EXISTS books;

CREATE TABLE books (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255),
  bookdescription TEXT,
  author VARCHAR(255),
  imageurl VARCHAR(255),
  categories VARCHAR(255)
);


