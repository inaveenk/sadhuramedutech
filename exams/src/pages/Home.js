// src/pages/Home.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, onValue } from "../firebase";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const categoriesRef = ref(db, "categories");
    onValue(categoriesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const categoryList = Object.values(data).map((cat) => ({
          name: cat.name, // use name field directly
          sets: cat.sets || 0,
        }));
        setCategories(categoryList);
      }
    });
  }, []);

  const handleClick = (catName) => {
    navigate(`/sets/${encodeURIComponent(catName)}`);
  };

  return (
    <div style={{ textAlign: "center", padding: "40px 20px" }}>
      <h1
        style={{
          fontSize: "2.2rem",
          fontWeight: "700",
          marginBottom: "30px",
          color: "#333",
        }}
      >
        Choose Your Category
      </h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        {categories.map((cat) => (
          <div
            key={cat.name}
            onClick={() => handleClick(cat.name)}
            style={{
              background: "white",
              borderRadius: "16px",
              padding: "30px 20px",
              textDecoration: "none",
              color: "#222",
              boxShadow: "0 6px 14px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-4px)";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(0,0,0,0.12)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 6px 14px rgba(0,0,0,0.08)";
            }}
          >
            <div style={{ fontSize: "40px", marginBottom: "12px" }}>📘</div>
            <h2 style={{ fontSize: "1.4rem", marginBottom: "8px", color: "#14a3e4" }}>
              {cat.name}
            </h2>
            <p style={{ fontSize: "0.95rem", color: "#666" }}>
              Explore {cat.sets} mock tests for {cat.name}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
