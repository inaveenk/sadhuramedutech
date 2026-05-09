import React, { useEffect, useMemo, useState } from "react";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLanguage } from "../i18n";

export default function Leaderboard() {
  const [user] = useAuthState(auth);
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(100);
  const { t } = useLanguage();

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
          const averageMarks =
            attemptCount > 0 ? totalScore / attemptCount : 0;

          return {
            uid,
            name: data?.userName || "User",
            averageMarks,
            attemptCount,
          };
        })
        .filter((row) => row.attemptCount > 0)
        .sort((a, b) => b.averageMarks - a.averageMarks);

      setRows(computed);
      setLoading(false);
      setVisibleCount(100);
    });
  }, []);

  const currentUserRank = useMemo(() => {
    if (!user) return null;
    const idx = rows.findIndex((r) => r.uid === user.uid);
    return idx >= 0 ? idx + 1 : null;
  }, [rows, user]);

  const visibleRows = rows.slice(0, visibleCount);
  const hasMore = visibleCount < rows.length;

  return (
    <div className="page-wide leaderboard-page">
      <h2 className="page-title">{t("leaderboard_title")}</h2>

      <div className="leaderboard-summary card">
        {loading ? (
          <p>{t("leaderboard_loading")}</p>
        ) : (
          <>
            <p>
              <strong>{t("leaderboard_your_rank")}:</strong>{" "}
              {currentUserRank ? `#${currentUserRank}` : t("home_unranked")}
            </p>
            <p>
              <strong>{t("leaderboard_total_users")}:</strong> {rows.length}
            </p>
          </>
        )}
      </div>

      <div className="leaderboard-list card">
        <h3 style={{ marginTop: 0 }}>{t("leaderboard_title")}</h3>
        {loading ? (
          <p>{t("leaderboard_preparing")}</p>
        ) : visibleRows.length === 0 ? (
          <p>{t("leaderboard_no_attempts")}</p>
        ) : (
          visibleRows.map((item, index) => (
            <div key={item.uid} className="leaderboard-row">
              <div className="leaderboard-rank">#{index + 1}</div>
              <div className="leaderboard-name">{item.name}</div>
              <div className="leaderboard-marks">
                {t("home_avg_marks")}: {item.averageMarks.toFixed(1)}
              </div>
            </div>
          ))
        )}
        {!loading && hasMore && (
          <div style={{ marginTop: 14, textAlign: "center" }}>
            <button type="button" onClick={() => setVisibleCount((v) => v + 100)}>
              {t("leaderboard_view_more")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
