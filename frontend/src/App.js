import React, { useState, useEffect } from "react";
import { Star } from "lucide-react";
import "./App.css";

const API_BASE_URL = "http://localhost:5000";

const allIngredients = [
  "ground beef", "breadcrumbs", "egg", "lettuce", "tomato", "thai chili sauce",
  "burger bun", "sirloin steak", "black peppercorns", "cream", "garlic", "butter",
  "olive oil", "bell pepper", "cheese", "tortilla", "sour cream", "enchilada sauce",
  "chicken breast", "cheddar cheese", "garlic powder", "beef stock", "thyme",
  "ground pork", "hoisin sauce", "cucumber", "couscous", "hummus", "olive",
  "feta cheese", "lemon juice", "spaghetti", "chili flakes", "parsley",
  "parmesan cheese", "pizza dough", "mozzarella cheese", "tomato sauce", "basil",
  "scallops", "ravioli", "onion", "arborio rice", "bacon", "mushrooms",
  "white cheddar", "crispy onions", "carrots", "soy sauce", "scallions",
  "lentils", "cumin", "coriander", "chili powder", "chicken tenders", "ginger",
  "brown sugar", "sesame seeds", "chicken thighs", "paprika", "zucchini",
  "rice", "gochujang", "cauliflower", "chickpeas", "curry powder", "cilantro",
  "flour", "coconut milk", "curry paste", "chili", "lime", "tofu", "spinach"
];

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [recipeRatings, setRecipeRatings] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);

  // Add/Edit Recipe Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    title: "",
    description: "",
    thumbnail: "",
    source_url: "",
    ingredients: []
  });

  /** ---------------- LOGIN ---------------- **/
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/users`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const users = await res.json();
      const foundUser = users.find(u => u.email === loginData.email);
      if (!foundUser) {
        alert("User not found");
        return;
      }
      if (foundUser.password !== loginData.password) {
        alert("Incorrect password");
        return;
      }
      setCurrentUser(foundUser);
    } catch (err) {
      console.error(err);
      alert("Login failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  /** ---------------- FETCH RECIPES ---------------- **/
  useEffect(() => {
    if (currentUser) fetchRecipes();
  }, [currentUser, selectedIngredients, searchTerm]);

  const fetchRecipes = async () => {
  if (!currentUser) return;

  setLoading(true);
  try {
    let url = `${API_BASE_URL}/recipes`;
    let data;

    if (selectedIngredients.length > 0) {
      const res = await fetch(`${API_BASE_URL}/recipes/ingredients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: selectedIngredients })
      });
      if (!res.ok) throw new Error("Failed to fetch recipes by ingredients");
      data = await res.json();
    } else if (searchTerm.trim()) {
      url += `?search=${encodeURIComponent(searchTerm.trim())}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      data = await res.json();
    } else {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch recipes");
      data = await res.json();
    }

    setRecipes(data);
    await fetchAllRatings(data);
  } catch (err) {
    console.error(err);
    setRecipes([]);
  } finally {
    setLoading(false);
  }
};


  /** ---------------- FETCH RATINGS ---------------- **/
  const fetchAllRatings = async (recipeList) => {
    const ratingsData = {};
    for (const recipe of recipeList) {
      try {
        const res = await fetch(`${API_BASE_URL}/recipes/${recipe._id}/ratings`);
        if (res.ok) {
          const ratings = await res.json();
          const avgRating = ratings.length
            ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length
            : 0;
          ratingsData[recipe._id] = { average: avgRating, count: ratings.length };
        }
      } catch (err) {
        console.error(err);
      }
    }
    setRecipeRatings(ratingsData);
  };

  /** ---------------- RENDER STARS ---------------- **/
  const renderStars = (avgRating, count) => (
    <div className="flex items-center gap-1 mt-1">
      {[1,2,3,4,5].map(star => (
        <Star
          key={star}
          size={16}
          fill={star <= Math.round(avgRating) ? "#fbbf24" : "none"}
          color="#fbbf24"
        />
      ))}
      <span className="text-sm text-gray-600">{avgRating > 0 ? `(${count})` : 'No ratings'}</span>
    </div>
  );

  /** ---------------- HANDLE INGREDIENT SELECTION ---------------- **/
  const toggleIngredient = (ingredient) => {
    setSelectedIngredients(prev =>
      prev.includes(ingredient)
        ? prev.filter(i => i !== ingredient)
        : [...prev, ingredient]
    );
  };

  /** ---------------- ADD RECIPE ---------------- **/
  const handleAddRecipe = async () => {
    if (!newRecipe.title || !newRecipe.description) {
      alert("Title and description are required");
      return;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe)
      });
      if (!res.ok) throw new Error("Failed to add recipe");
      const data = await res.json();
      alert(data.message);
      setShowAddModal(false);
      setNewRecipe({
        title: "",
        description: "",
        thumbnail: "",
        source_url: "",
        ingredients: []
      });
      fetchRecipes();
    } catch (err) {
      console.error(err);
      alert("Failed to add recipe");
    }
  };

  /** ---------------- DELETE RECIPE ---------------- **/
  const handleDeleteRecipe = async (recipeId) => {
    if (!window.confirm("Are you sure you want to delete this recipe?")) return;
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/delete/${recipeId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete recipe");
      const data = await res.json();
      alert(data.message);
      fetchRecipes();
    } catch (err) {
      console.error(err);
      alert("Failed to delete recipe");
    }
  };

  /** ---------------- LOGIN PAGE ---------------- **/
  if (!currentUser) {
    return (
      <div className="login-page">
        <form onSubmit={handleLogin}>
          <h2>Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={loginData.email}
            onChange={(e) => setLoginData({...loginData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) => setLoginData({...loginData, password: e.target.value})}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    );
  }

  /** ---------------- MAIN RECIPE PAGE ---------------- **/
  return (
    <div className="container">
      {/* Sidebar */}
      <div className="sidebar">
        <h2>Pantry</h2>
        <div className="ingredients">
          {allIngredients.map(ing => (
            <button
              key={ing}
              className={`ingredient-btn ${selectedIngredients.includes(ing) ? 'selected' : ''}`}
              onClick={() => toggleIngredient(ing)}
            >
              {ing}
            </button>
          ))}
        </div>
        <button onClick={fetchRecipes} disabled={loading}>
          Generate Recipes
        </button>
        <button onClick={() => setShowAddModal(true)}>Add Recipe</button>
      </div>

      {/* Content */}
      <div className="content">
        <h2>Recipe Recommender</h2>
        <form onSubmit={(e) => { e.preventDefault(); fetchRecipes(); }}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            disabled={loading}
          />
          <button type="submit" disabled={loading}>Search</button>
        </form>

        <div className="recipe-list">
          {recipes.map(recipe => (
            <div key={recipe._id} className="recipe-card">
              <img src={recipe.thumbnail} alt={recipe.title} />
              <h3>{recipe.title}</h3>
              <p>{recipe.description}</p>
              <a href={recipe.source_url} target="_blank" rel="noreferrer">View Recipe</a>

              {/* DELETE */}
              <button className="delete-btn" onClick={() => handleDeleteRecipe(recipe._id)}>
                Delete
              </button>
              
              {/* RATING */}
              {recipeRatings[recipe._id] && renderStars(recipeRatings[recipe._id].average, recipeRatings[recipe._id].count)}

              
            </div>
          ))}
          {recipes.length === 0 && <p>{loading ? "Loading..." : "No recipes found."}</p>}
        </div>
      </div>

      {/* ADD RECIPE MODAL */}
      {showAddModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Add Recipe</h3>
            <input
              type="text"
              placeholder="Title"
              value={newRecipe.title}
              onChange={e => setNewRecipe({...newRecipe, title: e.target.value})}
            />
            <input
              type="text"
              placeholder="Description"
              value={newRecipe.description}
              onChange={e => setNewRecipe({...newRecipe, description: e.target.value})}
            />
            <input
              type="text"
              placeholder="Thumbnail URL"
              value={newRecipe.thumbnail}
              onChange={e => setNewRecipe({...newRecipe, thumbnail: e.target.value})}
            />
            <input
              type="text"
              placeholder="Source URL"
              value={newRecipe.source_url}
              onChange={e => setNewRecipe({...newRecipe, source_url: e.target.value})}
            />
            <input
              type="text"
              placeholder="Ingredients (comma separated)"
              value={newRecipe.ingredients.join(", ")}
              onChange={e => setNewRecipe({...newRecipe, ingredients: e.target.value.split(",").map(i => i.trim())})}
            />
            <div className="modal-buttons">
              <button onClick={handleAddRecipe}>Add</button>
              <button onClick={() => setShowAddModal(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
