import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

function Sets() {
  const { id } = useParams();
  const [sets, setSets] = useState(0);

  useEffect(() => {
    const catRef = ref(db, `categories/${id}`);
    onValue(catRef, (snapshot) => {
      const data = snapshot.val();
      if (data) setSets(data.sets);
    });
  }, [id]);

  return (
    <div className="container">
      <h2>{id} - Sets</h2>
      <ul>
        {Array.from({ length: sets }, (_, i) => (
          <li key={i + 1}>
            <Link to={`/quiz/${id}/${i + 1}`}>Set {i + 1}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Sets;
