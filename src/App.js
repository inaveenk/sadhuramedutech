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
import Leaderboard from "./pages/Leaderboard";
import Plans from "./pages/Plans";
import Payment from "./pages/Payment";
import Performance from "./pages/Performance";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import TermsAndConditions from "./pages/TermsAndConditions";
import Contact from "./pages/Contact";

function App() {
  return (
    <Routes>

      {/* ================= PUBLIC ROUTES ================= */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/refund-policy" element={<RefundPolicy />} />
      <Route path="/terms" element={<TermsAndConditions />} />
      <Route path="/contact" element={<Contact />} />

      {/* ================= PRIVATE APP ================= */}
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
                  <Route path="/categories/:subjectKey" element={<Categories />} />
                  <Route path="/sets/:categoryName" element={<Sets />} />
                  <Route path="/exam" element={<ExamPage />} />
                  <Route path="/result" element={<ResultPage />} />
                  <Route path="/history" element={<AttemptHistory />} />
                  <Route path="/detail" element={<ExamDetail />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/plans" element={<Plans />} />
                  <Route path="/payment" element={<Payment />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                  <Route path="/performance" element={<Performance />} />
                </Routes>
              </main>

              <Footer />
            </div>
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}

export default App;
