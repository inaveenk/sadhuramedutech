// src/components/Header.js
import React, { useEffect, useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { auth, db, ref, onValue, signOut } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, loading] = useAuthState(auth);
  const [userName, setUserName] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);

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
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
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
    user && userName ? `${getGreeting()}, ${userName}` : "Welcome";

  return (
    <header className="app-header">
      <div className="header-inner">
        <Link to="/home" className="header-salutation">
          {salutationText}
        </Link>

        <div className="header-actions">
          <nav className="nav" aria-label="Primary">
            <Link
              to="/home"
              className={location.pathname === "/home" ? "active" : ""}
            >
              Home
            </Link>
            {user && (
              <>
                <Link
                  to="/history"
                  className={location.pathname === "/history" ? "active" : ""}
                >
                  Attempted
                </Link>
                <Link
                  to="/profile"
                  className={location.pathname === "/profile" ? "active" : ""}
                >
                  Profile
                </Link>
                <Link
                  to="/leaderboard"
                  className={location.pathname === "/leaderboard" ? "active" : ""}
                >
                  Leaderboard
                </Link>
                <button
                  type="button"
                  className="header-btn"
                  onClick={handleLogout}
                >
                  Logout
                </button>
              </>
            )}
            {!user && (
              <Link
                to="/login"
                className={location.pathname === "/login" ? "active" : ""}
              >
                Login
              </Link>
            )}
          </nav>

          <button
            type="button"
            className="menu-btn"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? "×" : "≡"}
          </button>
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
          <div className="side-drawer__title">Menu</div>
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
            Home
          </Link>
          {user && (
            <>
              <Link
                to="/history"
                className={location.pathname === "/history" ? "active" : ""}
              >
                Attempted
              </Link>
              <Link
                to="/profile"
                className={location.pathname === "/profile" ? "active" : ""}
              >
                Profile
              </Link>
              <Link
                to="/leaderboard"
                className={location.pathname === "/leaderboard" ? "active" : ""}
              >
                Leaderboard
              </Link>
              <button type="button" className="drawer-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
          {!user && (
            <Link
              to="/login"
              className={location.pathname === "/login" ? "active" : ""}
            >
              Login
            </Link>
          )}
        </nav>
      </aside>
    </header>
  );
}
