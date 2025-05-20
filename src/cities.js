let nbRecipes = 0
let recipes = {}
let url = 'https://api-ugi2pflmha-ew.a.run.app'

export async function getCityInfo(req, rep) {
    try {
        let cityId = req.params["cityId"]

        const responseInsight = await fetch(`${url}/cities/${cityId}/insights?apiKey=${process.env.API_KEY}`);

        if (!responseInsight.ok) {
          rep.status(404).send({error:"La ville n'existe pas"});
          return
      }
        
        const insights = await responseInsight.json();

        console.log(insights)

        const responseMeteo = await fetch(`${url}/weather-predictions?apiKey=${process.env.API_KEY}&cityId=${cityId}`);

        if (!responseMeteo.ok) {
            throw new Error(`Pas de météo ?`);
        }
        
        const meteo = await responseMeteo.json();


        rep.send({
            coordinates:[insights.coordinates[0].latitude, insights.coordinates[0].longitude],
            population:insights.population,
            knownFor:insights.knownFor,
            weather:meteo[0].predictions.map((v) => {
              return {
                  max:v.maxTemperature,
                  min:v.maxTemperature,
                  when:v.date,
              }
          }),
            recipes:recipes[cityId] ? recipes[cityId] : []
        })

    } catch (error) {
        console.error(error);
        rep.status(500).send({ error: error.message });
    }

}


export async function postCityRecipe(req, rep) {
    let cityId = req.params["cityId"]
    
    try {
        if (!req.body) {
            throw new Error("Body manquant");
        }

        let { content } = req.body

        if (!content) {
            throw new Error("Pas de contenu");
        }

        const responseCity = await fetch(`${url}/cities?apiKey=${process.env.API_KEY}&search=${cityId}`);

        if (responseCity.status == 404) {
            rep.status(404).send({error:"La ville n'existe pas"});
            return
        } 

        if (!Object.keys(recipes).includes(cityId)) {
            recipes[cityId] = []
        }

        if (content.length < 10 || content.length > 2000) {
            rep.status(400).send({ error:"Longueur du contenu mauvaise"});
            return
        }

        recipes[cityId].push({id: ++nbRecipes, content:content})
        rep.status(201).send({id: nbRecipes, content:content})

    } catch (error) {
        console.error(error);
        rep.status(400).send({ error: error.message });
    }
    
}


export async function deleteCityRecipe(req, rep) {
    try {
        let cityId = req.params["cityId"]
        let recipeId = req.params["recipeId"]

        const responseCity = await fetch(`${url}/cities?apiKey=${process.env.API_KEY}&search=${cityId}`);

        if (responseCity.status == 404) {
            rep.status(404).send({error:"La ville n'existe pas"});
            return
        }

        if (Object.keys(recipes).includes(cityId)) {
            let len = recipes[cityId].length
            recipes[cityId] = recipes[cityId].filter((v) => {return v.id != recipeId})

            if (len == recipes[cityId].length) {
                rep.status(404).send({error:"La recette n'existe pas"});
                return
            }
        } else {
            rep.status(404).send({error:"La recette n'existe pas"});
            return
        }

        rep.status(204).send({})
    } catch (error) {
        console.error(error);
        rep.status(500).send({ error: error.message });
    }

}