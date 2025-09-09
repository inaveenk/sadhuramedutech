// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Sets from "./pages/Sets";
import ExamPage from "./pages/ExamPage";
import ResultPage from "./pages/ResultPage";
import AttemptHistory from "./pages/AttemptHistory";
import ExamDetail from "./pages/ExamDetail";

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Routes */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="app-root">
              <Header />
              <main className="container">
                <Routes>
                  <Route path="/" element={<Navigate to="/home" replace />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/sets/:categoryName" element={<Sets />} />
                  <Route path="/exam" element={<ExamPage />} />
                  <Route path="/result" element={<ResultPage />} />
                  <Route path="/history" element={<AttemptHistory />} />
                  <Route path="/detail" element={<ExamDetail />} />
                </Routes>
              </main>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
