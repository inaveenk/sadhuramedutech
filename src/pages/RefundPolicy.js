// src/pages/RefundPolicy.js
import React from "react";
import { Link } from "react-router-dom";
import PublicShell from "../components/PublicShell";

export default function RefundPolicy() {
  return (
    <PublicShell title="Refund & Cancellation Policy">
      <p className="legal-meta">
        <strong>Last updated:</strong> May 9, 2026 &nbsp;|&nbsp;{" "}
        <strong>Operator:</strong> Sadhuram Edutech
      </p>

      <p>
        This policy applies to purchases of digital test series and related
        educational access made through Sadhuram Edutech when payment is
        processed via Razorpay (or other authorized payment methods we may
        enable).
      </p>

      <h2>1. Nature of the product</h2>
      <p>
        Our offerings are primarily <strong>digital educational services</strong>{" "}
        (including online practice tests and access to content). Access may be
        activated immediately after successful payment confirmation.
      </p>

      <h2>2. Eligibility for refunds</h2>
      <p>We will consider a refund or correction where:</p>
      <ul>
        <li>
          You were <strong>charged multiple times</strong> for the same purchase
          due to a processing error.
        </li>
        <li>
          Payment succeeded but <strong>access was not delivered</strong> due to
          a technical issue on our side (subject to verification).
        </li>
        <li>
          A clear <strong>billing error</strong> occurred (e.g., incorrect
          amount charged vs. advertised price at checkout for the selected plan).
        </li>
      </ul>

      <h2>3. Standard limitations</h2>
      <ul>
        <li>
          Where access has already been substantially used or redeemed, refunds
          may be limited or denied except as required by law.
        </li>
        <li>
          Requests must include your registered email and transaction/order
          identifiers to help Razorpay and our systems verify eligibility.
        </li>
      </ul>

      <h2>4. How to request a refund</h2>
      <p>
        Email us using the contact details on our{" "}
        <Link to="/contact">Contact</Link> page within <strong>7 days</strong> of
        the payment date. Include:
      </p>
      <ul>
        <li>Registered email and mobile (if applicable)</li>
        <li>Date and amount of payment</li>
        <li>Razorpay payment/order references (if available)</li>
        <li>A short description of the issue</li>
      </ul>

      <h2>5. Processing timeline</h2>
      <p>
        Valid refund requests are typically reviewed within{" "}
        <strong>5–7 business days</strong>. If approved, reversal timelines may
        depend on your bank/card issuer/UPI wallet and can take additional time
        as per Razorpay and banking norms.
      </p>

      <h2>6. Cancellations</h2>
      <p>
        Because services are delivered digitally, “cancellation” generally means
        <strong> you stop using</strong> the Service — it does not automatically
        imply a refund unless this policy or applicable law provides otherwise.
      </p>

      <h2>7. Chargebacks</h2>
      <p>
        If you initiate a chargeback/dispute without first contacting us, we may
        be unable to validate your entitlement and account access could be
        affected while the dispute is resolved.
      </p>

      <h2>8. Changes</h2>
      <p>
        We may update this Refund Policy from time to time. Updates will be
        posted on this page with a revised “Last updated” date.
      </p>
    </PublicShell>
  );
}
