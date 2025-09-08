// src/pages/Sets.js
import React from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function Sets() {
  const { category } = useParams();
  const nav = useNavigate();

  // For demo: show 1..5 sets. In real app, read 'sets' from DB or pass via state.
  const sets = [1,2,3,4,5];

  return (
    <div>
      <h2>Sets for {category}</h2>
      <div className="tile-grid">
        {sets.map((s) => (
          <div className="tile" key={s}>
            <h3>Set {s}</h3>
            <p>10 Questions</p>
            <button onClick={() => nav("/exam", { state: { category, setNo: s } })}>Start</button>
          </div>
        ))}
      </div>
    </div>
  );
}
