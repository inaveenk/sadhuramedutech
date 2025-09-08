// src/pages/Home.js
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, onValue, auth } from "../firebase";

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [greeting, setGreeting] = useState("User");
  const nav = useNavigate();

  useEffect(() => {
    // fetch categories from /categories
    const catRef = ref(db, "categories");
    onValue(catRef, (snap) => {
      const arr = [];
      if (snap.exists()) {
        snap.forEach((s) => arr.push(s.val()));
      } else {
        // fallback: default categories if none present
        arr.push({ id: "Math", title: "Math", sets: 3 });
        arr.push({ id: "Physics", title: "Physics", sets: 2 });
      }
      setCategories(arr);
    });

    // greeting from user
    const u = auth.currentUser;
    if (u && u.email) {
      setGreeting(u.email.split("@")[0]);
    }
  }, []);

  return (
    <div>
      <h2>Welcome, {greeting}</h2>

      <div style={{ marginTop: 12 }} className="tile-grid">
        {categories.map((c) => (
          <div key={c.id} className="tile">
            <h4>{c.title}</h4>
            <p>Sets: {c.sets ?? "1"}</p>
            <button onClick={() => nav(`/sets/${encodeURIComponent(c.id)}`, { state: { title: c.title } })}>Open Sets</button>
          </div>
        ))}
      </div>
    </div>
  );
}
