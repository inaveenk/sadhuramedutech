/**
 * Run from `functions/`: `npm run verify-razorpay`
 * Confirms Razorpay Key ID + Key secret authenticate (without deploying).
 *
 * Reads merged env: functions/.env then functions/.secret.local (local overrides).
 */
const fs = require("fs");
const path = require("path");
const Razorpay = require("razorpay");

function parseEnvFile(fp) {
  const kv = {};
  if (!fs.existsSync(fp)) return kv;
  for (const line of fs.readFileSync(fp, "utf8").split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1).trim();
    }
    kv[t.slice(0, i).trim()] = v;
  }
  return kv;
}

const secretLocal = path.join(__dirname, "..", ".secret.local");
const dotEnv = path.join(__dirname, "..", ".env");
// .secret.local overrides .env for the same key
const merged = {
  ...parseEnvFile(dotEnv),
  ...parseEnvFile(secretLocal),
};

const key_id = (merged.RAZORPAY_KEY_ID || "").trim();
let key_secret = (merged.RAZORPAY_KEY_SECRET || "").trim();
if (key_secret.charCodeAt(0) === 0xfeff) key_secret = key_secret.slice(1).trim();

if (!key_id || !key_secret) {
  console.error(
    "Missing RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET.\n",
    "Add both to functions/.secret.local (see Firebase emulator docs),\n",
    "or temporarily in functions/.env for this script only."
  );
  process.exit(1);
}

const rz = new Razorpay({ key_id, key_secret });
const receipt = "vrfy" + Date.now().toString(36);

rz.orders
  .create({ amount: 100, currency: "INR", receipt })
  .then((o) => {
    console.log("OK — credentials work. Test order id:", o.id);
    process.exit(0);
  })
  .catch((e) => {
    const code = e.statusCode;
    const desc = e.error?.description || e.message;
    console.error("FAIL — Razorpay rejected this key pair:", code, desc);
    console.error(
      "Fix: Razorpay Dashboard → Test mode → API keys → copy matching Key ID + Key secret."
    );
    process.exit(1);
  });
