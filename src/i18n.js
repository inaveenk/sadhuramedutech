import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

const LanguageContext = createContext(null);

const STORAGE_KEY = "se_lang";

const DICT = {
  en: {
    header_home: "Home",
    header_plans: "Plans",
    header_attempted: "Attempted",
    header_profile: "Profile",
    header_leaderboard: "Leaderboard",
    header_logout: "Logout",
    header_login: "Login",
    header_menu: "Menu",
    greet_morning: "Good Morning",
    greet_afternoon: "Good Afternoon",
    greet_evening: "Good Evening",
    welcome: "Welcome",

    auth_no_account: "No account found, please register.",
    auth_invalid_email: "Please enter a valid email address.",
    auth_pin_6: "PIN must be exactly 6 digits.",
    auth_wrong_password: "Incorrect PIN. Please try again.",
    auth_too_many_requests: "Too many attempts. Please try again later.",
    auth_email_in_use: "This email is already registered. Please login.",
    auth_weak_password: "PIN should be 6 digits.",
    auth_generic: "Something went wrong. Please try again.",

    register_title: "Register",
    login_title: "Login",

    lang_confirm_to_hi:
      "Change language to हिन्दी?\n\nChanging language will show हिन्दी tests only.",
    lang_confirm_to_en:
      "Change language to English?\n\nChanging language will show English tests only.",
    home_choose_subject: "Choose Subject",
    home_no_subjects: "No subjects found for this language.",

    common_cancel: "Cancel",
    common_confirm: "Confirm",

    home_leaderboard_snapshot: "Leaderboard Snapshot",
    home_loading_rank: "Loading your rank...",
    home_rank: "Rank",
    home_unranked: "Unranked",
    home_avg_marks: "Avg Marks",
    home_view_full_leaderboard: "View Full Leaderboard",
    home_loading_subjects: "Loading subjects...",
    home_completed: "Completed",
    home_average_marks: "Average Marks",
    home_buy_test_series: "Buy Test Series",

    categories_loading: "Loading categories...",
    categories_none: "No categories found",
    categories_free_trial_done: "Free trial for this subject is complete.",
    categories_buy_to_access: "Buy Test Series to access all categories and sets.",
    categories_your_avg: "Your Average Marks",
    categories_avg: "Average Marks",

    sets_title_suffix: "Sets",
    sets_loading: "Loading sets...",
    sets_none: "No sets available in this category.",
    sets_upgrade_banner:
      "Your free trial for this subject is complete. Buy Test Series to unlock every set and re-attempts.",
    sets_free_help:
      "Free plan: you can try Set 1 in each category until you complete one set for this subject. Then buy Test Series for full access.",
    sets_level: "Level",
    sets_time: "Time",
    sets_minutes: "min",
    sets_questions: "Questions",
    sets_set: "Set",
    sets_attempt_test: "Attempt Test",
    sets_not_attempted: "Not attempted yet",
    sets_view_result: "View Result",
    sets_reattempt: "Re-attempt",
    sets_buy_to_unlock: "Buy Test Series to unlock (free: Set 1 only)",
    sets_buy_to_start: "Buy Test Series to start this set",

    history_loading: "Loading attempted exams...",
    history_none: "No attempted exams found.",
    history_title: "Attempted Exams",
    history_score: "Score",
    history_attempted_on: "Attempted On",

    result_title: "Result",
    result_back_home: "Back to Home",
    result_view_attempt: "View Attempted Exam",

    detail_no_exam: "No exam data found.",
    detail_your_answer: "Your Answer",
    detail_correct_answer: "Correct Answer",
    detail_back_history: "Back to Attempt History",

    leaderboard_title: "Leaderboard",
    leaderboard_loading: "Loading leaderboard...",
    leaderboard_preparing: "Preparing list...",
    leaderboard_no_attempts: "No attempts yet.",
    leaderboard_your_rank: "Your Rank",
    leaderboard_total_users: "Total Ranked Users",
    leaderboard_view_more: "View More",

    header_performance: "Performance",
    perf_title: "Your Performance",
    perf_loading: "Loading your performance...",
    perf_empty: "No performance data yet. Attempt at least one test to see insights.",
    perf_best_subjects: "Strong Subjects",
    perf_weak_subjects: "Weak Subjects",
    perf_breakdown: "Subject Breakdown",
    perf_sets_attempted: "Sets attempted",
    perf_avg_pct: "Avg %",
    perf_avg_marks: "Avg Marks",
    perf_grade: "Grade",
    perf_tip_best: "Keep practicing to maintain your edge.",
    perf_tip_weak: "Focus on these subjects for the biggest improvement.",

    plans_title: "Choose Test Series",
    plans_subtitle:
      "Buy Test Series to unlock all sets, all categories, and re-attempts.",
    plans_loading: "Loading plans…",
    plans_none:
      "No plans found. Add plans under Private/Plans in Firebase.",
    plans_price: "Price",
    plans_discount: "Discount",

    profile_title: "My Profile",
    profile_name: "Name",
    profile_email: "Email",
    profile_mobile: "Mobile",
    profile_plan: "Plan",
    profile_plan_start: "Plan Start Date",
    profile_unlock_line:
      "Buy Test Series to unlock: every set, every category, and re-attempts.",
    profile_upgrade_btn: "Upgrade (Buy Test Series)",
  },
  hi: {
    header_home: "होम",
    header_plans: "प्लान",
    header_attempted: "अटेम्प्टेड",
    header_profile: "प्रोफ़ाइल",
    header_leaderboard: "लीडरबोर्ड",
    header_logout: "लॉगआउट",
    header_login: "लॉगिन",
    header_menu: "मेन्यू",
    greet_morning: "सुप्रभात",
    greet_afternoon: "नमस्कार",
    greet_evening: "शुभ संध्या",
    welcome: "स्वागत है",

    auth_no_account: "कोई अकाउंट नहीं मिला, कृपया रजिस्टर करें।",
    auth_invalid_email: "कृपया सही ईमेल डालें।",
    auth_pin_6: "पिन 6 अंकों का होना चाहिए।",
    auth_wrong_password: "गलत पिन। कृपया दोबारा कोशिश करें।",
    auth_too_many_requests: "बहुत ज़्यादा कोशिशें हो गईं। थोड़ी देर बाद फिर प्रयास करें।",
    auth_email_in_use: "यह ईमेल पहले से रजिस्टर्ड है। कृपया लॉगिन करें।",
    auth_weak_password: "पिन 6 अंकों का रखें।",
    auth_generic: "कुछ गलत हो गया। कृपया फिर कोशिश करें।",

    register_title: "रजिस्टर",
    login_title: "लॉगिन",

    lang_confirm_to_hi:
      "भाषा हिन्दी में बदलें?\n\nभाषा बदलने पर केवल हिन्दी टेस्ट दिखेंगे।",
    lang_confirm_to_en:
      "भाषा English में बदलें?\n\nभाषा बदलने पर केवल English टेस्ट दिखेंगे।",
    home_choose_subject: "विषय चुनें",
    home_no_subjects: "इस भाषा के लिए कोई विषय नहीं मिला।",

    common_cancel: "रद्द करें",
    common_confirm: "पुष्टि करें",

    home_leaderboard_snapshot: "लीडरबोर्ड",
    home_loading_rank: "रैंक लोड हो रहा है...",
    home_rank: "रैंक",
    home_unranked: "रैंक नहीं",
    home_avg_marks: "औसत अंक",
    home_view_full_leaderboard: "पूरा लीडरबोर्ड देखें",
    home_loading_subjects: "विषय लोड हो रहे हैं...",
    home_completed: "पूरा हुआ",
    home_average_marks: "औसत अंक",
    home_buy_test_series: "टेस्ट सीरीज़ खरीदें",

    categories_loading: "श्रेणियाँ लोड हो रही हैं...",
    categories_none: "कोई श्रेणी नहीं मिली",
    categories_free_trial_done: "इस विषय के लिए फ्री ट्रायल पूरा हो गया है।",
    categories_buy_to_access: "सभी श्रेणियाँ और सेट खोलने के लिए टेस्ट सीरीज़ खरीदें।",
    categories_your_avg: "आपके औसत अंक",
    categories_avg: "औसत अंक",

    sets_title_suffix: "सेट",
    sets_loading: "सेट लोड हो रहे हैं...",
    sets_none: "इस श्रेणी में कोई सेट उपलब्ध नहीं है।",
    sets_upgrade_banner:
      "इस विषय के लिए आपका फ्री ट्रायल पूरा हो गया है। सभी सेट और री-अटेम्प्ट के लिए टेस्ट सीरीज़ खरीदें।",
    sets_free_help:
      "फ्री प्लान: आप हर श्रेणी में सेट 1 ट्राय कर सकते हैं। इस विषय में एक सेट पूरा करने के बाद फुल एक्सेस के लिए टेस्ट सीरीज़ खरीदें।",
    sets_level: "स्तर",
    sets_time: "समय",
    sets_minutes: "मिनट",
    sets_questions: "प्रश्न",
    sets_set: "सेट",
    sets_attempt_test: "टेस्ट दें",
    sets_not_attempted: "अभी तक नहीं दिया",
    sets_view_result: "रिज़ल्ट देखें",
    sets_reattempt: "फिर से दें",
    sets_buy_to_unlock: "खोलने के लिए टेस्ट सीरीज़ खरीदें (फ्री: केवल सेट 1)",
    sets_buy_to_start: "यह सेट शुरू करने के लिए टेस्ट सीरीज़ खरीदें",

    history_loading: "अटेम्प्टेड एग्जाम लोड हो रहे हैं...",
    history_none: "कोई अटेम्प्टेड एग्जाम नहीं मिला।",
    history_title: "अटेम्प्टेड एग्जाम",
    history_score: "स्कोर",
    history_attempted_on: "कब दिया",

    result_title: "परिणाम",
    result_back_home: "होम जाएँ",
    result_view_attempt: "अटेम्प्टेड एग्जाम देखें",

    detail_no_exam: "एग्जाम डेटा नहीं मिला।",
    detail_your_answer: "आपका उत्तर",
    detail_correct_answer: "सही उत्तर",
    detail_back_history: "अटेम्प्ट हिस्ट्री पर वापस जाएँ",

    leaderboard_title: "लीडरबोर्ड",
    leaderboard_loading: "लीडरबोर्ड लोड हो रहा है...",
    leaderboard_preparing: "लिस्ट बन रही है...",
    leaderboard_no_attempts: "अभी तक कोई अटेम्प्ट नहीं है।",
    leaderboard_your_rank: "आपकी रैंक",
    leaderboard_total_users: "कुल रैंक्ड यूज़र",
    leaderboard_view_more: "और देखें",

    header_performance: "परफॉर्मेंस",
    perf_title: "आपकी परफॉर्मेंस",
    perf_loading: "परफॉर्मेंस लोड हो रही है...",
    perf_empty: "अभी कोई डेटा नहीं है। कम से कम एक टेस्ट दें ताकि रिपोर्ट दिखे।",
    perf_best_subjects: "मजबूत विषय",
    perf_weak_subjects: "कमज़ोर विषय",
    perf_breakdown: "विषय विवरण",
    perf_sets_attempted: "अटेम्प्ट किए सेट",
    perf_avg_pct: "औसत %",
    perf_avg_marks: "औसत अंक",
    perf_grade: "ग्रेड",
    perf_tip_best: "इसी तरह अभ्यास जारी रखें।",
    perf_tip_weak: "सबसे ज्यादा सुधार के लिए इन विषयों पर ध्यान दें।",

    plans_title: "टेस्ट सीरीज़ चुनें",
    plans_subtitle:
      "सभी सेट, सभी श्रेणियाँ और री-अटेम्प्ट अनलॉक करने के लिए टेस्ट सीरीज़ खरीदें।",
    plans_loading: "प्लान लोड हो रहे हैं…",
    plans_none:
      "कोई प्लान नहीं मिला। Firebase में Private/Plans के अंदर प्लान जोड़ें।",
    plans_price: "कीमत",
    plans_discount: "छूट",

    profile_title: "मेरी प्रोफ़ाइल",
    profile_name: "नाम",
    profile_email: "ईमेल",
    profile_mobile: "मोबाइल",
    profile_plan: "प्लान",
    profile_plan_start: "प्लान शुरू होने की तारीख",
    profile_unlock_line:
      "हर सेट, हर श्रेणी और री-अटेम्प्ट अनलॉक करने के लिए टेस्ट सीरीज़ खरीदें।",
    profile_upgrade_btn: "अपग्रेड (टेस्ट सीरीज़ खरीदें)",
  },
};

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (saved === "hi" || saved === "en") setLang(saved);
    } catch (e) {
      // ignore
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, lang);
    } catch (e) {
      // ignore
    }
  }, [lang]);

  const value = useMemo(() => {
    const t = (key) => DICT[lang]?.[key] ?? DICT.en[key] ?? key;
    const toggle = () => setLang((v) => (v === "en" ? "hi" : "en"));
    return { lang, setLang, toggle, t };
  }, [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    return { lang: "en", setLang: () => {}, toggle: () => {}, t: (k) => DICT.en[k] ?? k };
  }
  return ctx;
}

