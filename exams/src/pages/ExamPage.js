// src/pages/ExamPage.js
import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, ref, onValue, push } from "../firebase";
import { auth } from "../firebase";

export default function ExamPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const category = state?.category;
  const setNo = state?.setNo;

  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category || !setNo) {
      alert("Invalid exam parameters");
      navigate("/home");
      return;
    }
    // read questions under SETS/{category}/questions where setNo == setNo
    const qRef = ref(db, `SETS/${category}/questions`);
    onValue(qRef, (snap) => {
      const list = [];
      snap.forEach((s) => {
        const q = s.val();
        if (Number(q.setNo) === Number(setNo)) {
          list.push({ id: s.key, ...q });
        }
      });
      setQuestions(list);
      setLoading(false);
    });
  }, [category, setNo, navigate]);

  function selectAnswer(qId, value) {
    setAnswers((p) => ({ ...p, [qId]: value }));
  }

  function handleSubmit() {
    // compute score
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] && answers[q.id] === q.correctAns) score++;
    });

    // assemble attempt object (include questions array with userAnswer + correctAnswer)
    const attempt = {
      category,
      setNo,
      score,
      total: questions.length,
      date: new Date().toISOString(),
      questions: questions.map((q) => ({
        question: q.question,
        optionA: q.optionA || "",
        optionB: q.optionB || "",
        optionC: q.optionC || "",
        optionD: q.optionD || "",
        correctAnswer: q.correctAns || "",
        userAnswer: answers[q.id] || "",
      })),
    };

    // save under users/{uid}/attempts
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Login required to save attempt");
      navigate("/login");
      return;
    }
    const attemptsRef = ref(db, `users/${uid}/attempts`);
    push(attemptsRef, attempt)
      .then(() => {
        navigate("/result", { state: { score, total: questions.length, category, setNo } });
      })
      .catch((err) => {
        console.error(err);
        alert("Failed to save attempt");
        navigate("/result", { state: { score, total: questions.length, category, setNo } });
      });
  }

  if (loading) return <div className="container"><p>Loading questions…</p></div>;
  if (!questions.length) return <div className="container"><p>No questions found for this set.</p></div>;

  return (
    <div>
      <h3>{category} — Set {setNo}</h3>
      {questions.map((q, idx) => (
        <div className="card" key={q.id}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <strong>{idx + 1}. </strong>
            <div style={{ flex: 1 }}>{q.question}</div>
          </div>
          <div style={{ marginTop: 8 }}>
            {["optionA","optionB","optionC","optionD"].map((opt) =>
              q[opt] ? (
                <label key={opt} style={{ display: "block", margin: "6px 0" }}>
                  <input
                    type="radio"
                    name={q.id}
                    value={q[opt]}
                    checked={answers[q.id] === q[opt]}
                    onChange={() => selectAnswer(q.id, q[opt])}
                  />{" "}
                  {q[opt]}
                </label>
              ) : null
            )}
          </div>
        </div>
      ))}

      <div style={{ marginTop: 12 }}>
        <button onClick={handleSubmit}>Submit Exam</button>
      </div>
    </div>
  );
}
