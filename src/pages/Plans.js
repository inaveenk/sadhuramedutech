// src/pages/Plans.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db, ref, onValue } from "../firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { useLanguage } from "../i18n";

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

export default function Plans() {
  const navigate = useNavigate();
  const [user, loading] = useAuthState(auth);
  const [plansRaw, setPlansRaw] = useState(null);
  const [fetching, setFetching] = useState(true);
  const { t } = useLanguage();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setFetching(true);

    // Your Firebase structure:
    // Private -> Plans -> plan_basic / plan_pro ...
    const unsub = onValue(ref(db, "Private/Plans"), (snap) => {
      setPlansRaw(snap.val() || null);
      setFetching(false);
    });

    return () => {
      unsub();
    };
  }, [user, loading, navigate]);

  const plans = useMemo(() => normalizePlansValue(plansRaw), [plansRaw]);

  return (
    <div className="container" style={{ maxWidth: 760, margin: "0 auto" }}>
      <h2 className="page-title" style={{ marginBottom: 8 }}>
        {t("plans_title")}
      </h2>
      <p style={{ marginTop: 0, color: "#475569" }}>
        {t("plans_subtitle")}
      </p>

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

            return (
              <div
                key={p.id}
                className="card"
                style={{
                  padding: 16,
                  borderRadius: 12,
                  boxShadow: "0 4px 10px rgba(0,0,0,0.06)",
                }}
              >
                <div style={{ fontSize: 16, fontWeight: 800 }}>{name}</div>
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
                </div>

                <button
                  type="button"
                  style={{ marginTop: 12, width: "100%" }}
                  onClick={() =>
                    navigate("/payment", {
                      state: {
                        plan: {
                          id: p.id,
                          testSeriesName: name,
                          price,
                          discountPercentage,
                          finalPrice,
                        },
                      },
                    })
                  }
                >
                  {t("home_buy_test_series")}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

