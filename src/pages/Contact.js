// src/pages/Contact.js
import React from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/PublicShell";

const SUPPORT_EMAIL = "support@sadhuramedutech.com";

export default function Contact() {
  return (
    <PublicShell title="Contact Us">
      <p className="legal-meta">
        <strong>Sadhuram Edutech</strong> — student support & billing questions
      </p>

      <section className="contact-highlight">
        <h2 style={{ marginTop: 0, fontSize: "1.1rem" }}>Primary email</h2>
        <p style={{ margin: "8px 0 0", fontSize: "1.05rem" }}>
          <a href={`mailto:${SUPPORT_EMAIL}`} className="contact-email-link">
            {SUPPORT_EMAIL}
          </a>
        </p>
        <p className="contact-note">
          For fastest help, email from your registered account address and include
          your payment date, amount, and Razorpay reference (if you paid online).
        </p>
      </section>

      <h2>Response time</h2>
      <p>
        We typically respond within <strong>1–3 business days</strong>. Billing
        and access issues are prioritised when you include transaction details.
      </p>

      <h2>Business location</h2>
      <p>
        India (Haryana region). A full postal address can be shared on request for
        invoices or legal correspondence — email{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.
      </p>

      <h2>Links for customers</h2>
      <ul>
        <li>
          <Link to="/privacy-policy">Privacy Policy</Link>
        </li>
        <li>
          <Link to="/refund-policy">Refund Policy</Link>
        </li>
        <li>
          <Link to="/terms">Terms & Conditions</Link>
        </li>
      </ul>
    </PublicShell>
  );
}
