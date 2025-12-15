// src/pages/Sets.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { db, ref, onValue } from "../firebase";

export default function Sets() {
  const { categoryName } = useParams();
  const [sets, setSets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!categoryName) return;

    const questionsRef = ref(db, `SETS/${categoryName}/questions`);
    return onValue(questionsRef, (snapshot) => {
      const data = snapshot.val() || {};

      // Group questions by setNo
      const grouped = {};
      Object.values(data).forEach((q) => {
        const setNumber = q.setNo || 1;
        if (!grouped[setNumber]) grouped[setNumber] = [];
        grouped[setNumber].push(q);
      });

      // Convert grouped object into array of sets
      const setsList = Object.keys(grouped).map((setNo) => ({
        setNo,
        questions: grouped[setNo],
        time: grouped[setNo].length, // 1 min per question
      }));

      setSets(setsList);
    });
  }, [categoryName]);

  const handleSetClick = (set) => {
    navigate("/exam", {
      state: { categoryName, setNo: set.setNo, questions: set.questions },
    });
  };

  return (
    <div className="sets-page-wrapper" style={{ display: "flex", justifyContent: "center", gap: "16px", padding: "16px" }}>
      
      {/* Left Ad */}
      <div className="ad-side" style={{ width: "160px", flexShrink: 0 }}>
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4769435723418888"
          data-ad-slot="2256417961"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ maxWidth: "600px", width: "100%" }}>
        <h2>{categoryName} - Sets</h2>
        {sets.length === 0 ? (
          <p>No sets available in this category.</p>
        ) : (
          <div className="tile-grid">
            {sets.map((set) => (
              <div
                key={set.setNo}
                className="tile"
                style={{ cursor: "pointer" }}
                onClick={() => handleSetClick(set)}
              >
                <h3>Set {set.setNo}</h3>
                <p>Time: {set.time} min{set.time > 1 ? "s" : ""}</p>
                <p>{set.questions.length} Question{set.questions.length > 1 ? "s" : ""}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Right Ad */}
      <div className="ad-side" style={{ width: "160px", flexShrink: 0 }}>
        <ins className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4769435723418888"
          data-ad-slot="2256417961"
          data-ad-format="auto"
          data-full-width-responsive="true"></ins>
      </div>

      {/* Responsive CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .ad-side { display: none; }
          }
        `}
      </style>
    </div>
  );
}