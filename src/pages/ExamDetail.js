// src/pages/ExamDetail.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function ExamDetail() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const exam = state?.exam;

  if (!exam) return <div className="center">{t("detail_no_exam")}</div>;

  return (
    <div className="exam-detail">
      <h2>{exam.category} — Set {exam.setNo}</h2>
      <p>
        {t("history_score")}: {exam.score} / {exam.totalQuestions}
      </p>
      <p>
        {t("history_attempted_on")}: {new Date(exam.timestamp).toLocaleString()}
      </p>

      <div style={{ marginTop: 16 }}>
        {exam.answers && Object.values(exam.answers).map((ans, idx) => (
          <div key={idx} style={{ padding: 12, marginBottom: 12, border: "1px solid #eee", borderRadius: 6 }}>
            <p><strong>Q{idx+1}:</strong> {ans.question}</p>
            <p>
              {t("detail_your_answer")}: {ans.yourAnswer}{" "}
              {ans.yourAnswer === ans.correctAnswer ? "✅" : "❌"}
            </p>
            <p>
              {t("detail_correct_answer")}: {ans.correctAnswer}
            </p>
          </div>
        ))}
      </div>

      <button onClick={() => navigate("/history")} style={{ marginTop: 16 }}>
        {t("detail_back_history")}
      </button>
    </div>
  );
}
