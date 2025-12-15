// src/components/AdBanner.js
import React, { useEffect } from "react";

export default function AdBanner({ slot }) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error", e);
    }
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block" }}
      data-ad-client="ca-pub-4769435723418888"   // replace with your publisher ID
      data-ad-slot={slot}               // replace with your ad slot ID
      data-ad-format="auto"
      data-full-width-responsive="true"
    ></ins>
  );
}
