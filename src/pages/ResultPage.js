// src/pages/ResultPage.js
import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLanguage } from "../i18n";

export default function ResultPage() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();

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
      <h2>{t("result_title")}</h2>
      <div className="card center">
        <h3>{category} — Set {setNo}</h3>
        <p style={{ fontSize: 22 }}>
          {t("history_score")}: <strong>{score}</strong> / {total}
        </p>
        <div style={{ marginTop: 8 }}>
          <button onClick={() => navigate("/home")}>{t("result_back_home")}</button>
          <button style={{ marginLeft: 8 }} onClick={handleViewAttemptedExam}>
            {t("result_view_attempt")}
          </button>
        </div>
      </div>
    </div>
  );
}
