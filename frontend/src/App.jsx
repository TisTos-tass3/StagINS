import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stagiaires from './pages/Stagiaires';
import Stages from './pages/Stages';
import StagiaireDetail from './pages/StagiaireDetails';
import Rapports from './pages/Rapports';
import Encadrants from './pages/Encadrants';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Routes>
        {/* Route Login */}
        <Route
          path="/login"
          element={!user ? <Login /> : <Navigate to="/" replace />}
        />

        {/* Routes protégées */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stagiaires"
          element={
            <ProtectedRoute>
              <Layout>
                <Stagiaires />
              </Layout>
            </ProtectedRoute>
          }
        />

        
        <Route
          path="/stagiaires/:stagiaireId"
          element={
            <ProtectedRoute>
              <Layout>
                <StagiaireDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/stages"
          element={
            <ProtectedRoute>
              <Layout>
                <Stages />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/rapports"
          element={
            <ProtectedRoute>
              <Layout>
                <Rapports />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/encadrants"
          element={
            <ProtectedRoute requiredPermission="can_edit">
              <Layout>
                <Encadrants />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Redirection par défaut */}
        <Route 
          path="*" 
          element={<Navigate to={user ? "/" : "/login"} replace />} 
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;