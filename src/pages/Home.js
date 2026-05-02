import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import "./Home.css";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [subjectStats, setSubjectStats] = useState({});
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [loading, setLoading] = useState(true); // ✅ added
  const navigate = useNavigate();
  const [user] = useAuthState(auth);

  useEffect(() => {
    const subjectsRef = ref(db, "categories");

    const unsubscribe = onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};

      // data shape: categories/{subjectKey}/{categoryId} -> { name, sets }
      const list = Object.keys(data).map((key) => {
        const categoriesObj = data[key] || {};
        const categoriesList = Object.values(categoriesObj).map((c) => c?.name).filter(Boolean);
        const totalSets = Object.values(categoriesObj).reduce(
          (sum, c) => sum + Number(c?.sets || 0),
          0
        );

        return {
          key, // subjectKey
          title: formatSubjectName(key),
          totalSets,
          categoriesList,
        };
      });

      setSubjects(list);
      setLoading(false); // ✅ added
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId || subjects.length === 0) {
      setSubjectStats({});
      return;
    }

    const attemptsRef = ref(db, `users/${userId}/attemptedExams`);
    return onValue(attemptsRef, (snapshot) => {
      const attemptsObj = snapshot.val() || {};
      const attempts = Object.values(attemptsObj);

      const nextStats = {};

      for (const sub of subjects) {
        const allowedCategories = new Set(sub.categoriesList || []);

        // Deduplicate by category+setNo and keep best (highest %) attempt
        const bestBySet = new Map(); // key -> { score, total, pct }
        for (const a of attempts) {
          const category = a?.category;
          const setNo = a?.setNo;
          if (!category || setNo == null) continue;
          if (!allowedCategories.has(category)) continue;

          const totalQ = Number(a?.totalQuestions || 0);
          const score = Number(a?.score || 0);
          const pct = totalQ > 0 ? (score / totalQ) * 100 : 0;
          const attemptKey = `${category}__${setNo}`;

          const prev = bestBySet.get(attemptKey);
          if (!prev || pct > prev.pct) {
            bestBySet.set(attemptKey, { score, total: totalQ, pct });
          }
        }

        const completed = bestBySet.size;
        const total = Number(sub.totalSets || 0);
        const marksSummary = Array.from(bestBySet.values()).reduce(
          (acc, item) => ({
            score: acc.score + Number(item.score || 0),
            total: acc.total + Number(item.total || 0),
          }),
          { score: 0, total: 0 }
        );
        const avgMarks =
          completed > 0 ? marksSummary.score / completed : null;

        nextStats[sub.key] = {
          completed,
          total,
          totalScore: marksSummary.score,
          totalQuestions: marksSummary.total,
          avgMarks,
        };
      }

      setSubjectStats(nextStats);
    });
  }, [user, subjects]);

  useEffect(() => {
    const usersRef = ref(db, "users");
    return onValue(usersRef, (snapshot) => {
      const users = snapshot.val() || {};
      const computed = Object.entries(users)
        .map(([uid, data]) => {
          const attemptsObj = data?.attemptedExams || {};
          const attempts = Object.values(attemptsObj);
          const attemptCount = attempts.length;
          const totalScore = attempts.reduce(
            (sum, a) => sum + Number(a?.score || 0),
            0
          );
          const averageMarks = attemptCount > 0 ? totalScore / attemptCount : 0;

          return {
            uid,
            averageMarks,
            attemptCount,
          };
        })
        .filter((row) => row.attemptCount > 0)
        .sort((a, b) => b.averageMarks - a.averageMarks);

      setLeaderboardRows(computed);
      setLeaderboardLoading(false);
    });
  }, []);

  const handleSubjectClick = (subjectKey) => {
    // ✅ EXACTLY like Android
    navigate(`/categories/${subjectKey}`);
  };

  const currentUserRank = user
    ? (() => {
        const index = leaderboardRows.findIndex((r) => r.uid === user.uid);
        return index >= 0 ? index + 1 : null;
      })()
    : null;

  const currentUserAvgMarks = user
    ? leaderboardRows.find((r) => r.uid === user.uid)?.averageMarks ?? null
    : null;

  return (
    <div className="home">
      <div className="home__container">
        <section className="home__leaderboard">
          <div className="home__leaderboardLeft">
            <div className="home__leaderboardTitle">Leaderboard Snapshot</div>
            {leaderboardLoading ? (
              <div className="home__leaderboardMeta">Loading your rank...</div>
            ) : (
              <div className="home__leaderboardMeta">
                <span>
                  Rank: {currentUserRank ? `#${currentUserRank}` : "Unranked"}
                </span>
                <span>
                  Avg Marks:{" "}
                  {currentUserAvgMarks == null
                    ? "—"
                    : currentUserAvgMarks.toFixed(1)}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            className="home__leaderboardBtn"
            onClick={() => navigate("/leaderboard")}
          >
            View Full Leaderboard
          </button>
        </section>

        <h1 className="home__title">Choose Subject</h1>

        {loading ? (
          <p className="home__status" aria-live="polite">
            Loading subjects...
          </p>
        ) : (
          <div className="home__grid" role="list">
            {subjects.map((sub) => (
              (() => {
                const st = subjectStats[sub.key];
                const completed = st?.completed ?? 0;
                const total = st?.total ?? sub.totalSets ?? 0;
                const avgMarks = st?.avgMarks;
                const avgText = avgMarks == null ? "—" : avgMarks.toFixed(1);

                return (
              <button
                key={sub.key}
                type="button"
                className="home__card"
                onClick={() => handleSubjectClick(sub.key)}
                role="listitem"
              >
                <div className="home__cardTitle">{sub.title}</div>
                <div className="home__cardMeta">
                  <span className="home__pill">{completed}/{total} Completed</span>
                  <span className="home__pill">Average Marks {avgText}</span>
                </div>
              </button>
                );
              })()
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function formatSubjectName(key) {
  if (key === "IndianGK") return "Indian GK";
  if (key === "HaryanaGK") return "Haryana GK";
  if (key === "CET2025") return "CET-2025";
  return key.replace(/_/g, " ");
}