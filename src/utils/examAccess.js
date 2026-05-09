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

/**
 * Strip the time component so we compare on date only.
 * Returns a Date pinned to local 00:00 of the given input.
 */
function startOfDay(d) {
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return null;
  x.setHours(0, 0, 0, 0);
  return x;
}

/**
 * A plan is considered expired the moment "today" reaches the planEndDate
 * (i.e. when today >= planEndDate at day granularity).
 */
export function isPlanExpired(planEndDate) {
  if (!planEndDate) return false;
  const end = startOfDay(planEndDate);
  if (!end) return false;
  const today = startOfDay(new Date());
  return today.getTime() >= end.getTime();
}

/**
 * Whole days between today and planEndDate (rounded down).
 * Returns null when no end date is set / parseable.
 *  -  > 0  → still active, expires in N days
 *  -  = 0  → expires today (treat as expired per requirement)
 *  -  < 0  → already expired
 */
export function daysUntilExpiry(planEndDate) {
  if (!planEndDate) return null;
  const end = startOfDay(planEndDate);
  if (!end) return null;
  const today = startOfDay(new Date());
  const ms = end.getTime() - today.getTime();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

/**
 * True if user has a paid plan and it has NOT expired yet.
 * Use this anywhere you previously called isPaidPlan(userData.userPlan).
 */
export function isPlanActive(userPlan, planEndDate) {
  return isPaidPlan(userPlan) && !isPlanExpired(planEndDate);
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
