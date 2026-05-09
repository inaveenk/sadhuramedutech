// src/pages/Profile.js
import React, { useEffect, useState } from "react";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { isPaidPlan, isPlanExpired } from "../utils/examAccess";
import { useLanguage } from "../i18n";

export default function Profile() {
  const [user, loading] = useAuthState(auth);
  const [userData, setUserData] = useState({});
  const navigate = useNavigate();
  const { t } = useLanguage();

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

  const goToPlans = () => navigate("/plans");

  if (loading) return <div className="center">Loading...</div>;
  if (!user) return null;

  const paid = isPaidPlan(userData.userPlan);
  const expired = paid && isPlanExpired(userData.planEndDate);
  const showUpgrade = !paid || expired;

  const planLabel = paid
    ? expired
      ? `${userData.userPlan} (${t("profile_plan_expired")})`
      : userData.userPlan
    : userData.userPlan || "-";

  return (
    <div
      className="container"
      style={{ padding: "40px 20px", maxWidth: "600px", margin: "0 auto" }}
    >
      <h2 className="page-title" style={{ marginBottom: "20px" }}>
        {t("profile_title")}
      </h2>
      <div
        className="card"
        style={{
          padding: "20px",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        }}
      >
        <p>
          <strong>{t("profile_name")}:</strong> {userData.userName || "-"}
        </p>
        <p>
          <strong>{t("profile_email")}:</strong> {userData.userEmail || "-"}
        </p>
        <p>
          <strong>{t("profile_mobile")}:</strong> {userData.mobile || "-"}
        </p>
        <p>
          <strong>{t("profile_plan")}:</strong>{" "}
          <span
            style={{
              color: expired ? "#991b1b" : "inherit",
              fontWeight: expired ? 800 : "inherit",
            }}
          >
            {planLabel}
          </span>
        </p>
        <p>
          <strong>{t("profile_plan_start")}:</strong>{" "}
          {userData.planStartDate
            ? new Date(userData.planStartDate).toLocaleString()
            : "-"}
        </p>
        <p>
          <strong>{t("profile_plan_end")}:</strong>{" "}
          {userData.planEndDate
            ? new Date(userData.planEndDate).toLocaleString()
            : "-"}
        </p>

        {showUpgrade && (
          <div style={{ marginTop: "20px", paddingTop: "16px", borderTop: "1px solid #e2e8f0" }}>
            <p style={{ margin: "0 0 12px", color: "#475569", fontSize: 14 }}>
              {expired
                ? t("profile_expired_line")
                : t("profile_unlock_line")}
            </p>
            <button
              type="button"
              onClick={goToPlans}
            >
              {expired
                ? t("profile_renew_btn")
                : t("profile_upgrade_btn")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
