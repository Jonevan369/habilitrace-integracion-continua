import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { CommunitiesPage } from './pages/CommunitiesPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { ExplorePage } from './pages/ExplorePage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { ProfilePage } from './pages/ProfilePage.jsx';
import { RegisterPage } from './pages/RegisterPage.jsx';
import { SupportPage } from './pages/SupportPage.jsx';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile/:userId" element={<ProfilePage />} />
          <Route path="/explore" element={<ExplorePage />} />
          <Route path="/communities" element={<CommunitiesPage />} />
          <Route path="/support" element={<SupportPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
