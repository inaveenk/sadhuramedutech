import React from "react";

export default function Loader({ text = "Loading..." }) {
  return (
    <div style={styles.wrapper}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>{text}</p>
    </div>
  );
}

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "#f9f9f9",
  },
  spinner: {
    width: 40,
    height: 40,
    border: "4px solid #ddd",
    borderTop: "4px solid #14a3e4",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  text: {
    marginTop: 12,
    color: "#555",
  },
};
