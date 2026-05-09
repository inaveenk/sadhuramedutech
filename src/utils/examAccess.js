// src/utils/examAccess.js
import { get, ref } from "../firebase";

/** Difficulty bands for set numbers (handles missing or fewer than 20 sets). */
export function getSetDifficultyLabel(setNo) {
  const n = Number(setNo);
  if (!Number.isFinite(n) || n < 1) {
    return { label: "", hint: "" };
  }
  if (n <= 5) return { label: "Easy", hint: "" };
  if (n <= 15) return { label: "Medium", hint: "" };
  return { label: "Hard", hint: "" };
}

export function isPaidPlan(userPlan) {
  const p = String(userPlan || "free").toLowerCase();
  return (
    p === "paid" ||
    p === "premium" ||
    p === "pro" ||
    p === "testseries" ||
    p === "test_series"
  );
}

/** True if any attempt belongs to one of the subject's categories. */
export function subjectHasAttempt(categoryNames, attempts) {
  const allowed = new Set(
    (categoryNames || []).filter(Boolean).map(String)
  );
  if (allowed.size === 0) return false;
  return (attempts || []).some(
    (a) => a?.category && allowed.has(String(a.category))
  );
}

export async function findSubjectKeyForCategory(db, categoryName) {
  if (!categoryName) return null;
  const snap = await get(ref(db, "categories"));
  const data = snap.val() || {};
  for (const [subjectKey, cats] of Object.entries(data)) {
    for (const c of Object.values(cats || {})) {
      if (c?.name === categoryName) return subjectKey;
    }
  }
  return null;
}

export function categoryNamesForSubject(subjectCategoriesVal) {
  const cats = subjectCategoriesVal || {};
  return Object.values(cats)
    .map((c) => c?.name)
    .filter(Boolean);
}
