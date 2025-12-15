// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      return onValue(userRef, (snap) => {
        if (snap.exists()) {
          setUserData(snap.val());
        }
      });
    } else if (!loading) {
      navigate("/login");
    }
  }, [user, loading, navigate]);

  if (loading) return <div className="center">Loading...</div>;
  if (!user) return null;

  return (
    <div className="container" style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 className="page-title" style={{ marginBottom: "20px" }}>My Profile</h2>
      <div className="card" style={{ padding: "20px", borderRadius: "12px", boxShadow: "0 4px 10px rgba(0,0,0,0.1)" }}>
        <p><strong>Name:</strong> {userData.userName || "-"}</p>
        <p><strong>Email:</strong> {userData.userEmail || "-"}</p>
        <p><strong>Mobile:</strong> {userData.mobile || "-"}</p>
        <p><strong>Plan:</strong> {userData.userPlan || "-"}</p>
        <p><strong>Plan Start Date:</strong> {userData.planStartDate || "-"}</p>
      </div>
    </div>
  );
}
