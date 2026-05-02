// src/pages/ExamPage.js
import React, { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, ref, onValue, set } from "../firebase";
import { auth } from "../firebase";
import "./ExamPage.css";

export default function ExamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryName, setNo } = location.state || {};
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0); // dynamic based on questions
  const [loading, setLoading] = useState(true);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const timerRef = useRef();
  const TIME_PER_QUESTION = 60; // 1 minute per question

  // Fetch questions
  useEffect(() => {
    if (!categoryName) return;

    const questionsRef = ref(db, `SETS/${categoryName}/questions`);
    return onValue(questionsRef, (snap) => {
      const data = snap.val() || {};
      const filtered = Object.values(data).filter(
        (q) => q.setNo === Number(setNo)
      );
      setQuestions(filtered);
      setLoading(false);

      // Dynamically set time
      setTimeLeft(filtered.length * TIME_PER_QUESTION);
    });
  }, [categoryName, setNo]);

  // Timer (start once per loaded set; avoids restarting every tick)
  useEffect(() => {
    if (loading || questions.length === 0) return;

    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, questions.length]);

  if (loading) return <div className="center">Loading questions...</div>;
  if (!questions.length)
    return <div className="center">No questions in this set.</div>;

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;
  const answeredCount = Object.keys(userAnswers).length;
  const markedCount = flaggedQuestions.length;

  const handleAnswer = (option) => {
    setUserAnswers({ ...userAnswers, [currentQuestion.question]: option });
  };

  const clearAnswer = () => {
    const qKey = currentQuestion.question;
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[qKey];
      return next;
    });
  };

  const toggleFlag = () => {
    if (flaggedQuestions.includes(currentIndex)) {
      setFlaggedQuestions(flaggedQuestions.filter((i) => i !== currentIndex));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentIndex]);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (userAnswers[q.question] === q.correctAns) score++;
    });
    return score;
  };

  const buildExamData = () => {
    const examId = `exam_${Date.now()}`;
    // Prepare answers with correctAns
    const answersWithCorrect = questions.map(q => ({
      question: q.question,
      yourAnswer: userAnswers[q.question] || null,
      correctAnswer: q.correctAns
    }));
    const examData = {
      category: categoryName,
      setNo,
      totalQuestions: questions.length,
      score: calculateScore(),
      answers: answersWithCorrect,
      flaggedQuestions,
      timestamp: Date.now(),
    };
    return { examId, examData };
  };

  const persistAndNavigateResult = async ({ examId, examData }) => {
    if (!auth.currentUser) {
      // 👇 Show custom popup
      const saveChoice = window.confirm(
        "Login to save your attempted history.\n\nClick OK to Login or Cancel to Skip."
      );
  
      if (saveChoice) {
        // navigate to login page and pass exam data so we can save after login
        navigate("/login", { state: { examData, examId } });
      } else {
        // Just show result without saving
        navigate("/result", { state: { ...examData, examId } });
      }
      return;
    }
  
    // If user is logged in, save exam
    try {
      const userId = auth.currentUser.uid;
      await set(ref(db, `users/${userId}/attemptedExams/${examId}`), examData);
      navigate("/result", { state: { ...examData, examId } });
    } catch (err) {
      console.error("Error storing exam:", err);
    }
  };

  const handleSubmitExam = async () => {
    const confirmSubmit = window.confirm("Are you sure you want to submit the exam?");
    if (!confirmSubmit) return;
    await persistAndNavigateResult(buildExamData());
  };

  const handleAutoSubmitExam = async () => {
    // Time ended: submit without extra confirmation
    await persistAndNavigateResult(buildExamData());
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

      <aside className={`palette ${paletteOpen ? "open" : ""}`} aria-label="Question palette">
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

      {/* Main Question */}
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
            <div className="topbar-title__sub">Set {setNo} • Q{currentIndex + 1}/{totalQuestions}</div>
          </div>

          <div className="topbar-right">
            <div className={`timer ${timeLeft <= 60 ? "danger" : ""}`}>
              {formatTime(timeLeft)}
            </div>
            <button type="button" className="topbar-btn danger" onClick={handleSubmitExam}>
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
            <button type="button" className="action-btn subtle" onClick={toggleFlag}>
              {flaggedQuestions.includes(currentIndex) ? "Unmark" : "Mark"}
            </button>
            <button type="button" className="action-btn subtle" onClick={clearAnswer}>
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
