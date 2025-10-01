
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
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

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

app.get('/recipes/search')

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
