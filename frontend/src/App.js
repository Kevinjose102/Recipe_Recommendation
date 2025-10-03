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
  "egg (for bibimbap)",
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
  const [allRecipes, setAllRecipes] = useState([]);  // from backend
  const [filteredRecipes, setFilteredRecipes] = useState([]);

  // Fetch recipes from backend on load
  useEffect(() => {
    fetch("http://localhost:5000/recipes")
      .then((res) => res.json())
      .then((data) => {
        setAllRecipes(data);
      })
      .catch((err) => console.error("Error fetching recipes:", err));
  }, []);

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((ing) => ing !== ingredient)
        : [...prev, ingredient]
    );
  };

  const generateRecipes = () => {
    const matches = allRecipes.filter((recipe) =>
      selectedIngredients.some((ing) =>
        recipe.ingredients.map(i => i.toLowerCase()).includes(ing.toLowerCase())
      )
    );
    setFilteredRecipes(matches);
  };

  return (
    <div className="container">
      {/* Left Panel */}
      <div className="sidebar">
        <h2>🛒 Pantry</h2>
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
        <button className="generate-btn" onClick={generateRecipes}>
          🍳 Generate Recipes
        </button>
      </div>

      {/* Right Panel */}
      <div className="content">
        <h2>📖 Recipes</h2>
        {filteredRecipes.length > 0 ? (
          <div className="recipe-list">
            {filteredRecipes.map((recipe) => (
              <div key={recipe._id} className="recipe-card">
                <div className="recipe-image">
                  <img src={recipe.thumbnail} alt={recipe.title} className="image" />
                </div>
                <div className="recipe-info">
                  <h3>{recipe.title}</h3>
                  <p>{recipe.description}</p>
                  <a href={recipe.source_url} target="_blank" rel="noopener noreferrer">
                    View Recipe
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">No recipes yet. Select ingredients & click generate.</p>
        )}
      </div>
    </div>
  );
}

export default App;
