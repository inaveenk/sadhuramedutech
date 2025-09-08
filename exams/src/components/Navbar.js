import React from "react";
import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar">
      <Link to="/">Categories</Link>
      <Link to="/login">Login</Link>
      <Link to="/register">Register</Link>
      <Link to="/results">Results</Link>
    </nav>
  );
}

export default Navbar;
