-- creación de la base de datos
DROP DATABASE IF EXISTS moviesdb;
CREATE DATABASE moviesdb;

-- usar
USE moviesdb;

-- crear la tabla movies
CREATE TABLE movie (
	id BINARY(16) PRIMARY KEY DEFAULT (UUID_TO_BIN(UUID())),
    title VARCHAR(255) NOT NULL,
    year INT NOT NULL,
    director VARCHAR(255) NOT NULL,
    duration INT NOT NULL,
    poster TEXT,
    rate DECIMAL (2,1) UNSIGNED NOT NULL
);

CREATE TABLE genre (
	id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE
);

CREATE TABLE movie_genres (
	movie_id BINARY(16) REFERENCES movies(id),
    genre_id INT REFERENCES genres(id),
    PRIMARY KEY (movie_id, genre_id)
);

INSERT INTO genre (name) VALUES
('Drama'),
('Action'),
('Crime'),
('Adventure'),
('Sci-Fi'),
('Romace');

INSERT INTO movie (id, title, year, director, duration, poster, rate) VALUES
(UUID_TO_BIN(UUID()), "Inception", 2010, "Christopher Nolan", 180, "https://www.originalfilmart.com/cdn/shop/files/inception_2010_french_original_film_art_5000x.webp?v=1686692704", 8.8),
(UUID_TO_BIN(UUID()), "The Shawshank Redemption", 1994, "Frank Darabont", 142, "https://pics.filmaffinity.com/Cadena_perpetua-576140557-large.jpg", 9.2),
(UUID_TO_BIN(UUID()), "The Dark Knight", 2008, "Christopher Nolan", 152, "https://pics.filmaffinity.com/El_caballero_oscuro-628375729-large.jpg", 9.0);

INSERT INTO movie_genres (movie_id, genre_id)
VALUES
	((SELECT id FROM movie WHERE title = 'Inception'), (SELECT id FROM genre WHERE name = 'Sci-Fi')),
	((SELECT id FROM movie WHERE title = 'Inception'), (SELECT id FROM genre WHERE name = 'Action')),
    ((SELECT id FROM movie WHERE title = 'The Shawshank Redemption'), (SELECT id FROM genre WHERE name = 'Drama')),
	((SELECT id FROM movie WHERE title = 'The Dark Knight'), (SELECT id FROM genre WHERE name = 'Action'));
    
SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id FROM movie;

SELECT BIN_TO_UUID(movie_id) as movieID, genre_id  from movie_genres;