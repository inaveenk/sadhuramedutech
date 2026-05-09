// src/pages/Login.js
import React, { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { auth, signInWithEmailAndPassword } from "../firebase";
import { db, ref, set } from "../firebase";
import PinInput from "../components/PinInput";
import { useLanguage } from "../i18n";
import { authErrorToKey } from "../utils/authErrors";
import AppLogo from "../components/AppLogo";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pin, setPin] = useState("");
  const [formError, setFormError] = useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();

  const examData = location.state?.examData || null;
  const pendingExamId = location.state?.examId || null;

  const handlePinChange = (next) => {
    const value = String(next || "").replace(/\D/g, "");
    setPin(value.slice(0, 6));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setFormError("");
    const emailTrim = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrim)) {
      setFormError(t("auth_invalid_email"));
      return;
    }
    if (pin.length !== 6) {
      setFormError(t("auth_pin_6"));
      return;
    }
    try {
      const userCred = await signInWithEmailAndPassword(auth, emailTrim, pin);
      const userId = userCred.user.uid;

      if (examData) {
        const examId = pendingExamId || `exam_${Date.now()}`;
        await set(ref(db, `users/${userId}/attemptedExams/${examId}`), examData);

        navigate("/result", { state: { ...examData, examId } });
      } else {
        navigate("/home");
      }
    } catch (err) {
      if (err?.code === "auth/user-not-found") {
        navigate("/register", {
          replace: true,
          state: {
            email: emailTrim,
            message: t("auth_no_account"),
          },
        });
        return;
      }
      setFormError(t(authErrorToKey(err)));
    }
  };

  return (
    <div className="container auth-page">
      <div className="auth-logo-row">
        <AppLogo size={72} />
      </div>
      <h2 className="page-title">{t("login_title")}</h2>
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
      <form onSubmit={handleLogin}>
        <div className="form-row">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
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
            autoFocus={true}
            name="pin"
            autoComplete="current-password"
          />
          <input type="hidden" value={pin} required />
        </div>
        <button type="submit">Login</button>
      </form>
      <p className="center" style={{ marginTop: "12px" }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>

      <div className="auth-legal-mini">
        <Link to="/privacy-policy">Privacy</Link> ·{" "}
        <Link to="/refund-policy">Refunds</Link> ·{" "}
        <Link to="/terms">Terms</Link> · <Link to="/contact">Contact</Link>
      </div>
    </div>
  );
}
