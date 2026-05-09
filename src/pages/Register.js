// src/pages/Register.js
import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set as firebaseSet } from "firebase/database";
import PinInput from "../components/PinInput";
import { useLanguage } from "../i18n";
import { authErrorToKey } from "../utils/authErrors";

export default function Register() {
  const location = useLocation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(() => {
    const prefill = location.state?.email;
    return (prefill ? String(prefill) : "").trim().toLowerCase();
  });
  const [mobile, setMobile] = useState("");
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const incomingMessage = location.state?.message || "";
  const { t } = useLanguage();

  // 🔒 Allow only numbers + limit length
  const handleMobileChange = (e) => {
    const value = e.target.value.replace(/\D/g, ""); // remove non-digits
    if (value.length <= 10) {
      setMobile(value);
    }
  };

  const handlePinChange = (next) => {
    const value = String(next || "").replace(/\D/g, "");
    setPin(value.slice(0, 6));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError("");

    const nameTrim = name.trim();
    const emailTrim = email.trim().toLowerCase();

    if (!nameTrim) {
      setFormError("Please enter your name");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setFormError(t("auth_invalid_email"));
      return;
    }

    if (mobile.length !== 10) {
      setFormError("Mobile number must be exactly 10 digits");
      return;
    }

    if (pin.length !== 6) {
      setFormError(t("auth_pin_6"));
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailTrim,
        pin
      );

      const userId = userCredential.user.uid;

      await firebaseSet(ref(db, `users/${userId}`), {
        userName: nameTrim,
        userEmail: emailTrim,
        mobile,
        userPlan: "free",
        planStartDate: new Date().toISOString(),
      });

      navigate("/home");
    } catch (err) {
      if (err?.code === "auth/email-already-in-use") {
        setFormError(t("auth_email_in_use"));
        return;
      }
      setFormError(t(authErrorToKey(err)));
    }
  };

  return (
    <div className="container">
      <h2 className="page-title">{t("register_title")}</h2>
      {incomingMessage ? (
        <div
          className="card"
          style={{
            marginBottom: 12,
            background: "#fff7ed",
            border: "1px solid #fed7aa",
          }}
        >
          <strong>{incomingMessage}</strong>
        </div>
      ) : null}
      {formError ? (
        <div
          className="card"
          style={{
            marginBottom: 12,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#7f1d1d",
          }}
        >
          <strong>{formError}</strong>
        </div>
      ) : null}
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
            type="tel"
            placeholder="Mobile (10 digits)"
            value={mobile}
            onChange={handleMobileChange}
            maxLength={10}
            inputMode="numeric"
            pattern="[0-9]{10}"
            autoComplete="tel"
            required
          />
        </div>

        <div className="form-row">
          <div style={{ marginBottom: 8, fontWeight: 700, color: "#334155" }}>
            PIN (6 digits)
          </div>
          <PinInput
            value={pin}
            onChange={handlePinChange}
            length={6}
            autoFocus={false}
            name="pin"
            autoComplete="new-password"
          />
          <input type="hidden" value={pin} required />
        </div>

        <button type="submit">Register</button>
      </form>

      <p className="center" style={{ marginTop: "12px" }}>
        Already have an account?{" "}
        <button
          type="button"
          className="secondary small"
          onClick={() => navigate("/login")}
          style={{ marginLeft: 8 }}
        >
          Login
        </button>
      </p>
    </div>
  );
}
