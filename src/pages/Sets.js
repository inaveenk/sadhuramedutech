// src/pages/Sets.js
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  getSetDifficultyLabel,
  isPlanActive,
  findSubjectKeyForCategory,
  categoryNamesForSubject,
  subjectHasAttempt,
} from "../utils/examAccess";
import { useLanguage } from "../i18n";

export default function Sets() {
  const { categoryName: categoryNameParam } = useParams();
  const categoryName = categoryNameParam
    ? decodeURIComponent(categoryNameParam)
    : "";
  const location = useLocation();
  const [sets, setSets] = useState([]);
  const [setStats, setSetStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [rawAttempts, setRawAttempts] = useState([]);
  const [userPlan, setUserPlan] = useState("free");
  const [planEndDate, setPlanEndDate] = useState(null);
  const [subjectKey, setSubjectKey] = useState(
    location.state?.subjectKey || null
  );
  const [subjectCategoryNames, setSubjectCategoryNames] = useState([]);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { t } = useLanguage();

  useEffect(() => {
    if (subjectKey || !categoryName) return;
    let cancelled = false;
    (async () => {
      const sk = await findSubjectKeyForCategory(db, categoryName);
      if (!cancelled && sk) setSubjectKey(sk);
    })();
    return () => {
      cancelled = true;
    };
  }, [categoryName, subjectKey]);

  useEffect(() => {
    if (!subjectKey) {
      setSubjectCategoryNames([]);
      return;
    }
    return onValue(ref(db, `categories/${subjectKey}`), (snap) => {
      setSubjectCategoryNames(categoryNamesForSubject(snap.val()));
    });
  }, [subjectKey]);

  useEffect(() => {
    if (!user?.uid) {
      setUserPlan("free");
      setPlanEndDate(null);
      return;
    }
    return onValue(ref(db, `users/${user.uid}`), (snap) => {
      const v = snap.val() || {};
      setUserPlan(v.userPlan || "free");
      setPlanEndDate(v.planEndDate || null);
    });
  }, [user]);

  useEffect(() => {
    if (!categoryName) return;

    setLoading(true);

    const questionsRef = ref(db, `SETS/${categoryName}/questions`);
    const unsubscribe = onValue(questionsRef, (snapshot) => {
      const data = snapshot.val() || {};

      const grouped = {};
      Object.values(data).forEach((q) => {
        const setNumber = q.setNo ?? 1;
        if (!grouped[setNumber]) grouped[setNumber] = [];
        grouped[setNumber].push(q);
      });

      const setsList = Object.keys(grouped)
        .map((setNo) => ({
          setNo,
          questions: grouped[setNo],
          time: grouped[setNo].length,
        }))
        .sort((a, b) => Number(a.setNo) - Number(b.setNo));

      setSets(setsList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [categoryName]);

  useEffect(() => {
    const userId = user?.uid;
    if (!userId || !categoryName) {
      setSetStats({});
      setRawAttempts([]);
      return;
    }

    const attemptsRef = ref(db, `users/${userId}/attemptedExams`);
    return onValue(attemptsRef, (snapshot) => {
      const attemptsObj = snapshot.val() || {};
      setRawAttempts(Object.values(attemptsObj));

      const attempts = Object.entries(attemptsObj).filter(
        ([, a]) => a?.category === categoryName
      );

      const grouped = new Map();

      for (const [examId, a] of attempts) {
        const setNo = String(a?.setNo ?? "");
        if (!setNo) continue;

        const totalQuestions = Number(a?.totalQuestions || 0);
        const score = Number(a?.score || 0);
        const timestamp = Number(a?.timestamp || 0);
        const attemptedQuestions = Array.isArray(a?.answers)
          ? a.answers.filter(
              (ans) =>
                ans?.yourAnswer !== null &&
                ans?.yourAnswer !== undefined &&
                ans?.yourAnswer !== ""
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

  const freeSubjectLocked = useMemo(() => {
    if (!user?.uid) return false;
    if (isPlanActive(userPlan, planEndDate)) return false;
    if (subjectCategoryNames.length === 0) return false;
    return subjectHasAttempt(subjectCategoryNames, rawAttempts);
  }, [user?.uid, userPlan, planEndDate, subjectCategoryNames, rawAttempts]);

  const paid = isPlanActive(userPlan, planEndDate);

  const handleSetClick = (set) => {
    navigate("/exam", {
      state: {
        categoryName,
        setNo: set.setNo,
        subjectKey: subjectKey || location.state?.subjectKey,
      },
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

  const upgradeBanner = (
    <div
      style={{
        padding: "12px 14px",
        marginBottom: 16,
        borderRadius: 10,
        background: "#fef3c7",
        border: "1px solid #f59e0b",
        color: "#92400e",
        fontSize: 14,
      }}
    >
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 260px" }}>{t("sets_upgrade_banner")}</div>
        <button
          type="button"
          onClick={() => navigate("/plans")}
          style={{
            flex: "0 0 auto",
            background: "#0f172a",
            border: "1px solid rgba(15, 23, 42, 0.18)",
            borderRadius: 12,
            padding: "10px 14px",
            fontWeight: 900,
            color: "#fff",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {t("home_buy_test_series")}
        </button>
      </div>
    </div>
  );

  const setHelpBanner =
    !paid && !freeSubjectLocked ? (
      <div
        style={{
          padding: "10px 14px",
          marginBottom: 14,
          borderRadius: 10,
          background: "#e0f2fe",
          border: "1px solid #38bdf8",
          color: "#0c4a6e",
          fontSize: 13,
        }}
      >
        {t("sets_free_help")}
      </div>
    ) : null;

  return (
    <div
      className="sets-page-wrapper"
      style={{
        display: "flex",
        justifyContent: "center",
        gap: "16px",
        padding: "16px",
      }}
    >
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

      <div className="main-content" style={{ maxWidth: "600px", width: "100%" }}>
        <h2>
          {categoryName} - {t("sets_title_suffix")}
        </h2>

        {freeSubjectLocked && upgradeBanner}
        {setHelpBanner}

        {loading ? (
          <p>{t("sets_loading")}</p>
        ) : sets.length === 0 ? (
          <p>{t("sets_none")}</p>
        ) : (
          <div className="tile-grid">
            {sets.map((set) => {
              const stats = setStats[String(set.setNo)];
              const attempted = Boolean(stats?.attempted);
              const averageMarks =
                stats?.averageMarks == null
                  ? "—"
                  : stats.averageMarks.toFixed(1);

              const setNum = Number(set.setNo);
              const diff = getSetDifficultyLabel(set.setNo);
              const setNotAllowedOnFree =
                !paid && !freeSubjectLocked && setNum !== 1;
              const cardDisabled = freeSubjectLocked || setNotAllowedOnFree;

              return (
                <div
                  key={set.setNo}
                  className={`tile ${attempted ? "tile-attempted" : ""} ${
                    cardDisabled ? "tile-disabled" : ""
                  }`}
                  style={{
                    cursor:
                      cardDisabled && !attempted
                        ? "not-allowed"
                        : attempted && !paid
                          ? "default"
                          : "pointer",
                    opacity: cardDisabled && !attempted ? 0.72 : 1,
                  }}
                  onClick={
                    attempted || cardDisabled
                      ? undefined
                      : () => handleSetClick(set)
                  }
                >
                  {attempted && <div className="attempt-badge">✓</div>}
                  <h3>
                    {t("sets_set")} {set.setNo}
                  </h3>
                  {diff.label ? (
                    <p
                      style={{
                        margin: "4px 0 8px",
                        fontSize: 13,
                        fontWeight: 700,
                        color: "#475569",
                      }}
                    >
                      {t("sets_level")}: {diff.label}
                    </p>
                  ) : null}
                  <p>
                    {t("sets_time")}: {set.time} {t("sets_minutes")}
                  </p>
                  <p>
                    {set.questions.length} {t("sets_questions")}
                  </p>

                  {attempted ? (
                    <>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#334155",
                          marginBottom: 6,
                        }}
                      >
                        Attempted Qs: {stats.attemptedQuestions}/
                        {stats.totalMarks}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#334155",
                          marginBottom: 6,
                        }}
                      >
                        Your Marks: {stats.yourScore}/{stats.totalMarks}
                      </p>
                      <p
                        style={{
                          fontSize: 13,
                          color: "#334155",
                          margin: 0,
                        }}
                      >
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
                          {t("sets_view_result")}
                        </button>
                        <button
                          type="button"
                          className="set-card-btn"
                          disabled={!paid || freeSubjectLocked}
                          onClick={() => {
                            if (!paid || freeSubjectLocked) {
                              alert(
                                "Re-attempts and further sets require Test Series."
                              );
                              return;
                            }
                            handleSetClick(set);
                          }}
                        >
                          {t("sets_reattempt")}
                        </button>
                      </div>
                    </>
                  ) : cardDisabled ? (
                    <p style={{ fontSize: 13, color: "#b45309", margin: 0 }}>
                      {freeSubjectLocked
                        ? t("sets_buy_to_start")
                        : t("sets_buy_to_unlock")}
                    </p>
                  ) : (
                    <div style={{ marginTop: 6 }}>
                      <p style={{ fontSize: 13, color: "#64748b", margin: 0 }}>
                        {t("sets_not_attempted")}
                      </p>
                      <button
                        type="button"
                        className="set-card-btn"
                        style={{ marginTop: 10, width: "100%" }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (cardDisabled) {
                            navigate("/plans");
                            return;
                          }
                          handleSetClick(set);
                        }}
                      >
                        {t("sets_attempt_test")}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

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
