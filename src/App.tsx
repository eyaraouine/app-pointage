import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { StoreProvider, useStore } from './context/StoreContext';
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
import { ShieldAlert, X } from 'lucide-react';

function DiagnosticPanel() {
  const { debugInfo, clearAllData } = useStore();
  const [isOpen, setIsOpen] = useState(false);

  const repairData = async () => {
    if (!debugInfo.activeAdminId) return;
    try {
      alert("🛠️ Début de l'auto-réparation...");
      await clearAllData(true); // Enhanced repair in StoreContext
      alert("✅ Réparation terminée ! L'application va redémarrer.");
      window.location.reload();
    } catch (e: any) {
      alert("❌ Erreur réparation: " + e.message);
    }
  };

  if (!isOpen) return <button onClick={() => setIsOpen(true)} className="bg-white/20 p-1 rounded hover:bg-white/40">🔧</button>;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[10001] flex items-center justify-center p-4 text-left">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="bg-slate-800 text-white p-4 flex justify-between items-center">
          <h3 className="font-bold flex items-center gap-2"><ShieldAlert size={18} /> Diagnostic v2.0.7 (OMNISCIENCE)</h3>
          <button onClick={() => setIsOpen(false)}><X size={20} /></button>
        </div>
        <div className="p-4 space-y-3 text-xs font-mono">
          <div className="bg-gray-100 p-2 rounded">
            <p className="text-gray-500 mb-1 font-sans font-bold uppercase text-[10px]">Cible de Synchronisation</p>
            <p className="text-blue-700 font-bold">ID Actif: {debugInfo.activeAdminId || 'RECHERCHE...'}</p>
          </div>
          {debugInfo.lastFirestoreError && (
            <div className="bg-red-100 p-2 rounded text-red-700 border border-red-200">
              <p className="font-bold uppercase text-[10px] mb-1">🔥 ERREUR FIRESTORE</p>
              <p className="break-words">{debugInfo.lastFirestoreError}</p>
            </div>
          )}
          <div className="bg-orange-50 p-2 rounded text-orange-700 border border-orange-200 text-[10px]">
            ⚠️ Si les employés ne s'affichent pas, utilisez AUTO-RÉPARER.
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <p className="text-gray-500 mb-1 font-sans font-bold uppercase text-[10px]">Détails Session</p>
            <p>Admin: {debugInfo.adminId || 'OFF'}</p>
            <p>Kiosk: {debugInfo.kioskAdminId || 'OFF'}</p>
            <p>Detected: {debugInfo.detectedAdminId || 'OFF'}</p>
          </div>
          <div className="bg-gray-100 p-2 rounded">
            <p className="text-gray-500 mb-1 font-sans font-bold uppercase text-[10px]">Données</p>
            <p>Sites: <span className="text-green-600 font-bold">{debugInfo.zonesCount}</span></p>
            <p>Employés: <span className="text-green-600 font-bold">{debugInfo.employeesCount}</span></p>
          </div>

          <div className="pt-2 border-t grid grid-cols-2 gap-2">
            <button
              onClick={() => { if (confirm("⚠️ Réinitialiser le cache local ?")) clearAllData(); }}
              className="bg-gray-200 text-gray-700 py-3 rounded-xl font-bold text-[10px]"
            >
              NETTOYER CACHE
            </button>
            <button
              onClick={repairData}
              className="bg-blue-600 text-white py-3 rounded-xl font-bold text-[10px] shadow-lg animate-pulse"
            >
              AUTO-RÉPARER (DATA)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  useEffect(() => {
    console.log("🚀 VERSION 2.0.7 - ONLINE (OMNISCIENCE)");
  }, []);

  return (
    <ErrorBoundary>
      <LanguageProvider>
        <StoreProvider>
          <div id="v207-verify-banner" className="bg-yellow-500 text-yellow-900 p-1 text-[9px] text-center font-bold fixed top-0 left-0 right-0 z-[10000] flex justify-center items-center gap-2 font-mono">
            🏆 SYSTEM ONLINE v2.0.7 (OMNISCIENCE RECOVERY)
            <DiagnosticPanel />
          </div>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<AttendancePage />} />
                <Route path="home" element={<HomePage />} />
                <Route path="admin/employees" element={<ProtectedRoute><EmployeesPage /></ProtectedRoute>} />
                <Route path="admin/zones" element={<ProtectedRoute><ZonesPage /></ProtectedRoute>} />
                <Route path="admin/logs" element={<ProtectedRoute><LogsPage /></ProtectedRoute>} />
                <Route path="admin/analyses" element={<ProtectedRoute><AnalysesPage /></ProtectedRoute>} />
                <Route path="super-admin/dashboard" element={<ProtectedRoute><SuperAdminDashboard /></ProtectedRoute>} />
                <Route path="super-admin/instances" element={<ProtectedRoute><InstanceManagement /></ProtectedRoute>} />
                <Route path="login" element={<LoginPage />} />
                <Route path="register" element={<RegisterPage />} />
                <Route path="forgot-password" element={<ForgotPasswordPage />} />
                <Route path="reset-password" element={<ResetPasswordPage />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </StoreProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}

export default App;
