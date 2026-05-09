// src/pages/Payment.js
import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { auth, db, ref, set, push, update } from "../firebase";

export default function Payment() {
  const location = useLocation();
  const navigate = useNavigate();
  const [creatingOrder, setCreatingOrder] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [orderPath, setOrderPath] = useState(null);

  const plan = useMemo(() => location.state?.plan || null, [location.state]);
  const payable = Number(plan?.finalPrice || plan?.price || 0);

  useEffect(() => {
    if (!plan) return;
    const user = auth.currentUser;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    let cancelled = false;

    (async () => {
      // Create one order per visit.
      if (orderId) return;
      setCreatingOrder(true);
      try {
        const nowIso = new Date().toISOString();
        const orderRef = push(ref(db, `payments/${user.uid}/orders`));
        const oid = orderRef.key;
        if (!oid) throw new Error("Could not create order id");

        const orderData = {
          orderId: oid,
          status: "created", // created -> pending -> success/failed
          createdAt: nowIso,
          plan: {
            id: plan.id || null,
            testSeriesName: plan.testSeriesName || null,
            price: Number(plan.price || 0),
            discountPercentage: Number(plan.discountPercentage || 0),
            finalPrice: payable,
          },
        };

        await set(orderRef, orderData);
        if (cancelled) return;

        setOrderId(oid);
        setOrderPath(`payments/${user.uid}/orders/${oid}`);
      } catch (e) {
        alert(e.message || "Could not create payment order.");
      } finally {
        if (!cancelled) setCreatingOrder(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, plan, payable, orderId]);

  const markPaymentSuccess = async () => {
    if (!plan) return;
    const user = auth.currentUser;
    if (!user) {
      navigate("/login", { replace: true });
      return;
    }
    if (!orderId || !orderPath) return;

    const ok = window.confirm(
      "Confirm payment success? (This should be called only after your payment gateway confirms the payment.)"
    );
    if (!ok) return;

    setConfirming(true);
    try {
      // 1) Mark order success
      await update(ref(db, orderPath), {
        status: "success",
        successAt: new Date().toISOString(),
      });

      // 2) Activate plan on the user
      await update(ref(db, `users/${user.uid}`), {
        userPlan: "testseries",
        planStartDate: new Date().toISOString(),
        planId: plan.id || null,
        planName: plan.testSeriesName || null,
        planPrice: Number(plan.price || 0),
        planDiscountPercentage: Number(plan.discountPercentage || 0),
        planFinalPrice: payable,
        latestPaymentOrderId: orderId,
      });

      alert("Payment successful. Test Series activated.");
      navigate("/home", { replace: true });
    } catch (e) {
      alert(e.message || "Could not confirm payment.");
    } finally {
      setConfirming(false);
    }
  };

  if (!plan) {
    return (
      <div className="container">
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
      <h2 className="page-title" style={{ marginBottom: 8 }}>
        Payment
      </h2>

      <div className="card" style={{ padding: 16 }}>
        <div style={{ fontSize: 16, fontWeight: 800 }}>
          {plan.testSeriesName}
        </div>
        <div style={{ marginTop: 8, fontSize: 13, color: "#64748b" }}>
          Order: {orderId || "Creating…"}
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
          onClick={markPaymentSuccess}
          disabled={creatingOrder || confirming || !orderId}
        >
          {creatingOrder
            ? "Creating order…"
            : confirming
              ? "Confirming…"
              : "I have paid (confirm success)"}
        </button>

        <button
          type="button"
          style={{ marginTop: 10, width: "100%" }}
          onClick={() => navigate("/plans")}
          disabled={creatingOrder || confirming}
        >
          Cancel
        </button>
      </div>

      <p style={{ marginTop: 12, color: "#64748b", fontSize: 13 }}>
        This page now creates an order in Firebase at{" "}
        <strong>{orderPath || "payments/<uid>/orders/<orderId>"}</strong> and
        activates the Test Series only after “confirm success”. Replace the
        “confirm success” step with your payment gateway callback/verification.
      </p>
    </div>
  );
}

