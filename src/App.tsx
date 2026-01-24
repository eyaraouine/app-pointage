
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { StoreProvider } from './context/StoreContext';
import Layout from './components/Layout';
import AttendancePage from './pages/AttendancePage';
import HomePage from './pages/HomePage';
import EmployeesPage from './pages/EmployeesPage';
import ZonesPage from './pages/ZonesPage';
import LogsPage from './pages/LogsPage';
import AnalysesPage from './pages/AnalysesPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import SuperAdminDashboard from './pages/SuperAdminDashboard';
import InstanceManagement from './pages/InstanceManagement';
import ProtectedRoute from './components/ProtectedRoute';

import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<AttendancePage />} />
              <Route path="home" element={<HomePage />} />

              {/* Protected Admin Routes */}
              <Route path="admin/employees" element={
                <ProtectedRoute>
                  <EmployeesPage />
                </ProtectedRoute>
              } />
              <Route path="admin/zones" element={
                <ProtectedRoute>
                  <ZonesPage />
                </ProtectedRoute>
              } />
              <Route path="admin/logs" element={
                <ProtectedRoute>
                  <LogsPage />
                </ProtectedRoute>
              } />
              <Route path="admin/analyses" element={
                <ProtectedRoute>
                  <AnalysesPage />
                </ProtectedRoute>
              } />

              {/* Super Admin Routes */}
              <Route path="super-admin/dashboard" element={
                <ProtectedRoute>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="super-admin/instances" element={
                <ProtectedRoute>
                  <InstanceManagement />
                </ProtectedRoute>
              } />

              {/* Auth Routes */}
              <Route path="login" element={<LoginPage />} />
              <Route path="register" element={<RegisterPage />} />
              <Route path="forgot-password" element={<ForgotPasswordPage />} />
              <Route path="reset-password" element={<ResetPasswordPage />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </StoreProvider>
    </LanguageProvider>
  );
}

export default App;
