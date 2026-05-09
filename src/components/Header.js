// src/components/Header.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db, ref, onValue, signOut } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLanguage } from "../i18n";
import AppLogo from "./AppLogo";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, loading] = useAuthState(auth);
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [pendingLang, setPendingLang] = useState(null); // "hi" | "en" | null
  const { lang, toggle, t } = useLanguage();

  // Fetch userName from Firebase when user is available
  useEffect(() => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      return onValue(userRef, (snap) => {
        if (snap.exists()) {
          setUserName(snap.val().userName || "");
        }
      });
    }
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("greet_morning");
    if (hour < 18) return t("greet_afternoon");
    return t("greet_evening");
  };

  const handleLogout = async () => {
    if (location.pathname === "/exam") {
      alert("You cannot logout during the exam.");
      return;
    }
    try {
      await signOut(auth);
      navigate("/login");
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  if (loading) return null; // wait for auth to load

  const salutationText =
    user && userName ? `${getGreeting()}, ${userName}` : t("welcome");

  return (
    <header className="app-header">
      <div className="header-inner">
        <div className="header-brand">
          <Link to="/home" className="header-logo-link" aria-label="Practice Papers — Home">
            <AppLogo size={42} />
          </Link>
          <Link to="/home" className="header-salutation">
            {salutationText}
          </Link>
        </div>

        <div
          className={`header-actions${user ? " header-actions--with-menu" : ""}`}
        >
          <nav className="nav" aria-label="Primary">
            <Link
              to="/home"
              className={location.pathname === "/home" ? "active" : ""}
            >
              {t("header_home")}
            </Link>
            {user && (
              <>
                <Link
                  to="/history"
                  className={location.pathname === "/history" ? "active" : ""}
                >
                  {t("header_attempted")}
                </Link>
                <Link
                  to="/performance"
                  className={location.pathname === "/performance" ? "active" : ""}
                >
                  {t("header_performance")}
                </Link>
              </>
            )}
            {!user && (
              <Link
                to="/login"
                className={location.pathname === "/login" ? "active" : ""}
              >
                {t("header_login")}
              </Link>
            )}
          </nav>

          {location.pathname === "/home" && (
            <button
              type="button"
              className="header-btn"
              onClick={() => {
                const next = lang === "en" ? "hi" : "en";
                setPendingLang(next);
                setLangModalOpen(true);
              }}
              aria-label="Toggle language"
              title="Toggle language"
              style={{ background: "rgba(2, 6, 23, 0.28)" }}
            >
              {lang === "en" ? "हिन्दी" : "English"}
            </button>
          )}

          {user && (
            <button
              type="button"
              className="menu-btn"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((v) => !v)}
            >
              {menuOpen ? "×" : "≡"}
            </button>
          )}
        </div>
      </div>

      <div
        className={`side-overlay ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <aside
        className={`side-drawer ${menuOpen ? "open" : ""}`}
        aria-label="Menu"
      >
        <div className="side-drawer__header">
          <div className="side-drawer__header-start">
            <Link
              to="/home"
              className="side-drawer__logo"
              onClick={() => setMenuOpen(false)}
              aria-label="Home"
            >
              <AppLogo size={36} />
            </Link>
            <div className="side-drawer__title">{t("header_menu")}</div>
          </div>
          <button
            type="button"
            className="side-drawer__close"
            onClick={() => setMenuOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        <nav className="side-drawer__nav">
          <Link
            to="/home"
            className={location.pathname === "/home" ? "active" : ""}
          >
            {t("header_home")}
          </Link>
          {user && (
            <>
              <Link
                to="/plans"
                className={location.pathname === "/plans" ? "active" : ""}
              >
                {t("header_plans")}
              </Link>
              <Link
                to="/history"
                className={location.pathname === "/history" ? "active" : ""}
              >
                {t("header_attempted")}
              </Link>
              <Link
                to="/profile"
                className={location.pathname === "/profile" ? "active" : ""}
              >
                {t("header_profile")}
              </Link>
              <Link
                to="/leaderboard"
                className={location.pathname === "/leaderboard" ? "active" : ""}
              >
                {t("header_leaderboard")}
              </Link>
              <Link
                to="/performance"
                className={location.pathname === "/performance" ? "active" : ""}
              >
                {t("header_performance")}
              </Link>
              <button type="button" className="drawer-btn" onClick={handleLogout}>
                {t("header_logout")}
              </button>
            </>
          )}
          {!user && (
            <Link
              to="/login"
              className={location.pathname === "/login" ? "active" : ""}
            >
              {t("header_login")}
            </Link>
          )}
        </nav>
      </aside>

      {langModalOpen && (
        <>
          <div
            className="side-overlay open"
            onClick={() => setLangModalOpen(false)}
            aria-hidden="true"
          />
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "grid",
              placeItems: "center",
              zIndex: 60,
              padding: 16,
            }}
            role="dialog"
            aria-modal="true"
          >
            <div
              className="card"
              style={{
                width: "min(520px, 92vw)",
                padding: 16,
                borderRadius: 14,
                border: "1px solid #e7edf3",
                boxShadow: "0 18px 60px rgba(2, 6, 23, 0.25)",
              }}
            >
              <div style={{ fontWeight: 900, fontSize: 16, marginBottom: 8 }}>
                {pendingLang === "hi" ? "Change language?" : "Change language?"}
              </div>
              <div style={{ color: "#334155", whiteSpace: "pre-line" }}>
                {pendingLang === "hi"
                  ? t("lang_confirm_to_hi")
                  : t("lang_confirm_to_en")}
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setLangModalOpen(false)}
                  style={{ flex: 1 }}
                >
                  {t("common_cancel")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLangModalOpen(false);
                    if (!pendingLang) return;
                    // toggle only if we're actually switching
                    if (pendingLang !== lang) toggle();
                  }}
                  style={{ flex: 1 }}
                >
                  {t("common_confirm")}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  );
}
