import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";

function Categories() {
  const [categories, setCategories] = useState({});

  useEffect(() => {
    const categoriesRef = ref(db, "categories");
    onValue(categoriesRef, (snapshot) => {
      setCategories(snapshot.val() || {});
    });
  }, []);

  return (
    <div className="container">
      <h2>Categories</h2>
      <ul>
        {Object.keys(categories).map((key) => (
          <li key={key}>
            <Link to={`/category/${key}`}>{categories[key].title}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Categories;
