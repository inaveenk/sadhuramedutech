import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import "./Home.css";
import { useAuthState } from "react-firebase-hooks/auth";
import {
  isPaidPlan,
  isPlanActive,
  isPlanExpired,
  daysUntilExpiry,
  subjectHasAttempt,
} from "../utils/examAccess";
import { useLanguage } from "../i18n";
import { getSubjectTitle } from "../utils/subjects";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const [subjectStats, setSubjectStats] = useState({});
  const [leaderboardRows, setLeaderboardRows] = useState([]);
  const [leaderboardLoading, setLeaderboardLoading] = useState(true);
  const [loading, setLoading] = useState(true); // ✅ added
  const [userPlan, setUserPlan] = useState("free");
  const [planEndDate, setPlanEndDate] = useState(null);
  const [allAttempts, setAllAttempts] = useState([]);
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const { lang, t } = useLanguage();

  useEffect(() => {
    if (!user?.uid) {
      setUserPlan("free");
      setPlanEndDate(null);
      setAllAttempts([]);
      return;
    }
    const userRef = ref(db, `users/${user.uid}`);
    const unsubUser = onValue(userRef, (snap) => {
      const v = snap.val() || {};
      setUserPlan(v.userPlan || "free");
      setPlanEndDate(v.planEndDate || null);
    });
    const attemptsRef = ref(db, `users/${user.uid}/attemptedExams`);
    const unsubAttempts = onValue(attemptsRef, (snap) => {
      setAllAttempts(Object.values(snap.val() || {}));
    });
    return () => {
      unsubUser();
      unsubAttempts();
    };
  }, [user]);

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
          title: getSubjectTitle(key, lang),
          totalSets,
          categoriesList,
        };
      });

      setSubjects(list);
      setLoading(false); // ✅ added
    });

    return () => unsubscribe();
  }, [lang]);

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

  const paid = isPlanActive(userPlan, planEndDate);
  const planIsPaidType = isPaidPlan(userPlan);
  const expired = planIsPaidType && isPlanExpired(planEndDate);
  const daysLeft = planIsPaidType ? daysUntilExpiry(planEndDate) : null;
  // Show "about to expire" banner when there are 7 or fewer days remaining
  // (and plan hasn't already lapsed). Threshold matches a typical renewal nudge window.
  const EXPIRY_WARNING_DAYS = 7;
  const showExpiringBanner =
    planIsPaidType &&
    !expired &&
    daysLeft != null &&
    daysLeft > 0 &&
    daysLeft <= EXPIRY_WARNING_DAYS;
  const showExpiredBanner = expired;

  const isHindiSubject = (subjectTitle) => {
    const s = String(subjectTitle || "");
    return s.includes("हिंदी") || s.includes("हिन्दी");
  };

  const visibleSubjects = useMemo(() => {
    return subjects.filter((s) =>
      lang === "hi" ? isHindiSubject(s.title) : !isHindiSubject(s.title)
    );
  }, [subjects, lang]);

  const subjectFreeLocked = useMemo(() => {
    const map = {};
    if (!user?.uid || paid) return map;
    for (const sub of subjects) {
      const names = sub.categoriesList || [];
      map[sub.key] =
        names.length > 0 && subjectHasAttempt(names, allAttempts);
    }
    return map;
  }, [user?.uid, paid, subjects, allAttempts]);

  const handleSubjectClick = (subjectKey) => {
    if (subjectFreeLocked[subjectKey]) {
      alert(
        "You've used your free trial for this subject. Open your profile to upgrade and unlock everything."
      );
      return;
    }
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
        {(showExpiringBanner || showExpiredBanner) && (
          <div
            role="alert"
            className={
              showExpiredBanner
                ? "home__planBanner home__planBanner--expired"
                : "home__planBanner home__planBanner--warning"
            }
          >
            <div className="home__planBannerText">
              {showExpiredBanner
                ? t("home_plan_expired")
                : daysLeft === 1
                  ? t("home_plan_expires_tomorrow")
                  : t("home_plan_expires_in").replace("{n}", String(daysLeft))}
            </div>
            <button
              type="button"
              className="home__planBannerBtn"
              onClick={() => navigate("/plans")}
            >
              {showExpiredBanner
                ? t("home_renew_now")
                : t("home_renew_now")}
            </button>
          </div>
        )}
        <section className="home__leaderboard">
          <div className="home__leaderboardLeft">
            <div className="home__leaderboardTitle">
              {t("home_leaderboard_snapshot")}
            </div>
            {leaderboardLoading ? (
              <div className="home__leaderboardMeta">{t("home_loading_rank")}</div>
            ) : (
              <div className="home__leaderboardMeta">
                <span>
                  {t("home_rank")}:{" "}
                  {currentUserRank ? `#${currentUserRank}` : t("home_unranked")}
                </span>
                <span>
                  {t("home_avg_marks")}:{" "}
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
            {t("home_view_full_leaderboard")}
          </button>
        </section>

        <h1 className="home__title">{t("home_choose_subject")}</h1>

        {loading ? (
          <p className="home__status" aria-live="polite">
            {t("home_loading_subjects")}
          </p>
        ) : visibleSubjects.length === 0 ? (
          <p className="home__status" aria-live="polite">
            {t("home_no_subjects")}
          </p>
        ) : (
          <div className="home__grid" role="list">
            {visibleSubjects.map((sub) => (
              (() => {
                const st = subjectStats[sub.key];
                const completed = st?.completed ?? 0;
                const total = st?.total ?? sub.totalSets ?? 0;
                const avgMarks = st?.avgMarks;
                const avgText = avgMarks == null ? "—" : avgMarks.toFixed(1);
                const locked = Boolean(subjectFreeLocked[sub.key]);

                return (
              <button
                key={sub.key}
                type="button"
                className="home__card"
                onClick={() => {
                  if (locked) return;
                  handleSubjectClick(sub.key);
                }}
                role="listitem"
                style={{
                  opacity: locked ? 0.65 : 1,
                  cursor: locked ? "not-allowed" : "pointer",
                }}
              >
                <div className="home__cardTitle">{sub.title}</div>
                <div className="home__cardMeta">
                  <span className="home__pill">
                    {completed}/{total} {t("home_completed")}
                  </span>
                  <span className="home__pill">
                    {t("home_average_marks")} {avgText}
                  </span>
                  {!paid && !locked && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="home__pill"
                      style={{ background: "#dcfce7", color: "#166534" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/plans");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate("/plans");
                        }
                      }}
                    >
                      {t("home_buy_test_series")}
                    </span>
                  )}
                  {locked && (
                    <span
                      role="button"
                      tabIndex={0}
                      className="home__pill"
                      style={{ background: "#fef3c7", color: "#92400e" }}
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate("/plans");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          e.stopPropagation();
                          navigate("/plans");
                        }
                      }}
                    >
                      {t("home_buy_test_series")}
                    </span>
                  )}
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