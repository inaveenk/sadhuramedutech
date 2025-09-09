import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";   // 👈 import Link
import { auth, signInWithEmailAndPassword } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, email, pin);
      navigate("/home");
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
        Don't have an account?{" "}
        <Link to="/register">Register</Link>   {/* 👈 use Link here */}
      </p>
    </div>
  );
}
