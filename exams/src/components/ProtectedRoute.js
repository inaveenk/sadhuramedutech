// src/components/ProtectedRoute.js
import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase";

export default function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth);

  if (loading) {
    return <div className="center">Loading...</div>;
  }

  if (!user) {
    // ✅ Only redirect here if no user
    return <Navigate to="/login" replace />;
  }

  return children;
}
