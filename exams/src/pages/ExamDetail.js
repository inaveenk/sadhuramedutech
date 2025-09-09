// src/pages/ExamPage.js
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "./ExamPage.css"; // optional for styling

export default function ExamPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { categoryName, setNo, questions } = location.state || {};

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState("");
  const [score, setScore] = useState(0);
  const [attemptedQuestions, setAttemptedQuestions] = useState({});
  const [flaggedQuestions, setFlaggedQuestions] = useState({});
  const [timeLeft, setTimeLeft] = useState(questions ? questions.length * 60 : 0); // 1 min per question
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      alert("No questions found for this set!");
      navigate("/home");
    }
  }, [questions, navigate]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleFinish();
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft((t) => t - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  if (!questions) return <div className="center">Loading...</div>;

  const currentQuestion = questions[currentIndex];

  const handleOptionSelect = (option) => {
    setSelectedOption(option);
    setAttemptedQuestions((prev) => ({
      ...prev,
      [currentIndex]: option,
    }));
  };

  const handleNext = () => {
    checkScore();
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(attemptedQuestions[currentIndex + 1] || "");
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setSelectedOption(attemptedQuestions[currentIndex - 1] || "");
    }
  };

  const handleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const checkScore = () => {
    if (selectedOption === currentQuestion.correctAns) {
      setScore((s) => s + 1);
    }
  };

  const handleFinish = () => {
    navigate("/result", {
      state: {
        score,
        total: questions.length,
        categoryName,
        setNo,
        attemptedQuestions,
        flaggedQuestions,
        questions,
      },
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="exam-container" style={{ display: "flex" }}>
      {/* Sidebar */}
      <div
        className={`exam-sidebar ${sidebarOpen ? "open" : "closed"}`}
        style={{
          width: sidebarOpen ? 200 : 0,
          transition: "width 0.3s",
          overflowX: "hidden",
          background: "#f4f4f4",
          padding: sidebarOpen ? "10px" : "0px",
        }}
      >
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ marginBottom: 10 }}>
          {sidebarOpen ? "Hide" : "Show"} Questions
        </button>
        {sidebarOpen &&
          questions.map((q, idx) => (
            <div
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                display: "inline-block",
                width: 30,
                height: 30,
                lineHeight: "30px",
                margin: 4,
                borderRadius: "50%",
                textAlign: "center",
                cursor: "pointer",
                background: flaggedQuestions[idx]
                  ? "orange"
                  : attemptedQuestions[idx]
                  ? "#14a3e4"
                  : "#ddd",
                color: flaggedQuestions[idx] || attemptedQuestions[idx] ? "#fff" : "#000",
              }}
            >
              {idx + 1}
            </div>
          ))}
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: 20 }}>
        <h2>
          {categoryName} - Set {setNo}
        </h2>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <div>
            Q{currentIndex + 1} / {questions.length}
          </div>
          <div>Time Left: {formatTime(timeLeft)}</div>
          <button
            onClick={handleFlag}
            style={{
              background: flaggedQuestions[currentIndex] ? "orange" : "#eee",
            }}
          >
            {flaggedQuestions[currentIndex] ? "Flagged" : "Flag"}
          </button>
        </div>

        <div className="card" style={{ padding: 20, marginBottom: 20 }}>
          <h3>{currentQuestion.question}</h3>
          <div style={{ marginTop: "12px" }}>
            {["optionA", "optionB", "optionC", "optionD"].map((opt) => (
              <button
                key={opt}
                onClick={() => handleOptionSelect(currentQuestion[opt])}
                style={{
                  display: "block",
                  margin: "6px 0",
                  width: "100%",
                  background: selectedOption === currentQuestion[opt] ? "#14a3e4" : "#fff",
                  color: selectedOption === currentQuestion[opt] ? "#fff" : "#222",
                }}
              >
                {currentQuestion[opt]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={handlePrev} disabled={currentIndex === 0}>
            Previous
          </button>
          <button onClick={handleNext}>
            {currentIndex < questions.length - 1 ? "Next" : "Finish"}
          </button>
        </div>
      </div>
    </div>
  );
}
