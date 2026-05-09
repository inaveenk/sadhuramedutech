// src/components/Footer.js
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import AppLogo from "./AppLogo";

export default function Footer() {
  useEffect(() => {
    try {
      if (window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        window.adsbygoogle.push({});
      }
    } catch (e) {
      console.error("Adsense error:", e);
    }
  }, []);

  return (
    <footer className="app-footer">
      {/* AdSense block */}
      <div style={{ marginBottom: "12px" }}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client="ca-pub-4769435723418888"   
          data-ad-slot="2256417961"                  
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>

      {/* Footer text */}
      <div className="footer-brand-line">
        <AppLogo size={36} className="footer-logo" />
        <div>
        Copyright © Designed and Developed by{" "}
        <span style={{ fontWeight: 600 }}>Sadhuram Edutech</span> | Content by{" "}
        <span style={{ fontWeight: 600 }}>
          Practice Papers by Sadhuram Edutech
        </span>
        </div>
      </div>

      <nav className="footer-legal-row" aria-label="Legal">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/refund-policy">Refund Policy</Link>
        <span aria-hidden="true">·</span>
        <Link to="/terms">Terms &amp; Conditions</Link>
        <span aria-hidden="true">·</span>
        <Link to="/contact">Contact</Link>
      </nav>
    </footer>
  );
}