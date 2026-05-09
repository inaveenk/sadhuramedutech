// src/pages/TermsAndConditions.js
import React from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/PublicShell";

export default function TermsAndConditions() {
  return (
    <PublicShell title="Terms & Conditions">
      <p className="legal-meta">
        <strong>Last updated:</strong> May 9, 2026 &nbsp;|&nbsp;{" "}
        <strong>Operator:</strong> Sadhuram Edutech
      </p>

      <p>
        These Terms & Conditions (“Terms”) govern your access to and use of the
        website, apps (if any), and online educational/testing services operated
        by Sadhuram Edutech (the “Services”). By registering, logging in, or
        making a payment, you agree to these Terms.
      </p>

      <h2>1. Eligibility & account</h2>
      <ul>
        <li>
          You agree to provide accurate registration information and keep your
          login credentials confidential.
        </li>
        <li>
          You are responsible for activities under your account. Notify us
          promptly at the contact channels listed on our{" "}
          <Link to="/contact">Contact</Link> page if you suspect unauthorized access.
        </li>
      </ul>

      <h2>2. The Services</h2>
      <p>
        We provide educational practice content, assessments, dashboards, and
        related functionality. Features may change over time; we strive to avoid
        disruption but do not guarantee uninterrupted availability.
      </p>

      <h2>3. Paid plans & payments</h2>
      <ul>
        <li>
          Prices are shown in Indian Rupees (INR) unless stated otherwise at
          checkout.
        </li>
        <li>
          Payments are processed by <strong>Razorpay</strong> (or another
          processor we disclose at checkout). You agree to the payment
          provider’s terms and privacy practices for payment processing.
        </li>
        <li>
          Successful payment confirmation activates your entitlement to the
          purchased access as described on the plan page.
        </li>
        <li>
          Taxes, if applicable, are determined at checkout or by law and may be
          collected as required.
        </li>
      </ul>

      <h2>4. Refunds</h2>
      <p>
        Refunds and billing corrections are handled according to our{" "}
        <Link to="/refund-policy">Refund Policy</Link>.
      </p>

      <h2>5. Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Attempt to hack, scrape, overload, or compromise the Services</li>
        <li>
          Reverse engineer restricted systems, circumvent access controls, or
          share paid content in violation of licensing
        </li>
        <li>
          Upload malware, violate others’ rights, or use the Services unlawfully
        </li>
        <li>Use automated tools to misuse tests, leaderboards, or accounts</li>
      </ul>

      <h2>6. Intellectual property</h2>
      <p>
        Questions, explanations, branding, logos, layouts, software, and other
        materials are owned by Sadhuram Edutech or its licensors. You receive a
        limited, non-exclusive license to access content for personal
        educational use consistent with these Terms — not for resale or broad
        redistribution.
      </p>

      <h2>7. Third-party services</h2>
      <p>
        We may integrate third-party hosting, analytics, advertising, messaging,
        and payment services. Those parties process data under their own
        policies where applicable.
      </p>

      <h2>8. Disclaimers</h2>
      <p>
        The Services are provided on an “as is” and “as available” basis to the
        maximum extent permitted by law. We disclaim warranties not expressly
        stated here, including implied warranties where disclaimers are allowed.
        Practice tests are learning tools; outcomes on any real examination are
        not guaranteed.
      </p>

      <h2>9. Limitation of liability</h2>
      <p>
        To the maximum extent permitted by law, Sadhuram Edutech will not be
        liable for indirect, incidental, special, consequential, or punitive
        damages, or loss of profits/data, arising from your use of the Services.
        Our aggregate liability for any claim related to the Services will not
        exceed the amount you paid us for the specific purchase giving rise to
        the claim during the three (3) months preceding the event (unless a
        different minimum applies under mandatory law).
      </p>

      <h2>10. Indemnity</h2>
      <p>
        You agree to indemnify and hold harmless Sadhuram Edutech from claims
        arising out of your misuse of the Services or violation of these Terms,
        where permitted by law.
      </p>

      <h2>11. Suspension & termination</h2>
      <p>
        We may suspend or terminate access for violations, risk, or legal
        requirements. You may stop using the Services anytime; certain
        provisions survive termination (payment obligations incurred, disclaimers,
        limitations, dispute clauses).
      </p>

      <h2>12. Privacy</h2>
      <p>
        Personal data handling is described in our{" "}
        <Link to="/privacy-policy">Privacy Policy</Link>.
      </p>

      <h2>13. Governing law & disputes</h2>
      <p>
        These Terms are governed by the laws of India, without regard to
        conflict-of-law rules. Courts at a competent jurisdiction in India shall
        have exclusive jurisdiction, subject to mandatory consumer protections
        where applicable.
      </p>

      <h2>14. Changes</h2>
      <p>
        We may update these Terms. Material changes may be communicated via the
        Services or email where appropriate. Continued use after posting may
        constitute acceptance where permitted.
      </p>

      <h2>15. Contact</h2>
      <p>
        For questions, see <Link to="/contact">Contact</Link>.
      </p>
    </PublicShell>
  );
}
