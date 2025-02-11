import express, { json } from 'express'
// import { corsMiddleware } from './middlewares/cors.js'
import { createMovieRouter } from './routes/movies.js'

export const createApp = ({ movieModel }) => {
  const app = express()
  app.use(json())
  // app.use(corsMiddleware())
  app.disable('x-powered-by')

  // Todos los recursos que sean MOVIES se identifica con /movies
  app.use('/movies', createMovieRouter({ movieModel }))

  const PORT = process.env.PORT ?? 1234

  app.listen(PORT, () => {
    console.log(`server listening on port http://localhost:${PORT}`)
  })
}
