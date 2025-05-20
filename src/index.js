import 'dotenv/config'
import Fastify from 'fastify'
import { submitForReview } from './submission.js'
import { deleteCityRecipe, getCityInfo, postCityRecipe } from './cities.js'
import FastifySwagger from "@fastify/swagger";
import FastifySwaggerUi from "@fastify/swagger-ui";

const fastify = Fastify({
  logger: true,
})

await fastify.register(FastifySwagger, {
    openapi: {
      openapi: "3.0.0",
      info: {
        title: "SWAGGER",
        description: "SWAGGER",
        version: "0.1.0",
      },

      components: {
        securitySchemes: {
          apiKey: {
            type: "apiKey",
            name: "apiKey",
            in: "header",
          },
        },
      },
      externalDocs: {
        url: "https://swagger.io",
        description: "Find more info here",
      },
    },
  });
  
  await fastify.register(FastifySwaggerUi, {
    routePrefix: "/",
    uiConfig: {
      docExpansion: "full",
      deepLinking: false,
    },
  });

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

const body_schema = {
    type: 'object',
    required: ['content'],
    additionalProperties: false,
    properties: {
        content: { type: 'string' }
    }
}


const cityID_schema =  {
    schema: {
        description: 'Informations détaillées sur une ville',
        response: {
            200: {
            type: 'object',
            properties: {
                coordinates: {
                type: 'array',
                description: 'Coordonnées géo de la ville',
                items: { type: 'number' },
                minItems: 2,
                maxItems: 2
                },
                population: {
                type: 'integer',
                description: 'Population de la ville'
                },
                knownFor: {
                type: 'array',
                description: 'Ce pourquoi la ville est connue',
                items: { type: 'string' }
                },
                weatherPredictions: {
                type: 'array',
                description: 'Prévisions météo pour aujourd’hui et demain',
                minItems: 2,
                maxItems: 2,
                items: {
                    type: 'object',
                    properties: {
                    when: { type: 'string', enum: ['today', 'tomorrow'] },
                    min: { type: 'number' },
                    max: { type: 'number' }
                    },
                    required: ['when', 'min', 'max']
                }
                },
                recipes: {
                type: 'array',
                description: 'Recettes associées à la ville',
                items: {
                    type: 'object',
                    properties: {
                    id: { type: 'integer' },
                    content: { type: 'string' }
                    },
                    required: ['id', 'content']
                }
                }
            },
            required: ['coordinates', 'population', 'knownFor', 'weatherPredictions', 'recipes']
            }
        }
    }

}



fastify.get("/cities/:cityId/infos", {cityID_schema}, getCityInfo)

fastify.post("/cities/:cityId/recipes", {
    schema: {
      body: body_schema
    }
  }, postCityRecipe)

fastify.delete("/cities/:cityId/recipes/:recipeId", deleteCityRecipe)