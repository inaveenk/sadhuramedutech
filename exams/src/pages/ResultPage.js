// src/pages/ResultPage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const score = state?.score ?? 0;
  const total = state?.total ?? 0;
  const category = state?.category;
  const setNo = state?.setNo;

  return (
    <div>
      <h2>Result</h2>
      <div className="card center">
        <h3>{category} — Set {setNo}</h3>
        <p style={{ fontSize: 22 }}>Score: <strong>{score}</strong> / {total}</p>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => navigate("/home")}>Back to Home</button>
          <button style={{ marginLeft: 8 }} onClick={() => navigate("/history")}>View Attempted Exams</button>
        </div>
      </div>
    </div>
  );
}
