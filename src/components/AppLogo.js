// src/components/AppLogo.js — Practice Papers brand mark (public/logo.png)
import React from "react";

const src = `${process.env.PUBLIC_URL || ""}/logo.png`;

export default function AppLogo({
  className = "",
  size = 44,
  alt = "Practice Papers — Sadhuram Edutech",
  title,
}) {
  return (
    <img
      src={src}
      alt={alt}
      title={title || alt}
      width={size}
      height={size}
      className={className}
      style={{
        display: "block",
        width: size,
        height: size,
        objectFit: "contain",
        flexShrink: 0,
      }}
      decoding="async"
      loading="lazy"
    />
  );
}
