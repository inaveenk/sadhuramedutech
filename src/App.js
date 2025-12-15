// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";
import Footer from "./components/Footer";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Sets from "./pages/Sets";
import ExamPage from "./pages/ExamPage";
import ResultPage from "./pages/ResultPage";
import AttemptHistory from "./pages/AttemptHistory";
import ExamDetail from "./pages/ExamDetail";
import Profile from "./pages/Profile";

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="container">
        <Routes>
          {/* Auth pages */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* ✅ Public routes */}
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/categories/:subjectKey" element={<Categories />} />
          <Route path="/sets/:categoryName" element={<Sets />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/result" element={<ResultPage />} />

          {/* 🔒 Protected routes */}
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <AttemptHistory />
              </ProtectedRoute>
            }
          />
          <Route
            path="/detail"
            element={
              <ProtectedRoute>
                <ExamDetail />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
