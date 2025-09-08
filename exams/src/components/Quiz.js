import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";

function Quiz() {
  const { categoryId, setNo } = useParams();
  const [questions, setQuestions] = useState([]);

  useEffect(() => {
    const qRef = ref(db, `SETS/${categoryId}/questions`);
    onValue(qRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const filtered = Object.values(data).filter(
          (q) => q.setNo === parseInt(setNo)
        );
        setQuestions(filtered);
      }
    });
  }, [categoryId, setNo]);

  return (
    <div className="container">
      <h2>{categoryId} - Set {setNo}</h2>
      {questions.map((q, i) => (
        <div key={i} className="question">
          <p>{q.question}</p>
          <ul>
            <li>{q.optionA}</li>
            <li>{q.optionB}</li>
            <li>{q.optionC}</li>
            <li>{q.optionD}</li>
          </ul>
        </div>
      ))}
    </div>
  );
}

export default Quiz;
