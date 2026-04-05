import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext.jsx";
import { usePermissions } from "./hooks/usePermissions.js";
import Sidebar from "./components/Sidebar.jsx";
import Topbar from "./components/Topbar.jsx";
import Toast from "./components/Toast.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import InventoryPage from "./pages/InventoryPage.jsx";
import AddProductPage from "./pages/AddProductPage.jsx";
import POS from "./pages/POS.jsx";
import SalesHistory from "./pages/SalesHistory.jsx";
import KardexPage from "./pages/KardexPage.jsx";
import ProvidersPage from "./pages/ProvidersPage.jsx";
import PurchasesPage from "./pages/PurchasesPage.jsx";
import ClientsPage from "./pages/ClientsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import VendedorDashboard from "./pages/VendedorDashboard.jsx";
import UsersPage from "./pages/UsersPage.jsx";
import ExportPage from "./pages/ExportPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import WarrantyPage from "./pages/WarrantyPage.jsx";
import QuotesPage from "./pages/QuotesPage.jsx";
import SeparadosPage from "./pages/SeparadosPage.jsx";
import IntegrationsPage from "./pages/IntegrationsPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import "./styles.css";

function Guard({ perm, children }) {
  const { currentUser } = useApp();
  const { can, isAdmin } = usePermissions(currentUser);
  if (isAdmin || !perm || can(perm)) return children;
  return (
    <div className="denied">
      <span style={{ fontSize:"2.5rem" }}>🔒</span>
      <h3>Acceso restringido</h3>
      <p>Tu rol <strong>{currentUser?.rol}</strong> no tiene permiso para ver esta sección.</p>
    </div>
  );
}

function ProtectedLayout() {
  const { currentUser } = useApp();
  const [sbOpen, setSbOpen] = useState(false);
  if (!currentUser) return <Navigate to="/login" replace />;

  return (
    <div style={{ display:"flex", minHeight:"100vh" }}>
      <Sidebar open={sbOpen} onClose={()=>setSbOpen(false)} />
      <div className="main" style={{ marginLeft:"var(--sidebar)" }}>
        <Topbar onMenuClick={()=>setSbOpen(o=>!o)} />
        <div className="page">
          <Routes>
            <Route path="/"                      element={<Dashboard />} />
            <Route path="/pos"                   element={<Guard perm="pos"><POS /></Guard>} />
            <Route path="/ventas"                element={<Guard perm="ventas"><SalesHistory /></Guard>} />
            <Route path="/garantias"             element={<Guard perm="garantias"><WarrantyPage /></Guard>} />
            <Route path="/cotizaciones"          element={<Guard perm="cotizaciones"><QuotesPage /></Guard>} />
            <Route path="/separados"             element={<Guard perm="pos"><SeparadosPage /></Guard>} />
            <Route path="/productos/registrar"   element={<Guard perm="productos.editar"><AddProductPage /></Guard>} />
            <Route path="/productos/lista"       element={<InventoryPage mode="all" />} />
            <Route path="/productos/stock-bajo"  element={<InventoryPage mode="low" />} />
            <Route path="/kardex/:pid/:vid"      element={<KardexPage />} />
            <Route path="/proveedores"           element={<Guard perm="proveedores"><ProvidersPage /></Guard>} />
            <Route path="/compras"               element={<Guard perm="compras"><PurchasesPage /></Guard>} />
            <Route path="/clientes"              element={<Guard perm="clientes"><ClientsPage /></Guard>} />
            <Route path="/reportes"              element={<Guard perm="reportes"><ReportsPage /></Guard>} />
            <Route path="/dashboard-vendedor"    element={<Guard perm="reportes"><VendedorDashboard /></Guard>} />
            <Route path="/usuarios"              element={<Guard perm="usuarios"><UsersPage /></Guard>} />
            <Route path="/exportar"              element={<Guard perm="exportar"><ExportPage /></Guard>} />
            <Route path="/configuracion"         element={<Guard perm="usuarios"><SettingsPage /></Guard>} />
            <Route path="/integraciones"         element={<Guard perm="usuarios"><IntegrationsPage /></Guard>} />
            <Route path="*"                      element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <Toast />
    </div>
  );
}

function AppRoutes() {
  const { currentUser } = useApp();
  return (
    <Routes>
      <Route path="/login" element={currentUser ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*"     element={<ProtectedLayout />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppRoutes />
    </AppProvider>
  );
}
