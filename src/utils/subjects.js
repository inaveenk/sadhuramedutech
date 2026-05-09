export const SUBJECT_TITLES = {
  IndianGK: { en: "Indian GK", hi: "भारतीय सामान्य ज्ञान" },
  HaryanaGK: { en: "Haryana GK", hi: "हरियाणा सामान्य ज्ञान" },
  CET2025: { en: "CET-2025", hi: "CET-2025" },
};

export function getSubjectTitle(subjectKey, lang = "en") {
  const key = String(subjectKey || "");
  const mapped = SUBJECT_TITLES[key];
  if (mapped) return mapped[lang] || mapped.en;
  return key.replace(/_/g, " ");
}

