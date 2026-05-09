const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const admin = require("firebase-admin");
const crypto = require("crypto");
const Razorpay = require("razorpay");

admin.initializeApp();

/** Gen2: Secret Manager only (no functions.config). Local: optional functions/.env */
const razorpayKeyId = defineSecret("RAZORPAY_KEY_ID");
const razorpayKeySecret = defineSecret("RAZORPAY_KEY_SECRET");

const callOpts = {
  region: "us-central1",
  cors: true,
  invoker: "public",
  // Default 60s can lose the race vs cold start + Razorpay; client then errors
  // even after the server finished and wrote payments/.../orders.
  timeoutSeconds: 120,
  secrets: [razorpayKeyId, razorpayKeySecret],
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

function getRazorpayConfig() {
  const key_id = String(
    razorpayKeyId.value() || process.env.RAZORPAY_KEY_ID || ""
  ).trim();
  const key_secret = String(
    razorpayKeySecret.value() || process.env.RAZORPAY_KEY_SECRET || ""
  ).trim();
  return { key_id, key_secret };
}

function getRazorpay() {
  const { key_id, key_secret } = getRazorpayConfig();
  if (!key_id || !key_secret) {
    throw new HttpsError(
      "failed-precondition",
      "Razorpay keys missing. Set secrets RAZORPAY_KEY_ID + RAZORPAY_KEY_SECRET (npx firebase-tools functions:secrets:set) or functions/.env for emulator, then deploy --only functions."
    );
  }
  return new Razorpay({ key_id, key_secret });
}

function unwrapCallableError(e) {
  if (e instanceof HttpsError) return e;
  const msg = (e && e.message) || String(e);
  console.error("createRazorpayOrder unexpected error:", msg, e && e.stack);
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
    console.error("Razorpay orders.create failed:", err);
    const desc =
      err?.error?.description ||
      err?.error?.field ||
      err?.message ||
      (typeof err === "string" ? err : "Razorpay request failed");
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
      `Razorpay: ${desc}`
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
  await admin.database().ref(`users/${uid}`).update({
    userPlan: "testseries",
    planStartDate: new Date().toISOString(),
    planId: plan.id || null,
    planName: plan.testSeriesName || null,
    planPrice: Number(plan.price || 0),
    planDiscountPercentage: Number(plan.discountPercentage || 0),
    planFinalPrice: Number(plan.finalPrice || 0),
    latestRazorpayPaymentId: razorpay_payment_id,
    latestRazorpayOrderId: razorpay_order_id,
    latestInternalOrderId: internalOrderId,
  });

  return { ok: true };
});
