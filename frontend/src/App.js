import React, { useState, useEffect } from "react";
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
  const [selectedIngredients, setSelectedIngredients] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showTrash, setShowTrash] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newRecipe, setNewRecipe] = useState({
    title: "",
    description: "",
    thumbnail: "",
    source_url: ""
  });

  // Load recipes on initial mount
  useEffect(() => {
    fetchRecipes();
  }, []);

  const toggleIngredient = (ingredient) => {
    setSelectedIngredients((prev) =>
      prev.includes(ingredient)
        ? prev.filter((ing) => ing !== ingredient)
        : [...prev, ingredient]
    );
  };

  const fetchRecipes = async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/recipes`;
      let data;

      if (selectedIngredients.length > 0) {
        // POST request for ingredient-based search
        const res = await fetch(`${API_BASE_URL}/recipes/ingredients`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ingredients: selectedIngredients }),
        });
        
        if (!res.ok) throw new Error("Failed to fetch recipes by ingredients");
        data = await res.json();

        // Apply search term filter if present
        if (searchTerm) {
          data = data.filter((recipe) =>
            recipe.title.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      } else {
        // GET request for all recipes or search by name
        if (searchTerm) {
          url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        const res = await fetch(url);
        
        if (!res.ok) throw new Error("Failed to fetch recipes");
        data = await res.json();
      }

      setRecipes(data);
    } catch (err) {
      console.error("Error fetching recipes:", err);
      alert("Failed to fetch recipes. Please try again.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchTrashedRecipes = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/trashed`);
      
      if (!res.ok) throw new Error("Failed to fetch trashed recipes");
      const data = await res.json();
      setRecipes(data);
    } catch (err) {
      console.error("Error fetching trashed recipes:", err);
      alert("Failed to fetch trashed recipes. Please try again.");
      setRecipes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (showTrash) {
      alert("Search is not available in trash view");
      return;
    }
    fetchRecipes();
  };

  const handleDelete = async (recipeId) => {
    if (!window.confirm("Are you sure you want to move this recipe to trash?")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/${recipeId}`, {
        method: "DELETE"
      });
      
      if (!res.ok) throw new Error("Failed to delete recipe");
      
      alert("Recipe moved to trash!");
      await fetchRecipes();
    } catch (err) {
      console.error("Error deleting recipe:", err);
      alert("Failed to delete recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (recipeId) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/${recipeId}/restore`, {
        method: "PATCH"
      });
      
      if (!res.ok) throw new Error("Failed to restore recipe");
      
      alert("Recipe restored successfully!");
      await fetchTrashedRecipes();
    } catch (err) {
      console.error("Error restoring recipe:", err);
      alert("Failed to restore recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handlePermanentDelete = async (recipeId) => {
    if (!window.confirm("Permanently delete this recipe? This action CANNOT be undone!")) return;
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/${recipeId}/permanent`, {
        method: "DELETE"
      });
      
      if (!res.ok) throw new Error("Failed to permanently delete recipe");
      
      alert("Recipe permanently deleted!");
      await fetchTrashedRecipes();
    } catch (err) {
      console.error("Error permanently deleting recipe:", err);
      alert("Failed to permanently delete recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipe = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newRecipe)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to add recipe");
      }
      
      alert("Recipe added successfully!");
      setShowAddModal(false);
      setNewRecipe({ title: "", description: "", thumbnail: "", source_url: "" });
      
      if (!showTrash) {
        await fetchRecipes();
      }
    } catch (err) {
      console.error("Error adding recipe:", err);
      alert(err.message || "Failed to add recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateRecipe = async (e) => {
    e.preventDefault();
    
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/recipes/${editingRecipe._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editingRecipe.title,
          description: editingRecipe.description,
          thumbnail: editingRecipe.thumbnail,
          source_url: editingRecipe.source_url
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Failed to update recipe");
      }
      
      alert("Recipe updated successfully!");
      setShowEditModal(false);
      setEditingRecipe(null);
      
      if (showTrash) {
        await fetchTrashedRecipes();
      } else {
        await fetchRecipes();
      }
    } catch (err) {
      console.error("Error updating recipe:", err);
      alert(err.message || "Failed to update recipe. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (recipe) => {
    setEditingRecipe({ ...recipe });
    setShowEditModal(true);
  };

  const toggleTrashView = () => {
    setShowTrash(!showTrash);
    if (!showTrash) {
      fetchTrashedRecipes();
    } else {
      setSearchTerm("");
      setSelectedIngredients([]);
      fetchRecipes();
    }
  };

  const closeAddModal = () => {
    setShowAddModal(false);
    setNewRecipe({ title: "", description: "", thumbnail: "", source_url: "" });
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingRecipe(null);
  };

  return (
    <div className="container">
      {/* Loading Overlay */}
      {loading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
        </div>
      )}

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
              disabled={showTrash}
            >
              {ingredient}
            </button>
          ))}
        </div>
        <button 
          className="generate-btn" 
          onClick={fetchRecipes}
          disabled={showTrash || loading}
        >
          Generate Recipes
        </button>
        {showTrash && (
          <p className="trash-notice">
            Ingredient filtering is disabled in trash view
          </p>
        )}
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

        {/* Action Buttons */}
        <div className="action-buttons">
          <button 
            className="add-recipe-btn" 
            onClick={() => setShowAddModal(true)}
            disabled={loading}
          >
            + Add Recipe
          </button>
          <button 
            className="trash-btn" 
            onClick={toggleTrashView}
            disabled={loading}
          >
            {showTrash ? "← Back to Recipes" : "🗑️ View Trash"}
          </button>
        </div>

        {/* Search Bar */}
        {!showTrash && (
          <form onSubmit={handleSearch} className="search-form">
            <input
              type="text"
              placeholder="Search recipes by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              disabled={loading}
            />
            <button type="submit" className="search-btn" disabled={loading}>
              Search
            </button>
          </form>
        )}

        {/* Recipe List */}
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
                  
                  {/* Action Buttons */}
                  <div className="recipe-actions">
                    {showTrash ? (
                      <>
                        <button 
                          className="restore-btn"
                          onClick={() => handleRestore(recipe._id)}
                          disabled={loading}
                        >
                          ↻ Restore
                        </button>
                        <button 
                          className="permanent-delete-btn"
                          onClick={() => handlePermanentDelete(recipe._id)}
                          disabled={loading}
                        >
                          Delete Forever
                        </button>
                      </>
                    ) : (
                      <>
                        <button 
                          className="edit-btn"
                          onClick={() => openEditModal(recipe)}
                          disabled={loading}
                        >
                          ✎ Edit
                        </button>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDelete(recipe._id)}
                          disabled={loading}
                        >
                          🗑️ Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty">
            {loading 
              ? "Loading..." 
              : showTrash 
              ? "No recipes in trash." 
              : "No recipes found. Select ingredients or search by name."}
          </p>
        )}
      </div>

      {/* Add Recipe Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={closeAddModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Recipe</h2>
            <form onSubmit={handleAddRecipe}>
              <input
                type="text"
                placeholder="Recipe Title"
                value={newRecipe.title}
                onChange={(e) => setNewRecipe({...newRecipe, title: e.target.value})}
                required
                disabled={loading}
              />
              <textarea
                placeholder="Description"
                value={newRecipe.description}
                onChange={(e) => setNewRecipe({...newRecipe, description: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="url"
                placeholder="Thumbnail URL"
                value={newRecipe.thumbnail}
                onChange={(e) => setNewRecipe({...newRecipe, thumbnail: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="url"
                placeholder="Source URL"
                value={newRecipe.source_url}
                onChange={(e) => setNewRecipe({...newRecipe, source_url: e.target.value})}
                required
                disabled={loading}
              />
              <div className="modal-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Adding..." : "Add Recipe"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeAddModal} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Recipe Modal */}
      {showEditModal && editingRecipe && (
        <div className="modal-overlay" onClick={closeEditModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h2>Edit Recipe</h2>
            <form onSubmit={handleUpdateRecipe}>
              <input
                type="text"
                placeholder="Recipe Title"
                value={editingRecipe.title}
                onChange={(e) => setEditingRecipe({...editingRecipe, title: e.target.value})}
                required
                disabled={loading}
              />
              <textarea
                placeholder="Description"
                value={editingRecipe.description}
                onChange={(e) => setEditingRecipe({...editingRecipe, description: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="url"
                placeholder="Thumbnail URL"
                value={editingRecipe.thumbnail}
                onChange={(e) => setEditingRecipe({...editingRecipe, thumbnail: e.target.value})}
                required
                disabled={loading}
              />
              <input
                type="url"
                placeholder="Source URL"
                value={editingRecipe.source_url}
                onChange={(e) => setEditingRecipe({...editingRecipe, source_url: e.target.value})}
                required
                disabled={loading}
              />
              <div className="modal-actions">
                <button type="submit" className="submit-btn" disabled={loading}>
                  {loading ? "Updating..." : "Update Recipe"}
                </button>
                <button type="button" className="cancel-btn" onClick={closeEditModal} disabled={loading}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;