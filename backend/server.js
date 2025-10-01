
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
    try{
        const recipes = await recipesCollection.find().toArray();
        res.json(recipes);
    }
    catch(err){
        res.status(500).json({error: err.message});
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
