// src/pages/Categories.js
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import AdBanner from "../components/AdBanner";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Categories() {
  const { subjectKey } = useParams();
  const [categories, setCategories] = useState([]);
  const [categoryStats, setCategoryStats] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    if (!subjectKey) return;

    const catRef = ref(db, `categories/${subjectKey}`);

    const unsubscribe = onValue(catRef, (snap) => {
      const data = snap.val() || {};

      const list = Object.entries(data).map(([id, cat]) => ({
        id,
        name: cat.name || id,
        sets: cat.sets || 0,
      }));

      setCategories(list);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [subjectKey]);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId || categories.length === 0) {
      setCategoryStats({});
      return;
    }

    const attemptsRef = ref(db, `users/${userId}/attemptedExams`);
    return onValue(attemptsRef, (snapshot) => {
      const attemptsObj = snapshot.val() || {};
      const attempts = Object.values(attemptsObj);

      const nextStats = {};

      for (const cat of categories) {
        const categoryName = cat.name;

        // Deduplicate by setNo and keep best (highest %) attempt
        const bestBySet = new Map(); // setNo -> { score, total, pct }
        let attemptCount = 0;
        let attemptScoreSum = 0;

        for (const a of attempts) {
          if (a?.category !== categoryName) continue;
          const setNo = a?.setNo;
          if (setNo == null) continue;

          const totalQ = Number(a?.totalQuestions || 0);
          const score = Number(a?.score || 0);
          const pct = totalQ > 0 ? (score / totalQ) * 100 : 0;

          attemptCount += 1;
          attemptScoreSum += score;

          const prev = bestBySet.get(String(setNo));
          if (!prev || pct > prev.pct) {
            bestBySet.set(String(setNo), { score, total: totalQ, pct });
          }
        }

        const completed = bestBySet.size;
        const total = Number(cat.sets || 0);
        const marksSummary = Array.from(bestBySet.values()).reduce(
          (acc, item) => ({
            score: acc.score + Number(item.score || 0),
            total: acc.total + Number(item.total || 0),
          }),
          { score: 0, total: 0 }
        );
        const avgMarks =
          completed > 0 ? marksSummary.score / completed : null;
        const avgAttemptMarks =
          attemptCount > 0 ? attemptScoreSum / attemptCount : null;

        nextStats[cat.id] = {
          completed,
          total,
          avgMarks,
          avgAttemptMarks,
        };
      }

      setCategoryStats(nextStats);
    });
  }, [user, categories]);

  const handleClick = (cat) => {
    navigate(`/sets/${encodeURIComponent(cat.name)}`, {
      state: {
        subjectKey,
        categoryId: cat.id,
        categoryName: cat.name,
      },
    });
  };

  const formatSubjectTitle = (key) =>
    key ? key.replace(/([A-Z])/g, " $1").trim() : "";

  return (
    <div className="page-wide">
      <h2 style={{ margin: "0 0 12px 0" }}>
        {formatSubjectTitle(subjectKey)}
      </h2>

      {loading ? (
        <p>Loading categories...</p>
      ) : categories.length === 0 ? (
        <p>No categories found</p>
      ) : (
        <div className="tile-grid">
          {categories.map((cat) => (
            (() => {
              const st = categoryStats[cat.id];
              const completed = st?.completed ?? 0;
              const total = st?.total ?? cat.sets ?? 0;
              const avgMarks = st?.avgMarks;
              const avgAttemptMarks = st?.avgAttemptMarks;
              const avgText = avgMarks == null ? "—" : avgMarks.toFixed(1);
              const avgAttemptText =
                avgAttemptMarks == null ? "—" : avgAttemptMarks.toFixed(1);

              return (
            <div
              key={cat.id}
              className="tile category-tile"
              onClick={() => handleClick(cat)}
            >
              <h3>{cat.name}</h3>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
                  {completed}/{total} Completed
                </span>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
                  Your Average Marks {avgText}
                </span>
                <span style={{ fontSize: 13, color: "#475569", fontWeight: 700 }}>
                  Average Marks {avgAttemptText}
                </span>
              </div>
            </div>
              );
            })()
          ))}
        </div>
      )}
      {categories.length > 0 && (
  <div style={{ marginTop: 24 }}>
    <AdBanner />
  </div>
)}

    </div>
  );
}