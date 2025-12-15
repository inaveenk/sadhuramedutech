// src/pages/AttemptHistory.js
import React, { useEffect, useState } from "react";
import { auth, db, ref, onValue } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AttemptHistory() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const examsRef = ref(db, `users/${userId}/attemptedExams`);
    return onValue(examsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const examList = Object.entries(data).sort((a, b) => b[1].timestamp - a[1].timestamp);
      setExams(examList); // [ [examId, examData], ... ]
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="center">Loading attempted exams...</div>;
  if (!exams.length) return <div className="center">No attempted exams found.</div>;

  const formatDate = (ts) => new Date(ts).toLocaleString();

  return (
    <div className="attempt-history">
      <h2>Attempted Exams</h2>
      {exams.map(([examId, exam], idx) => (
        <div
          key={examId}
          className="exam-card"
          style={{
            border: "1px solid #ddd",
            borderRadius: 8,
            padding: 12,
            marginBottom: 12,
            cursor: "pointer",
          }}
          onClick={() => navigate("/detail", { state: { examId, exam } })}
        >
          <h3>{exam.category} — Set {exam.setNo}</h3>
          <p>Score: {exam.score} / {exam.totalQuestions}</p>
          <p>Attempted On: {formatDate(exam.timestamp)}</p>
        </div>
      ))}
    </div>
  );
}
