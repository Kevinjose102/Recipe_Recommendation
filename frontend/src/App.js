import React, { useState, useEffect } from "react";
import "./App.css";

const allIngredients = [
  "ground beef",
  "breadcrumbs",
  "egg",
  "lettuce",
  "tomato",
  "thai chili sauce",
  "burger bun",
  "sirloin steak",
  "black peppercorns",
  "cream",
  "garlic",
  "butter",
  "olive oil",
  "bell pepper",
  "cheese",
  "tortilla",
  "sour cream",
  "enchilada sauce",
  "chicken breast",
  "cheddar cheese",
  "garlic powder",
  "beef stock",
  "thyme",
  "ground pork",
  "hoisin sauce",
  "cucumber",
  "couscous",
  "hummus",
  "olive",
  "feta cheese",
  "lemon juice",
  "spaghetti",
  "chili flakes",
  "parsley",
  "parmesan cheese",
  "pizza dough",
  "mozzarella cheese",
  "tomato sauce",
  "basil",
  "scallops",
  "ravioli",
  "onion",
  "arborio rice",
  "bacon",
  "mushrooms",
  "white cheddar",
  "crispy onions",
  "carrots",
  "soy sauce",
  "scallions",
  "lentils",
  "cumin",
  "coriander",
  "chili powder",
  "chicken tenders",
  "ginger",
  "brown sugar",
  "sesame seeds",
  "chicken thighs",
  "paprika",
  "zucchini",
  "rice",
  "gochujang",
  "cauliflower",
  "chickpeas",
  "curry powder",
  "cilantro",
  "flour",
  "coconut milk",
  "curry paste",
  "chili",
  "lime",
  "tofu",
  "spinach"
];


function App() {
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((ing) => ing !== ingredient)
        : [...prev, ingredient]
    );
  };

  const fetchRecipes = async () => {
    try {
      let url = "http://localhost:5000/recipes";

      if (selectedIngredients.length > 0) {
        const res = await fetch("http://localhost:5000/recipes/ingredients", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: selectedIngredients }),
        });
        const data = await res.json();

        const filtered = searchTerm
          ? data.filter((recipe) =>
              recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
            )
          : data;

        setRecipes(filtered);
      } else {
        if (searchTerm) {
          url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setRecipes(data);
      }
    } catch (err) {
      console.error("Error fetching recipes:", err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchRecipes();
  };

  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Pantry</h2>
        <div className="ingredients">
          {allIngredients.map((ingredient) => (
            <button
              key={ingredient}
              className={`ingredient-btn ${
                selectedIngredients.includes(ingredient) ? "selected" : ""
              }`}
              onClick={() => toggleIngredient(ingredient)}
            >
              {ingredient}
            </button>
          ))}
        </div>
        <button className="generate-btn" onClick={fetchRecipes}>
          Generate Recipes
        </button>
      </div>

      {/* Main Content */}
      <div className="content">
        <div className="content-header">
          <img
            src={`${process.env.PUBLIC_URL}/recipe.png`}
            alt="Recipe Recommender Logo"
            className="logo"
          />
          <h2>Recipe Recommender</h2>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search recipes by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="search-btn">Search</button>
        </form>

        {recipes.length > 0 ? (
          <div className="recipe-list">
            {recipes.map((recipe) => (
              <div key={recipe._id} className="recipe-card">
                <img src={recipe.thumbnail} alt={recipe.title} className="recipe-image" />
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description}</p>
                  <a
                    href={recipe.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="view-btn"
                  >
                    View Recipe
                  </a>
                  {recipe.matchedIngredients !== undefined && (
                    <p className="matched">Matched Ingredients: {recipe.matchedIngredients}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No recipes found. Select ingredients or search by name.</p>
        )}
      </div>
    </div>
  );
}

export default App;