// src/pages/ExamDetail.js
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { db, ref, onValue, auth } from "../firebase";

export default function ExamDetail() {
  const { state } = useLocation();
  const category = state?.category;
  const setNo = state?.setNo;

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      return;
    }
    // find matching attempt (we will pick latest attempt for category+setNo)
    const aRef = ref(db, `users/${uid}/attempts`);
    onValue(aRef, (snap) => {
      let chosen = null;
      if (snap.exists()) {
        snap.forEach((s) => {
          const val = s.val();
          if (val.category === category && Number(val.setNo) === Number(setNo)) {
            // choose latest by date
            if (!chosen || new Date(val.date) > new Date(chosen.date)) chosen = val;
          }
        });
      }

      if (chosen) {
        setQuestions(chosen.questions || []);
      } else {
        setQuestions([]);
      }
      setLoading(false);
    });
  }, [category, setNo]);

  if (loading) return <p>Loading attempt...</p>;
  if (!questions.length) return <p>No attempted question data found for this set.</p>;

  return (
    <div>
      <h3>{category} — Set {setNo} (Attempt detail)</h3>
      <div className="tile-grid" style={{ marginTop: 12 }}>
        {questions.map((q, idx) => (
          <div className="tile" key={idx}>
            <div style={{ marginBottom: 8 }}><strong>{idx + 1}. {q.question}</strong></div>

            <div style={{ fontSize: 14 }}>
              <div>• A: {q.optionA}</div>
              <div>• B: {q.optionB}</div>
              <div>• C: {q.optionC}</div>
              <div>• D: {q.optionD}</div>
            </div>

            <div style={{ marginTop: 8 }}>
              <div>Your answer: <strong style={{ color: q.userAnswer === q.correctAnswer ? "green" : "red" }}>{q.userAnswer || "—"}</strong></div>
              <div>Correct answer: <strong style={{ color: "green" }}>{q.correctAnswer}</strong></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
