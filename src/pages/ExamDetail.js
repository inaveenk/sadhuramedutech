// src/pages/ExamDetail.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ExamDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const exam = state?.exam;

  if (!exam) return <div className="center">No exam data found.</div>;

  return (
    <div className="exam-detail">
      <h2>{exam.category} — Set {exam.setNo}</h2>
      <p>Score: {exam.score} / {exam.totalQuestions}</p>
      <p>Attempted On: {new Date(exam.timestamp).toLocaleString()}</p>

      <div style={{ marginTop: 16 }}>
        {exam.answers && Object.values(exam.answers).map((ans, idx) => (
          <div key={idx} style={{ padding: 12, marginBottom: 12, border: "1px solid #eee", borderRadius: 6 }}>
            <p><strong>Q{idx+1}:</strong> {ans.question}</p>
            <p>Your Answer: {ans.yourAnswer} {ans.yourAnswer === ans.correctAnswer ? "✅" : "❌"}</p>
            <p>Correct Answer: {ans.correctAnswer}</p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/history")} style={{ marginTop: 16 }}>
        Back to Attempt History
      </button>
    </div>
  );
}
