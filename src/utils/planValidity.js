/**
 * Read subscription duration in whole months from a plan object (Firebase RTDB).
 * Keys are case-sensitive; console typos ("Validity") are normalized.
 */
export function readValidityMonths(plan) {
  if (!plan || typeof plan !== "object") return 0;

  const pick = (...vals) => {
    for (const v of vals) {
      if (v == null || v === "") continue;
      let x = v;
      if (typeof x === "string") x = x.trim();
      const n = Number(x);
      if (!Number.isFinite(n) || n < 0) continue;
      return Math.round(n);
    }
    return null;
  };

  const m = pick(
    plan.validity,
    plan.validityMonths,
    plan.months,
    plan.durationMonths,
    plan.Validity
  );
  return m == null ? 0 : m;
}
