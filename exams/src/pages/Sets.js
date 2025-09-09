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
        time: 10, // Customize or fetch from Firebase if stored
      }));

      setSets(setsList);
    });
  }, [categoryName]);

  const handleSetClick = (set) => {
    // Navigate to exam page and pass category and setNo as state
    navigate("/exam", {
      state: { categoryName, setNo: set.setNo, questions: set.questions },
    });
  };

  return (
    <div>
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
              <p>{set.time} mins</p>
              <p>{set.questions.length} Questions</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
