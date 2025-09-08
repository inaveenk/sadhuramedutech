// src/App.js
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import Header from "./components/Header";
import ProtectedRoute from "./components/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Home from "./pages/Home";
import Sets from "./pages/Sets";
import ExamPage from "./pages/ExamPage";
import ResultPage from "./pages/ResultPage";
import AttemptHistory from "./pages/AttemptHistory";
import ExamDetail from "./pages/ExamDetail";

function App() {
  return (
    <div className="app-root">
      <Header />
      <main className="container">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          <Route
            path="/sets/:category"
            element={
              <ProtectedRoute>
                <Sets />
              </ProtectedRoute>
            }
          />

          <Route
            path="/exam"
            element={
              <ProtectedRoute>
                <ExamPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/result"
            element={
              <ProtectedRoute>
                <ResultPage />
              </ProtectedRoute>
            }
          />

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
        </Routes>
      </main>
    </div>
  );
}

export default App;
