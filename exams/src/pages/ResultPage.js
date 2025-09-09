// src/pages/ResultPage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  // examData was passed from ExamPage
  const examData = state?.examData;

  if (!examData) {
    return (
      <div className="center">
        <h2>No exam data found</h2>
        <button onClick={() => navigate("/home")}>Go Home</button>
      </div>
    );
  }

  const { category, setNo, score, totalQuestions } = examData;

  return (
    <div>
      <h2>Result</h2>
      <div className="card center">
        <h3>
          {category} — Set {setNo}
        </h3>
        <p style={{ fontSize: 22 }}>
          Score: <strong>{score}</strong> / {totalQuestions}
        </p>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => navigate("/home")}>Back to Home</button>
          <button
            style={{ marginLeft: 8 }}
            onClick={() => navigate("/history")}
          >
            View Attempted Exams
          </button>
        </div>
      </div>
    </div>
  );
}
