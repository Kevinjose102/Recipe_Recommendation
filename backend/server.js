const express = require("express");
const { MongoClient, ObjectId } = require("mongodb");
const cors = require("cors");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const uri = "mongodb://localhost:27017"; // local MongoDB URI
const client = new MongoClient(uri);

let recipesCollection,
  usersCollection,
  categoriesCollection,
  ratingsCollection,
  favoritesCollection;

async function connectDB() {
  try {
    await client.connect();
    const db = client.db("recipesDB");

    recipesCollection = db.collection("recipes");
    usersCollection = db.collection("users");
    categoriesCollection = db.collection("categories");
    ratingsCollection = db.collection("ratings");
    favoritesCollection = db.collection("favorites");

    console.log("✅ Connected to MongoDB with multiple collections");
  } catch (err) {
    console.error("DB connection error:", err);
  }
}

connectDB();
/* --------------------- RECIPE ROUTES --------------------- */

// Fetch recipes (with optional search)
app.get("/recipes", async (req, res) => {
  const search = req.query.search || "";
  try {
    const recipes = await recipesCollection
      .find({
        title: { $regex: search, $options: "i" },
        deleted: { $ne: true },
      })
      .toArray();
    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search recipes by ingredients
app.post("/recipes/ingredients", async (req, res) => {
  try {
    const userIngredients = req.body.ingredients;
    if (!Array.isArray(userIngredients))
      return res.status(400).json({ error: "Ingredients must be an array" });

    const recipes = await recipesCollection
      .aggregate([
        { $match: { deleted: { $ne: true } } },
        {
          $addFields: {
            matchedIngredients: {
              $size: { $setIntersection: ["$ingredients", userIngredients] },
            },
          },
        },
        { $match: { matchedIngredients: { $gt: 0 } } },
        { $sort: { matchedIngredients: -1 } },
      ])
      .toArray();

    res.json(recipes);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// ---------------- ADD RECIPE ----------------
app.post("/recipes/add", async (req, res) => {
  try {
    const newRecipe = req.body;
    if (!newRecipe.title || !Array.isArray(newRecipe.ingredients)) {
      return res
        .status(400)
        .json({ error: "Missing fields: title or ingredients!" });
    }

    newRecipe.deleted = false;
    const result = await recipesCollection.insertOne(newRecipe);
    res
      .status(201)
      .json({ message: "Recipe added successfully!", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------------- DELETE RECIPE ----------------
app.delete("/recipes/delete/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await recipesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { deleted: true } }
    );
    res.json({ message: "Recipe deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Optional: Restore recipe (trashed)
app.patch("/recipes/:id/restore", async (req, res) => {
  try {
    const id = req.params.id;
    await recipesCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { deleted: false } }
    );
    res.json({ message: "Recipe restored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Permanently delete
app.delete("/recipes/:id/permanent", async (req, res) => {
  try {
    const id = req.params.id;
    await recipesCollection.deleteOne({ _id: new ObjectId(id) });
    res.json({ message: "Recipe permanently deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


/* ------------------------------------------------------------------
   USER ROUTES
------------------------------------------------------------------ */

app.post("/users", async (req, res) => {
  try {
    const newUser = req.body;
    const result = await usersCollection.insertOne(newUser);
    res.status(201).json({ message: "User created", id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users", async (req, res) => {
  try {
    const users = await usersCollection.find({}).toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   RATINGS ROUTES
------------------------------------------------------------------ */

// add rating for a recipe
app.post("/recipes/:id/rate", async (req, res) => {
  try {
    const recipeId = req.params.id;
    const { user_id, rating, comment } = req.body;

    await ratingsCollection.insertOne({
      user_id: new ObjectId(user_id),
      recipe_id: new ObjectId(recipeId),
      rating,
      comment,
      created_at: new Date(),
    });

    res.json({ message: "Rating added" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get ratings for a specific recipe
app.get("/recipes/:id/ratings", async (req, res) => {
  try {
    const recipeId = new ObjectId(req.params.id);
    const ratings = await ratingsCollection
      .aggregate([
        { $match: { recipe_id: recipeId } },
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_details",
          },
        },
      ])
      .toArray();
    res.json(ratings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// **NEW: Get all ratings**
app.get("/ratings", async (req, res) => {
  try {
    const allRatings = await ratingsCollection
      .aggregate([
        {
          $lookup: {
            from: "users",
            localField: "user_id",
            foreignField: "_id",
            as: "user_details",
          },
        },
        {
          $lookup: {
            from: "recipes",
            localField: "recipe_id",
            foreignField: "_id",
            as: "recipe_details",
          },
        },
      ])
      .toArray();
    res.json(allRatings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   FAVORITES ROUTES
------------------------------------------------------------------ */

app.post("/users/:userId/favorites", async (req, res) => {
  try {
    const userId = req.params.userId;
    const { recipe_id } = req.body;

    await favoritesCollection.insertOne({
      user_id: new ObjectId(userId),
      recipe_id: new ObjectId(recipe_id),
    });

    res.json({ message: "Recipe added to favorites" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/users/:userId/favorites", async (req, res) => {
  try {
    const userId = new ObjectId(req.params.userId);
    const favorites = await favoritesCollection
      .aggregate([
        { $match: { user_id: userId } },
        {
          $lookup: {
            from: "recipes",
            localField: "recipe_id",
            foreignField: "_id",
            as: "recipe_details",
          },
        },
      ])
      .toArray();

    res.json(favorites);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ------------------------------------------------------------------
   SERVER START
------------------------------------------------------------------ */

app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
