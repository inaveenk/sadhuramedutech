import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { db, ref, onValue } from "../firebase";

export default function Home() {
  const [subjects, setSubjects] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const subjectsRef = ref(db, "categories");

    return onValue(subjectsRef, (snapshot) => {
      const data = snapshot.val() || {};

      // 🔥 KEEP THE KEY (IndianGK, HaryanaGK)
      const list = Object.keys(data).map((key) => ({
        key, // subjectKey
        title: formatSubjectName(key),
      }));

      setSubjects(list);
    });
  }, []);

  const handleSubjectClick = (subjectKey) => {
    // ✅ EXACTLY like Android
    navigate(`/categories/${subjectKey}`);
  };

  return (
    <div style={{ padding: "40px" }}>
      <h1 style={{ textAlign: "center" }}>Choose Subject</h1>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "20px",
          maxWidth: "1000px",
          margin: "30px auto",
        }}
      >
        {subjects.map((sub) => (
          <div
            key={sub.key}
            onClick={() => handleSubjectClick(sub.key)}
            style={{
              background: "#14a3e4",
              color: "white",
              padding: "30px",
              borderRadius: "14px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "18px",
              textAlign: "center",
            }}
          >
            {sub.title}
          </div>
        ))}
      </div>
    </div>
  );
}

function formatSubjectName(key) {
  if (key === "IndianGK") return "Indian GK";
  if (key === "HaryanaGK") return "Haryana GK";
  if (key === "CET2025") return "CET-2025";
  return key.replace(/_/g, " ");
}