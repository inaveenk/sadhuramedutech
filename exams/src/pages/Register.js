// src/pages/Register.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  auth,
  db,
  ref,
  get,
  child,
  createUserWithEmailAndPassword,
  set,
} from "../firebase";

export default function Register() {
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const nav = useNavigate();

  const validate = () => {
    if (!name || !mobile || !email || !pin) return false;
    if (!/^[0-9]{10}$/.test(mobile)) return false;
    if (pin.length !== 6) return false;
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) {
      alert("Please enter valid details (10-digit mobile, 6-digit PIN).");
      return;
    }
    setLoading(true);

    try {
      // check whether mobile or email already exists (small app, iterate)
      const usersSnap = await get(child(ref(db), "users"));
      let exists = false;
      if (usersSnap.exists()) {
        usersSnap.forEach((s) => {
          const u = s.val();
          if (u.mobile === "+91" + mobile || u.email === email) {
            exists = true;
          }
        });
      }
      if (exists) {
        alert("Mobile or email already registered.");
        setLoading(false);
        return;
      }

      // register auth (email + pin)
      const userCred = await createUserWithEmailAndPassword(auth, email, pin);
      const uid = userCred.user.uid;

      // save profile under users/{uid}
      const userObj = {
        email,
        userName: name,
        mobile: "+91" + mobile,
        userPlan: "active",
        planStartDate: "",
      };
      await set(ref(db, `users/${uid}`), userObj);

      alert("Registration successful");
      nav("/home");
    } catch (err) {
      console.error(err);
      alert("Registration error: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h2>Register</h2>
      <div className="card">
        <div className="form-row">
          <label>Full name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Mobile (10 digits)</label>
          <input value={mobile} onChange={(e) => setMobile(e.target.value)} />
        </div>
        <div className="form-row">
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="form-row">
          <label>6-digit PIN (password)</label>
          <input type="password" value={pin} onChange={(e) => setPin(e.target.value)} />
        </div>

        <div className="form-row">
          <button onClick={handleRegister} disabled={loading}>{loading ? "Saving..." : "Register"}</button>
          <button className="secondary" style={{ marginLeft: 8 }} onClick={() => (window.location.href = "/login")}>Login</button>
        </div>
      </div>
    </div>
  );
}
