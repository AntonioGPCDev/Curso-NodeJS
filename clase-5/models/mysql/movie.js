import mysql from 'mysql2/promise'

const DEFAULT_CONFIG = {
  host: 'localhost',
  user: 'root',
  port: 3306,
  password: '',
  database: 'moviesdb'
}
const connectionString = process.env.DATABASE_URL ?? DEFAULT_CONFIG

const connection = await mysql.createConnection(connectionString)

export class MovieModel {
  static async getAll ({ genre }) {
    console.log('getAll')

    if (genre) {
      const lowerCaseGenre = genre.toLowerCase()

      // get genre ids from database table using genre names
      const [genres] = await connection.query(
        'SELECT id, name FROM genre WHERE LOWER(name) = ?;',
        [lowerCaseGenre]
      )

      // no genre found
      if (genres.length === 0) return []

      // get the id from the first genre result
      const [{ id }] = genres

      // get all movies ids from database table
      // la query a movie_genres
      // join
      const [filteredMovies] = await connection.query(
        `SELECT BIN_TO_UUID(movie_genres.movie_id) as movieID, movie.title 
         FROM movie_genres
         JOIN movie ON movie.id = movie_genres.movie_id
         WHERE movie_genres.genre_id = ?;`,
        [id]
      )
      // y devolver resultados..
      return filteredMovies
    }

    const [movies] = await connection.query(
      'SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id FROM movie;'
    )

    return movies
  }

  static async getById ({ id }) {
    const [movies] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movie WHERE id = UUID_TO_BIN(?);`,
      [id]
    )

    if (movies.length === 0) return null

    return movies[0]
  }

  static async create ({ input }) {
    const {
      genre: genreInput, // genre is an array
      title,
      year,
      duration,
      director,
      rate,
      poster
    } = input

    // todo: crear la conexión de genre

    const [uuidResult] = await connection.query('SELECT UUID() uuid;')
    const [{ uuid }] = uuidResult

    try {
      // Insertamos la película
      await connection.query(
        `INSERT INTO movie (id, title, year, director, duration, poster, rate)
          VALUES (UUID_TO_BIN("${uuid}"), ?, ?, ?, ?, ?, ?);`,
        [title, year, director, duration, poster, rate]
      )

      // Buscamos los IDs de los géneros a partir de sus nombres
      const [genreResults] = await connection.query(
        'SELECT id FROM genre WHERE name IN (?);',
        [genreInput]
      )

      // Filtrar géneros no encontrados
      // Si no encontramos géneros válidos, lanzar un error
      if (genreResults.length === 0) {
        throw new Error('No se encontraron géneros válidos.')
      }
      const validGenreIds = genreResults.map(result => result.id)

      // Generar los valores para la inserción en movie_genres
      const genreValues = validGenreIds.map(genreId => '(UUID_TO_BIN(?), ?)').join(', ')
      const genreParams = validGenreIds.flatMap(genreId => [uuid, genreId])

      // Insertar las relaciones en la tabla movie_genres
      if (validGenreIds.length > 0) {
        await connection.query(
          `INSERT INTO movie_genres (movie_id, genre_id) VALUES ${genreValues};`,
          genreParams
        )
      }
    } catch (e) {
      // puede enviarle información sensible
      console.error('Error creating movie:', e)
      throw new Error('Error creating movie')
      // enviar la traza a un servicio interno
      // sendLog(e)
    }

    const [movies] = await connection.query(
      `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
        FROM movie WHERE id = UUID_TO_BIN(?);`,
      [uuid]
    )

    return movies[0]
  }

  static async delete ({ id }) {
    // ejercio fácil: crear el delete
    try {
      // Eliminar primero las relaciones en la tabla movie_genres
      await connection.query(
        'DELETE FROM movie_genres WHERE movie_id = UUID_TO_BIN(?);',
        [id]
      )

      // Eliminar la pelicula de la tabla movie
      const [result] = await connection.query(
        'DELETE FROM movie WHERE id = UUID_TO_BIN(?);',
        [id]
      )

      // Verificar si se eliminó correctamente
      if (result.affectedRows === 1) {
        return 'Movie deleted'
      } else {
        throw new Error('Movie not found')
      }
    } catch (error) {
      console.error('Error deleting movie:', error)
      throw new Error('Error deleting movie')
    }
  }

  static async update ({ id, input }) {
    const {
      genre: genreInput, // Array de géneros
      title,
      year,
      duration,
      director,
      rate,
      poster
    } = input

    try {
      // Verificar si la película existe
      const [existingMovie] = await connection.query(
        'SELECT id FROM movie WHERE id = UUID_TO_BIN(?);',
        [id]
      )

      if (existingMovie.length === 0) {
        throw new Error('Movie not found')
      }

      // Actualizar los datos de la película
      await connection.query(
        `UPDATE movie 
         SET title = ?, year = ?, director = ?, duration = ?, poster = ?, rate = ?
         WHERE id = UUID_TO_BIN(?);`,
        [title, year, director, duration, poster, rate, id]
      )

      // Si hay géneros en la actualización, actualizar la relación
      if (genreInput && genreInput.length > 0) {
        // Obtener los IDs de los géneros según los nombres recibidos
        const [genres] = await connection.query(
          `SELECT id FROM genre WHERE name IN (${genreInput.map(() => '?').join(', ')})`,
          genreInput
        )

        const validGenreIds = genres.map(g => g.id)

        // Eliminar relaciones en movie_genres
        await connection.query(
          'DELETE FROM movie_genres WHERE movie_id = UUID_TO_BIN(?);',
          [id]
        )

        // Insertar las nuevas relaciones en movie_genres
        if (validGenreIds.length > 0) {
          const genreValues = validGenreIds.map(() => '(UUID_TO_BIN(?), ?)').join(', ')
          const genreParams = validGenreIds.flatMap(genreId => [id, genreId])

          await connection.query(
            `INSERT INTO movie_genres (movie_id, genre_id) VALUES ${genreValues};`,
            genreParams
          )
        }
      }

      // Devolver la película actualizada
      const [updatedMovies] = await connection.query(
        `SELECT title, year, director, duration, poster, rate, BIN_TO_UUID(id) id
         FROM movie WHERE id = UUID_TO_BIN(?);`,
        [id]
      )

      return updatedMovies[0]
    } catch (error) {
      console.error('Error updating movie:', error)
      throw new Error('Error updating movie')
    }
  }
}
