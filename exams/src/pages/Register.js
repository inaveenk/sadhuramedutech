// src/pages/Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../firebase"; // make sure db is your database instance
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set as firebaseSet } from "firebase/database";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, pin);
      const userId = userCredential.user.uid;

      // Save additional user info in database
      await firebaseSet(ref(db, `users/${userId}`), {
        userName: name,
        userEmail: email,
        mobile,
        userPlan: "free", // default plan
        planStartDate: new Date().toISOString(),
      });

      navigate("/home");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">Register</h2>
      <form onSubmit={handleRegister}>
        <div className="form-row">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>
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
            type="text"
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
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
        <button type="submit">Register</button>
      </form>
      <p className="center" style={{ marginTop: "12px" }}>
        Already have an account? <a href="exams/login">Login</a>
      </p>
    </div>
  );
}
