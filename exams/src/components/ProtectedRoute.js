// src/components/ProtectedRoute.js
import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { auth, onAuthStateChanged } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return <div className="container"><p>Checking login…</p></div>;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}
