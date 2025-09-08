// src/pages/AttemptHistory.js
import React, { useEffect, useState } from "react";
import { ref, onValue } from "../firebase";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";

export default function AttemptHistory() {
  const [attempts, setAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      nav("/login");
      return;
    }
    const aRef = ref(db, `users/${uid}/attempts`);
    onValue(aRef, (snap) => {
      const arr = [];
      if (snap.exists()) {
        snap.forEach((s) => {
          arr.push({ id: s.key, ...s.val() });
        });
        arr.sort((a, b) => new Date(b.date) - new Date(a.date));
      }
      setAttempts(arr);
      setLoading(false);
    });
  }, [nav]);

  if (loading) return <p>Loading attempts…</p>;

  if (!attempts.length) return <div><h3>Attempt History</h3><p>No attempts yet.</p></div>;

  return (
    <div>
      <h3>Attempt History</h3>

      <div className="tile-grid">
        {attempts.map((a) => (
          <div className="tile" key={a.id}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <div>
                <strong>{a.category}</strong><br />
                Set {a.setNo}
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: 20 }}>{a.score} / {a.total}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{new Date(a.date).toLocaleString()}</div>
              </div>
            </div>

            <div style={{ marginTop: 8 }}>
              <button onClick={() => nav("/detail", { state: { category: a.category, setNo: a.setNo } })}>View Details</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
