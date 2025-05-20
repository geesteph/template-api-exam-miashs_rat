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
      title: "API des villes – Examen MIASHS 2025",
      description: "Cette API permet de consulter des informations sur des villes et d’y associer des recettes de cuisine.",
      version: "1.0.0"
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
})

await fastify.register(FastifySwaggerUi, {
  routePrefix: "/",
  uiConfig: {
    docExpansion: "full",
    deepLinking: false,
  },
})

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

    // Soumission automatique pour validation
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

const cityID_schema = {
  schema: {
    summary: "Obtenir les informations d’une ville",
    description: "Retourne les coordonnées, la population, ce pourquoi la ville est connue, les prévisions météo, et les recettes associées.",
    tags: ["Cities"],
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

fastify.get("/cities/:cityId/infos", cityID_schema, getCityInfo)

fastify.post("/cities/:cityId/recipes", {
  schema: {
    summary: "Ajouter une recette à une ville",
    description: "Permet d’associer une recette de cuisine à une ville en fournissant un contenu texte.",
    tags: ["Recipes"],
    body: body_schema,
    response: {
      201: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          content: { type: 'string' }
        },
        required: ['id', 'content']
      }
    }
  }
}, postCityRecipe)

fastify.delete("/cities/:cityId/recipes/:recipeId", {
  schema: {
    summary: "Supprimer une recette d’une ville",
    description: "Supprime une recette associée à une ville selon son ID.",
    tags: ["Recipes"],
    response: {
      204: {
        description: "Aucune réponse – recette supprimée"
      },
      404: {
        description: "Recette ou ville non trouvée",
        type: "object",
        properties: {
          error: { type: "string" }
        }
      }
    }
  }
}, deleteCityRecipe)
