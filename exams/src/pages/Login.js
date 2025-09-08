// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const handleLogin = async () => {
    if (!email || !pin) {
      alert("Enter email and PIN");
      return;
    }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pin);
      nav("/home");
    } catch (err) {
      alert("Login failed: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Login</h2>
      <div className="card" style={{ maxWidth: 420 }}>
        <div className="form-row">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label>PIN</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>
        <div className="form-row">
          <button onClick={handleLogin} disabled={loading}>{loading ? "Logging..." : "Login"}</button>
          <button className="secondary" style={{ marginLeft: 8 }} onClick={() => nav("/register")}>Register</button>
        </div>
      </div>
    </div>
  );
}
