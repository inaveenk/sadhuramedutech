// src/pages/Categories.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, onValue } from "../firebase";

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const catRef = ref(db, "categories");
    return onValue(catRef, (snap) => {
      const data = snap.val() || {};
      const list = Object.values(data).map((cat) => ({
        name: cat.name, // use the name field directly
        sets: cat.sets || 0,
      }));
      setCategories(list);
    });
  }, []);

  const handleClick = (catName) => {
    // Navigate using category name (encoded for URL)
    navigate(`/sets/${encodeURIComponent(catName)}`);
  };

  return (
    <div>
      <h2>Categories</h2>
      <div className="tile-grid">
        {categories.map((cat) => (
          <div
            key={cat.name}
            className="tile"
            onClick={() => handleClick(cat.name)}
            style={{ cursor: "pointer" }}
          >
            <h3>{cat.name}</h3>
            <p>{cat.sets} Sets</p>
          </div>
        ))}
      </div>
    </div>
  );
}
