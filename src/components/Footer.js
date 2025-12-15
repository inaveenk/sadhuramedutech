// src/components/Footer.js
import React, { useEffect } from "react";

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
    <footer
      style={{
        textAlign: "center",
        padding: "16px",
        background: "#f5f5f5",
        fontSize: "14px",
        color: "#555",
        marginTop: "20px",
        borderTop: "1px solid #ddd",
      }}
    >
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
      <div>
        Copyright © Designed and Developed by{" "}
        <span style={{ fontWeight: 600 }}>Sadhuram Edutech</span> | Content by{" "}
        <span style={{ fontWeight: 600 }}>
          Practice Papers by Sadhuram Edutech
        </span>
      </div>
    </footer>
  );
}