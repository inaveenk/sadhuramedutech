// src/pages/Sets.js
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Sets() {
  const { categoryName } = useParams();
  const [sets, setSets] = useState([]);
  const [setStats, setSetStats] = useState({});
  const [loading, setLoading] = useState(true); // ✅ added
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!categoryName) return;

    setLoading(true); // ✅ added

    const questionsRef = ref(db, `SETS/${categoryName}/questions`);
    const unsubscribe = onValue(questionsRef, (snapshot) => {
      const data = snapshot.val() || {};

      // Group questions by setNo
      const grouped = {};
      Object.values(data).forEach((q) => {
        const setNumber = q.setNo || 1;
        if (!grouped[setNumber]) grouped[setNumber] = [];
        grouped[setNumber].push(q);
      });

      // Convert grouped object into array of sets
      const setsList = Object.keys(grouped).map((setNo) => ({
        setNo,
        questions: grouped[setNo],
        time: grouped[setNo].length, // 1 min per question
      }));

      setSets(setsList);
      setLoading(false); // ✅ added
    });

    return () => unsubscribe();
  }, [categoryName]);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId || !categoryName) {
      setSetStats({});
      return;
    }

    const attemptsRef = ref(db, `users/${userId}/attemptedExams`);
    return onValue(attemptsRef, (snapshot) => {
      const attemptsObj = snapshot.val() || {};
      const attempts = Object.entries(attemptsObj).filter(
        ([, a]) => a?.category === categoryName
      );

      const grouped = new Map(); // setNo -> { attempts, scoreSum, latest }

      for (const [examId, a] of attempts) {
        const setNo = String(a?.setNo ?? "");
        if (!setNo) continue;

        const totalQuestions = Number(a?.totalQuestions || 0);
        const score = Number(a?.score || 0);
        const timestamp = Number(a?.timestamp || 0);
        const attemptedQuestions = Array.isArray(a?.answers)
          ? a.answers.filter(
              (ans) => ans?.yourAnswer !== null && ans?.yourAnswer !== undefined && ans?.yourAnswer !== ""
            ).length
          : 0;

        if (!grouped.has(setNo)) {
          grouped.set(setNo, {
            attempts: 0,
            scoreSum: 0,
            latest: {
              examId: "",
              examData: null,
              timestamp: 0,
              score: 0,
              totalQuestions: 0,
              attemptedQuestions: 0,
            },
          });
        }

        const bucket = grouped.get(setNo);
        bucket.attempts += 1;
        bucket.scoreSum += score;

        if (timestamp >= bucket.latest.timestamp) {
          bucket.latest = {
            examId,
            examData: a,
            timestamp,
            score,
            totalQuestions,
            attemptedQuestions,
          };
        }
      }

      const next = {};
      grouped.forEach((value, setNo) => {
        next[setNo] = {
          attempted: value.attempts > 0,
          attempts: value.attempts,
          yourScore: value.latest.score,
          totalMarks: value.latest.totalQuestions,
          attemptedQuestions: value.latest.attemptedQuestions,
          latestExamId: value.latest.examId,
          latestExam: value.latest.examData,
          averageMarks:
            value.attempts > 0 ? value.scoreSum / value.attempts : null,
        };
      });

      setSetStats(next);
    });
  }, [user, categoryName]);

  const handleSetClick = (set) => {
    navigate("/exam", {
      state: { categoryName, setNo: set.setNo, questions: set.questions },
    });
  };

  const handleViewResult = (stats) => {
    if (!stats?.latestExam) return;
    navigate("/detail", {
      state: {
        examId: stats.latestExamId,
        exam: stats.latestExam,
      },
    });
  };

  return (
    <div
      className="sets-page-wrapper"
      style={{ display: "flex", justifyContent: "center", gap: "16px", padding: "16px" }}
    >
      {/* Left Ad */}
      <div className="ad-side" style={{ width: "160px", flexShrink: 0 }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4769435723418888"
          data-ad-slot="2256417961"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>

      {/* Main Content */}
      <div className="main-content" style={{ maxWidth: "600px", width: "100%" }}>
        <h2>{categoryName} - Sets</h2>

        {loading ? (
          <p>Loading sets...</p>
        ) : sets.length === 0 ? (
          <p>No sets available in this category.</p>
        ) : (
          <div className="tile-grid">
            {sets.map((set) => {
              const stats = setStats[String(set.setNo)];
              const attempted = Boolean(stats?.attempted);
              const averageMarks =
                stats?.averageMarks == null
                  ? "—"
                  : stats.averageMarks.toFixed(1);

              return (
                <div
                  key={set.setNo}
                  className={`tile ${attempted ? "tile-attempted" : ""}`}
                  style={{ cursor: attempted ? "default" : "pointer" }}
                  onClick={attempted ? undefined : () => handleSetClick(set)}
                >
                  {attempted && <div className="attempt-badge">✓</div>}
                  <h3>Set {set.setNo}</h3>
                  <p>Time: {set.time} min{set.time > 1 ? "s" : ""}</p>
                  <p>
                    {set.questions.length} Question
                    {set.questions.length > 1 ? "s" : ""}
                  </p>

                  {attempted ? (
                    <>
                      <p style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>
                        Attempted Qs: {stats.attemptedQuestions}/{stats.totalMarks}
                      </p>
                      <p style={{ fontSize: 13, color: "#334155", marginBottom: 6 }}>
                        Your Marks: {stats.yourScore}/{stats.totalMarks}
                      </p>
                      <p style={{ fontSize: 13, color: "#334155", margin: 0 }}>
                        Average Marks: {averageMarks}
                      </p>
                      <div
                        className="set-card-actions"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="set-card-btn set-card-btn-secondary"
                          onClick={() => handleViewResult(stats)}
                        >
                          View Result
                        </button>
                        <button
                          type="button"
                          className="set-card-btn"
                          onClick={() => handleSetClick(set)}
                        >
                          Re-attempt
                        </button>
                      </div>
                    </>
                  ) : (
                    <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                      Not attempted yet
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right Ad */}
      <div className="ad-side" style={{ width: "160px", flexShrink: 0 }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4769435723418888"
          data-ad-slot="2256417961"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>

      {/* Responsive CSS */}
      <style>
        {`
          @media (max-width: 768px) {
            .ad-side { display: none; }
          }
        `}
      </style>
    </div>
  );
}