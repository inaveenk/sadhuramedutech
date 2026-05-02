// src/pages/ResultPage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();

  const score = state?.score ?? 0;
  const total = state?.totalQuestions ?? 0; // updated to match examData
  const category = state?.category;
  const setNo = state?.setNo;
  const examId = state?.examId;
  const exam = state
    ? {
        category: state.category,
        setNo: state.setNo,
        totalQuestions: state.totalQuestions,
        score: state.score,
        answers: state.answers,
        flaggedQuestions: state.flaggedQuestions,
        timestamp: state.timestamp,
      }
    : null;

  const handleViewAttemptedExam = () => {
    if (!exam) {
      navigate("/history");
      return;
    }
    navigate("/detail", { state: { examId: examId || "recent", exam } });
  };

  return (
    <div>
      <h2>Result</h2>
      <div className="card center">
        <h3>{category} — Set {setNo}</h3>
        <p style={{ fontSize: 22 }}>
          Score: <strong>{score}</strong> / {total}
        </p>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => navigate("/home")}>Back to Home</button>
          <button style={{ marginLeft: 8 }} onClick={handleViewAttemptedExam}>
            View Attempted Exam
          </button>
        </div>
      </div>
    </div>
  );
}
