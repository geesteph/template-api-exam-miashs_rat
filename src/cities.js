import fetch from 'node-fetch'

const recipes = []

export default async function citiesRoutes(fastify, options) {
  // GET /cities/:cityId/infos
  fastify.get('/cities/:cityId/infos', async (request, reply) => {
    const { cityId } = request.params

    try {
      // Fetch city data from City API
      const cityResponse = await fetch(`https://api-ugi2pflmha-ew.a.run.app/cities/${cityId}`)
      if (!cityResponse.ok) {
        return reply.status(404).send({ error: 'City not found' })
      }
      const cityData = await cityResponse.json()

      // Fetch weather data from Weather API
      const weatherResponse = await fetch(`https://api-ugi2pflmha-ew.a.run.app/weather/${cityId}`)
      const weatherData = await weatherResponse.json()

      // Prepare response
      const response = {
        coordinates: [cityData.latitude, cityData.longitude],
        population: cityData.population,
        knownFor: cityData.knownFor,
        weatherPredictions: weatherData.predictions,
        recipes: recipes.filter(recipe => recipe.cityId === cityId),
      }

      reply.send(response)
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // POST /cities/:cityId/recipes
  fastify.post('/cities/:cityId/recipes', async (request, reply) => {
    const { cityId } = request.params
    const { content } = request.body

    // Validate content
    if (!content || content.length < 10 || content.length > 2000) {
      return reply.status(400).send({ error: 'Invalid recipe content' })
    }

    try {
      // Check if city exists
      const cityResponse = await fetch(`https://api-ugi2pflmha-ew.a.run.app/cities/${cityId}`)
      if (!cityResponse.ok) {
        return reply.status(404).send({ error: 'City not found' })
      }

      // Create recipe
      const recipe = {
        id: recipes.length + 1,
        cityId,
        content,
      }
      recipes.push(recipe)

      reply.status(201).send(recipe)
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' })
    }
  })

  // DELETE /cities/:cityId/recipes/:recipeId
  fastify.delete('/cities/:cityId/recipes/:recipeId', async (request, reply) => {
    const { cityId, recipeId } = request.params

    try {
      // Check if city exists
      const cityResponse = await fetch(`https://api-ugi2pflmha-ew.a.run.app/cities/${cityId}`)
      if (!cityResponse.ok) {
        return reply.status(404).send({ error: 'City not found' })
      }

      // Find and delete recipe
      const recipeIndex = recipes.findIndex(
        recipe => recipe.cityId === cityId && recipe.id === parseInt(recipeId)
      )
      if (recipeIndex === -1) {
        return reply.status(404).send({ error: 'Recipe not found' })
      }

      recipes.splice(recipeIndex, 1)
      reply.status(204).send()
    } catch (error) {
      reply.status(500).send({ error: 'Internal server error' })
    }
  })
}