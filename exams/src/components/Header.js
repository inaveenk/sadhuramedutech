// src/components/Header.js
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, signOut } from "../firebase";

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/login"); // OK: only called on click
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <header className="app-header">
      <div style={{ fontWeight: "700", fontSize: 18 }}>
        <Link to="/home" style={{ color: "white", textDecoration: "none" }}>
          Practice Papers
        </Link>
      </div>
      <div>
        <Link to="/categories" style={{ color: "white", marginRight: 12 }}>
          Categories
        </Link>
        <Link to="/history" style={{ color: "white", marginRight: 12 }}>
          Attempted
        </Link>
        <button className="small" onClick={handleLogout} style={{ marginLeft: 8 }}>
          Logout
        </button>
      </div>
    </header>
  );
}
