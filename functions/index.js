const { onCall, HttpsError } = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const crypto = require("crypto");
const Razorpay = require("razorpay");

admin.initializeApp();

/** Same rules as src/utils/planValidity.js — keep in sync when changing keys. */
function readValidityMonths(obj) {
  if (!obj || typeof obj !== "object") return 0;
  const candidates = [
    obj.validity,
    obj.validityMonths,
    obj.months,
    obj.durationMonths,
    obj.Validity,
  ];
  for (const raw of candidates) {
    if (raw == null || raw === "") continue;
    const v = typeof raw === "string" ? raw.trim() : raw;
    const n = Number(v);
    if (!Number.isFinite(n) || n < 0) continue;
    return Math.round(n);
  }
  return 0;
}

function hasValidityField(obj) {
  if (!obj || typeof obj !== "object") return false;
  const keys = [
    "validity",
    "validityMonths",
    "months",
    "durationMonths",
    "Validity",
  ];
  return keys.some((k) => obj[k] != null && obj[k] !== "");
}

/**
 * Gen2: never use firebase-functions/v1 `functions.config()` — it throws.
 *
 * Razorpay: **`functions/.env`** (gitignored). Firebase CLI loads it when you deploy
 * and attaches `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` to the Cloud Run service.
 * If you skip Secret Manager entirely, edit `.env` then always:
 * `firebase deploy --only functions`
 *
 * **Before deploy**, run locally: `cd functions && npm run verify-razorpay` — if that
 * says FAIL, Razorpay will reject prod too (wrong key pair or test/live mismatch).
 *
 * Secret Manager variant: optional; GSM does not read `functions/.env` unless you wire `defineSecret`.
 */
const callOpts = {
  region: "us-central1",
  cors: true,
  invoker: "public",
  // Default 60s can lose the race vs cold start + Razorpay; client then errors
  // even after the server finished and wrote payments/.../orders.
  timeoutSeconds: 120,
};

/** Razorpay receipt: max 40 chars; use safe subset to avoid API rejection. */
function razorpayReceiptFromInternalId(internalOrderId) {
  const raw = String(internalOrderId || "").replace(/[^a-zA-Z0-9]/g, "");
  if (raw.length >= 8) return raw.slice(0, 40);
  const h = crypto
    .createHash("sha256")
    .update(String(internalOrderId))
    .digest("hex")
    .slice(0, 40);
  return h;
}

/** Normalize env vars (quotes / stray BOM some editors add to .env). */
function razorpayEnv(name) {
  let v = String(process.env[name] || "").trim();
  if (!v.length) return "";
  const noBom = v.charCodeAt(0) === 0xfeff ? v.slice(1).trim() : v;
  v = noBom;
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

function getRazorpayConfig() {
  return {
    key_id: razorpayEnv("RAZORPAY_KEY_ID"),
    key_secret: razorpayEnv("RAZORPAY_KEY_SECRET"),
  };
}

function getRazorpay() {
  const { key_id, key_secret } = getRazorpayConfig();
  if (!key_id || !key_secret) {
    throw new HttpsError(
      "failed-precondition",
      "Razorpay keys missing. Put RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in functions/.env then firebase deploy --only functions. Test locally first: npm run verify-razorpay"
    );
  }
  return new Razorpay({ key_id, key_secret });
}

function unwrapCallableError(e) {
  if (e instanceof HttpsError) return e;
  const msg = (e && e.message) || String(e);
  console.error("createRazorpayOrder unexpected error:", msg, e && e.stack);
  if (/functions\.config\(\) is no longer available/i.test(msg)) {
    return new HttpsError(
      "failed-precondition",
      "Deployed function is outdated (Gen2 does not support functions.config). Redeploy: firebase deploy --only functions."
    );
  }
  return new HttpsError(
    "failed-precondition",
    msg.length > 220 ? `${msg.slice(0, 220)}…` : msg
  );
}

/**
 * Create an internal order in RTDB + create Razorpay Order.
 * Returns: { internalOrderId, razorpayOrderId, amount, currency, keyId }
 *
 * v2 onCall with cors + public invoker so browser (localhost / prod) is not
 * blocked by IAM; auth is still enforced via request.auth.
 */
exports.createRazorpayOrder = onCall(callOpts, async (request) => {
  try {
    return await createRazorpayOrderImpl(request);
  } catch (e) {
    throw unwrapCallableError(e);
  }
});

async function createRazorpayOrderImpl(request) {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }

  const uid = request.auth.uid;
  const data = request.data || {};
  const amountRupees = Number(data?.amountRupees);
  const plan = data?.plan || {};
  const lang = String(data?.lang || "");

  if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
    throw new HttpsError("invalid-argument", "Invalid amount.");
  }

  const amountPaise = Math.round(amountRupees * 100);
  const currency = "INR";
  // Razorpay commonly enforces a minimum (e.g. ₹1 = 100 paise) for INR orders.
  if (amountPaise < 100) {
    throw new HttpsError(
      "invalid-argument",
      "Amount must be at least ₹1 (100 paise) for Razorpay."
    );
  }

  const internalOrderRef = admin
    .database()
    .ref(`payments/${uid}/orders`)
    .push();

  const internalOrderId = internalOrderRef.key;
  if (!internalOrderId) {
    throw new HttpsError("failed-precondition", "Could not create order id.");
  }

  const now = new Date().toISOString();
  try {
    await internalOrderRef.set({
      internalOrderId,
      uid,
      status: "created",
      createdAt: now,
      amountRupees,
      amountPaise,
      currency,
      lang: lang || null,
      plan: {
        id: plan?.id || null,
        testSeriesName: plan?.testSeriesName || null,
        price: Number(plan?.price || 0),
        discountPercentage: Number(plan?.discountPercentage || 0),
        finalPrice: Number(plan?.finalPrice || amountRupees),
        validity: readValidityMonths(plan || {}),
      },
    });
  } catch (dbErr) {
    console.error("RTDB payments write failed:", dbErr);
    throw new HttpsError(
      "failed-precondition",
      `Could not save order: ${dbErr?.message || "database write failed"}. Check Realtime Database rules allow payments/{uid}/orders.`
    );
  }

  const receipt = razorpayReceiptFromInternalId(internalOrderId);

  const razorpay = getRazorpay();
  let rpOrder;
  try {
    rpOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency,
      receipt,
      notes: {
        uid,
        internalOrderId,
        planId: plan?.id || "",
      },
    });
  } catch (err) {
    const { key_id: kid, key_secret: ksec } = getRazorpayConfig();
    console.error(
      "Razorpay orders.create failed:",
      err,
      "| key_id prefix:",
      kid ? `${kid.slice(0, 10)}…` : "(empty)",
      "secret_len:",
      ksec.length
    );
    const desc =
      err?.error?.description ||
      err?.error?.field ||
      err?.message ||
      (typeof err === "string" ? err : "Razorpay request failed");
    const http = err?.statusCode != null ? ` (HTTP ${err.statusCode})` : "";
    await internalOrderRef
      .update({
        status: "razorpay_create_failed",
        razorpayError: String(desc).slice(0, 500),
        updatedAt: new Date().toISOString(),
      })
      .catch(() => {});
    // Use failed-precondition so the client shows the message (not generic INTERNAL).
    throw new HttpsError(
      "failed-precondition",
      `Razorpay: ${desc}${http}`
    );
  }

  await internalOrderRef.update({
    status: "razorpay_order_created",
    razorpayOrderId: rpOrder.id,
    razorpayOrderStatus: rpOrder.status,
    updatedAt: new Date().toISOString(),
  });

  const { key_id: keyIdOut } = getRazorpayConfig();
  if (!keyIdOut) {
    throw new HttpsError(
      "failed-precondition",
      "Razorpay key id missing in server config after order creation."
    );
  }

  // Callable responses are passed through Firebase encode(); NaN is not encodable and becomes HTTP 500 → client sees functions/internal.
  const rpAmount = Number(rpOrder.amount);
  const safeAmount =
    Number.isFinite(rpAmount) && rpAmount > 0 ? Math.round(rpAmount) : amountPaise;

  return {
    internalOrderId: String(internalOrderId),
    razorpayOrderId: String(rpOrder.id),
    amount: safeAmount,
    currency: String(rpOrder.currency || currency || "INR"),
    keyId: String(keyIdOut),
  };
}

/**
 * Verify signature + activate plan.
 */
exports.verifyRazorpayPayment = onCall(callOpts, async (request) => {
  if (!request.auth?.uid) {
    throw new HttpsError("unauthenticated", "Login required.");
  }
  const uid = request.auth.uid;
  const data = request.data || {};

  const internalOrderId = String(data?.internalOrderId || "");
  const razorpay_order_id = String(data?.razorpay_order_id || "");
  const razorpay_payment_id = String(data?.razorpay_payment_id || "");
  const razorpay_signature = String(data?.razorpay_signature || "");

  if (!internalOrderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new HttpsError("invalid-argument", "Missing payment fields.");
  }

  const orderRef = admin.database().ref(`payments/${uid}/orders/${internalOrderId}`);
  const snap = await orderRef.get();
  const order = snap.val();
  if (!order) {
    throw new HttpsError("not-found", "Order not found.");
  }

  if (order.razorpayOrderId && order.razorpayOrderId !== razorpay_order_id) {
    throw new HttpsError("permission-denied", "Order mismatch.");
  }

  const key_secret = getRazorpayConfig().key_secret;
  const body = `${razorpay_order_id}|${razorpay_payment_id}`;
  const expected = crypto.createHmac("sha256", key_secret).update(body).digest("hex");

  if (expected !== razorpay_signature) {
    await orderRef.update({
      status: "signature_failed",
      verifyFailedAt: new Date().toISOString(),
    });
    throw new HttpsError("permission-denied", "Signature verification failed.");
  }

  await orderRef.update({
    status: "paid",
    paidAt: new Date().toISOString(),
    razorpay_payment_id,
    razorpay_signature,
  });

  const plan = order.plan || {};

  // Re-read validity from Private/Plans so a tampered client payload can't
  // extend duration — but only replace when RTDB explicitly defines validity
  // (alternate keys supported). If absent, keep the value stored with the order.
  let validityMonths = readValidityMonths(plan);
  if (plan.id) {
    try {
      const planSnap = await admin
        .database()
        .ref(`Private/Plans/${plan.id}`)
        .get();
      const serverPlan = planSnap.val();
      if (serverPlan && hasValidityField(serverPlan)) {
        validityMonths = readValidityMonths(serverPlan);
      }
    } catch (e) {
      console.warn("Could not read plan validity from Private/Plans:", e?.message);
    }
  }

  const planStartDate = new Date();
  let planEndDate = null;
  if (Number.isFinite(validityMonths) && validityMonths > 0) {
    const end = new Date(planStartDate.getTime());
    end.setMonth(end.getMonth() + Math.round(validityMonths));
    planEndDate = end.toISOString();
  }

  await admin.database().ref(`users/${uid}`).update({
    userPlan: "testseries",
    planStartDate: planStartDate.toISOString(),
    planEndDate: planEndDate,
    planValidityMonths: Number.isFinite(validityMonths) ? validityMonths : 0,
    planId: plan.id || null,
    planName: plan.testSeriesName || null,
    planPrice: Number(plan.price || 0),
    planDiscountPercentage: Number(plan.discountPercentage || 0),
    planFinalPrice: Number(plan.finalPrice || 0),
    latestRazorpayPaymentId: razorpay_payment_id,
    latestRazorpayOrderId: razorpay_order_id,
    latestInternalOrderId: internalOrderId,
  });

  return { ok: true, planEndDate };
});
