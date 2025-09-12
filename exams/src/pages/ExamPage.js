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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

  // Timer
  useEffect(() => {
    if (!timeLeft) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          handleSubmitExam();
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  if (loading) return <div className="center">Loading questions...</div>;
  if (!questions.length)
    return <div className="center">No questions in this set.</div>;

  const currentQuestion = questions[currentIndex];

  const handleAnswer = (option) => {
    setUserAnswers({ ...userAnswers, [currentQuestion.question]: option });
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

  const handleSubmitExam = async () => {
    const confirmSubmit = window.confirm("Are you sure you want to submit the exam?");
    if (!confirmSubmit) return;
  
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
  
    if (!auth.currentUser) {
      // 👇 Show custom popup
      const saveChoice = window.confirm(
        "Login to save your attempted history.\n\nClick OK to Login or Cancel to Skip."
      );
  
      if (saveChoice) {
        // navigate to login page and pass exam data so we can save after login
        navigate("/login", { state: { pendingExam: examData, examId } });
      } else {
        // Just show result without saving
        navigate("/result", { state: { ...examData } });
      }
      return;
    }
  
    // If user is logged in, save exam
    try {
      const userId = auth.currentUser.uid;
      await set(ref(db, `users/${userId}/attemptedExams/${examId}`), examData);
      navigate("/result", { state: { ...examData } });
    } catch (err) {
      console.error("Error storing exam:", err);
    }
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
      {/* Sidebar */}
      <div className={`sidebar ${sidebarOpen ? "open" : "closed"}`}>
        <h3>Questions</h3>
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? "Hide" : "Show"}
        </button>
        <div className="question-list">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className={`q-tile ${
                currentIndex === idx ? "current" : ""
              } ${flaggedQuestions.includes(idx) ? "flagged" : ""} ${
                userAnswers[q.question] ? "answered" : ""
              }`}
              onClick={() => setCurrentIndex(idx)}
            >
              {idx + 1}
            </div>
          ))}
        </div>
      </div>

      {/* Main Question */}
      <div className="exam-main">
        <div className="exam-header">
          <h2>
            {categoryName} - Set {setNo}
          </h2>
          <div className="timer">Time Left: {formatTime(timeLeft)}</div>
        </div>

        <div className="question-card">
          <h3>
            Q{currentIndex + 1}: {currentQuestion.question}
          </h3>
          <div className="options">
            {["optionA", "optionB", "optionC", "optionD"].map((opt) => (
              <button
                key={opt}
                className={`option-btn ${
                  userAnswers[currentQuestion.question] === currentQuestion[opt]
                    ? "selected"
                    : ""
                }`}
                onClick={() => handleAnswer(currentQuestion[opt])}
              >
                {currentQuestion[opt]}
              </button>
            ))}
          </div>

          <div className="actions">
            <button onClick={toggleFlag}>
              {flaggedQuestions.includes(currentIndex) ? "Unflag" : "Flag"}
            </button>
            <button
              onClick={() =>
                setCurrentIndex((i) =>
                  i < questions.length - 1 ? i + 1 : i
                )
              }
            >
              Next
            </button>
            <button
              onClick={() =>
                setCurrentIndex((i) => (i > 0 ? i - 1 : i))
              }
            >
              Prev
            </button>
            <button onClick={handleSubmitExam}>Submit Exam</button>
          </div>
        </div>
      </div>
    </div>
  );
}
