// src/pages/ExamPage.js
import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, ref, onValue, set, get } from "../firebase";
import { auth } from "../firebase";
import {
  isPaidPlan,
  findSubjectKeyForCategory,
  categoryNamesForSubject,
  subjectHasAttempt,
} from "../utils/examAccess";
import "./ExamPage.css";

export default function ExamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryName, setNo } = location.state || {};
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [accessPending, setAccessPending] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const timerRef = useRef(null);
  const submittedRef = useRef(false);
  const answersRef = useRef({});
  const flaggedRef = useRef([]);
  const questionsRef = useRef([]);
  const categoryRef = useRef(null);
  const setNoRef = useRef(null);

  const TIME_PER_QUESTION = 60;

  answersRef.current = userAnswers;
  flaggedRef.current = flaggedQuestions;
  questionsRef.current = questions;
  categoryRef.current = categoryName;
  setNoRef.current = setNo;

  // Warn users about refreshing/leaving during an active exam.
  // Note: browsers show a default message (custom text is ignored).
  useEffect(() => {
    if (loading || accessPending) return;
    if (!questions.length) return;

    const handleBeforeUnload = (e) => {
      if (submittedRef.current) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [loading, accessPending, questions.length]);

  const buildExamData = useCallback(() => {
    const examId = `exam_${Date.now()}`;
    const ua = answersRef.current;
    const fq = flaggedRef.current;
    const qs = questionsRef.current;

    let score = 0;
    qs.forEach((q) => {
      if (ua[q.question] === q.correctAns) score++;
    });

    const answersWithCorrect = qs.map((q) => ({
      question: q.question,
      yourAnswer: ua[q.question] ?? null,
      correctAnswer: q.correctAns,
    }));

    const examData = {
      category: categoryRef.current,
      setNo: setNoRef.current,
      totalQuestions: qs.length,
      score,
      answers: answersWithCorrect,
      flaggedQuestions: fq,
      timestamp: Date.now(),
    };
    return { examId, examData };
  }, []);

  const persistAndNavigateResult = useCallback(
    async ({ examId, examData }) => {
      if (!auth.currentUser) {
        const saveChoice = window.confirm(
          "Login to save your attempted history.\n\nClick OK to Login or Cancel to Skip."
        );

        if (saveChoice) {
          navigate("/login", { state: { examData, examId } });
        } else {
          navigate("/result", { state: { ...examData, examId } });
        }
        return;
      }

      try {
        const userId = auth.currentUser.uid;
        await set(ref(db, `users/${userId}/attemptedExams/${examId}`), examData);
        navigate("/result", { state: { ...examData, examId } });
      } catch (err) {
        console.error("Error storing exam:", err);
      }
    },
    [navigate]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!categoryName || setNo == null) {
        setAccessPending(false);
        return;
      }
      const user = auth.currentUser;
      if (!user) {
        if (Number(setNo) !== 1) {
          alert("Sign in to access sets beyond Set 1.");
          navigate(`/sets/${encodeURIComponent(categoryName)}`, {
            replace: true,
          });
          return;
        }
        setAccessPending(false);
        return;
      }

      const userSnap = await get(ref(db, `users/${user.uid}`));
      if (cancelled) return;
      const userData = userSnap.val() || {};

      if (isPaidPlan(userData.userPlan)) {
        setAccessPending(false);
        return;
      }

      if (Number(setNo) !== 1) {
        alert(
          "Free plan includes Set 1 only. Buy Test Series to access more sets."
        );
        navigate(`/sets/${encodeURIComponent(categoryName)}`, { replace: true });
        return;
      }

      let sk = location.state?.subjectKey;
      if (!sk) {
        sk = await findSubjectKeyForCategory(db, categoryName);
      }
      if (cancelled) return;

      if (sk) {
        const catSnap = await get(ref(db, `categories/${sk}`));
        const names = categoryNamesForSubject(catSnap.val());
        const attSnap = await get(ref(db, `users/${user.uid}/attemptedExams`));
        const attempts = Object.values(attSnap.val() || {});
        if (subjectHasAttempt(names, attempts)) {
          alert(
          "You've used your free trial for this subject. Buy Test Series to unlock all sets."
          );
          navigate(`/categories/${sk}`, { replace: true });
          return;
        }
      }

      setAccessPending(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryName, setNo, navigate, location.state]);

  useEffect(() => {
    if (!categoryName) return;

    const questionsRefDb = ref(db, `SETS/${categoryName}/questions`);
    return onValue(questionsRefDb, (snap) => {
      const data = snap.val() || {};
      const filtered = Object.values(data).filter(
        (q) => q.setNo === Number(setNo)
      );
      setQuestions(filtered);
      setLoading(false);
      setTimeLeft(filtered.length * TIME_PER_QUESTION);
    });
  }, [categoryName, setNo]);

  useEffect(() => {
    if (loading || questions.length === 0 || accessPending) return;

    submittedRef.current = false;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t <= 1 ? 0 : t - 1));
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, questions.length, accessPending, categoryName, setNo]);

  useEffect(() => {
    if (loading || questions.length === 0 || accessPending || timeLeft > 0) {
      return;
    }
    if (submittedRef.current) return;
    submittedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    (async () => {
      await persistAndNavigateResult(buildExamData());
    })();
  }, [
    timeLeft,
    loading,
    questions.length,
    accessPending,
    buildExamData,
    persistAndNavigateResult,
  ]);

  if (!categoryName || setNo == null) {
    return (
      <div className="center">Missing exam parameters. Go back and choose a set.</div>
    );
  }

  if (loading || accessPending) {
    return <div className="center">Loading questions...</div>;
  }

  if (!questions.length) {
    return <div className="center">No questions in this set.</div>;
  }

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const markedCount = flaggedQuestions.length;

  const handleSubmitExam = async () => {
    if (submittedRef.current) return;
    const confirmSubmit = window.confirm(
      "Are you sure you want to submit the exam?"
    );
    if (!confirmSubmit) return;
    submittedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    await persistAndNavigateResult(buildExamData());
  };

  const handleAnswer = (option) => {
    setUserAnswers((prev) => {
      const next = { ...prev, [currentQuestion.question]: option };
      answersRef.current = next;
      return next;
    });
  };

  const clearAnswer = () => {
    const qKey = currentQuestion.question;
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[qKey];
      answersRef.current = next;
      return next;
    });
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => {
      let next;
      if (prev.includes(currentIndex)) {
        next = prev.filter((i) => i !== currentIndex);
      } else {
        next = [...prev, currentIndex];
      }
      flaggedRef.current = next;
      return next;
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <div className="exam-page">
      <div
        className={`palette-overlay ${paletteOpen ? "open" : ""}`}
        onClick={() => setPaletteOpen(false)}
        aria-hidden={!paletteOpen}
      />

      <aside
        className={`palette ${paletteOpen ? "open" : ""}`}
        aria-label="Question palette"
      >
        <div className="palette__header">
          <div className="palette__title">Questions</div>
          <button
            type="button"
            className="palette__close"
            onClick={() => setPaletteOpen(false)}
            aria-label="Close palette"
          >
            ×
          </button>
        </div>

        <div className="palette__summary">
          <div className="palette__chip answered">Answered {answeredCount}</div>
          <div className="palette__chip marked">Marked {markedCount}</div>
          <div className="palette__chip">Total {totalQuestions}</div>
        </div>

        <div className="question-list" role="list">
          {questions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              className={`q-tile ${
                currentIndex === idx ? "current" : ""
              } ${flaggedQuestions.includes(idx) ? "flagged" : ""} ${
                userAnswers[q.question] ? "answered" : ""
              }`}
              onClick={() => {
                setCurrentIndex(idx);
                setPaletteOpen(false);
              }}
              role="listitem"
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </aside>

      <div className="exam-main">
        <div className="exam-topbar">
          <button
            type="button"
            className="topbar-btn"
            onClick={() => setPaletteOpen(true)}
          >
            Questions
          </button>

          <div className="topbar-title">
            <div className="topbar-title__main">{categoryName}</div>
            <div className="topbar-title__sub">
              Set {setNo} • Q{currentIndex + 1}/{totalQuestions}
            </div>
          </div>

          <div className="topbar-right">
            <div className={`timer ${timeLeft <= 60 ? "danger" : ""}`}>
              {formatTime(timeLeft)}
            </div>
            <button
              type="button"
              className="topbar-btn danger"
              onClick={handleSubmitExam}
            >
              Submit
            </button>
          </div>
        </div>

        <div className="question-card">
          <h3>
            Q{currentIndex + 1}: {currentQuestion.question}
          </h3>
          <div className="options">
            {["optionA", "optionB", "optionC", "optionD"].map((opt) => (
              <button
                type="button"
                key={opt}
                className={`option-btn ${
                  userAnswers[currentQuestion.question] === currentQuestion[opt]
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleAnswer(currentQuestion[opt])}
              >
                <span className="option-text">{currentQuestion[opt]}</span>
                <span className="option-indicator" aria-hidden="true" />
              </button>
            ))}
          </div>

          <div className="actions">
            <button
              type="button"
              className="action-btn subtle"
              onClick={toggleFlag}
            >
              {flaggedQuestions.includes(currentIndex) ? "Unmark" : "Mark"}
            </button>
            <button
              type="button"
              className="action-btn subtle"
              onClick={clearAnswer}
            >
              Clear
            </button>
            <div className="actions-spacer" />
            <button
              type="button"
              className="action-btn"
              onClick={() => setCurrentIndex((i) => (i > 0 ? i - 1 : i))}
              disabled={currentIndex === 0}
            >
              Previous
            </button>
            <button
              type="button"
              className="action-btn primary"
              onClick={() =>
                setCurrentIndex((i) => (i < questions.length - 1 ? i + 1 : i))
              }
              disabled={currentIndex >= questions.length - 1}
            >
              Save & Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
