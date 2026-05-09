// src/pages/AttemptHistory.js
import React, { useEffect, useState } from "react";
import { auth, db, ref, onValue } from "../firebase";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function AttemptHistory() {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  if (loading) return <div className="center">{t("history_loading")}</div>;
  if (!exams.length) return <div className="center">{t("history_none")}</div>;

  const formatDate = (ts) => new Date(ts).toLocaleString();

  return (
    <div className="attempt-history">
      <h2>{t("history_title")}</h2>
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
          <p>
            {t("history_score")}: {exam.score} / {exam.totalQuestions}
          </p>
          <p>
            {t("history_attempted_on")}: {formatDate(exam.timestamp)}
          </p>
        </div>
      ))}
    </div>
  );
}
