import 'dotenv/config'
import Fastify from 'fastify'
import { submitForReview } from './submission.js'
import citiesRoutes from './cities.js' // Import des routes

const fastify = Fastify({
  logger: true,
})

// Enregistrement des routes
fastify.register(citiesRoutes)

fastify.listen(
  {
    port: process.env.PORT || 3000,
    host: process.env.RENDER_EXTERNAL_URL ? '0.0.0.0' : process.env.HOST || 'localhost',
  },
  function (err) {
    if (err) {
      fastify.log.error(err)
      process.exit(1)
    }

    //////////////////////////////////////////////////////////////////////
    // Don't delete this line, it is used to submit your API for review //
    // everytime your start your server.                                //
    //////////////////////////////////////////////////////////////////////
    submitForReview(fastify)
  }
)