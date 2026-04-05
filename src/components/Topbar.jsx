import { useLocation } from "react-router-dom";
import { useApp } from "../context/AppContext.jsx";
import Icon from "./Icons.jsx";
import { isSupabaseConfigured } from "../utils/storage.js";

const TITLES = {
  "/":                     ["Panel de Control",    "Resumen general del negocio"],
  "/pos":                  ["Registro de Ventas",  "Ingreso y cobro de ventas"],
  "/ventas":               ["Historial de Ventas", "Búsqueda y reimpresión de facturas"],
  "/productos/registrar":  ["Registrar Producto",  "Agregar nuevo producto al catálogo"],
  "/productos/lista":      ["Lista de Productos",  "Catálogo completo de inventario"],
  "/productos/stock-bajo": ["Stock Bajo",          "Productos con bajo nivel de inventario"],
  "/proveedores":          ["Proveedores",         "Gestión de proveedores"],
  "/compras":              ["Compras",             "Órdenes de compra y entradas"],
  "/clientes":             ["Clientes",            "Base de datos de clientes"],
  "/cotizaciones":         ["Cotizaciones",        "Presupuestos y propuestas comerciales"],
  "/separados":            ["Separados",           "Productos apartados por clientes con abono"],
  "/garantias":            ["Garantías",           "Gestión de garantías y devoluciones"],
  "/reportes":             ["Reportes",            "Análisis de ventas e inventario"],
  "/dashboard-vendedor":   ["Dashboard Vendedor",  "Rendimiento por vendedor"],
  "/usuarios":             ["Usuarios",            "Gestión de usuarios y roles"],
  "/exportar":             ["Exportar / Respaldo", "Exportación de datos y backups"],
  "/integraciones":        ["Integraciones",       "Conexiones con servicios externos"],
  "/configuracion":        ["Configuración",       "Datos de la empresa y preferencias"],
};

export default function Topbar({ onMenuClick }) {
  const loc = useLocation();
  const { currentUser, darkMode, setDarkMode } = useApp();
  const supaOk = isSupabaseConfigured();

  const pathKey = Object.keys(TITLES).find(k =>
    loc.pathname === k || (k !== "/" && loc.pathname.startsWith(k))
  ) || "/";
  const [title, sub] = TITLES[pathKey] || ["Mundo Muebles", ""];
  const initials = (currentUser?.nombre || "AD").split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="topbar">
      {/* Left */}
      <div className="tb-left">
        <button className="menu-btn" onClick={onMenuClick} aria-label="Menú">
          <Icon n="menu" s={18} />
        </button>
        <div>
          <div className="tb-title">{title}</div>
          {sub && <div className="tb-sub">{sub}</div>}
        </div>
      </div>

      {/* Right */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>

        {/* Supabase status pill */}
        <div
          title={supaOk ? "Sincronizado con Supabase" : "Datos locales — sin nube"}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 11px", borderRadius: 999,
            background: supaOk ? "var(--ok-bg)" : "var(--s-low)",
            cursor: "default",
          }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%",
            background: supaOk ? "var(--ok)" : "#94a3b8",
            display: "inline-block", flexShrink: 0,
          }} />
          <span style={{
            fontSize: 10, fontWeight: 700,
            color: supaOk ? "var(--ok-t)" : "#6b7280",
            fontFamily: "'Inter', sans-serif",
            textTransform: "uppercase", letterSpacing: ".06em",
          }}>
            {supaOk ? "Nube" : "Local"}
          </span>
        </div>

        {/* Dark mode toggle */}
        {setDarkMode && (
          <button
            onClick={() => setDarkMode(d => !d)}
            title={darkMode ? "Modo claro" : "Modo oscuro"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              width: 34, height: 34, borderRadius: 999,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "var(--out)", transition: "all .15s",
            }}
            onMouseOver={e => { e.currentTarget.style.background = "var(--s-low)"; e.currentTarget.style.color = "var(--on-s)"; }}
            onMouseOut={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "var(--out)"; }}>
            <Icon n={darkMode ? "sun" : "moon"} s={16} />
          </button>
        )}

        {/* Separator */}
        <div style={{ width: 1, height: 26, background: "rgba(203,213,225,.5)", margin: "0 4px" }} />

        {/* User block */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ textAlign: "right" }}>
            <div style={{
              fontFamily: "'Inter', sans-serif", fontWeight: 700,
              fontSize: ".775rem", color: "var(--on-s)", lineHeight: 1.25,
            }}>
              {currentUser?.nombre}
            </div>
            <div style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: "10px", color: "var(--out)", letterSpacing: ".02em",
            }}>
              Popayán · Cauca
            </div>
          </div>

          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: "50%",
            background: "var(--grad)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: ".72rem",
            color: "#fff",
            boxShadow: "0 2px 8px rgba(0,63,177,.25)",
            flexShrink: 0, letterSpacing: ".04em",
          }}>
            {initials}
          </div>
        </div>
      </div>
    </div>
  );
}
