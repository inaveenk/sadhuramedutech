// src/components/PublicShell.js
import React from "react";
import { Link, useLocation } from "react-router-dom";
import AppLogo from "./AppLogo";

const LEGAL_LINKS = [
  { to: "/privacy-policy", label: "Privacy Policy" },
  { to: "/refund-policy", label: "Refund Policy" },
  { to: "/terms", label: "Terms & Conditions" },
  { to: "/contact", label: "Contact" },
];

export default function PublicShell({ title, children }) {
  const location = useLocation();

  return (
    <div className="public-shell">
      <header className="public-shell-header" role="banner">
        <div className="public-shell-header-inner">
          <Link to="/home" className="public-shell-brand">
            <AppLogo size={40} className="public-shell-brand-logo" />
            <span className="public-shell-brand-text">Sadhuram Edutech</span>
          </Link>
          <nav className="public-shell-nav" aria-label="Legal and contact">
            {LEGAL_LINKS.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={location.pathname === to ? "active" : ""}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="public-shell-main">
        <div className="container legal-container">
          {title ? (
            <h1 className="page-title legal-page-title">{title}</h1>
          ) : null}
          <article className="legal-document card">{children}</article>
        </div>
      </main>

      <footer className="public-shell-footer">
        <div className="public-shell-footer-inner">
          <span>© {new Date().getFullYear()} Sadhuram Edutech</span>
          <nav className="public-shell-footer-nav" aria-label="Footer legal">
            {LEGAL_LINKS.map(({ to, label }) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </footer>
    </div>
  );
}
