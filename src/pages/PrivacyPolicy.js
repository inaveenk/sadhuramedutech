// src/pages/PrivacyPolicy.js
import React from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/PublicShell";

export default function PrivacyPolicy() {
  return (
    <PublicShell title="Privacy Policy">
      <p className="legal-meta">
        <strong>Last updated:</strong> May 9, 2026 &nbsp;|&nbsp;{" "}
        <strong>Operator:</strong> Sadhuram Edutech (“we”, “us”, “our”)
      </p>

      <p>
        This Privacy Policy explains how Sadhuram Edutech collects, uses, stores,
        and shares information when you use our website, mobile web experience,
        and related educational test-series services (the “Services”).
      </p>

      <h2>1. Information we collect</h2>
      <ul>
        <li>
          <strong>Account information:</strong> email address, display name or
          username, mobile number (if provided), and authentication credentials
          needed to operate your account securely.
        </li>
        <li>
          <strong>Learning activity:</strong> exam attempts, scores, timings,
          and related usage data necessary to deliver practice tests and history
          features.
        </li>
        <li>
          <strong>Technical data:</strong> device/browser type, IP address,
          approximate region, timestamps, diagnostics, and security logs — used
          to protect accounts, detect abuse, and improve reliability.
        </li>
        <li>
          <strong>Payment-related data:</strong> when you purchase a paid test
          series, payments are processed by our payment partner (Razorpay). We
          receive confirmations and metadata required to fulfil your purchase
          (such as transaction status, identifiers, amounts, timestamps). We do
          not store full card numbers on our servers (card data is handled by
          Razorpay pursuant to PCI-DSS compliant practices).
        </li>
      </ul>

      <h2>2. How we use information</h2>
      <ul>
        <li>Provide, operate, and improve the Services</li>
        <li>Authenticate users, prevent fraud, and secure the platform</li>
        <li>Process purchases, generate receipts, and manage entitlements</li>
        <li>Communicate service updates, support responses, and legal notices</li>
        <li>Comply with applicable law and enforce our Terms</li>
      </ul>

      <h2>3. Legal bases (where applicable)</h2>
      <p>
        Depending on your jurisdiction, we rely on performance of a contract,
        legitimate interests (security, analytics, product improvement), and/or
        consent (for optional communications or certain cookies), as applicable.
      </p>

      <h2>4. Sharing of information</h2>
      <p>We may share information with:</p>
      <ul>
        <li>
          <strong>Service providers</strong> that help us operate the Services
          (for example hosted infrastructure, databases, messaging, analytics,
          and payment processing — including Razorpay).
        </li>
        <li>
          <strong>Authorities</strong> if required to comply with legal process,
          protect rights/safety, or investigate fraud/abuse.
        </li>
      </ul>
      <p>We do not sell your personal information.</p>

      <h2>5. Data retention</h2>
      <p>
        We retain information for as long as needed to deliver the Services,
        meet legal/accounting obligations, resolve disputes, and enforce our
        agreements. Testing history may be retained to provide your account’s
        features unless deletion is requested where applicable.
      </p>

      <h2>6. Cookies and similar technologies</h2>
      <p>
        We may use cookies/local storage for session management, preferences,
        security tokens, analytics, or advertising integrations where enabled.
        You can manage cookies via your browser settings, but some features may
        not function without necessary cookies.
      </p>

      <h2>7. Security</h2>
      <p>
        We implement reasonable administrative, technical, and organizational
        measures designed to protect information. No method of transmission or
        storage is 100% secure; we encourage strong passwords and account
        protection.
      </p>

      <h2>8. Children’s privacy</h2>
      <p>
        The Services are not directed to children under 13 (or the minimum age
        required in your region). If you believe a child provided personal data,
        please contact us and we will take appropriate steps.
      </p>

      <h2>9. International transfers</h2>
      <p>
        Our vendors may process data in India and/or other jurisdictions. Where
        required, we use appropriate safeguards consistent with applicable law.
      </p>

      <h2>10. Your choices and rights</h2>
      <p>
        Depending on applicable law, you may have rights to access, correct,
        delete, restrict, object, or port certain personal data. To exercise these
        rights, contact us using the{" "}
        <Link to="/contact">Contact</Link> page. We may verify requests to protect
        your account security.
      </p>

      <h2>11. Changes</h2>
      <p>
        We may update this policy periodically. The “Last updated” date reflects
        the latest revision material to users. Continued use after posting
        constitutes acceptance where permitted by law.
      </p>

      <h2>12. Contact</h2>
      <p>
        Questions about this Privacy Policy: see our{" "}
        <Link to="/contact">Contact</Link> page for official channels.
      </p>
    </PublicShell>
  );
}
