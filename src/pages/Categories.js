// src/pages/Categories.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { db, ref, onValue } from "../firebase";
import AdBanner from "../components/AdBanner";

export default function Categories() {
  const { subjectKey } = useParams();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!subjectKey) return;

    const catRef = ref(db, `categories/${subjectKey}`);

    const unsubscribe = onValue(catRef, (snap) => {
      const data = snap.val() || {};

      const list = Object.entries(data).map(([id, cat]) => ({
        id,
        name: cat.name || id,
        sets: cat.sets || 0,
      }));

      setCategories(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [subjectKey]);

  const handleClick = (cat) => {
    navigate(`/sets/${encodeURIComponent(cat.name)}`, {
      state: {
        subjectKey,
        categoryId: cat.id,
        categoryName: cat.name,
      },
    });
  };

  const formatSubjectTitle = (key) =>
    key ? key.replace(/([A-Z])/g, " $1").trim() : "";

  return (
    <div className="page-wide">
      <h2 style={{ margin: "0 0 12px 0" }}>
        {formatSubjectTitle(subjectKey)}
      </h2>

      {loading ? (
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <p>No categories found</p>
      ) : (
        <div className="tile-grid">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="tile category-tile"
              onClick={() => handleClick(cat)}
            >
              {/* SET COUNT BADGE */}
              <div className="set-badge">
                {cat.sets}
              </div>

              <h3>{cat.name}</h3>
              <p style={{ fontSize: 13, color: "#666" }}>
              </p>
            </div>
          ))}
        </div>
      )}
      {categories.length > 0 && (
  <div style={{ marginTop: 24 }}>
    <AdBanner />
  </div>
)}

    </div>
  );
}