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

  if (loading) return null; // wait for auth to load

  return (
    <header
      className="app-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "10px 20px",
        background: "#14a3e4",
        color: "white",
      }}
    >
      {/* Logo / Home */}
      <div style={{ fontWeight: "700", fontSize: 18 }}>
        <Link to="/home" style={{ color: "white", textDecoration: "none" }}>
          Practice Papers
        </Link>
      </div>

      {/* Greeting */}
      <div style={{ fontWeight: "500", marginRight: 20 }}>
        {user && userName ? `${getGreeting()}, ${userName}` : ""}
      </div>

      {/* Navigation Links */}
      <div>
        <Link to="/home" style={{ color: "white", marginRight: 12 }}>
          Categories
        </Link>
        <Link to="/history" style={{ color: "white", marginRight: 12 }}>
          Attempted
        </Link>
        <Link to="/profile" style={{ color: "white", marginRight: 12 }}>
          Profile
        </Link>
        <button className="small" onClick={handleLogout} style={{ marginLeft: 8 }}>
          Logout
        </button>
      </div>
    </header>
  );
}
