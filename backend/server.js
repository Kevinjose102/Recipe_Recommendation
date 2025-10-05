
const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb://localhost:27017"; // local MongoDB URI
const client = new MongoClient(uri);

let recipesCollection;

async function connectDB(){
    try{
        await client.connect();
        const db = client.db("recipesDB");
        recipesCollection = db.collection("recipes");
        console.log("Connected to MongoDB");
    }
    catch(err){
        console.error("DB connection error: ",err);
    }
}

connectDB();



app.get("/recipes", async (req,res)=>{
    /**
 * @api {get} /recipes Get Recipes
 * @apiDescription Retrieves a list of recipes, supporting keyword search by title and pagination.
 * @apiQuery {String} [search] Filters recipes by title (case-insensitive regex).
 * @apiQuery {Number} [page=1] The current page number.
 * @apiQuery {Number} [limit=10] The number of recipes per page.
 * @apiSuccess {Object[]} recipes Array of recipe objects.
 **/

    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    skip = (page - 1)* limit;
    try{
        const recipes = await recipesCollection
            .find({title: {$regex: search, $options:"i"}})
            .skip(skip)
            .limit(limit)
            .toArray();
        res.json(recipes);
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
});

app.post('/recipes/ingredients', async (req,res)=>{
    /**
 * @api {post} /recipes/ingredients Find Recipes by Ingredients
 * @apiDescription Finds and sorts recipes based on the ingredients provided in the request body.
 * It prioritizes recipes with the most matching ingredients.
 * @apiBody {String[]} ingredients An array of ingredients the user has available.
 * @apiSuccess {Object[]} recipes Array of recipe objects, sorted by 'matchedIngredients' (descending).
 **/
    try{
        const userIngredients = req.body.ingredients;

        if(! Array.isArray(userIngredients)){
            return res.status(400).json({error : "Ingredients must be an array"});
        }

        const recipes = await recipesCollection.aggregate([
            {
                $addFields: {
                matchedIngredients: {
                    $size: {
                        $setIntersection: ["$ingredients", userIngredients]
                    }
                }
                }
            },
        { $match: { matchedIngredients: { $gt: 0 } } },
        { $sort: { matchedIngredients: -1 } } // recipes with more matches first
        ]).toArray();

        res.json(recipes);
    
    }
    catch( err ){
        console.error("Error occured: ",err);
        res.status(500).json({error : "Server error"});
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));