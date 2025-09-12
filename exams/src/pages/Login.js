// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom"; // 👈 added useLocation
import { auth, signInWithEmailAndPassword } from "../firebase";
import { db, ref, set } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  // Check if we came from ExamPage with exam data
  const examData = location.state?.examData || null;

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pin);
      const userId = userCred.user.uid;

      if (examData) {
        // Save attempted exam now
        const examId = `exam_${Date.now()}`;
        await set(ref(db, `users/${userId}/attemptedExams/${examId}`), examData);

        // Redirect to result with exam data
        navigate("/result", { state: examData });
      } else {
        // Normal login → go home
        navigate("/home");
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">Login</h2>
      <form onSubmit={handleLogin}>
        <div className="form-row">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-row">
          <input
            type="password"
            placeholder="PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
      <p className="center" style={{ marginTop: "12px" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
