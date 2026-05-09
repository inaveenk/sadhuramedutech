import React, { useEffect, useMemo, useState } from "react";
import { auth, db, ref, onValue } from "../firebase";
import { useLanguage } from "../i18n";
import { getSubjectTitle } from "../utils/subjects";

function pct(score, total) {
  const s = Number(score || 0);
  const t = Number(total || 0);
  if (!t) return 0;
  return (s / t) * 100;
}

export default function Performance() {
  const { t, lang } = useLanguage();
  const [categoriesBySubject, setCategoriesBySubject] = useState({});
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) return;

    const unsubCats = onValue(ref(db, "categories"), (snap) => {
      setCategoriesBySubject(snap.val() || {});
    });

    const unsubAttempts = onValue(ref(db, `users/${uid}/attemptedExams`), (snap) => {
      setAttempts(Object.values(snap.val() || {}));
      setLoading(false);
    });

    return () => {
      unsubCats();
      unsubAttempts();
    };
  }, []);

  const subjectStats = useMemo(() => {
    const out = [];
    const subjects = Object.keys(categoriesBySubject || {});

    // Build a subjectKey -> categoryName[] map
    const subjectCategories = {};
    for (const subjectKey of subjects) {
      const catObj = categoriesBySubject?.[subjectKey] || {};
      subjectCategories[subjectKey] = Object.values(catObj)
        .map((c) => c?.name)
        .filter(Boolean);
    }

    for (const subjectKey of subjects) {
      const catNames = new Set(subjectCategories[subjectKey] || []);

      // Best attempt per (category,setNo)
      const best = new Map();
      for (const a of attempts) {
        const c = a?.category;
        const sNo = a?.setNo;
        if (!c || sNo == null) continue;
        if (!catNames.has(c)) continue;

        const total = Number(a?.totalQuestions || 0);
        const score = Number(a?.score || 0);
        const p = pct(score, total);
        const k = `${c}__${sNo}`;
        const prev = best.get(k);
        if (!prev || p > prev.pct) best.set(k, { pct: p, score, total });
      }

      const bestArr = Array.from(best.values());
      const attemptedSets = bestArr.length;
      const avgPct = attemptedSets
        ? bestArr.reduce((sum, x) => sum + x.pct, 0) / attemptedSets
        : 0;
      const avgMarks = attemptedSets
        ? bestArr.reduce((sum, x) => sum + Number(x.score || 0), 0) / attemptedSets
        : 0;

      out.push({
        subjectKey,
        title: getSubjectTitle(subjectKey, lang),
        attemptedSets,
        avgPct,
        avgMarks,
      });
    }

    // show only subjects with any attempts in the performance dashboard
    return out
      .filter((s) => s.attemptedSets > 0)
      .sort((a, b) => b.avgPct - a.avgPct);
  }, [categoriesBySubject, attempts, lang]);

  const bestSubjects = subjectStats.slice(0, 3);
  const weakSubjects = [...subjectStats].sort((a, b) => a.avgPct - b.avgPct).slice(0, 3);

  if (loading) return <div className="center">{t("perf_loading")}</div>;

  return (
    <div className="page-wide" style={{ maxWidth: 980 }}>
      <h2 className="page-title">{t("perf_title")}</h2>

      {subjectStats.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          {t("perf_empty")}
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
              gap: 12,
              marginBottom: 12,
            }}
          >
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                {t("perf_best_subjects")}
              </div>
              {bestSubjects.map((s) => (
                <div
                  key={s.subjectKey}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: "1px solid #eef2f7",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{s.title}</div>
                  <div style={{ fontWeight: 900, color: "#16a34a" }}>
                    {s.avgPct.toFixed(1)}%
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
                {t("perf_tip_best")}
              </div>
            </div>

            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                {t("perf_weak_subjects")}
              </div>
              {weakSubjects.map((s) => (
                <div
                  key={s.subjectKey}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 10,
                    padding: "10px 0",
                    borderBottom: "1px solid #eef2f7",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{s.title}</div>
                  <div style={{ fontWeight: 900, color: "#dc2626" }}>
                    {s.avgPct.toFixed(1)}%
                  </div>
                </div>
              ))}
              <div style={{ marginTop: 10, fontSize: 13, color: "#64748b" }}>
                {t("perf_tip_weak")}
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontWeight: 900, marginBottom: 10 }}>
              {t("perf_breakdown")}
            </div>

            <div style={{ display: "grid", gap: 10 }}>
              {subjectStats.map((s) => (
                <div
                  key={s.subjectKey}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 120px 120px 120px",
                    gap: 10,
                    alignItems: "center",
                    padding: 12,
                    border: "1px solid #eef2f7",
                    borderRadius: 12,
                    background: "#fff",
                  }}
                >
                  <div style={{ fontWeight: 900, color: "#0f172a" }}>
                    {s.title}
                    <div style={{ fontSize: 12, fontWeight: 700, color: "#64748b" }}>
                      {t("perf_sets_attempted")}: {s.attemptedSets}
                    </div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                      {t("perf_avg_pct")}
                    </div>
                    <div style={{ fontWeight: 900 }}>{s.avgPct.toFixed(1)}%</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                      {t("perf_avg_marks")}
                    </div>
                    <div style={{ fontWeight: 900 }}>{s.avgMarks.toFixed(1)}</div>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 800 }}>
                      {t("perf_grade")}
                    </div>
                    <div style={{ fontWeight: 900 }}>
                      {s.avgPct >= 80
                        ? "A"
                        : s.avgPct >= 60
                          ? "B"
                          : s.avgPct >= 40
                            ? "C"
                            : "D"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

