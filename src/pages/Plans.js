// src/pages/Plans.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLanguage } from "../i18n";
import {
  isPaidPlan,
  isPlanActive,
  isPlanExpired,
} from "../utils/examAccess";
import { readValidityMonths } from "../utils/planValidity";

function normalizePlansValue(value) {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value
      .map((p, idx) => ({ id: p?.id || String(idx), ...p }))
      .filter(Boolean);
  }
  if (typeof value === "object") {
    return Object.entries(value).map(([id, p]) => ({ id, ...(p || {}) }));
  }
  return [];
}

function priceAfterDiscount(price, discountPercentage) {
  const p = Number(price || 0);
  const d = Number(discountPercentage || 0);
  if (!Number.isFinite(p)) return 0;
  if (!Number.isFinite(d) || d <= 0) return p;
  return Math.max(0, Math.round(p - (p * d) / 100));
}

function planMatchesUserCard(p, userData) {
  const pid = userData?.planId != null ? String(userData.planId) : "";
  if (pid && String(p.id) === pid) return true;
  const storedName = String(userData?.planName || "").trim();
  const cardName = String(
    p.testSeriesName || p.name || p.title || ""
  ).trim();
  if (!pid && storedName && cardName && storedName === cardName) return true;
  return false;
}

export default function Plans() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [plansRaw, setPlansRaw] = useState(null);
  const [fetching, setFetching] = useState(true);
  const [userData, setUserData] = useState({});
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setFetching(true);

    const unsub = onValue(ref(db, "Private/Plans"), (snap) => {
      setPlansRaw(snap.val() || null);
      setFetching(false);
    });

    return () => {
      unsub();
    };
  }, [user, loading, navigate]);

  useEffect(() => {
    if (!user?.uid) {
      setUserData({});
      return;
    }
    return onValue(ref(db, `users/${user.uid}`), (snap) => {
      setUserData(snap.val() || {});
    });
  }, [user]);

  const plans = useMemo(() => normalizePlansValue(plansRaw), [plansRaw]);

  const hasPurchasedPlan = isPaidPlan(userData.userPlan);
  const subscriptionActive = isPlanActive(
    userData.userPlan,
    userData.planEndDate
  );
  const subscriptionExpired =
    hasPurchasedPlan && isPlanExpired(userData.planEndDate);

  return (
    <div className="container" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 className="page-title" style={{ marginBottom: 8 }}>
        {t("plans_title")}
      </h2>
      <p style={{ marginTop: 0, color: "#475569" }}>
        {t("plans_subtitle")}
      </p>

      {hasPurchasedPlan && (
        <div
          className="card"
          style={{
            marginTop: 16,
            marginBottom: 16,
            padding: 16,
            borderRadius: 12,
            border: "1px solid #bfdbfe",
            background: "linear-gradient(135deg, #eff6ff 0%, #f8fafc 100%)",
          }}
        >
          <div style={{ fontWeight: 900, fontSize: 16, color: "#0f172a" }}>
            {t("plans_existing_title")}
          </div>
          <p style={{ margin: "10px 0 0", color: "#334155", fontSize: 14, lineHeight: 1.5 }}>
            <strong>{userData.planName || userData.userPlan || "—"}</strong>
            {userData.planEndDate ? (
              <>
                {" "}
                · {new Date(userData.planEndDate).toLocaleDateString()} (
                {subscriptionExpired
                  ? t("plans_status_expired")
                  : t("plans_status_active")}
                )
              </>
            ) : (
              <>
                {" "}
                · (
                {subscriptionActive
                  ? t("plans_status_active")
                  : t("plans_status_expired")}
                )
              </>
            )}
          </p>
          <p style={{ margin: "10px 0 0", color: "#475569", fontSize: 13 }}>
            {t("plans_existing_upgrade_hint")}
          </p>
        </div>
      )}

      {fetching ? (
        <div className="center">{t("plans_loading")}</div>
      ) : plans.length === 0 ? (
        <div className="card" style={{ padding: 16 }}>
          {t("plans_none")}
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: 12,
          }}
        >
          {plans.map((p) => {
            const name =
              p.testSeriesName || p.name || p.title || "Test Series";
            const price = Number(p.price || 0);
            const discountPercentage = Number(p.discountPercentage || 0);
            const finalPrice = priceAfterDiscount(price, discountPercentage);
            const validity = readValidityMonths(p);

            const isThisPlan = planMatchesUserCard(p, userData);
            const isCurrentActive = isThisPlan && subscriptionActive;
            const isCurrentExpired = isThisPlan && subscriptionExpired;

            let primaryLabel = t("home_buy_test_series");
            let disableBuy = false;
            if (isCurrentActive) {
              primaryLabel = t("plans_card_current");
              disableBuy = true;
            } else if (hasPurchasedPlan && subscriptionActive && !isThisPlan) {
              primaryLabel = t("plans_card_upgrade");
            } else if (isCurrentExpired || (hasPurchasedPlan && subscriptionExpired)) {
              primaryLabel = t("plans_card_renew");
            }

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 16,
                  borderRadius: 12,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                  outline: isCurrentActive ? "2px solid #2563eb" : undefined,
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800 }}>{name}</div>
                {isCurrentActive && (
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "#1d4ed8",
                    }}
                  >
                    {t("plans_card_current")}
                  </div>
                )}
                <div style={{ marginTop: 8, color: "#334155" }}>
                  {discountPercentage > 0 ? (
                    <>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        {t("plans_price")}:{" "}
                        <span style={{ textDecoration: "line-through" }}>
                          ₹{price}
                        </span>
                      </div>
                      <div style={{ fontSize: 13, color: "#475569" }}>
                        {t("plans_discount")}: {discountPercentage}%
                      </div>
                      <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900 }}>
                        ₹{finalPrice}
                      </div>
                    </>
                  ) : (
                    <div style={{ marginTop: 4, fontSize: 18, fontWeight: 900 }}>
                      ₹{price}
                    </div>
                  )}
                  {validity > 0 && (
                    <div style={{ marginTop: 6, fontSize: 13, color: "#475569" }}>
                      {t("plans_validity")}: {validity}{" "}
                      {validity === 1 ? t("plans_month") : t("plans_months")}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  style={{ marginTop: 12, width: "100%" }}
                  disabled={disableBuy}
                  onClick={() => {
                    if (disableBuy) return;
                    navigate("/payment", {
                      state: {
                        plan: {
                          id: p.id,
                          testSeriesName: name,
                          price,
                          discountPercentage,
                          finalPrice,
                          validity,
                        },
                      },
                    });
                  }}
                >
                  {primaryLabel}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
