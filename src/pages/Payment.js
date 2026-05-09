// src/pages/Payment.js
import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth, functions, httpsCallable } from "../firebase";
import { useLanguage } from "../i18n";
import AppLogo from "../components/AppLogo";

function loadRazorpayScript() {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const existing = document.getElementById("razorpay-checkout-js");
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.id = "razorpay-checkout-js";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [paying, setPaying] = useState(false);
  const [uiError, setUiError] = useState("");
  const { lang } = useLanguage();

  const plan = useMemo(() => location.state?.plan || null, [location.state]);
  const payable = Number(plan?.finalPrice || plan?.price || 0);

  useEffect(() => {
    setUiError("");
  }, [plan?.id, plan?.testSeriesName, payable]);

  const verifyAndActivate = async ({
    internalOrderId,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
  }) => {
    if (!plan) return;
    const user = auth.currentUser;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setPaying(true);
    try {
      const fn = httpsCallable(functions, "verifyRazorpayPayment");
      await fn({
        internalOrderId,
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature,
      });

      alert("Payment verified. Test Series activated.");
      navigate("/home", { replace: true });
    } catch (e) {
      alert(e?.message || "Could not verify payment.");
    } finally {
      setPaying(false);
    }
  };

  const startRazorpayPayment = async () => {
    if (!plan) return;
    setUiError("");
    if (!Number.isFinite(payable) || payable <= 0) {
      setUiError("Invalid payable amount.");
      return;
    }

    const ok = await loadRazorpayScript();
    if (!ok) {
      setUiError("Could not load Razorpay checkout. Please try again.");
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }

    setPaying(true);
    let orderResp;
    try {
      const fn = httpsCallable(functions, "createRazorpayOrder", {
        timeout: 150000,
      });
      const res = await fn({
        amountRupees: payable,
        plan: {
          id: plan.id || null,
          testSeriesName: plan.testSeriesName || null,
          price: Number(plan.price || 0),
          discountPercentage: Number(plan.discountPercentage || 0),
          finalPrice: payable,
        },
        lang,
      });
      orderResp = res.data;
    } catch (e) {
      setPaying(false);
      const code = e?.code || "";
      const serverMsg =
        typeof e?.message === "string" && e.message.length > 0
          ? e.message
          : "";
      const isGenericInternal =
        serverMsg === "INTERNAL" ||
        /^internal$/i.test(serverMsg.trim()) ||
        code === "functions/internal";
      const isTimeout =
        code === "functions/deadline-exceeded" ||
        code === "deadline-exceeded" ||
        /deadline|timeout/i.test(serverMsg);
      const internalHint =
        code === "functions/internal" || isGenericInternal
          ? "If this persists after redeploying functions, check Firebase Functions logs — a bad response payload (e.g. not valid JSON) also shows as internal."
          : null;
      const hint =
        code === "functions/unauthenticated"
          ? "Please sign in again, then retry payment."
          : isTimeout
            ? "Request timed out — your database order may already have a Razorpay id. Check that row’s status (e.g. razorpay_order_created). Try Pay again after a refresh, or check Functions logs."
            : internalHint;
      const detail =
        (!isGenericInternal && serverMsg) ||
        (typeof e?.details === "string" ? e.details : null) ||
        (e?.details && typeof e.details === "object" && e.details?.message) ||
        (typeof e === "string" ? e : null);
      const line =
        [hint, detail, !hint && !detail ? `[${code || "error"}]` : null]
          .filter(Boolean)
          .join(" — ") ||
        "Could not create order. Open the browser console (F12) for details, or check Firebase Functions logs.";
      setUiError(code ? `${line} (${code})` : line);
      console.error("createRazorpayOrder failed:", code, serverMsg, e);
      return;
    }

    const internalOrderId = orderResp?.internalOrderId;
    const razorpayOrderId = orderResp?.razorpayOrderId;
    const razorpayKeyId = orderResp?.keyId;

    if (!internalOrderId || !razorpayOrderId || !razorpayKeyId) {
      setPaying(false);
      setUiError("Invalid order response.");
      return;
    }

    const options = {
      key: razorpayKeyId,
      amount: Math.round(payable * 100), // paise
      currency: "INR",
      name: "Sadhuram Edutech",
      description: plan.testSeriesName || "Test Series",
      order_id: razorpayOrderId,
      prefill: {
        email: user.email || "",
      },
      notes: {
        internalOrderId,
        planId: plan.id || "",
      },
      handler: function (response) {
        verifyAndActivate({
          internalOrderId,
          razorpay_order_id: response?.razorpay_order_id,
          razorpay_payment_id: response?.razorpay_payment_id,
          razorpay_signature: response?.razorpay_signature,
        });
      },
      modal: {
        ondismiss: function () {
          setPaying(false);
        },
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", function (resp) {
      setPaying(false);
      alert(resp?.error?.description || "Payment failed. Please try again.");
    });
    rzp.open();
  };

  if (!plan) {
    return (
      <div className="container" style={{ maxWidth: 560, margin: "0 auto" }}>
        <div className="auth-logo-row" style={{ marginBottom: 8 }}>
          <AppLogo size={56} />
        </div>
        <div className="card" style={{ padding: 16 }}>
          No plan selected. Go back and choose a Test Series.
        </div>
        <button
          type="button"
          style={{ marginTop: 12 }}
          onClick={() => navigate("/plans")}
        >
          Back to Plans
        </button>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="auth-logo-row" style={{ marginBottom: 4 }}>
        <AppLogo size={56} />
      </div>
      <h2 className="page-title" style={{ marginBottom: 8 }}>
        Payment
      </h2>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>
          {plan.testSeriesName}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
          {uiError ? (
            <span style={{ color: "#991b1b", fontWeight: 800 }}>{uiError}</span>
          ) : (
            <span>Ready to pay</span>
          )}
        </div>
        <div style={{ marginTop: 8, color: "#334155" }}>
          <div>Price: ₹{Number(plan.price || 0)}</div>
          {Number(plan.discountPercentage || 0) > 0 && (
            <div>Discount: {Number(plan.discountPercentage || 0)}%</div>
          )}
          <div style={{ marginTop: 6, fontSize: 18, fontWeight: 900 }}>
            Payable: ₹{payable}
          </div>
        </div>

        <button
          type="button"
          style={{ marginTop: 12, width: "100%" }}
          onClick={startRazorpayPayment}
          disabled={paying || !plan || !Number.isFinite(payable) || payable <= 0}
        >
          {paying ? "Opening Razorpay…" : "Pay with Razorpay"}
        </button>

        <p
          style={{
            marginTop: 14,
            fontSize: 12,
            color: "#64748b",
            lineHeight: 1.55,
          }}
        >
          Payments are processed securely by Razorpay. By paying you agree to our{" "}
          <Link to="/terms">Terms &amp; Conditions</Link>,{" "}
          <Link to="/privacy-policy">Privacy Policy</Link>, and{" "}
          <Link to="/refund-policy">Refund Policy</Link>. Support:{" "}
          <Link to="/contact">Contact</Link>.
        </p>

        <button
          type="button"
          style={{ marginTop: 10, width: "100%" }}
          onClick={() => navigate("/plans")}
          disabled={paying}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

